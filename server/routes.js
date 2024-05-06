const mysql = require('mysql')
const config = require('./config.json')

const connection = mysql.createConnection({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: config.rds_db
});
connection.connect((err) => err && console.log(err));

const inspection_score_radius = 0.5

/******************** Internal Functions *******************/
async function calculateInspectionScore(resID) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT AVG(s.inspection_score) AS avg_inspection_score
            FROM restaurant AS r
            JOIN inspection AS i ON r.restaurant_id = i.restaurant_id
            JOIN inspection_score AS s ON i.risk_level = s.risk_level AND i.inspection_result = s.inspection_result
            WHERE r.restaurant_id = ?
            GROUP BY r.restaurant_name
        `;
        connection.query(query, [resID], (err, results) => {
            if (err) {
                reject(err);
            } else if (results.length > 0) {
                resolve(results[0].avg_inspection_score || 0);
            } else {
                resolve(0);
            }
        });
    });
}

async function calculateDangerScore(resID, radius = inspection_score_radius) {
    return new Promise((resolve, reject) => {
        const haversine = `(6371 * acos(cos(radians(restaurant_latitude))
                         * cos(radians(crime_latitude))
                         * cos(radians(crime_longitude) - radians(restaurant_longitude))
                         + sin(radians(restaurant_latitude))
                         * sin(radians(crime_latitude))))`;

        const query = `
            SELECT AVG(cr.danger_score) AS average_danger_score
            FROM crime c
            JOIN restaurant r ON r.restaurant_id = ?
            JOIN crime_rank cr ON c.crime_type = cr.crime_type
                             AND c.if_arrest = cr.if_arrest
                             AND c.location_description = cr.location_description
            WHERE ${haversine} < ?
        `;
        connection.query(query, [resID, radius], (err, results) => {
            if (err) {
                reject(err);
            } else if (results.length > 0 && results[0].average_danger_score !== null) {
                resolve(results[0].average_danger_score);
            } else {
                resolve(0);  // No crime records found, danger score set to zero.
            }
        });
    });
}

/**
 * Handles the pagination response for database queries.
 * @param {*} data Array of records from the database query.
 * @param {*} total Number of total records that match the query without pagination.
 * @param {*} page Current page number.
 * @param {*} pageSize Number of records per page.
 */
function handlePaginationResponse(data, total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    const returnObj = {
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalResults: total,
        restaurants: data
    };
    // console.log("handlePaginationResponse:", returnObj);
    return returnObj;

}
/****************** END: Internal Functions *****************/


/******************** Main Page *******************/
/**
 * Route: GET /searchRestaurant
 * @param {*} req.query.searchStr fuzzySearchContent 
 * @param {*} req.query.page pageNumber (default to 1)
 * @param {*} req.query.pageSize pageSize (default to 10)
 */
const searchRestaurant = async function (req, res) {
    const { searchStr } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const offset = (page - 1) * pageSize;

    connection.query(`SELECT restaurant_id, restaurant_name FROM restaurant WHERE restaurant_name LIKE ? ORDER BY restaurant_name DESC LIMIT ? OFFSET ?`
        , [`%${searchStr}%`, pageSize, offset], (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: '[searchRestaurant]: Query error ' });
                return;
            }

            if (data.length === 0) {
                res.json({
                    page: page,
                    pageSize: pageSize,
                    totalPages: 0,
                    totalResults: 0,
                    restaurants: []
                });
                return;
            }

            connection.query(`SELECT COUNT(*) AS total FROM restaurant WHERE restaurant_name LIKE ?`, [`%${searchStr}%`], (err, totalData) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: 'Database error counting entries' });
                    return;
                }

                const totalResults = totalData[0].total;
                const totalPages = Math.ceil(totalResults / pageSize);

                res.json({
                    page: page,
                    pageSize: pageSize,
                    totalPages: totalPages,
                    totalResults: totalResults,
                    restaurants: data
                });
            });
        });
};


/**
 * Route: GET /getRestaurantInfo
 * @param {*} req.query.resID
 */
const getRestaurantInfo = async function (req, res) {
    const { resID } = req.query;

    connection.query(`SELECT restaurant_id, restaurant_name, restaurant_address FROM restaurant WHERE restaurant_id = ?`
        , [resID], (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: '[getRestaurantInfo]: Query error ' });
                return;
            }

            if (data.length > 0) {
                res.json(data[0]);
            } else {
                res.status(404).json({ error: 'Restaurant not found' });
            }
        });
}

/**
 * Route: GET /getInspectionScore
 * @param {*} req.query.resID
 */
const getInspectionScore = async function (req, res) {
    const { resID } = req.query;

    try {
        const restaurantQuery = `SELECT inspectionScore FROM restaurant WHERE restaurant_id = ?`;
        const resResult = await new Promise((resolve, reject) => {
            connection.query(restaurantQuery, [resID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0]);
                }
            });
        });

        if (!resResult) {
            return res.status(404).json({ error: 'Restaurant not found.' });
        }

        res.json({
            restaurant_id: resID,
            inspectionScore: resResult.inspectionScore
        });
    } catch (error) {
        console.error(`[getInspectionScore]: ${error}`);
        res.status(500).json({ error: '[getInspectionScore]: Query error' });
    }

}

/***
 * Route: GET /getCrimeNearRes
 * @param {*} req.query.resID
 * @param {*} req.query.distance (in kilometers)
 * @param {*} req.query.crimeType (optional)
 * @param {*} req.query.crimeYear (optional)
 */
const getCrimeNearRes = async function (req, res) {
    const { resID, distance, crimeType, crimeYear } = req.query;
    // Haversine formula
    const haversine = `(6371 * acos(cos(radians(restaurant_latitude)) 
                     * cos(radians(crime_latitude)) 
                     * cos(radians(crime_longitude) - radians(restaurant_longitude)) 
                     + sin(radians(restaurant_latitude)) 
                     * sin(radians(crime_latitude))))`;

    let query = `
        SELECT c.*, ${haversine} AS distance
        FROM crime c
        JOIN restaurant r ON r.restaurant_id = ?
        WHERE ${haversine} < ?
    `;
    let queryParams = [resID, distance];

    if (crimeType) {
        query += ` AND c.crime_type = ?`;
        queryParams.push(crimeType);
    }
    if (crimeYear) {
        query += ` AND YEAR(c.crime_date) = ?`;
        queryParams.push(crimeYear);
    }

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: '[getCrimeNearRes]: Query error' });
            return;
        }

        if (results.length > 0) {
            res.json(results.map(row => ({
                crime_id: row.crime_id,
                crime_date: row.crime_date,
                crime_type: row.crime_type,
                crime_description: row.crime_description,
                distance: row.distance
            })));
        } else {
            res.status(404).json({ error: 'No crime in target area.' });
        }
    });

}

/***
 * Route: GET /getSafetyScore
 * Get safety score around a given restaurant within given 'inspection_score_radius' (default to 0.5km).
 * @param {*} req.query.resID
 * 
 */
const getSafetyScore = async function (req, res) {
    const { resID } = req.query;
    // const radius = inspection_score_radius;

    try {
        const restaurantQuery = `SELECT safetyScore FROM restaurant WHERE restaurant_id = ?`;
        const resResult = await new Promise((resolve, reject) => {
            connection.query(restaurantQuery, [resID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0]);
                }
            });
        });

        if (!resResult) {
            return res.status(404).json({ error: 'Restaurant not found.' });
        }

        res.json({
            restaurant_id: resID,
            safetyScore: resResult.safetyScore
        });


    } catch (error) {
        console.error(`[getSafetyScore]: ${error}`);
        res.status(500).json({ error: '[getSafetyScore]: Query error' });
    }

}



// This API is archived! //
// Changed to /getSafetyScore
// /***
//  * Route: GET /getDangerScore
//  * Get danger score around a given restaurant within given 'inspection_score_radius' (default to 0.5km).
//  * @param {*} req.query.resID
//  * 
//  */
// const getDangerScore = async function (req, res) {
//     const { resID } = req.query;
//     const radius = inspection_score_radius;

//     try {
//         const avgDangerScore = await calculateDangerScore(resID, radius);
//         res.json({
//             restaurant_id: resID,
//             dangerScore: avgDangerScore
//         });
//     } catch (error) {
//         console.error(`[getDangerScore]: ${error}`);
//         res.status(500).json({ error: '[getDangerScore]: Query error' });
//     }

// }

/***
 * Route: GET /getRestaurantInspection
 * @param {*} req.query.resID
 * @param {*} req.query.year (optional)
 */
const getRestaurantInspection = async function (req, res) {
    const { resID, year } = req.query;
    let query = `
        SELECT * FROM inspection i
        WHERE i.restaurant_id = ?
    `;
    let queryParams = [resID];

    if (year) {
        query += ` AND YEAR(i.inspection_date) = ?`;
        queryParams.push(year);
    }

    connection.query(query, queryParams, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: '[getRestaurantInspection]: Query error' });
            return;
        }

        if (data.length > 0) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'No inspection data.' });
        }
    })
}

/***
 * Route: GET /getNearbyRestaurant
 * return the other restaurants around the given restaurant with resID within distance.
 * @param {*} req.query.resID
 * @param {*} req.query.distance
 * @param {*} req.query.page
 * @param {*} req.query.pageSize
 * @param {*} req.query.sortType: overallScore or distance
 * @param {*} req.query.sortOrder: asc or desc
 */
const getNearbyRestaurant = async function (req, res) {
    const { resID, distance, page, pageSize, sortType, sortOrder } = req.query;
    const offset = (page - 1) * pageSize;

    const haversine = `(6371 * acos(cos(radians(?)) 
                 * cos(radians(r.restaurant_latitude))
                 * cos(radians(r.restaurant_longitude) - radians(?))
                 + sin(radians(?))
                 * sin(radians(r.restaurant_latitude))))`;

    if (sortType === 'distance' || sortType === 'overallScore') {
        try {
            const restaurantQuery = `SELECT restaurant_latitude, restaurant_longitude FROM restaurant WHERE restaurant_id = ?`;
            const restaurantPosition = await new Promise((resolve, reject) => {
                connection.query(restaurantQuery, [resID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result[0]);
                    }
                });
            });

            if (!restaurantPosition) {
                return res.status(404).json({ error: 'Restaurant not found.' });
            }

            const totalQuery = `SELECT COUNT(*) AS total
                                            FROM restaurant AS r
                                            WHERE r.restaurant_id <> ? AND (${haversine}) < ?`;
            const totalResult = await new Promise((resolve, reject) => {
                connection.query(totalQuery, [resID, restaurantPosition.restaurant_latitude, restaurantPosition.restaurant_longitude, restaurantPosition.restaurant_latitude, distance], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result[0].total);
                    }
                });
            });

            // const sortClause = sortType === 'distance' ? 'distance' :
            //     `((safetyScore + inspectionScore) / 2) ${sortOrder.toUpperCase()}`;

            const sortClause = sortType === 'distance' ? `distance ${sortOrder.toUpperCase()}` :
                `((safetyScore + inspectionScore) / 2) ${sortOrder.toUpperCase()}`;

            const query = `SELECT r.*, (${haversine}) AS distance,
                        ((r.safetyScore + r.inspectionScore) / 2) AS overallScore
                        FROM restaurant AS r
                        WHERE r.restaurant_id <> ?
                        HAVING distance < ?
                        ORDER BY ${sortClause}
                        LIMIT ? OFFSET ?`;

            connection.query(query, [restaurantPosition.restaurant_latitude, restaurantPosition.restaurant_longitude, restaurantPosition.restaurant_latitude, resID, distance, parseInt(pageSize), offset], (err, results) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Query error' });
                }
                res.json(handlePaginationResponse(results, totalResult, parseInt(page), parseInt(pageSize)));
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.status(500).json({ error: 'Error: Invalid sortType.' })
    }
}

// /***
//  * Route: GET /getNearbyRestaurant_archive
//  * return the other restaurants around the given restaurant with resID within distance.
//  * @param {*} req.query.resID
//  * @param {*} req.query.distance
//  * @param {*} req.query.page
//  * @param {*} req.query.pageSize
//  * @param {*} req.query.sortType: overallScore or distance
//  */
// const getNearbyRestaurant_archive = async function (req, res) {
//     const { resID, distance, page, pageSize, sortType } = req.query;
//     const offset = (page - 1) * pageSize;

//     const haversine = `(6371 * acos(cos(radians(?)) 
//                  * cos(radians(r.restaurant_latitude))
//                  * cos(radians(r.restaurant_longitude) - radians(?))
//                  + sin(radians(?))
//                  * sin(radians(r.restaurant_latitude))))`;

//     if (sortType === 'distance') {
//         try {
//             const restaurantQuery = `SELECT restaurant_latitude, restaurant_longitude FROM restaurant WHERE restaurant_id = ?`;
//             const restaurantPosition = await new Promise((resolve, reject) => {
//                 connection.query(restaurantQuery, [resID], (err, result) => {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve(result[0]);
//                     }
//                 });
//             });

//             if (!restaurantPosition) {
//                 return res.status(404).json({ error: 'Restaurant not found.' });
//             }

//             const totalQuery = `SELECT COUNT(*) AS total
//                                             FROM restaurant AS r
//                                             WHERE r.restaurant_id <> ? AND (${haversine}) < ?`;
//             const totalResult = await new Promise((resolve, reject) => {
//                 connection.query(totalQuery, [resID, restaurantPosition.restaurant_latitude, restaurantPosition.restaurant_longitude, restaurantPosition.restaurant_latitude, distance], (err, result) => {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve(result[0].total);
//                     }
//                 });
//             });

//             const sortClause = 'distance';
//             // const sortClause = sortType === 'distance' ? 'distance' : 'overallRanking DESC, distance';


//             const query = `SELECT r.*, (${haversine}) AS distance
//                                      FROM restaurant AS r
//                                      WHERE r.restaurant_id <> ?
//                                      HAVING distance < ?
//                                      ORDER BY ${sortClause}
//                                      LIMIT ? OFFSET ?`;

//             connection.query(query, [restaurantPosition.restaurant_latitude, restaurantPosition.restaurant_longitude, restaurantPosition.restaurant_latitude, resID, distance, parseInt(pageSize), offset], (err, results) => {
//                 if (err) {
//                     console.error(err);
//                     res.status(500).json({ error: 'Query error' });
//                 }
//                 res.json(handlePaginationResponse(results, totalResult, parseInt(page), parseInt(pageSize)));
//             });
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ error: 'Server error' });
//         }
//     } else if (sortType === 'overallScore') {
//         try {
//             const restaurantQuery = `SELECT restaurant_latitude, restaurant_longitude FROM restaurant WHERE restaurant_id = ?`;
//             const restaurantPosition = await new Promise((resolve, reject) => {
//                 connection.query(restaurantQuery, [resID], (err, result) => {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve(result[0]);
//                     }
//                 });
//             });

//             if (!restaurantPosition) {
//                 return res.status(404).json({ error: 'Restaurant not found.' });
//             }
//             const query = `SELECT r.restaurant_id, (${haversine}) AS distance
//                             FROM restaurant AS r
//                             WHERE r.restaurant_id <> ?
//                             HAVING distance < ?`;

//             const nearbyRestaurants = await new Promise((resolve, reject) => {
//                 connection.query(query, [restaurantPosition.restaurant_latitude, restaurantPosition.restaurant_longitude, restaurantPosition.restaurant_latitude, resID, distance], (err, results) => {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve(results);
//                     }
//                 });
//             });

//             // calculate overallScore
//             const scoredRestaurants = await Promise.all(nearbyRestaurants.map(async (restaurant) => {
//                 const inspectionScore = await calculateInspectionScore(restaurant.restaurant_id);
//                 const dangerScore = await calculateDangerScore(restaurant.restaurant_id);
//                 const overallScore = 0.5 * inspectionScore + 0.5 * dangerScore;
//                 return {
//                     ...restaurant,
//                     inspectionScore,
//                     dangerScore,
//                     overallScore
//                 };
//             }));

//             // sort
//             scoredRestaurants.sort((a, b) => b.overallScore - a.overallScore);

//             // pagination
//             const offset = (page - 1) * pageSize;
//             const paginatedResults = scoredRestaurants.slice(offset, offset + parseInt(pageSize));

//             // res.json({
//             //     total: scoredRestaurants.length,
//             //     restaurants: paginatedResults,
//             //     page,
//             //     pageSize
//             // });
//             res.json(handlePaginationResponse(paginatedResults, scoredRestaurants.length, parseInt(page), parseInt(pageSize)));
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ error: 'Server error' });
//         }
//     } else {
//         res.status(500).json({ error: 'Error: Invalid sortType.' })
//     }
// }

/***
 * Route: GET /getCrimeByID
 * @param {*} req.query.crimeID
 */
const getCrimeByID = async function (req, res) {
    const { crimeID } = req.query;
    connection.query(`SELECT * FROM crime c WHERE c.crime_id = ?`, [crimeID], (err, data) => {
        if (err) {
            res.status(500).json({ error: '[getCrimeByID]: Query error' });
            return;
        }

        if (data.length > 0) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'No inspection data.' });
        }
    })
}

/**
 * Route: GET /getRestaurantOverallScore
 * Calculates and returns an overall score for a restaurant.
 * @param {*} req.query.resID
 */
const getRestaurantOverallScore = async function (req, res) {
    const { resID } = req.query;

    try {
        // const inspectionScore = await calculateInspectionScore(resID);
        // const dangerScore = await calculateDangerScore(resID, inspection_score_radius);

        const restaurantQuery = `SELECT safetyScore, inspectionScore FROM restaurant WHERE restaurant_id = ?`;
        const resScores = await new Promise((resolve, reject) => {
            connection.query(restaurantQuery, [resID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result[0]);
                }
            });
        });

        if (!resScores) {
            return res.status(404).json({ error: 'Restaurant not found.' });
        }

        // Calculate overall score using an example weighted formula:
        const overallScore = (resScores.inspectionScore * 0.5) + (resScores.safetyScore * 0.5);

        res.json({
            restaurant_id: resID,
            overallScore: overallScore,
            inspectionScore: resScores.inspectionScore,
            safetyScore: resScores.safetyScore
        });
    } catch (error) {
        console.error(`[getRestaurantOverallScore]: ${error}`);
        res.status(500).json({ error: 'Failed to calculate overall score' });
    }
}

/**
 * Route: GET /getCrimeRankByID
 * Retrieves the rank details for a specific crime.
 * @param {*} req.query.crimeID
 */
const getCrimeRankByID = async function (req, res) {
    const { crimeID } = req.query;

    try {
        const query = `
            SELECT cr.*
            FROM crime_rank cr
            JOIN crime c ON cr.location_description = c.location_description
                         AND cr.if_arrest = c.if_arrest
                         AND cr.crime_type = c.crime_type
            WHERE c.crime_id = ?
        `;
        connection.query(query, [crimeID], (err, results) => {
            if (err) {
                console.error(`[getCrimeRankByID]: Query error: ${err}`);
                res.status(500).json({ error: 'Database query error' });
                return;
            }

            if (results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).json({ error: 'Crime rank not found for the specified crime ID' });
            }
        });
    } catch (error) {
        console.error(`[getCrimeRankByID]: ${error}`);
        res.status(500).json({ error: 'Server error' });
    }
}


module.exports = {
    searchRestaurant,
    getRestaurantInfo,
    getInspectionScore,
    getCrimeNearRes,
    getSafetyScore,
    getRestaurantInspection,
    getNearbyRestaurant,
    getCrimeByID,
    getRestaurantOverallScore,
    getCrimeRankByID,
}


/**
 * @swagger
 * /searchRestaurant:
 *   get:
 *     summary: Search for restaurants by name.
 *     description: Perform a fuzzy search of restaurants by name.
 *     parameters:
 *       - in: query
 *         name: searchStr
 *         required: true
 *         description: Part of the restaurant name to search for.
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination.
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: Number of results per page.
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: A list of restaurants that match the search criteria.
 *       500:
 *         description: Error message for an internal server error.
 */

/**
 * @swagger
 * /getRestaurantInfo:
 *   get:
 *     summary: Retrieves restaurant information by ID.
 *     description: This endpoint retrieves all available information about a specific restaurant by its ID.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: Numeric ID of the restaurant to get information for.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A single restaurant information.
 *       404:
 *         description: Restaurant not found.
 */

/**
 * @swagger
 * /getInspectionScore:
 *   get:
 *     summary: Get the inspection score of a restaurant.
 *     description: Retrieve the average inspection score of a restaurant based on its ID.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: ID of the restaurant to get the inspection score for.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The average inspection score of the restaurant.
 *       404:
 *         description: Restaurant not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /getCrimeNearRes:
 *   get:
 *     summary: Get crime data near a restaurant.
 *     description: Retrieve crime records within a specified distance from a restaurant.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: ID of the restaurant.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: distance
 *         required: true
 *         description: Radius distance in kilometers.
 *         schema:
 *           type: number
 *       - in: query
 *         name: crimeType
 *         required: false
 *         description: Filter for a specific type of crime.
 *         schema:
 *           type: string
 *       - in: query
 *         name: crimeYear
 *         required: false
 *         description: Filter crimes by year.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of crimes near the specified restaurant.
 *       404:
 *         description: No crime data found in the target area.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /getSafetyScore:
 *   get:
 *     summary: Get the safety score around a restaurant.
 *     description: Calculated based on crime data within 0.5 km radius of the restaurant.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: ID of the restaurant to get the danger score for.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The safety score around the restaurant.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /getRestaurantInspection:
 *   get:
 *     summary: Get inspection data for a restaurant.
 *     description: Retrieve inspection records for a specific restaurant, optionally filtered by year.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: ID of the restaurant.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: false
 *         description: Filter inspections by year.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of inspection data for the restaurant.
 *       404:
 *         description: No inspection data found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /getNearbyRestaurant:
 *   get:
 *     summary: Get nearby restaurants.
 *     description: Retrieve other restaurants around a given restaurant within a specified distance.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: ID of the reference restaurant.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: distance
 *         required: true
 *         description: Search radius distance in kilometers.
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination.
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         required: false
 *         description: Number of results per page.
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortType
 *         required: false
 *         description: Sort type, can be overallScore or distance.
 *         schema:
 *           type: string
 *           enum: [overallScore, distance]
 *           default: distance
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: Sort order, can be asc or desc.
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: A list of nearby restaurants.
 *       404:
 *         description: Reference restaurant not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /getCrimeByID:
 *   get:
 *     summary: Retrieves crime information by crime ID
 *     description: Fetches the details of a crime from the database using a specific crime ID. Returns crime details if found, or an error message if no data is found or if a query error occurs.
 *     parameters:
 *       - in: query
 *         name: crimeID
 *         required: true
 *         description: Unique identifier of the crime.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A crime record found and returned successfully.
 *       404:
 *         description: No crime data found for the given ID.
 *       500:
 *         description: Internal server error due to a query failure.
 */

/**
 * @swagger
 * /getRestaurantOverallScore:
 *   get:
 *     summary: Calculates and returns an overall score for a restaurant.
 *     description: This endpoint calculates the overall score for a specified restaurant based on its inspection scores and danger scores from nearby crime data. The scores are weighted equally and combined to provide a single overall score.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: Unique identifier of the restaurant for which to calculate the overall score.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully calculated and returned the overall score for the restaurant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant_id:
 *                   type: string
 *                   description: The unique identifier of the restaurant.
 *                 overallScore:
 *                   type: number
 *                   description: The calculated overall score of the restaurant.
 *                   example: 5
 *                 inspectionScore:
 *                   type: number
 *                   description: The calculated overall score of the restaurant.
 *                   example: 6
 *                 safetyScore:
 *                   type: number
 *                   description: The calculated overall score of the restaurant.
 *                   example: 4
 *       404:
 *         description: No data found for the given restaurant ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Restaurant not found"
 *       500:
 *         description: Server error or failed to calculate the score due to an internal error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to calculate overall score"
 */

/**
 * @swagger
 * /getCrimeRankByID:
 *   get:
 *     summary: Retrieve crime rank details by crime ID
 *     description: Fetches the ranking details of a specific crime record by using its unique crime ID.
 *     parameters:
 *       - in: query
 *         name: crimeID
 *         required: true
 *         description: The unique identifier of the crime to retrieve the ranking details for.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved the crime rank details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location_description:
 *                   type: string
 *                   description: Description of the location where the crime occurred.
 *                 if_arrest:
 *                   type: boolean
 *                   description: Indicates if an arrest was made.
 *                 crime_type:
 *                   type: string
 *                   description: The type of crime.
 *                 danger_score:
 *                   type: integer
 *                   description: The score indicating the danger level of the crime.
 *       404:
 *         description: No crime rank found for the provided ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Crime rank not found for the specified crime ID'
 *       500:
 *         description: Server error or database query error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Database query error'
 */
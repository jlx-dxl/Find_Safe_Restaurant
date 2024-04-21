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

    connection.query(`
        SELECT r.restaurant_id, r.restaurant_name, i.inspection_date, i.risk_level, i.inspection_result, s.inspection_score 
        FROM restaurant AS r
        JOIN inspection AS i ON r.restaurant_id = i.restaurant_id
        JOIN inspection_score AS s ON i.risk_level = s.risk_level and i.inspection_result = s.inspection_result
        WHERE r.restaurant_id = ?
    `, [resID], (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: '[getInspectionScore]: Query error ' });
            return;
        }

        if (data.length > 0) {
            const scores = {};
            data.forEach(row => {
                if (!scores[row.restaurant_id]) {
                    scores[row.restaurant_id] = {
                        name: row.restaurant_name,
                        cnt: 0,
                        qualityScore: 0,
                    };
                }

                scores[row.restaurant_id].qualityScore += row.inspection_score
                scores[row.restaurant_id].cnt++;
            });
            console.log(scores)
            if (scores[resID].cnt == 0) {
                res.json({});
            } else {
                const avgScore = scores[resID].qualityScore / scores[resID].cnt;
                res.json({
                    restaurant_id: resID,
                    restaurant_name: scores[resID].name,
                    inspectionScore: avgScore,
                })
            }

        } else {
            res.status(404).json({ error: 'Inspection Score not found' });
        }
    });
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
 * Route: GET /getDangerScore
 * Get danger score around a given restaurant within '0.5 km'.
 * @param {*} req.query.resID
 * 
 */
const getDangerScore = async function (req, res) {
    const { resID } = req.query;
    const radius = 0.5;
    // Haversine公式
    const haversine = `(6371 * acos(cos(radians(restaurant_latitude))
                     * cos(radians(crime_latitude))
                     * cos(radians(crime_longitude) - radians(restaurant_longitude))
                     + sin(radians(restaurant_latitude))
                     * sin(radians(crime_latitude))))`;

    connection.query(`
        SELECT AVG(cr.danger_score) AS average_danger_score
        FROM crime c
        JOIN restaurant r ON r.restaurant_id = ?
        JOIN crime_rank cr ON c.crime_type = cr.crime_type
                         AND c.if_arrest = cr.if_arrest
                         AND c.location_description = cr.location_description
        WHERE ${haversine} < ?
    `, [resID, radius], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: '[getDangerScore]: Query error' });
            return;
        }

        if (results.length > 0 && results[0].average_danger_score !== null) {
            res.json({
                restaurant_id: resID,
                dangerScore: results[0].average_danger_score
            });
        } else {
            res.json({
                restaurant_id: resID,
                dangerScore: 0 //no crime record founded, danger score set to zero.
            });
        }
    });
}

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
 * @param {*} req.query.sortType: overallRanking or distance
 */
const getNearbyRestaurant = async function (req, res) {
    const { resID, distance, page, pageSize, sortType } = req.query;
    const offset = (page - 1) * pageSize;

    const haversine = `(6371 * acos(cos(radians(?)) 
                 * cos(radians(r.restaurant_latitude))
                 * cos(radians(r.restaurant_longitude) - radians(?))
                 + sin(radians(?))
                 * sin(radians(r.restaurant_latitude))))`;

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

        const sortClause = 'distance';
        // const sortClause = sortType === 'distance' ? 'distance' : 'overallRanking DESC, distance';


        const query = `SELECT r.*, (${haversine}) AS distance
                     FROM restaurant AS r
                     WHERE r.restaurant_id <> ?
                     HAVING distance < ?
                     ORDER BY ${sortClause}
                     LIMIT ? OFFSET ?`;

        connection.query(query, [restaurantPosition.restaurant_latitude, restaurantPosition.restaurant_longitude, restaurantPosition.restaurant_latitude, resID, distance, parseInt(pageSize), offset], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Query error' });
            } else {
                res.json(results);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    searchRestaurant,
    getRestaurantInfo,
    getInspectionScore,
    getCrimeNearRes,
    getDangerScore,
    getRestaurantInspection,
    getNearbyRestaurant,
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
 * /getDangerScore:
 *   get:
 *     summary: Get the danger score around a restaurant.
 *     description: Retrieve the average danger score based on crime data within 0.5 km radius of the restaurant.
 *     parameters:
 *       - in: query
 *         name: resID
 *         required: true
 *         description: ID of the restaurant to get the danger score for.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The danger score around the restaurant.
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
 *         description: Sort type, can be overallRanking or distance.
 *         schema:
 *           type: string
 *           enum: [overallRanking, distance]
 *           default: distance
 *     responses:
 *       200:
 *         description: A list of nearby restaurants.
 *       404:
 *         description: Reference restaurant not found.
 *       500:
 *         description: Internal server error.
 */

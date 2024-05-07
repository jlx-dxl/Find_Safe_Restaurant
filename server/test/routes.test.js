const request = require('supertest');
const mysql = require('mysql');
const app = require('../server.js'); // Assume your Express app is exported from this file

let connection;

jest.mock('mysql', () => ({
    createConnection: jest.fn().mockReturnValue({
        connect: jest.fn().mockImplementation((callback) => callback(null)),
        query: jest.fn(),
        end: jest.fn()
    })
}));


describe('GET /searchRestaurant', () => {

    beforeEach(() => {
        connection = mysql.createConnection(); // 获取新的 mock connection 对象
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    
    test('should return the first page of restaurants matching the search string', async () => {
        // mock
        connection.query.mockImplementation((sql, params, callback) => {
            if (sql.includes('COUNT(*)')) {
                callback(null, [{ total: 20 }]);  // 模拟总数
            } else {
                callback(null, [
                    { restaurant_id: 1, restaurant_name: 'Taco Bell' },
                    { restaurant_id: 2, restaurant_name: 'Pizza Hut' }
                ]);  // 模拟具体数据
            }
        });


        const searchStr = 'pizza';
        const response = await request(app)
            .get(`/searchRestaurant?searchStr=${searchStr}&page=1&pageSize=2`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            page: 1,
            pageSize: 2,
            totalPages: 10,
            totalResults: 20,
            restaurants: [
                { restaurant_id: 1, restaurant_name: 'Taco Bell' },
                { restaurant_id: 2, restaurant_name: 'Pizza Hut' }
            ]
        });
        expect(connection.query).toHaveBeenCalledTimes(2); // Once for the SELECT, once for the COUNT
        expect(connection.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT restaurant_id, restaurant_name FROM restaurant'),
            [`%${searchStr}%`, 2, 0],
            expect.any(Function)
        );
        expect(connection.query).toHaveBeenCalledWith(
            'SELECT COUNT(*) AS total FROM restaurant WHERE restaurant_name LIKE ?',
            [`%${searchStr}%`],
            expect.any(Function)
        );
    });

    test('should handle database errors when querying restaurants', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null); // 模拟数据库错误
        });

        const response = await request(app)
            .get('/searchRestaurant?searchStr=pizza&page=1&pageSize=2');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: '[searchRestaurant]: Query error '
        });
    });

    test('should handle database errors when counting total entries', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            if (sql.includes('COUNT(*)')) {
                callback(new Error('Database error'), null); // 模拟计数时的数据库错误
            } else {
                callback(null, [
                    { restaurant_id: 1, restaurant_name: 'Taco Bell' },
                    { restaurant_id: 2, restaurant_name: 'Pizza Hut' }
                ]); // 正常返回查询结果
            }
        });

        const response = await request(app)
            .get('/searchRestaurant?searchStr=pizza&page=1&pageSize=2');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Database error counting entries'
        });
    });

    test('should return the correct page of restaurants with non-default pagination settings', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            if (sql.includes('COUNT(*)')) {
                callback(null, [{ total: 50 }]); // 模拟更多餐厅
            } else {
                callback(null, [
                    { restaurant_id: 3, restaurant_name: 'Burger King' },
                    { restaurant_id: 4, restaurant_name: 'Subway' }
                ]); // 返回第二页的结果
            }
        });

        const response = await request(app)
            .get('/searchRestaurant?searchStr=pizza&page=2&pageSize=2');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            page: 2,
            pageSize: 2,
            totalPages: 25,
            totalResults: 50,
            restaurants: [
                { restaurant_id: 3, restaurant_name: 'Burger King' },
                { restaurant_id: 4, restaurant_name: 'Subway' }
            ]
        });
    });
});

describe('GET /getRestaurantInfo', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return restaurant info for a valid restaurant ID', async () => {
        const mockData = [{ restaurant_id: 1, restaurant_name: 'Taco Bell', restaurant_address: '123 Taco Street' }];

        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockData);
        });

        const resID = "1";
        const response = await request(app)
            .get(`/getRestaurantInfo?resID=${resID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData[0]);
        expect(connection.query).toHaveBeenCalledWith(
            'SELECT restaurant_id, restaurant_name, restaurant_address FROM restaurant WHERE restaurant_id = ?',
            [resID],
            expect.any(Function)
        );
    });

    test('should return 404 if no restaurant is found with the given ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []);  // 模拟没有找到餐厅
        });

        const resID = "999";  // 一个不存在的餐厅 ID
        const response = await request(app)
            .get(`/getRestaurantInfo?resID=${resID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Restaurant not found' });
        expect(connection.query).toHaveBeenCalledWith(
            'SELECT restaurant_id, restaurant_name, restaurant_address FROM restaurant WHERE restaurant_id = ?',
            [resID],
            expect.any(Function)
        );
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null);  // 模拟数据库查询错误
        });

        const resID = "1";
        const response = await request(app)
            .get(`/getRestaurantInfo?resID=${resID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: '[getRestaurantInfo]: Query error ' });
        expect(connection.query).toHaveBeenCalledWith(
            'SELECT restaurant_id, restaurant_name, restaurant_address FROM restaurant WHERE restaurant_id = ?',
            [resID],
            expect.any(Function)
        );
    });
});

describe('GET /getInspectionScore', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return the inspection score for a valid restaurant ID', async () => {
        const mockData = { inspectionScore: 85 };
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, [mockData]);
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getInspectionScore?resID=${resID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            restaurant_id: resID,
            inspectionScore: 85
        });
    });

    test('should return 404 if no restaurant is found with the given ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []);  // 模拟没有找到餐厅
        });

        const resID = '999';  // 一个不存在的餐厅 ID
        const response = await request(app)
            .get(`/getInspectionScore?resID=${resID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Restaurant not found.' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null);  // 模拟数据库查询错误
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getInspectionScore?resID=${resID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: '[getInspectionScore]: Query error' });
    });
});

describe('GET /getCrimeNearRes', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return nearby crimes for given restaurant and distance', async () => {
        const mockCrimes = [
            { crime_id: 1, crime_date: '2021-01-01', crime_type: 'Theft', crime_description: 'Stolen bike', distance: 0.3 }
        ];
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockCrimes);
        });

        const response = await request(app)
            .get('/getCrimeNearRes?resID=1&distance=1'); // Assume 1 km radius

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCrimes.map(crime => ({
            crime_id: crime.crime_id,
            crime_date: crime.crime_date,
            crime_type: crime.crime_type,
            crime_description: crime.crime_description,
            distance: crime.distance
        })));
    });

    test('should return 404 if no crimes are found within the given distance', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []); // No crimes returned
        });

        const response = await request(app)
            .get('/getCrimeNearRes?resID=1&distance=1');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No crime in target area.' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null);
        });

        const response = await request(app)
            .get('/getCrimeNearRes?resID=1&distance=1');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: '[getCrimeNearRes]: Query error' });
    });

    test('should filter crimes based on type and year', async () => {
        const mockCrimes = [
            { crime_id: 2, crime_date: '2021-01-02', crime_type: 'Burglary', crime_description: 'Broke into a house', distance: 0.5 }
        ];
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockCrimes);
        });

        const response = await request(app)
            .get('/getCrimeNearRes?resID=1&distance=1&crimeType=Burglary&crimeYear=2021');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCrimes.map(crime => ({
            crime_id: crime.crime_id,
            crime_date: crime.crime_date,
            crime_type: crime.crime_type,
            crime_description: crime.crime_description,
            distance: crime.distance
        })));
    });
});

describe('GET /getSafetyScore', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return the safety score for a valid restaurant ID', async () => {
        const mockData = { safetyScore: 88 };
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, [mockData]);
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getSafetyScore?resID=${resID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            restaurant_id: resID,
            safetyScore: mockData.safetyScore
        });
    });

    test('should return 404 if no restaurant is found with the given ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []); // 模拟没有找到餐厅
        });

        const resID = '999'; // 一个不存在的餐厅 ID
        const response = await request(app)
            .get(`/getSafetyScore?resID=${resID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Restaurant not found.' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null); // 模拟数据库查询错误
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getSafetyScore?resID=${resID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: '[getSafetyScore]: Query error' });
    });
});

describe('GET /getRestaurantInspection', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return inspection data for a valid restaurant ID', async () => {
        const mockData = [
            { inspection_id: 1, inspection_date: '2021-01-01', health_score: 90 }
        ];
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockData);
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getRestaurantInspection?resID=${resID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData);
    });

    test('should return inspection data for a specific year', async () => {
        const mockData = [
            { inspection_id: 2, inspection_date: '2021-05-01', health_score: 85 }
        ];
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockData);
        });

        const resID = '1';
        const year = '2021';
        const response = await request(app)
            .get(`/getRestaurantInspection?resID=${resID}&year=${year}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData);
    });

    test('should return 404 if no inspection data is found for the given restaurant ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []); // 模拟没有找到检查数据
        });

        const resID = '999'; // 一个不存在的餐厅 ID
        const response = await request(app)
            .get(`/getRestaurantInspection?resID=${resID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No inspection data.' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null); // 模拟数据库查询错误
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getRestaurantInspection?resID=${resID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: '[getRestaurantInspection]: Query error' });
    });
});

describe('GET /getNearbyRestaurant', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return nearby restaurants sorted by distance', async () => {
        const mockData = [
            { restaurant_id: 2, restaurant_name: "Restaurant A", distance: 0.4, safetyScore: 80, inspectionScore: 85 },
            { restaurant_id: 3, restaurant_name: "Restaurant B", distance: 0.5, safetyScore: 90, inspectionScore: 90 }
        ];
        const totalResult = 2;
        connection.query.mockImplementationOnce((sql, params, callback) => {
            // First query for position
            callback(null, [{ restaurant_latitude: 40.7128, restaurant_longitude: -74.0060 }]);
        }).mockImplementationOnce((sql, params, callback) => {
            // Second query for total count
            callback(null, [{ total: totalResult }]);
        }).mockImplementationOnce((sql, params, callback) => {
            // Third query for data
            callback(null, mockData);
        });

        const response = await request(app)
            .get('/getNearbyRestaurant?resID=1&distance=1&page=1&pageSize=2&sortType=distance&sortOrder=asc');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            page: 1,
            pageSize: 2,
            totalPages: 1,
            totalResults: totalResult,
            restaurants: mockData
        });
    });

    test('should return 404 if the restaurant is not found', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []);
        });

        const response = await request(app)
            .get('/getNearbyRestaurant?resID=999&distance=1&page=1&pageSize=2&sortType=distance&sortOrder=asc');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Restaurant not found.' });
    });

    test('should return 500 if there is a database error during the main query', async () => {
        connection.query.mockImplementationOnce((sql, params, callback) => {
            // First query for position
            callback(null, [{ restaurant_latitude: 40.7128, restaurant_longitude: -74.0060 }]);
        });

        const response = await request(app)
            .get('/getNearbyRestaurant?resID=1&distance=1&page=1&pageSize=2&sortType=distance&sortOrder=asc');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Server error' });
    });

    test('should return 500 if invalid sort type is provided', async () => {
        const response = await request(app)
            .get('/getNearbyRestaurant?resID=1&distance=1&page=1&pageSize=2&sortType=invalidType&sortOrder=asc');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Error: Invalid sortType.' });
    });
});



describe('GET /getCrimeByID', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return crime details for a valid crime ID', async () => {
        const mockData = [
            { crime_id: 1, crime_type: "Theft", description: "Stolen wallet", date: "2021-01-01" }
        ];
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockData);
        });

        const crimeID = '1';
        const response = await request(app)
            .get(`/getCrimeByID?crimeID=${crimeID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData);
    });

    test('should return 404 if no crime data is found for the given crime ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []); // 模拟没有找到犯罪记录
        });

        const crimeID = '999'; // 一个不存在的犯罪 ID
        const response = await request(app)
            .get(`/getCrimeByID?crimeID=${crimeID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'No inspection data.' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null); // 模拟数据库查询错误
        });

        const crimeID = '1';
        const response = await request(app)
            .get(`/getCrimeByID?crimeID=${crimeID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: '[getCrimeByID]: Query error' });
    });
});

describe('GET /getRestaurantOverallScore', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return the overall score for a valid restaurant ID', async () => {
        const mockData = { safetyScore: 90, inspectionScore: 85 };
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, [mockData]);
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getRestaurantOverallScore?resID=${resID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            restaurant_id: resID,
            overallScore: (mockData.inspectionScore * 0.5) + (mockData.safetyScore * 0.5),
            inspectionScore: mockData.inspectionScore,
            safetyScore: mockData.safetyScore
        });
    });

    test('should return 404 if no restaurant data is found for the given restaurant ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []); // 模拟没有找到餐厅
        });

        const resID = '999'; // 一个不存在的餐厅 ID
        const response = await request(app)
            .get(`/getRestaurantOverallScore?resID=${resID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Restaurant not found.' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null); // 模拟数据库查询错误
        });

        const resID = '1';
        const response = await request(app)
            .get(`/getRestaurantOverallScore?resID=${resID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Failed to calculate overall score' });
    });
});

describe('GET /getCrimeRankByID', () => {
    let connection;

    beforeEach(() => {
        connection = mysql.createConnection();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return crime rank details for a valid crime ID', async () => {
        const mockData = [
            { crime_type: "Theft", location_description: "Street", if_arrest: "Yes", rank: 5 }
        ];
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, mockData);
        });

        const crimeID = '1';
        const response = await request(app)
            .get(`/getCrimeRankByID?crimeID=${crimeID}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData[0]);
    });

    test('should return 404 if no crime rank data is found for the given crime ID', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(null, []); // No crime rank data returned
        });

        const crimeID = '999'; // A non-existent crime ID
        const response = await request(app)
            .get(`/getCrimeRankByID?crimeID=${crimeID}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Crime rank not found for the specified crime ID' });
    });

    test('should handle database errors during the query', async () => {
        connection.query.mockImplementation((sql, params, callback) => {
            callback(new Error('Database error'), null);
        });

        const crimeID = '1';
        const response = await request(app)
            .get(`/getCrimeRankByID?crimeID=${crimeID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Database query error' });
    });

    test('should handle unexpected errors', async () => {
        connection.query.mockImplementationOnce(() => {
            throw new Error('Unexpected error');
        });

        const crimeID = '1';
        const response = await request(app)
            .get(`/getCrimeRankByID?crimeID=${crimeID}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Server error' });
    });
});
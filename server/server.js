const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swaggerOptions');

const app = express();
app.use(cors({
  origin: '*',
}));

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/searchRestaurant', routes.searchRestaurant);
app.get('/getRestaurantInfo', routes.getRestaurantInfo);
app.get('/getInspectionScore', routes.getInspectionScore);
app.get('/getCrimeNearRes', routes.getCrimeNearRes);
app.get('/getDangerScore', routes.getDangerScore);
app.get('/getRestaurantInspection', routes.getRestaurantInspection);
app.get('/getNearbyRestaurant', routes.getNearbyRestaurant);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;

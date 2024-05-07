const express = require('express');
const path = require('path');
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

// 提供静态文件
app.use(express.static(path.join(__dirname, '../client/build')));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/searchRestaurant', routes.searchRestaurant);
app.get('/getRestaurantInfo', routes.getRestaurantInfo);
app.get('/getInspectionScore', routes.getInspectionScore);
app.get('/getCrimeNearRes', routes.getCrimeNearRes);
app.get('/getRestaurantInspection', routes.getRestaurantInspection);
app.get('/getNearbyRestaurant', routes.getNearbyRestaurant);
app.get('/getCrimeByID', routes.getCrimeByID);
app.get('/getRestaurantOverallScore', routes.getRestaurantOverallScore);
app.get('/getCrimeRankByID', routes.getCrimeRankByID);
app.get('/getSafetyScore', routes.getSafetyScore);

// 所有路由指向index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || config.server_port;
// const HOST = '0.0.0.0';
// const HOST = process.env.HOST || "0.0.0.0";

if(process.env.NODE_ENV !== 'test') {
  // app.listen(config.server_port, () => {
  //   console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
  // });
  // app.listen(PORT, HOST, () => {
  //   console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
  // });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at port: ${PORT}`)
  });
}


module.exports = app;

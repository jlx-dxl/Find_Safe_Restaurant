// swaggerOptions.js
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'FOOD_CRIME_CHICAGO  API Documentation',
      version: '1.0.2',
      description: 'This is the swagger doc for the CIS5500 Final Proj',
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      // contact: {
      //   name: 'Your Name',
      //   url: 'Your Website',
      // },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
  };
  
  const options = {
    swaggerDefinition,
    // Paths to files containing OpenAPI definitions
    apis: ['./routes.js'],
  };
  
  module.exports = options;
  
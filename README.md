# Find Safe Restaurant

> Hosted here: https://find-restaurant-for-chicago.ue.r.appspot.com/
>
> Video Demo: https://lucien-jia.notion.site/DataBase-1ede821df18f4f66ad69d504a9ce974e

## Project Description
The "Find Safe Restaurant" application helps users find restaurants that meet specific health and safety standards. This application fetches restaurant data, including health inspection scores and user reviews, and displays them in a user-friendly format. Users can search for restaurants by location, cuisine, and safety ratings.

## Repository Structure

### Client
Contains all the frontend code of the application.

- **`build`**: Compiled and optimized production build files.
- **`public`**: Static files like HTML entry point, icons, and manifest files.
- **`src`**:
  - **`components`**: React components used across the application. 
    - `NavBar.js`: Navigation bar component.
    - `themeContext.js`: React context for theme switching.
  - **`helpers`**: Utility and helper functions.
  - **`pages`**: React components representing pages.
  - `App.js`: Main React application component.
  - `index.js`: Entry point for React application.
  - `config.json`: Configuration file for frontend settings.

### Server
Contains all the backend code of the application.

- **`coverage`**: Code coverage reports.
- **`routes.js`**: Defines server routes.
- **`server.js`**: Main server file.
- **`swaggerOptions.js`**: Configuration for Swagger documentation.

### Root Directory
- **`.env.local`**: Local environment variables.
- **`.gitignore`**: Specifies intentionally untracked files to ignore.
- **`package.json`**, **`package-lock.json`**: NPM configuration files listing project dependencies.

## Getting Started

To get a local copy up and running follow these simple steps.

1. Install NPM packages
   ```bash
   npm install
   ```
2. Start the server
   ```bash
   npm run start
   ```

## Backend Swagger
First, go into backend folder '/server'
```bash
cd server
```

There's a swagger doc for backend APIs. Get launch the swagger api doc:
1. `npm install`
2. `npm run start`, then the program should be running at localhost:8080
3. open `localhost:8080/api-docs`, you could see the swagger doc page

npm install mocha chai sinon proxyquire --save-dev

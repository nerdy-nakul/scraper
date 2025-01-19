# Hacker News Scraper and Real time Updates

Building a full-stack application that scrapes the latest stories from Hacker News every 5 minutes using a cron job, stores them in a MySQL database, and delivers real-time updates to clients via WebSockets.

## Features
- Scrapes Hacker News stories using Axios and Cheerio.
- Stores data in a MySQL database.
- Provides a REST API for fetching stories.
- Sends real-time updates to connected clients using WebSockets.
- Sends the number of stories published in the last 5 minutes upon WebSocket connection.

## Backend Setup

### Prerequisites
1. Install [Node.js](https://nodejs.org/).
2. Install [MySQL](https://www.mysql.com/).
3. Create a `.env` file in the root directory and configure the following variables:
   ```env
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   PORT=3000
   WS_PORT=3001
   ```

### Steps
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd scraper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```sql
   CREATE DATABASE mydb;
   USE mydb;
   CREATE TABLE stories (
       id INT PRIMARY KEY,
       title VARCHAR(255),
       url VARCHAR(255),
       timestamp DATETIME
   );
   ```

4. Start the backend:
   ```bash
   npm run dev
   ```

The API will run on `http://localhost:3000`, and the WebSocket server will run on `ws://localhost:3001`.

## Frontend Setup (React with Vite)

### Prerequisites
1. Install [Node.js](https://nodejs.org/).
2. Install [Vite](https://vitejs.dev/).

### Steps
1. Navigate to your frontend directory or create a new React Vite project:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm run dev
   ```

Your frontend will run on `http://localhost:5173` by default.

## Usage
1. Start the backend server.
2. Start the React frontend server.
3. Open the frontend in your browser and see the latest stories and updates.

## Cron Job
- The backend automatically scrapes new stories every 5 minute using `node-cron`.

## API Endpoints
- `GET /api/stories`: Fetch all stories from the database.

## Technologies Used
- **Backend**: Node.js, Express.js, MySQL, WebSocket
- **Frontend**: React (Vite), WebSocket API
- **Scraping**: Axios, Cheerio
- **Scheduling**: node-cron

![image](https://github.com/user-attachments/assets/670c5e24-2982-420f-86bf-f6d0f9d81884)
![image](https://github.com/user-attachments/assets/ca44e2ad-af6e-4894-a573-75713f3e4957)

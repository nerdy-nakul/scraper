// src/database.js
const mysql = require("mysql2/promise");
require("dotenv").config();

let pool = null;

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "hacker_news",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function initializeDatabase() {
  try {
    pool = await mysql.createPool(dbConfig);

    // Create stories table with updated schema
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS stories (
                id BIGINT PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                url TEXT,
                author VARCHAR(100),
                score INT DEFAULT 0,
                comments INT DEFAULT 0,
                timestamp DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_timestamp (timestamp),
                INDEX idx_created_at (created_at)
            )
        `);

    console.log("Database initialized successfully");
    return pool;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return pool;
}

module.exports = {
  initializeDatabase,
  getPool,
};

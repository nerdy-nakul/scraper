// src/server.js
const express = require("express");
const http = require("http");
const cron = require("node-cron");
require("dotenv").config();

const db = require("./database");
const { scrapeHackerNews } = require("./scraper");
const { initializeWebSocket } = require("./websocket");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// REST API endpoints
app.get("/api/stories", async (req, res) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.execute(
      "SELECT * FROM stories ORDER BY timestamp DESC LIMIT 30"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL 5 MINUTE THEN 1 ELSE 0 END) as last_5_min
            FROM stories
        `);
    res.json({
      total: rows[0].total,
      lastFiveMinutes: rows[0].last_5_min,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Database error" });
  }
});

async function startServer() {
  try {
    // Initialize database
    await db.initializeDatabase();

    // Initialize WebSocket
    initializeWebSocket(server);

    // Schedule scraping job (every 5 minutes)
    cron.schedule("* * * * *", scrapeHackerNews);

    // Start server
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`WebSocket server initialized`);
    });

    // Initial scrape
    await scrapeHackerNews();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

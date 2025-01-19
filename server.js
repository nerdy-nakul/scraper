const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const WebSocket = require("ws");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const clients = [];
const stories = [];

const scrapeHackerNews = async () => {
  try {
    const { data } = await axios.get("https://news.ycombinator.com/");
    const $ = cheerio.load(data);

    const scrapedStories = [];

    $(".athing").each((i, element) => {
      const $element = $(element);
      const $subtext = $element.next(".subtext");

      const id = $element.attr("id");
      const title = $element.find(".titleline a").first().text().trim();
      const url = $element.find(".titleline a").first().attr("href");
      const timeAgo = $subtext.find(".age").attr("title");
      const timestamp = timeAgo ? new Date(timeAgo) : new Date();

      scrapedStories.push({
        id: parseInt(id),
        title,
        url,
        timestamp,
      });
    });

    stories.splice(0, stories.length, ...scrapedStories);



    console.log(`Scraped ${stories.length} stories.`);
    await saveStoriesToDatabase();
    // broadcastToClients({ type: "latest_stories", stories });
    // broadcastLatestStories();
  } catch (error) {
    console.error("Error while scraping Hacker News:", error);
  }
};

const saveStoriesToDatabase = async () => {
  try {
    for (const story of stories) {
      const [existing] = await pool.query(
        "SELECT id FROM stories WHERE id = ?",
        [story.id]
      );

      if (existing.length === 0) {
        await pool.execute(
          "INSERT INTO stories (id, title, url, timestamp) VALUES (?, ?, ?, ?)",
          [
            story.id,
            story.title,
            story.url,
            story.timestamp,
          ]
        );
        console.log(`Inserted story ID ${story.id}.`);
      } else {
        console.log(`Story ID ${story.id} already exists.`);
      }
    }
  } catch (error) {
    console.error("Error saving stories to database:", error);
  }
};

const broadcastToClients = (data) => {
  console.log("Broadcasting data:", data); 
  clients.forEach((client) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error broadcasting to client:", error);
    }
  });
};

cron.schedule("*/5 * * * *", () => {
  console.log("Cron job executed at:", new Date().toISOString());
  scrapeHackerNews();
  broadcastLatestStories();
});

const startWebSocketServer = () => {
  const wss = new WebSocket.Server({ port: process.env.WS_PORT || 3001 });

  wss.on("connection",async (ws) => {
    console.log("New client connected.");
    clients.push(ws);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    try {
      const [rows] = await pool.query(
        "SELECT COUNT(*) AS count FROM stories WHERE timestamp >= ?",
        [fiveMinutesAgo]
      );
      const count = rows[0]?.count || 0;

      ws.send(
        JSON.stringify({ type: "recent_story_count", count })
      );
    } catch (error) {
      console.error("Error fetching stories count:", error);
    }

    ws.on("message", (data) => {
      console.log("Received:", data);
      const parsedData = JSON.parse(data);

      broadcastToClients({ message: parsedData.message });
      console.log("Broadcasted:", parsedData.message);
    });

    ws.on("close", () => {
      console.log("Client disconnected.");
      clients.splice(clients.indexOf(ws), 1);
    });
  });

  console.log("WebSocket server started on port 3001.");
};

const broadcastLatestStories = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM stories ORDER BY timestamp DESC LIMIT 10"
    );
    broadcastToClients({ type: "latest_stories", stories: rows });
  } catch (error) {
    console.error("Error fetching latest stories for broadcast:", error);
  }
};

// API to get stories
app.get("/api/stories", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM stories ORDER BY timestamp DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching stories from database:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});

startWebSocketServer();

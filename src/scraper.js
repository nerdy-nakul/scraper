// src/scraper.js
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("./database");
const { broadcastToClients } = require("./websocket");

const HN_URL = "https://news.ycombinator.com/";

async function scrapeHackerNews() {
  const pool = db.getPool();
  try {
    const response = await axios.get(HN_URL);
    const html = response.data;
    const $ = cheerio.load(html);

    const stories = [];

    $(".athing submission").each((i, element) => {
      const $element = $(element);
      const $subtext = $element.next(".subline");

      const id = $element.attr("id");
      const title = $element.find(".titleline a").first().text().trim();
      const url = $element.find(".titleline a").first().attr("href");
      const author = $subtext.find(".hnuser").text().trim();
      const points = parseInt($subtext.find(".score").text()) || 0;
      const commentsText = $subtext.find("a").last().text().trim();
      // const comments = parseInt(commentsText) || 0;
      const timeAgo = $subtext.find(".age").attr("title");
      const timestamp = timeAgo ? new Date(timeAgo) : new Date();

      console.log(`Scraped story: ${title}`);

      stories.push({
        id: parseInt(id),
        title,
        url,
        author,
        points,
        // comments,
        timestamp,
      });
    });

    for (const story of stories) {
      try {
        const [existing] = await pool.execute(
          "SELECT id FROM stories WHERE id = ?",
          [story.id]
        );

        if (existing.length === 0) {
          await pool.execute(
            `INSERT INTO stories 
                        (id, title, url, author, score, timestamp) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              story.id,
              story.title,
              story.url,
              story.author,
              story.points,
              // story.comments,
              story.timestamp,
            ]
          );

          // Broadcast new story to WebSocket clients
          broadcastToClients({
            type: "newStory",
            story: {
              id: story.id,
              title: story.title,
              url: story.url,
              author: story.author,
              points: story.points,
              // comments: story.comments,
              timestamp: story.timestamp,
            },
          });

          console.log(`Successfully inserted story: ${story.title}`);
        }
      } catch (error) {
        console.error(`Error inserting story ${story.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error scraping Hacker News:", error.message);
  }
}

module.exports = { scrapeHackerNews };

// src/websocket.js
const WebSocket = require("ws");
let wss = null;
const clients = new Set();

function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws) => {
    console.log("New client connected");
    clients.add(ws);

    // Send initial stats when client connects
    try {
      const db = require("./database");
      const pool = db.getPool();
      const [rows] = await pool.execute(`
                SELECT COUNT(*) as count 
                FROM stories 
                WHERE created_at >= NOW() - INTERVAL 5 MINUTE
            `);

      ws.send(
        JSON.stringify({
          type: "stats",
          storiesLast5Min: rows[0].count,
        })
      );
    } catch (error) {
      console.error("Error sending initial stats:", error);
    }

    ws.on("close", () => {
      console.log("Client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  return wss;
}

function broadcastToClients(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function getConnectedClientsCount() {
  return clients.size;
}

module.exports = {
  initializeWebSocket,
  broadcastToClients,
  getConnectedClientsCount,
};

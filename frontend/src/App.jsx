import React, { useEffect, useState } from "react";

const WebSocketClient = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      setConnectionStatus("Connected");
    };

    socket.onmessage = (event) => {
      console.log("Message received:", event.data);
      const data = JSON.parse(event.data);

      // Handle received data
      if (data.type === "latest_stories") {
        setMessages(data.stories);
      }

      if (data.type === "recent_story_count") {
        console.log("Recent story count:", data.count);
        setUpdate(data.count);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Error");
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setConnectionStatus("Disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h1>WebSocket Stories</h1>
      <p>Status: {connectionStatus}</p>
      <p>News Published in last 5 minutes: {update}</p>
      <ul>
        {messages.map((story, index) => (
          <li key={index}>
            <a href={story.url} target="_blank" rel="noopener noreferrer">
              {story.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WebSocketClient;

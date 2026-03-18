import React, { useEffect, useRef } from "react";

const ReactionTest = () => {
  const wsRef = useRef(null);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL;

    // Create WebSocket connection
    const ws = new WebSocket(`${WS_URL}/ws/reactions/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to Django WebSocket");

      ws.send(
        JSON.stringify({
          message: "Hello Redis!",
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("💬 Message from server:", data);
      } catch (err) {
        console.log("💬 Raw message:", event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("⚠️ WebSocket Error:", error);
    };

    ws.onclose = (event) => {
      console.log("❌ WebSocket Disconnected", event.reason);
    };

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-5 text-center">
      <h2 className="text-xl font-semibold">🎯 Reaction WebSocket Test</h2>
      <p className="text-gray-600">
        Check your browser console for WebSocket messages!
      </p>
    </div>
  );
};

export default ReactionTest;
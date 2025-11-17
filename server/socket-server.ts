// server/socket-server.ts

import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 4000;

// Tạo HTTP server độc lập
const httpServer = createServer();

// Tạo Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Cho phép mọi domain kết nối
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Nhận event message
  socket.on("message", (msg) => {
    console.log("📩 Received:", msg);
    io.emit("message", msg); // Phát lại cho tất cả client
  });

  // Khi client disconnect
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});
io.on("connection", (socket) => {
  console.log("👤 Client connected:", socket.id);

  socket.on("new-comment", (data) => {
    console.log("🆕 New comment received:", data);

    // Broadcast tới tất cả client (kể cả người gửi)
    io.emit("new-comment", data);
  });
});


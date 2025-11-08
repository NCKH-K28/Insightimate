import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Khi client gửi comment
  socket.on("new-comment", (data) => {
    console.log("💬 Comment received:", data);
    // Gửi lại cho tất cả client kể cả người gửi
    io.emit("receive-comment", data);
    console.log("📢 Đã broadcast comment tới tất cả client");
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

server.listen(4000, () => console.log("🚀 Socket.IO server running on port 4000"));

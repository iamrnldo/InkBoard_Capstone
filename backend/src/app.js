const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const passport = require("./config/passport");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/boards", require("./routes/board"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Socket.io for real-time collaboration
const boardRooms = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-board", ({ boardId, userId, username }) => {
    socket.join(`board-${boardId}`);
    if (!boardRooms.has(boardId)) boardRooms.set(boardId, new Map());
    boardRooms
      .get(boardId)
      .set(socket.id, { userId, username, socketId: socket.id });

    const users = Array.from(boardRooms.get(boardId).values());
    io.to(`board-${boardId}`).emit("users-update", users);
    socket.to(`board-${boardId}`).emit("user-joined", { userId, username });
  });

  socket.on("canvas-update", ({ boardId, elements, appState }) => {
    socket
      .to(`board-${boardId}`)
      .emit("canvas-update", { elements, appState, from: socket.id });
  });

  socket.on("cursor-move", ({ boardId, x, y, userId, username }) => {
    socket
      .to(`board-${boardId}`)
      .emit("cursor-move", { x, y, userId, username, socketId: socket.id });
  });

  socket.on("element-lock", ({ boardId, elementId, userId }) => {
    socket.to(`board-${boardId}`).emit("element-locked", { elementId, userId });
  });

  socket.on("element-unlock", ({ boardId, elementId }) => {
    socket.to(`board-${boardId}`).emit("element-unlocked", { elementId });
  });

  socket.on("disconnect", () => {
    boardRooms.forEach((users, boardId) => {
      if (users.has(socket.id)) {
        const user = users.get(socket.id);
        users.delete(socket.id);
        if (users.size === 0) boardRooms.delete(boardId);
        else {
          io.to(`board-${boardId}`).emit(
            "users-update",
            Array.from(users.values()),
          );
          io.to(`board-${boardId}`).emit("user-left", { userId: user.userId });
        }
      }
    });
    console.log("Socket disconnected:", socket.id);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Inkboard server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
});

module.exports = { app, io };

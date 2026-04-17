const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const passport = require("./config/passport");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
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

// ── Auto Migration (runs on startup in production) ────────
async function autoMigrate() {
  const { pool } = require("./config/database");
  try {
    console.log("🔄 Running database migration...");
    const sql = fs.readFileSync(
      path.join(__dirname, "migrations/init.sql"),
      "utf8",
    );
    const client = await pool.connect();
    await client.query(sql);

    // Create super admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL || "admin@inkboard.app";
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail],
    );

    if (existing.rows.length === 0) {
      const passwordHash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "Admin@123456",
        12,
      );
      const userId = uuidv4();
      const adminId = uuidv4();

      await client.query(
        `INSERT INTO users (id, username, email, password_hash, email_verified, plan, created_at)
         VALUES ($1, $2, $3, $4, true, 'premium', NOW())`,
        [
          userId,
          process.env.ADMIN_USERNAME || "superadmin",
          adminEmail,
          passwordHash,
        ],
      );

      await client.query(
        `INSERT INTO admins (id, user_id, role, permissions, invitation_accepted, is_active, created_at)
         VALUES ($1, $2, 'super_admin', '["all"]', true, true, NOW())`,
        [adminId, userId],
      );

      console.log("✅ Super admin created:", adminEmail);
    } else {
      console.log("ℹ️  Admin already exists, skipping...");
    }

    client.release();
    console.log("✅ Migration completed successfully");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    // Don't exit - app can still run
  }
}

// Run migration before starting server
autoMigrate();

// ── Middleware ─────────────────────────────────────────────
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

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/boards", require("./routes/board"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", require("./routes/admin"));

// ── Health check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

// ── Socket.io ──────────────────────────────────────────────
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
        if (users.size === 0) {
          boardRooms.delete(boardId);
        } else {
          io.to(`board-${boardId}`).emit(
            "users-update",
            Array.from(users.values()),
          );
          io.to(`board-${boardId}`).emit("user-left", {
            userId: user.userId,
          });
        }
      }
    });
    console.log("Socket disconnected:", socket.id);
  });
});

// ── Error handlers ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Inkboard server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
});

module.exports = { app, io };

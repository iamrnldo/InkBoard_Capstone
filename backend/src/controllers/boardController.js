// backend/src/controllers/boardController.js
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const PLAN_LIMITS = {
  lite: { boards: 1, share_access: false, share_view: true },
  pro: { boards: 10, share_access: true, share_view: true },
  premium: { boards: -1, share_access: true, share_view: true },
};

/* ─────────────────────────────────────────────────────────────
   Multer — thumbnail upload
───────────────────────────────────────────────────────────── */
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/thumbnails");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // thumb_<boardId>_<timestamp>.jpg — satu board satu nama file (overwrite lama)
    cb(null, `thumb_${req.params.id}_${Date.now()}.jpg`);
  },
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Images only"));
    }
    cb(null, true);
  },
});

exports.uploadThumbnailMiddleware = thumbnailUpload.single("thumbnail");

/* ─────────────────────────────────────────────────────────────
   GET /boards
───────────────────────────────────────────────────────────── */
exports.getBoards = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", archived = false } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT b.*, 
        COALESCE(json_agg(bc.user_id) FILTER (WHERE bc.user_id IS NOT NULL), '[]') as collaborator_ids
      FROM boards b
      LEFT JOIN board_collaborators bc ON b.id = bc.board_id
      WHERE b.user_id = $1 AND b.is_deleted = false AND b.is_archived = $2
    `;
    const params = [req.user.id, archived === "true"];

    if (search) {
      queryText += ` AND (b.title ILIKE $3 OR b.description ILIKE $3)`;
      params.push(`%${search}%`);
    }

    queryText += ` GROUP BY b.id ORDER BY b.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    const countResult = await query(
      "SELECT COUNT(*) FROM boards WHERE user_id = $1 AND is_deleted = false AND is_archived = $2",
      [req.user.id, archived === "true"],
    );

    res.json({
      success: true,
      data: {
        boards: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get boards error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /boards
───────────────────────────────────────────────────────────── */
exports.createBoard = async (req, res) => {
  try {
    const {
      title = "Untitled Board",
      description = "",
      canvas_data,
    } = req.body;
    const userPlan = req.user.plan;
    const planLimit = PLAN_LIMITS[userPlan];

    if (planLimit.boards !== -1) {
      const boardCount = await query(
        "SELECT COUNT(*) FROM boards WHERE user_id = $1 AND is_deleted = false AND is_archived = false",
        [req.user.id],
      );
      if (parseInt(boardCount.rows[0].count) >= planLimit.boards) {
        return res.status(403).json({
          success: false,
          message: `Your ${userPlan} plan allows maximum ${planLimit.boards} board(s). Upgrade to create more.`,
          upgradeRequired: true,
        });
      }
    }

    const boardId = uuidv4();
    const shareToken = crypto.randomBytes(16).toString("hex");
    const defaultCanvasData = canvas_data || {
      elements: [],
      appState: { viewBackgroundColor: "#ffffff" },
      files: {},
    };

    const result = await query(
      `INSERT INTO boards (id, user_id, title, description, canvas_data, share_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        boardId,
        req.user.id,
        title,
        description,
        JSON.stringify(defaultCanvasData),
        shareToken,
      ],
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at) VALUES ($1, 'board_created', 'board', $2, $3, NOW())`,
      [req.user.id, boardId, JSON.stringify({ title })],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Create board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /boards/:id
───────────────────────────────────────────────────────────── */
exports.getBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT * FROM boards WHERE id = $1 AND is_deleted = false",
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    const board = result.rows[0];
    const isOwner = board.user_id === req.user?.id;

    if (!isOwner) {
      const collaboratorCheck = await query(
        "SELECT * FROM board_collaborators WHERE board_id = $1 AND user_id = $2",
        [id, req.user?.id],
      );
      if (collaboratorCheck.rows.length === 0 && !board.is_public) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    await query("UPDATE boards SET last_accessed = NOW() WHERE id = $1", [id]);

    const collaborators = await query(
      `SELECT u.id, u.username, u.email, u.avatar_url, bc.permission 
       FROM board_collaborators bc JOIN users u ON bc.user_id = u.id WHERE bc.board_id = $1`,
      [id],
    );

    res.json({
      success: true,
      data: { ...board, collaborators: collaborators.rows },
    });
  } catch (error) {
    console.error("Get board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   PUT /boards/:id
───────────────────────────────────────────────────────────── */
exports.updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, canvas_data, is_public, tags } = req.body;

    const boardCheck = await query(
      "SELECT * FROM boards WHERE id = $1 AND is_deleted = false",
      [id],
    );
    if (boardCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    const board = boardCheck.rows[0];
    let hasPermission = board.user_id === req.user.id;

    if (!hasPermission) {
      const collabCheck = await query(
        "SELECT * FROM board_collaborators WHERE board_id = $1 AND user_id = $2 AND permission IN ('edit', 'admin')",
        [id, req.user.id],
      );
      hasPermission = collabCheck.rows.length > 0;
    }

    if (!hasPermission) {
      return res
        .status(403)
        .json({ success: false, message: "No edit permission" });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (canvas_data !== undefined) {
      updates.push(`canvas_data = $${paramCount++}`);
      values.push(JSON.stringify(canvas_data));
    }
    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(is_public);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(tags);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE boards SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /boards/:id
───────────────────────────────────────────────────────────── */
exports.deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "UPDATE boards SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found or unauthorized" });
    }
    res.json({ success: true, message: "Board deleted" });
  } catch (error) {
    console.error("Delete board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /boards/:id/share
───────────────────────────────────────────────────────────── */
exports.shareBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { allow_edit = false } = req.body;
    const planLimit = PLAN_LIMITS[req.user.plan];

    const boardCheck = await query(
      "SELECT * FROM boards WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    if (boardCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    if (allow_edit && !planLimit.share_access) {
      return res.status(403).json({
        success: false,
        message: "Share with edit access requires Pro or Premium plan",
        upgradeRequired: true,
      });
    }

    const shareToken = crypto.randomBytes(16).toString("hex");
    const result = await query(
      "UPDATE boards SET is_public = true, share_token = $1, allow_edit = $2, updated_at = NOW() WHERE id = $3 RETURNING share_token, allow_edit",
      [shareToken, allow_edit, id],
    );

    res.json({
      success: true,
      data: {
        shareUrl: `${process.env.FRONTEND_URL}/board/share/${result.rows[0].share_token}`,
        shareToken: result.rows[0].share_token,
        allowEdit: result.rows[0].allow_edit,
      },
    });
  } catch (error) {
    console.error("Share board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /boards/share/:token
───────────────────────────────────────────────────────────── */
exports.getSharedBoard = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await query(
      `SELECT b.*, u.username as owner_username, u.avatar_url as owner_avatar
       FROM boards b JOIN users u ON b.user_id = u.id
       WHERE b.share_token = $1 AND b.is_public = true AND b.is_deleted = false`,
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Shared board not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Get shared board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /boards/:id/collaborators
───────────────────────────────────────────────────────────── */
exports.addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission = "view" } = req.body;
    const planLimit = PLAN_LIMITS[req.user.plan];

    if (!planLimit.share_access) {
      return res.status(403).json({
        success: false,
        message: "Collaboration requires Pro or Premium plan",
        upgradeRequired: true,
      });
    }

    const boardCheck = await query(
      "SELECT * FROM boards WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    if (boardCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    const userResult = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const collaboratorId = userResult.rows[0].id;
    if (collaboratorId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot add yourself as collaborator",
      });
    }

    await query(
      `INSERT INTO board_collaborators (id, board_id, user_id, permission, invited_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (board_id, user_id) DO UPDATE SET permission = $4`,
      [uuidv4(), id, collaboratorId, permission, req.user.id],
    );

    res.json({ success: true, message: "Collaborator added successfully" });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /boards/:id/collaborators/:userId
───────────────────────────────────────────────────────────── */
exports.removeCollaborator = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const boardCheck = await query(
      "SELECT * FROM boards WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    if (boardCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    await query(
      "DELETE FROM board_collaborators WHERE board_id = $1 AND user_id = $2",
      [id, userId],
    );
    res.json({ success: true, message: "Collaborator removed" });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /boards/:id/duplicate
───────────────────────────────────────────────────────────── */
exports.duplicateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const userPlan = req.user.plan;
    const planLimit = PLAN_LIMITS[userPlan];

    if (planLimit.boards !== -1) {
      const boardCount = await query(
        "SELECT COUNT(*) FROM boards WHERE user_id = $1 AND is_deleted = false",
        [req.user.id],
      );
      if (parseInt(boardCount.rows[0].count) >= planLimit.boards) {
        return res.status(403).json({
          success: false,
          message: "Board limit reached",
          upgradeRequired: true,
        });
      }
    }

    const original = await query("SELECT * FROM boards WHERE id = $1", [id]);
    if (original.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    const board = original.rows[0];
    const newId = uuidv4();
    const newShareToken = crypto.randomBytes(16).toString("hex");

    const result = await query(
      `INSERT INTO boards (id, user_id, title, description, canvas_data, share_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        newId,
        req.user.id,
        `${board.title} (Copy)`,
        board.description,
        board.canvas_data,
        newShareToken,
      ],
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Duplicate board error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /boards/:id/thumbnail
   Upload & simpan thumbnail hasil capture canvas
───────────────────────────────────────────────────────────── */
exports.uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const { id } = req.params;

    // Hanya owner yang bisa update thumbnail
    const boardCheck = await query(
      "SELECT * FROM boards WHERE id = $1 AND user_id = $2 AND is_deleted = false",
      [id, req.user.id],
    );
    if (boardCheck.rows.length === 0) {
      // Hapus file yang sudah ter-upload karena tidak authorized
      fs.unlink(req.file.path, () => {});
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });
    }

    // Hapus file thumbnail lama agar disk tidak penuh
    const oldUrl = boardCheck.rows[0].thumbnail_url;
    if (oldUrl && oldUrl.includes("/uploads/thumbnails/")) {
      const oldFile = path.join(
        __dirname,
        "../../uploads/thumbnails",
        path.basename(oldUrl),
      );
      fs.unlink(oldFile, () => {}); // fire-and-forget
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const thumbnailUrl = `${backendUrl}/uploads/thumbnails/${req.file.filename}`;

    await query(
      "UPDATE boards SET thumbnail_url = $1, updated_at = NOW() WHERE id = $2",
      [thumbnailUrl, id],
    );

    res.json({ success: true, data: { thumbnail_url: thumbnailUrl } });
  } catch (error) {
    console.error("Upload thumbnail error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

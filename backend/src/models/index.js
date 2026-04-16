const { query, getClient, pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// ============================================================
// USER MODEL
// ============================================================
const UserModel = {
  /**
   * Find user by ID
   */
  findById: async (id) => {
    const result = await query(
      `SELECT id, username, email, avatar_url, plan, plan_expires_at,
              is_active, email_verified, oauth_provider, preferences,
              created_at, last_login, updated_at
       FROM users WHERE id = $1`,
      [id],
    );
    return result.rows[0] || null;
  },

  /**
   * Find user by email
   */
  findByEmail: async (email) => {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
  },

  /**
   * Find user by username
   */
  findByUsername: async (username) => {
    const result = await query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Find user by OAuth provider and ID
   */
  findByOAuth: async (provider, oauthId) => {
    const result = await query(
      "SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2",
      [provider, oauthId],
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new user
   */
  create: async ({
    username,
    email,
    passwordHash = null,
    oauthProvider = null,
    oauthId = null,
    avatarUrl = null,
    emailVerified = false,
    emailVerificationToken = null,
    emailVerificationExpires = null,
    plan = "lite",
  }) => {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO users (
         id, username, email, password_hash, oauth_provider, oauth_id,
         avatar_url, email_verified, email_verification_token,
         email_verification_expires, plan, created_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       RETURNING *`,
      [
        id,
        username,
        email,
        passwordHash,
        oauthProvider,
        oauthId,
        avatarUrl,
        emailVerified,
        emailVerificationToken,
        emailVerificationExpires,
        plan,
      ],
    );
    return result.rows[0];
  },

  /**
   * Update user fields dynamically
   */
  update: async (id, fields = {}) => {
    const allowed = [
      "username",
      "email",
      "password_hash",
      "avatar_url",
      "email_verified",
      "email_verification_token",
      "email_verification_expires",
      "password_reset_token",
      "password_reset_expires",
      "plan",
      "plan_expires_at",
      "is_active",
      "last_login",
      "preferences",
      "oauth_provider",
      "oauth_id",
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  /**
   * Soft delete (deactivate) user
   */
  deactivate: async (id) => {
    const result = await query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rows[0] || null;
  },

  /**
   * Check if email or username is taken
   */
  exists: async (email, username) => {
    const result = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    return result.rows.length > 0;
  },

  /**
   * Update last login timestamp
   */
  updateLastLogin: async (id) => {
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [id]);
  },

  /**
   * Get all users with pagination and filters (admin)
   */
  findAll: async ({
    page = 1,
    limit = 20,
    search = "",
    plan = "",
    status = "",
    excludeAdmins = true,
  } = {}) => {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let paramCount = 1;

    if (excludeAdmins) {
      conditions.push(
        `u.id NOT IN (SELECT user_id FROM admins WHERE user_id IS NOT NULL)`,
      );
    }

    if (search) {
      conditions.push(
        `(u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`,
      );
      params.push(`%${search}%`);
      paramCount++;
    }

    if (plan) {
      conditions.push(`u.plan = $${paramCount++}`);
      params.push(plan);
    }

    if (status === "active") conditions.push("u.is_active = true");
    else if (status === "inactive") conditions.push("u.is_active = false");

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataParams = [...params, limit, offset];
    const result = await query(
      `SELECT u.id, u.username, u.email, u.plan, u.plan_expires_at,
              u.is_active, u.avatar_url, u.oauth_provider, u.email_verified,
              u.created_at, u.last_login,
              (SELECT COUNT(*) FROM boards WHERE user_id = u.id AND is_deleted = false) as board_count
       FROM users u ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      dataParams,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params,
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  /**
   * Downgrade expired plans to lite
   */
  downgradeExpiredPlans: async () => {
    const result = await query(
      `UPDATE users
       SET plan = 'lite', plan_expires_at = NULL, updated_at = NOW()
       WHERE plan != 'lite' AND plan_expires_at IS NOT NULL AND plan_expires_at < NOW()
       RETURNING id, email, plan`,
    );
    return result.rows;
  },
};

// ============================================================
// BOARD MODEL
// ============================================================
const BoardModel = {
  /**
   * Find board by ID (not deleted)
   */
  findById: async (id) => {
    const result = await query(
      "SELECT * FROM boards WHERE id = $1 AND is_deleted = false",
      [id],
    );
    return result.rows[0] || null;
  },

  /**
   * Find board by share token (public)
   */
  findByShareToken: async (token) => {
    const result = await query(
      `SELECT b.*, u.username AS owner_username, u.avatar_url AS owner_avatar
       FROM boards b
       JOIN users u ON b.user_id = u.id
       WHERE b.share_token = $1 AND b.is_public = true AND b.is_deleted = false`,
      [token],
    );
    return result.rows[0] || null;
  },

  /**
   * Get boards for a user with pagination
   */
  findByUser: async (
    userId,
    { page = 1, limit = 20, search = "", archived = false } = {},
  ) => {
    const offset = (page - 1) * limit;
    const params = [userId, archived];
    let queryText = `
      SELECT b.*,
        COALESCE(
          json_agg(bc.user_id) FILTER (WHERE bc.user_id IS NOT NULL), '[]'
        ) AS collaborator_ids
      FROM boards b
      LEFT JOIN board_collaborators bc ON b.id = bc.board_id
      WHERE b.user_id = $1 AND b.is_deleted = false AND b.is_archived = $2
    `;

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (b.title ILIKE $${params.length} OR b.description ILIKE $${params.length})`;
    }

    params.push(limit, offset);
    queryText += ` GROUP BY b.id ORDER BY b.updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(queryText, params);

    const countResult = await query(
      "SELECT COUNT(*) FROM boards WHERE user_id = $1 AND is_deleted = false AND is_archived = $2",
      [userId, archived],
    );

    return {
      boards: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  /**
   * Count active boards for user (for plan limit check)
   */
  countByUser: async (userId) => {
    const result = await query(
      "SELECT COUNT(*) FROM boards WHERE user_id = $1 AND is_deleted = false AND is_archived = false",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Create a new board
   */
  create: async ({
    userId,
    title = "Untitled Board",
    description = "",
    canvasData,
    shareToken,
  }) => {
    const id = uuidv4();
    const defaultCanvas = canvasData || {
      elements: [],
      appState: { viewBackgroundColor: "#ffffff" },
      files: {},
    };

    const result = await query(
      `INSERT INTO boards (id, user_id, title, description, canvas_data, share_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        id,
        userId,
        title,
        description,
        JSON.stringify(defaultCanvas),
        shareToken,
      ],
    );
    return result.rows[0];
  },

  /**
   * Update board fields dynamically
   */
  update: async (id, fields = {}) => {
    const allowed = [
      "title",
      "description",
      "canvas_data",
      "is_public",
      "share_token",
      "allow_edit",
      "tags",
      "thumbnail_url",
      "is_archived",
      "is_deleted",
      "last_accessed",
      "frame_settings",
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${paramCount++}`);
        // Stringify JSONB fields
        if (["canvas_data", "frame_settings"].includes(key)) {
          values.push(
            typeof value === "string" ? value : JSON.stringify(value),
          );
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) return null;

    updates.push("updated_at = NOW()");
    values.push(id);

    const result = await query(
      `UPDATE boards SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  /**
   * Soft delete a board
   */
  softDelete: async (id, userId) => {
    const result = await query(
      "UPDATE boards SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    return result.rows[0] || null;
  },

  /**
   * Get collaborators of a board
   */
  getCollaborators: async (boardId) => {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.avatar_url, bc.permission
       FROM board_collaborators bc
       JOIN users u ON bc.user_id = u.id
       WHERE bc.board_id = $1`,
      [boardId],
    );
    return result.rows;
  },

  /**
   * Add or update a collaborator
   */
  upsertCollaborator: async (boardId, userId, permission, invitedBy) => {
    const result = await query(
      `INSERT INTO board_collaborators (id, board_id, user_id, permission, invited_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (board_id, user_id) DO UPDATE SET permission = $4
       RETURNING *`,
      [uuidv4(), boardId, userId, permission, invitedBy],
    );
    return result.rows[0];
  },

  /**
   * Remove a collaborator
   */
  removeCollaborator: async (boardId, userId) => {
    await query(
      "DELETE FROM board_collaborators WHERE board_id = $1 AND user_id = $2",
      [boardId, userId],
    );
  },

  /**
   * Check if user is a collaborator with given permission
   */
  checkCollaborator: async (boardId, userId, permissions = []) => {
    let queryText =
      "SELECT * FROM board_collaborators WHERE board_id = $1 AND user_id = $2";
    const params = [boardId, userId];

    if (permissions.length > 0) {
      queryText += ` AND permission = ANY($3)`;
      params.push(permissions);
    }

    const result = await query(queryText, params);
    return result.rows[0] || null;
  },

  /**
   * Get all boards with pagination (admin)
   */
  findAllAdmin: async ({ page = 1, limit = 20, search = "" } = {}) => {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "WHERE b.is_deleted = false";

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (b.title ILIKE $1 OR u.username ILIKE $1)`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT b.id, b.title, b.is_public, b.created_at, b.updated_at,
              u.username AS owner_username, u.email AS owner_email, u.plan AS owner_plan
       FROM boards b
       JOIN users u ON b.user_id = u.id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM boards b JOIN users u ON b.user_id = u.id ${whereClause}`,
      params.slice(0, -2),
    );

    return {
      boards: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },
};

// ============================================================
// ADMIN MODEL
// ============================================================
const AdminModel = {
  /**
   * Find admin record by user ID
   */
  findByUserId: async (userId) => {
    const result = await query(
      `SELECT a.*, u.email, u.username, u.avatar_url
       FROM admins a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1 AND a.is_active = true AND a.invitation_accepted = true`,
      [userId],
    );
    return result.rows[0] || null;
  },

  /**
   * Find admin by invitation token
   */
  findByInvitationToken: async (token) => {
    const result = await query(
      `SELECT a.*, u.email, u.username
       FROM admins a
       JOIN users u ON a.user_id = u.id
       WHERE a.invitation_token = $1
         AND a.invitation_expires > NOW()
         AND a.invitation_accepted = false`,
      [token],
    );
    return result.rows[0] || null;
  },

  /**
   * Find admin by ID
   */
  findById: async (id) => {
    const result = await query("SELECT * FROM admins WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  /**
   * Get all admins with invited-by info
   */
  findAll: async () => {
    const result = await query(
      `SELECT a.id, a.role, a.permissions, a.is_active,
              a.invitation_accepted, a.created_at,
              u.username, u.email, u.avatar_url,
              inv.username AS invited_by_username
       FROM admins a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN admins ia ON a.invited_by = ia.id
       LEFT JOIN users inv ON ia.user_id = inv.id
       ORDER BY a.created_at DESC`,
    );
    return result.rows;
  },

  /**
   * Create an admin invitation record
   */
  create: async ({
    userId,
    role,
    permissions,
    invitedBy,
    invitationToken,
    invitationExpires,
  }) => {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO admins (id, user_id, role, permissions, invited_by,
         invitation_token, invitation_expires, invitation_accepted, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, NOW())
       RETURNING *`,
      [
        id,
        userId,
        role,
        JSON.stringify(permissions),
        invitedBy,
        invitationToken,
        invitationExpires,
      ],
    );
    return result.rows[0];
  },

  /**
   * Accept an invitation
   */
  acceptInvitation: async (id) => {
    const result = await query(
      `UPDATE admins
       SET invitation_accepted = true, is_active = true,
           invitation_token = NULL, invitation_expires = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return result.rows[0] || null;
  },

  /**
   * Update admin record
   */
  update: async (id, fields = {}) => {
    const allowed = ["role", "permissions", "is_active"];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(key === "permissions" ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) return null;

    updates.push("updated_at = NOW()");
    values.push(id);

    const result = await query(
      `UPDATE admins SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  /**
   * Delete admin record
   */
  delete: async (id) => {
    await query("DELETE FROM admins WHERE id = $1", [id]);
  },

  /**
   * Check if a user is already an admin
   */
  existsByUserId: async (userId) => {
    const result = await query("SELECT id FROM admins WHERE user_id = $1", [
      userId,
    ]);
    return result.rows.length > 0;
  },
};

// ============================================================
// SUBSCRIPTION MODEL
// ============================================================
const SubscriptionModel = {
  /**
   * Find subscription by order ID
   */
  findByOrderId: async (orderId) => {
    const result = await query(
      "SELECT * FROM subscriptions WHERE order_id = $1",
      [orderId],
    );
    return result.rows[0] || null;
  },

  /**
   * Find active subscription for user
   */
  findActiveByUser: async (userId) => {
    const result = await query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new subscription
   */
  create: async ({ userId, plan, orderId, amount, paymentMethod = "qris" }) => {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO subscriptions (id, user_id, plan, status, order_id, amount, payment_method, created_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, NOW())
       RETURNING *`,
      [id, userId, plan, orderId, amount, paymentMethod],
    );
    return result.rows[0];
  },

  /**
   * Activate a subscription
   */
  activate: async (orderId, expiresAt) => {
    const result = await query(
      `UPDATE subscriptions
       SET status = 'active', starts_at = NOW(), expires_at = $1, updated_at = NOW()
       WHERE order_id = $2
       RETURNING *`,
      [expiresAt, orderId],
    );
    return result.rows[0] || null;
  },

  /**
   * Update subscription status
   */
  updateStatus: async (orderId, status) => {
    const result = await query(
      "UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *",
      [status, orderId],
    );
    return result.rows[0] || null;
  },

  /**
   * Get subscriptions for a user
   */
  findByUser: async (userId) => {
    const result = await query(
      "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return result.rows;
  },
};

// ============================================================
// PAYMENT MODEL
// ============================================================
const PaymentModel = {
  /**
   * Find payment by order ID
   */
  findByOrderId: async (orderId) => {
    const result = await query("SELECT * FROM payments WHERE order_id = $1", [
      orderId,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Create a new payment record
   */
  create: async ({
    userId,
    subscriptionId,
    orderId,
    amount,
    fee = 0,
    totalPayment,
    paymentMethod = "qris",
    paymentNumber = null,
    expiredAt = null,
    pakasirData = null,
  }) => {
    const result = await query(
      `INSERT INTO payments (
         id, user_id, subscription_id, order_id, amount, fee, total_payment,
         payment_method, payment_number, status, expired_at, pakasir_data, created_at
       ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, NOW())
       RETURNING *`,
      [
        userId,
        subscriptionId,
        orderId,
        amount,
        fee,
        totalPayment,
        paymentMethod,
        paymentNumber,
        expiredAt,
        pakasirData ? JSON.stringify(pakasirData) : null,
      ],
    );
    return result.rows[0];
  },

  /**
   * Mark payment as paid
   */
  markPaid: async (orderId) => {
    const result = await query(
      "UPDATE payments SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE order_id = $1 RETURNING *",
      [orderId],
    );
    return result.rows[0] || null;
  },

  /**
   * Update payment status
   */
  updateStatus: async (orderId, status) => {
    const result = await query(
      "UPDATE payments SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *",
      [status, orderId],
    );
    return result.rows[0] || null;
  },

  /**
   * Get payment history for user
   */
  findByUser: async (userId, limit = 20) => {
    const result = await query(
      `SELECT p.*, s.plan
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  /**
   * Get all payments (admin) with pagination
   */
  findAllAdmin: async ({ page = 1, limit = 20, status = "" } = {}) => {
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "";

    if (status) {
      whereClause = "WHERE p.status = $1";
      params.push(status);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT p.*, s.plan, u.username, u.email
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM payments p ${whereClause}`,
      status ? [status] : [],
    );

    return {
      payments: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },
};

// ============================================================
// AI USAGE MODEL
// ============================================================
const AIUsageModel = {
  /**
   * Log an AI usage event
   */
  create: async ({
    userId,
    boardId,
    toolType,
    prompt,
    result,
    tokensUsed = 0,
  }) => {
    const res = await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        userId,
        boardId || null,
        toolType,
        prompt,
        typeof result === "string" ? result : JSON.stringify(result),
        tokensUsed,
      ],
    );
    return res.rows[0];
  },

  /**
   * Get usage summary grouped by tool for a user
   */
  getSummaryByUser: async (userId) => {
    const result = await query(
      `SELECT tool_type, COUNT(*) AS count, SUM(tokens_used) AS total_tokens
       FROM ai_usage
       WHERE user_id = $1
       GROUP BY tool_type`,
      [userId],
    );
    return result.rows;
  },

  /**
   * Get overall AI usage stats (admin)
   */
  getAdminStats: async () => {
    const result = await query(
      `SELECT
         COUNT(*) AS total_usage,
         COUNT(*) FILTER (WHERE tool_type = 'text_to_diagram')      AS text_to_diagram,
         COUNT(*) FILTER (WHERE tool_type = 'mermaid_to_inkboard')  AS mermaid_to_inkboard,
         COUNT(*) FILTER (WHERE tool_type = 'wireframe_to_code')    AS wireframe_to_code,
         SUM(tokens_used)                                           AS total_tokens
       FROM ai_usage`,
    );
    return result.rows[0];
  },

  /**
   * Get AI usage trend over N days (admin analytics)
   */
  getTrend: async (days = 30) => {
    const result = await query(
      `SELECT DATE(created_at) AS date, tool_type, COUNT(*) AS count
       FROM ai_usage
       WHERE created_at > NOW() - INTERVAL '${parseInt(days, 10)} days'
       GROUP BY DATE(created_at), tool_type
       ORDER BY date`,
    );
    return result.rows;
  },
};

// ============================================================
// NOTIFICATION MODEL
// ============================================================
const NotificationModel = {
  /**
   * Create a notification for a user
   */
  create: async ({
    userId,
    title,
    message,
    type = "info",
    actionUrl = null,
  }) => {
    const result = await query(
      `INSERT INTO notifications (id, user_id, title, message, type, action_url, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId, title, message, type, actionUrl],
    );
    return result.rows[0];
  },

  /**
   * Get notifications for a user (latest 20)
   */
  findByUser: async (userId, limit = 20) => {
    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
      [userId, limit],
    );
    return result.rows;
  },

  /**
   * Count unread notifications for a user
   */
  countUnread: async (userId) => {
    const result = await query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },

  /**
   * Mark a specific notification as read
   */
  markRead: async (id, userId) => {
    const result = await query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );
    return result.rows[0] || null;
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllRead: async (userId) => {
    await query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
      [userId],
    );
  },
};

// ============================================================
// ACTIVITY LOG MODEL
// ============================================================
const ActivityLogModel = {
  /**
   * Log a user or admin action
   */
  log: async ({
    userId = null,
    adminId = null,
    action,
    entityType = null,
    entityId = null,
    details = null,
    ipAddress = null,
    userAgent = null,
  }) => {
    const result = await query(
      `INSERT INTO activity_logs (
         id, user_id, admin_id, action, entity_type, entity_id,
         details, ip_address, user_agent, created_at
       ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        userId,
        adminId,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      ],
    );
    return result.rows[0];
  },

  /**
   * Get activity logs with pagination (admin)
   */
  findAll: async ({ page = 1, limit = 50 } = {}) => {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT al.*, u.username, u.email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countResult = await query("SELECT COUNT(*) FROM activity_logs");
    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  /**
   * Get activity logs for a specific user
   */
  findByUser: async (userId, limit = 20) => {
    const result = await query(
      "SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
      [userId, limit],
    );
    return result.rows;
  },
};

// ============================================================
// SITE SETTINGS MODEL
// ============================================================
const SiteSettingsModel = {
  /**
   * Get all site settings as key-value map
   */
  getAll: async () => {
    const result = await query("SELECT * FROM site_settings");
    const settings = {};
    result.rows.forEach((row) => {
      try {
        settings[row.key] =
          typeof row.value === "string" ? JSON.parse(row.value) : row.value;
      } catch {
        settings[row.key] = row.value;
      }
    });
    return settings;
  },

  /**
   * Get a single setting by key
   */
  get: async (key) => {
    const result = await query(
      "SELECT value FROM site_settings WHERE key = $1",
      [key],
    );
    if (result.rows.length === 0) return null;
    try {
      return typeof result.rows[0].value === "string"
        ? JSON.parse(result.rows[0].value)
        : result.rows[0].value;
    } catch {
      return result.rows[0].value;
    }
  },

  /**
   * Upsert a setting
   */
  set: async (key, value, updatedBy = null) => {
    const result = await query(
      `INSERT INTO site_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value), updatedBy],
    );
    return result.rows[0];
  },

  /**
   * Bulk upsert settings
   */
  setMany: async (settingsObj = {}, updatedBy = null) => {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      for (const [key, value] of Object.entries(settingsObj)) {
        await client.query(
          `INSERT INTO site_settings (key, value, updated_by, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
          [key, JSON.stringify(value), updatedBy],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

// ============================================================
// LIBRARY ITEM MODEL
// ============================================================
const LibraryItemModel = {
  /**
   * Find library item by ID
   */
  findById: async (id) => {
    const result = await query("SELECT * FROM library_items WHERE id = $1", [
      id,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Get public library items (templates)
   */
  findPublic: async ({
    page = 1,
    limit = 20,
    category = "",
    search = "",
  } = {}) => {
    const offset = (page - 1) * limit;
    const params = [true];
    let conditions = ["is_public = $1"];
    let paramCount = 2;

    if (category) {
      conditions.push(`category = $${paramCount++}`);
      params.push(category);
    }

    if (search) {
      conditions.push(
        `(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`,
      );
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    params.push(limit, offset);

    const result = await query(
      `SELECT id, title, description, thumbnail_url, category, tags, use_count, created_at
       FROM library_items ${whereClause}
       ORDER BY use_count DESC, created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM library_items ${whereClause}`,
      params.slice(0, -2),
    );

    return {
      items: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  /**
   * Get library items for a user
   */
  findByUser: async (userId) => {
    const result = await query(
      "SELECT * FROM library_items WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return result.rows;
  },

  /**
   * Create a library item
   */
  create: async ({
    userId,
    title,
    description,
    canvasData,
    thumbnailUrl,
    category,
    isPublic,
    tags,
  }) => {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO library_items (id, user_id, title, description, canvas_data, thumbnail_url, category, is_public, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        id,
        userId,
        title,
        description,
        JSON.stringify(canvasData),
        thumbnailUrl,
        category,
        isPublic,
        tags,
      ],
    );
    return result.rows[0];
  },

  /**
   * Increment use count
   */
  incrementUseCount: async (id) => {
    await query(
      "UPDATE library_items SET use_count = use_count + 1, updated_at = NOW() WHERE id = $1",
      [id],
    );
  },

  /**
   * Delete a library item
   */
  delete: async (id, userId) => {
    const result = await query(
      "DELETE FROM library_items WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    return result.rows[0] || null;
  },
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  UserModel,
  BoardModel,
  AdminModel,
  SubscriptionModel,
  PaymentModel,
  AIUsageModel,
  NotificationModel,
  ActivityLogModel,
  SiteSettingsModel,
  LibraryItemModel,
};

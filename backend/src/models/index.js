const { query, getClient } = require("../config/database");

// ============================================================
// USER MODELS
// ============================================================

const UserModel = {
  // Find user by ID
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

  // Find user by email
  findByEmail: async (email) => {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
  },

  // Find user by username
  findByUsername: async (username) => {
    const result = await query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0] || null;
  },

  // Find by OAuth provider
  findByOAuth: async (provider, oauthId) => {
    const result = await query(
      "SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2",
      [provider, oauthId],
    );
    return result.rows[0] || null;
  },

  // Create new user
  create: async ({
    id,
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
    const result = await query(
      `INSERT INTO users (
          id, username, email, password_hash, oauth_provider, oauth_id,
          avatar_url, email_verified, email_verification_token,
          email_verification_expires, plan, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
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

  // Update user fields
  update: async (id, fields) => {
    const allowedFields = [
      "username",
      "email",
      "avatar_url",
      "plan",
      "plan_expires_at",
      "is_active",
      "preferences",
      "password_hash",
      "email_verified",
      "email_verification_token",
      "email_verification_expires",
      "password_reset_token",
      "password_reset_expires",
      "oauth_provider",
      "oauth_id",
      "last_login",
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : value,
        );
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

  // Soft delete (deactivate)
  deactivate: async (id) => {
    await query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1",
      [id],
    );
  },

  // Downgrade expired plans
  downgradeExpiredPlans: async () => {
    const result = await query(
      `UPDATE users
       SET plan = 'lite', plan_expires_at = NULL, updated_at = NOW()
       WHERE plan != 'lite'
         AND plan_expires_at IS NOT NULL
         AND plan_expires_at < NOW()
       RETURNING id, email, username`,
    );
    return result.rows;
  },

  // Count total users
  count: async (filters = {}) => {
    let where = "WHERE 1=1";
    const params = [];
    let i = 1;

    if (filters.plan) {
      where += ` AND plan = $${i++}`;
      params.push(filters.plan);
    }
    if (filters.is_active !== undefined) {
      where += ` AND is_active = $${i++}`;
      params.push(filters.is_active);
    }

    const result = await query(`SELECT COUNT(*) FROM users ${where}`, params);
    return parseInt(result.rows[0].count);
  },
};

// ============================================================
// BOARD MODELS
// ============================================================

const BoardModel = {
  // Find board by ID
  findById: async (id) => {
    const result = await query(
      `SELECT b.*, u.username as owner_username, u.avatar_url as owner_avatar
       FROM boards b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND b.is_deleted = false`,
      [id],
    );
    return result.rows[0] || null;
  },

  // Find board by share token
  findByShareToken: async (token) => {
    const result = await query(
      `SELECT b.*, u.username as owner_username, u.avatar_url as owner_avatar
       FROM boards b
       JOIN users u ON b.user_id = u.id
       WHERE b.share_token = $1 AND b.is_public = true AND b.is_deleted = false`,
      [token],
    );
    return result.rows[0] || null;
  },

  // Get boards by user
  findByUser: async (
    userId,
    { limit = 20, offset = 0, search = "", archived = false } = {},
  ) => {
    const params = [userId, archived];
    let searchClause = "";

    if (search) {
      params.push(`%${search}%`);
      searchClause = `AND (b.title ILIKE $${params.length} OR b.description ILIKE $${params.length})`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT b.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', u2.id,
                    'username', u2.username,
                    'avatar_url', u2.avatar_url,
                    'permission', bc.permission
                  )
                ) FILTER (WHERE bc.user_id IS NOT NULL), '[]'
              ) as collaborators
       FROM boards b
       LEFT JOIN board_collaborators bc ON b.id = bc.board_id
       LEFT JOIN users u2 ON bc.user_id = u2.id
       WHERE b.user_id = $1
         AND b.is_deleted = false
         AND b.is_archived = $2
         ${searchClause}
       GROUP BY b.id
       ORDER BY b.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return result.rows;
  },

  // Create board
  create: async ({
    id,
    userId,
    title,
    description,
    canvasData,
    shareToken,
  }) => {
    const result = await query(
      `INSERT INTO boards (id, user_id, title, description, canvas_data, share_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, userId, title, description, JSON.stringify(canvasData), shareToken],
    );
    return result.rows[0];
  },

  // Update board
  update: async (id, fields) => {
    const allowedFields = [
      "title",
      "description",
      "canvas_data",
      "is_public",
      "share_token",
      "allow_edit",
      "tags",
      "is_archived",
      "is_deleted",
      "thumbnail_url",
      "last_accessed",
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(
          key === "canvas_data" && typeof value === "object"
            ? JSON.stringify(value)
            : value,
        );
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE boards SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  // Soft delete
  softDelete: async (id, userId) => {
    const result = await query(
      `UPDATE boards SET is_deleted = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId],
    );
    return result.rows[0] || null;
  },

  // Count boards for user
  countByUser: async (userId, excludeArchived = false) => {
    let where = "WHERE user_id = $1 AND is_deleted = false";
    if (excludeArchived) where += " AND is_archived = false";
    const result = await query(`SELECT COUNT(*) FROM boards ${where}`, [
      userId,
    ]);
    return parseInt(result.rows[0].count);
  },

  // Check user permission on board
  getUserPermission: async (boardId, userId) => {
    const boardResult = await query(
      "SELECT user_id, is_public, allow_edit FROM boards WHERE id = $1 AND is_deleted = false",
      [boardId],
    );
    if (!boardResult.rows[0]) return null;

    const board = boardResult.rows[0];

    if (board.user_id === userId) return "owner";

    const collabResult = await query(
      "SELECT permission FROM board_collaborators WHERE board_id = $1 AND user_id = $2",
      [boardId, userId],
    );
    if (collabResult.rows[0]) return collabResult.rows[0].permission;

    if (board.is_public) return board.allow_edit ? "edit" : "view";

    return null;
  },
};

// ============================================================
// SUBSCRIPTION & PAYMENT MODELS
// ============================================================

const SubscriptionModel = {
  // Find by order ID
  findByOrderId: async (orderId) => {
    const result = await query(
      "SELECT * FROM subscriptions WHERE order_id = $1",
      [orderId],
    );
    return result.rows[0] || null;
  },

  // Find active subscription for user
  findActiveByUser: async (userId) => {
    const result = await query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY expires_at DESC LIMIT 1`,
      [userId],
    );
    return result.rows[0] || null;
  },

  // Create subscription
  create: async ({ id, userId, plan, orderId, amount, paymentMethod }) => {
    const result = await query(
      `INSERT INTO subscriptions (id, user_id, plan, status, order_id, amount, payment_method, created_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, NOW())
       RETURNING *`,
      [id, userId, plan, orderId, amount, paymentMethod],
    );
    return result.rows[0];
  },

  // Activate subscription
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

  // Update status
  updateStatus: async (orderId, status) => {
    await query(
      "UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE order_id = $2",
      [status, orderId],
    );
  },
};

const PaymentModel = {
  // Find by order ID
  findByOrderId: async (orderId) => {
    const result = await query("SELECT * FROM payments WHERE order_id = $1", [
      orderId,
    ]);
    return result.rows[0] || null;
  },

  // Get payment history for user
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

  // Create payment record
  create: async ({
    userId,
    subscriptionId,
    orderId,
    amount,
    fee,
    totalPayment,
    paymentMethod,
    paymentNumber,
    expiredAt,
    pakasirData,
  }) => {
    const result = await query(
      `INSERT INTO payments (
          id, user_id, subscription_id, order_id, amount, fee,
          total_payment, payment_method, payment_number, status,
          expired_at, pakasir_data, created_at
        )
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, NOW())
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
        JSON.stringify(pakasirData),
      ],
    );
    return result.rows[0];
  },

  // Mark as paid
  markPaid: async (orderId) => {
    await query(
      `UPDATE payments
       SET status = 'paid', paid_at = NOW(), updated_at = NOW()
       WHERE order_id = $1`,
      [orderId],
    );
  },

  // Update status
  updateStatus: async (orderId, status) => {
    await query(
      "UPDATE payments SET status = $1, updated_at = NOW() WHERE order_id = $2",
      [status, orderId],
    );
  },

  // Revenue stats
  getRevenueStats: async (days = 30) => {
    const result = await query(
      `SELECT
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND created_at > NOW() - INTERVAL '${days} days'), 0) as period_revenue,
          COUNT(*) FILTER (WHERE status = 'paid') as successful_count,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count
       FROM payments`,
    );
    return result.rows[0];
  },
};

// ============================================================
// NOTIFICATION MODEL
// ============================================================

const NotificationModel = {
  // Create notification
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

  // Get by user
  findByUser: async (userId, limit = 20) => {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  // Mark as read
  markRead: async (id, userId) => {
    await query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
  },

  // Mark all as read
  markAllRead: async (userId) => {
    await query("UPDATE notifications SET is_read = true WHERE user_id = $1", [
      userId,
    ]);
  },

  // Count unread
  countUnread: async (userId) => {
    const result = await query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId],
    );
    return parseInt(result.rows[0].count);
  },
};

// ============================================================
// ACTIVITY LOG MODEL
// ============================================================

const ActivityLogModel = {
  // Create log entry
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
    try {
      await query(
        `INSERT INTO activity_logs (
            id, user_id, admin_id, action, entity_type, entity_id,
            details, ip_address, user_agent, created_at
          )
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
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
    } catch (err) {
      // Non-fatal: log to console if DB insert fails
      console.error("Activity log error:", err.message);
    }
  },

  // Get logs with pagination
  findAll: async ({
    limit = 50,
    offset = 0,
    userId = null,
    action = null,
  } = {}) => {
    const params = [];
    let where = "WHERE 1=1";
    let i = 1;

    if (userId) {
      where += ` AND al.user_id = $${i++}`;
      params.push(userId);
    }
    if (action) {
      where += ` AND al.action = $${i++}`;
      params.push(action);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT al.*, u.username, u.email
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params,
    );
    return result.rows;
  },

  // Count logs
  count: async () => {
    const result = await query("SELECT COUNT(*) FROM activity_logs");
    return parseInt(result.rows[0].count);
  },
};

// ============================================================
// AI USAGE MODEL
// ============================================================

const AIUsageModel = {
  // Log AI usage
  log: async ({ userId, boardId, toolType, prompt, result, tokensUsed }) => {
    await query(
      `INSERT INTO ai_usage (id, user_id, board_id, tool_type, prompt, result, tokens_used, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW())`,
      [
        userId,
        boardId || null,
        toolType,
        prompt,
        typeof result === "object" ? JSON.stringify(result) : result,
        tokensUsed || 0,
      ],
    );
  },

  // Get usage summary for user
  getSummaryByUser: async (userId) => {
    const result = await query(
      `SELECT tool_type, COUNT(*) as count, SUM(tokens_used) as total_tokens
       FROM ai_usage
       WHERE user_id = $1
       GROUP BY tool_type`,
      [userId],
    );
    return result.rows;
  },

  // Get total usage stats (admin)
  getAdminStats: async () => {
    const result = await query(
      `SELECT
          COUNT(*) as total_usage,
          COUNT(*) FILTER (WHERE tool_type = 'text_to_diagram') as text_to_diagram,
          COUNT(*) FILTER (WHERE tool_type = 'mermaid_to_inkboard') as mermaid_to_inkboard,
          COUNT(*) FILTER (WHERE tool_type = 'wireframe_to_code') as wireframe_to_code,
          SUM(tokens_used) as total_tokens
       FROM ai_usage`,
    );
    return result.rows[0];
  },

  // Trend data for analytics
  getTrend: async (days = 30) => {
    const result = await query(
      `SELECT DATE(created_at) as date, tool_type, COUNT(*) as count
       FROM ai_usage
       WHERE created_at > NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at), tool_type
       ORDER BY date`,
    );
    return result.rows;
  },
};

// ============================================================
// ADMIN MODEL
// ============================================================

const AdminModel = {
  // Find admin by user ID
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

  // Find admin by invitation token
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

  // Find admin by ID
  findById: async (id) => {
    const result = await query(
      `SELECT a.*, u.email, u.username, u.avatar_url
       FROM admins a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id],
    );
    return result.rows[0] || null;
  },

  // Get all admins
  findAll: async () => {
    const result = await query(
      `SELECT a.id, a.role, a.permissions, a.is_active,
              a.invitation_accepted, a.created_at,
              u.username, u.email, u.avatar_url,
              inv_u.username as invited_by_username
       FROM admins a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN admins ia ON a.invited_by = ia.id
       LEFT JOIN users inv_u ON ia.user_id = inv_u.id
       ORDER BY a.created_at DESC`,
    );
    return result.rows;
  },

  // Create admin (invitation)
  create: async ({
    id,
    userId,
    role,
    permissions,
    invitedBy,
    invitationToken,
    invitationExpires,
  }) => {
    const result = await query(
      `INSERT INTO admins (
          id, user_id, role, permissions, invited_by,
          invitation_token, invitation_expires,
          invitation_accepted, is_active, created_at
        )
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

  // Accept invitation
  acceptInvitation: async (id) => {
    await query(
      `UPDATE admins
       SET invitation_accepted = true, is_active = true,
           invitation_token = NULL, invitation_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id],
    );
  },

  // Update admin
  update: async (id, fields) => {
    const allowed = ["role", "permissions", "is_active"];
    const updates = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${i++}`);
        values.push(key === "permissions" ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE admins SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  // Remove admin
  remove: async (id) => {
    await query("DELETE FROM admins WHERE id = $1", [id]);
  },

  // Check if user is admin
  isAdmin: async (userId) => {
    const result = await query(
      `SELECT id FROM admins
       WHERE user_id = $1 AND is_active = true AND invitation_accepted = true`,
      [userId],
    );
    return result.rows.length > 0;
  },
};

// ============================================================
// SITE SETTINGS MODEL
// ============================================================

const SiteSettingsModel = {
  // Get all settings
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

  // Get single setting
  get: async (key) => {
    const result = await query(
      "SELECT value FROM site_settings WHERE key = $1",
      [key],
    );
    if (!result.rows[0]) return null;
    try {
      return JSON.parse(result.rows[0].value);
    } catch {
      return result.rows[0].value;
    }
  },

  // Set setting
  set: async (key, value, updatedBy = null) => {
    await query(
      `INSERT INTO site_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = $2, updated_by = $3, updated_at = NOW()`,
      [key, JSON.stringify(value), updatedBy],
    );
  },

  // Bulk update settings
  bulkSet: async (settingsObj, updatedBy = null) => {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      for (const [key, value] of Object.entries(settingsObj)) {
        await client.query(
          `INSERT INTO site_settings (key, value, updated_by, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (key) DO UPDATE
           SET value = $2, updated_by = $3, updated_at = NOW()`,
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
// LIBRARY MODEL
// ============================================================

const LibraryModel = {
  // Find by user and public items
  findAll: async ({
    userId,
    includePublic = true,
    limit = 50,
    offset = 0,
  } = {}) => {
    const params = [userId];
    let where = "WHERE (li.user_id = $1";
    if (includePublic) {
      where += " OR li.is_public = true";
    }
    where += ")";

    params.push(limit, offset);

    const result = await query(
      `SELECT li.*, u.username as creator_username
       FROM library_items li
       JOIN users u ON li.user_id = u.id
       ${where}
       ORDER BY li.created_at DESC
       LIMIT $2 OFFSET $3`,
      params,
    );
    return result.rows;
  },

  // Create library item
  create: async ({
    userId,
    title,
    description,
    canvasData,
    category,
    isPublic,
    tags,
  }) => {
    const result = await query(
      `INSERT INTO library_items (id, user_id, title, description, canvas_data, category, is_public, tags, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        userId,
        title,
        description || null,
        JSON.stringify(canvasData),
        category || null,
        isPublic || false,
        tags || [],
      ],
    );
    return result.rows[0];
  },

  // Increment use count
  incrementUseCount: async (id) => {
    await query(
      "UPDATE library_items SET use_count = use_count + 1 WHERE id = $1",
      [id],
    );
  },

  // Delete item
  delete: async (id, userId) => {
    await query("DELETE FROM library_items WHERE id = $1 AND user_id = $2", [
      id,
      userId,
    ]);
  },
};

// ============================================================
// BOARD COLLABORATOR MODEL
// ============================================================

const CollaboratorModel = {
  // Get collaborators for a board
  findByBoard: async (boardId) => {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.avatar_url, bc.permission, bc.created_at
       FROM board_collaborators bc
       JOIN users u ON bc.user_id = u.id
       WHERE bc.board_id = $1`,
      [boardId],
    );
    return result.rows;
  },

  // Add or update collaborator
  upsert: async ({ id, boardId, userId, permission, invitedBy }) => {
    await query(
      `INSERT INTO board_collaborators (id, board_id, user_id, permission, invited_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (board_id, user_id) DO UPDATE SET permission = $4`,
      [id, boardId, userId, permission, invitedBy],
    );
  },

  // Remove collaborator
  remove: async (boardId, userId) => {
    await query(
      "DELETE FROM board_collaborators WHERE board_id = $1 AND user_id = $2",
      [boardId, userId],
    );
  },

  // Check if user is collaborator
  isCollaborator: async (boardId, userId) => {
    const result = await query(
      "SELECT permission FROM board_collaborators WHERE board_id = $1 AND user_id = $2",
      [boardId, userId],
    );
    return result.rows[0] || null;
  },
};

module.exports = {
  UserModel,
  BoardModel,
  SubscriptionModel,
  PaymentModel,
  NotificationModel,
  ActivityLogModel,
  AIUsageModel,
  AdminModel,
  SiteSettingsModel,
  LibraryModel,
  CollaboratorModel,
};

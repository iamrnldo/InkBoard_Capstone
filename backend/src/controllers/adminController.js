const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      userStats,
      boardStats,
      revenueStats,
      aiStats,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      query(`SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE plan = 'lite') as lite_count,
        COUNT(*) FILTER (WHERE plan = 'pro') as pro_count,
        COUNT(*) FILTER (WHERE plan = 'premium') as premium_count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count
        FROM users WHERE id NOT IN (SELECT user_id FROM admins WHERE user_id IS NOT NULL)`),
      query(`SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE is_public = true) as public_count
        FROM boards WHERE is_deleted = false`),
      query(`SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND created_at > NOW() - INTERVAL '30 days'), 0) as monthly_revenue,
        COUNT(*) FILTER (WHERE status = 'paid') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_payments
        FROM payments`),
      query(`SELECT 
        COUNT(*) as total_usage,
        COUNT(*) FILTER (WHERE tool_type = 'text_to_diagram') as text_to_diagram,
        COUNT(*) FILTER (WHERE tool_type = 'mermaid_to_inkboard') as mermaid_to_inkboard,
        COUNT(*) FILTER (WHERE tool_type = 'wireframe_to_code') as wireframe_to_code
        FROM ai_usage`),
      query(`SELECT id, username, email, plan, created_at, avatar_url FROM users 
        WHERE id NOT IN (SELECT user_id FROM admins WHERE user_id IS NOT NULL)
        ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT p.*, s.plan, u.username, u.email 
        FROM payments p JOIN subscriptions s ON p.subscription_id = s.id
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 5`),
    ]);

    res.json({
      success: true,
      data: {
        users: userStats.rows[0],
        boards: boardStats.rows[0],
        revenue: revenueStats.rows[0],
        ai: aiStats.rows[0],
        recent_users: recentUsers.rows,
        recent_payments: recentPayments.rows,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// User management
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      plan = "",
      status = "",
    } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let conditions = [
      `u.id NOT IN (SELECT user_id FROM admins WHERE user_id IS NOT NULL)`,
    ];
    let paramCount = 1;

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
    if (status === "active") {
      conditions.push(`u.is_active = true`);
    } else if (status === "inactive") {
      conditions.push(`u.is_active = false`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT u.id, u.username, u.email, u.plan, u.plan_expires_at, u.is_active, u.avatar_url, 
       u.oauth_provider, u.email_verified, u.created_at, u.last_login,
       (SELECT COUNT(*) FROM boards WHERE user_id = u.id AND is_deleted = false) as board_count
       FROM users u ${whereClause}
       ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset],
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params,
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const [userResult, boards, payments, aiUsage] = await Promise.all([
      query("SELECT * FROM users WHERE id = $1", [userId]),
      query(
        "SELECT id, title, created_at, updated_at, is_public FROM boards WHERE user_id = $1 AND is_deleted = false ORDER BY updated_at DESC LIMIT 10",
        [userId],
      ),
      query(
        "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
        [userId],
      ),
      query(
        "SELECT tool_type, COUNT(*) as count FROM ai_usage WHERE user_id = $1 GROUP BY tool_type",
        [userId],
      ),
    ]);

    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { password_hash, ...user } = userResult.rows[0];
    res.json({
      success: true,
      data: {
        user,
        boards: boards.rows,
        payments: payments.rows,
        ai_usage: aiUsage.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, is_active, plan_expires_at } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (plan !== undefined) {
      updates.push(`plan = $${paramCount++}`);
      values.push(plan);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (plan_expires_at !== undefined) {
      updates.push(`plan_expires_at = $${paramCount++}`);
      values.push(plan_expires_at);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount}`,
      values,
    );

    await query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details, created_at) VALUES ($1, 'admin_update_user', 'user', $2, $3, NOW())`,
      [req.admin.id, userId, JSON.stringify({ updates: req.body })],
    );

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.admin.role !== "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only super admin can delete users" });
    }

    await query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1",
      [userId],
    );

    await query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, created_at) VALUES ($1, 'admin_delete_user', 'user', $2, NOW())`,
      [req.admin.id, userId],
    );

    res.json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin management
exports.getAdmins = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.id, a.role, a.permissions, a.is_active, a.invitation_accepted, a.created_at,
       u.username, u.email, u.avatar_url,
       inv.username as invited_by_username
       FROM admins a JOIN users u ON a.user_id = u.id
       LEFT JOIN admins ia ON a.invited_by = ia.id
       LEFT JOIN users inv ON ia.user_id = inv.id
       ORDER BY a.created_at DESC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.inviteAdmin = async (req, res) => {
  try {
    if (req.admin.role !== "super_admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only super admin can invite admins",
        });
    }

    const { email, role = "admin", permissions = [] } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    if (!["admin", "moderator"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const userResult = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User with this email not found. They must register first.",
        });
    }

    const user = userResult.rows[0];
    const existingAdmin = await query(
      "SELECT id FROM admins WHERE user_id = $1",
      [user.id],
    );
    if (existingAdmin.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "User is already an admin" });
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const adminId = uuidv4();

    await query(
      `INSERT INTO admins (id, user_id, role, permissions, invited_by, invitation_token, invitation_expires, invitation_accepted, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, NOW())`,
      [
        adminId,
        user.id,
        role,
        JSON.stringify(permissions),
        req.admin.id,
        invitationToken,
        invitationExpires,
      ],
    );

    const acceptUrl = `${process.env.FRONTEND_URL}/admin/accept-invitation?token=${invitationToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Admin Invitation - Inkboard",
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">✏️ Inkboard Admin Invitation</h1>
          </div>
          <h2>Hello, ${user.username}!</h2>
          <p>You have been invited to become an <strong>${role}</strong> on Inkboard by <strong>${req.admin.username}</strong>.</p>
          <p>Click the button below to accept this invitation (expires in 7 days):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
              Accept Admin Invitation
            </a>
          </div>
          <p style="color: #666;">If you did not expect this invitation, please ignore this email.</p>
        </div>
      `,
    });

    await query(
      `INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details, created_at) VALUES ($1, 'admin_invited', 'admin', $2, $3, NOW())`,
      [req.admin.id, adminId, JSON.stringify({ email, role })],
    );

    res.json({ success: true, message: "Admin invitation sent successfully" });
  } catch (error) {
    console.error("Invite admin error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.acceptAdminInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token required" });
    }

    const result = await query(
      "SELECT a.*, u.email, u.username FROM admins a JOIN users u ON a.user_id = u.id WHERE a.invitation_token = $1 AND a.invitation_expires > NOW() AND a.invitation_accepted = false",
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or expired invitation token",
        });
    }

    const admin = result.rows[0];
    await query(
      "UPDATE admins SET invitation_accepted = true, is_active = true, invitation_token = NULL, invitation_expires = NULL, updated_at = NOW() WHERE id = $1",
      [admin.id],
    );

    res.json({
      success: true,
      message: "Admin invitation accepted! You now have admin access.",
      data: { role: admin.role },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    if (req.admin.role !== "super_admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only super admin can update admin roles",
        });
    }

    const { adminId } = req.params;
    const { role, permissions, is_active } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (permissions !== undefined) {
      updates.push(`permissions = $${paramCount++}`);
      values.push(JSON.stringify(permissions));
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    values.push(adminId);
    await query(
      `UPDATE admins SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramCount}`,
      values,
    );

    res.json({ success: true, message: "Admin updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    if (req.admin.role !== "super_admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only super admin can remove admins",
        });
    }

    const { adminId } = req.params;
    const adminCheck = await query("SELECT * FROM admins WHERE id = $1", [
      adminId,
    ]);
    if (adminCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    if (adminCheck.rows[0].role === "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot remove super admin" });
    }

    await query("DELETE FROM admins WHERE id = $1", [adminId]);
    res.json({ success: true, message: "Admin removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Board management
exports.getBoards = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
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
       u.username as owner_username, u.email as owner_email, u.plan as owner_plan
       FROM boards b JOIN users u ON b.user_id = u.id
       ${whereClause} ORDER BY b.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM boards b JOIN users u ON b.user_id = u.id ${whereClause}`,
      params.slice(0, -2),
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
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    await query(
      "UPDATE boards SET is_deleted = true, updated_at = NOW() WHERE id = $1",
      [boardId],
    );
    res.json({ success: true, message: "Board deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(period);

    const [
      userGrowth,
      revenueByPlan,
      aiUsageTrend,
      boardCreation,
      planDistribution,
    ] = await Promise.all([
      query(`SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM users WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at) ORDER BY date`),
      query(`SELECT s.plan, SUM(p.amount) as revenue, COUNT(*) as transactions
        FROM payments p JOIN subscriptions s ON p.subscription_id = s.id
        WHERE p.status = 'paid' AND p.created_at > NOW() - INTERVAL '${days} days'
        GROUP BY s.plan`),
      query(`SELECT DATE(created_at) as date, tool_type, COUNT(*) as count
        FROM ai_usage WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at), tool_type ORDER BY date`),
      query(`SELECT DATE(created_at) as date, COUNT(*) as count
        FROM boards WHERE created_at > NOW() - INTERVAL '${days} days' AND is_deleted = false
        GROUP BY DATE(created_at) ORDER BY date`),
      query(`SELECT plan, COUNT(*) as count FROM users GROUP BY plan`),
    ]);

    res.json({
      success: true,
      data: {
        user_growth: userGrowth.rows,
        revenue_by_plan: revenueByPlan.rows,
        ai_usage_trend: aiUsageTrend.rows,
        board_creation: boardCreation.rows,
        plan_distribution: planDistribution.rows,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Site settings
exports.getSiteSettings = async (req, res) => {
  try {
    const result = await query("SELECT * FROM site_settings");
    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateSiteSettings = async (req, res) => {
  try {
    if (req.admin.role !== "super_admin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only super admin can update settings",
        });
    }

    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await query(
        "INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()",
        [key, JSON.stringify(value), req.admin.id],
      );
    }
    res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT al.*, u.username, u.email FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countResult = await query("SELECT COUNT(*) FROM activity_logs");

    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = "";
    const params = [];

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
       ${whereClause} ORDER BY p.created_at DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM payments p ${whereClause}`,
      status ? [status] : [],
    );

    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

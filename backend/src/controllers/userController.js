const { query } = require("../config/database");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const PAKASIR_BASE_URL = process.env.PAKASIR_BASE_URL;
const PAKASIR_PROJECT = process.env.PAKASIR_PROJECT;
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;

const PLAN_PRICES = { lite: 0, pro: 500, premium: 30000 };

// ============================================================
// MULTER — Avatar upload (local storage)
// ============================================================
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/avatars");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Export middleware so the router can apply it before uploadAvatar
exports.uploadAvatarMiddleware = avatarUpload.single("avatar");

// ============================================================
// PROFILE
// ============================================================

exports.getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, full_name, email, avatar_url, plan, plan_expires_at,
              preferences, oauth_provider, email_verified, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.id],
    );

    const boardCount = await query(
      "SELECT COUNT(*) FROM boards WHERE user_id = $1 AND is_deleted = false",
      [req.user.id],
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        board_count: parseInt(boardCount.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, full_name, avatar_url } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Full name
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name.trim().slice(0, 100));
    }

    // Username
    if (username) {
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid username format" });
      }
      const existing = await query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, req.user.id],
      );
      if (existing.rows.length > 0) {
        return res
          .status(409)
          .json({ success: false, message: "Username already taken" });
      }
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    // Avatar URL (direct URL string — used when no file is uploaded)
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount}
       RETURNING id, username, full_name, email, avatar_url, plan`,
      values,
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// AVATAR UPLOAD
// ============================================================

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Build a publicly accessible URL.
    // Make sure your Express app serves /uploads as static:
    //   app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
    const avatarUrl = `${process.env.BACKEND_URL || "http://localhost:5273"}/uploads/avatars/${req.file.filename}`;

    // Persist to DB
    await query(
      "UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2",
      [avatarUrl, req.user.id],
    );

    res.json({ success: true, data: { avatar_url: avatarUrl } });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// ============================================================
// PREFERENCES
// ============================================================

exports.updatePreferences = async (req, res) => {
  try {
    const { theme, language } = req.body;
    const currentPrefs = req.user.preferences || {};
    const newPrefs = { ...currentPrefs };
    if (theme) newPrefs.theme = theme;
    if (language) newPrefs.language = language;

    await query(
      "UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(newPrefs), req.user.id],
    );

    res.json({ success: true, data: { preferences: newPrefs } });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// PASSWORD
// ============================================================

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ success: false, message: "Both passwords required" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const userResult = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: "No password set. Use OAuth to sign in.",
      });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newHash, req.user.id],
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// PAYMENTS — create
// ============================================================

exports.createPayment = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!["pro", "premium"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const amount = PLAN_PRICES[plan];
    const orderId = `INK-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;
    const paymentMethod = process.env.PAKASIR_PAYMENT_METHOD || "qris";

    console.log("[createPayment] ENV check:", {
      PAKASIR_BASE_URL,
      PAKASIR_PROJECT,
      hasApiKey: !!PAKASIR_API_KEY,
      paymentMethod,
      amount,
      orderId,
    });

    // Hit Pakasir API
    let pakasirResponse;
    try {
      pakasirResponse = await axios.post(
        `${PAKASIR_BASE_URL}/api/transactioncreate/${paymentMethod}`,
        {
          project: PAKASIR_PROJECT,
          order_id: orderId,
          amount,
          api_key: PAKASIR_API_KEY,
        },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 },
      );
    } catch (axiosErr) {
      console.error("[createPayment] Pakasir API error:", {
        status: axiosErr.response?.status,
        data: axiosErr.response?.data,
        message: axiosErr.message,
      });
      return res.status(500).json({
        success: false,
        message: `Payment gateway error: ${
          axiosErr.response?.data?.message || axiosErr.message
        }`,
      });
    }

    console.log(
      "[createPayment] Pakasir response:",
      JSON.stringify(pakasirResponse.data),
    );

    const paymentData = pakasirResponse.data?.payment;
    if (!paymentData) {
      console.error(
        "[createPayment] Invalid Pakasir response structure:",
        pakasirResponse.data,
      );
      return res.status(500).json({
        success: false,
        message: "Invalid response from payment gateway",
      });
    }

    // Save subscription
    const subId = uuidv4();
    await query(
      `INSERT INTO subscriptions
         (id, user_id, plan, status, order_id, amount, payment_method, created_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, NOW())`,
      [subId, req.user.id, plan, orderId, amount, paymentMethod],
    );

    // Save payment record
    await query(
      `INSERT INTO payments
         (id, user_id, subscription_id, order_id, amount, fee, total_payment,
          payment_method, payment_number, status, expired_at, pakasir_data, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, NOW())`,
      [
        req.user.id,
        subId,
        orderId,
        amount,
        paymentData.fee || 0,
        paymentData.total_payment || amount,
        paymentMethod,
        paymentData.payment_number,
        paymentData.expired_at,
        JSON.stringify(paymentData),
      ],
    );

    // Include order_id in the redirect so the success page can verify THIS order.
    const redirectUrl = `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`;
    const paymentUrl = `${PAKASIR_BASE_URL}/pay/${PAKASIR_PROJECT}/${amount}?order_id=${orderId}&qris_only=1&redirect=${encodeURIComponent(
      redirectUrl,
    )}`;

    res.json({
      success: true,
      data: {
        order_id: orderId,
        amount,
        plan,
        payment_url: paymentUrl,
        qr_string: paymentData.payment_number,
        expired_at: paymentData.expired_at,
        total_payment: paymentData.total_payment,
      },
    });
  } catch (error) {
    console.error(
      "[createPayment] Unexpected error:",
      error.message,
      error.stack,
    );
    res.status(500).json({
      success: false,
      message: "Payment creation failed. Please try again.",
    });
  }
};

// ============================================================
// PAYMENTS — Pakasir status verification (source of truth)
// ============================================================

const PAID_STATUSES = ["completed", "paid", "success"];
const FAILED_STATUSES = ["expired", "failed", "cancelled"];

/**
 * Ask Pakasir for the authoritative status of a transaction.
 * Docs: GET /api/transactiondetail?project=&amount=&order_id=&api_key=
 * Returns the normalized status string ("completed" | "pending" | "expired" | ...)
 * or null if the call fails.
 */
async function fetchPakasirStatus(orderId, amount) {
  try {
    const { data } = await axios.get(
      `${PAKASIR_BASE_URL}/api/transactiondetail`,
      {
        params: {
          project: PAKASIR_PROJECT,
          amount,
          order_id: orderId,
          api_key: PAKASIR_API_KEY,
        },
        timeout: 20000,
      },
    );
    // Expected shape: { transaction: { status, amount, order_id, ... } }
    return data?.transaction || null;
  } catch (err) {
    console.error("[fetchPakasirStatus] error:", {
      order_id: orderId,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    return null;
  }
}

/**
 * Idempotently activate a plan for a paid order. Safe to call multiple times
 * (webhook + polling) — it only acts when the payment isn't already 'paid'.
 * Returns the final payment status string.
 */
async function activatePaidOrder(orderId) {
  const paymentResult = await query(
    "SELECT * FROM payments WHERE order_id = $1",
    [orderId],
  );
  if (paymentResult.rows.length === 0) return null;
  const payment = paymentResult.rows[0];

  // Already processed → idempotent no-op.
  if (payment.status === "paid") return "paid";

  await query(
    "UPDATE payments SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE order_id = $1",
    [orderId],
  );

  const subResult = await query(
    "SELECT * FROM subscriptions WHERE order_id = $1",
    [orderId],
  );

  if (subResult.rows.length > 0) {
    const sub = subResult.rows[0];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await query(
      `UPDATE subscriptions
       SET status = 'active', starts_at = NOW(), expires_at = $1, updated_at = NOW()
       WHERE order_id = $2`,
      [expiresAt, orderId],
    );

    await query(
      "UPDATE users SET plan = $1, plan_expires_at = $2, updated_at = NOW() WHERE id = $3",
      [sub.plan, expiresAt, payment.user_id],
    );

    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, created_at)
       VALUES (uuid_generate_v4(), $1, 'Payment Successful!', $2, 'success', NOW())`,
      [
        payment.user_id,
        `Your ${sub.plan} plan has been activated successfully!`,
      ],
    );

    console.log(
      `[payment] Plan ${sub.plan} activated for user ${payment.user_id} (order ${orderId})`,
    );
  }

  return "paid";
}

async function markOrderFailed(orderId, status) {
  await query(
    "UPDATE payments SET status = $1, updated_at = NOW() WHERE order_id = $2 AND status = 'pending'",
    [status, orderId],
  );
  await query(
    "UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE order_id = $2 AND status = 'pending'",
    [status, orderId],
  );
  console.log(`[payment] Order ${orderId} marked as ${status}`);
}

// ============================================================
// PAYMENTS — webhook (called by Pakasir servers)
// ============================================================

exports.paymentWebhook = async (req, res) => {
  try {
    console.log("[webhook] Received:", JSON.stringify(req.body));

    const { order_id, amount } = req.body;
    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "order_id required" });
    }

    const paymentResult = await query(
      "SELECT * FROM payments WHERE order_id = $1",
      [order_id],
    );
    if (paymentResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    const payment = paymentResult.rows[0];

    // SECURITY: never trust the webhook body. Re-verify with Pakasir and make
    // sure the amount matches what we recorded for this order.
    const txn = await fetchPakasirStatus(order_id, payment.amount);

    if (!txn) {
      // Could not verify — do NOT activate. Ask Pakasir to retry later.
      return res
        .status(502)
        .json({ success: false, message: "Could not verify with gateway" });
    }

    if (amount !== undefined && Number(amount) !== Number(payment.amount)) {
      console.warn(
        `[webhook] Amount mismatch for ${order_id}: body=${amount} db=${payment.amount}`,
      );
      return res
        .status(400)
        .json({ success: false, message: "Amount mismatch" });
    }

    const status = String(txn.status || "").toLowerCase();
    if (PAID_STATUSES.includes(status)) {
      await activatePaidOrder(order_id);
    } else if (FAILED_STATUSES.includes(status)) {
      await markOrderFailed(order_id, status === "cancelled" ? "cancelled" : status);
    } else {
      console.warn(`[webhook] Pending/unknown status for ${order_id}: ${status}`);
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("[webhook] Error:", error.message, error.stack);
    res
      .status(500)
      .json({ success: false, message: "Webhook processing failed" });
  }
};

// ============================================================
// PAYMENTS — status check (called by the frontend success page / QR modal)
// Verifies directly against Pakasir so it works even when the webhook can't
// reach localhost during development.
// ============================================================

exports.getPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.params;

    const paymentResult = await query(
      "SELECT * FROM payments WHERE order_id = $1 AND user_id = $2",
      [order_id, req.user.id],
    );
    if (paymentResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    const payment = paymentResult.rows[0];

    // Already settled in our DB → return immediately.
    if (payment.status !== "pending") {
      return res.json({
        success: true,
        data: { order_id, status: payment.status, plan: payment.plan },
      });
    }

    // Still pending locally → ask Pakasir for the real status.
    const txn = await fetchPakasirStatus(order_id, payment.amount);
    let status = payment.status;

    if (txn) {
      const remoteStatus = String(txn.status || "").toLowerCase();
      if (PAID_STATUSES.includes(remoteStatus)) {
        await activatePaidOrder(order_id);
        status = "paid";
      } else if (FAILED_STATUSES.includes(remoteStatus)) {
        await markOrderFailed(
          order_id,
          remoteStatus === "cancelled" ? "cancelled" : remoteStatus,
        );
        status = remoteStatus === "cancelled" ? "cancelled" : remoteStatus;
      }
    }

    res.json({ success: true, data: { order_id, status } });
  } catch (error) {
    console.error("[getPaymentStatus] error:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// PAYMENT HISTORY
// ============================================================

exports.getPaymentHistory = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, s.plan
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [req.user.id],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// NOTIFICATIONS
// ============================================================

exports.getNotifications = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [req.user.id],
    );
    const unreadCount = await query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
      [req.user.id],
    );
    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unread_count: parseInt(unreadCount.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await query(
      "UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = $2",
      [req.user.id, req.params.id],
    );
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

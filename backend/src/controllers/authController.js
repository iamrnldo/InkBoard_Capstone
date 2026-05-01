const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
  return { accessToken, refreshToken };
};

/* ─────────────────────────────────────────────
   Email Templates
───────────────────────────────────────────── */
const emailWrapper = (content) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Inkboard</title></head>
  <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a2e;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:32px;font-weight:900;color:white;letter-spacing:-1px;font-style:italic;">
                ✏️ inkboard
              </div>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
                Digital Whiteboard Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111827;padding:24px 40px;text-align:center;border-top:1px solid #374151;">
              <p style="color:#6b7280;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Inkboard. All rights reserved.<br>
                <span style="color:#4b5563;">If you didn't request this email, you can safely ignore it.</span>
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
`;

const primaryButton = (url, text) => `
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}"
       style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;
              padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;
              display:inline-block;letter-spacing:0.3px;
              box-shadow:0 4px 15px rgba(99,102,241,0.4);">
      ${text}
    </a>
  </div>
  <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:8px;">
    Or copy this link: <a href="${url}" style="color:#8b5cf6;word-break:break-all;">${url}</a>
  </p>
`;

const sendVerificationEmail = async (email, username, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const content = `
    <h2 style="color:#f9fafb;margin:0 0 8px;font-size:22px;">Hi, ${username}! 👋</h2>
    <p style="color:#9ca3af;margin:0 0 24px;line-height:1.6;">
      Thanks for signing up for Inkboard! One last step — please verify your email address
      to activate your account and start creating boards.
    </p>

    <div style="background:#111827;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #374151;">
      <p style="color:#d1d5db;margin:0;font-size:14px;">
        ✅ &nbsp;Verify your email to unlock all features<br>
        🎨 &nbsp;Start creating and collaborating on boards<br>
        🔒 &nbsp;Keep your account secure
      </p>
    </div>

    ${primaryButton(verifyUrl, "Verify Email Address")}

    <p style="color:#6b7280;font-size:13px;text-align:center;">
      ⏰ This link expires in <strong style="color:#9ca3af;">24 hours</strong>
    </p>
  `;
  await transporter.sendMail({
    from: `"Inkboard" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "✏️ Verify your Inkboard account",
    html: emailWrapper(content),
  });
};

const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const content = `
    <h2 style="color:#f9fafb;margin:0 0 8px;font-size:22px;">Reset your password 🔑</h2>
    <p style="color:#9ca3af;margin:0 0 24px;line-height:1.6;">
      Hi <strong style="color:#d1d5db;">${username}</strong>, we received a request to reset your Inkboard password.
      Click the button below to set a new password.
    </p>

    <div style="background:#1f1f35;border:1px solid #ef444433;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="color:#fca5a5;margin:0;font-size:13px;">
        ⚠️ &nbsp;This link expires in <strong>1 hour</strong> and can only be used once.
        If you didn't request a password reset, please ignore this email — your password won't change.
      </p>
    </div>

    ${primaryButton(resetUrl, "Reset Password")}

    <p style="color:#6b7280;font-size:13px;text-align:center;">
      For security, this link will expire at 
      <strong style="color:#9ca3af;">${new Date(Date.now() + 60 * 60 * 1000).toUTCString()}</strong>
    </p>
  `;
  await transporter.sendMail({
    from: `"Inkboard" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "🔑 Reset your Inkboard password",
    html: emailWrapper(content),
  });
};

/* ─────────────────────────────────────────────
   Controllers
───────────────────────────────────────────── */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    if (username.length < 3 || username.length > 30)
      return res
        .status(400)
        .json({ success: false, message: "Username must be 3-30 characters" });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Username can only contain letters, numbers, and underscores",
        });
    if (password.length < 8)
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 8 characters",
        });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });

    const existingUser = await query(
      "SELECT id, email, username FROM users WHERE email = $1 OR username = $2",
      [email.toLowerCase(), username],
    );
    if (existingUser.rows.length > 0) {
      const conflict = existingUser.rows[0];
      const field =
        conflict.email === email.toLowerCase() ? "Email" : "Username";
      return res
        .status(409)
        .json({ success: false, message: `${field} already exists` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const userId = uuidv4();

    await query(
      `INSERT INTO users (id, username, email, password_hash, email_verification_token, email_verification_expires, plan, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'lite', NOW())`,
      [
        userId,
        username,
        email.toLowerCase(),
        passwordHash,
        verificationToken,
        verificationExpires,
      ],
    );

    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Don't fail registration if email fails
    }

    await query(
      `INSERT INTO activity_logs (user_id, action, details, created_at) VALUES ($1, 'user_registered', $2, NOW())`,
      [userId, JSON.stringify({ email, username })],
    );

    res.status(201).json({
      success: true,
      message:
        "Account created! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });

    const result = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (result.rows.length === 0)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const user = result.rows[0];

    if (!user.password_hash)
      return res
        .status(401)
        .json({
          success: false,
          message: "Please sign in with your social account (Google/GitHub)",
        });
    if (!user.email_verified)
      return res
        .status(401)
        .json({
          success: false,
          message: "Please verify your email first",
          needsVerification: true,
        });
    if (!user.is_active)
      return res
        .status(403)
        .json({
          success: false,
          message: "Account has been deactivated. Contact support.",
        });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const adminCheck = await query(
      "SELECT role FROM admins WHERE user_id = $1 AND is_active = true AND invitation_accepted = true",
      [user.id],
    );
    const isAdmin = adminCheck.rows.length > 0;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          plan: user.plan,
          avatar_url: user.avatar_url,
          preferences: user.preferences,
          isAdmin,
          adminRole: isAdmin ? adminCheck.rows[0].role : null,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Verification token required" });

    const result = await query(
      "SELECT * FROM users WHERE email_verification_token = $1",
      [token],
    );

    if (result.rows.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification token" });

    const user = result.rows[0];

    // Already verified
    if (user.email_verified)
      return res
        .status(400)
        .json({
          success: false,
          message: "Email already verified. Please sign in.",
        });

    // Token expired
    if (new Date() > new Date(user.email_verification_expires))
      return res
        .status(400)
        .json({
          success: false,
          message: "Verification link has expired. Please request a new one.",
          expired: true,
        });

    await query(
      "UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1",
      [user.id],
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, details, created_at) VALUES ($1, 'email_verified', $2, NOW())`,
      [user.id, JSON.stringify({ email: user.email })],
    );

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to Inkboard.",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          plan: user.plan,
          avatar_url: user.avatar_url,
          isAdmin: false,
          adminRole: null,
        },
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const result = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0)
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a verification link has been sent.",
      });

    const user = result.rows[0];

    if (user.email_verified)
      return res
        .status(400)
        .json({
          success: false,
          message: "This email is already verified. Please sign in.",
        });

    // Rate limit: don't resend if token was sent recently (within 2 minutes)
    if (user.email_verification_expires) {
      const tokenAge = new Date(user.email_verification_expires) - new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24h
      if (tokenAge > maxAge - 2 * 60 * 1000)
        // sent less than 2 min ago
        return res
          .status(429)
          .json({
            success: false,
            message:
              "Please wait a moment before requesting another verification email.",
          });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      "UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3",
      [token, expires, user.id],
    );

    await sendVerificationEmail(user.email, user.username, token);
    res.json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const result = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      if (!user.password_hash) {
        // OAuth user — still return success to prevent enumeration
        return res.json({
          success: true,
          message: "If an account exists, a reset link has been sent.",
        });
      }

      // Rate limit: prevent abuse (token must be older than 1 min)
      if (user.password_reset_expires) {
        const remaining = new Date(user.password_reset_expires) - new Date();
        if (remaining > 59 * 60 * 1000)
          // sent less than 1 min ago
          return res
            .status(429)
            .json({
              success: false,
              message: "Please wait before requesting another reset link.",
            });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
        [token, expires, user.id],
      );

      await sendPasswordResetEmail(user.email, user.username, token);

      await query(
        `INSERT INTO activity_logs (user_id, action, details, created_at) VALUES ($1, 'password_reset_requested', $2, NOW())`,
        [user.id, JSON.stringify({ email: user.email })],
      );
    }

    // Always return same response to prevent email enumeration
    res.json({
      success: true,
      message:
        "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Reset token is required" });
    if (!password)
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    if (password.length < 8)
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 8 characters",
        });

    const result = await query(
      "SELECT * FROM users WHERE password_reset_token = $1",
      [token],
    );

    if (result.rows.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid reset token" });

    const user = result.rows[0];

    if (new Date() > new Date(user.password_reset_expires))
      return res
        .status(400)
        .json({
          success: false,
          message: "Reset link has expired. Please request a new one.",
        });

    // Check new password is not same as old
    if (user.password_hash) {
      const isSame = await bcrypt.compare(password, user.password_hash);
      if (isSame)
        return res
          .status(400)
          .json({
            success: false,
            message:
              "New password must be different from your current password",
          });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2",
      [passwordHash, user.id],
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, details, created_at) VALUES ($1, 'password_reset_completed', $2, NOW())`,
      [user.id, JSON.stringify({ email: user.email })],
    );

    res.json({
      success: true,
      message:
        "Password reset successful! You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res
        .status(401)
        .json({ success: false, message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await query(
      "SELECT * FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId],
    );
    if (result.rows.length === 0)
      return res
        .status(401)
        .json({ success: false, message: "User not found or deactivated" });

    const tokens = generateTokens(decoded.userId);
    res.json({ success: true, data: tokens });
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res
        .status(401)
        .json({
          success: false,
          message: "Refresh token expired, please sign in again",
        });
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { accessToken, refreshToken } = generateTokens(req.user.id);
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      req.user.id,
    ]);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`,
    );
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

exports.githubCallback = async (req, res) => {
  try {
    const { accessToken, refreshToken } = generateTokens(req.user.id);
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      req.user.id,
    ]);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`,
    );
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

exports.getMe = async (req, res) => {
  try {
    const adminCheck = await query(
      "SELECT role FROM admins WHERE user_id = $1 AND is_active = true AND invitation_accepted = true",
      [req.user.id],
    );
    res.json({
      success: true,
      data: {
        ...req.user,
        isAdmin: adminCheck.rows.length > 0,
        adminRole: adminCheck.rows.length > 0 ? adminCheck.rows[0].role : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, details, created_at) VALUES ($1, 'user_logout', $2, NOW())`,
      [req.user?.id, JSON.stringify({ timestamp: new Date() })],
    );
  } catch (_) {} // non-critical
  res.json({ success: true, message: "Logged out successfully" });
};

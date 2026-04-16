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

const sendVerificationEmail = async (email, username, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your Inkboard account",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Verify Email</title></head>
      <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✏️ Inkboard</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Digital Whiteboard Platform</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hello, ${username}! 👋</h2>
            <p style="color: #6b7280;">Thank you for signing up for Inkboard. Please verify your email address to get started.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #d1d5db; font-size: 12px; text-align: center;">© 2024 Inkboard. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (username.length < 3 || username.length > 30) {
      return res
        .status(400)
        .json({ success: false, message: "Username must be 3-30 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Username can only contain letters, numbers, and underscores",
        });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 8 characters",
        });
    }

    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Email or username already exists" });
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
        email,
        passwordHash,
        verificationToken,
        verificationExpires,
      ],
    );

    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    await query(
      `INSERT INTO activity_logs (user_id, action, details, created_at) VALUES ($1, 'user_registered', $2, NOW())`,
      [userId, JSON.stringify({ email, username })],
    );

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
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
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Please sign in with your social account",
        });
    }
    if (!user.email_verified) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Please verify your email first",
          needsVerification: true,
        });
    }
    if (!user.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account has been deactivated" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

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
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Verification token required" });
    }

    const result = await query(
      "SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()",
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or expired verification token",
        });
    }

    const user = result.rows[0];
    await query(
      "UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1",
      [user.id],
    );

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          plan: user.plan,
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
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: "If account exists, verification email sent",
      });
    }

    const user = result.rows[0];
    if (user.email_verified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      "UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3",
      [token, expires, user.id],
    );

    await sendVerificationEmail(user.email, user.username, token);
    res.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await query(
        "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
        [token, expires, user.id],
      );

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Reset your Inkboard password",
        html: `
          <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>Click the link below to reset your password (expires in 1 hour):</p>
            <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    }

    res.json({
      success: true,
      message: "If account exists, password reset email sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid token and password (min 8 chars) required",
        });
    }

    const result = await query(
      "SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()",
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2",
      [passwordHash, result.rows[0].id],
    );

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await query(
      "SELECT * FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId],
    );
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const tokens = generateTokens(decoded.userId);
    res.json({ success: true, data: tokens });
  } catch (error) {
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
  res.json({ success: true, message: "Logged out successfully" });
};

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log("🚀 Running migrations...");
    const sql = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
    await client.query(sql);
    console.log("✅ Migrations completed");

    // Create super admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL || "admin@inkboard.app";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
    const adminUsername = process.env.ADMIN_USERNAME || "superadmin";

    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail],
    );

    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const userId = uuidv4();
      const adminId = uuidv4();

      await client.query(
        `INSERT INTO users (id, username, email, password_hash, email_verified, plan, created_at)
         VALUES ($1, $2, $3, $4, true, 'premium', NOW())`,
        [userId, adminUsername, adminEmail, passwordHash],
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

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigrations();

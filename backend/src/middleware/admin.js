const { query } = require("../config/database");

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const result = await query(
      "SELECT a.*, u.email, u.username FROM admins a JOIN users u ON a.user_id = u.id WHERE a.user_id = $1 AND a.is_active = true AND a.invitation_accepted = true",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }
    if (req.admin.role !== "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "Super admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { requireAdmin, requireSuperAdmin };

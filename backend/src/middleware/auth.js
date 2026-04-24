const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      "SELECT id, username, email, plan, plan_expires_at, is_active, avatar_url, preferences FROM users WHERE id = $1",
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account is deactivated" });
    }

    // Check if plan has expired
    if (
      user.plan !== "lite" &&
      user.plan_expires_at &&
      new Date(user.plan_expires_at) < new Date()
    ) {
      await query(
        "UPDATE users SET plan = 'lite', plan_expires_at = NULL WHERE id = $1",
        [user.id],
      );
      user.plan = "lite";
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query("SELECT * FROM users WHERE id = $1", [
        decoded.userId,
      ]);
      if (result.rows.length > 0) req.user = result.rows[0];
    }
  } catch (e) {}
  next();
};

const requirePlan = (plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (!plans.includes(req.user.plan)) {
      return res.status(403).json({
        success: false,
        message: `This feature requires ${plans.join(" or ")} plan`,
        upgradeRequired: true,
        currentPlan: req.user.plan,
        requiredPlans: plans,
      });
    }
    next();
  };
};

module.exports = { authenticateToken, optionalAuth, requirePlan };

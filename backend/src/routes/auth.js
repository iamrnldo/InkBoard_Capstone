const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authenticateToken, authController.logout);
router.post("/refresh", authController.refreshToken);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification",
  authLimiter,
  authController.resendVerification,
);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);
router.get("/me", authenticateToken, authController.getMe);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  authController.googleCallback,
);

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_failed`,
  }),
  authController.githubCallback,
);

module.exports = router;

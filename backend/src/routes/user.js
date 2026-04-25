const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");
const { apiLimiter } = require("../middleware/rateLimit");
const {
  uploadAvatarMiddleware,
  uploadAvatar,
} = require("../controllers/userController");

router.use(apiLimiter);

router.get("/profile", authenticateToken, userController.getProfile);
router.post(
  "/profile/avatar",
  authenticateToken,
  uploadAvatarMiddleware,
  uploadAvatar,
);
router.put("/profile", authenticateToken, userController.updateProfile);
router.put("/preferences", authenticateToken, userController.updatePreferences);
router.put("/password", authenticateToken, userController.changePassword);
router.post("/payment/create", authenticateToken, userController.createPayment);
router.post("/payment/webhook", userController.paymentWebhook);
router.get(
  "/payment/history",
  authenticateToken,
  userController.getPaymentHistory,
);
router.get(
  "/notifications",
  authenticateToken,
  userController.getNotifications,
);
router.put(
  "/notifications/:id/read",
  authenticateToken,
  userController.markNotificationRead,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin, requireSuperAdmin } = require("../middleware/admin");

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/dashboard", adminController.getDashboardStats);
router.get("/analytics", adminController.getAnalytics);
router.get("/users", adminController.getUsers);
router.get("/users/:userId", adminController.getUserDetail);
router.put("/users/:userId", adminController.updateUser);
router.delete("/users/:userId", requireSuperAdmin, adminController.deleteUser);
router.get("/boards", adminController.getBoards);
router.delete("/boards/:boardId", adminController.deleteBoard);
router.get("/admins", adminController.getAdmins);
router.post("/admins/invite", adminController.inviteAdmin);
router.post("/admins/accept-invitation", adminController.acceptAdminInvitation);
router.put("/admins/:adminId", adminController.updateAdmin);
router.delete("/admins/:adminId", adminController.removeAdmin);
router.get("/payments", adminController.getPayments);
router.get("/activity-logs", adminController.getActivityLogs);
router.get("/settings", adminController.getSiteSettings);
router.put("/settings", adminController.updateSiteSettings);

module.exports = router;

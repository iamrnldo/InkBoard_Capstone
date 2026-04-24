const express = require("express");
const router = express.Router();
const boardController = require("../controllers/boardController");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { apiLimiter } = require("../middleware/rateLimit");

router.use(apiLimiter);

router.get("/", authenticateToken, boardController.getBoards);
router.post("/", authenticateToken, boardController.createBoard);
router.get("/share/:token", optionalAuth, boardController.getSharedBoard);
router.get("/:id", authenticateToken, boardController.getBoard);
router.put("/:id", authenticateToken, boardController.updateBoard);
router.delete("/:id", authenticateToken, boardController.deleteBoard);
router.post("/:id/share", authenticateToken, boardController.shareBoard);
router.post(
  "/:id/duplicate",
  authenticateToken,
  boardController.duplicateBoard,
);
router.post(
  "/:id/collaborators",
  authenticateToken,
  boardController.addCollaborator,
);
router.delete(
  "/:id/collaborators/:userId",
  authenticateToken,
  boardController.removeCollaborator,
);

module.exports = router;

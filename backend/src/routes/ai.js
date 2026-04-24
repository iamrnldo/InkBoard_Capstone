const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { authenticateToken } = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimit");

router.use(authenticateToken);
router.use(aiLimiter);

router.post("/text-to-diagram", aiController.textToDiagram);
router.post("/mermaid-to-inkboard", aiController.mermaidToInkboard);
router.post("/wireframe-to-code", aiController.wireframeToCode);
router.get("/usage", aiController.getAIUsage);

module.exports = router;

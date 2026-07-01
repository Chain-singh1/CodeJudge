const express = require("express");
const router = express.Router();
const { aiChat } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, aiChat);

module.exports = router;
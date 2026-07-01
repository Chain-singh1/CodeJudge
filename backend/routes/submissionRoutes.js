const express = require("express");
const router = express.Router();
const {
  createSubmission,
  getUserSubmissions,
  getProblemSubmissions,
} = require("../controllers/submissionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createSubmission);
router.get("/user/:userId", protect, getUserSubmissions);
router.get("/problem/:problemId", protect, getProblemSubmissions);

module.exports = router;
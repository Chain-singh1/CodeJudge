const express = require("express");
const router = express.Router();
const {
  getProblems,
  getProblem,
  getProblemWithHidden,
  createProblem,
  updateProblem,
  deleteProblem,
} = require("../controllers/problemController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

router.get("/", protect, getProblems);
router.get("/:id", protect, getProblem);
router.get("/:id/full", protect, adminOnly, getProblemWithHidden);
router.post("/", protect, adminOnly, createProblem);
router.put("/:id", protect, adminOnly, updateProblem);
router.delete("/:id", protect, adminOnly, deleteProblem);

module.exports = router;
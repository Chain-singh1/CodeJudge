const Problem = require("../models/Problem");

const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .select("-hiddenTestCases")
      .sort({ createdAt: -1 });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select(
      "-hiddenTestCases",
    );
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: includes hidden test cases for judging
const getProblemWithHidden = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProblem = async (req, res) => {
  try {
    const {
      title,
      difficulty,
      description,
      inputExample,
      outputExample,
      constraints,
      tags,
      starterCode,
      sampleTestCases,
      hiddenTestCases,
    } = req.body;

    if (!title || !description)
      return res
        .status(400)
        .json({ message: "Title and description are required" });

    const problem = await Problem.create({
      title,
      difficulty,
      description,
      inputExample,
      outputExample,
      constraints,
      tags: Array.isArray(tags) ? tags : [],
      starterCode,
      sampleTestCases: Array.isArray(sampleTestCases) ? sampleTestCases : [],
      hiddenTestCases: Array.isArray(hiddenTestCases) ? hiddenTestCases : [],
    });

    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json({ message: "Problem deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProblems,
  getProblem,
  getProblemWithHidden,
  createProblem,
  updateProblem,
  deleteProblem,
};

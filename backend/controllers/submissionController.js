const Submission = require('../models/Submission')

const VALID_STATUSES = ['Accepted', 'Wrong Answer', 'Error']

const createSubmission = async (req, res) => {
  try {
    const { problem, language, code, status } = req.body

    if (!problem || !language || !code || !status)
      return res.status(400).json({ message: 'All fields required' })

    const VALID_STATUSES = ['Accepted', 'Wrong Answer', 'Error']
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ message: 'Invalid status value' })

    const VALID_LANGUAGES = ['javascript', 'python', 'java', 'cpp']
    if (!VALID_LANGUAGES.includes(language))
      return res.status(400).json({ message: 'Invalid language' })

    if (code.length > 50000)
      return res.status(400).json({ message: 'Code too large (max 50KB)' })

    // Verify problem exists
    const Problem = require('../models/Problem')
    const problemExists = await Problem.findById(problem).select('_id')
    if (!problemExists)
      return res.status(404).json({ message: 'Problem not found' })

    const submission = await Submission.create({
      user: req.user._id,  // always from JWT
      problem,
      language,
      code,
      status,
    })
    await submission.populate('problem', 'title difficulty')
    res.status(201).json(submission)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getUserSubmissions = async (req, res) => {
  try {
    // Only allow users to see their own submissions
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const submissions = await Submission.find({ user: req.params.userId })
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(200)  // cap at 200 most recent
    res.json(submissions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getProblemSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ problem: req.params.problemId })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json(submissions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createSubmission, getUserSubmissions, getProblemSubmissions };
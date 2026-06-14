const ContestSubmission = require('../models/ContestSubmission')

const createContestSubmission = async (req, res) => {
  try {
    const { contest, problem, user, status } = req.body

    if (!contest || !problem || !user || !status)
      return res.status(400).json({ message: 'All fields required' })

    const submission = await ContestSubmission.create({ contest, problem, user, status })
    res.status(201).json(submission)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getContestSubmissions = async (req, res) => {
  try {
    const submissions = await ContestSubmission.find({ contest: req.params.contestId })
      .populate('user', 'username')
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 })
    res.json(submissions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createContestSubmission, getContestSubmissions }

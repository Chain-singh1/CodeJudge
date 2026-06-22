const ContestSubmission = require('../models/ContestSubmission')

// const createContestSubmission = async (req, res) => {
//   try {
//     const { contest: contestId, problem, user, status } = req.body

//     if (!contestId || !problem || !user || !status)
//       return res.status(400).json({ message: 'All fields required' })

//     // Fetch contest to check if it's still active
//     const Contest = require('../models/Contest')
//     const contest = await Contest.findById(contestId)
//     if (!contest) return res.status(404).json({ message: 'Contest not found' })

//     // Block saving contest submissions after contest has ended
//     if (new Date() > new Date(contest.endTime))
//       return res.status(400).json({ message: 'Contest has ended — submission not recorded on leaderboard' })

//     const submission = await ContestSubmission.create({ contest: contestId, problem, user, status })
//     res.status(201).json(submission)
//   } catch (err) {
//     res.status(500).json({ message: err.message })
//   }
// }

const createContestSubmission = async (req, res) => {
  try {
    const { contest: contestId, problem, status } = req.body
    const userId = req.user._id

    if (!contestId || !problem || !status)
      return res.status(400).json({ message: 'All fields required' })

    const validStatuses = ['Accepted', 'Wrong Answer', 'Error']
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' })

    const Contest = require('../models/Contest')
    const contest = await Contest.findById(contestId)
    if (!contest) return res.status(404).json({ message: 'Contest not found' })

    if (new Date() > new Date(contest.endTime))
      return res.status(400).json({ message: 'Contest has ended — submission not recorded on leaderboard' })

    // Verify user is a participant
    const isParticipant = contest.participants.some(p => p.toString() === userId.toString())
    if (!isParticipant && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You are not registered for this contest' })

    const submission = await ContestSubmission.create({
      contest: contestId,
      problem,
      user: userId,  // always from JWT, never from body
      status,
    })
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

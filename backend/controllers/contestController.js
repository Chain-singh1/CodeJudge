const Contest = require('../models/Contest')

const getContests = async (req, res) => {
  try {
    const contests = await Contest.find()
      .populate('problems', 'title difficulty tags')
      .sort({ startTime: -1 })
    res.json(contests)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('problems', 'title difficulty tags')
      .populate('participants', '_id username')
    if (!contest) return res.status(404).json({ message: 'Contest not found' })
    res.json(contest)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const joinContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) return res.status(404).json({ message: 'Contest not found' })

    const now = new Date()

    // Block joining after contest has started
    if (now >= new Date(contest.startTime))
      return res.status(400).json({ message: 'Registration is closed. Contest has already started.' })

    const userId      = req.user._id.toString()
    const alreadyJoined = contest.participants.some(p => p.toString() === userId)

    if (!alreadyJoined) {
      contest.participants.push(req.user._id)
      await contest.save()
    }

    res.json({ message: alreadyJoined ? 'Already registered' : 'Joined successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const createContest = async (req, res) => {
  try {
    const { title, description, startTime, endTime, problems } = req.body

    if (!title || !startTime || !endTime)
      return res.status(400).json({ message: 'Title, start time and end time are required' })

    if (new Date(startTime) >= new Date(endTime))
      return res.status(400).json({ message: 'End time must be after start time' })

    const contest = await Contest.create({
      title, description,
      startTime:    new Date(startTime),
      endTime:      new Date(endTime),
      problems:     Array.isArray(problems) ? problems : [],
      createdBy:    req.user?._id,
      participants: [],
    })

    await contest.populate('problems', 'title difficulty tags')
    res.status(201).json(contest)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('problems', 'title difficulty tags')
    if (!contest) return res.status(404).json({ message: 'Contest not found' })
    res.json(contest)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id)
    if (!contest) return res.status(404).json({ message: 'Contest not found' })
    res.json({ message: 'Contest deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getContests, getContest, joinContest, createContest, updateContest, deleteContest }
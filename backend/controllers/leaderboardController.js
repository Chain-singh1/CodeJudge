const Submission = require('../models/Submission')
const User = require('../models/User')

const getLeaderboard = async (req, res) => {
  try {
    // Aggregate: per user, count distinct problems solved (Accepted)
    const leaderboard = await Submission.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: { user: '$user', problem: '$problem' } } },
      { $group: { _id: '$_id.user', solvedCount: { $sum: 1 } } },
      { $sort: { solvedCount: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'user',
          as: 'allSubmissions',
        },
      },
      {
        $project: {
          _id: '$userInfo._id',
          username: '$userInfo.username',
          solvedCount: 1,
          totalSubmissions: { $size: '$allSubmissions' },
        },
      },
    ])

    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getLeaderboard }

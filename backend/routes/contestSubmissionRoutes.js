const express = require('express')
const router = express.Router()
const {
  createContestSubmission, getContestSubmissions,
} = require('../controllers/contestSubmissionController')
const { protect } = require('../middleware/authMiddleware')

router.post('/',               protect, createContestSubmission)
router.get('/:contestId',      protect, getContestSubmissions)

module.exports = router

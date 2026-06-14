const express = require('express')
const router = express.Router()
const { executeCode, judgeCode } = require('../controllers/executeController')
const { protect } = require('../middleware/authMiddleware')

router.post('/',       protect, executeCode)
router.post('/judge',  protect, judgeCode)

module.exports = router

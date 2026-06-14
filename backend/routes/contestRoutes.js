const express = require('express')
const router = express.Router()
const {
  getContests, getContest, joinContest, createContest, updateContest, deleteContest,
} = require('../controllers/contestController')
const { protect }    = require('../middleware/authMiddleware')
const { adminOnly }  = require('../middleware/adminMiddleware')

router.get('/',            protect, getContests)
router.get('/:id',         protect, getContest)
router.post('/:id/join',   protect, joinContest)
router.post('/',           protect, adminOnly, createContest)
router.put('/:id',         protect, adminOnly, updateContest)
router.delete('/:id',      protect, adminOnly, deleteContest)

module.exports = router
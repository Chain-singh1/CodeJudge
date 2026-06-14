const express = require('express')
const router  = express.Router()
const {
  getSnippets, getSnippet, createSnippet, updateSnippet, deleteSnippet,
} = require('../controllers/snippetController')
const { protect } = require('../middleware/authMiddleware')

router.get('/',      protect, getSnippets)
router.get('/:id',   protect, getSnippet)
router.post('/',     protect, createSnippet)
router.put('/:id',   protect, updateSnippet)
router.delete('/:id',protect, deleteSnippet)

module.exports = router;
const express = require('express');
const router  = express.Router();
const { register, login, updateSettings } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.put('/settings',  protect, updateSettings);

module.exports = router;
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })

    if (username.length < 3 || username.length > 30)
      return res.status(400).json({ message: 'Username must be 3–30 characters' })

    if (!USERNAME_REGEX.test(username))
      return res.status(400).json({ message: 'Username can only contain letters, numbers and underscores' })

    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address' })

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' })
    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' })

    const user = await User.create({ username, email, password })
    res.status(201).json({
      token: generateToken(user._id),
      user: { _id: user._id, username: user.username, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password)))
      return res.status(400).json({ message: 'Invalid email or password' })

    res.json({
      token: generateToken(user._id),
      user: { _id: user._id, username: user.username, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ message: 'Server error during login' })
  }
}

const updateSettings = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)

    if (username && username !== user.username) {
      if (await User.findOne({ username }))
        return res.status(400).json({ message: 'Username already taken' })
      user.username = username
    }

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: 'Current password is required' })
      if (!(await user.matchPassword(currentPassword)))
        return res.status(400).json({ message: 'Current password is incorrect' })
      if (newPassword.length < 6)
        return res.status(400).json({ message: 'New password must be at least 6 characters' })
      user.password = newPassword
    }

    await user.save()
    res.json({
      user: { _id: user._id, username: user.username, email: user.email, role: user.role },
    })
  } catch (err) {
    console.error('Settings error:', err.message)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { register, login, updateSettings };
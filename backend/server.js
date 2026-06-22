require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const contestRoutes  = require('./routes/contestRoutes');
const contestSubmissionRoutes = require('./routes/contestSubmissionRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const executeRoutes = require('./routes/executeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const mongoSanitize = require('express-mongo-sanitize')

const app = express();
connectDB();

// ── Security headers
app.use(helmet());

// ── CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}));

// ── Body size limits — prevents huge payload attacks
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(mongoSanitize());

// ── Global rate limit — 200 req/15min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ── Strict rate limit for auth — 20 attempts/15min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again in 15 minutes.' },
});

// ── Execute rate limit — 20 runs/min per IP (prevents fork bombs via rapid requests)
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many code executions, please slow down.' },
});

// ── AI rate limit — 20 requests/min per IP (for Gemini API key)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many AI requests, please slow down.' },
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/contest-submissions', contestSubmissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/execute', executeLimiter, executeRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/snippets', snippetRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
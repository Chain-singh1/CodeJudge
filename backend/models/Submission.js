const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  problem:  { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  language: { type: String, required: true },
  code:     { type: String, required: true },
  status:   { type: String, enum: ['Accepted', 'Wrong Answer', 'Error'], required: true },
}, { timestamps: true })

module.exports = mongoose.model('Submission', submissionSchema)

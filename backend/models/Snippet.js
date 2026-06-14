const mongoose = require('mongoose')

const snippetSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true, trim: true, maxlength: 100 },
  language: { type: String, required: true },
  code:     { type: String, required: true },
}, { timestamps: true })

module.exports = mongoose.model('Snippet', snippetSchema);
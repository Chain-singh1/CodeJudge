const Snippet = require("../models/Snippet");

// GET /api/snippets — all snippets of current user
const getSnippets = async (req, res) => {
  try {
    const snippets = await Snippet.find({ user: req.user._id })
      .select("-code") // omit code in list view for performance
      .sort({ updatedAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/snippets/:id — single snippet with code
const getSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/snippets — create new snippet
const createSnippet = async (req, res) => {
  try {
    const { title, language, code } = req.body;
    if (!title || !language || !code)
      return res
        .status(400)
        .json({ message: "title, language and code are required" });

    const snippet = await Snippet.create({
      user: req.user._id,
      title,
      language,
      code,
    });
    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/snippets/:id — update existing snippet
const updateSnippet = async (req, res) => {
  try {
    const { title, language, code } = req.body;
    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, language, code },
      { new: true, runValidators: true },
    );
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/snippets/:id
const deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getSnippets,
  getSnippet,
  createSnippet,
  updateSnippet,
  deleteSnippet,
};

const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
  },
  { _id: false },
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
    description: { type: String, required: true },
    inputExample: { type: String, default: "" },
    outputExample: { type: String, default: "" },
    constraints: { type: String, default: "" },
    tags: { type: [String], default: [] },
    starterCode: { type: String, default: "" },
    sampleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Problem", problemSchema);

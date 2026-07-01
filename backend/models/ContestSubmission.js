const mongoose = require("mongoose");

const contestSubmissionSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["Accepted", "Wrong Answer", "Error"],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ContestSubmission", contestSubmissionSchema);
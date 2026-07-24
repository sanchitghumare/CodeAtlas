import mongoose from "mongoose";

const AnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    repository: {
      type: String,
      required: true,
    },

    repoUrl: {
      type: String,
      required: true,
    },

    jobId: {
      type: String,
      default: null,
      index: true,
    },

    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed", "Failed"],
      default: "In Progress",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Analysis ||
  mongoose.model("Analysis", AnalysisSchema);

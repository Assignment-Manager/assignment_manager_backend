const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// track per-user assigned status
const AssignedUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  deadline: { type: Date },
  adminFileUrl: { type: String }, // file uploaded by admin (assignment questions)
  submissions: [SubmissionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: [AssignedUserSchema], // array of objects instead of array of ObjectIds
  isCompleted: { type: Boolean, default: false }, // true when ALL assigned users completed
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", TaskSchema);

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String },
  type: { type: String }, // e.g. 'new_user', 'new_task', 'submission'
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // NEW fields:
  relatedExists: { type: Boolean, default: true },
  relatedDeletedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Notification", NotificationSchema);

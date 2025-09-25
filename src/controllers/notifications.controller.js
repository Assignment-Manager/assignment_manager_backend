// controllers/notifications.controller.js
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendAndSaveNotification } = require("../utils/pushSender"); // your existing util
const mongoose = require("mongoose");

// GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  res.json({ notifications, unreadCount });
});

// PATCH /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid id" });

  const notif = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notif) return res.status(404).json({ message: "Not found" });
  res.json({ notification: notif });
});

// PATCH /api/notifications/mark-all-read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  res.json({ message: "All notifications marked as read" });
});

// POST /api/notifications/create-and-send
// Optional endpoint — server code can call sendAndSaveNotification directly.
// Body: { userIds: [id], title, message, type, relatedTaskId }
exports.createAndSend = asyncHandler(async (req, res) => {
  const { userIds, title, message, type, relatedTaskId } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "userIds array required" });
  }
  await sendAndSaveNotification({
    toUserIds: userIds,
    title,
    message,
    type,
    relatedTaskId,
  });
  res.json({ message: "Notifications sent" });
});

// PATCH /api/notifications/related/:taskId/mark-deleted
// Mark notifications that reference a task as "relatedExists: false"
exports.markRelatedDeleted = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(taskId))
    return res.status(400).json({ message: "Invalid taskId" });

  const now = new Date();
  const result = await Notification.updateMany(
    { relatedTaskId: taskId, relatedExists: true },
    { $set: { relatedExists: false, relatedDeletedAt: now } }
  );

  res.json({
    message: "Related notifications marked deleted",
    modifiedCount: result.nModified ?? result.modifiedCount,
  });
});

// DELETE /api/notifications/related/:taskId
// Hard-delete notifications that reference a given task (admin use only).
exports.deleteRelatedNotifications = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(taskId))
    return res.status(400).json({ message: "Invalid taskId" });

  const result = await Notification.deleteMany({ relatedTaskId: taskId });
  res.json({
    message: "Related notifications deleted",
    deletedCount: result.deletedCount,
  });
});

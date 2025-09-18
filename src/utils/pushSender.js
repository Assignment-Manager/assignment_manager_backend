const admin = require("firebase-admin");
const Notification = require("../models/Notification");
const User = require("../models/User");

// init firebase-admin externally (see server.js)
const sendAndSaveNotification = async ({
  toUserIds = [],
  title,
  message,
  type,
  relatedTaskId,
  data = {},
}) => {
  // save notifications and send FCM push
  const users = await User.find({ _id: { $in: toUserIds } });

  const tokens = users.flatMap((u) => u.fcmTokens || []);
  // Create DB notifications
  const notifications = users.map((u) => ({
    userId: u._id,
    title,
    message,
    type,
    relatedTaskId,
  }));
  await Notification.insertMany(notifications);

  if (tokens.length === 0) {
    return { saved: notifications.length, pushed: 0 };
  }

  const messagePayload = {
    notification: { title, body: message },
    data: {
      type,
      relatedTaskId: relatedTaskId ? String(relatedTaskId) : "",
      ...data,
    },
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(messagePayload);
    return {
      saved: notifications.length,
      pushed: response.successCount,
      failures: response.failureCount,
    };
  } catch (err) {
    console.error("FCM push failed:", err.message);
    // Return the DB notifications but mark push as failed
    return {
      saved: notifications.length,
      pushed: 0,
      failures: tokens.length,
    };
  }
};

module.exports = { sendAndSaveNotification };



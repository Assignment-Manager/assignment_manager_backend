const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const token =
  "fK5AN9WQzEbwrID0W6ksoL:APA91bFh4F43XLRP_GblHnRdT9WRxGcUqblEuK8VIkEvdiC4WO9h-wg9GMxwn1a55TVRdKUUfGPDaLjj8LXtUG7oraEx_NzLOCEJsTV74jiV2Fzgf5So8Ms";

router.get("/test-fcm", async (req, res) => {
  try {
    token; // replace with a real FCM token from a device
    const message = {
      token,
      notification: {
        title: "Test",
        body: "Hello from server",
      },
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    console.error("FCM test failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const notifCtrl = require("../controllers/notifications.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

router.use(auth);

router.get("/", notifCtrl.getNotifications);
router.patch("/:id/read", notifCtrl.markAsRead);
router.patch("/mark-all-read", notifCtrl.markAllAsRead);
router.patch(
  "/related/:taskId/mark-deleted",
  requireRole("admin"),
  notifCtrl.markRelatedDeleted
);
router.delete(
  "/related/:taskId",
  requireRole("admin"),
  notifCtrl.deleteRelatedNotifications
);
module.exports = router;

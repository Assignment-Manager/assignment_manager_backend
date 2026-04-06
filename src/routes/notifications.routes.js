const express = require("express");
const router = express.Router();
const notifCtrl = require("../controllers/notifications.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: System notifications and alerts
 */

router.use(auth);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items: {$ref: '#/components/schemas/Notification'}
 *                 unreadCount: {type: integer}
 */
router.get("/", notifCtrl.getNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Notification updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification: {$ref: '#/components/schemas/Notification'}
 */
router.patch("/:id/read", notifCtrl.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a specific notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Notification deleted
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/MessageResponse'}
 */
router.delete("/:id", notifCtrl.deleteNotification);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/MessageResponse'}
 */
router.patch("/mark-all-read", notifCtrl.markAllAsRead);

/**
 * @swagger
 * /notifications/related/{taskId}/mark-deleted:
 *   patch:
 *     summary: Mark notifications as related to deleted task (Admin only)
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Notifications updated
 */
router.patch(
  "/related/:taskId/mark-deleted",
  requireRole("admin"),
  notifCtrl.markRelatedDeleted
);

/**
 * @swagger
 * /notifications/related/{taskId}:
 *   delete:
 *     summary: Delete all notifications related to a task (Admin only)
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Notifications deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: {type: string}
 *                 deletedCount: {type: integer}
 */
router.delete(
  "/related/:taskId",
  requireRole("admin"),
  notifCtrl.deleteRelatedNotifications
);

router.post("/create-and-send", requireRole("admin"), notifCtrl.createAndSend);
module.exports = router;

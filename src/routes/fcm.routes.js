const express = require("express");
const router = express.Router();
const fcmCtrl = require("../controllers/fcm.controller");
const auth = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: FCM
 *   description: Firebase Cloud Messaging token management
 */

/**
 * @swagger
 * /fcm/token:
 *   post:
 *     summary: Save or update FCM token for the current user
 *     tags: [FCM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: {type: string}
 *     responses:
 *       200:
 *         description: Token saved successfully
 */
router.post("/token", auth, fcmCtrl.saveToken);

/**
 * @swagger
 * /fcm/token/remove:
 *   post:
 *     summary: Remove an FCM token from the current user
 *     tags: [FCM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: {type: string}
 *     responses:
 *       200:
 *         description: Token removed successfully
 */
router.post("/token/remove", auth, fcmCtrl.removeToken);

module.exports = router;

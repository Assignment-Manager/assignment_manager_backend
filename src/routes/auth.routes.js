const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstname, lastname, email, password]
 *             properties:
 *               firstname: {type: string}
 *               lastname: {type: string}
 *               email: {type: string}
 *               password: {type: string}
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: {type: string}
 *                 user: {$ref: '#/components/schemas/User'}
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/ErrorResponse'}
 */
router.post("/register", authCtrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: {type: string}
 *               password: {type: string}
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/LoginResponse'}
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/ErrorResponse'}
 */
router.post("/login", authCtrl.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get("/me", authenticate, authCtrl.getProfile);

/**
 * @swagger
 * /auth/social-login:
 *   post:
 *     summary: Login via social provider
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/LoginResponse'}
 *       401:
 *         description: Social login failed
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/ErrorResponse'}
 */
router.post("/social-login", authCtrl.socialLogin);

router.post("/logout", authCtrl.logout);

/**
 * @swagger
 * /auth/all-user:
 *   get:
 *     summary: Get all students (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items: {$ref: '#/components/schemas/User'}
 */
router.get("/all-user", authenticate, requireRole("admin"), authCtrl.allUsers);

/**
 * @swagger
 * /auth/add-user:
 *   post:
 *     summary: Create user by admin
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: {type: string}
 *                 user: {$ref: '#/components/schemas/User'}
 */
router.post("/add-user", authCtrl.createUserByAdmin);

router.post("/forgot-password", authCtrl.forgotPassword);
router.post("/reset-password", authCtrl.resetPassword);

/**
 * @swagger
 * /auth/delete-user/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/delete-user/:id", authenticate, requireRole("admin"), authCtrl.deleteUser);
module.exports = router;

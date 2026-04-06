const express = require("express");
const router = express.Router();
const tasks = require("../controllers/tasks.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const upload = require("../middleware/multer.middleware");

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Assignment and Task management
 */

// All routes require auth
router.use(auth);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: {type: string}
 *               description: {type: string}
 *               deadline: {type: string, format: date}
 *               assignedTo: {type: string, description: "JSON string of user IDs"}
 *               file: {type: string, format: binary}
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: {$ref: '#/components/schemas/Task'}
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema: {$ref: '#/components/schemas/ErrorResponse'}
 */
router.post("/", requireRole("admin"), upload.single("file"), tasks.createTask);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: {$ref: '#/components/schemas/Task'}
 */
router.get("/", requireRole("admin"), tasks.getAllTasks);

/**
 * @swagger
 * /tasks/my-tasks:
 *   get:
 *     summary: Get tasks assigned to current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: {$ref: '#/components/schemas/Task'}
 */
router.get("/my-tasks", tasks.getMyTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: {$ref: '#/components/schemas/Task'}
 *       404:
 *         description: Task not found
 */
router.put(
  "/:id",
  requireRole("admin"),
  upload.single("file"),
  tasks.updateTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete("/:id", requireRole("admin"), tasks.deleteTask);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task details by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task: {$ref: '#/components/schemas/Task'}
 *       404:
 *         description: Task not found
 */
router.get("/:id", requireRole("admin"), tasks.getTaskById);

/**
 * @swagger
 * /tasks/{id}/submit:
 *   post:
 *     summary: Submit a solution for a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: {type: string, format: binary}
 *     responses:
 *       200:
 *         description: Solution submitted
 */
router.post("/:id/submit", upload.single("file"), tasks.submitSolution);

module.exports = router;

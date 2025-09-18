const express = require("express");
const router = express.Router();
const tasks = require("../controllers/tasks.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const upload = require("../middleware/multer.middleware");

// All routes require auth
router.use(auth);

// Admin CRUD
router.post("/", requireRole("admin"), upload.single("file"), tasks.createTask);
router.get("/", requireRole("admin"), tasks.getAllTasks);

// Get tasks assigned to current user
router.get("/me", tasks.getMyTasks);

// Admin update and delete
router.put(
  "/:id",
  requireRole("admin"),
  upload.single("file"),
  tasks.updateTask
);
router.delete("/:id", requireRole("admin"), tasks.deleteTask);
router.get("/:id", requireRole("admin"), tasks.getTaskById);

// User submit (assigned users)
router.post("/:id/submit", upload.single("file"), tasks.submitSolution);

module.exports = router;

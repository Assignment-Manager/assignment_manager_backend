// controllers/tasks.controller.js
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification"); // << add this
const asyncHandler = require("../utils/asyncHandler");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const { sendAndSaveNotification } = require("../utils/pushSender");
const mongoose = require("mongoose"); // optional, useful if you use ObjectId checks or mongoose.startSession()

// helper to upload buffer to cloudinary
const uploadBufferToCloudinary = (buffer, folder = "assignments") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// helper: normalize assignedTo input into array of { userId, isCompleted, completedAt }
const normalizeAssignedToInput = (assignedTo) => {
  // if null/undefined -> []
  if (!assignedTo) return [];

  // if it's a comma separated string, convert to array
  if (typeof assignedTo === "string") {
    try {
      // try parse JSON first
      const parsed = JSON.parse(assignedTo);
      if (Array.isArray(parsed)) assignedTo = parsed;
    } catch (e) {
      // not JSON, maybe comma-separated ids
      assignedTo = assignedTo
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // now assignedTo expected to be an array of ids (strings) or array of objects with userId
  if (!Array.isArray(assignedTo)) return [];

  return assignedTo
    .map((entry) => {
      // entry may be an id or { userId: id }
      const id =
        typeof entry === "string" ? entry : entry.userId || entry._id || null;
      return { userId: id, isCompleted: false, completedAt: null };
    })
    .filter((a) => a.userId);
};

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, deadline } = req.body;
  let { assignedTo = [] } = req.body;

  const assignedToObj = normalizeAssignedToInput(assignedTo);

  const taskData = {
    title,
    description,
    deadline,
    assignedTo: assignedToObj,
    createdBy: req.user._id,
  };

  if (req.file) {
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "assignments/admin"
    );
    taskData.adminFileUrl = result.secure_url;
  }

  const task = await Task.create(taskData);

  // Notify assigned users (send actual userIds array)
  if (assignedToObj.length) {
    const toUserIds = assignedToObj.map((a) => a.userId);
    await sendAndSaveNotification({
      toUserIds,
      title: "New Task Assigned",
      message: `A new task "${title}" has been assigned to you.`,
      type: "TASK_CREATED",
      relatedTaskId: task._id,
    });
  }

  res.status(201).json({ task });
});

exports.getAllTasks = asyncHandler(async (req, res) => {
  // populate createdBy and assignedTo.userId for admin view
  const tasks = await Task.find()
    .populate("createdBy", "firstname lastname email")
    .populate("assignedTo.userId", "firstname lastname email")
    .lean();

  const now = new Date();

  const annotated = tasks.map((t) => {
    const totalAssigned = (t.assignedTo || []).length;
    const completedCount = (t.assignedTo || []).filter(
      (a) => a.isCompleted
    ).length;
    const progress =
      totalAssigned === 0
        ? 0
        : Math.round((completedCount / totalAssigned) * 100);
    const isOverdue = t.deadline
      ? new Date(t.deadline) < now && completedCount < totalAssigned
      : false;

    let status = "Unknown";
    if (totalAssigned === 0) status = "Unassigned";
    else if (completedCount === totalAssigned) status = "Completed";
    else if (completedCount === 0) status = "Not Started";
    else status = "In Progress";

    return {
      ...t,
      totalAssigned,
      completedCount,
      progress,
      status,
      isOverdue,
    };
  });

  res.json({ tasks: annotated });
});

exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // handle file upload
  if (req.file) {
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "assignments/admin"
    );
    updates.adminFileUrl = result.secure_url;
  }

  // If assignedTo provided, normalize and MERGE with existing assignedTo (preserve isCompleted)
  let newlyAddedUserIds = [];
  if ("assignedTo" in updates) {
    const normalized = normalizeAssignedToInput(updates.assignedTo); // [{userId,...},...]
    // Load current task to merge
    const existing = await Task.findById(id).select("assignedTo title").lean();
    if (!existing) return res.status(404).json({ message: "Task not found" });

    const existingMap = new Map(); // userId -> {isCompleted, completedAt}
    (existing.assignedTo || []).forEach((a) => {
      const uid = a.userId ? a.userId.toString() : null;
      if (uid)
        existingMap.set(uid, {
          isCompleted: !!a.isCompleted,
          completedAt: a.completedAt || null,
        });
    });

    // Build merged array, preserving existing completion meta if present
    const merged = normalized.map((a) => {
      const uid = a.userId.toString ? a.userId.toString() : String(a.userId);
      const prev = existingMap.get(uid);
      if (prev) {
        // preserve completion state for existing user
        return {
          userId: a.userId,
          isCompleted: prev.isCompleted,
          completedAt: prev.completedAt,
        };
      }
      // new assignment -> isCompleted false
      newlyAddedUserIds.push(uid);
      return { userId: a.userId, isCompleted: false, completedAt: null };
    });

    updates.assignedTo = merged;
  }

  // Perform update and populate
  const task = await Task.findByIdAndUpdate(id, updates, { new: true })
    .populate("createdBy", "firstname lastname email")
    .populate("assignedTo.userId", "firstname lastname email");

  // Notify newly assigned users only
  if (newlyAddedUserIds.length) {
    await sendAndSaveNotification({
      toUserIds: newlyAddedUserIds,
      title: "New Task Assigned",
      message: `You have been assigned to task "${task.title}".`,
      type: "TASK_ASSIGNED",
      relatedTaskId: task._id,
    });
  }

  res.json({ task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // start session/transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const task = await Task.findById(id).session(session);
    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Task not found" });
    }

    // Hard delete task
    await Task.findByIdAndDelete(id).session(session);

    // Optionally delete admin file from Cloudinary here (if you keep a mapping)
    // try { await deleteFromCloudinary(task.adminFileUrl); } catch (e) { /* log and continue */ }

    const deletedAt = new Date();

    // Mark existing notifications as stale (relatedExists = false)
    await Notification.updateMany(
      { relatedTaskId: task._id, relatedExists: { $ne: false } },
      { $set: { relatedExists: false, relatedDeletedAt: deletedAt } }
    ).session(session);

    // collect assigned user ids for later notification (we'll send after commit)
    const assignedUserIds = (task.assignedTo || [])
      .map((a) => (a.userId ? a.userId.toString() : null))
      .filter(Boolean);

    // commit transaction first
    await session.commitTransaction();
    session.endSession();

    // send deletion notification OUTSIDE transaction (so DB commit isn't affected by push failures)
    if (assignedUserIds.length > 0) {
      try {
        await sendAndSaveNotification({
          toUserIds: assignedUserIds,
          title: "Task Deleted",
          message: `The task "${task.title}" was deleted by an admin.`,
          type: "TASK_DELETED",
          relatedTaskId: task._id,
        });
      } catch (pushErr) {
        // push/send failure should not break deletion — log and continue
        console.error("Failed to send task-deleted notifications:", pushErr);
      }
    }

    return res.json({ message: "Task deleted and notifications updated" });
  } catch (err) {
    // abort and close session on error
    try {
      await session.abortTransaction();
    } catch (_) {}
    session.endSession();
    throw err; // let your asyncHandler middleware handle the response
  }
});

// user completes task & uploads solution (transactional)
exports.submitSolution = asyncHandler(async (req, res) => {
  const { id } = req.params; // task id
  const userId = req.user._id;

  // upload file first (if any)
  let fileUrl = null;
  if (req.file) {
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "assignments/submissions"
    );
    fileUrl = result.secure_url;
  }

  // start a transaction to avoid race conditions when many users submit at once
  const session = await Task.startSession();
  session.startTransaction();

  try {
    // lock the document for update
    const task = await Task.findById(id).session(session);
    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Task not found" });
    }

    // ensure user is assigned
    const assignedEntry = task.assignedTo.find(
      (a) => a.userId.toString() === userId.toString()
    );
    if (!assignedEntry) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json({ message: "You are not assigned to this task" });
    }

    // find if user already has a submission
    const subIndex = task.submissions.findIndex(
      (s) => s.userId.toString() === userId.toString()
    );

    if (subIndex >= 0) {
      // update existing submission (resubmission allowed)
      if (fileUrl) task.submissions[subIndex].fileUrl = fileUrl;
      task.submissions[subIndex].submittedAt = new Date();
    } else {
      // create new submission
      task.submissions.push({
        userId,
        fileUrl,
        submittedAt: new Date(),
      });
    }

    // mark this user as completed (per-assigned entry)
    assignedEntry.isCompleted = true;
    assignedEntry.completedAt = new Date();

    // recompute global isCompleted: true only if every assigned user done
    const allDone =
      task.assignedTo.length > 0 && task.assignedTo.every((a) => a.isCompleted);
    task.isCompleted = allDone;

    // save within session
    await task.save({ session });

    // commit
    await session.commitTransaction();
    session.endSession();

    // send notifications outside transaction (so it doesn't block DB)
    const admins = await User.find({ role: "admin" }).select(
      "_id firstname lastname"
    );
    const adminIds = admins.map((a) => a._id);
    await sendAndSaveNotification({
      toUserIds: adminIds,
      title: "Task Submission",
      message: `${req.user.firstname || ""} ${
        req.user.lastname || ""
      } submitted solution for "${task.title}".`,
      type: "TASK_SUBMISSION",
      relatedTaskId: task._id,
    });

    return res.json({ task });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

exports.getMyTasks = asyncHandler(async (req, res) => {
  // find tasks where assignedTo.userId includes current user
  const tasks = await Task.find({ "assignedTo.userId": req.user._id })
    .populate("createdBy", "firstname lastname email")
    .populate("assignedTo.userId", "firstname lastname email")
    .lean();

  // annotate each task with current user's assigned object and their submission (if any)
  const annotated = tasks.map((t) => {
    const assigned =
      t.assignedTo.find(
        (a) => a.userId.toString() === req.user._id.toString()
      ) || {};
    const submission =
      (t.submissions || []).find(
        (s) => s.userId.toString() === req.user._id.toString()
      ) || null;

    return {
      ...t,
      myAssignmentStatus: {
        isCompleted: assigned.isCompleted || false,
        completedAt: assigned.completedAt || null,
      },
      mySubmission: submission,
    };
  });

  res.json({ tasks: annotated });
});

exports.getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // populate assignedTo.userId and submissions.userId if they are ObjectId references
  const task = await Task.findById(id)
    .populate("assignedTo.userId", "firstname lastname email")
    .populate("submissions.userId", "firstname lastname email");

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json({ task });
});

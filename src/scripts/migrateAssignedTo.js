// scripts/migrateAssignedTo.js
const mongoose = require("mongoose");
const Task = require("../models/Task");
require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const tasks = await Task.find();
  for (const t of tasks) {
    if (
      t.assignedTo &&
      t.assignedTo.length > 0 &&
      typeof t.assignedTo[0] !== "object"
    ) {
      t.assignedTo = t.assignedTo.map((id) => ({
        userId: id,
        isCompleted: false,
        completedAt: null,
      }));
      await t.save();
      console.log(`Migrated task ${t._id}`);
    }
  }

  console.log("Migration complete");
  process.exit(0);
})();

const express = require("express");
const authRoutes = require("./routes/auth.routes");
const tasksRoutes = require("./routes/tasks.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const fcmRoutes = require("./routes/fcm.routes");
const errorHandler = require("./middleware/error.middleware");
const FRONTEND_URLS = process.env.FRONTEND_URLS;
const cors = require("cors");
const app = express();
const testRoutes = require("./routes/test");
app.use("/api", testRoutes);

app.use(
  cors({
    origin: function (origin, callback) {
      // Handle non-browser requests (like Postman, curl)
      if (!origin) return callback(null, true);

      if (FRONTEND_URLS.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("Blocked by CORS:", origin);
        return callback(new Error("CORS Error: Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/fcm", fcmRoutes);
app.use("/api", testRoutes);

// health
app.get("/api/health", (req, res) =>
  res.json({ message: "server is operational", status: "ok" })
);

app.use(errorHandler);

module.exports = app;

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const tasksRoutes = require("./routes/tasks.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const fcmRoutes = require("./routes/fcm.routes");
const testRoutes = require("./routes/test");
const errorHandler = require("./middleware/error.middleware");

const app = express();
app.use((req, res, next) => {
  console.log("Incoming Origin:", req.headers.origin);
  next();
});

// --- CORS setup ---
// Read FRONTEND_URLS from env and normalise to hostnames
const FRONTEND_URLS = process.env.FRONTEND_URLS || "";
const allowedHostnames = new Set(
  FRONTEND_URLS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((u) => {
      try {
        return new URL(u).hostname;
      } catch (e) {
        // if it's not a valid URL, keep the original string (fallback)
        return u;
      }
    })
);

// local dev / LAN regexes (unchanged)
const localOriginRegex =
  /^https?:\/\/(?:(?:localhost)|(?:127\.0\.0\.1)|(?:\[::1\]))(?::\d+)?$/i;
const localLanRegex =
  /^https?:\/\/(?:(?:10\.(?:\d{1,3}\.){2}\d{1,3})|(?:192\.168\.\d{1,3}\.\d{1,3})|(?:172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}))(?:\:\d+)?$/i;

const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser tools (curl/postman) - origin is undefined/null
    if (!origin) return callback(null, true);

    let originHostname;
    try {
      originHostname = new URL(origin).hostname;
    } catch (e) {
      // invalid origin header
      console.warn("CORS: invalid origin header:", origin);
      return callback(new Error("CORS Error: Not allowed by CORS"));
    }

    // allow if hostname matches any allowed hostname from env
    if (allowedHostnames.has(originHostname)) return callback(null, true);

    // allow local dev origins
    if (localOriginRegex.test(origin)) return callback(null, true);
    if (localLanRegex.test(origin)) return callback(null, true);

    console.warn("Blocked by CORS:", origin);
    return callback(new Error("CORS Error: Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// apply CORS
app.use(cors(corsOptions));
// ensure preflight responses include CORS headers
app.options("*", cors(corsOptions));
// --- Middleware ---
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/fcm", fcmRoutes);
app.use("/api", testRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ message: "server is operational", status: "ok" })
);

// Error handler
app.use(errorHandler);

module.exports = app;

require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");
const app = require("./app");
const connectDB = require("./config/db");
const path = require("path");

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;

// connect to DB
connectDB(mongoUri);

// init firebase-admin
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
  try {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_B64,
      "base64"
    ).toString("utf8");
    serviceAccount = JSON.parse(json);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("✅ Firebase admin initialized from env variable");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_B64:", err);
  }
} else {
  const serviceAccountPath = path.join(
    __dirname,
    "secrets/firebase-service-account.json"
  );

  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase admin initialized from local file");
  } else {
    console.warn(
      "⚠️ No Firebase credentials found (env var or file). FCM will not work."
    );
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

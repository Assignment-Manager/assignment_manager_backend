const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendAndSaveNotification } = require("../utils/pushSender");
const { sendEmail } = require("../utils/emailSender");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const FRONTEND_URLS = process.env.FRONTEND_URLS || "";

exports.registerUser = async ({
  firstname,
  lastname,
  email,
  password,
  role,
}) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstname,
    lastname,
    email,
    passwordHash,
    role: role || "user",
  });

  const admins = await User.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((a) => a._id);

  // notify admins
  try {
    await sendAndSaveNotification({
      toUserIds: adminIds,
      title: "New user registered",
      message: `${user.firstname} ${user.lastname} registered.`,
      type: "new_user",
      relatedTaskId: null,
    });
  } catch (e) {
    // do not fail registration if notification fails
    console.error("sendAndSaveNotification failed", e);
  }

  const data = user.toObject();
  delete data.passwordHash;
  return { message: "User registered", data };
};

exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    },
  };
};

exports.logoutUser = async () => {
  return { message: "Logged out successfully" };
};

exports.forgotPassword = async (email) => {
  if (!email) throw new Error("Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new Error("Email not found");

  const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "30m",
  });

  const resetUrl = `${FRONTEND_URLS}reset-password/${resetToken}`;

  await sendEmail(
    user.email,
    "Password Reset",
    `Click here to reset your password: ${resetUrl}`,
    `<p>Click <a href="${resetUrl}">here</a> to reset your password</p>`
  );

  return { message: "Password reset email sent" };
};

exports.resetPassword = async ({ token, password }) => {
  if (!token || !password) throw new Error("Token and new password required");

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }

  const user = await User.findById(payload.id);
  if (!user) throw new Error("User not found");

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  return { message: "Password reset successful" };
};

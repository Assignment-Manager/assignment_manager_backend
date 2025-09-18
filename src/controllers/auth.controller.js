const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendAndSaveNotification } = require("../utils/pushSender");
const nodemailer = require("nodemailer");

exports.register = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;
  if (!firstname || !lastname || !email || !password)
    return res.status(400).json({ message: "Missing fields" });

  let existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstname,
    lastname,
    email,
    passwordHash,
    role: role || "user",
  });

  // notify admins about new user
  const admins = await User.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((a) => a._id);
  await sendAndSaveNotification({
    toUserIds: adminIds,
    title: "New user registered",
    message: `${user.firstname} ${user.lastname} registered.`,
    type: "new_user",
    relatedTaskId: null,
  });

  res.status(201).json({ message: "User registered", data: user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing email/password" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  return res.status(200).json({ message: "Logged out successfully" });
});

exports.allUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: "admin" } }).select(
    "-passwordHash"
  );
  res.json({ users });
});

exports.createUserByAdmin = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;
  if (!firstname || !lastname || !email || !password || !role)
    return res.status(400).json({ message: "Missing fields" });

  let existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstname,
    lastname,
    email,
    passwordHash,
    role,
  });

  res.status(201).json({ message: "User created by admin", data: user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Email not found" });

  // Generate reset token (expires in 1 hour)
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });

  // Send email (configure transporter as needed)
  const transporter = nodemailer.createTransport({
    // Example for Gmail, replace with your SMTP config
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URLS}reset-password/${resetToken}`;
  await transporter.sendMail({
    to: user.email,
    subject: "Password Reset",
    text: `Click here to reset your password: ${resetUrl}`,
  });

  res.json({ message: "Password reset email sent" });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: "Token and new password required" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  res.json({ message: "Password reset successful" });
});

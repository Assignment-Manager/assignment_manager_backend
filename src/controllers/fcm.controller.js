const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

exports.saveToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  console.log(
    "saveToken called for user:",
    req.user ? req.user._id : "no-user",
    "body:",
    req.body
  );

  if (!token) return res.status(400).json({ message: "No token" });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.fcmTokens) user.fcmTokens = [];
  if (!user.fcmTokens.includes(token)) {
    user.fcmTokens.push(token);
    await user.save();
  }

  res.json({ message: "Token saved" });
});

exports.removeToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.fcmTokens = (user.fcmTokens || []).filter((t) => t !== token);
  await user.save();
  res.json({ message: "Token removed" });
});

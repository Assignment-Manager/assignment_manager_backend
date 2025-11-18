const asyncHandler = require("../utils/asyncHandler");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require("../services/authService");
const {
  getAllUsers,
  createUserByAdmin,
  getUserProfile,
} = require("../services/userService");
const {
  validateRegister,
  validateLogin,
  handleValidationError,
} = require("../utils/validate");

exports.register = asyncHandler(async (req, res) => {
  try {
    const value = await validateRegister(req.body);
    const result = await registerUser(value);
    res.status(201).json(result);
  } catch (err) {
    if (handleValidationError(err, res)) return;
    throw err;
  }
});

exports.login = asyncHandler(async (req, res) => {
  try {
    const value = await validateLogin(req.body);
    const result = await loginUser(value);
    res.json(result);
  } catch (err) {
    if (handleValidationError(err, res)) return;
    if (err.message === "Invalid credentials")
      return res.status(401).json({ message: err.message });
    throw err;
  }
});

exports.logout = asyncHandler(async (req, res) => {
  const result = await logoutUser();
  res.json(result);
});

exports.allUsers = asyncHandler(async (req, res) => {
  const result = await getAllUsers();
  res.json(result);
});

exports.createUserByAdmin = asyncHandler(async (req, res) => {
  try {
    const payload = req.body;
    const result = await createUserByAdmin(payload);
    res.status(201).json(result);
  } catch (err) {
    if (
      err.message === "Missing fields" ||
      err.message === "Email already registered"
    )
      return res.status(400).json({ message: err.message });
    throw err;
  }
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);
    res.json(result);
  } catch (err) {
    if (err.message === "Email is required")
      return res.status(400).json({ message: err.message });
    if (err.message === "Email not found")
      return res.status(404).json({ message: err.message });
    throw err;
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await resetPassword({ token, password });
    res.json(result);
  } catch (err) {
    if (err.message === "Token and new password required")
      return res.status(400).json({ message: err.message });
    if (err.message === "Invalid or expired token")
      return res.status(400).json({ message: err.message });
    if (err.message === "User not found")
      return res.status(404).json({ message: err.message });
    throw err;
  }
});

exports.getProfile = asyncHandler(async (req, res) => {
  try {
    const result = await getUserProfile(req.user._id);
    res.json(result);
  } catch (err) {
    if (err.message === "User not found")
      return res.status(404).json({ message: err.message });
    throw err;
  }
});

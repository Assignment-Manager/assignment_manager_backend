const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.getAllUsers = async () => {
  const users = await User.find({ role: { $ne: "admin" } }).select(
    "-passwordHash"
  );
  return { users, total: users.length };
};

exports.createUserByAdmin = async ({
  firstname,
  lastname,
  email,
  password,
  role,
}) => {
  if (!firstname || !lastname || !email || !password || !role)
    throw new Error("Missing fields");

  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstname,
    lastname,
    email,
    passwordHash,
    role,
  });

  const data = user.toObject();
  delete data.passwordHash;
  return { message: "User created by admin", data };
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) throw new Error("User not found");
  return { user };
};

exports.deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new Error("User not found");
  return { message: "User deleted successfully" };
};

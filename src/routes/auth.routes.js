const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");

// routes
router.post("/register", authCtrl.register);
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});
router.post("/login", authCtrl.login);
router.post("/logout", authCtrl.logout);
router.get("/all-user", authCtrl.allUsers);
router.post("/add-user", authCtrl.createUserByAdmin);
router.post("/forgot-password", authCtrl.forgotPassword);
router.post("/reset-password", authCtrl.resetPassword);
module.exports = router;

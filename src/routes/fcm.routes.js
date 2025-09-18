const express = require("express");
const router = express.Router();
const fcmCtrl = require("../controllers/fcm.controller");
const auth = require("../middleware/auth.middleware");

router.post("/token", auth, fcmCtrl.saveToken);
router.post("/token/remove", auth, fcmCtrl.removeToken);

module.exports = router;

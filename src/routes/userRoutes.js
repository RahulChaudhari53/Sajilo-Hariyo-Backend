const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword); 
router.post("/verifyOtp", authController.verifyPassOTP); 
router.post("/resetPassword", authController.resetPassword); 

module.exports = router;

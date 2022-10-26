const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  userOnline,
  userOffline
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);
router.post("/online", userOnline);
router.post("/offline", userOffline);

module.exports = router;

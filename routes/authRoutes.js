const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");

// ----------------------
// REGISTER USER (WITH IMAGE)
// ----------------------
router.post("/register", upload.any(), registerUser); 
// Using upload.any() so image key can be anything in Postman

// ----------------------
// LOGIN USER
// ----------------------
router.post("/login", loginUser);

// ----------------------
// GET PROFILE (PROTECTED)
// ----------------------
router.get("/profile", protect, getUserProfile);

// ----------------------
// UPDATE PROFILE (WITH IMAGE) (PROTECTED)
// ----------------------
router.put("/profile", protect, upload.any(), updateUserProfile);

// ----------------------
// UPLOAD IMAGE ONLY (POST) (PROTECTED)
// ----------------------
router.post("/upload-image", protect, upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // take the first uploaded file
    const file = req.files[0];

    // update user's profile image
    const user = req.user;
    user.profileImageUrl = `/uploads/${file.filename}`;
    await user.save();

    res.status(200).json({
      message: "Image uploaded successfully",
      profileImageUrl: user.profileImageUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUserById,
  deleteUser,
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

// -------------------------
// Admin: Get all users
// GET /api/users
// -------------------------
router.get("/", protect, adminOnly, getUsers);

// -------------------------
// User/Admin: Get user by ID
// GET /api/users/:id
// -------------------------
router.get("/:id", protect, getUserById);

// -------------------------
// Admin: Delete user
// DELETE /api/users/:id
// -------------------------


module.exports = router;

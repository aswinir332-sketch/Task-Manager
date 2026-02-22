const express = require("express");
const {
  protect,
  adminOnly
} = require("../middlewares/authMiddleware");

const {
  getDashboardData,
  getUserDashboardData,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist
} = require("../controllers/taskController");

const router = express.Router();

// -------------------------
// Task Management Routes
// -------------------------

// Admin dashboard data
router.get("/dashboard-data", protect, getDashboardData);

// User dashboard data
router.get("/user-dashboard-data", protect, getUserDashboardData);

// Get all tasks
// Admin: all tasks
// User: assigned tasks
router.get("/", protect, getTasks);

// Get task by ID
router.get("/:id", protect, getTaskById);

// Create task (Admin only)
router.post("/", protect, adminOnly, createTask);

// Update task details
router.put("/:id", protect, updateTask);

// Delete task (Admin only)
router.delete("/:id", protect, adminOnly, deleteTask);

// Update task status
router.put("/:id/status", protect, updateTaskStatus);

// Update task checklist (todo)
router.put("/:id/todo", protect, updateTaskChecklist);

module.exports = router;

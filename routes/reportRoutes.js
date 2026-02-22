// routes/reportRoutes.js

const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Import the controller functions
const {
  exportTasksReport,
  exportUserReport,        // Note: function name is exportUserReport (singular)
} = require("../controllers/reportController");  // Adjust path if needed

const router = express.Router();

// Route to export all tasks report
router.get("/export/tasks", protect, adminOnly, exportTasksReport);

// Route to export user-wise task statistics report
router.get("/export/users", protect, adminOnly, exportUserReport);

module.exports = router;
const Task = require("../models/Task");
const User = require("../models/User");

// ------------------------------------
// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
// ------------------------------------
const getUsers = async (req, res) => {
  try {
    // Get only members (exclude admin if needed)
    const users = await User.find({ role: "member" }).select("-password");

    // Add task counts for each user
    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Pending",
        });

        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "In Progress",
        });

        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Completed",
        });

        return {
          ...user._doc, // include all user fields
          pendingTasks,
          inProgressTasks,
          completedTasks,
        };
      })
    );

    res.status(200).json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ------------------------------------
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
// ------------------------------------
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Task counts for single user
    const pendingTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: "Pending",
    });

    const inProgressTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: "In Progress",
    });

    const completedTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: "Completed",
    });

    res.status(200).json({
      ...user._doc,
      pendingTasks,
      inProgressTasks,
      completedTasks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ------------------------------------
// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
// ------------------------------------

// ------------------------------------
module.exports = {
  getUsers,
  getUserById
};

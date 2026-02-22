const Task = require("../models/Task");
const User = require("../models/User");

// -----------------------------
// Get all tasks
// -----------------------------
const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    let tasks;
    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    }

    tasks = tasks.map((task) => {
      const completedCount = Array.isArray(task.todoChecklist)
        ? task.todoChecklist.filter((item) => item.completed).length
        : 0;
      return { ...task._doc, completedTodoCount: completedCount };
    });

    const allTasks = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user._id }
    );
    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "Pending",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "In Progress",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });
    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "Completed",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    res.json({
      tasks,
      statusSummary: { all: allTasks, pendingTasks, inProgressTasks, completedTasks },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Get task by ID
// -----------------------------
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo createdBy",
      "name email profileImageUrl"
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Create task
// -----------------------------
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;

    const task = await Task.create({
      title,
      description,
      priority: priority || "Medium",
      dueDate,
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
      createdBy: req.user._id,
      attachments: Array.isArray(attachments) ? attachments : [],
      todoChecklist: Array.isArray(todoChecklist) ? todoChecklist : [],
      progress: 0,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Update task (updated version)
// -----------------------------
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Update general fields
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.status = req.body.status || task.status;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
      : task.attachments;

    // Update assignedTo if provided
    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res.status(400).json({ message: "assignedTo must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    // Update todoChecklist if provided
    if (Array.isArray(req.body.todoChecklist)) {
      task.todoChecklist = req.body.todoChecklist.map(item => ({
        ...item,
        completed: Boolean(item.completed),
      }));

      // Recalculate progress
      const totalItems = task.todoChecklist.length;
      const completedCount = task.todoChecklist.filter(item => item.completed).length;
      task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

      // Update status based on progress
      if (task.progress === 100) task.status = "Completed";
      else if (task.progress > 0) task.status = "In Progress";
      else task.status = "Pending";
    }

    const updatedTask = await task.save();
    res.json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Delete task
// -----------------------------
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Update task status
// -----------------------------
const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const { status } = req.body;
    task.status = status || task.status;
    await task.save();
    res.json({ message: "Task status updated", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Update task checklist
// -----------------------------
const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Authorization check
    if (!task.assignedTo.map(id => id.toString()).includes(req.user._id.toString()) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update checklist" });
    }

    if (!Array.isArray(todoChecklist)) {
      return res.status(400).json({ message: "todoChecklist must be an array" });
    }

    // Ensure completed is boolean
    task.todoChecklist = todoChecklist.map(item => ({
      ...item,
      completed: Boolean(item.completed),
    }));

    // Calculate progress
    const totalItems = task.todoChecklist.length;
    const completedCount = task.todoChecklist.filter(item => item.completed).length;
    task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Update status based on progress
    if (task.progress === 100) task.status = "Completed";
    else if (task.progress > 0) task.status = "In Progress";
    else task.status = "Pending";

    await task.save();

    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    res.json({ message: "Task checklist updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
const getDashboardData = async (req, res) => {
  try {
    const allTasks = await Task.countDocuments({});
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ status: "In Progress" });
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status
    const taskStatuses = ["Pending", "In Progress", "Completed"]; // Match exact casing
    const taskDistributionRaw = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      acc[status.replace(/\s+/g, "")] = 
        taskDistributionRaw.find(item => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = allTasks; // Fixed variable

    // Task distribution by priority
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] = 
        taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0;
      return acc;
    }, {});

    // Recent tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks: allTasks,
        pendingTasks,
        inProgressTasks,     // Added if you want it
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// User-specific dashboard data
// -----------------------------
// User-specific dashboard data
// -----------------------------
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Basic statistics (assigned to the user)
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ assignedTo: userId, status: "In Progress" });
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });

    // Overdue tasks: not completed and dueDate is past today
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status (for charts)
    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, ""); // e. g., "InProgress"
      acc[formattedKey] = taskDistributionRaw.find(item => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    // Task distribution by priority (for charts)
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] = taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0;
      return acc;
    }, {});

    // Recent tasks assigned to the user
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt")
      .populate("assignedTo", "name email profileImageUrl");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Error in getUserDashboardData:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -----------------------------
// Export all functions
// -----------------------------
module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};

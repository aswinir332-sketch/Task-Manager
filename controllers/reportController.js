// controllers/reportController.js

const Task = require('../models/Task');
const User = require('../models/User');
const excelJS = require('exceljs');

/**
 * @desc    Export all tasks to Excel
 * @route   GET /api/reports/export/tasks
 * @access  Private (Admin)
 */
const exportTasksReport = async (req, res) => {
  try {
    // Fetch all tasks and populate assignedTo with name and email
    const tasks = await Task.find().populate('assignedTo', 'name email');

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks Report');

    // Define columns
    worksheet.columns = [
      { header: 'Task ID', key: '_id', width: 25 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 20 },
      { header: 'Assigned To', key: 'assignedTo', width: 30 },
    ];

    // Add rows
    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        ? `${task.assignedTo.name} (${task.assignedTo.email})`
        : 'Unassigned';

      worksheet.addRow({
        _id: task._id.toString(),
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || '',
        status: task.status || '',
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        assignedTo,
      });
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Tasks_Report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating tasks report', error: error.message });
  }
};

/**
 * @desc    Export user-wise task statistics report
 * @route   GET /api/reports/export/users
 * @access  Private (Admin)
 */
const exportUserReport = async (req, res) => {
  try {
    // Fetch all users (assuming email field is 'email', adjust if it's 'email_id')
    const users = await User.find().select('name email').lean();

    // Fetch all tasks and populate assignedTo
    const tasks = await Task.find().populate('assignedTo', 'name email');

    // Initialize stats map
    const userTaskMap = {};

    users.forEach((user) => {
      userTaskMap[user._id.toString()] = {
        name: user.name || '',
        email: user.email || '',
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    // Count tasks per user
    tasks.forEach((task) => {
      // Handle case where assignedTo might be single user or array (depending on your schema)
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];

      assignees.forEach((assignee) => {
        const userId = assignee._id.toString();
        if (userTaskMap[userId]) {
          userTaskMap[userId].taskCount += 1;

          if (task.status?.toLowerCase() === 'pending') {
            userTaskMap[userId].pendingTasks += 1;
          } else if (task.status?.toLowerCase() === 'in progress' || task.status?.toLowerCase() === 'in-progress') {
            userTaskMap[userId].inProgressTasks += 1;
          } else if (task.status?.toLowerCase() === 'completed') {
            userTaskMap[userId].completedTasks += 1;
          }
        }
      });
    });

    // Create workbook
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Task Report');

    // Define columns
    worksheet.columns = [
      { header: 'User Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'Total Assigned Tasks', key: 'taskCount', width: 22 },
      { header: 'Pending Tasks', key: 'pendingTasks', width: 20 },
      { header: 'In Progress Tasks', key: 'inProgressTasks', width: 22 },
      { header: 'Completed Tasks', key: 'completedTasks', width: 20 },
    ];

    // Add data rows
    Object.values(userTaskMap).forEach((userStats) => {
      worksheet.addRow(userStats);
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Set headers for download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="User_Task_Report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating user report', error: error.message });
  }
};

// Export both functions
module.exports = {
  exportTasksReport,
  exportUserReport,  // Fixed typo: was exportUsersReport
};
const mongoose = require("mongoose");

// -----------------------------
// Todo Checklist Schema
// -----------------------------
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

// -----------------------------
// Task Schema
// -----------------------------
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    description: { type: String },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },

    dueDate: { type: Date, required: true },

    // -----------------------------
    // Can assign to multiple users
    // -----------------------------
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // User who created the task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attachments: [{ type: String }],

    todoChecklist: [todoSchema],

    progress: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// -----------------------------
// Export Task Model
// -----------------------------
module.exports = mongoose.model("Task", taskSchema);

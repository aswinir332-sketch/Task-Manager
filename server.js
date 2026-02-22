require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

// ⚠️ DEVELOPMENT ONLY: allow requests from any origin
app.use(cors({
  origin: "*",          // allow all origins
  credentials: true,    // allow cookies/auth headers
}));

// Parse JSON & form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES (UPLOADS)
========================= */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   DATABASE
========================= */

connectDB();

/* =========================
   ROUTES
========================= */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("API is running...");
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

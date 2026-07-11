const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import API routes
const evidenceRoutes = require("./routes/evidence");
const statsRoutes = require("./routes/stats");
const auditRoutes = require("./routes/audit");

// Mount routes
app.use("/api/evidence", evidenceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/audit-logs", auditRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error: " + err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
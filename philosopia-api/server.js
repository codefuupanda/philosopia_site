const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const philosophersRoutes = require("./routes/philosophers");
const periodsRoutes = require("./routes/periods");
const conceptsRouter = require("./routes/concepts");
const schoolsRoutes = require("./routes/schools");
const beefsRoutes = require("./routes/beefs");
const artworkRoutes = require("./routes/artworkRoutes");
const authRoutes = require("./routes/authRoutes");
const quotesRoutes = require("./routes/quotes");
const worksRoutes = require("./routes/works");

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// API routes
app.use("/api/philosophers", philosophersRoutes);
app.use("/api/periods", periodsRoutes);
app.use("/api/concepts", conceptsRouter);
app.use("/api/schools", schoolsRoutes);
app.use("/api/beefs", beefsRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/works", worksRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
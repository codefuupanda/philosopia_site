import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import philosophersRoutes from "./routes/philosophers.js";
import periodsRoutes from "./routes/periods.js";
import conceptsRouter from "./routes/concepts.js";
import schoolsRoutes from "./routes/schools.js";
import beefsRoutes from "./routes/beefs.js";
import artworkRoutes from "./routes/artworkRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import quotesRoutes from "./routes/quotes.js";
import worksRoutes from "./routes/works.js";
import requestLogger from "./middleware/requestLogger.js";
import { cacheMiddleware } from "./middleware/cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

if (process.env.USE_CUSTOM_DNS === "true") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("Using custom DNS servers (Google DNS)");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(cacheMiddleware(5 * 60 * 1000)); // 5 minute TTL

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

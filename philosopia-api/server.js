import express from "express";
import cors from "cors";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { rawClient, TABLES } from "./db/client.js";

import philosophersRoutes from "./routes/philosophers.js";
import periodsRoutes from "./routes/periods.js";
import conceptsRouter from "./routes/concepts.js";
import schoolsRoutes from "./routes/schools.js";
import beefsRoutes from "./routes/beefs.js";
import artworkRoutes from "./routes/artworkRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import quotesRoutes from "./routes/quotes.js";
import worksRoutes from "./routes/works.js";
import analyticsRoutes from "./routes/analytics.js";
import requestLogger from "./middleware/requestLogger.js";
import { cacheMiddleware } from "./middleware/cache.js";
import healthCheck from "./middleware/healthCheck.js";

// .env is loaded by db/client.js (works regardless of cwd)

const app = express();

// Health check endpoint (before logger to avoid noisy logs)
app.get("/api/health", healthCheck);

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(cacheMiddleware(5 * 60 * 1000)); // 5 minute TTL

// Database connectivity check (non-fatal — requests surface their own errors)
rawClient.send(new DescribeTableCommand({ TableName: TABLES.content }))
  .then(() => console.log(`✅ Connected to DynamoDB (${process.env.AWS_REGION || 'us-east-1'})`))
  .catch((err) => console.error("❌ DynamoDB connection error:", err.name, err.message));

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
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

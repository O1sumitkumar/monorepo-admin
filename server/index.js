// server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { initializeDatabase } from "./config/database.js";
import routes from "./routes/v1/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import logger from "./config/logger.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy
app.set("trust proxy", 1);

// Security & CORS
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: "Too many requests, try again later." },
    skip: (req) => req.path === "/api/health",
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Colorful request logging
app.use((req, res, next) => {
  req.id = uuidv4();
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log(level, `${req.method} ${req.path}`, {
      id: req.id.slice(0, 8),
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});

// Routes
app.use("/api/v1", routes);
app.use("/api", routes);

// Error handling
app.use(notFound);
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.path}`, {
    id: req.id?.slice(0, 8),
    error: err.message,
    stack: err.stack?.split("\n")[1]?.trim(),
  });
  errorHandler(err, req, res, next);
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      logger.success(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 API: http://localhost:${PORT}/api/v1`);
      logger.info(`🏥 Health: http://localhost:${PORT}/api/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server", { error: error.message });
    process.exit(1);
  }
};

// Process handlers
process.on("unhandledRejection", (err) => {
  logger.error("💥 Unhandled rejection", { error: err.message });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("💥 Uncaught exception", { error: err.message });
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();

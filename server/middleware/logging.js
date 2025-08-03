// middleware/logging.js
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger.js";

// Add request ID middleware
export const addRequestId = (req, res, next) => {
  req.id = uuidv4();
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  logger.info("Incoming request", {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("User-Agent")?.substring(0, 100),
    hasAuth: !!req.headers.authorization,
    contentType: req.get("Content-Type"),
  });

  // Override res.send to log response
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;

    logger.info("Request completed", {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length"),
    });

    return originalSend.call(this, body);
  };

  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error("Request error", {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode || 500,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
    ...(err.statusCode >= 500 && { stack: err.stack }), // Only log stack for server errors
  });

  next(err);
};

// Process event handlers
export const setupProcessLogging = () => {
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Promise Rejection", {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
    });
    process.exit(1);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received - shutting down gracefully`);
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

import { createLogger, format, transports } from "winston";
import chalk from "chalk";

// Color schemes for different log levels
const colors = {
  info: chalk.cyan,
  error: chalk.red,
  warn: chalk.yellow,
  debug: chalk.magenta,
  success: chalk.green,
};

// HTTP status code colors
const statusColors = {
  2: chalk.green, // 2xx - Success
  3: chalk.cyan, // 3xx - Redirection
  4: chalk.yellow, // 4xx - Client Error
  5: chalk.red, // 5xx - Server Error
};

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "HH:mm:ss" }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const timeStr = chalk.gray(timestamp);
      const levelStr = colors[level]
        ? colors[level](`[${level.toUpperCase()}]`)
        : `[${level.toUpperCase()}]`;

      let formattedMessage = message;

      // Special formatting for HTTP requests
      if (meta.id && meta.status) {
        const statusCode = meta.status;
        const statusStr = statusColors[Math.floor(statusCode / 100)]
          ? statusColors[Math.floor(statusCode / 100)](statusCode)
          : statusCode;

        const idStr = chalk.dim(`[${meta.id}]`);
        const durationStr = meta.duration ? chalk.magenta(meta.duration) : "";

        formattedMessage = `${message} ${statusStr} ${durationStr} ${idStr}`;

        // Remove these from meta so they don't get printed again
        delete meta.status;
        delete meta.duration;
        delete meta.id;
      }

      // Format remaining metadata
      const metaStr = Object.keys(meta).length
        ? " " + chalk.dim(JSON.stringify(meta, null, 2))
        : "";

      return `${timeStr} ${levelStr} ${formattedMessage}${metaStr}`;
    })
  ),
  transports: [new transports.Console()],
});

// Add custom success method
logger.success = (message, meta = {}) => {
  logger.log("success", message, meta);
};

export default logger;

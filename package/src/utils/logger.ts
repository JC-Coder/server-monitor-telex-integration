import winston from "winston";
import path from "path";
import os from "os";

// Define log directory
const LOG_DIR = path.join(os.homedir(), ".telex-monitor", "logs");

// Create the logger format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, module }) => {
    return `${timestamp} [${module || "app"}] ${level}: ${message}`;
  })
);

/**
 * Create a logger instance for a specific module
 * @param moduleName The name of the module
 * @returns A Winston logger instance
 */
export function createLogger(moduleName: string): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    defaultMeta: { module: moduleName },
    format: logFormat,
    transports: [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: path.join(LOG_DIR, "telex-monitor.log"),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // File transport for error logs
      new winston.transports.File({
        filename: path.join(LOG_DIR, "error.log"),
        level: "error",
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
}

// Create a default logger
export const logger = createLogger("app");

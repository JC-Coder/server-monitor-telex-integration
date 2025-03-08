#!/usr/bin/env node

import { Command } from "commander";
import { authenticate } from "../auth/auth.js";
import {
  startMonitoring,
  stopMonitoring,
  isMonitoringRunning,
} from "../lib/monitor.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";
import { clearStore, setServerName, TELEX_MONITOR_DIR } from "../index.js";

// Create the CLI program
const program = new Command();

// Set up program metadata
program
  .name("telex-server-monitor")
  .description("Server monitoring agent that integrates with Telex platform")
  .version("1.0.0");

// Setup command
program
  .command("setup")
  .description("Set up the Telex Server Monitor with authentication")
  .requiredOption("--email <email>", "Your Telex email address")
  .requiredOption("--password <password>", "Your Telex password")
  .option(
    "--server-name <name>",
    "Custom name for this server (defaults to hostname)"
  )
  .action(async (options) => {
    try {
      // Create the config directory if it doesn't exist
      const logsDir = path.join(TELEX_MONITOR_DIR, "logs");

      if (!fs.existsSync(TELEX_MONITOR_DIR)) {
        fs.mkdirSync(TELEX_MONITOR_DIR, { recursive: true });
      }

      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Set the server name if provided
      if (options.serverName) {
        setServerName(options.serverName);
        logger.info(`Server name set to: ${options.serverName}`);
      }

      // Authenticate with Telex
      logger.info(`Authenticating with Telex as ${options.email}...`);
      const token = await authenticate(options.email, options.password);

      // TODO: Check if the auth failed and token not gotten and handle it

      logger.info("Authentication successful! Token and settings saved.");
      logger.info(
        "You can now start monitoring with: telex-server-monitor start"
      );
    } catch (error) {
      logger.error(`Setup failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Start command
program
  .command("start")
  .description("Start the monitoring process")
  .action(async () => {
    try {
      if (isMonitoringRunning()) {
        logger.warn("Monitoring is already running");
        return;
      }

      logger.info("Starting Telex Server Monitor...");
      await startMonitoring();
      logger.info("Monitoring started successfully. Press Ctrl+C to stop.");
    } catch (error) {
      logger.error(`Failed to start monitoring: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Stop command
program
  .command("stop")
  .description("Stop the monitoring process")
  .action(() => {
    try {
      if (!isMonitoringRunning()) {
        logger.warn("Monitoring is not running");
        return;
      }

      logger.info("Stopping Telex Server Monitor...");
      stopMonitoring();
      logger.info("Monitoring stopped successfully");
    } catch (error) {
      logger.error(`Failed to stop monitoring: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Reset command
program
  .command("reset")
  .description("Reset all configuration and stop monitoring")
  .action(() => {
    try {
      if (isMonitoringRunning()) {
        stopMonitoring();
      }

      clearStore();
      logger.info("All configuration has been reset");
    } catch (error) {
      logger.error(
        `Failed to reset configuration: ${(error as Error).message}`
      );
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}

#!/usr/bin/env node

import { Command } from "commander";
import { authenticate, getAuthToken } from "../auth/auth.js";
// import {
//   startMonitoring,
//   stopMonitoring,
//   isMonitoringRunning,
// } from "../lib/monitor.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import {
  checkIfPackageIsConfiguredAlready,
  fetchIntegrationSettingsForThisApp,
} from "../index.js";
import { AppConstants, clearStore, saveStoreData } from "../index.js";
import chalk from "chalk";
import ora from "ora";

// Add this new utility function
function displayIntegrationHeader() {
  const art = `
  ████████╗███████╗██╗     ███████╗██╗  ██╗
  ╚══██╔══╝██╔════╝██║     ██╔════╝╚██╗██╔╝
     ██║   █████╗  ██║     █████╗   ╚███╔╝ 
     ██║   ██╔══╝  ██║     ██╔══╝   ██╔██╗ 
     ██║   ███████╗███████╗███████╗██╔╝ ██╗
     ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
  `;

  console.log(chalk.blueBright(art));
  console.log(
    chalk.whiteBright.bold(
      `  Telex Server Monitor ${AppConstants.Package.Version}\n`
    )
  );
}

// Create the CLI program
const program = new Command();

// Modify the preAction hook to use async/await
program.hook("preAction", async (thisCommand) => {
  displayIntegrationHeader();
  const spinner = ora({
    text: `Initializing ${chalk.blueBright("Telex Server Monitor")}\n`,
    spinner: "dots",
    color: "blue",
  }).start();

  // Wait for 1 second using a Promise
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.succeed("Ready!\n");
});

// Set up program metadata
program
  .name("telex-server-monitor")
  .description("Server monitoring agent that integrates with Telex platform")
  .version(AppConstants.Package.Version);

// Setup command
program
  .command("setup")
  .description("Set up the Telex Server Monitor with authentication")
  .requiredOption("--email <email>", "Your Telex email address")
  .requiredOption("--password <password>", "Your Telex password")
  .requiredOption("--organisation-id <id>", "Your Telex organisation ID")
  .option(
    "--server-name <name>",
    "Custom name for this server (defaults to hostname)"
  )
  .action(
    async (options: {
      email: string;
      password: string;
      organisationId: string;
      serverName?: string;
    }) => {
      try {
        // Create the base directory if it doesn't exist
        if (!fs.existsSync(AppConstants.Package.BaseDir)) {
          fs.mkdirSync(AppConstants.Package.BaseDir, { recursive: true });
        }

        // Create the logs directory if it doesn't exist
        if (!fs.existsSync(AppConstants.Package.LogsDir)) {
          fs.mkdirSync(AppConstants.Package.LogsDir, { recursive: true });
        }

        // check if the package is already configured
        checkIfPackageIsConfiguredAlready();

        // Set the server name if provided
        if (options.serverName) {
          saveStoreData({
            serverName: options.serverName,
          });
          logger.info(`Server name set to: ${options.serverName}`);
        }

        // Authenticate with Telex
        logger.info(`Authenticating with Telex as ${options.email}...`);
        await getAuthToken(options.email, options.password);
        logger.info("Authentication successful! Token and settings saved.");

        // Set the organisation ID
        saveStoreData({
          organisationId: options.organisationId,
        });

        // fetch and save integration settings
        await fetchIntegrationSettingsForThisApp();

        logger.info("Authentication successful! Token and settings saved.");
        logger.info(
          "You can now start monitoring with: telex-server-monitor start"
        );
      } catch (error) {
        logger.error(`Setup failed: ${(error as Error).message}`);
        process.exit(1);
      }
    }
  );

// // Start command
// program
//   .command("start")
//   .description("Start the monitoring process")
//   .action(async () => {
//     try {
//       if (isMonitoringRunning()) {
//         logger.warn("Monitoring is already running");
//         return;
//       }

//       logger.info("Starting Telex Server Monitor...");
//       await startMonitoring();
//       logger.info("Monitoring started successfully. Press Ctrl+C to stop.");
//     } catch (error) {
//       logger.error(`Failed to start monitoring: ${(error as Error).message}`);
//       process.exit(1);
//     }
//   });

// // Stop command
// program
//   .command("stop")
//   .description("Stop the monitoring process")
//   .action(() => {
//     try {
//       if (!isMonitoringRunning()) {
//         logger.warn("Monitoring is not running");
//         return;
//       }

//       logger.info("Stopping Telex Server Monitor...");
//       stopMonitoring();
//       logger.info("Monitoring stopped successfully");
//     } catch (error) {
//       logger.error(`Failed to stop monitoring: ${(error as Error).message}`);
//       process.exit(1);
//     }
//   });

// // Reset command
// program
//   .command("reset")
//   .description("Reset all configuration and stop monitoring")
//   .action(() => {
//     try {
//       if (isMonitoringRunning()) {
//         stopMonitoring();
//       }

//       clearStore();
//       logger.info("All configuration has been reset");
//     } catch (error) {
//       logger.error(
//         `Failed to reset configuration: ${(error as Error).message}`
//       );
//       process.exit(1);
//     }
//   });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}

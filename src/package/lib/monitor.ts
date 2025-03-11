// import axios from "axios";
// import {
//   collectMetrics,
//   checkThresholds,
//   MetricsData,
// } from "../metrics/collector.js";
// import { getAuthToken } from "../auth/auth.js";
// import { createLogger } from "../utils/logger.js";
// import { AppConstants } from "../utils/constant.js";

// // Create a logger
// const logger = createLogger("monitor");

// // Store the interval ID for the monitoring process
// let monitoringInterval: NodeJS.Timeout | null = null;

// /**
//  * Send metrics data to Telex
//  * @param metricsData The metrics data to send
//  * @param token The authentication token
//  */
// async function sendMetricsToTelex(
//   metricsData: MetricsData,
//   token: string
// ): Promise<void> {
//   try {
//     await axios.post(`${AppConstants.Telex.LoginUrl}/metrics`, metricsData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     logger.info("Metrics sent to Telex successfully");
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       if (error.response) {
//         logger.error(
//           `Failed to send metrics: ${
//             error.response.data.message || "Server error"
//           }`
//         );
//       } else if (error.request) {
//         logger.error("Failed to send metrics: No response from Telex server");
//       }
//     } else {
//       logger.error(`Failed to send metrics: ${(error as Error).message}`);
//     }
//   }
// }

// /**
//  * Send alerts to Telex
//  * @param alerts The alerts to send
//  * @param token The authentication token
//  */
// async function sendAlertsToTelex(
//   alerts: { [metric: string]: string },
//   token: string
// ): Promise<void> {
//   if (Object.keys(alerts).length === 0) {
//     return;
//   }

//   const config = getConfig();

//   try {
//     for (const channelId of config.settings.channelIds) {
//       await axios.post(
//         `${AppConstants.Telex.LoginUrl}/channels/${channelId}/alerts`,
//         { alerts },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     }

//     logger.info(`Sent ${Object.keys(alerts).length} alerts to Telex`);
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       if (error.response) {
//         logger.error(
//           `Failed to send alerts: ${
//             error.response.data.message || "Server error"
//           }`
//         );
//       } else if (error.request) {
//         logger.error("Failed to send alerts: No response from Telex server");
//       }
//     } else {
//       logger.error(`Failed to send alerts: ${(error as Error).message}`);
//     }
//   }
// }

// /**
//  * Run a single monitoring cycle
//  */
// export async function runMonitoringCycle(): Promise<void> {
//   try {
//     // Get the authentication token
//     const token = getToken();
//     if (!token) {
//       logger.error("No authentication token found. Please run setup first.");
//       return;
//     }

//     // Collect metrics
//     const metricsData = await collectMetrics();
//     logger.info("Collected metrics successfully");

//     // Check thresholds and generate alerts
//     const alerts = checkThresholds(metricsData);
//     if (Object.keys(alerts).length > 0) {
//       logger.warn(
//         `Found ${Object.keys(alerts).length} alerts: ${Object.values(
//           alerts
//         ).join(", ")}`
//       );
//     }

//     // Send metrics and alerts to Telex
//     await sendMetricsToTelex(metricsData, token);
//     if (Object.keys(alerts).length > 0) {
//       await sendAlertsToTelex(alerts, token);
//     }
//   } catch (error) {
//     logger.error(`Monitoring cycle failed: ${(error as Error).message}`);
//   }
// }

// /**
//  * Start the monitoring process
//  */
// export async function startMonitoring(): Promise<void> {
//   if (monitoringInterval) {
//     logger.warn("Monitoring is already running");
//     return;
//   }

//   try {
//     // Get the authentication token
//     const token = await getAuthToken();

//     // Fetch the latest settings
//     await fetchSettings(token);

//     const config = getConfig();
//     const frequency = config.settings.frequency * 1000; // Convert to milliseconds

//     logger.info(
//       `Starting monitoring with frequency of ${config.settings.frequency} seconds`
//     );

//     // Run an initial cycle immediately
//     await runMonitoringCycle();

//     // Set up the interval for future cycles
//     monitoringInterval = setInterval(runMonitoringCycle, frequency);

//     logger.info("Monitoring started successfully");
//   } catch (error) {
//     logger.error(`Failed to start monitoring: ${(error as Error).message}`);
//     throw error;
//   }
// }

// /**
//  * Stop the monitoring process
//  */
// export function stopMonitoring(): void {
//   if (!monitoringInterval) {
//     logger.warn("Monitoring is not running");
//     return;
//   }

//   clearInterval(monitoringInterval);
//   monitoringInterval = null;

//   logger.info("Monitoring stopped successfully");
// }

// /**
//  * Check if monitoring is currently running
//  */
// export function isMonitoringRunning(): boolean {
//   return monitoringInterval !== null;
// }

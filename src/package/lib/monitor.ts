import { Reply } from "zeromq";
import {
  getCpuUsage,
  getCpuMetrics,
  getFormattedCpuMetrics,
  checkCpuThreshold,
} from "../metrics/collector.js";
import { logger } from "../utils/logger.js";
import {
  getStoreData,
  saveStoreData,
  updateStoreData,
} from "../utils/store.js";

// Store the socket for the monitoring process
let monitorSocket: Reply | null = null;

/**
 * Start the monitoring process with ZeroMQ
 * @param channelId The channel ID to use for communication
 */
export async function startMonitoring(): Promise<void> {
  try {
    if (getStoreData()?.isMonitoringRunning) {
      logger.warn("Monitoring is already running");
      return;
    }

    const storeData = getStoreData();
    const channelId = storeData?.outputChannelId;

    // Get channel ID from store if not provided
    if (!channelId) {
      throw new Error("No channel ID found. Please run setup first.");
    }

    logger.info(`Starting monitoring with channel ID: ${channelId}`);

    // Create ZeroMQ reply socket
    monitorSocket = new Reply();

    // Bind to the socket
    const socketAddress = `tcp://127.0.0.1:${10000 + (parseInt(channelId.slice(-4), 16) % 10000)}`;
    await monitorSocket.bind(socketAddress);
    logger.info(`Bound to ZeroMQ socket at ${socketAddress}`);

    saveStoreData({ isMonitoringRunning: true });

    // Start processing messages
    for await (const [message] of monitorSocket) {
      try {
        const request = JSON.parse(message.toString());
        logger.info(`Received request: ${JSON.stringify(request)}`);

        let response;

        // Process different types of requests
        switch (request.type) {
          case "getCpuUsage":
            response = {
              type: "cpuUsage",
              data: await getCpuUsage(),
            };
            break;

          case "getCpuMetrics":
            response = {
              type: "cpuMetrics",
              data: await getCpuMetrics(),
            };
            break;

          case "getFormattedCpuMetrics":
            response = {
              type: "formattedCpuMetrics",
              data: await getFormattedCpuMetrics(),
            };
            break;

          case "checkCpuThreshold":
            const threshold = request.threshold || 85;
            const usage = await getCpuUsage();
            response = {
              type: "cpuThreshold",
              data: {
                usage,
                threshold,
                exceeded: checkCpuThreshold(usage, threshold),
              },
            };
            break;

          case "ping":
            response = {
              type: "pong",
              timestamp: new Date().toISOString(),
            };
            break;

          default:
            response = {
              type: "error",
              error: `Unknown request type: ${request.type}`,
            };
        }

        await monitorSocket.send(JSON.stringify(response));
      } catch (error) {
        logger.error(`Error processing message: ${(error as Error).message}`);
        await monitorSocket.send(
          JSON.stringify({
            type: "error",
            error: (error as Error).message,
          })
        );
      }
    }
  } catch (error) {
    logger.error(`Failed to start monitoring: ${(error as Error).message}`);
    saveStoreData({ isMonitoringRunning: false });
    monitorSocket = null;
    throw error;
  }
}

/**
 * Stop the monitoring process
 */
export async function stopMonitoring(): Promise<void> {
  if (!getStoreData()?.isMonitoringRunning) {
    logger.warn("Monitoring is not running");
    return;
  }

  try {
    monitorSocket = null;
    saveStoreData({ isMonitoringRunning: false });
    logger.info("Monitoring stopped successfully");
  } catch (error) {
    logger.error(`Failed to stop monitoring: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Check if monitoring is currently running
 */
export function isMonitoringRunning(): boolean {
  return getStoreData()?.isMonitoringRunning || false;
}

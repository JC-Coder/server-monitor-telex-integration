import {
  getCpuUsage,
  getCpuMetrics,
  getFormattedCpuMetrics,
  checkCpuThreshold,
} from "../metrics/collector.js";
import { logger } from "../utils/logger.js";
import { getStoreData, saveStoreData } from "../utils/store.js";
import {
  createReplySocket,
  receiveMessages,
  sendMessage,
  closeSocket,
  IZeromqResponse,
  MessageType,
} from "../services/zeromqService.js";

let isMonitoringActive = false;

/**
 * Start the monitoring process
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
    logger.info("This server will accept remote connections from the Telex integration server");
    logger.info("Monitor will respond to requests for system metrics");

    // Initialize ZeroMQ socket - now binds to 0.0.0.0 to accept remote connections
    await createReplySocket(channelId);
    saveStoreData({ isMonitoringRunning: true });
    isMonitoringActive = true;

    // Start processing messages from integration server
    logger.info("Waiting for requests from integration server...");
    
    // Using try/finally to ensure we always clean up properly
    try {
      // Start processing messages
      for await (const request of receiveMessages()) {
        try {
          let response: IZeromqResponse;

          // Process different types of requests
          switch (request.type) {
            case "getCpuUsage":
              response = {
                type: request.type,
                data: await getCpuUsage(),
              };
              break;

            case "getCpuMetrics":
              response = {
                type: request.type,
                data: await getCpuMetrics(),
              };
              break;

            case "getFormattedCpuMetrics":
              response = {
                type: request.type,
                data: await getFormattedCpuMetrics(),
              };
              break;

            case "checkCpuThreshold":
              const threshold = request.threshold || 85;
              const usage = await getCpuUsage();
              response = {
                type: request.type,
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

          await sendMessage(response);
          logger.info(`Responded to ${request.type} request from integration server`);
        } catch (error) {
          logger.error(`Error processing message: ${(error as Error).message}`);
          await sendMessage({
            type: "error",
            error: (error as Error).message,
          });
        }
      }
    } finally {
      if (isMonitoringActive) {
        await stopMonitoring();
      }
    }
  } catch (error) {
    logger.error(`Failed to start monitoring: ${(error as Error).message}`);
    saveStoreData({ isMonitoringRunning: false });
    isMonitoringActive = false;
    closeSocket();
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
    closeSocket();
    saveStoreData({ isMonitoringRunning: false });
    isMonitoringActive = false;
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

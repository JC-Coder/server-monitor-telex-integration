import { logger } from "../utils/logger.js";
import { getStoreData, saveStoreData } from "../utils/store.js";
import {
  connectToIntegrationServer,
  closeSocket,
} from "../services/zeromqService.js";

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

    if (!channelId) {
      throw new Error("No channel ID found. Please run setup first.");
    }

    logger.info(`Starting monitoring with channel ID: ${channelId}`);
    logger.info("Connecting to integration server to receive metric requests");

    // Get integration server details from environment or config
    const integrationHost = process.env.INTEGRATION_HOST || "localhost";
    const integrationPort = parseInt(
      process.env.INTEGRATION_PORT || "5000",
      10
    );

    // Connect to the integration server
    await connectToIntegrationServer(
      channelId,
      integrationHost,
      integrationPort
    );

    saveStoreData({ isMonitoringRunning: true });

    // Keep the process running
    process.on("SIGINT", async () => {
      await stopMonitoring();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await stopMonitoring();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start monitoring: ${(error as Error).message}`);
    saveStoreData({ isMonitoringRunning: false });
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

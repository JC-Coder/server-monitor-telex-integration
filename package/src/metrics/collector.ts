import si from "systeminformation";
import { logger } from "../utils/logger.js";

// Define the metrics data structure
export interface IMetricsData {
  cpu?: {
    usage: number;
    cores?: number;
    load_avg?: number[];
  };
}

/**
 * Get all CPU metrics
 * @returns Promise that resolves to complete CPU metrics
 */
async function getCpuMetrics(): Promise<IMetricsData["cpu"]> {
  try {
    const [currentLoad, cpuInfo] = await Promise.all([
      si.currentLoad(),
      si.cpu(),
    ]);

    const load = await si.currentLoad();

    return {
      usage: currentLoad.currentLoad,
      cores: cpuInfo.cores,
      load_avg: [load.avgLoad],
    };
  } catch (error) {
    logger.error(`Failed to get CPU metrics: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get formatted CPU metrics for display
 */
async function getFormattedCpuMetrics(): Promise<string> {
  try {
    const cpuMetrics = await getCpuMetrics();

    if (!cpuMetrics) {
      return "Error: Could not retrieve CPU metrics";
    }

    return `
CPU Usage: ${cpuMetrics.usage.toFixed(2)}%
CPU Cores: ${cpuMetrics.cores || "N/A"}
Load Average: ${cpuMetrics.load_avg?.[0]?.toFixed(2) || "N/A"}
    `.trim();
  } catch (error) {
    logger.error(`Failed to format CPU metrics: ${(error as Error).message}`);
    return "Error fetching CPU metrics";
  }
}

const getMetrics = async (): Promise<IMetricsData> => {
  return {
    cpu: await getCpuMetrics(),
  };
};

export const CollectorService = {
  getMetrics,
  getFormattedCpuMetrics,
};

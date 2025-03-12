import si from "systeminformation";
import { logger } from "../utils/logger.js";

// Define the metrics data structure
export interface MetricsData {
  cpu?: {
    usage: number;
    cores?: number;
    load_avg?: number[];
  };
}

/**
 * Get CPU usage
 * @returns Promise that resolves to CPU usage percentage
 */
export async function getCpuUsage(): Promise<number> {
  try {
    const currentLoad = await si.currentLoad();
    return currentLoad.currentLoad;
  } catch (error) {
    logger.error(`Failed to get CPU usage: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get all CPU metrics
 * @returns Promise that resolves to complete CPU metrics
 */
export async function getCpuMetrics(): Promise<MetricsData["cpu"]> {
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
 * Check if CPU usage exceeds threshold
 * @param cpuUsage The current CPU usage percentage
 * @param threshold The threshold to check against
 * @returns True if the CPU usage exceeds the threshold, false otherwise
 */
export function checkCpuThreshold(
  cpuUsage: number,
  threshold: number = 85
): boolean {
  return cpuUsage > threshold;
}

/**
 * Get formatted CPU metrics for display
 */
export async function getFormattedCpuMetrics(): Promise<string> {
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

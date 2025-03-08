import si from "systeminformation";
import { getConfig, getServerName } from "../config/config.js";

// Define the metrics data structure
export interface MetricsData {
  server_id: string;
  timestamp: string;
  metrics: {
    cpu?: {
      usage: number;
      load_avg: number[];
    };
    memory?: {
      total: number;
      used: number;
      free: number;
      used_percent: number;
    };
    disk?: {
      [mountpoint: string]: {
        total: number;
        used: number;
        free: number;
        used_percent: number;
      };
    };
  };
}

/**
 * Collect CPU metrics
 * @returns Promise that resolves to CPU metrics
 */
async function collectCpuMetrics(): Promise<MetricsData["metrics"]["cpu"]> {
  const [currentLoad, currentLoadAvg] = await Promise.all([
    si.currentLoad(),
    si.currentLoad().then((load) => load.avgLoad),
  ]);

  return {
    usage: currentLoad.currentLoad,
    load_avg: [currentLoadAvg],
  };
}

/**
 * Collect memory metrics
 * @returns Promise that resolves to memory metrics
 */
async function collectMemoryMetrics(): Promise<
  MetricsData["metrics"]["memory"]
> {
  const mem = await si.mem();

  return {
    total: mem.total,
    used: mem.used,
    free: mem.free,
    used_percent: (mem.used / mem.total) * 100,
  };
}

/**
 * Collect disk metrics
 * @returns Promise that resolves to disk metrics
 */
async function collectDiskMetrics(): Promise<MetricsData["metrics"]["disk"]> {
  const fsSize = await si.fsSize();

  const diskMetrics: MetricsData["metrics"]["disk"] = {};

  for (const fs of fsSize) {
    diskMetrics[fs.mount] = {
      total: fs.size,
      used: fs.used,
      free: fs.size - fs.used,
      used_percent: fs.use,
    };
  }

  return diskMetrics;
}

/**
 * Collect all enabled metrics based on configuration
 * @returns Promise that resolves to all metrics data
 */
export async function collectMetrics(): Promise<MetricsData> {
  const config = getConfig();
  const serverName = getServerName();

  const metrics: MetricsData["metrics"] = {};

  // Collect metrics based on configuration
  if (config.settings.metrics.cpu) {
    metrics.cpu = await collectCpuMetrics();
  }

  if (config.settings.metrics.memory) {
    metrics.memory = await collectMemoryMetrics();
  }

  if (config.settings.metrics.disk) {
    metrics.disk = await collectDiskMetrics();
  }

  return {
    server_id: serverName,
    timestamp: new Date().toISOString(),
    metrics,
  };
}

/**
 * Check if any metrics exceed their thresholds
 * @param metricsData The collected metrics data
 * @returns Object containing alerts for any exceeded thresholds
 */
export function checkThresholds(metricsData: MetricsData): {
  [metric: string]: string;
} {
  const config = getConfig();
  const alerts: { [metric: string]: string } = {};

  // Check CPU threshold
  if (
    metricsData.metrics.cpu &&
    metricsData.metrics.cpu.usage > config.settings.thresholds.cpu
  ) {
    alerts.cpu = `CPU usage is ${metricsData.metrics.cpu.usage.toFixed(1)}%, which exceeds the threshold of ${config.settings.thresholds.cpu}%`;
  }

  // Check memory threshold
  if (
    metricsData.metrics.memory &&
    metricsData.metrics.memory.used_percent > config.settings.thresholds.memory
  ) {
    alerts.memory = `Memory usage is ${metricsData.metrics.memory.used_percent.toFixed(1)}%, which exceeds the threshold of ${config.settings.thresholds.memory}%`;
  }

  // Check disk thresholds
  if (metricsData.metrics.disk) {
    for (const [mount, disk] of Object.entries(metricsData.metrics.disk)) {
      if (disk.used_percent > config.settings.thresholds.disk) {
        alerts[`disk_${mount}`] =
          `Disk usage for ${mount} is ${disk.used_percent.toFixed(1)}%, which exceeds the threshold of ${config.settings.thresholds.disk}%`;
      }
    }
  }

  return alerts;
}

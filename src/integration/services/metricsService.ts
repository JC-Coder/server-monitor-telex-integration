import { zeromqServer } from "./zeromqServer.js";
import { logger } from "../../package/utils/logger.js";

export interface MetricsData {
  cpu?: {
    usage: number;
    cores?: number;
    load_avg?: number[];
  };
}

export const getMetricsFromPackage = async (
  channelId: string,
  settings: any
) => {
  try {
    await zeromqServer.publish(channelId, {
      type: "getMetrics",
      channelId,
      data: { settings },
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Failed to request CPU threshold check: ", error);
    return false;
  }
};

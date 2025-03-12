import { Publisher } from "zeromq";
import { logger } from "../../package/utils/logger.js";
import { integrationEnvConfig } from "../utils/config.js";

export interface IZeromqMessage {
  type: string;
  channelId: string;
  data: any;
  timestamp: string;
}

class ZeromqServer {
  private static instance: ZeromqServer;
  private pubSocket: Publisher | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ZeromqServer {
    if (!ZeromqServer.instance) {
      ZeromqServer.instance = new ZeromqServer();
    }
    return ZeromqServer.instance;
  }

  public async initialize(
    basePort: number = integrationEnvConfig.zeromq.basePort
  ): Promise<void> {
    if (this.isInitialized) {
      logger.warn("ZeroMQ server is already initialized");
      return;
    }

    try {
      const host = integrationEnvConfig.zeromq.host;

      // Initialize Publisher socket
      this.pubSocket = new Publisher();
      await this.pubSocket.bind(`tcp://${host}:${basePort}`);
      logger.info(`Publisher bound to tcp://${host}:${basePort}`);

      this.isInitialized = true;
    } catch (error) {
      logger.error(
        `Failed to initialize ZeroMQ server: ${(error as Error).message}`
      );
      throw error;
    }
  }

  public async publish(
    channelId: string,
    message: IZeromqMessage
  ): Promise<void> {
    if (!this.pubSocket || !this.isInitialized) {
      throw new Error("ZeroMQ server not initialized");
    }

    try {
      await this.pubSocket.send([channelId, JSON.stringify(message)]);
      logger.info(
        `Published message to channel ${channelId}: ${JSON.stringify(message)}`
      );
    } catch (error) {
      logger.error(`Failed to publish message: ${(error as Error).message}`);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.pubSocket) {
        await this.pubSocket.close();
        this.pubSocket = null;
      }
      this.isInitialized = false;
      logger.info("ZeroMQ server closed");
    } catch (error) {
      logger.error(`Error closing ZeroMQ server: ${(error as Error).message}`);
      throw error;
    }
  }
}

export const zeromqServer = ZeromqServer.getInstance();

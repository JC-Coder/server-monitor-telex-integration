import { Publisher, Subscriber } from "zeromq";
import { logger } from "../../package/utils/logger.js";
import { integrationEnvConfig } from "../utils/config.js";
import { TelexService } from "./telexRequest.js";

export interface IZeromqMessage {
  type: string;
  channelId: string;
  data: any;
  timestamp: string;
}

class ZeromqServer {
  private static instance: ZeromqServer;
  private pubSocket: Publisher | null = null;
  private subSocket: Subscriber | null = null;
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

      // Initialize Publisher socket for sending commands
      this.pubSocket = new Publisher();
      await this.pubSocket.bind(`tcp://${host}:${basePort}`);
      logger.info(`Publisher bound to tcp://${host}:${basePort}`);

      // Initialize Subscriber socket for receiving replies
      this.subSocket = new Subscriber();
      await this.subSocket.bind(`tcp://${host}:${basePort + 1}`);
      logger.info(`Subscriber bound to tcp://${host}:${basePort + 1}`);

      // Start listening for replies
      this.handleReplies();

      this.isInitialized = true;
    } catch (error) {
      logger.error(
        `Failed to initialize ZeroMQ server: ${(error as Error).message}`
      );
      throw error;
    }
  }

  private async handleReplies(): Promise<void> {
    if (!this.subSocket) {
      throw new Error("Subscriber socket not initialized");
    }

    try {
      // Subscribe to all channels
      await this.subSocket.subscribe("");

      // Handle incoming replies
      for await (const [channelId, messageBuffer] of this.subSocket) {
        try {
          const message = JSON.parse(
            messageBuffer.toString()
          ) as IZeromqMessage;
          logger.info(
            `Received reply from channel ${channelId}: ${JSON.stringify(message)}`
          );

          // Process the reply based on message type
          if (message.type === "reply" && message.data.metrics) {
            // Format metrics message for Telex
            const metricsMessage = this.formatMetricsMessage(
              message.data.metrics
            );

            // Send formatted metrics to Telex
            await TelexService.SendWebhookResponse({
              channelId: channelId.toString(),
              message: metricsMessage,
            });
          }
        } catch (error) {
          logger.error(`Error processing reply: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      logger.error(`Error in reply handler: ${(error as Error).message}`);
    }
  }

  private formatMetricsMessage(metrics: any): string {
    try {
      const { cpu } = metrics;
      return (
        `📊 Current Server Metrics\n\n` +
        `🔸 CPU Usage: ${cpu?.usage?.toFixed(2)}%\n` +
        `🔸 CPU Cores: ${cpu?.cores || "N/A"}\n` +
        `🔸 Load Average: ${cpu?.load_avg?.[0]?.toFixed(2) || "N/A"}`
      );
    } catch (error) {
      logger.error(
        `Error formatting metrics message: ${(error as Error).message}`
      );
      return "Error formatting metrics data";
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
      if (this.subSocket) {
        await this.subSocket.close();
        this.subSocket = null;
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

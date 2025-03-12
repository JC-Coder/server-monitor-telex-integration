import { Publisher, Reply } from "zeromq";
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
  private repSocket: Reply | null = null;
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
      const pubPort = basePort;
      await this.pubSocket.bind(`tcp://${host}:${pubPort}`);
      logger.info(`Publisher bound to tcp://${host}:${pubPort}`);

      // Initialize Reply socket
      this.repSocket = new Reply();
      const repPort = basePort + 1;
      await this.repSocket.bind(`tcp://${host}:${repPort}`);
      logger.info(`Reply socket bound to tcp://${host}:${repPort}`);

      this.isInitialized = true;
      this.startMessageHandler();
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

  private async startMessageHandler(): Promise<void> {
    if (!this.repSocket || !this.isInitialized) {
      throw new Error("ZeroMQ server not initialized");
    }

    try {
      logger.info("Starting ZeroMQ message handler");
      for await (const [msg] of this.repSocket) {
        try {
          const request = JSON.parse(msg.toString()) as IZeromqMessage;
          logger.info(`Received request: ${JSON.stringify(request)}`);

          // Process the request and send response
          const response: IZeromqMessage = {
            type: "response",
            channelId: request.channelId,
            data: { received: true },
            timestamp: new Date().toISOString(),
          };

          await this.repSocket.send(JSON.stringify(response));
        } catch (error) {
          logger.error(`Error processing message: ${(error as Error).message}`);
          const errorResponse: IZeromqMessage = {
            type: "error",
            channelId: "error",
            data: { error: (error as Error).message },
            timestamp: new Date().toISOString(),
          };
          await this.repSocket.send(JSON.stringify(errorResponse));
        }
      }
    } catch (error) {
      logger.error(`Error in message handler: ${(error as Error).message}`);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.pubSocket) {
        await this.pubSocket.close();
        this.pubSocket = null;
      }
      if (this.repSocket) {
        await this.repSocket.close();
        this.repSocket = null;
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

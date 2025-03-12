import { Subscriber } from "zeromq";
import { logger } from "../utils/logger.js";
import { CollectorService } from "../metrics/collector.js";

export enum MessageType {
  getMetrics = "getMetrics",
  ping = "ping",
}

export interface IZeromqMessage {
  type: MessageType | string;
  channelId: string;
  data: any;
  timestamp: string;
}

let subSocket: Subscriber | null = null;

/**
 * Connect to the integration server's publisher socket
 */
export async function connectToIntegrationServer(
  channelId: string,
  host: string,
  port: number
): Promise<void> {
  try {
    if (subSocket) {
      logger.warn("ZeroMQ socket is already connected");
      return;
    }

    subSocket = new Subscriber();
    const socketAddress = `tcp://${host}:${port}`;

    await subSocket.connect(socketAddress);
    await subSocket.subscribe(channelId);

    logger.info(`Connected to integration server at ${socketAddress}`);
    logger.info(`Subscribed to channel ${channelId}`);

    // Start message handler
    handleMessages(channelId);
  } catch (error) {
    logger.error(
      `Failed to connect to integration server: ${(error as Error).message}`
    );
    throw error;
  }
}

/**
 * Handle incoming messages from the integration server
 */
async function handleMessages(channelId: string): Promise<void> {
  if (!subSocket) {
    throw new Error("ZeroMQ socket not connected");
  }

  try {
    for await (const [topic, messageBuffer] of subSocket) {
      try {
        const message = JSON.parse(messageBuffer.toString()) as IZeromqMessage;
        logger.info(`Received message: ${JSON.stringify(message)}`);

        if (topic.toString() !== channelId) {
          continue;
        }

        // Process different types of requests
        const incomingMessageType = message.type;
        if (incomingMessageType === MessageType.getMetrics) {
          const metrics = await CollectorService.getMetrics();
          logger.info(`Metrics: ${JSON.stringify(metrics)}`);
        } else if (incomingMessageType === MessageType.ping) {
          logger.info("Received ping from integration server");
        } else {
          logger.warn(`Unknown message type: ${incomingMessageType}`);
        }
      } catch (error) {
        logger.error(`Error processing message: ${(error as Error).message}`);
      }
    }
  } catch (error) {
    logger.error(`Error in message handler: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Close the ZeroMQ socket connection
 */
export function closeSocket(): void {
  if (subSocket) {
    try {
      subSocket.close();
      subSocket = null;
      logger.info("ZeroMQ socket closed");
    } catch (error) {
      logger.error(`Error closing socket: ${(error as Error).message}`);
    }
  }
}

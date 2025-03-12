import { Reply } from "zeromq";
import { logger } from "../utils/logger.js";
import os from "os";

export type MessageType =
  | "getCpuUsage"
  | "getCpuMetrics"
  | "getFormattedCpuMetrics"
  | "checkCpuThreshold"
  | "ping";

export interface IZeromqRequest {
  type: MessageType | string;
  threshold?: number;
  timestamp?: string;
}

export interface IZeromqResponse {
  type: MessageType | "error" | "pong" | string;
  data?: any;
  error?: string;
  timestamp?: string;
}

let replySocket: Reply | null = null;

/**
 * Get the server's public IP address
 * This is a best-effort function that might not always return the correct external IP
 * In production, you might want to use a service like ipify.org or similar
 */
function getServerIP(): string {
  const ifaces = os.networkInterfaces();
  let serverIP = "0.0.0.0"; // Default to all interfaces if we can't determine

  // Try to find a non-internal IPv4 address
  Object.values(ifaces).forEach((ifaceDetails) => {
    if (!ifaceDetails) return;
    
    ifaceDetails.forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        serverIP = details.address;
      }
    });
  });
  
  return serverIP;
}

/**
 * Calculate port from channelId using a consistent algorithm
 * Both integration and package use this to ensure they connect on same port
 */
export function getPortFromChannelId(channelId: string): number {
  return 10000 + (parseInt(channelId.slice(-4), 16) % 10000);
}

/**
 * Create and bind a ZeroMQ Reply socket
 * @param channelId The channel ID to use for the socket address
 */
export async function createReplySocket(channelId: string): Promise<void> {
  try {
    if (replySocket) {
      logger.warn("ZeroMQ socket is already created");
      return;
    }

    replySocket = new Reply();
    const port = getPortFromChannelId(channelId);
    
    // Bind to all interfaces (0.0.0.0) to accept remote connections
    const socketAddress = `tcp://0.0.0.0:${port}`;
    await replySocket.bind(socketAddress);
    
    const serverIP = getServerIP();
    logger.info(`Bound to ZeroMQ socket at ${socketAddress} (external: tcp://${serverIP}:${port})`);
    logger.info(`Channel ID ${channelId} is being served on port ${port}`);
  } catch (error) {
    logger.error(`Failed to create ZeroMQ socket: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Send a message through the ZeroMQ socket
 * @param response The response to send
 */
export async function sendMessage(response: IZeromqResponse): Promise<void> {
  if (!replySocket) {
    throw new Error("ZeroMQ socket not initialized");
  }

  try {
    // Always include a timestamp on responses
    const responseWithTimestamp = {
      ...response,
      timestamp: response.timestamp || new Date().toISOString()
    };
    
    await replySocket.send(JSON.stringify(responseWithTimestamp));
    logger.info(`Sent response: ${JSON.stringify(responseWithTimestamp)}`);
  } catch (error) {
    logger.error(`Failed to send message: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Receive and parse messages from the ZeroMQ socket
 * @returns An async iterator for incoming messages
 */
export async function* receiveMessages(): AsyncGenerator<
  IZeromqRequest,
  void,
  unknown
> {
  if (!replySocket) {
    throw new Error("ZeroMQ socket not initialized");
  }

  try {
    for await (const [message] of replySocket) {
      try {
        const request = JSON.parse(message.toString()) as IZeromqRequest;
        logger.info(`Received request: ${JSON.stringify(request)}`);
        yield request;
      } catch (error) {
        logger.error(`Error parsing message: ${(error as Error).message}`);
        await sendMessage({
          type: "error",
          error: `Failed to parse message: ${(error as Error).message}`,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Error in message receiving loop: ${(error as Error).message}`
    );
    throw error;
  }
}

/**
 * Close the ZeroMQ socket connection
 */
export function closeSocket(): void {
  if (replySocket) {
    try {
      replySocket.close();
      replySocket = null;
      logger.info("ZeroMQ socket closed");
    } catch (error: unknown) {
      logger.error(`Error closing socket: ${(error as Error).message}`);
    }
  }
}

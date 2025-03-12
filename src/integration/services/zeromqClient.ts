import { Request } from "zeromq";
import { logger } from "../../package/utils/logger.js";
import { integrationEnvConfig } from "../utils/config.js";

export interface ICpuMetricsResponse {
  usage: number;
  cores?: number;
  load_avg?: number[];
}

// Define a class to manage server connections
class ServerConnection {
  channelId: string;
  client: Request;
  ipAddress: string;
  port: number;

  constructor(channelId: string, ipAddress: string) {
    this.channelId = channelId;
    this.ipAddress = ipAddress;
    this.port = getPortFromChannelId(channelId);
    this.client = new Request();
  }

  async connect(): Promise<void> {
    const socketAddress = `tcp://${this.ipAddress}:${this.port}`;
    logger.info(`Connecting to package server at ${socketAddress}`);

    try {
      await this.client.connect(socketAddress);
      logger.info(`Connected to package server for channel ${this.channelId}`);
    } catch (error) {
      logger.error(`Failed to connect: ${(error as Error).message}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.close();
      logger.info(`Closed connection to channel ${this.channelId}`);
    } catch (error) {
      logger.error(`Error closing connection: ${(error as Error).message}`);
    }
  }
}

/**
 * Calculate port from channelId using the same algorithm as the package
 */
function getPortFromChannelId(channelId: string): number {
  return 10000 + (parseInt(channelId.slice(-4), 16) % 10000);
}

// Store server IP addresses for each channel ID
// In a production environment, this would come from a database/registry
const serverRegistry: Map<string, string> = new Map();

class ZeroMQClient {
  private static instance: ZeroMQClient;
  private connections: Map<string, ServerConnection> = new Map();

  private constructor() {}

  public static getInstance(): ZeroMQClient {
    if (!ZeroMQClient.instance) {
      ZeroMQClient.instance = new ZeroMQClient();
    }
    return ZeroMQClient.instance;
  }

  /**
   * Register a server with a channel ID
   */
  public registerServer(channelId: string, ipAddress: string): void {
    serverRegistry.set(channelId, ipAddress);
    logger.info(`Registered server for channel ${channelId} at ${ipAddress}`);
  }

  /**
   * Get the connection for a specific channel
   */
  private async getConnection(channelId: string): Promise<ServerConnection> {
    if (!this.connections.has(channelId)) {
      // Look up IP address for this channel ID
      let ipAddress = serverRegistry.get(channelId);

      if (!ipAddress) {
        // If we don't have a specific IP in the registry, use the default server
        // In real implementation, this could come from DNS, service discovery, etc.
        ipAddress =
          integrationEnvConfig.defaultPackageServerAddress || "localhost";

        // In development mode, use localhost
        if (process.env.NODE_ENV === "development") {
          ipAddress = "localhost";
        }

        logger.info(
          `No registered server for channel ${channelId}, using default ${ipAddress}`
        );
      }

      const connection = new ServerConnection(channelId, ipAddress);
      await connection.connect();
      this.connections.set(channelId, connection);
    }

    return this.connections.get(channelId)!;
  }

  /**
   * Request CPU metrics from a package server
   */
  public async requestCpuMetrics(
    channelId: string
  ): Promise<ICpuMetricsResponse | null> {
    try {
      const connection = await this.getConnection(channelId);

      // Send request for CPU metrics
      const request = {
        type: "getCpuMetrics",
        timestamp: new Date().toISOString(),
      };

      logger.info(`Requesting CPU metrics from channel ${channelId}`);
      await connection.client.send(JSON.stringify(request));

      // Wait for response with timeout
      const responsePromise = connection.client.receive();

      // Add timeout of 5 seconds
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 5000);
      });

      const result = await Promise.race([responsePromise, timeoutPromise]);

      if (!result) {
        logger.error(
          `Request to package server timed out for channel ${channelId}`
        );
        return null;
      }

      const [responseBuffer] = result as [Buffer];
      const response = JSON.parse(responseBuffer.toString());

      if (response.error) {
        logger.error(`Error from package server: ${response.error}`);
        return null;
      }

      return response.data;
    } catch (error) {
      logger.error(
        `Failed to request CPU metrics: ${(error as Error).message}`
      );
      return null;
    }
  }

  /**
   * Close all client connections
   */
  public async close(): Promise<void> {
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();
    logger.info("All ZeroMQ connections closed");
  }
}

export const zeromqClient = ZeroMQClient.getInstance();

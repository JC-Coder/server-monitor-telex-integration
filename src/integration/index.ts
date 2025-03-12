import express from "express";
import cors from "cors";
import { Request as ZMQRequest } from "zeromq";
import { telexGeneratedConfig } from "./utils/telexConfig.js";
import { integrationEnvConfig } from "./utils/config.js";
import { Request, Response } from "express";
import { AppResponse, IntegrationConstants } from "./utils/constant.js";
import { TelexService } from "./services/telexRequest.js";

const app = express();
const PORT = integrationEnvConfig.integrationPort;

// ZeroMQ request socket map
const requestSockets = new Map<string, ZMQRequest>();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_, res) => {
  return AppResponse({
    res,
    statusCode: 200,
    message: "Server is healthy",
  }).Success();
});

// Integration config endpoint
app.get("/integration-config", (req: Request, res: Response) => {
  res.status(200).json(telexGeneratedConfig);
});

// webhook endpoint for incoming message from telex
app.post("/webhook", (req: Request, res: Response) => {
  const { channel_id, message, settings } = req.body;

  console.log("new webhook from telex", req.body);

  // return initial response to telex
  res.status(200).json({ status: "success", message: "Message received" });

  console.log("after response");
  // send webhook response to telex
  TelexService.SendWebhookResponse({
    channelId: channel_id,
    message,
  });

  // send setup message
  if (message.includes("/setup-monitoring")) {
    const installCommand =
      IntegrationConstants.Github.InstallationScriptUrl(channel_id);

    const setupInstructions = `
🚀 *Setting Up System Monitoring*

Follow these steps to set up monitoring for your system:

1️⃣ Download the monitoring agent by running:
\`\`\`
${installCommand}
\`\`\`

2️⃣ The script will automatically:
   • Install required dependencies
   • Configure the monitoring agent
   • Start the monitoring service

3️⃣ Once installed, you'll start receiving:
   • CPU usage alert

⚠️ *Requirements*:
• Linux/Unix-based system
• Root/sudo access
• curl installed

Need help? Visit our documentation at ${IntegrationConstants.Github.Repository}
`;

    TelexService.SendWebhookResponse({
      channelId: channel_id,
      message: setupInstructions,
    });
  }
});

// tick endpoint for interval message from telex
app.post("/tick", (req: Request, res: Response) => {
  console.log("new tick from telex", req.body);

  res.status(200).json({ status: "success", message: "Message received" });
});

// Connect to a server agent via ZeroMQ
async function connectToServer(channelId: string): Promise<ZMQRequest> {
  if (requestSockets.has(channelId)) {
    return requestSockets.get(channelId)!;
  }

  try {
    // Create a new request socket
    const socket = new ZMQRequest();
    // Connect to the server on a port derived from the channel ID
    const port = 10000 + (parseInt(channelId.slice(-4), 16) % 10000);
    const socketAddress = `tcp://127.0.0.1:${port}`;
    socket.connect(socketAddress);

    // Store the socket for future use
    requestSockets.set(channelId, socket);

    console.log(
      `Connected to server agent for channel ${channelId} at ${socketAddress}`
    );
    return socket;
  } catch (error) {
    console.error(
      `Failed to connect to server agent: ${(error as Error).message}`
    );
    throw error;
  }
}

// Request CPU metrics from a server
app.post("/get-cpu-metrics", (req, res) => {
  const { channelId } = req.body;

  if (!channelId) {
    res.status(400).json({
      status: "error",
      message: "Channel ID is required",
    });
    return;
  }

  connectToServer(channelId)
    .then(async (socket) => {
      // Request CPU metrics
      await socket.send(JSON.stringify({ type: "getCpuMetrics" }));
      const [reply] = await socket.receive();

      const response = JSON.parse(reply.toString());

      res.status(200).json({
        status: "success",
        data: response.data,
      });
    })
    .catch((error) => {
      console.error(`Failed to get CPU metrics: ${(error as Error).message}`);
      res.status(500).json({
        status: "error",
        message: `Failed to get CPU metrics: ${(error as Error).message}`,
      });
    });
});

// Check if CPU usage exceeds threshold
app.post("/check-cpu-threshold", (req, res) => {
  const { channelId, threshold } = req.body;

  if (!channelId) {
    res.status(400).json({
      status: "error",
      message: "Channel ID is required",
    });
    return;
  }

  connectToServer(channelId)
    .then(async (socket) => {
      // Check CPU threshold
      await socket.send(
        JSON.stringify({
          type: "checkCpuThreshold",
          threshold: threshold || 85,
        })
      );
      const [reply] = await socket.receive();

      const response = JSON.parse(reply.toString());

      res.status(200).json({
        status: "success",
        data: response.data,
      });
    })
    .catch((error) => {
      console.error(
        `Failed to check CPU threshold: ${(error as Error).message}`
      );
      res.status(500).json({
        status: "error",
        message: `Failed to check CPU threshold: ${(error as Error).message}`,
      });
    });
});

// Generic error handler
app.use("*", (_, res) => {
  return AppResponse({
    res,
    statusCode: 404,
    data: `🤔 Hmm... looks like you're lost in the matrix! 🕴️, visit 👉 ${IntegrationConstants.Github.Repository} 👈`,
  }).Success();
});

// Start server
app.listen(PORT, () => {
  console.info(`Server is running on port http://localhost:${PORT}`);
});

export default app;

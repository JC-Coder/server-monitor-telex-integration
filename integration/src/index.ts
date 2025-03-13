import express from "express";
import cors from "cors";
import { telexGeneratedConfig } from "./utils/telexConfig.js";
import { integrationEnvConfig } from "./utils/config.js";
import { Request, Response } from "express";
import { AppResponse, IntegrationConstants } from "./utils/constant.js";
import { TelexService } from "./services/telexRequest.js";
import { zeromqServer } from "./services/zeromqServer.js";
import { getMetricsFromPackage } from "./services/metricsService.js";
import { GlobalErrorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = integrationEnvConfig.hostPort;

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
app.post("/webhook", async (req: Request, res: Response) => {
  const { channel_id, message, settings } = req.body;
  console.log("new webhook from telex", req.body);

  // Return initial response to telex immediately
  res.status(200).json({ status: "success", message: "Message received" });

  // Handle setup command specifically
  if (message.includes("/setup-monitoring")) {
    const installCommand =
      IntegrationConstants.Github.InstallationScriptUrl(channel_id);
    const setupInstructions = `
🚀 Server Monitoring Setup

1. Open your server's terminal

2. Run this command:
\`\`\`
${installCommand}
\`\`\`

✨ That's it! You'll start receiving server alerts here.

❓ Need help? Visit our docs: ${IntegrationConstants.Github.Repository}
`;
    TelexService.SendWebhookResponse({
      channelId: channel_id,
      message: setupInstructions,
    });
    return;
  }

  const result = await getMetricsFromPackage(channel_id, settings);

  if (!result) {
    TelexService.SendWebhookResponse({
      channelId: channel_id,
      message: `Sorry 😔, I am not able to get metrics from your server at this time, ensure the agent is active on your server`,
    });
  }
});

// tick endpoint for interval message from telex
app.post("/tick", async (req: Request, res: Response) => {
  const { channel_id, settings } = req.body;
  console.log("new tick from telex", req.body);

  // Return initial response to telex immediately
  res.status(200).json({ status: "success", message: "Message received" });

  const result = await getMetricsFromPackage(channel_id, settings);

  if (!result) {
    TelexService.SendWebhookResponse({
      channelId: channel_id,
      message: `Sorry 😔, I am not able to get metrics from your server at this time, ensure the agent is active on your server`,
    });
  }
});

// Generic error handler
app.use("*", (_, res) => {
  return AppResponse({
    res,
    statusCode: 404,
    data: `🤔 Hmm... looks like you're lost in the matrix! 🕴️, visit 👉 ${IntegrationConstants.Github.Repository} 👈`,
  }).Success();
});

// Global error handler
app.use(GlobalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.info(`Server is running on port http://localhost:${PORT}`);
});

// start zeromq server
try {
  // sleep for 2 seconds before initializing zeromq server
  await new Promise((resolve) => setTimeout(resolve, 2000));

  zeromqServer.initialize();
  console.info(`ZeroMQ Publisher Initialized`);
} catch (error) {
  console.error("Failed to initialize ZeroMQ server:", error);
  process.exit(1);
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.info("SIGTERM signal received.");
  await zeromqServer.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.info("SIGINT signal received.");
  await zeromqServer.close();
  process.exit(0);
});

export default app;

import express from "express";
import cors from "cors";
import { telexGeneratedConfig } from "./utils/telexConfig.js";
import { integrationEnvConfig } from "./utils/config.js";
import { Request, Response } from "express";
import { AppResponse, IntegrationConstants } from "./utils/constant.js";
import { TelexService } from "./services/telexRequest.js";
import { zeromqServer } from "./services/zeromqServer.js";
import { zeromqClient } from "./services/zeromqClient.js";

const app = express();
const PORT = integrationEnvConfig.integrationPort;

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
    const installCommand = IntegrationConstants.Github.InstallationScriptUrl(channel_id);
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
   • CPU usage alerts

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
    return;
  }

  // For other messages, try to get CPU metrics from the user's package
  try {
    const cpuMetrics = await zeromqClient.requestCpuMetrics(channel_id);
    
    if (cpuMetrics) {
      // Format the CPU metrics response
      const metricsMessage = `
📊 *Current Server Metrics*

CPU Usage: ${cpuMetrics.usage?.toFixed(2)}%
${cpuMetrics.cores ? `CPU Cores: ${cpuMetrics.cores}` : ''}
${cpuMetrics.load_avg ? `Load Average: ${cpuMetrics.load_avg[0]?.toFixed(2)}` : ''}
`;
      
      // Send the CPU metrics back to Telex
      TelexService.SendWebhookResponse({
        channelId: channel_id,
        message: metricsMessage,
      });
    } else {
      // Send a generic response if we couldn't get metrics
      TelexService.SendWebhookResponse({
        channelId: channel_id,
        message: "I've received your message but couldn't retrieve server metrics. Make sure the monitoring agent is properly installed and running.",
      });
    }
  } catch (error) {
    console.error("Failed to process webhook:", error);
    TelexService.SendWebhookResponse({
      channelId: channel_id,
      message: `Error: ${(error as Error).message}`,
    });
  }
});

// tick endpoint for interval message from telex
app.post("/tick", async (req: Request, res: Response) => {
  const { channel_id } = req.body;
  console.log("new tick from telex", req.body);
  
  // Return initial response to telex immediately
  res.status(200).json({ status: "success", message: "Message received" });

  // Request CPU metrics from the user's package
  try {
    const cpuMetrics = await zeromqClient.requestCpuMetrics(channel_id);
    
    if (cpuMetrics) {
      // Check if CPU usage is above threshold
      const threshold = 85; // Could be configurable
      const isAboveThreshold = cpuMetrics.usage > threshold;
      
      if (isAboveThreshold) {
        // Alert if CPU usage is high
        const alertMessage = `
⚠️ *CPU ALERT* ⚠️

CPU usage is currently at ${cpuMetrics.usage?.toFixed(2)}%, which exceeds the ${threshold}% threshold.

${cpuMetrics.cores ? `CPU Cores: ${cpuMetrics.cores}` : ''}
${cpuMetrics.load_avg ? `Load Average: ${cpuMetrics.load_avg[0]?.toFixed(2)}` : ''}
`;
        
        TelexService.SendWebhookResponse({
          channelId: channel_id,
          message: alertMessage,
        });
      } else {
        // Optionally send periodic update (could be made configurable)
        // For now, we're not sending non-alert updates on tick to avoid spam
      }
    }
  } catch (error) {
    console.error("Failed to process tick:", error);
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

// Initialize ZeroMQ server before starting Express
Promise.all([
  zeromqServer.initialize(integrationEnvConfig.zeromq.basePort)
])
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.info(`Server is running on port http://localhost:${PORT}`);
      console.info(
        `ZeroMQ PUB socket running on port ${integrationEnvConfig.zeromq.basePort}`
      );
      console.info(
        `ZeroMQ REP socket running on port ${integrationEnvConfig.zeromq.basePort + 1}`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to initialize ZeroMQ server:", error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.info("SIGTERM signal received.");
  await zeromqServer.close();
  await zeromqClient.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.info("SIGINT signal received.");
  await zeromqServer.close();
  await zeromqClient.close();
  process.exit(0);
});

export default app;

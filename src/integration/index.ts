import express from "express";
import cors from "cors";
import { logger } from "../package/utils/logger.js";
import { telexGeneratedConfig } from "./telexConfig.js";
import { integrationEnvConfig } from "./config.js";

const app = express();
const PORT = integrationEnvConfig.integrationPort;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Integration config endpoint
app.get("/integration-config", (req, res) => {
  res.status(200).json(telexGeneratedConfig);
});

app.post("/webhook", (req, res) => {
  console.log("req body", req.body);
  res.status(200).json({
    message: "Webhook received",
  });
});

app.post("/tick", (req, res) => {
  console.log("tick", req.body);
  res.status(200).json({
    message: "Tick received",
  });
});

app.use("*", (req, res) => {
  res.status(200).json({
    message: "🤔 Hmm... looks like you're lost in the matrix! 🕴️",
    hint: "Try /health instead - it's much more exciting! 🎉",
    funFact:
      "Did you know? 404 was chosen as the 'not found' code because it's the number of hours developers spend debugging per week! 😅",
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;

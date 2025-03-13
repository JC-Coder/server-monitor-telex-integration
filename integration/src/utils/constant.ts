import { Response } from "express";

export const IntegrationConstants = {
  App: {
    Name: "Server Monitor Agent",
  },
  Endpoints: {
    Webhook: "/webhook",
    Tick: "/tick",
  },
  Github: {
    Repository: "https://github.com/JC-Coder/server-monitor-telex-integration",
    InstallationScriptUrl: (channelId: string) => {
      return `curl -sSL https://raw.githubusercontent.com/JC-Coder/server-monitor-telex-integration/refs/heads/dev/install-telex-sdk.sh | bash -s -- --channel-id ${channelId}`;
    },
  },
  Telex: {
    WebhookUrl: "https://ping.telex.im/v1/webhooks",
  },
};

export const AppResponse = (payload: {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: any;
}) => {
  const { res, statusCode, message, data } = payload;

  return {
    Success: () => {
      res.status(statusCode || 200).json({
        status: "success",
        message: message || "Success",
        data,
      });
    },
    Error: () => {
      res.status(statusCode || 500).json({
        status: "error",
        message: message || "Error",
        data,
      });
    },
  };
};

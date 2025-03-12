import { config } from "dotenv";

config();

export const integrationEnvConfig = {
  integrationName: "Telex Server Monitor",
  hostUrl: process.env.INTEGRATION_URL || "127.0.0.1",
  hostPort: Number(process.env.INTEGRATION_PORT || process.env.PORT || 3002), // for managed hosting e.g vercel or render , don't configure port , it'll be added automatically
};

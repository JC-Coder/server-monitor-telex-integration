import { config } from "dotenv";

config();

export const integrationEnvConfig = {
  integrationUrl:
    process.env.INTEGRATION_URL || "https://5lldpsml-3002.uks1.devtunnels.ms",
  integrationPort: process.env.INTEGRATION_PORT || process.env.PORT || 3002, // for managed hosting e.g vercel or render , don't configure port , it'll be added automatically
};

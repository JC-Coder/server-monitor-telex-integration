import { config } from "dotenv";

config();

export const integrationEnvConfig = {
  integrationUrl:
    process.env.INTEGRATION_URL || "https://5lldpsml-3002.uks1.devtunnels.ms",
  integrationPort: process.env.INTEGRATION_PORT || process.env.PORT || 3002, // for managed hosting e.g vercel or render , don't configure port , it'll be added automatically
  zeromq: {
    basePort: process.env.ZEROMQ_BASE_PORT
      ? parseInt(process.env.ZEROMQ_BASE_PORT)
      : 5000,
    host: process.env.ZEROMQ_HOST || "127.0.0.1",
  },
  // Default address for package servers if not explicitly registered
  defaultPackageServerAddress: process.env.DEFAULT_PACKAGE_SERVER_ADDRESS || "localhost",
};

import path from "path";
import os from "os";

const TELEX_API_URL = "https://api.telex.im/api/v1";
const TELEX_MONITOR_DIR = path.join(os.homedir(), ".telex-monitor");

export const AppConstants = {
  Package: {
    Version: "v1.0.0",
    BaseDir: TELEX_MONITOR_DIR,
    StoreFile: path.join(TELEX_MONITOR_DIR, "store.json"),
    LogsDir: path.join(TELEX_MONITOR_DIR, "logs"),
  },
  Telex: {
    LoginUrl: `${TELEX_API_URL}/auth/login`,
    GetOrganisationIntegrationsUrl: (organisationId: string) => {
      return `${TELEX_API_URL}/organisations/${organisationId}/integrations`;
    },
    GetIntegrationSettingsUrl: (
      organisationId: string,
      integrationId: string
    ) => {
      return `${TELEX_API_URL}/organisations/${organisationId}/integrations/${integrationId}/settings`;
    },
  },
  Timers: {
    AuthTokenExpiryInDays: 2,
  },
};

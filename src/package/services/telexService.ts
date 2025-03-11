import {
  AppConstants,
  getStoreData,
  IStore,
  ITelexMonitorSettingsFromTelexApp,
  logger,
  saveStoreData,
  TelexAxiosInstance,
  TelexMonitorSettingsFromTelexApp,
} from "../index.js";

interface ITelexResponse<T> {
  status: "success" | "error";
  status_code: number;
  message: string;
  data: T;
}

export async function fetchOrganisationIntegrations() {
  try {
    const storeData = getStoreData();
    if (!storeData?.organisationId) {
      logger.error("Organisation ID not found");
      throw new Error(
        "Organisation ID not found while fetching integration settings"
      );
    }

    const response = await TelexAxiosInstance.get(
      AppConstants.Telex.GetOrganisationIntegrationsUrl(
        storeData.organisationId
      )
    );
    const responseData = response.data as ITelexResponse<
      {
        id: string;
        app_name: string;
      }[]
    >;

    if (responseData.status !== "success") {
      logger.error(
        `Failed to fetch integration settings: ${responseData.message}`
      );
      throw new Error(
        `Failed to fetch integration settings: ${responseData.message}`
      );
    }

    return responseData.data;
  } catch (error) {
    logger.error(`Failed to fetch integration settings: ${error}`);
    return null;
  }
}

export async function fetchIntegrationSettings(
  orgId: string,
  integrationId: string
) {
  try {
    const response = await TelexAxiosInstance.get(
      AppConstants.Telex.GetIntegrationSettingsUrl(orgId, integrationId)
    );
    const responseData = response.data as ITelexResponse<
      {
        default: string;
        label: string;
      }[]
    >;

    if (responseData.status !== "success") {
      logger.error(
        `Failed to fetch integration settings: ${responseData.message}`
      );
      throw new Error(
        `Failed to fetch integration settings: ${responseData.message}`
      );
    }

    return responseData.data;
  } catch (error) {
    logger.error(`Failed to fetch integration settings: ${error}`);
    return null;
  }
}

export async function fetchIntegrationSettingsForThisApp() {
  const integrations = await fetchOrganisationIntegrations();
  const orgId = getStoreData()?.organisationId;

  const integration = integrations?.find(
    (integration) => integration.app_name === AppConstants.TelexIntegration.name
  );

  if (!integration) {
    logger.error("Integration not found");
    throw new Error(
      `Integration not found, please add the (${AppConstants.TelexIntegration.name}) to your organisation, Follow this link to setup the integration: ${AppConstants.TelexIntegration.setupGuide}`
    );
  }

  const integrationSettings = await fetchIntegrationSettings(
    orgId!,
    integration.id
  );

  let newSettings: Partial<IStore> = {};

  Object.keys(TelexMonitorSettingsFromTelexApp).forEach((key) => {
    const setting = integrationSettings?.find(
      (setting) => setting.label === key
    );

    if (setting) {
      // @ts-ignore
      newSettings[key] = setting.default;
    }
  });

  console.log("newSettings", newSettings);
  saveStoreData({ ...newSettings });
}

import { AppConstants, getStoreData } from "../index.js";

export function checkIfPackageIsConfiguredAlready() {
  const storeData = getStoreData();

  if (!storeData) {
    return;
  }

  const { outputChannelId } = storeData;

  if (!outputChannelId) {
    return false;
  }

  throw new Error(
    `Package is already configured, if you want to reconfigure it, follow these steps:\n
    1. Run (${AppConstants.PackageCommands.Reset}) to reset the configuration
    2. Run (${AppConstants.PackageCommands.Setup}) to setup the configuration

    Need Help ? run this command (${AppConstants.PackageCommands.Help})
    `
  );
}

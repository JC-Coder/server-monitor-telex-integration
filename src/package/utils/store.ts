import fs from "fs";
import path from "path";
import { logger } from "./logger.js";
import { TELEX_MONITOR_DIR } from "./constant.js";

interface IStore {
  authToken: string;
  serverName: string;
  authEmail: string;
  lastTokenRefresh: number;
  settings: {
    metrics: {
      cpu: boolean;
      memory: boolean;
      disk: boolean;
    };
    thresholds: {
      cpu: number;
      memory: number;
      disk: number;
    };
    frequency: number;
    channelIds: string[];
  };
}

const STORE_FILE = path.join(TELEX_MONITOR_DIR, "store.json");

// Ensure store directory exists
function ensureStoreExists(): void {
  if (!fs.existsSync(TELEX_MONITOR_DIR)) {
    fs.mkdirSync(TELEX_MONITOR_DIR, { recursive: true });
  }
}

/**
 * Clear the entire store
 */
export function clearStore(): void {
  try {
    if (fs.existsSync(STORE_FILE)) {
      fs.unlinkSync(STORE_FILE);
    }
  } catch (error) {
    logger.error(`Failed to clear store: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Save data to the store
 * @param data The data to save
 */
export function saveStoreData(data: Partial<IStore>): void {
  try {
    ensureStoreExists();

    let store: IStore = {} as IStore;
    if (fs.existsSync(STORE_FILE)) {
      store = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as IStore;
    }

    // Merge new data with existing store
    const updatedStore = { ...store, ...data };
    fs.writeFileSync(STORE_FILE, JSON.stringify(updatedStore, null, 2));
  } catch (error) {
    logger.error(`Failed to save store data: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get data from the store
 * @returns The stored data or undefined if the file does not exist
 */
export function getStoreData(): IStore | undefined {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return undefined;
    }

    return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as IStore;
  } catch (error) {
    logger.error(`Failed to read store data: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Update data in the store
 * @param updater The function to update the store
 */
export function updateStoreData(
  updater: (store: IStore) => Partial<IStore>
): void {
  try {
    ensureStoreExists();

    let store: IStore = {} as IStore;
    if (fs.existsSync(STORE_FILE)) {
      store = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as IStore;
    }

    const updatedData = updater(store);
    const updatedStore = { ...store, ...updatedData };
    fs.writeFileSync(STORE_FILE, JSON.stringify(updatedStore, null, 2));
  } catch (error) {
    logger.error(`Failed to update store data: ${(error as Error).message}`);
    throw error;
  }
}

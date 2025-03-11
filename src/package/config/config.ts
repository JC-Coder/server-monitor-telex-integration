// import { z } from "zod";
// import os from "os";
// import path from "path";
// import fs from "fs";
// import { getStoreData } from "../index.js";

// // Define the config directory
// const CONFIG_DIR = path.join(os.homedir(), ".telex-monitor");
// const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// // Define the schema for our configuration
// const configSchema = z.object({
//   token: z.string().optional(),
//   serverName: z.string().default(os.hostname()),
//   email: z.string().email().optional(),
//   lastTokenRefresh: z.number().optional(),
//   settings: z
//     .object({
//       metrics: z
//         .object({
//           cpu: z.boolean().default(true),
//           memory: z.boolean().default(true),
//           disk: z.boolean().default(true),
//         })
//         .default({}),
//       thresholds: z
//         .object({
//           cpu: z.number().min(0).max(100).default(85),
//           memory: z.number().min(0).max(100).default(85),
//           disk: z.number().min(0).max(100).default(90),
//         })
//         .default({}),
//       frequency: z.number().min(30).default(300), // Default to 5 minutes (300 seconds)
//       channelIds: z.array(z.string()).default([]),
//     })
//     .default({}),
// });

// // Export the type for our configuration
// export type ConfigType = z.infer<typeof configSchema>;

// // Default configuration
// const defaultConfig: ConfigType = {
//   serverName: os.hostname(),
//   settings: {
//     metrics: {
//       cpu: true,
//       memory: true,
//       disk: true,
//     },
//     thresholds: {
//       cpu: 85,
//       memory: 85,
//       disk: 90,
//     },
//     frequency: 300,
//     channelIds: [],
//   },
// };

// // Ensure the config directory exists
// if (!fs.existsSync(CONFIG_DIR)) {
//   fs.mkdirSync(CONFIG_DIR, { recursive: true });
// }

// // Load the configuration from file
// function loadConfig(): ConfigType {
//   try {
//     if (fs.existsSync(CONFIG_FILE)) {
//       const configData = fs.readFileSync(CONFIG_FILE, "utf8");
//       const parsedConfig = JSON.parse(configData);
//       return configSchema.parse(parsedConfig);
//     }
//   } catch (error) {
//     console.error("Error loading configuration:", error);
//   }

//   // Return default config if loading fails
//   return defaultConfig;
// }

// // Save the configuration to file
// function saveConfig(config: ConfigType): void {
//   try {
//     fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
//   } catch (error) {
//     console.error("Error saving configuration:", error);
//   }
// }

// // Current configuration in memory
// let currentConfig = loadConfig();

// /**
//  * Get the current configuration
//  */
// export function getConfig(): ConfigType {
//   return currentConfig;
// }

// /**
//  * Set a specific configuration value
//  */
// export function setConfig<K extends keyof ConfigType>(
//   key: K,
//   value: ConfigType[K]
// ): void {
//   currentConfig = {
//     ...currentConfig,
//     [key]: value,
//   };
//   saveConfig(currentConfig);
// }

// /**
//  * Update the settings from Telex
//  */
// export function updateSettings(
//   settings: Partial<ConfigType["settings"]>
// ): void {
//   currentConfig.settings = {
//     ...currentConfig.settings,
//     ...settings,
//   };
//   saveConfig(currentConfig);
// }

// /**
//  * Save authentication information
//  */
// export function saveAuth(email: string, token: string): void {
//   currentConfig.email = email;
//   currentConfig.token = token;
//   currentConfig.lastTokenRefresh = Date.now();
//   saveConfig(currentConfig);
// }

// /**
//  * Check if the token is valid (not expired)
//  */
// export function isTokenValid(): boolean {
//   const lastRefresh = currentConfig.lastTokenRefresh;
//   if (!lastRefresh) return false;

//   // Token expires after 2 days (172800000 ms)
//   const expiryTime = 2 * 24 * 60 * 60 * 1000;
//   return Date.now() - lastRefresh < expiryTime;
// }

// /**
//  * Get the authentication token
//  */
// export function getToken(): string | undefined {
//   const storeData = getStoreData();
//   return storeData?.authToken;
// }

// /**
//  * Get the server name
//  */
// export function getServerName(): string {
//   return currentConfig.serverName;
// }

// /**
//  * Set the server name
//  */
// export function setServerName(name: string): void {
//   currentConfig.serverName = name;
//   saveConfig(currentConfig);
// }

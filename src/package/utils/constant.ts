import path from "path";
import os from "os";

export const TELEX_MONITOR_DIR = path.join(os.homedir(), ".telex-monitor");

export const TELEX_API_URL = "https://api.telex.im/api/v1";
export const TELEX_LOGIN_URL = `${TELEX_API_URL}/auth/login`;

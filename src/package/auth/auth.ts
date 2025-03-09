import axios from "axios";
import {
  AppConstants,
  getToken,
  isTokenValid,
  saveStoreData,
  updateSettings,
} from "../index.js";

// Define the authentication response type
interface AuthResponse {
  status: string;
  message: string;
  status_code: number;
  data: {
    user: {
      email: string;
    };
    access_token: string;
  };
}

/**
 * Authenticate with Telex using email and password
 * @param email User's Telex email
 * @param password User's Telex password
 * @returns Promise that resolves to the authentication token
 */
export async function authenticate(
  email: string,
  password: string
): Promise<string> {
  try {
    const response = await axios.post<AuthResponse>(
      `${AppConstants.Telex.LoginUrl}`,
      {
        email,
        password,
      }
    );

    const {
      data: {
        access_token,
        user: { email: authUserEmail },
      },
    } = response.data;

    // Save the token and settings
    saveStoreData({
      authToken: access_token,
      authEmail: authUserEmail,
    });

    return access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          `Authentication failed: ${error.response.data.message || "Invalid credentials"}`
        );
      } else if (error.request) {
        throw new Error("Authentication failed: No response from Telex server");
      }
    }
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
}

/**
 * Get the current authentication token, refreshing if necessary
 * @param email User's Telex email (required if token needs refreshing)
 * @param password User's Telex password (required if token needs refreshing)
 * @returns Promise that resolves to the authentication token
 */
export async function getAuthToken(
  email?: string,
  password?: string
): Promise<string> {
  // Check if we have a valid token
  const token = getToken();
  if (token && isTokenValid()) {
    return token;
  }

  // If we don't have a valid token, we need to authenticate
  if (!email || !password) {
    throw new Error(
      "Authentication required: Please provide email and password"
    );
  }

  return authenticate(email, password);
}

/**
 * Fetch user settings from Telex
 * @param token Authentication token
 * @returns Promise that resolves to the user settings
 */
export async function fetchSettings(token: string): Promise<void> {
  try {
    const response = await axios.get(`${AppConstants.Telex}/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    updateSettings(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          `Failed to fetch settings: ${error.response.data.message || "Server error"}`
        );
      } else if (error.request) {
        throw new Error(
          "Failed to fetch settings: No response from Telex server"
        );
      }
    }
    throw new Error(`Failed to fetch settings: ${(error as Error).message}`);
  }
}

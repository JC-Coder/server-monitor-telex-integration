import axios from "axios";
import { AppConstants, getStoreData, saveStoreData } from "../index.js";
import { DateTime } from "luxon";

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
      authToken: {
        value: access_token,
        expiresAt: DateTime.now().plus({ days: 2 }).toJSDate(),
      },
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
 */
export async function getAuthToken(
  email?: string,
  password?: string
): Promise<string> {
  // get token from store and check if it's not expired
  const storeData = getStoreData();

  let needAuthRefresh = false;

  if (!storeData) {
    needAuthRefresh = true;
  }

  if (storeData?.authToken?.value && !storeData?.authToken?.expiresAt) {
    const authTokenExpiry = DateTime.fromJSDate(
      new Date(storeData?.authToken?.expiresAt)
    );
    const diffInDays = authTokenExpiry.diffNow("days").negate().days;

    if (diffInDays > AppConstants.Timers.AuthTokenExpiryInDays) {
      needAuthRefresh = true;
    }
  }

  if (needAuthRefresh) {
    // If we don't have a valid token, we need to authenticate
    if (!email || !password) {
      throw new Error(
        "Authentication required: Please provide email and password"
      );
    }

    return await authenticate(email, password);
  } else {
    return storeData!.authToken.value;
  }
}

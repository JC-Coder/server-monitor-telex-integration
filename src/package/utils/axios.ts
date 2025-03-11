import axios from "axios";
import { AppConstants, getStoreData } from "../index.js";

export const TelexAxiosInstance = axios.create({
  baseURL: AppConstants.Telex.BaseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getStoreData()?.authToken?.value}`,
  },
});

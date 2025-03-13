import axios from "axios";
import { IntegrationConstants } from "../utils/constant.js";

const SendWebhookResponse = async (payload: {
  channelId: string;
  message: string;
}) => {
  const { channelId, message } = payload;

  try {
    if (!channelId || !message) {
      throw new Error("Channel ID and message are required");
    }

    const messageSignature = `\n\n_🔍 Sent by ${IntegrationConstants.App.Name}_`;
    const signedMessage = message + messageSignature;

    await axios.post(`${IntegrationConstants.Telex.WebhookUrl}/${channelId}`, {
      event_name: IntegrationConstants.App.Name,
      message: signedMessage,
      status: "success",
      username: IntegrationConstants.App.Name,
    });

    console.log(`Webhook sent successfully to channel : ${channelId}`);
  } catch (error) {
    console.error("Error sending telex webhook response", error);
  }
};

export const TelexService = {
  SendWebhookResponse,
};

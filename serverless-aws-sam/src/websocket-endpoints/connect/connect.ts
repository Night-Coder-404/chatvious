import { initialConectDBWSManager } from "../../models/web-socket-messages.js";
import { APIGatewayWebSocketConnectEvent } from "../../types/types.js";

export const handler = async (
  event: APIGatewayWebSocketConnectEvent
): Promise<{ statusCode: number }> => {
  const userID = event.requestContext.authorizer?.sub as string;
  const connectionId = event.requestContext.connectionId;

  const storeConnectionResponse =
    await initialConectDBWSManager.storeInitialConnection(connectionId, userID);
  if ("error" in storeConnectionResponse) {
    return { statusCode: storeConnectionResponse.statusCode };
  }

  return { statusCode: 200 };
};

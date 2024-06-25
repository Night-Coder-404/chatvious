import { PostConfirmationEvent } from "../types.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const colors = ["blue", "green", "orange", "yellow", "sky", "purple", "pink"];
const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

export const saveUserData = async (event: PostConfirmationEvent) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);

    const userDataCommand = new PutCommand({
      TableName: "chatvious-users",
      Item: {
        "id-sub": event.request.userAttributes.sub,
        username: event.userName,
        email: event.request.userAttributes.email,
        ownedRooms: [],
        joinedRooms: [],
        profileColor: getRandomColor(),
      },
    });

    // check for an error and return an error if there is an problem
    const res = await docClient.send(userDataCommand);
    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to save user data");
    }

    return event;
  }

  return event;
};

import { Request } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cognitoData from "../cognitoData.js";
import { JwtBaseError } from "aws-jwt-verify/error";
import {
  MakeRoomReturnType,
  RoomInfoDBType,
  FetchRoomReturn,
  RoomInfoType,
  RoomOwnerDB,
  FetchRoomOwnerReturn,
  RoomMembersDB,
  RoomMembers,
  FetchRoomMembersReturn,
  JoinRequestsDB,
  FetchJoinRequestsReturn,
  SendJoinRequestReturn,
} from "../types/types.js";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function makeRoom(req: Request): MakeRoomReturnType {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: cognitoData.USER_POOL_ID,
    tokenUse: "access",
    clientId: cognitoData.CLIENT_ID,
  });

  const access_token = req.cookies.access_token as string | undefined;
  if (!access_token) {
    return { error: "Unauthorized", statusCode: 401 };
  }

  try {
    const payload = await verifier.verify(access_token);
    const ownerID = payload.sub;
    const ownerName = payload.username;
    const RoomID = crypto.randomUUID();

    const roomData: RoomInfoDBType = {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: "METADATA",
      RoomID,
      roomName: req.body.roomName,
      createdAt: new Date().toISOString(),
    };

    const newRoomCommand = new PutCommand({
      TableName: "chatvious",
      Item: roomData,
    });

    // newRoom value needs to be wrapped in an array
    const updateUserRoomCommand = new UpdateCommand({
      TableName: "chatvious",
      Key: { PartitionKey: `USER#${ownerID}`, SortKey: "PROFILE" },
      UpdateExpression: "SET ownedRooms = list_append(ownedRooms, :newRoom)",
      ExpressionAttributeValues: {
        ":newRoom": [{ roomName: roomData.roomName, RoomID: roomData.RoomID }],
      },
    });

    const createRoomOwnerCommand = new PutCommand({
      TableName: "chatvious",
      Item: {
        PartitionKey: `ROOM#${RoomID}`,
        SortKey: "OWNER",
        ownerID,
        ownerName,
        RoomID,
      },
    });

    const makeRoomResponse = await docClient.send(newRoomCommand);
    const makeRoomStatusCode = makeRoomResponse.$metadata
      .httpStatusCode as number;
    if (makeRoomStatusCode !== 200) {
      return {
        error: "Failed to make room",
        statusCode: makeRoomStatusCode,
      };
    }

    const updateUsersResponse = await docClient.send(updateUserRoomCommand);
    const updateStatusCode = updateUsersResponse.$metadata
      .httpStatusCode as number;
    if (updateStatusCode !== 200) {
      return {
        error: "Failed to update user",
        statusCode: updateStatusCode,
      };
    }

    const createOwnerResponse = await docClient.send(createRoomOwnerCommand);
    const createOwnerStatusCode = createOwnerResponse.$metadata
      .httpStatusCode as number;
    if (createOwnerStatusCode !== 200) {
      return {
        error: "Failed to create owner",
        statusCode: createOwnerStatusCode,
      };
    }

    return { message: "Room Created", statusCode: 201 };
  } catch (err) {
    if (err instanceof JwtBaseError) {
      return { error: "Not Authorized", statusCode: 401 };
    }
    return { error: "Internal Server Error", statusCode: 500 };
  }
}

async function fetchRoom(RoomID: string): FetchRoomReturn {
  const roomInfoCommand = new GetCommand({
    TableName: "chatvious",
    Key: { PartitionKey: `ROOM#${RoomID}`, SortKey: "METADATA" },
  });

  const roomInfoResponse = await docClient.send(roomInfoCommand);

  if (roomInfoResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Info", statusCode: 500 };
  }

  const roomInfoDB = roomInfoResponse.Item as RoomInfoDBType | undefined;
  if (roomInfoDB == undefined) {
    return { error: "Bad Request", statusCode: 400 };
  }

  const roomInfo: RoomInfoType = {
    RoomID: roomInfoDB.RoomID,
    roomName: roomInfoDB.roomName,
    createdAt: roomInfoDB.createdAt,
  };
  return { roomInfo, statusCode: 200 };
}

async function fetchRoomOwner(RoomID: string): FetchRoomOwnerReturn {
  const roomOwnerCommand = new GetCommand({
    TableName: "chatvious",
    Key: { PartitionKey: `ROOM#${RoomID}`, SortKey: "OWNER" },
  });

  const roomOwnerResponse = await docClient.send(roomOwnerCommand);

  if (roomOwnerResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Info", statusCode: 500 };
  }

  const roomOwnerDB = roomOwnerResponse.Item as RoomOwnerDB | undefined;
  if (roomOwnerDB == undefined) {
    return { error: "Bad Request", statusCode: 400 };
  }

  const roomOwner = {
    ownerID: roomOwnerDB.ownerID,
    ownerName: roomOwnerDB.ownerName,
    RoomID: roomOwnerDB.RoomID,
  };

  return { roomOwner, statusCode: 200 };
}

async function fetchRoomMembers(RoomID: string): FetchRoomMembersReturn {
  const roomMembersCommand = new QueryCommand({
    TableName: "chatvious",
    KeyConditionExpression:
      "PartitionKey = :partitionKey AND begins_with(SortKey, :RoomMembersPrefix)",
    ExpressionAttributeValues: {
      ":partitionKey": `ROOM#${RoomID}`,
      ":RoomMembersPrefix": "MEMBERS#",
    },
  });

  const roomMembersResponse = await docClient.send(roomMembersCommand);
  const memberCount = roomMembersResponse.Count as number;
  if (roomMembersResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Room Members", statusCode: 500 };
  }

  const roomMembersDB = roomMembersResponse.Items as RoomMembersDB;
  const roomMembers: RoomMembers = roomMembersDB.map((member) => ({
    userName: member.userName,
    userID: member.userID,
    RoomID,
    joinedAt: member.joinedAt,
    profileColor: member.profileColor,
  }));

  if (roomMembersResponse.Count === 0) {
    return { roomMembers, message: "No Users", memberCount, statusCode: 200 };
  }

  return {
    roomMembers,
    message: `${memberCount} Users Found`,
    memberCount,
    statusCode: 200,
  };
}

async function fetchJoinRequests(RoomID: string): FetchJoinRequestsReturn {
  const joinRequestsCommand = new QueryCommand({
    TableName: "chatvious",
    KeyConditionExpression:
      "PartitionKey = :roomsID AND begins_with(SortKey, :joinRequest)",
    ExpressionAttributeValues: {
      ":roomsID": `ROOM#${RoomID}`,
      ":joinRequest": "JOIN_REQUESTS#",
    },
    ConsistentRead: true,
  });

  const joinRequestResponse = await docClient.send(joinRequestsCommand);

  if (joinRequestResponse.$metadata.httpStatusCode !== 200) {
    return { error: "Failed to Get Join Requests", statusCode: 500 };
  }
  const joinRequestsDB = joinRequestResponse.Items as JoinRequestsDB;
  const joinRequests = joinRequestsDB?.map((request) => ({
    RoomID: request.RoomID,
    fromUserID: request.fromUserID,
    fromUserName: request.fromUserName,
    roomName: request.roomName,
    sentJoinRequestAt: request.sentJoinRequestAt,
    profileColor: request.profileColor,
  }));

  if (joinRequestResponse.Count === 0) {
    return { message: "No Join Requests", joinRequests, statusCode: 200 };
  }

  return {
    message: `${joinRequests.length} Join Request Fetched`,
    joinRequests,
    statusCode: 200,
  };
}

async function sendJoinRequest(
  fromUserName: string,
  fromUserID: string,
  roomName: string,
  RoomID: string,
  profileColor: string
): SendJoinRequestReturn {
  const sentJoinRequestAt = new Date().toISOString();
  const joinRequestCommand = new PutCommand({
    TableName: "chatvious",
    Item: {
      PartitionKey: `ROOM#${RoomID}`,
      SortKey: `JOIN_REQUESTS#${sentJoinRequestAt}#${fromUserID}`,
      RoomID,
      fromUserID,
      fromUserName,
      roomName,
      sentJoinRequestAt,
      profileColor,
    },
  });

  const joinRequestResponse = await docClient.send(joinRequestCommand);
  const statusCode = joinRequestResponse.$metadata.httpStatusCode as number;

  if (statusCode !== 200) {
    return { error: "Failed to send Join Request", statusCode };
  }

  return {
    message: "Successfully sent Join Request to the Room",
    statusCode: 200,
  };
}

export {
  makeRoom,
  fetchRoom,
  fetchRoomOwner,
  fetchRoomMembers,
  fetchJoinRequests,
  sendJoinRequest,
};

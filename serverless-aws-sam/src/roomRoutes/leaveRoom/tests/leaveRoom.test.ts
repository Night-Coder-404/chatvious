import { handler } from "../leaveRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { userManager, roomsOnUserManager } from "../../../models/users.js";
import { roomManager, roomUsersManager } from "../../../models/rooms.js";
import { UserInfo, RoomInfoType } from "../../../types/types.js";
import {
  newTestUser,
  clearDynamoDB,
} from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;
let newUser: UserInfo;

const roomName = "leaveRoomTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let roomOwnerUser: UserInfo;
let roomOwnerUserID: string;
let roomOwnerUserName: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  // make a user who will be the room owner
  const createroomOwnerUserResponse = await userManager.createUser();
  if ("error" in createroomOwnerUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createroomOwnerUserResponse.error}`
    );
  }
  roomOwnerUser = createroomOwnerUserResponse.newUser;
  roomOwnerUserID = roomOwnerUser.userID;
  roomOwnerUserName = roomOwnerUser.userName;

  // make a room for the user to join
  const createRoomResponse = await roomManager.makeRoom(
    roomOwnerUserID,
    roomOwnerUserName,
    roomName,
    roomOwnerUser.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  // include user in room
  const addRoomMemberResponse = await roomUsersManager.addRoomMember(
    RoomID,
    userID,
    roomName,
    userName,
    newUser.profileColor
  );
  if ("error" in addRoomMemberResponse) {
    throw new Error(
      `Failed to add user to room. Error: ${addRoomMemberResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
  restAPIEvent.path = "/rooms/leaveRoom";
  restAPIEvent.resource = "/rooms/leaveRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

afterAll(async () => {
  await clearDynamoDB();
});

describe("A test To see if the leaveRoom Route works correctly", () => {
  test("leaveRoom route should return a successfull response and removes roomMember and room on user", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Successfully Left the room");

    // check if the user was removed from the room
    const fetchRoomMemberResponse = await roomUsersManager.fetchRoomMember(
      RoomID,
      userID
    );
    if (
      "error" in fetchRoomMemberResponse &&
      fetchRoomMemberResponse.error !== "Bad Request"
    ) {
      throw new Error(
        `Failed to fetch RoomMember after leaving room in test. Error: ${fetchRoomMemberResponse.error}`
      );
    }

    expect(fetchRoomMemberResponse).toHaveProperty("statusCode", 400);
    expect(fetchRoomMemberResponse).toHaveProperty("error", "Bad Request");

    // check if room on user was removed
    const roomOnUserResponse = await roomsOnUserManager.fetchSingleRoomOnUser(
      userID,
      RoomID
    );
    if (
      "error" in roomOnUserResponse &&
      roomOnUserResponse.error !== "Room on user not found"
    ) {
      throw new Error(
        `Failed to fetch room on user after leaving room in test. Error: ${roomOnUserResponse.error}`
      );
    }

    expect(roomOnUserResponse).toHaveProperty("statusCode", 404);
    expect(roomOnUserResponse).toHaveProperty(
      "error",
      "Room on user not found"
    );
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});

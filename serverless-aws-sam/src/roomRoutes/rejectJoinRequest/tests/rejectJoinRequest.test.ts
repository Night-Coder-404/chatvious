import { handler } from "../rejectJoinRequest.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { UserInfo, RoomInfoType } from "../../../types/types.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

const roomName = "acceptJoinRequestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let requestingUser: UserInfo;
let requestUserID: string;
let requestUserName: string;

beforeAll(async () => {
  // check if there is a user, delete them to have the same info if they exist
  const fetchUserInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in fetchUserInfoResponse) {
    if (fetchUserInfoResponse.error === "Failed to Get User Info") {
      throw new Error("Failed to fetch user info");
    }
  } else {
    const deleteUserResponse = await userManager.deleteUser(userID);
    if ("error" in deleteUserResponse) {
      throw new Error(
        `Failed to clean up before test. Error: ${deleteUserResponse.error}`
      );
    }
  }

  const createUserResponse = await userManager.createUser(
    userID,
    userName,
    email
  );
  if ("error" in createUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserResponse.error}`
    );
  }
  newUser = createUserResponse.newUser;

  // make a user for the person making the request
  const createRequestingUserResponse = await userManager.createUser();
  if ("error" in createRequestingUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createRequestingUserResponse.error}`
    );
  }
  requestingUser = createRequestingUserResponse.newUser;
  requestUserID = requestingUser.userID;
  requestUserName = requestingUser.userName;

  // make a room for the user to join
  const createRoomResponse = await roomManager.makeRoom(
    userID,
    userName,
    roomName,
    newUser.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  // send a join request to the room by requesting user
  const sendJoinRequestResponse = await roomManager.sendJoinRequest(
    requestUserName,
    requestUserID,
    roomName,
    RoomID,
    requestingUser.profileColor
  );
  if ("error" in sendJoinRequestResponse) {
    throw new Error(
      `Failed to send join request. Error: ${sendJoinRequestResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    userID: requestUserID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/rejectJoinRequest";
  restAPIEvent.resource = "/rooms/rejectJoinRequest";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // delete the sent join request
  const removeJoinRequestResponse = await roomManager.removeJoinRequest(
    RoomID,
    requestUserID
  );
  if (
    "error" in removeJoinRequestResponse &&
    removeJoinRequestResponse.error !== "Bad Request"
  ) {
    throw new Error(
      `Failed to clean up JoinRequest after test. Error: ${removeJoinRequestResponse.error}`
    );
  }

  // delete the users room member entries
  const removeRoomMemberResponse = await roomManager.removeRoomMember(
    RoomID,
    userID
  );
  if ("error" in removeRoomMemberResponse) {
    throw new Error(
      `Failed to clean up RoomMember after test. Error: ${removeRoomMemberResponse.error}`
    );
  }

  const removeRequestingUserRoomMemberResponse =
    await roomManager.removeRoomMember(RoomID, requestUserID);
  if (
    "error" in removeRequestingUserRoomMemberResponse &&
    removeRequestingUserRoomMemberResponse.error !== "Bad Request"
  ) {
    throw new Error(
      `Failed to clean up requesting RoomMember after test. Error: ${removeRequestingUserRoomMemberResponse.error}`
    );
  }

  // delete the users we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }

  const deleteRequestingUserResponse = await userManager.deleteUser(
    requestUserID
  );
  if ("error" in deleteRequestingUserResponse) {
    throw new Error(
      `Failed to clean up requesting user after test. Error: ${deleteRequestingUserResponse.error}`
    );
  }

  // remove the created room
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if ("error" in deleteRoomResponse) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }
});

describe("A test for the rejectJoinRequest route handler", () => {
  test("rejectJoinRequest route returns a successfull response with correct input", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Join request rejected successfully");
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID and userID should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});

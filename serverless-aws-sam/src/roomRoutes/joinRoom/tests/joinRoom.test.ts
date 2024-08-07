import { handler } from "../joinRoom.js";
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
import { RoomInfoType, UserInfo } from "../../../types/types.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

const roomName = "joinRoomTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let roomUserOwner: UserInfo;
let roomUserID: string;

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

  // make a user to be able to make a room
  const createRequestingUserResponse = await userManager.createUser();
  if ("error" in createRequestingUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createRequestingUserResponse.error}`
    );
  }
  roomUserOwner = createRequestingUserResponse.newUser;
  roomUserID = roomUserOwner.userID;

  // make a room for the user to send a join request to
  const createRoomResponse = await roomManager.makeRoom(
    roomUserID,
    roomUserOwner.userName,
    roomName,
    roomUserOwner.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
  restAPIEvent.path = "/rooms/joinRoom";
  restAPIEvent.resource = "/rooms/joinRoom";

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
    userID
  );
  if (
    "error" in removeJoinRequestResponse &&
    removeJoinRequestResponse.error !== "Bad Request"
  ) {
    throw new Error(
      `Failed to clean up JoinRequest after test. Error: ${removeJoinRequestResponse.error}`
    );
  }

  // delete the owner room member entry
  const removeRoomOwnerResponse = await roomManager.removeRoomMember(
    RoomID,
    roomUserID
  );
  if ("error" in removeRoomOwnerResponse) {
    throw new Error(
      `Failed to clean up RoomMember after test. Error: ${removeRoomOwnerResponse.error}`
    );
  }

  // delete the users we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }

  const deleteRoomUserOwnerResponse = await userManager.deleteUser(roomUserID);
  if ("error" in deleteRoomUserOwnerResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteRoomUserOwnerResponse.error}`
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

describe("A test suite to test whether a room join request is successfully sent", () => {
  test("joinRoom return a success response with correct input", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Successfully sent Join Request to the Room");
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
    expect(body.error).toBe("Room ID is required");
  });

  test("joinRoom should return the correct Error when RoomID is less than 20 characters", async () => {
    restAPIEvent.body = JSON.stringify({ RoomID: "e1c5d65a-cbef-4518" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room ID must be at least 20 characters");
  });

  test("joinRoom should return the correct Error when RoomID is greater than 50 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      RoomID: "71fab644-0049-47ee-b27b-bc83110c398c-e1c5d65a-cbef-4518",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room ID must be less than 50 characters");
  });
});

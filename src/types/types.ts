type AuthCodeTokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

type TokenRefresh = {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
};

type MakeRoomReturnError = {
  error: string;
  statusCode: number;
};

type MakeRoomReturnSuccess = {
  message: string;
  statusCode: number;
};

type MakeRoomReturnType = Promise<MakeRoomReturnError | MakeRoomReturnSuccess>;

type RoomsOnUser = { roomName: string; RoomID: string }[] | [];

type UserInfo = {
  "id-sub": string;
  username: string;
  email: string;
  ownedRooms: RoomsOnUser;
  joinedRooms: RoomsOnUser;
  profileColor: string;
};

type FetchUserInfoError = {
  error: string;
  statusCode: number;
};

type FetchUserInfoSuccess = {
  userInfo: UserInfo;
  statusCode: number;
};

type FetchUserInfoReturn = Promise<FetchUserInfoError | FetchUserInfoSuccess>;

type RoomInfoType = {
  RoomID: string;
  owner: { ownerID: string; ownerName: string };
  roomName: string;
  createdAt: string;
  authedUsers: { userID: string; username: string }[] | [];
};

type FetchRoomErrorReturn = {
  error: string;
  statusCode: number;
};

type FetchRoomSuccessReturn = {
  roomInfo: RoomInfoType;
  statusCode: number;
};

type FetchRoomReturn = Promise<FetchRoomErrorReturn | FetchRoomSuccessReturn>;

type SendRoomRequestError = {
  error: string;
  statusCode: number;
};

type SendRoomRequestSuccess = {
  message: string;
  statusCode: number;
};

type SendRoomRequestReturn = Promise<
  SendRoomRequestSuccess | SendRoomRequestError
>;

type JoinRequest = {
  ownerID: string;
  createdAt: string;
  fromUserName: string;
  fromUserID: string;
  roomName: string;
  roomID: string;
};

type JoinRequets = JoinRequest[];

export {
  AuthCodeTokenResponse,
  TokenRefresh,
  RoomsOnUser,
  MakeRoomReturnType,
  RoomInfoType,
  UserInfo,
  FetchUserInfoReturn,
  FetchRoomReturn,
  SendRoomRequestReturn,
  JoinRequets,
};

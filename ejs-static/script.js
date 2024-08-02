import express from "express";
import path from "path";
import {
  fakeDashboardData,
  ownedRoomInfo,
  joinedRoomInfo,
  fakeJoinRoomInfoPageOwner,
  fakeJoinRoomInfoPageMember,
} from "./fakeEjsPageData.js";
const app = express();

app.use(express.static("../dist/public"));
app.set("view engine", "ejs");

app.get("/about", (req, res) => {
  res.sendFile(path.resolve("..", "dist", "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "dashboard"),
    fakeDashboardData
  );
});

app.get(`/rooms/${ownedRoomInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "roomInfo"),
    fakeJoinRoomInfoPageOwner
  );
});

app.get(`/rooms/${joinedRoomInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "roomInfo"),
    fakeJoinRoomInfoPageMember
  );
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log("url: http://localhost:3000");
});

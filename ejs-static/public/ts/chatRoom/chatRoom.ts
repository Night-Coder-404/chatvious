import "../../css/styles.css";
// remove to use the built in websocket client so it can work with api gateway
console.log("test");
// urls not decided yet (temp for now)
const websocketURL = process.env.IS_DEV_SERVER
  ? "ws://localhost:3000"
  : "apigateway websocket url(not set up yet)";

const socket = new WebSocket(websocketURL);

const messageBox = document.getElementById("message") as HTMLElement;
const input = document.getElementById("input") as HTMLInputElement;
const button = document.getElementById("button") as HTMLButtonElement;

function sendMessage() {
  const message = input.value;
  if (message) {
    socket.send("message");
    input.value = "";
  }
}
button.addEventListener("click", sendMessage);

socket.addEventListener("open", () => {
  console.log("Connected to server");
  socket.send("Hello from the client");
});

socket.addEventListener("message", (event) => {
  console.log(event.data);
  messageBox.innerText = event.data;
});

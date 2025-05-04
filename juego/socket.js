// juego/socket.js
import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const socket = io("http://localhost:3000", {
  autoConnect: false,
  transports: ['websocket'],
});

socket.on("connect", () => {
  console.log("🟢 Conectado al servidor de WebSockets con ID:", socket.id);
});

export default socket;

import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const URL = "http://localhost:3000";

const socket = io(URL, {
    autoConnect: true,
    transports: ["websocket"],
    reconnection: true,         // Reconectar automáticamente
    reconnectionDelay: 1000,    // Esperar 1 segundo antes de intentar reconectar
    reconnectionAttempts: 5,    // Intentar 5 veces
    auth: {
        token: localStorage.getItem("token"),
        jugador_id: localStorage.getItem("jugador_id"),
        sala: localStorage.getItem("salaActual")
    }
});

socket.on("connect", () => {
    console.log("Conectado al servidor de WebSockets con ID:", socket.id);
});

socket.on("ping", () => {
    console.log("Ping recibido, enviando pong...");
    socket.emit("pong");  // Responder con pong
});

// Si la conexión se pierde por alguna razón, el cliente intentará reconectar
socket.on("disconnect", (reason) => {
    console.log(`Desconectado: ${reason}`);
    socket.connect();  // Intentar reconectar
});

export default socket;

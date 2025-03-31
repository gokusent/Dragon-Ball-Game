import { io } from "socket.io-client";

alert("Bienvenido a la sala de combate PVP!");
console.log("🔗 Conectando al servidor PVP...");
const socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],  // 🔹 Usa solo WebSocket para evitar problemas de polling
});

socket.on("connect", () => {
    console.log("✅ Conectado al servidor PVP con ID:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("❌ Desconectado del servidor:", reason);
});

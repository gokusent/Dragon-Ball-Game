// socketHandler.js

const socket = io("http://localhost:3000"); // Ajusta la URL según tu configuración

// 📌 Manejo de eventos globales de Socket.IO
socket.on("connect", () => {
    console.log("🟢 Conectado al servidor de WebSockets, ID de socket:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.warn("🔴 Desconectado del servidor:", reason);
    if (reason === "io server disconnect") {
        socket.connect();  // Intentar reconectar si la desconexión fue por el servidor
    }
});


socket.on("connect_error", (error) => {
    console.error("❌ Error de conexión:", error);
    // Manejo de errores de conexión
});

// Puedes agregar más eventos globales según las necesidades de tu aplicación

export default socket;

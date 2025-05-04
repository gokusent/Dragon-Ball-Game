// cliente.js (reemplaza todo el contenido)
import socket from './socket.js';

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const salaId = urlParams.get("sala");
    
    if (!salaId) {
        alert("Error: No se encontró ID de sala. Redirigiendo...");
        window.location.href = "menu.html";
        return;
    }

    // Obtener equipo del localStorage
    const equipo = JSON.parse(localStorage.getItem("equipoJ1") || []);
    
    socket.emit("unirse_sala_pvp", { 
        sala: salaId,
        equipo 
    });

    socket.on("partida_lista", ({ jugador1, jugador2 }) => {
        console.log("Partida lista con:", jugador1, jugador2);
        // Aquí puedes iniciar el juego
    });
});
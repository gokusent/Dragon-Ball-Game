const socket = io("http://localhost:3000"); // Nos conectamos al servidor PVP

// Obtener ID de la sala desde la URL
const urlParams = new URLSearchParams(window.location.search);
const sala = urlParams.get("sala");

document.addEventListener("DOMContentLoaded", () => {
    const btnListo = document.getElementById("btn-listo");
    const estadoPartida = document.getElementById("estado-partida");
    const jugador1 = document.getElementById("jugador1");
    const jugador2 = document.getElementById("jugador2");

    if (!sala) {
        console.error("❌ Error: ID de sala no encontrada en la URL.");
        alert("No se encontró la sala. Volviendo al inicio...");
        window.location.href = "menu.html";
    } else {
        console.log("🔹 Entrando a la sala:", sala);
        socket.emit("unirse_sala", sala); // Avisamos al servidor
    }

    // 📌 Actualizar lista de jugadores en la sala
    socket.on("actualizar_sala", (data) => {
        jugador1.textContent = `Jugador 1: ${data.jugador1 || "Esperando..."}`;
        jugador2.textContent = `Jugador 2: ${data.jugador2 || "Esperando..."}`;

        // Habilitar botón "Estoy listo" si ya hay dos jugadores
        if (data.jugador1 && data.jugador2) {
            btnListo.disabled = false;
        }
    });

    // 📌 Evento cuando el jugador presiona "Estoy listo"
    btnListo.addEventListener("click", () => {
        socket.emit("jugador_listo", sala);
        btnListo.disabled = true;
        estadoPartida.textContent = "Esperando al otro jugador...";
    });

    // 📌 Si ambos jugadores están listos, iniciamos la partida
    socket.on("iniciar_partida", () => {
        console.log("🎮 Partida iniciada, redirigiendo al combate...");
        window.location.href = `seleccion.html?sala=${sala}`;
    });
});

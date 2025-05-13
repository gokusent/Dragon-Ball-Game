import socket from "./socket.js";

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let sala = urlParams.get("sala");
    const token = localStorage.getItem("token");
    window.socket = socket; // Hacemos el socket global para poder usarlo en otros módulos

    let soyHost = false;  // Variable que indicará si el jugador es el host de la sala

    try {
        // Obtener perfil del jugador con credentials para enviar las cookies
        const perfilRes = await fetch("http://localhost:8000/api/perfil", {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"  // ¡Muy importante para enviar la cookie de sesión!
        });

        if (!perfilRes.ok) {
            throw new Error(`Error en la API: ${perfilRes.statusText}`);
        }

        const perfil = await perfilRes.json();
        const jugador_id = perfil.id;

        console.log("🧾 Perfil obtenido:", perfil);

        // Si no hay sala en la URL, solicitar una nueva sala
        if (!sala) {
            socket.emit("solicitar_sala", { jugador_id });
            socket.on("asignar_sala", ({ sala: salaAsignada, esHost }) => {
                if (salaAsignada) {
                    soyHost = esHost; // Asignamos si este jugador es el host
                    window.location.href = `sala.html?sala=${salaAsignada}`;
                } else {
                    console.error("No se asignó sala.");
                }
            });
            return;
        }

        // Si ya tenemos una sala, unirse a ella
        if (!socket.connected) {
            socket.connect();
        }

        // Al conectarse, ahora también pasamos el nombre obtenido desde el perfil
        socket.emit("unirse_sala_pvp", { sala, jugador_id, nombre: perfil.nombre });

        // Elementos DOM
        const jugador1 = document.getElementById("jugador1");
        const jugador2 = document.getElementById("jugador2");
        const btnListo = document.getElementById("btn-listo");
        const estadoPartida = document.getElementById("estado-partida");

        // Función para obtener el nombre de un jugador (si fuera necesaria)
        const obtenerNombreJugador = async (id) => {
            try {
                const response = await fetch(`http://localhost:8000/api/usuario/${id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    credentials: "include"
                });
                if (!response.ok) {
                    console.error("Error al obtener el usuario:", response.statusText);
                    return "Desconocido";
                }
                const data = await response.json();
                return data.nombre;
            } catch (error) {
                console.error("Error al obtener el nombre del jugador:", error);
                return "Desconocido";
            }
        };

        // Escuchar el estado de la sala (para actualizar la interfaz)
        socket.on("estado_sala", async (data) => {
            console.log("📥 Estado de la sala recibido:", data);

            // Verificar si este jugador es el host según el campo 'soyHost' recibido
            soyHost = data.soyHost;

            if (soyHost) {
                // Lógica para el host (ejemplo: permitir iniciar la partida)
                console.log("¡Eres el host!");
                localStorage.setItem("soyHost", soyHost ? "true" : "false");
            } else {
                // Lógica para el jugador invitado
                console.log("Eres el invitado.");
            }

            // Obtener nombres de los jugadores o establecer "Esperando..." si no están definidos
            const nombreJugador1 = data.jugador1 ? data.jugador1.nombre || await obtenerNombreJugador(data.jugador1.jugador_id) : "Esperando...";
            const nombreJugador2 = data.jugador2 ? data.jugador2.nombre || await obtenerNombreJugador(data.jugador2.jugador_id) : "Esperando...";

            // Actualizar los textos de los jugadores en la interfaz
            jugador1.textContent = `Jugador 1: ${nombreJugador1}`;
            jugador2.textContent = `Jugador 2: ${nombreJugador2}`;
            estadoPartida.textContent = data.jugador2 ? "¡Ambos jugadores están conectados!" : "Esperando a un oponente...";

            // Habilitar/deshabilitar el botón "Listo" dependiendo de si hay dos jugadores
            btnListo.disabled = !data.jugador1 || !data.jugador2;
        });


        // Cuando un jugador se une
        socket.on("jugador_unido", async (data) => {
            console.log("📥 Jugador unido recibido:", data);
            const nombreJugador1 = data.jugador1 ? data.jugador1.nombre || await obtenerNombreJugador(data.jugador1.jugador_id) : "Esperando...";
            const nombreJugador2 = data.jugador2 ? data.jugador2.nombre || await obtenerNombreJugador(data.jugador2.jugador_id) : "Esperando...";
            
            jugador1.textContent = `Jugador 1: ${nombreJugador1}`;
            jugador2.textContent = `Jugador 2: ${nombreJugador2}`;
            estadoPartida.textContent = "¡Ambos jugadores están conectados!";
            btnListo.disabled = false;
        });

        // Detectar desconexión
        socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
        });

        // Cuando el oponente se desconecta
        socket.on("oponente_desconectado", () => {
            jugador2.textContent = `Jugador 2: Esperando...`;
            estadoPartida.textContent = "Oponente desconectado.";
            btnListo.disabled = true;
        });

        // Cuando el jugador se marca como listo
        btnListo.addEventListener("click", () => {
            socket.emit("jugador_listo", { sala, jugador_id });
            btnListo.disabled = true;
            estadoPartida.textContent = "Esperando al otro jugador...";
        });

        // Iniciar la partida
        socket.on("iniciar_partida", () => {
            window.location.href = `seleccion.html?sala=${sala}&modo=pvp`;
        });
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
    }

    // Volver al menú
    document.getElementById("btn-salir").addEventListener("click", () => {
        socket.emit("salir_sala", { sala });
        window.location.href = "menu.html";
    });
});

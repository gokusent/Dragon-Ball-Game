import socket from "./socket.js";

document.addEventListener("DOMContentLoaded", async () => {
    const seleccionContainer = document.querySelector(".characters");
    const token = localStorage.getItem("token");

    const urlParams = new URLSearchParams(window.location.search);
    const modo = urlParams.get("modo") || "cpu";
    const sala = urlParams.get("sala");

    let personajesSeleccionados = [];
    let personajesBloqueados = [];
    let jugadorActual = 1;
    let selectedIndex = 0;
    let handleKeydown; // Para controlar duplicados de eventos

    // Validación de sesión
    if (!token) {
        alert("Debes iniciar sesión para seleccionar personajes.");
        window.location.href = "index.html";
        return;
    }

    // Validación de modo de juego
    if (!["cpu", "local", "pvp"].includes(modo)) {
        alert("Modo inválido. Redirigiendo...");
        window.location.href = "menu.html";
        return;
    }

    // En modo CPU y ONLINE ocultamos al jugador 2
    if (modo === "cpu" || modo === "pvp") {
        document.querySelector(".player2Title")?.remove();
        document.querySelector(".infoPlayer2")?.remove();
        document.querySelector(".main")?.classList.add("solo-player");
    }

    // Volver al menú con tecla "b"
    document.addEventListener("keydown", e => {
        if (e.key === "b") {
            window.location.href = "menu.html";
        }
    });

    // Obtener perfil del usuario
    async function obtenerIdUsuario() {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/perfil", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("No se pudo obtener el perfil");
            const usuario = await res.json();
            localStorage.setItem("usuario", JSON.stringify(usuario));
            return usuario.id;
        } catch (error) {
            console.error("Error al obtener ID de usuario:", error);
            return null;
        }
    }

    // Cargar inventario de personajes
    async function cargarInventario() {
        seleccionContainer.innerHTML = "<p>Cargando personajes...</p>";
        try {
            const res = await fetch("http://127.0.0.1:8000/api/inventario", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Inventario no cargado");

            const personajes = await res.json();
            if (personajes.length === 0) {
                seleccionContainer.innerHTML = "<p>No tienes personajes disponibles.</p>";
                return;
            }

            // Render personajes
            seleccionContainer.innerHTML = "";
            personajes.forEach((p, i) => {
                const div = document.createElement("div");
                div.classList.add("character");
                div.dataset.id = p.carta_id;
                div.innerHTML = `<img src="${p.imagen_url}" alt="${p.nombre}">`;
                if (personajesBloqueados.includes(p.carta_id)) {
                    div.classList.add("bloqueado");
                }
                seleccionContainer.appendChild(div);
            });

            const characters = document.querySelectorAll(".character");

            // Actualizar selección visible
            function updateSelection() {
                characters.forEach((c, i) => {
                    c.classList.toggle("selected", i === selectedIndex);
                });

                const selected = personajes[selectedIndex];
                const preview = jugadorActual === 1
                    ? document.querySelector(".pickPhoto_player1")
                    : document.querySelector(".pickPhoto_player2");

                if (preview && selected) {
                    preview.innerHTML = `<img src="${selected.imagen_url}" alt="${selected.nombre}">`;
                }
            }

            // Limpiar duplicados del listener
            if (handleKeydown) {
                document.removeEventListener("keydown", handleKeydown);
            }

            // Listener de teclado
            handleKeydown = (e) => {
                const cols = 8;

                if (e.key === "ArrowRight" || e.key === "d" && selectedIndex < characters.length - 1) {
                    selectedIndex++;
                } else if (e.key === "ArrowLeft" || e.key === "a" && selectedIndex > 0) {
                    selectedIndex--;
                // NO FUNCIONAN BIEN LAS FLECHAS DE ARRIBA Y ABAJO
               /*  } else if (e.key === "ArrowDown" && selectedIndex + cols < characters.length) {
                    selectedIndex += cols;
                } else if (e.key === "ArrowUp" && selectedIndex - cols >= 0) {
                    selectedIndex -= cols; */
                } else if (e.key === "Enter") {
                    const selected = personajes[selectedIndex];
                    if (
                        !selected ||
                        personajesSeleccionados.includes(selected.carta_id) ||
                        personajesBloqueados.includes(selected.carta_id)
                    ) return;

                    if (personajesSeleccionados.length < 3) {
                        personajesSeleccionados.push(selected.carta_id);

                        // Añadir a los slots visuales
                        const slotSelector = jugadorActual === 1
                            ? [".firstPick_player1", ".secondPick_player1", ".thirdPick_player1"]
                            : [".firstPick_player2", ".secondPick_player2", ".thirdPick_player2"];

                        const slot = slotSelector.map(s => document.querySelector(s)).find(el => el.innerHTML.trim() === "");
                        if (slot) slot.innerHTML = `<p>${selected.nombre}</p>`;

                        // Marcar personaje como bloqueado si J1
                        if (jugadorActual === 1) {
                            personajesBloqueados.push(selected.carta_id);
                            characters[selectedIndex].classList.add("bloqueado");
                        }
                    }

                    // Si J1 ya eligió 3 → pasar automáticamente a J2
                    if (personajesSeleccionados.length === 3 && modo === "local" && jugadorActual === 1) {
                        setTimeout(confirmarSeleccion, 200);
                    }
                } else if (
                    ((modo === "local" && e.key === "c" && jugadorActual === 2) || modo === "cpu" || modo === "pvp")
                    && e.key === "c" && personajesSeleccionados.length === 3) {
                    confirmarSeleccion();
                }

                updateSelection();
            };

            document.addEventListener("keydown", handleKeydown);
            updateSelection();
        } catch (err) {
            console.error("Error:", err);
            seleccionContainer.innerHTML = "<p>Error al cargar inventario.</p>";
        }
    }

    // Confirmar la selección de personajes
    async function confirmarSeleccion() {
        try {
            if (modo === "local") {
                if (jugadorActual === 1) {
                    localStorage.setItem("equipoJ1", JSON.stringify(personajesSeleccionados));
                    jugadorActual = 2;
                    personajesSeleccionados = [];
                    document.querySelector(".pickPhoto_player1").innerHTML = "";
                    await cargarInventario(); // recarga para J2
                } else {
                    localStorage.setItem("equipoJ2", JSON.stringify(personajesSeleccionados));
                    window.location.href = `Alfa.html?modo=local`;
                }

            } else if (modo === "pvp") {
                if (!sala) {
                    alert("Sala PvP no encontrada.");
                    return;
                }

                // ✅ Obtener ID del usuario
                const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
                let idJugador = usuarioGuardado?.id;

                if (!idJugador) {
                    idJugador = await obtenerIdUsuario();
                    if (!idJugador) {
                        alert("No se pudo obtener el ID del jugador.");
                        return;
                    }
                }

                // ✅ Guardar el equipo en localStorage con ID único
                localStorage.setItem(`equipo_${idJugador}`, JSON.stringify(personajesSeleccionados));

                console.log("📤 Enviando equipo PvP del jugador", idJugador, personajesSeleccionados);

                socket.emit("confirmar_equipo", {
                    sala,
                    idJugador,
                    equipo: personajesSeleccionados
                });

                let redirigido = false;

                socket.on("equipo_confirmado", ({ equipoRival }) => {
                    if (redirigido) return;
                    redirigido = true;

                    console.log("✅ Equipo rival recibido:", equipoRival);
                    localStorage.setItem("equipoRival", JSON.stringify(equipoRival));

                    window.location.href = `Alfa.html?modo=pvp&sala=${sala}`;
                });

            } else {
                // Modo CPU
                const res = await fetch("http://127.0.0.1:8000/api/equipo/seleccionar", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ cartas: personajesSeleccionados })
                });
                if (!res.ok) throw new Error("Error al seleccionar equipo");
                window.location.href = `Alfa.html?modo=cpu`;
            }

        } catch (err) {
            console.error("Error al confirmar equipo:", err);
            alert("Error al confirmar equipo.");
        }
    }

    // Cargar nombre del usuario para mostrarlo en vez de "PLAYER 1"
    async function cargarNombreJugador1() {
        try {
            const res = await fetch("http://localhost:8000/api/perfil", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Error al cargar perfil");

            const data = await res.json();
            const nombreJugador1 = data.nombre;

            const tituloJ1 = document.querySelector(".player1Title h2");
            if (tituloJ1) {
                tituloJ1.textContent = nombreJugador1;
            }

        } catch (error) {
            console.error("Error al obtener nombre jugador 1:", error);
        }
    }

    // Iniciar
    await cargarInventario();
    await cargarNombreJugador1();

    // Guardar estado de música
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('ReinicioMusica', 'true');
        sessionStorage.setItem('tiempoMusica', audio?.currentTime || 0);
    });
});

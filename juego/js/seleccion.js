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
            const confirmar = confirm("¿Volver al menú principal?");
            if (confirmar) {
                window.location.href = "menu.html";
            } else {
                return;
            }
        }
    });

    // Obtener perfil del usuario
    async function obtenerIdUsuario() {
        try {
            const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
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

    // Cargar inventario de personajes + sección de personajes
    async function cargarInventario() {
        seleccionContainer.innerHTML = "<p>Cargando personajes...</p>";
        try {
            const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/inventario", {
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

            // Función para encontrar índice válido más cercano en una fila específica
            function findClosestIndexInRow(targetRow, col) {
                const cols = 9; // Número fijo de columnas por fila
                const total = characters.length; // Total de personajes disponibles
                const start = targetRow * cols; // Índice inicial de la fila objetivo
                const end = Math.min(start + cols, total); // Índice final (no exceder total)

                // Si existe personaje justo en la columna 'col' de esa fila
                if (start + col < end) {
                    return start + col; // Retorna ese índice
                } else {
                    // Si no existe en esa columna (ej. fila incompleta), buscar el personaje más cercano a la derecha
                    for (let c = cols - 1; c >= 0; c--) {
                        if (start + c < end) return start + c; // Retorna el último personaje válido de la fila
                    }
                }
                return -1; // No se encontró personaje válido en esa fila
            }

            // Si ya existe un manejador de teclado registrado, se elimina para evitar duplicados
            if (handleKeydown) {
                document.removeEventListener("keydown", handleKeydown);
            }

            // Manejador de eventos para navegación y selección con teclado
            handleKeydown = (e) => {
                const cols = 9; // Columnas definidas para la grid visible
                const total = characters.length; // Total personajes disponibles
                let row = Math.floor(selectedIndex / cols); // Fila actual (integer)
                let col = selectedIndex % cols; // Columna actual
                let newIndex = selectedIndex; // Índice nuevo tras navegación (inicialmente igual)

                switch (e.key) {
                    case "ArrowRight":
                    case "d":
                        if (selectedIndex < total - 1) {
                            // Si estamos en la última columna de la fila actual o índice modulo cols == 0
                            if (col === cols - 1 || (selectedIndex + 1) % cols === 0) {
                                // Intentamos movernos a la primera posición de la fila siguiente
                                let nextRow = row + 1;
                                if (nextRow * cols < total) {
                                    newIndex = findClosestIndexInRow(nextRow, 0);
                                }
                            } else {
                                // Sino, nos movemos simplemente a la derecha (siguiente índice)
                                newIndex = selectedIndex + 1;
                            }
                        }
                        break;

                    case "ArrowLeft":
                    case "a":
                        if (selectedIndex > 0) {
                            // Si estamos en la primera columna de la fila, ir a la última de la fila anterior
                            if (col === 0) {
                                let prevRow = row - 1;
                                if (prevRow >= 0) {
                                    let prevRowEnd = Math.min((prevRow + 1) * cols, total) - 1;
                                    newIndex = prevRowEnd;
                                }
                            } else {
                                // Sino, mover un índice a la izquierda
                                newIndex = selectedIndex - 1;
                            }
                        }
                        break;

                    case "ArrowDown": {
                        // Mover hacia abajo a la fila siguiente, en la misma columna si existe personaje
                        let nextRow = row + 1;
                        if (nextRow * cols < total) {
                            const candidate = findClosestIndexInRow(nextRow, col);
                            if (candidate !== -1) {
                                newIndex = candidate;
                            }
                        }
                        break;
                    }

                    case "ArrowUp": {
                        // Mover hacia arriba a la fila anterior, misma columna si existe personaje
                        let prevRow = row - 1;
                        if (prevRow >= 0) {
                            const candidate = findClosestIndexInRow(prevRow, col);
                            if (candidate !== -1) {
                                newIndex = candidate;
                            }
                        }
                        break;
                    }

                    case "e": {
                        // Seleccionar personaje actual (si no está seleccionado o bloqueado)
                        const selected = personajes[selectedIndex];
                        if (
                            !selected ||
                            personajesSeleccionados.includes(selected.carta_id) ||
                            personajesBloqueados.includes(selected.carta_id)
                        ) return;

                        if (personajesSeleccionados.length < 3) {
                            personajesSeleccionados.push(selected.carta_id);

                            // Slots de selección dependiendo de qué jugador está seleccionando
                            const slotSelector = jugadorActual === 1
                                ? [".firstPick_player1", ".secondPick_player1", ".thirdPick_player1"]
                                : [".firstPick_player2", ".secondPick_player2", ".thirdPick_player2"];

                            // Encontrar el primer slot vacío y poner el nombre del personaje
                            const slot = slotSelector.map(s => document.querySelector(s)).find(el => el.innerHTML.trim() === "");
                            if (slot) slot.innerHTML = `<p>${selected.nombre}</p>`;

                            // Si es jugador 1, bloqueamos el personaje para que no pueda ser seleccionado por jugador 2
                            if (jugadorActual === 1) {
                                personajesBloqueados.push(selected.carta_id);
                                characters[selectedIndex].classList.add("bloqueado");
                            }
                        }
                        break;
                    }

                    case "c":
                        // Confirmar selección con "c" solo si hay al menos un personaje seleccionado
                        if (personajesSeleccionados.length >= 1 && personajesSeleccionados.length <= 3) {
                            const confirmar = confirm("¿Confirmar selección?");
                            if (confirmar) {
                                confirmarSeleccion();
                            }
                        }
                        break;

                    case "x": {
                        // Deseleccionar personaje actual si está seleccionado
                        const selected = personajes[selectedIndex];
                        if (!selected) return;

                        const index = personajesSeleccionados.indexOf(selected.carta_id);
                        if (index !== -1) {
                            personajesSeleccionados.splice(index, 1);

                            // Vaciar el slot correspondiente al personaje deseleccionado
                            const slotSelector = jugadorActual === 1
                                ? [".firstPick_player1", ".secondPick_player1", ".thirdPick_player1"]
                                : [".firstPick_player2", ".secondPick_player2", ".thirdPick_player2"];

                            const slot = slotSelector[index];
                            if (slot) document.querySelector(slot).innerHTML = "";

                            // Si es jugador 1, desbloquear personaje para que pueda ser seleccionado por el otro jugador
                            if (jugadorActual === 1) {
                                const bloqueadoIndex = personajesBloqueados.indexOf(selected.carta_id);
                                if (bloqueadoIndex !== -1) {
                                    personajesBloqueados.splice(bloqueadoIndex, 1);
                                    characters[selectedIndex].classList.remove("bloqueado");
                                }
                            }
                        }
                        break;
                    }
                }

                // Si el índice seleccionado cambió, actualizar selección y hacer scroll suave para visibilidad
                if (newIndex !== selectedIndex) {
                    selectedIndex = newIndex;
                    updateSelection();
                    characters[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            };

            // Registrar el evento keydown con el manejador definido
            document.addEventListener("keydown", handleKeydown);

            // Actualizar la selección inicial
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

                // Obtener ID del usuario
                const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
                let idJugador = usuarioGuardado?.id;

                if (!idJugador) {
                    idJugador = await obtenerIdUsuario();
                    if (!idJugador) {
                        alert("No se pudo obtener el ID del jugador.");
                        return;
                    }
                }

                // Guardar el equipo en localStorage con ID único
                localStorage.setItem(`equipo_${idJugador}`, JSON.stringify(personajesSeleccionados));

                console.log("Enviando equipo PvP del jugador", idJugador, personajesSeleccionados);

                socket.emit("confirmar_equipo", {
                    sala,
                    idJugador,
                    equipo: personajesSeleccionados
                });

                let redirigido = false;

                socket.on("equipo_confirmado", ({ equipoRival }) => {
                    if (redirigido) return;
                    redirigido = true;

                    console.log("Equipo rival recibido:", equipoRival);
                    localStorage.setItem("equipoRival", JSON.stringify(equipoRival));

                    window.location.href = `Alfa.html?modo=pvp&sala=${sala}`;
                });

            } else {
                // Modo CPU
                const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/equipo/seleccionar", {
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
            const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
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

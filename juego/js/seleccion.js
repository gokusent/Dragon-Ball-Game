import socket from "./socket.js";

document.addEventListener("DOMContentLoaded", async () => {
    const seleccionContainer = document.getElementById("seleccion-container");
    const confirmarBtn = document.getElementById("confirmarBtn");
    const token = localStorage.getItem("token");

    const urlParams = new URLSearchParams(window.location.search);
    const modo = urlParams.get("modo") || "cpu";
    const sala = urlParams.get("sala");

    let personajesSeleccionados = [];
    let jugadorActual = 1;

    if (!token) {
        alert("Debes iniciar sesión para seleccionar personajes.");
        window.location.href = "index.html";
        return;
    }

    if (!["cpu", "local", "pvp"].includes(modo)) {
        alert("Modo inválido. Redirigiendo...");
        window.location.href = "menu.html";
        return;
    }

    console.log("Modo:", modo);

    async function obtenerIdUsuario() {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/perfil", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
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
                confirmarBtn.disabled = true;
                return;
            }

            seleccionContainer.innerHTML = "";

            personajes.forEach(personaje => {
                const card = document.createElement("div");
                card.classList.add("personaje-card");
                card.innerHTML = `
                    <img src="${personaje.imagen_url}" alt="${personaje.nombre}">
                    <h2>${personaje.nombre}</h2>
                    <p>Rareza: <span class="${personaje.rareza.toLowerCase()}">${personaje.rareza}</span></p>
                `;
                card.addEventListener("click", () => {
                    if (personajesSeleccionados.includes(personaje.carta_id)) {
                        personajesSeleccionados = personajesSeleccionados.filter(id => id !== personaje.carta_id);
                        card.classList.remove("seleccionado");
                    } else if (personajesSeleccionados.length < 3) {
                        personajesSeleccionados.push(personaje.carta_id);
                        card.classList.add("seleccionado");
                    } else {
                        alert("Máximo 3 personajes.");
                    }
                    confirmarBtn.disabled = personajesSeleccionados.length === 0;
                });

                seleccionContainer.appendChild(card);
            });

        } catch (err) {
            console.error("Error:", err);
            seleccionContainer.innerHTML = "<p>Error al cargar inventario.</p>";
        }
    }

    confirmarBtn.addEventListener("click", async () => {
        if (personajesSeleccionados.length === 0) {
            alert("Selecciona al menos un personaje.");
            return;
        }

        try {
            if (modo === "local") {
                if (jugadorActual === 1) {
                    localStorage.setItem("equipoJ1", JSON.stringify(personajesSeleccionados));
                    jugadorActual = 2;
                    personajesSeleccionados = [];
                    cargarInventario();
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
            console.error("Error:", err);
            alert("Error al confirmar equipo.");
        }
    });

    cargarInventario();

    window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('ReinicioMusica', 'true');
    sessionStorage.setItem('tiempoMusica', audio.currentTime);
});
});

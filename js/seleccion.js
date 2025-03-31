document.addEventListener("DOMContentLoaded", async () => {
    const seleccionContainer = document.getElementById("seleccion-container");
    const confirmarBtn = document.getElementById("confirmarBtn");
    const tituloSeleccion = document.createElement("titulo-seleccion");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión para seleccionar personajes.");
        window.location.href = "index.html";
        return;
    }

    let personajesSeleccionados = [];
    let jugadorActual = 1; // 🔄 Controlamos quién está eligiendo (1 = J1, 2 = J2)

    const urlParams = new URLSearchParams(window.location.search);
    let modo = urlParams.get("modo") || "cpu"; 
    const modosValidos = ["cpu", "local", "pvp"];

    if (!modosValidos.includes(modo)) {
        alert("Modo de juego no válido. Redirigiendo a la página principal.");
        window.location.href = "menu.html";
        return;
    }

    console.log("Modo de juego seleccionado en selección:", modo);

    async function cargarInventario() {
        seleccionContainer.innerHTML = "<p>Cargando personajes...</p>";
        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/inventario", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error("Error al obtener el inventario");

            const personajes = await respuesta.json();
            console.log("Personajes obtenidos de la API:", personajes);

            if (personajes.length === 0) {
                seleccionContainer.innerHTML = "<p>No tienes personajes disponibles.</p>";
                confirmarBtn.disabled = true;
                return;
            }

            seleccionContainer.innerHTML = "";
            tituloSeleccion.innerText = `Jugador ${jugadorActual}: Elige tus personajes`;

            personajes.forEach(personaje => {
                let card = document.createElement("div");
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
                    } else {
                        if (personajesSeleccionados.length < 5) {
                            personajesSeleccionados.push(personaje.carta_id);
                            card.classList.add("seleccionado");
                        } else {
                            alert("Ya tienes el máximo de 5 personajes seleccionados. Deselecciona uno para continuar.");
                        }
                    }
                    console.log(`Jugador ${jugadorActual} seleccionó:`, personajesSeleccionados);
                    confirmarBtn.disabled = personajesSeleccionados.length === 0;
                });

                seleccionContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Error:", error);
            seleccionContainer.innerHTML = "<p>No pudimos cargar tus personajes en este momento. Intenta más tarde.</p>";
        }
    }

    confirmarBtn.addEventListener("click", async () => {
        if (personajesSeleccionados.length === 0) {
            alert("Selecciona al menos un personaje antes de continuar.");
            return;
        }

        if (modo === "local") {
            if (jugadorActual === 1) {
                // Guardamos selección de J1 y pasamos a J2
                localStorage.setItem("equipoJ1", JSON.stringify(personajesSeleccionados));
                jugadorActual = 2;
                personajesSeleccionados = []; // Reiniciamos la selección para J2
                cargarInventario();
            } else {
                // Guardamos selección de J2 y vamos al combate
                localStorage.setItem("equipoJ2", JSON.stringify(personajesSeleccionados));
                window.location.href = `Alfa.html?modo=local`;
            }
        } else {
            // Modo CPU o PVP → Enviamos el equipo al servidor
            try {
                const respuesta = await fetch("http://127.0.0.1:8000/api/equipo/seleccionar", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ cartas: personajesSeleccionados })
                });

                if (!respuesta.ok) throw new Error("Error al seleccionar el equipo");

                alert(`Seleccionaste ${personajesSeleccionados.length} personajes.`);
                window.location.href = `Alfa.html?modo=${modo}`; 

            } catch (error) {
                console.error("Error:", error);
                alert("Hubo un error al seleccionar tu equipo. Inténtalo nuevamente.");
            }
        }
    });

    cargarInventario();
});

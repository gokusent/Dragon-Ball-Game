// ==== ELEMENTOS DEL DOM ====
const menuContainer = document.querySelector(".menu");
const menuItems = document.querySelectorAll(".menu-item");
const mainSection = document.querySelector(".main");
let selectedIndex = 0;
let submenuVisible = false;
let submenuIndex = 0;

// ==== Fondos y Descripciones ====
const backgrounds = ["bg1", "bg2", "bg3", "bg4", "bg5"];

const descripciones = [
    "Elige entre distintos modos de duelo: CPU, local u online.",
    "Gira el gachapon y consigue nuevos personajes.",
    "Consulta y administra tus personajes.",
    "Visualiza tu perfil, estadísticas y configuraciones.",
    "Entra al foro y comparte ideas o dudas con otros jugadores."
];

// ==== Sonidos ====
const moveSound = new Audio("../sounds/move.mp3");
const selectSound = new Audio("../sounds/select.mp3");

// ==== Actualizar selección principal ====
function updateSelection() {
    menuItems.forEach((item, index) => {
        item.classList.toggle("selected", index === selectedIndex);
    });

    // Cambiar fondo
    mainSection.className = "main " + backgrounds[selectedIndex];

    // Cambiar descripción
    const infoText = document.querySelector(".info h3");
    infoText.textContent = descripciones[selectedIndex];

    // Hacer scroll a la opción visible
    menuItems[selectedIndex].scrollIntoView({ behavior: "smooth", block: "center" });
}

// ==== Movimiento entre opciones ====
function moveSelection(direction) {
    let prevIndex = selectedIndex;
    if (direction === "down" && selectedIndex < menuItems.length - 1) {
        selectedIndex++;
    } else if (direction === "up" && selectedIndex > 0) {
        selectedIndex--;
    }

    if (prevIndex !== selectedIndex) {
        moveSound.currentTime = 0;
        moveSound.play();
    }

    updateSelection();
}

// ==== Submenú (duelo) ====
function updateSubmenuSelection(opciones) {
    opciones.forEach((opt, i) => {
        opt.style.textDecoration = i === submenuIndex ? 'underline' : 'none';
    });
}

// ==== Navegación por teclado ====
document.addEventListener("keydown", (e) => {
    const selectedItem = menuItems[selectedIndex];
    const titleText = selectedItem.querySelector('h2').innerText;
    const subMenu = selectedItem.querySelector('.duelo_opc');

    // Si el submenú está visible (solo para "Duelo")
    if (submenuVisible && titleText === 'Duelo') {
        const opciones = subMenu.querySelectorAll('h3');

        // Navegación submenu duelo
        if (e.key === 'ArrowUp' || e.key === 'w') {
            e.preventDefault();
            if (submenuIndex > 0) submenuIndex--;
            moveSound.currentTime = 0; moveSound.play();
            updateSubmenuSelection(opciones);
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            e.preventDefault();
            if (submenuIndex < opciones.length - 1) submenuIndex++;
            moveSound.currentTime = 0; moveSound.play();
            updateSubmenuSelection(opciones);
            // ENTER en menú principal
        } else if (e.key === 'Enter') {
            selectSound.currentTime = 0; selectSound.play();
            const selectedOption = opciones[submenuIndex].innerText;

            if (selectedOption === '1vs1') {
                showLoadingAndRedirect('seleccion.html?modo=local');
            } else if (selectedOption === 'CPU') {
                showLoadingAndRedirect('seleccion.html?modo=cpu');
            } else if (selectedOption === 'Online') {
                // Nuevo flujo: crear/unir sala PVP ANTES de redirigir a sala.html?sala=...
                createOrJoinPvpRoomAndRedirect();
            }
        } else if (e.key === 'Escape') {
            // Ocultar submenú y volver al menú principal
            subMenu.style.display = 'none';
            submenuVisible = false;
            submenuIndex = 0;
        }

        return; // Evita que el resto del código se ejecute
    }

    // Navegación menú principal
    if (e.key === "ArrowDown" || e.key === "s") moveSelection("down");
    if (e.key === "ArrowUp" || e.key === "w") moveSelection("up");

    // ENTER en menú principal
    if (e.key === "Enter") {
        selectSound.currentTime = 0; selectSound.play();

        if (titleText === 'Duelo') {
            // Mostrar submenú
            subMenu.style.display = 'block';
            submenuVisible = true;
            submenuIndex = 0;
            const opciones = subMenu.querySelectorAll('h3');
            updateSubmenuSelection(opciones);
        } else {
            const url = selectedItem.getAttribute('data-url');
            if (url) {
                showLoadingAndRedirect(url);
            }
        }
    }
});

// ==== Función para crear o unirse a sala PvP ANTES de redirigir ====
async function createOrJoinPvpRoomAndRedirect() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';

    const token = localStorage.getItem("token");
    try {
        // Obtener perfil del jugador
        const perfilRes = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!perfilRes.ok) throw new Error("No se pudo obtener el perfil");

        const perfil = await perfilRes.json();
        const jugador_id = perfil.id;

        // Buscar salas disponibles
        const disponiblesRes = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/salas-disponibles", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!disponiblesRes.ok) throw new Error("Error al obtener salas disponibles");

        const salas = await disponiblesRes.json();

        let nombreSala;

        if (salas.length > 0) {
            // Hay una sala disponible: unirse como jugador2
            const sala = salas[0];
            nombreSala = sala.sala;

            const joinRes = await fetch(`https://dragon-ball-game-hx4q.onrender.com/api/salas/${sala.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ jugador2_id: jugador_id })
            });

            if (!joinRes.ok) throw new Error("Error al unirse a la sala existente");

            const data = await joinRes.json();

            // Guarda antes de cambiar a la página de la sala
            localStorage.setItem("jugador_id", jugador_id);
            localStorage.setItem("salaPvp", nombreSala);

            console.log(`Te uniste a la sala de ${data.jugador1_id} (ID: ${data.id})`);

            // Redirigir a sala con la sala ya asignada en la URL
            window.location.href = `sala.html?sala=${encodeURIComponent(data.sala)}`;
        } else {
            // No hay salas → crear una nueva
            nombreSala = `pvp_${Date.now()}`;

            const crearRes = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/crear-sala", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sala: nombreSala }) // Quitamos jugador1_id
            });

            if (!crearRes.ok) throw new Error("Error al crear la sala");

            const crearData = await crearRes.json();

            console.log("Sala creada:", crearData);

            // Guarda antes de cambiar a la página de la sala
            localStorage.setItem("jugador_id", jugador_id);
            localStorage.setItem("salaPvp", nombreSala);
            localStorage.setItem("salaId", crearData.id);

            // Redirigir a sala con la sala creada en la URL
            window.location.href = `sala.html?sala=${encodeURIComponent(nombreSala)}`;

        }
    } catch (error) {
        console.error("Error en el flujo de PvP:", error);
        alert("⚠ Error en PvP. Revisa conexión o login.");
        overlay.style.display = 'none';
    }
}

// ==== Mostrar overlay de carga y redirigir para CPU y LOCAL ====
function showLoadingAndRedirect(url) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';

    const token = localStorage.getItem("token");
    const urlObj = new URL(url, window.location.origin);
    const modo = urlObj.searchParams.get("modo");

    setTimeout(() => {
        // Redirección a modos CPU o LOCAL
        if (modo === "cpu" || modo === "local") {
            window.location.href = url;
        } else {
            // Redirección normal (para otros links que no sean PvP)
            window.location.href = url;
        }
    }, 2000);
}

// ==== Inicialización ====
const audio = document.getElementById('musicaFondo');
const paginaActual = window.paginaActual || 'index';

// Reproducir música de fondo
window.addEventListener('DOMContentLoaded', () => {
    const tiempo = sessionStorage.getItem('tiempoMusica');
    const reinicio = sessionStorage.getItem('ReinicioMusica') === 'true';

    // Si estamos en las páginas index, menu o perfil y se ha marcado reinicio, reiniciar música
    if (['index', 'menu', 'perfil'].includes(paginaActual) && reinicio) {
        audio.currentTime = 0;
        sessionStorage.removeItem('ReinicioMusica');
    } else if (tiempo) {
        audio.currentTime = parseFloat(tiempo);
    }

    audio.volume = 0.5;
    audio.play().catch(err => {
        console.error("Error al reproducir la música:", err);
    });
});

// Guardar el tiempo de música al salir de la página
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('tiempoMusica', audio.currentTime);
});

// Escuchar el evento de carga para actualizar la selección y ocultar el overlay
window.addEventListener("load", () => {
    updateSelection();
    menuItems[selectedIndex].scrollIntoView({ behavior: "instant", block: "center" });
    document.getElementById('loadingOverlay').style.display = 'none';
});

updateSelection(); // Asegura selección inicial

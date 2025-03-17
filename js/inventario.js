document.addEventListener("DOMContentLoaded", () => {
    const inventarioContainer = document.getElementById("inventario-container");

    // Usamos la misma clave que el sistema gacha
    let inventario = localStorage.getItem("personajesObtenidos") ? JSON.parse(localStorage.getItem("personajesObtenidos")) : [];

    if (inventario.length === 0) {
        inventarioContainer.innerHTML = "<p>No tienes personajes en tu inventario.</p>";
        return;
    }

    inventario.forEach(personaje => {
        let card = document.createElement("div");
        card.classList.add("personaje-card");
        card.innerHTML = `
            <img src="cartas/${personaje.imagen}" alt="${personaje.nombre}">
            <h2>${personaje.nombre}</h2>
            <p>Rareza: <span class="${personaje.rareza.toLowerCase()}">${personaje.rareza}</span></p>
            <button onclick="seleccionarPersonaje('${personaje.nombre}')">Seleccionar</button>
        `;
        inventarioContainer.appendChild(card);
    });
});

// Función para seleccionar un personaje y guardarlo para el combate
function seleccionarPersonaje(nombre) {
    let inventario = JSON.parse(localStorage.getItem("personajesObtenidos"));
    let personajeSeleccionado = inventario.find(p => p.nombre === nombre);

    if (personajeSeleccionado) {
        localStorage.setItem("personajeSeleccionado", JSON.stringify(personajeSeleccionado));
        alert(`Seleccionaste a ${personajeSeleccionado.nombre}`);
    }
}

document.getElementById("borrarInventario").addEventListener("click", () => {
    if (confirm("¿Seguro que quieres eliminar todo tu inventario? Esta acción no se puede deshacer.")) {
        localStorage.removeItem("personajesObtenidos"); // Usamos la clave correcta
        alert("Inventario eliminado.");
        location.reload();
    }
});

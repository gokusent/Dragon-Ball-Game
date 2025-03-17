document.addEventListener("DOMContentLoaded", () => {
    const seleccionContainer = document.getElementById("seleccion-container");
    const confirmarBtn = document.getElementById("confirmarBtn");

    let inventario = localStorage.getItem("personajesObtenidos") ? JSON.parse(localStorage.getItem("personajesObtenidos")) : [];

    if (inventario.length === 0) {
        seleccionContainer.innerHTML = "<p>No tienes personajes disponibles.</p>";
        confirmarBtn.disabled = true;
        return;
    }

    let personajesSeleccionados = [];

    inventario.forEach(personaje => {
        let card = document.createElement("div");
        card.classList.add("personaje-card");
        card.innerHTML = `
            <img src="cartas/${personaje.imagen}" alt="${personaje.nombre}">
            <h2>${personaje.nombre}</h2>
            <p>Rareza: <span class="${personaje.rareza.toLowerCase()}">${personaje.rareza}</span></p>
        `;

        card.addEventListener("click", () => {
            if (personajesSeleccionados.includes(personaje)) {
                // Si ya está seleccionado, lo deseleccionamos
                personajesSeleccionados = personajesSeleccionados.filter(p => p.nombre !== personaje.nombre);
                card.classList.remove("seleccionado");
            } else {
                // Si no está seleccionado y hay menos de 5, lo agregamos
                if (personajesSeleccionados.length < 5) {
                    personajesSeleccionados.push(personaje);
                    card.classList.add("seleccionado");
                } else {
                    alert("Solo puedes seleccionar hasta 5 personajes.");
                }
            }
            confirmarBtn.disabled = personajesSeleccionados.length === 0;
        });

        seleccionContainer.appendChild(card);
    });

    confirmarBtn.addEventListener("click", () => {
        if (personajesSeleccionados.length > 0) {
            localStorage.setItem("personajesSeleccionados", JSON.stringify(personajesSeleccionados));
            alert(`Seleccionaste ${personajesSeleccionados.length} personajes`);
            window.location.href = "Alfa.html"; // Redirige al combate
        }
    });
});

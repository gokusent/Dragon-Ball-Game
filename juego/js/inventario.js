document.addEventListener("DOMContentLoaded", async () => {
    const inventarioContainer = document.getElementById("inventario-container");
    const modal = document.getElementById("personaje-modal");
    const modalContent = document.getElementById("modal-content");
    const cerrarBtn = document.getElementById("cerrar-modal");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión para ver tu inventario.");
        window.location.href = "index.html";
        return;
    }

    // Abrir modal con detalles
    function mostrarDetalles(personaje) {
        fetch(`http://127.0.0.1:8000/api/cartas/${personaje.carta_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error("No se pudieron obtener los detalles");
            return res.json();
        })
        .then(personaje => {
                modalContent.innerHTML = `
                    <img src="${personaje.imagen_url2 || 'cartas/default.png'}" class="imagen-grande" alt="${personaje.nombre}">
                    <h2>${personaje.nombre}</h2>
                    <p><strong>Rareza:</strong> <span class="${personaje.rareza?.toLowerCase() || 'común'}">${personaje.rareza ?? 'Común'}</span></p>
                    <p><strong>Vida:</strong> ${personaje.vida}</p>
                    <p><strong>Daño:</strong> ${personaje.daño ?? 'Desconocido'}</p>
                    <p><strong>Energía:</strong> ${personaje.energia ?? 'Desconocida'}</p>
                    <p><strong>Técnica Especial:</strong> ${personaje.tecnica_especial ?? 'Desconocida'}</p>
                    <p><strong>Daño Técnica Especial:</strong> ${personaje.daño_especial ?? 'Sin descripción'}</p>
                    <p><strong>Cantidad en inventario:</strong> ${personaje.cantidad}</p>
                `;
                modal.style.display = "block";
                
            modalContent.innerHTML += `<button id="cerrar-modal">Cerrar</button>`;
            modalContent.querySelector("#cerrar-modal").addEventListener("click", () => {
                modal.style.display = "none";
            });

            modal.style.display = "block";
        })
        .catch(err => {
            console.error("Error al obtener detalles del personaje:", err);
            modalContent.innerHTML = `<p>Error al cargar los detalles.</p>`;
            modal.style.display = "block";
        });
    }    

    async function cargarInventario() {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/inventario", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al obtener el inventario");

            const personajes = await res.json();

            if (personajes.length === 0) {
                inventarioContainer.innerHTML = "<p>No tienes personajes en tu inventario.</p>";
                return;
            }

            inventarioContainer.innerHTML = "";

            personajes.forEach(personaje => {
                const card = document.createElement("div");
                card.classList.add("personaje-card");
                card.innerHTML = `
                    <img src="${personaje.imagen_url || 'cartas/default.png'}" alt="${personaje.nombre}">
                    <h2>${personaje.nombre}</h2>
                    <p>Rareza: <span class="${personaje.rareza?.toLowerCase() || 'común'}">${personaje.rareza ?? 'Común'}</span></p>
                    <p>Cantidad: ${personaje.cantidad}</p>
                `;

                card.addEventListener("click", () => mostrarDetalles(personaje));

                inventarioContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Error:", error);
            inventarioContainer.innerHTML = "<p>Hubo un error al cargar el inventario.</p>";
        }
    }

    cargarInventario();
});

document.addEventListener("DOMContentLoaded", async () => {
    const inventarioContainer = document.getElementById("inventario-container");
    const borrarInventarioBtn = document.getElementById("borrarInventario");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión para ver tu inventario.");
        window.location.href = "index.html";
        return;
    }

    // 📌 Función para cargar el inventario desde la API
    async function cargarInventario() {
        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/inventario", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error("Error al obtener el inventario");

            const personajes = await respuesta.json();

            // Si el inventario está vacío
            if (personajes.length === 0) {
                inventarioContainer.innerHTML = "<p>No tienes personajes en tu inventario.</p>";
                return;
            }

            // Limpiar el contenedor antes de renderizar
            inventarioContainer.innerHTML = "";

            // Mostrar cada personaje con su cantidad
            personajes.forEach(personaje => {
                let card = document.createElement("div");
                card.classList.add("personaje-card");
                card.innerHTML = `
                    <img src="${personaje.imagen_url ? personaje.imagen_url : 'cartas/default.png'}" alt="${personaje.nombre}">
                    <h2>${personaje.nombre}</h2>
                    <p>Rareza: <span class="${personaje.rareza ? personaje.rareza.toLowerCase() : 'común'}">${personaje.rareza ?? 'Común'}</span></p>
                    <p>Cantidad: ${personaje.cantidad}</p>
                `;
                inventarioContainer.appendChild(card);
            });
            

        } catch (error) {
            console.error("Error:", error);
            inventarioContainer.innerHTML = "<p>Hubo un error al cargar el inventario.</p>";
        }
    }

    // 📌 Función para borrar el inventario en la API
    borrarInventarioBtn.addEventListener("click", async () => {
        if (!confirm("¿Seguro que quieres eliminar todo tu inventario? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/inventario/borrar", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!respuesta.ok) throw new Error("Error al borrar el inventario");

            alert("Inventario eliminado.");
            cargarInventario(); // Recargar la lista
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo eliminar el inventario.");
        }
    });

    cargarInventario(); // 📌 Cargar el inventario al iniciar
});

document.addEventListener("DOMContentLoaded", async () => {
    const seleccionContainer = document.getElementById("seleccion-container");
    const confirmarBtn = document.getElementById("confirmarBtn");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión para seleccionar personajes.");
        window.location.href = "index.html";
        return;
    }

    let personajesSeleccionados = [];

    async function cargarInventario() {
        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/inventario", {
                headers: { "Authorization": `Bearer ${token}` }
            });
    
            if (!respuesta.ok) throw new Error("Error al obtener el inventario");
    
            const personajes = await respuesta.json();
    
            console.log("Personajes obtenidos de la API:", personajes); // ✅ Verificar qué llega de la API
    
            if (personajes.length === 0) {
                seleccionContainer.innerHTML = "<p>No tienes personajes disponibles.</p>";
                confirmarBtn.disabled = true;
                return;
            }
    
            seleccionContainer.innerHTML = "";
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
                            alert("Solo puedes seleccionar hasta 5 personajes.");
                        }
                    }
                    console.log("IDs seleccionados:", personajesSeleccionados); // ✅ Revisar qué se está guardando
                    confirmarBtn.disabled = personajesSeleccionados.length === 0;
                });
            
                seleccionContainer.appendChild(card);
            });            
    
        } catch (error) {
            console.error("Error:", error);
            seleccionContainer.innerHTML = "<p>Hubo un error al cargar el inventario.</p>";
        }
    }
    

    confirmarBtn.addEventListener("click", async () => {
        console.log("Personajes seleccionados (Objeto Completo):", personajesSeleccionados);
    
        const token = localStorage.getItem("token");
    
        // ✅ Si personajesSeleccionados ya es un array de IDs, no se necesita `.map()`
        const idsCartas = Array.isArray(personajesSeleccionados) ? personajesSeleccionados : personajesSeleccionados.map(p => p.carta_id);
    
        console.log("IDs de cartas enviados:", idsCartas); // ✅ Ahora debe mostrar los valores correctos
    
        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/equipo/seleccionar", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ cartas: idsCartas }) // ✅ Se envía correctamente
            });
    
            const datos = await respuesta.text();
            console.log("Respuesta del servidor (sin procesar):", datos);
    
            const respuestaJson = JSON.parse(datos);
            console.log("Respuesta del servidor (JSON procesado):", respuestaJson);
    
            if (!respuesta.ok) {
                throw new Error(respuestaJson.error || "Error al seleccionar el equipo");
            }
    
            alert(`Seleccionaste ${personajesSeleccionados.length} personajes.`);
            window.location.href = "Alfa.html";
    
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });
    
    cargarInventario();
});

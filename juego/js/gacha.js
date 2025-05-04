document.addEventListener("DOMContentLoaded", () => {
    const botonTirar = document.getElementById("tirarGacha");
    const resultadoDiv = document.getElementById("resultado");
    const monedasSpan = document.getElementById("monedas");

    // Obtener el token del usuario autenticado
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión para jugar al gacha.");
        window.location.href = "index.html";
        return;
    }

    // Obtener monedas del backend
    async function actualizarMonedas() {
        const respuesta = await fetch("http://127.0.0.1:8000/api/perfil", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const datos = await respuesta.json();
        monedasSpan.innerText = datos.monedas ?? 100; // Si no hay monedas en la BD, empieza con 100
    }

    actualizarMonedas(); // Cargar las monedas al iniciar

    botonTirar.addEventListener("click", async () => {
        let monedas = parseInt(monedasSpan.innerText);

        if (monedas < 10) {
            alert("No tienes suficientes monedas.");
            return;
        }

        // Restar 10 monedas y actualizar en el servidor
        const actualizarMonedas = await fetch("http://127.0.0.1:8000/api/monedas/gastar", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ cantidad: 10 })
        });

        if (!actualizarMonedas.ok) {
            alert("Error al actualizar monedas.");
            return;
        }

        monedas -= 10;
        monedasSpan.innerText = monedas;

        // Mostrar animación de invocación
        resultadoDiv.innerHTML = "<p>Tirando...</p>";
        resultadoDiv.classList.add("animacion");

        setTimeout(async () => {
            // Obtener un personaje desde la API
            const respuesta = await fetch("http://127.0.0.1:8000/api/gacha", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const personajeObtenido = await respuesta.json();
            resultadoDiv.classList.remove("animacion");

            if (!personajeObtenido || !personajeObtenido.nombre) {
                resultadoDiv.innerHTML = `<p>Error al obtener personaje.</p>`;
                return;
            }

            resultadoDiv.innerHTML = `<p>¡Obtuviste a ${personajeObtenido.nombre} (${personajeObtenido.rareza})!</p>
                                      <img src="${personajeObtenido.imagen_url}" alt="${personajeObtenido.nombre}" style="width: 150px;">`;

        }, 2000);
    });
});

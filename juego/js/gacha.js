document.addEventListener("DOMContentLoaded", () => {
    const botonTirar = document.getElementById("tirarGacha");
    const resultadoDiv = document.getElementById("resultado");
    const monedasSpan = document.getElementById("monedas");
    const ruleta = document.getElementById("ruleta"); // contenedor del carrusel

    const token = localStorage.getItem("token");

    // Redirige si no hay token
    if (!token) {
        alert("Debes iniciar sesión para jugar al gacha.");
        window.location.href = "index.html";
        return;
    }

    // Cargar las monedas del usuario
    async function actualizarMonedas() {
        try {
            const respuesta = await fetch("http://127.0.0.1:8000/api/perfil", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const datos = await respuesta.json();
            monedasSpan.innerText = datos.monedas ?? 100;
        } catch (e) {
            console.error("Error al obtener monedas:", e);
            monedasSpan.innerText = "100";
        }
    }

    actualizarMonedas();

    botonTirar.addEventListener("click", async () => {
        let monedas = parseInt(monedasSpan.innerText);

        if (monedas < 10) {
            alert("No tienes suficientes monedas.");
            return;
        }

        botonTirar.disabled = true;
        resultadoDiv.innerHTML = "";
        ruleta.innerHTML = "";

        // Paso 1: Obtener carta real desde backend
        let cartaReal;
        try {
            const res = await fetch("http://127.0.0.1:8000/api/gacha", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al obtener carta.");
            cartaReal = await res.json();
        } catch (e) {
            alert(e.message);
            botonTirar.disabled = false;
            return;
        }

        // Paso 2: Obtener todas las cartas disponibles para generar aleatorias
        let cartasDisponibles;
        try {
            const resCartas = await fetch("http://127.0.0.1:8000/api/cartas", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!resCartas.ok) throw new Error("No se pudieron cargar cartas.");
            cartasDisponibles = await resCartas.json();
        } catch (e) {
            alert(e.message);
            botonTirar.disabled = false;
            return;
        }

        // Paso 3: Generar carrusel con cartas aleatorias y carta real en el centro visual
        const totalCartas = 15; // cantidad total en el carrusel
        const cartaRealIndex = Math.floor(totalCartas / 2); // centro del carrusel

        const carril = document.createElement("div");
        carril.className = "ruleta-carril";

        for (let i = 0; i < totalCartas; i++) {
            let carta;
            if (i === cartaRealIndex) {
                carta = cartaReal; // insertamos la carta real en el centro
            } else {
                carta = cartasDisponibles[Math.floor(Math.random() * cartasDisponibles.length)];
            }

            const img = document.createElement("img");
            img.src = carta.imagen_url;
            img.alt = carta.nombre;
            carril.appendChild(img);
        }

        ruleta.appendChild(carril);

        // Paso 4: Calcular desplazamiento exacto para centrar la carta real
        const cartaWidth = 150 + 10; // ancho imagen + margen
        const desplazamientoFinal = cartaWidth * cartaRealIndex;

        // Aplicar animación dinámica
        carril.style.animation = `girar 2s ease-out forwards`;
        carril.style.setProperty("--distancia-final", `-${desplazamientoFinal}px`);

        // Paso 5: Restar monedas en backend
        try {
            const resGasto = await fetch("http://127.0.0.1:8000/api/monedas/gastar", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ cantidad: 10 })
            });
            if (!resGasto.ok) throw new Error("No se pudieron gastar las monedas.");
            monedas -= 10;
            monedasSpan.innerText = monedas;
        } catch (e) {
            alert(e.message);
            botonTirar.disabled = false;
            return;
        }

        // Paso 6: Mostrar resultado luego de la animación
        setTimeout(() => {
            ruleta.innerHTML = ""; // limpia el carrusel

            // Estilo visual para rarezas
            let claseRareza = "rareza-comun";
            if (cartaReal.rareza === "Raro") claseRareza = "rareza-raro";
            if (cartaReal.rareza === "Épico") claseRareza = "rareza-epica";
            if (cartaReal.rareza === "Legendario") claseRareza = "rareza-legendaria";

            resultadoDiv.innerHTML = `
                <p>¡Obtuviste a <span class="${claseRareza}">${cartaReal.nombre}</span> (${cartaReal.rareza})!</p>
                <img src="${cartaReal.imagen_url}" alt="${cartaReal.nombre}" />
            `;

            botonTirar.disabled = false;
        }, 2000); // tiempo igual al de la animación
    });
});

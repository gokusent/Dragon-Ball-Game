document.addEventListener("DOMContentLoaded", () => {
    const botonTirar = document.getElementById("tirarGacha");
    const resultadoDiv = document.getElementById("resultado");
    const monedasSpan = document.getElementById("monedas");
    const ruleta = document.getElementById("ruleta");

    const token = localStorage.getItem("token");

    // Redirige si no hay token
    if (!token) {
        alert("Debes iniciar sesión para jugar al gacha.");
        window.location.href = "index.html";
        return;
    }

    // Obtener y mostrar monedas actuales del perfil
    async function actualizarMonedas() {
        try {
            const respuesta = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
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
        ruleta.style.display = "flex"; // muestra la ruleta
        resultadoDiv.innerHTML = "";
        ruleta.innerHTML = ""; // limpia ruleta anterior 


        // Paso 1: Obtener carta real desde el backend
        let cartaReal;
        try {
            const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/gacha", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Error al obtener carta.");
            cartaReal = await res.json();
        } catch (e) {
            alert(e.message);
            botonTirar.disabled = false;
            return;
        }

        // Paso 2: Obtener todas las cartas para generar las aleatorias
        let cartasDisponibles;
        try {
            const resCartas = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/cartas", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!resCartas.ok) throw new Error("No se pudieron cargar cartas.");
            cartasDisponibles = await resCartas.json();
        } catch (e) {
            alert(e.message);
            botonTirar.disabled = false;
            return;
        }

        // Paso 3: Generar carrusel
        const totalCartas = 20; // total de imágenes en la ruleta
        const cartaRealIndex = totalCartas - 2; // penúltima carta será la real
        const carril = document.createElement("div");
        carril.className = "ruleta-carril";

        for (let i = 0; i < totalCartas; i++) {
            let carta = (i === cartaRealIndex)
                ? cartaReal
                : cartasDisponibles[Math.floor(Math.random() * cartasDisponibles.length)];

            const img = document.createElement("img");
            img.src = carta.imagen_url;
            img.alt = carta.nombre;
            carril.appendChild(img);
        }

        ruleta.appendChild(carril);

        // Paso 4: Calcular desplazamiento para centrar la penúltima carta
        // Esperamos un ciclo para que las imágenes se hayan renderizado y tengan dimensiones
        requestAnimationFrame(() => {
            const imagenes = carril.querySelectorAll("img");
            if (!imagenes.length) return;

            const cartaRealImg = imagenes[cartaRealIndex];
            const cartaWidth = cartaRealImg.offsetWidth + parseFloat(getComputedStyle(cartaRealImg).marginLeft) + parseFloat(getComputedStyle(cartaRealImg).marginRight);
            const contenedorWidth = ruleta.offsetWidth;

            const desplazamientoFinal = (cartaWidth * cartaRealIndex) + (cartaWidth / 2) - (contenedorWidth / 2);

            carril.style.animation = `girar 4s ease-out forwards`;
            carril.style.setProperty("--distancia-final", `-${desplazamientoFinal}px`);
        });


        // Paso 5: Gastar monedas en el backend
        try {
            const resGasto = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/monedas/gastar", {
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

        // Paso 6: Mostrar resultado tras animación
        setTimeout(() => {
            ruleta.innerHTML = ""; // limpia la ruleta
            ruleta.style.display = "none"; // AHORA la ocultas, después de la animación

            let claseRareza = "rareza-comun";
            if (cartaReal.rareza === "Raro") claseRareza = "rareza-raro";
            if (cartaReal.rareza === "Épico") claseRareza = "rareza-epica";
            if (cartaReal.rareza === "Legendario") claseRareza = "rareza-legendaria";

            resultadoDiv.innerHTML = `
                <p>¡Obtuviste a <span class="${claseRareza}">${cartaReal.nombre}</span> (${cartaReal.rareza})!</p>
                <img src="${cartaReal.imagen_url}" alt="${cartaReal.nombre}" />
            `;

            botonTirar.disabled = false;
        }, 4000); // tiempo igual al de la animación
    });

    // Música (si aplica)
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('ReinicioMusica', 'true');
        sessionStorage.setItem('tiempoMusica', audio?.currentTime || 0);
    });
});

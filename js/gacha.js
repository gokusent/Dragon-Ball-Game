document.addEventListener("DOMContentLoaded", () => {
    const botonTirar = document.getElementById("tirarGacha");
    const resultadoDiv = document.getElementById("resultado");
    const monedasSpan = document.getElementById("monedas");

    // Obtener monedas del localStorage o inicializar con 100
    let monedas = localStorage.getItem("monedas") ? parseInt(localStorage.getItem("monedas")) : 100;
    monedasSpan.innerText = monedas;

    const personajes = [
        { nombre: "Goku", rareza: "Común", probabilidad: 40, vida: 100, daño: 20, energia: 30, tecnicaEspecial: "Kamehameha", dañoEspecial: 50, imagen: "Goku.webp" },
        { nombre: "Vegeta", rareza: "Raro", probabilidad: 25, vida: 110, daño: 25, energia: 35, tecnicaEspecial: "Final Flash", dañoEspecial: 60, imagen: "Vegeta.webp" },
        { nombre: "Gohan", rareza: "Épico", probabilidad: 15, vida: 120, daño: 30, energia: 40, tecnicaEspecial: "Masenko", dañoEspecial: 70, imagen: "Gohan.png" },
        { nombre: "Piccolo", rareza: "Épico", probabilidad: 15, vida: 120, daño: 35, energia: 20, tecnicaEspecial: "Makankosappo", dañoEspecial: 80, imagen: "Piccolo.png" },
        { nombre: "Future Trunks", rareza: "Legendario", probabilidad: 5, vida: 130, daño: 40, energia: 50, tecnicaEspecial: "Burning Attack", dañoEspecial: 90, imagen: "Future Trunks.png" },
    ];

    function invocarPersonaje() {
        let random = Math.random() * 100;
        let acumulado = 0;

        for (let personaje of personajes) {
            acumulado += personaje.probabilidad;
            if (random < acumulado) {
                return personaje;
            }
        }
    }

    botonTirar.addEventListener("click", () => {
        /*if (monedas < 10) {
            alert("No tienes suficientes monedas.");
            return;
        }*/

        monedas -= 10;
        localStorage.setItem("monedas", monedas);
        monedasSpan.innerText = monedas;

        // Animación de la invocación
        resultadoDiv.innerHTML = "<p>Tirando...</p>";
        resultadoDiv.classList.add("animacion");

        setTimeout(() => {
            const personajeObtenido = invocarPersonaje();
            resultadoDiv.classList.remove("animacion");
            resultadoDiv.innerHTML = `<p>¡Obtuviste a ${personajeObtenido.nombre} (${personajeObtenido.rareza})!</p>
                                      <img src="cartas/${personajeObtenido.imagen}" alt="${personajeObtenido.nombre}" style="width: 150px;">`;

            // Guardar el personaje en localStorage sin duplicados
            let personajesObtenidos = JSON.parse(localStorage.getItem("personajesObtenidos")) || [];
            
            // Evitar que se guarden duplicados
            if (!personajesObtenidos.some(p => p.nombre === personajeObtenido.nombre)) {
                personajesObtenidos.push(personajeObtenido);
                localStorage.setItem("personajesObtenidos", JSON.stringify(personajesObtenidos));
            } else {
                alert(`¡Ya tienes a ${personajeObtenido.nombre}! Se convirtió en monedas extra.`);
                monedas += 5; // Dar monedas extra por duplicado
                localStorage.setItem("monedas", monedas);
                monedasSpan.innerText = monedas;
            }
        }, 2000);
    });
});

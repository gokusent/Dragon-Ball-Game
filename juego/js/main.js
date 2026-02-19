// Importación de las clases y funciones necesarias
import { Carta } from './clases.js'; // Importa la clase Carta para crear cartas con atributos
import { colocar } from './funciones.js'; // Importa la función para colocar las cartas en el tablero
import { toggleMusic } from './music.js'; // Importa la función para alternar la música

// **Obtener el modo de juego de la URL**
const urlParams = new URLSearchParams(window.location.search);
const modoJuego = urlParams.get("modo") || "cpu";  // Por defecto CPU
console.log("Modo de juego:", modoJuego);


// 1. Conectar el socket
const socket = io("wss://dragon-ball-game-1-ppgv.onrender.com");

/* Código comentado para ser implementado en el futuro adecuadamente.
// 2. Obtener el ID del jugador y la sala desde localStorage
const jugadorId = localStorage.getItem("jugadorId");
const salaId = localStorage.getItem("salaPvp");

// 3. Esperar a que se conecte el socket
socket.on("connect", () => {
  console.log("Reconectado al servidor con ID:", socket.id);

  // 4. Verificar que haya datos para volver a unirse
  if (jugadorId && salaId) {
    console.log(`Reuniéndose a la sala ${salaId} como ${jugadorId}`);

    // 5. Emitir evento para volver a unirse a la sala PvP
    socket.emit("unirse_sala_pvp", {
      sala: salaId,
      jugadorId: jugadorId,
    });

    // 6. Emitir jugador_listo si corresponde
    socket.emit("jugador_listo", {
      sala: salaId,
      jugadorId: jugadorId,
    });
  } else {
    console.warn("No se encontraron datos de jugador o sala en localStorage");
  }
});

// 7. Aquí puedes agregar más listeners de combate:
socket.on("iniciar_turno", (data) => {
  console.log("Turno iniciado:", data);
  // Actualiza la UI según el jugador que deba jugar
});

*/

// Variables PvP activas
// Leer sala desde URL (seleccion.js redirige con ?sala=...) o localStorage como fallback
const _urlParamsSala = new URLSearchParams(window.location.search);
let salaId = _urlParamsSala.get("sala") || localStorage.getItem("salaPvp") || null;

// jugador_id: menu.js lo guarda como "jugador_id", también disponible en objeto "usuario"
const _usuarioGuardado = JSON.parse(localStorage.getItem("usuario") || "{}");
let jugadorID = _usuarioGuardado?.id || parseInt(localStorage.getItem("jugador_id")) || null;

// soyHost: sala.js solo lo guarda cuando es true, así que si no existe = false (eres jugador2)
let soyHost = localStorage.getItem("soyHost") === "true";
let soyJugador1 = soyHost; // Se confirma definitivamente al recibir estado_sala
let estadoSala = {};

console.log("[PvP Init] Sala:", salaId, "| JugadorID:", jugadorID, "| SoyHost:", soyHost);

const anuncioTurno = document.createElement('div');
anuncioTurno.classList.add('turno-anuncio');
document.body.appendChild(anuncioTurno);
let turno = 0; // 0: jugador1, 1: jugador2
let turnos = 0;

// Escuchar estado_sala para saber quién somos (jugador1 o jugador2)
socket.on("estado_sala", ({ jugador1, jugador2, soyHost: esHost, turno: turnoActual }) => {
    estadoSala.jugador1 = jugador1;
    estadoSala.jugador2 = jugador2;
    soyJugador1 = esHost; // El host siempre es jugador1
    if (turnoActual !== undefined) turno = turnoActual === "jugador1" ? 0 : 1;
    console.log("Soy jugador1:", soyJugador1, "| Mi ID:", jugadorID);
    actualizarBotones();
});

// Reconexión al servidor
socket.on("connect", () => {
    console.log("Conectado al servidor con ID:", socket.id);
    if (jugadorID && salaId) {
        socket.emit("unirse_sala_pvp", {
            sala: salaId,
            jugador_id: jugadorID,
            nombre: localStorage.getItem("nombreJugador") || "Jugador"
        });
    }
});
// Esperar a que el servidor indique el inicio y el turno inicial
socket.on("iniciar_partida", ({ turnoInicial, jugador1, jugador2 }) => {
    estadoSala.jugador1 = jugador1;
    estadoSala.jugador2 = jugador2;
    turno = turnoInicial;

    // Guardamos el ID local si no lo tenés ya
    // jugadorID = ... lo podés obtener antes o en otro evento

    anunciarTurno();
    actualizarBotones();
});


// Función para mostrar un mensaje que indique el turno actual
function anunciarTurno() {
    anuncioTurno.innerText = turno === 0 ? "Turno de J1" : "Turno de J2"; // Cambia el mensaje dependiendo del turno
    anuncioTurno.classList.add('turno-activo'); // Activa la animación visual del anuncio

    // Eliminar la animación después de 1.5 segundos
    setTimeout(() => {
        anuncioTurno.classList.remove('turno-activo');
    }, 1500);
}

// Cambiar de turno
function cambiarTurno(esPvp) {
    turno = turno === 0 ? 1 : 0;

    turnos++; // Aumentamos el contador de turnos

    if (esPvp) {
        const turnoString = turno === 0 ? "jugador1" : "jugador2" //Convertir a string
        socket.emit("cambiar_turno", turnoString);
    }

    actualizarBotones();
    anunciarTurno();

    if (turno === 1 && modoJuego === "cpu") {
        setTimeout(turnoIA, 700);
    }
}

// Escuchar cambio de turno desde el servidor
socket.on("cambiar_turno", (nuevoTurno) => {
    turno = nuevoTurno === "jugador1" ? 0 : 1;
    anunciarTurno();
    actualizarBotones();
});

// Escuchar ataque recibido desde el servidor
socket.on("ataque_recibido", ({ jugador: jugadorAfectado, ataque, vidaRestante }) => {
    console.log(`[ATAQUE RECIBIDO] Jugador afectado: ${jugadorAfectado}, Soy jugador1: ${soyJugador1}`);
    
    // ✅ FIX: Determinar quién recibe el daño según quién SOY yo
    let equipoAfectado, objetivo;
    
    if (jugadorAfectado === "jugador1") {
        // El servidor dice que jugador1 recibe daño
        if (soyJugador1) {
            // Yo soy jugador1, así que MIS cartas reciben daño
            equipoAfectado = jugador.cartas;
            objetivo = "jugador";
        } else {
            // Yo soy jugador2, así que las cartas del RIVAL reciben daño
            equipoAfectado = rival.cartas;
            objetivo = "rival";
        }
    } else {
        // El servidor dice que jugador2 recibe daño
        if (soyJugador1) {
            // Yo soy jugador1, así que las cartas del RIVAL reciben daño
            equipoAfectado = rival.cartas;
            objetivo = "rival";
        } else {
            // Yo soy jugador2, así que MIS cartas reciben daño
            equipoAfectado = jugador.cartas;
            objetivo = "jugador";
        }
    }

    // Encontrar carta afectada
    const defensorIndex = equipoAfectado.findIndex(carta => carta.vida > 0);
    if (defensorIndex === -1) return;

    const defensor = equipoAfectado[defensorIndex];
    defensor.vida = Math.max(0, defensor.vida - ataque.daño);

    console.log(`[DAÑO APLICADO] ${defensor.nombre} ahora tiene ${defensor.vida} vida`);

    // Actualizar UI
    actualizarBarraVida(objetivo, defensorIndex);
    mostrarDaño(objetivo, defensorIndex, ataque.daño);
    actualizarEstadoCartas();
    animarRecibirDaño(objetivo, defensorIndex);

    if (verificarFinDeJuego()) return;
});

// Escuchar aumento de energía desde el servidor
socket.on("energia_aumentada", ({ jugador: jugadorQueAumento }) => {
    console.log(`[ENERGÍA AUMENTADA] Jugador: ${jugadorQueAumento}, Soy jugador1: ${soyJugador1}`);
    
    // Determinar de quién es la carta que aumentó energía
    let equipoAfectado, contenedorClase;
    
    if (jugadorQueAumento === "jugador1") {
        if (soyJugador1) {
            equipoAfectado = jugador.cartas;
            contenedorClase = "jugador";
        } else {
            equipoAfectado = rival.cartas;
            contenedorClase = "rival";
        }
    } else {
        if (soyJugador1) {
            equipoAfectado = rival.cartas;
            contenedorClase = "rival";
        } else {
            equipoAfectado = jugador.cartas;
            contenedorClase = "jugador";
        }
    }
    
    // Encontrar la carta activa
    const cartaIndex = equipoAfectado.findIndex(carta => carta.vida > 0);
    if (cartaIndex === -1) return;
    
    const carta = equipoAfectado[cartaIndex];
    
    // Aumentar energía (igual que hace aumentarEnergia localmente)
    carta.habilidad += carta.energia;
    if (carta.habilidad > 100) carta.habilidad = 100;
    if (carta.habilidad === 100) carta.habilidadLista = true;
    
    console.log(`[ENERGÍA] ${carta.nombre} ahora tiene ${carta.habilidad} de energía (contenedor: ${contenedorClase})`);
    
    // Actualizar UI - SELECTOR CORRECTO
    const cartaContainer = document.querySelectorAll(`.contenedor-${contenedorClase} .carta-container`)[cartaIndex];
    if (!cartaContainer) {
        console.error(`No se encontró el contenedor para ${contenedorClase}`);
        return;
    }
    
    // Actualizar texto
    const habilidadElement = cartaContainer.querySelector('.habilidad-texto');
    if (habilidadElement) {
        habilidadElement.innerText = `Habilidad: ${carta.habilidad}`;
        console.log(`Texto actualizado: Habilidad ${carta.habilidad}`);
    } else {
        console.error('No se encontró .habilidad-texto');
    }
    
    // Actualizar AMBAS barras (contenedor y barra interna)
    const barraHabilidadContainer = cartaContainer.querySelector('.barra-habilidad');
    const habilidadBarra = cartaContainer.querySelector('.barra-habilidad .habilidad');

    if (barraHabilidadContainer && habilidadBarra) {
        barraHabilidadContainer.style.width = `${carta.habilidad}%`;
        habilidadBarra.style.width = `${carta.habilidad}%`;
        console.log(`Barra actualizada: ${carta.habilidad}%`);
    } else {
        console.error('No se encontró la barra de habilidad');
    }
    
    // Animar
    const cartaElemento = cartaContainer.querySelector('.carta');
    if (cartaElemento) {
        cartaElemento.classList.add('cargando-energia', 'resplandor');
        setTimeout(() => {
            cartaElemento.classList.remove('cargando-energia', 'resplandor');
        }, 1500);
    }
    
    actualizarEstadoCartas();
});

// Escuchar ataque especial recibido desde el servidor
socket.on("ataque_especial_recibido", ({ jugador: jugadorAfectado, ataque, vidaRestante }) => {
    console.log(`[ATAQUE ESPECIAL RECIBIDO] Jugador afectado: ${jugadorAfectado}, Ataque: ${ataque.nombre}`);
    
    // Determinar quién recibe el daño
    let equipoAfectado, objetivo;
    
    if (jugadorAfectado === "jugador1") {
        if (soyJugador1) {
            equipoAfectado = jugador.cartas;
            objetivo = "jugador";
        } else {
            equipoAfectado = rival.cartas;
            objetivo = "rival";
        }
    } else {
        if (soyJugador1) {
            equipoAfectado = rival.cartas;
            objetivo = "rival";
        } else {
            equipoAfectado = jugador.cartas;
            objetivo = "jugador";
        }
    }

    // Encontrar carta afectada
    const defensorIndex = equipoAfectado.findIndex(carta => carta.vida > 0);
    if (defensorIndex === -1) return;

    const defensor = equipoAfectado[defensorIndex];
    defensor.vida = Math.max(0, defensor.vida - ataque.daño);

    console.log(`[DAÑO ESPECIAL APLICADO] ${defensor.nombre} ahora tiene ${defensor.vida} vida`);

    // Actualizar UI
    actualizarBarraVida(objetivo, defensorIndex);
    mostrarDaño(objetivo, defensorIndex, ataque.daño);
    actualizarEstadoCartas();
    animarRecibirDañoEspecial(defensorIndex, objetivo === "jugador");

    if (verificarFinDeJuego()) return;
});

/**
 * Función que hace que la IA tome decisiones en su turno
 */
function turnoIA() {
    if (modoJuego !== "cpu") return;  // Asegurar que la IA solo actúe en su turno

    console.log("La IA está actuando...");

    setTimeout(() => {
        const rivalCarta = rival.cartas.find(carta => carta.vida > 0);  // 🔍 Buscar la carta con vida
        const jugadorCarta = jugador.cartas.find(carta => carta.vida > 0);

        if (!rivalCarta || !jugadorCarta) return;  // Evitar errores si no hay cartas disponibles

        if (rivalCarta.habilidad === 100) {
            console.log("La IA usa su técnica especial.");
            activarTecnicaEspecial(rival);
        } else if (Math.random() < 0.5) {
            console.log("La IA decide atacar.");
            atacar(rival, jugador);
        } else {
            console.log("La IA aumenta su energía.");
            aumentarEnergia(rival);
        }
    }, 2000);
}

/**
 * Actualiza los botones según el turno.
 */
function actualizarBotones() {
    const contenedoresJugador = document.querySelectorAll('.contenedor-jugador .carta-container');
    const contenedoresRival = document.querySelectorAll('.contenedor-rival .carta-container');

    if (modoJuego === "pvp") {
    const esMiTurno = (turno === 0 && soyJugador1) || (turno === 1 && !soyJugador1);

    // FIX: En PvP, TUS cartas SIEMPRE están en contenedor-jugador (izquierda)
    const miContenedor = contenedoresJugador;
    const rivalContenedor = contenedoresRival;

    // Actualizar MIS botones
    miContenedor.forEach((container, index) => {
        const carta = jugador.cartas[index];
        if (!carta) return;
        
        container.querySelectorAll('button').forEach(boton => {
            if (boton.classList.contains('btn-ataque-especial')) {
                // Botón de habilidad: solo si tengo 100 de energía Y es mi turno
                boton.disabled = !esMiTurno || carta.habilidad < 100;
            } else {
                // Otros botones: solo si es mi turno
                boton.disabled = !esMiTurno;
            }
            boton.style.opacity = boton.disabled ? "0.5" : "1";
        });
    });

    // Siempre deshabilitar botones del RIVAL
    rivalContenedor.forEach(container => {
        container.querySelectorAll('button').forEach(boton => {
            boton.disabled = true;
            boton.style.opacity = "0.5";
        });
    });
    } else {
        // Modo local/cpu: comportamiento original
        contenedoresRival.forEach(container => {
            container.querySelectorAll('button').forEach(boton => {
                boton.disabled = turno === 0;
                boton.style.opacity = boton.disabled ? "0.5" : "1";
            });
        });

        contenedoresJugador.forEach(container => {
            container.querySelectorAll('button').forEach(boton => {
                boton.disabled = turno === 1;
                boton.style.opacity = boton.disabled ? "0.5" : "1";
            });
        });
    }
}

/**
 * Espera a que el contenido de la página esté completamente cargado antes de ejecutar el código.
 */
document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('ReinicioMusica', 'true');
        sessionStorage.setItem('tiempoMusica', audio.currentTime);
    });

    /**
     * Botón para activar o desactivar la música.
     * @type {HTMLElement | null}
     */
    const toggleMusicBtn = document.getElementById("toggleMusicBtn");

    // Verificar si el botón de música existe en el DOM
    if (!toggleMusicBtn) {
        console.log("No se encontró el botón de música."); // Mensaje de error si no se encuentra el botón
        return;
    }

    /**
     * Agrega un evento de clic al botón de música para alternar la música cuando se presione.
     */
    toggleMusicBtn.addEventListener("click", () => {
        console.log("toggleMusic llamado.");
        toggleMusic(); // Llama a la función de alternancia de música
        window.toggleMusic(); // Llama a la misma función desde el objeto global 'window' (dependiendo de la implementación)
    });
});

// **Obtener el token del usuario**
const token = localStorage.getItem("token");

if (!token) {
    alert("Debes iniciar sesión para jugar.");
    window.location.href = "../index.html";
}

// **Definir los mazos del jugador y del rival**
const jugador = { cartas: [] };
const rival = { cartas: [] };

async function cargarEquipo() {
    try {
        console.log("Modo de juego:", modoJuego);  // Verifica el modo de juego

        // **Modo Local: Cada jugador elige su equipo**
        if (modoJuego === "local") {
            const equipoJ1 = JSON.parse(localStorage.getItem("equipoJ1")) || [];
            const equipoJ2 = JSON.parse(localStorage.getItem("equipoJ2")) || [];

            if (equipoJ1.length === 0 || equipoJ2.length === 0) {
                alert("Error al cargar los equipos. Volviendo a la selección.");
                window.location.href = "seleccion.html?modo=local";
                return;
            }

            console.log("Equipo Jugador 1:", equipoJ1);
            console.log("Equipo Jugador 2:", equipoJ2);

            // **Cargar personajes de ambos jugadores**
            await cargarCartasDesdeIDs(equipoJ1, jugador);
            await cargarCartasDesdeIDs(equipoJ2, rival);

        } else if (modoJuego === "pvp" || modoJuego === "cpu") {
            // **Modo PVP y CPU: Cargar desde la API**
            if (modoJuego === "pvp") {
                // Limpiar equipos anteriores al iniciar el modo PvP
                localStorage.removeItem("equipoJ1");
                localStorage.removeItem("equipoJ2");

                const token = localStorage.getItem("authToken");

                // Obtener el ID del jugador actual
                let usuario = JSON.parse(localStorage.getItem("usuario"));
                let idJugador = usuario?.id;

                if (!idJugador && token) {
                    try {
                        const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error("No se pudo obtener el perfil");
                        usuario = await res.json();
                        idJugador = usuario.id;
                        localStorage.setItem("usuario", JSON.stringify(usuario));
                    } catch (error) {
                        console.error("Error al obtener ID del jugador:", error);
                        alert("No se pudo obtener el perfil del jugador.");
                        window.location.href = "seleccion.html?modo=pvp";
                        return;
                    }
                }

                const equipoPropio = JSON.parse(localStorage.getItem(`equipo_${idJugador}`)) || [];
                const equipoRival = JSON.parse(localStorage.getItem("equipoRival")) || [];

                console.log("=== DEBUG CARGA DE EQUIPOS PVP ===");
                console.log("ID Jugador:", idJugador);
                console.log("Soy Jugador1:", soyJugador1);
                console.log("Equipo propio (IDs):", equipoPropio);
                console.log("Equipo rival (IDs):", equipoRival);
                console.log("===================================");

                if (equipoPropio.length === 0 || equipoRival.length === 0) {
                    alert("Faltan datos de los equipos.");
                    window.location.href = "seleccion.html?modo=pvp";
                    return;
                }

                console.log("Equipo propio:", equipoPropio);
                console.log("Equipo rival:", equipoRival);

                await cargarCartasDesdeIDs(equipoPropio, jugador);
                await cargarCartasDesdeIDs(equipoRival, rival);
                
                console.log("=== DESPUÉS DE CARGAR ===");
                console.log("Jugador cartas:", jugador.cartas.map(c => c.nombre));
                console.log("Rival cartas:", rival.cartas.map(c => c.nombre));
                console.log("==========================");
            } else if (modoJuego === "cpu") {
                // 🔹 **Modo CPU o PVP: Cargar desde la API**
                const respuesta = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/equipo", {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!respuesta.ok) throw new Error("Error al obtener los personajes seleccionados");

                const personajesJugador = await respuesta.json();
                console.log("Personajes obtenidos de la API:", personajesJugador);

                if (!personajesJugador.length) {
                    alert("No has seleccionado personajes. Volviendo a la selección.");
                    window.location.href = "seleccion.html";
                    return;
                }

                // **Asignamos los personajes al jugador**
                personajesJugador.forEach(personaje => {
                    const cartaJugador = new Carta(
                        personaje.nombre,
                        personaje.vida || 100,
                        personaje.daño || 20,
                        personaje.energia || 30,
                        personaje.tecnicaEspecial || "Ataque básico",
                        personaje.dañoEspecial !== null ? personaje.dañoEspecial : 50,
                        personaje.imagen_url || "cartas/default.jpg"
                    );
                    cartaJugador.vidaOriginal = personaje.vida || 100; // Guardar vida original
                    jugador.cartas.push(cartaJugador);
                });

                // 🔹 **El rival en modo CPU es Moro**
                const cartaRival = new Carta("Moro", 300, 30, 10, "Planetarian Absorbtion", 80, "../cartas/moroCarta.png");
                cartaRival.vidaOriginal = cartaRival.vida; // Guardar vida original
                rival.cartas.push(cartaRival);
            }
        }

        // **Colocar las cartas en el tapete**
        console.log("Cartas del jugador:", jugador.cartas);
        console.log("Cartas del rival:", rival.cartas);

        if (jugador.cartas.length > 0 && rival.cartas.length > 0) {
            const tapete = document.getElementById("tapete");
            colocar(jugador, rival, tapete);
            actualizarEstadoCartas(); // Asegura que las cartas activas se reflejen
        } else {
            alert("No se han cargado las cartas correctamente.");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un problema al cargar los personajes.");
    }
}

/**
 * **Función para cargar personajes por ID en modo Local**
 */
async function cargarCartasDesdeIDs(ids, destino) {
    try {
        const respuesta = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/cartas/obtener", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ids: ids })
        });

        if (!respuesta.ok) throw new Error("Error al obtener los personajes por ID");

        const personajes = await respuesta.json();
        personajes.forEach(personaje => {
            destino.cartas.push(new Carta(
                personaje.nombre,
                personaje.vida || 100,
                personaje.daño || 20,
                personaje.energia || 30,
                personaje.tecnica_especial || "Ataque básico",
                personaje.daño_especial !== null ? personaje.daño_especial : 50,
                personaje.imagen_url || "cartas/default.jpg"
            ));
        });

    } catch (error) {
        console.error("Error al cargar personajes por ID:", error);
    }
}

// **Cargar el equipo al iniciar la página**
cargarEquipo();


/**
 * Muestra el daño infligido a la carta del jugador o del rival.
 * @param {string} objetivo - "jugador" o "rival", indica a quién se le aplica el daño.
 * @param {number} index - Índice de la carta objetivo en el array de cartas.
 * @param {number} daño - Cantidad de daño a mostrar.
 */
function mostrarDaño(objetivo, index, daño) {
    // Determinar el contenedor del jugador o rival basado en el objetivo
    const contenedor = document.querySelector(
        objetivo === "jugador" ? ".contenedor-jugador" : ".contenedor-rival"
    );

    // Seleccionar todas las cartas dentro del contenedor
    const cartas = contenedor.querySelectorAll(".carta-container");

    // Verificar si el índice es válido
    if (!cartas[index]) {
        console.error(`Error: No se encontró la carta en ${objetivo} con índice ${index}`);
        return;
    }

    const cartaObjetivo = cartas[index];

    // Crear un div para mostrar el daño
    const dañoDiv = document.createElement("div");
    dañoDiv.classList.add("daño"); // Aplicamos la clase CSS para la animación
    dañoDiv.innerText = `-${daño}`; // Mostramos el daño en texto

    // Ajustar la posición dentro de la carta
    cartaObjetivo.style.position = "relative";
    dañoDiv.style.position = "absolute"; // Para que se superponga a la carta

    // Añadir el div de daño a la carta
    cartaObjetivo.appendChild(dañoDiv);

    // Eliminar la animación después de 1s
    setTimeout(() => {
        dañoDiv.remove();
    }, 1000);
}

function actualizarEstadoCartas() {
    const grupos = [
        { jugador: 'jugador', cartas: jugador.cartas },
        { jugador: 'rival', cartas: rival.cartas }
    ];

    grupos.forEach(({ jugador, cartas }) => {
        const contenedor = document.querySelector(`.contenedor-${jugador}`);
        if (!contenedor) return;
        const elementos = contenedor.querySelectorAll(".carta-container");

        // Buscar primera carta con vida
        let cartaActivaEncontrada = false;

        elementos.forEach((elemento, i) => {
            const carta = cartas[i];
            if (carta.vida > 0 && !cartaActivaEncontrada) {
                elemento.classList.remove("carta-inactiva");
                elemento.classList.add("carta-activa");
                cartaActivaEncontrada = true;
            } else {
                elemento.classList.remove("carta-activa");
                elemento.classList.add("carta-inactiva");
            }
        });
    });
}

/**
 * Anima un ataque de un jugador.
 * @param {string} atacante - "jugador" o "rival".
 * @param {number} atacanteIndex - Índice de la carta atacante.
 */
function animarAtaque(atacante, atacanteIndex) {
    // Determinar el contenedor del atacante (jugador o rival)
    const contenedor = document.querySelector(
        atacante === "jugador" ? ".contenedor-jugador" : ".contenedor-rival"
    );

    // Obtener todas las cartas dentro del contenedor
    const cartas = contenedor.querySelectorAll(".carta-container");

    // Verificar que el índice sea válido
    if (!cartas[atacanteIndex]) {
        console.error(`Error: No se encontró la carta en ${atacante} con índice ${atacanteIndex}`);
        return;
    }

    const cartaAtacante = cartas[atacanteIndex];

    // Aplicar animación de ataque
    cartaAtacante.classList.add("ataque");

    // Quitar la animación después de 300ms
    setTimeout(() => {
        cartaAtacante.classList.remove("ataque");
    }, 300);
}

/**
 * Anima la recepción de daño por parte del rival.
 * @param {string} defensor - "jugador" o "rival".
 * @param {number} defensorIndex - Índice de la carta defensora.
 */
function animarRecibirDaño(defensor, defensorIndex) {
    // Determinar el contenedor del defensor (jugador o rival)
    const contenedor = document.querySelector(
        defensor === "jugador" ? ".contenedor-jugador" : ".contenedor-rival"
    );

    // Obtener todas las cartas dentro del contenedor
    const cartas = contenedor.querySelectorAll(".carta-container");

    // Verificar que el índice sea válido
    if (!cartas[defensorIndex]) {
        console.error(`Error: No se encontró la carta en ${defensor} con índice ${defensorIndex}`);
        return;
    }

    const cartaDefensor = cartas[defensorIndex];

    // Aplicar animación de recibir daño
    cartaDefensor.classList.add("recibir-daño");

    // Quitar la animación después de 200ms
    setTimeout(() => {
        cartaDefensor.classList.remove("recibir-daño");
    }, 200);
}


/**
 * Anima la recepción de daño especial por parte del rival.
 * @param {number} rivalIndex - Índice de la carta del rival en el array de cartas.
 */
function animarRecibirDañoEspecial(atacadoIndex, esJugador) {
    // Determinar el contenedor del objetivo (jugador o rival)
    const contenedor = document.querySelector(
        esJugador ? ".contenedor-jugador" : ".contenedor-rival"
    );

    if (!contenedor) {
        console.error(`Error: No se encontró el contenedor para ${esJugador ? "jugador" : "rival"}`);
        return;
    }

    // Obtener todas las cartas dentro del contenedor
    const cartas = contenedor.querySelectorAll(".carta-container");

    // Validar el índice antes de aplicar la animación
    if (atacadoIndex < 0 || atacadoIndex >= cartas.length) {
        console.error(`Error: No se encontró la carta atacada en ${esJugador ? "jugador" : "rival"} con índice ${atacadoIndex}`);
        return;
    }

    // Seleccionar la carta atacada
    const cartaAtacada = cartas[atacadoIndex];

    // Aplicar la animación de daño especial
    cartaAtacada.classList.add("recibir-daño-especial");

    // Eliminar la animación después de 600ms
    setTimeout(() => {
        cartaAtacada.classList.remove("recibir-daño-especial");
    }, 600);
}

/**
 * Verifica si el juego ha terminado.
 * Si el juego termina, otorga monedas y deshabilita los botones.
 */
async function verificarFinDeJuego() {
    const jugadorDerrotado = jugador.cartas.every(carta => carta.vida <= 0);
    const rivalDerrotado = rival.cartas.every(carta => carta.vida <= 0);
    const cartaJugador = jugador.cartas.find(carta => carta.vida > 0) || jugador.cartas[0];
    const cartaRival = rival.cartas.find(carta => carta.vida > 0) || rival.cartas[0];

    const personajeGanador = rivalDerrotado ? cartaJugador.nombre : cartaRival.nombre;
    const vidaFinalGanador = rivalDerrotado ? cartaJugador.vida : cartaRival.vida;

    if (jugadorDerrotado || rivalDerrotado) {
        if (modoJuego === "local") {
            const ganador = jugadorDerrotado ? "Jugador 2" : "Jugador 1";
            const perdedor = jugadorDerrotado ? "Jugador 1" : "Jugador 2";

            setTimeout(() => {
                const mensajeFinJuego = document.createElement('div');
                mensajeFinJuego.classList.add('mensaje-fin-juego');
                mensajeFinJuego.innerHTML = `${ganador} ha ganado <br> ${perdedor} ha perdido`;
                document.body.appendChild(mensajeFinJuego);
            }, 1000);

        } else if (modoJuego === "cpu") {
            const ganador = rivalDerrotado ? "Jugador" : "Moro";
            const perdedor = rivalDerrotado ? "Moro" : "Jugador";

            const monedasGanadas = ganador === "Jugador" ? 5 : 1;
            modificarMonedas(monedasGanadas);

            // Definimos correctamente todas las variables necesarias
            const resultado = rivalDerrotado ? "victoria" : "derrota";
            const personaje = cartaJugador.nombre;
            const vidaFinal = cartaJugador.vida;
            turnos = turnos + 1; // Aumentamos el contador de turnos

            const resp = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            })

            if (!resp.ok) throw new Error("Error al obtener el perfil del usuario");
            const usuario = await resp.json();
            const usuario_id = usuario.id;

            if (usuario_id) {
                actualizarEstadisticas(
                    usuario_id,
                    resultado,
                    personaje,
                    vidaFinal,
                    turnos
                );
            }

            setTimeout(() => {
                const mensajeFinJuego = document.createElement('div');
                mensajeFinJuego.classList.add('mensaje-fin-juego');
                mensajeFinJuego.innerHTML = `${ganador} ha ganado <br> ${perdedor} ha perdido <br> +${monedasGanadas} monedas`;
                document.body.appendChild(mensajeFinJuego);

                setTimeout(() => {
                    document.querySelectorAll('.carta-container button').forEach(boton => {
                        boton.disabled = true;
                    });
                }, 1000);
            }, 1000);
        } /* Se ha comentado el modo PvP para evitar conflictos con la lógica actual. El modo PvP se puede implementar más adelante si es necesario.
        *else if (modoJuego === "pvp") {
            const ganador = rivalDerrotado ? "Jugador 1" : "Jugador 2";
            const perdedor = rivalDerrotado ? "Jugador 2" : "Jugador 1";
            const monedasGanadas = rivalDerrotado ? 5 : 1;
            modificarMonedas(monedasGanadas);
            const resultado = rivalDerrotado ? "victoria" : "derrota";
            const personaje = rivalDerrotado ? cartaJugador.nombre : cartaRival.nombre;
            const vidaFinal = rivalDerrotado ? cartaJugador.vida : cartaRival.vida; 
            turnos = turnos + 1; // Aumentamos el contador de turnos
            const user = JSON.parse(localStorage.getItem("usuario"));
            const usuario_id = user?.id;
            if (usuario_id) {
                actualizarEstadisticas(
                    usuario_id,
                    resultado,
                    personaje,
                    vidaFinal,
                    turnos
                );
            }
            setTimeout(() => {
                const mensajeFinJuego = document.createElement('div');
                mensajeFinJuego.classList.add('mensaje-fin-juego');
                mensajeFinJuego.innerHTML = `${ganador} ha ganado <br> ${perdedor} ha perdido <br> +${monedasGanadas} monedas`;
                document.body.appendChild(mensajeFinJuego);

                setTimeout(() => {
                    document.querySelectorAll('.carta-container button').forEach(boton => {
                        boton.disabled = true;
                    });
                }, 1000);
            }, 1000);
        }*/
        return true;
    }
    return false;
}

/**
 * Actualiza las monedas del jugador en la base de datos tras cada partida.
 * 
 * @param {number} usuario_id - ID del jugador.
 * @param {string} resultado - Resultado de la partida ("victoria" o "derrota").
 */
async function modificarMonedas(monedasGanadas) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/perfil", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No se pudo obtener el perfil");
        const perfil = await res.json();
        const id = perfil.id;

        // Obtener las monedas actuales del usuario
        console.log("ID del usuario:", id);
        console.log("Monedas ganadas:", monedasGanadas);
        const respuestaGet = await fetch(`https://dragon-ball-game-hx4q.onrender.com/api/usuario/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!respuestaGet.ok) throw new Error("Error al obtener los datos del usuario");

        const usuario = await respuestaGet.json();
        const monedasActuales = usuario.monedas || 0;
        const nuevasMonedas = monedasActuales + monedasGanadas;

        const resultado = monedasGanadas > 1 ? "victoria" : "derrota";

        const respuestaPut = await fetch("https://dragon-ball-game-hx4q.onrender.com/api/usuario/monedas", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: id,
                monedas: nuevasMonedas,
                resultado: resultado
            })
        });

        if (!respuestaPut.ok) throw new Error("Error al actualizar las monedas");

    } catch (error) {
        console.error("Error modificando monedas:", error);
    }
}

/**
 * Actualiza la barra de vida de una carta en el tablero.
 *
 * @param {string} tipo - "jugador" o "rival" para seleccionar el equipo.
 * @param {number} index - Índice de la carta dentro del equipo correspondiente.
 */
function actualizarBarraVida(tipo, index) {
    const equipo = tipo === "jugador" ? jugador.cartas : rival.cartas;
    const carta = document.querySelectorAll(`.contenedor-${tipo} .carta-container`)[index];

    if (!carta) return;

    const barraVida = carta.querySelector('.barra-vida .vida');
    const textoVida = carta.querySelector('p');

    const cartaDatos = equipo[index];
    const vidaMaxima = cartaDatos.vidaMaxima || 100;
    const vida = cartaDatos.vida;

    const porcentajeVida = Math.max(vida / vidaMaxima * 100, 0);

    if (barraVida) {
        barraVida.style.width = `${porcentajeVida}%`;
        if (vida <= 0) {
            barraVida.style.display = 'none';
        } else {
            barraVida.style.display = 'block';
        }
    }

    if (textoVida) {
        textoVida.innerText = `Vida: ${Math.max(vida, 0)}`;
    }
}

function actualizarBarraHabilidad(tipo, index) {
    const equipo = tipo === "jugador" ? jugador.cartas : rival.cartas;
    const carta = document.querySelectorAll(`.contenedor-${tipo} .carta-container`)[index];

    if (!carta) return;

    const barraHabilidad = carta.querySelector('.barra-habilidad .habilidad');
    const textoHabilidad = carta.querySelector('.habilidad-texto');

    const cartaDatos = equipo[index];
    const habilidadMaxima = cartaDatos.habilidadMaxima || 100;
    const habilidad = cartaDatos.habilidad;

    const porcentajeHabilidad = Math.max(habilidad / habilidadMaxima * 100, 0);

    if (barraHabilidad) {
        barraHabilidad.style.width = `${porcentajeHabilidad}%`;
        if (habilidad <= 0) {
            barraHabilidad.style.display = 'none';
        } else {
            barraHabilidad.style.display = 'block';
        }
    }

    if (textoHabilidad) {
        textoHabilidad.innerText = `Habilidad: ${Math.max(habilidad, 0)}`;
    }
}

/** 
 * Función para activar la técnica especial de un jugador.
 * @param {Object} jugadorActual - El jugador que está activando la técnica especial.
 * @param {number} turno - El turno actual (0 o 1).
 * @returns {void}
 * @throws {Error} Si no hay cartas activas o si la habilidad no está cargada al 100%.
 */
function activarTecnicaEspecial(jugadorActual, turno) {
    // Validar turno en PvP
    if (modoJuego === "pvp") {
        const esMiTurno = (turno === 0 && soyJugador1) || (turno === 1 && !soyJugador1);
        if (!esMiTurno) {
            console.log("No es tu turno.");
            return;
        }
    }
    
    // Determinar equipos según el modo
    let equipoAtacanteReal, equipoDefensor;
    
    if (modoJuego === "pvp") {
        equipoAtacanteReal = jugador.cartas;
        equipoDefensor = rival.cartas;
    } else {
        equipoAtacanteReal = turno === 0 ? jugador.cartas : rival.cartas;
        equipoDefensor = turno === 0 ? rival.cartas : jugador.cartas;
    }
    
    // Buscar carta activa del atacante
    const atacanteIndex = equipoAtacanteReal.findIndex(carta => carta.vida > 0);
    if (atacanteIndex === -1) {
        console.error("No hay cartas activas para realizar la técnica especial.");
        return;
    }

    const atacante = equipoAtacanteReal[atacanteIndex];

    // Verificar si la habilidad está cargada al 100%
    if (atacante.habilidad < 100) {
        console.warn(`${atacante.nombre} aún no ha cargado su habilidad especial.`);
        return;
    }

    // Buscar carta activa del defensor
    const defensorIndex = equipoDefensor.findIndex(carta => carta.vida > 0);
    if (defensorIndex === -1) {
        console.error("No hay cartas enemigas activas para recibir el ataque especial.");
        return;
    }

    const defensor = equipoDefensor[defensorIndex];

    console.log(`${atacante.nombre} usa ${atacante.tecnicaEspecial} contra ${defensor.nombre}`);

    // Determinar contenedores según el modo
    let contenedorAtacante, contenedorDefensor;
    
    if (modoJuego === "pvp") {
        // En PvP: atacante siempre es "jugador", defensor siempre es "rival"
        contenedorAtacante = "jugador";
        contenedorDefensor = "rival";
    } else {
        // En local/cpu: depende del turno
        contenedorAtacante = turno === 0 ? 'jugador' : 'rival';
        contenedorDefensor = turno === 0 ? 'rival' : 'jugador';
    }

    // Obtener el contenedor de la carta atacante
    const cartaContainerAtacante = document.querySelectorAll(`.contenedor-${contenedorAtacante} .carta-container`)[atacanteIndex];
    if (!cartaContainerAtacante) {
        console.error(`No se encontró la carta atacante`);
        return;
    }

    // Obtener el contenedor de la carta defensora
    const cartaContainerDefensor = document.querySelectorAll(`.contenedor-${contenedorDefensor} .carta-container`)[defensorIndex];
    if (!cartaContainerDefensor) {
        console.error(`No se encontró la carta defensora`);
        return;
    }

    // Crear imagen de animación
    const cartaImagen = cartaContainerAtacante.querySelector('.carta img');
    if (!cartaImagen) {
        console.error('No se encontró la imagen de la carta atacante.');
        return;
    }

    const nuevaImagen = document.createElement('img');
    nuevaImagen.src = cartaImagen.src;
    nuevaImagen.alt = 'Habilidad Especial';
    nuevaImagen.classList.add('nueva-imagen', turno === 0 ? 'primera-carta' : 'segunda-carta');
    document.body.appendChild(nuevaImagen);

    // Crear capa oscura de fondo
    const capaOscura = document.createElement('div');
    capaOscura.classList.add('fondo-oscuro');
    document.body.appendChild(capaOscura);

    // Esperar fin de animación
    nuevaImagen.addEventListener('animationend', () => {
        
        if (modoJuego === "pvp") {
            // En PvP: emitir al servidor
            socket.emit("ataque_especial", {
                sala: salaId,
                jugador_id: jugadorID,
                ataque: { 
                    daño: atacante.dañoEspecial, 
                    nombre: atacante.tecnicaEspecial 
                }
            });
            
            // Resetear habilidad localmente
            atacante.habilidad = 0;
            atacante.habilidadLista = false;
            actualizarBarraHabilidad(turno);
            actualizarEstadoCartas();
            
        } else {
            // En local/cpu: aplicar daño directamente
            defensor.vida = Math.max(0, defensor.vida - atacante.dañoEspecial);

            // Mostrar daño en la carta del defensor
            mostrarDaño(contenedorDefensor, defensorIndex, atacante.dañoEspecial);

            // Resetear habilidad del atacante
            atacante.habilidad = 0;
            atacante.habilidadLista = false;

            // Actualizar la interfaz gráfica
            actualizarBarraVida(contenedorDefensor, defensorIndex);
            actualizarEstadoCartas(); 
            actualizarBarraHabilidad(turno);

            // Mostrar animaciones adicionales
            animarAtaque(contenedorAtacante, atacanteIndex);

            // Aplicar animación de daño especial
            animarRecibirDañoEspecial(defensorIndex, contenedorDefensor === "jugador");

            // Verificar si el juego ha terminado
            if (verificarFinDeJuego()) {
                capaOscura.remove();
                nuevaImagen.remove();
                return;
            }

            // Cambiar turno
            cambiarTurno(false);
            console.log("Turno cambiado");
        }

        // Limpiar elementos de animación
        nuevaImagen.remove();
        capaOscura.remove();
    });
}

function atacar() {
    // En PvP verificar que sea tu turno
    if (modoJuego === "pvp") {
        const esMiTurno = (turno === 0 && soyJugador1) || (turno === 1 && !soyJugador1);
        if (!esMiTurno) {
            console.log("No es tu turno.");
            return;
        }
    }

    // Determinar qué equipo ataca y cuál defiende
    let equipoAtacante, equipoDefensor;
    
    if (modoJuego === "pvp") {
        // En PvP: SIEMPRE atacas con TUS cartas (jugador.cartas)
        equipoAtacante = jugador.cartas;
        equipoDefensor = rival.cartas;
    } else {
        // En local/cpu: depende del turno
        equipoAtacante = turno === 0 ? jugador.cartas : rival.cartas;
        equipoDefensor = turno === 0 ? rival.cartas : jugador.cartas;
    }

    // Encontrar la primera carta con vida en cada equipo
    const atacanteIndex = equipoAtacante.findIndex(carta => carta.vida > 0);
    const defensorIndex = equipoDefensor.findIndex(carta => carta.vida > 0);

    // Si no quedan cartas en alguno de los equipos, termina el juego
    if (atacanteIndex === -1 || defensorIndex === -1) {
        verificarFinDeJuego();
        return;
    }

    const atacante = equipoAtacante[atacanteIndex];
    const defensor = equipoDefensor[defensorIndex];

    let daño = atacante.daño;
    console.log(`Daño de ${atacante.nombre}: ${daño}`);
    
    // Determinar a quién se aplican las animaciones
    let objetivoDefensor, objetivoAtacante;

    if (modoJuego === "pvp") {
        // En PvP: Siempre YO ataco, y siempre se anima al RIVAL recibiendo daño
        // Sin importar si soy jugador1 o jugador2
        objetivoAtacante = "jugador";  // Mis cartas siempre atacan desde "jugador"
        objetivoDefensor = "rival";     // El rival siempre recibe en "rival"
    } else {
        // En local/cpu: depende del turno
        objetivoDefensor = turno === 0 ? "rival" : "jugador";
        objetivoAtacante = turno === 0 ? "jugador" : "rival";
    }

    if (modoJuego === "pvp") {
        // En PvP: emitir al servidor, el daño se aplica cuando llega ataque_recibido
        socket.emit("atacar", {
            sala: salaId,
            jugador_id: jugadorID,
            ataque: { daño: daño, nombre: atacante.nombre }
        });
        // Solo animaciones locales, NO aplicar daño aún (lo hará ataque_recibido)
        animarAtaque(objetivoAtacante, atacanteIndex);
    } else {
        // En local/cpu: aplicar daño directamente
        defensor.vida = Math.max(0, defensor.vida - daño);
        actualizarBarraVida(objetivoDefensor, defensorIndex);
        mostrarDaño(objetivoDefensor, defensorIndex, daño);
        actualizarEstadoCartas();
        animarAtaque(objetivoAtacante, atacanteIndex);
        animarRecibirDaño(objetivoDefensor, defensorIndex);

        if (defensor.vida <= 0) {
            const siguienteDefensorIndex = equipoDefensor.findIndex(carta => carta.vida > 0);
            if (siguienteDefensorIndex === -1) {
                verificarFinDeJuego();
                return;
            }
        }
        cambiarTurno(false);
    }
}

/**
 * Aumenta la energía de la carta del jugador en el turno actual.
 */
function aumentarEnergia() {
    // En PvP verificar que sea tu turno
    if (modoJuego === "pvp") {
        const esMiTurno = (turno === 0 && soyJugador1) || (turno === 1 && !soyJugador1);
        if (!esMiTurno) {
            console.log("No es tu turno.");
            return;
        }
    }

    // Determinar qué equipo está en turno
    const equipoAtacante = turno === 0 ? jugador.cartas : rival.cartas;

    // Buscar la primera carta con vida en el equipo
    const cartaAtacanteIndex = equipoAtacante.findIndex(carta => carta.vida > 0);

    if (cartaAtacanteIndex === -1) {
        console.log("No hay cartas disponibles para aumentar energía.");
        return;
    }

    const cartaAtacante = equipoAtacante[cartaAtacanteIndex];

    // Aumentar energía
    cartaAtacante.habilidad += cartaAtacante.energia;

    // Limitar la habilidad a un máximo de 100
    if (cartaAtacante.habilidad > 100) {
        cartaAtacante.habilidad = 100;
    }

    // Si la habilidad llega al máximo, activar habilidad especial
    if (cartaAtacante.habilidad === 100) {
        cartaAtacante.habilidadLista = true;
    }

    // Seleccionamos el contenedor de la carta activa
    const cartaContainer = document.querySelectorAll(`.contenedor-${turno === 0 ? 'jugador' : 'rival'} .carta-container`)[cartaAtacanteIndex];

    // Actualizar texto de la habilidad
    const habilidadElement = cartaContainer.querySelector('.habilidad-texto');
    if (habilidadElement) {
        habilidadElement.innerText = `Habilidad: ${cartaAtacante.habilidad}`;
    }

    // Actualizar AMBAS barras
    const barraHabilidadContainer = cartaContainer.querySelector('.barra-habilidad');
    const barraHabilidadInterna = cartaContainer.querySelector('.barra-habilidad .habilidad');
    if (barraHabilidadContainer && barraHabilidadInterna) {
        barraHabilidadContainer.style.width = `${cartaAtacante.habilidad}%`;
        barraHabilidadInterna.style.width = `${cartaAtacante.habilidad}%`;
    }

    // Animar el aumento de energía
    const cartaElemento = cartaContainer.querySelector('.carta');
    cartaElemento.classList.add('cargando-energia', 'resplandor');

    // Eliminar animación después de 1.5 segundos
    setTimeout(() => {
        cartaElemento.classList.remove('cargando-energia', 'resplandor');
    }, 1500);

    // Cambiar turno
    if (modoJuego === "pvp") {
        socket.emit("aumentar_energia", {
            sala: salaId,
            jugador_id: jugadorID
        })
    }
    
    actualizarEstadoCartas(); 
}

/**
 * Reinicia la partida, restableciendo las cartas del jugador y el rival, el turno y la interfaz de usuario.
 */
function reiniciarJuego() {
    // Eliminar mensaje de fin de juego si existe
    const mensajeFinJuego = document.querySelector('.mensaje-fin-juego');
    if (mensajeFinJuego) {
        mensajeFinJuego.remove();
    }

    // Reiniciar estado del equipo del jugador
    jugador.cartas.forEach(carta => {
        carta.vida = carta.vidaOriginal;
        carta.habilidad = 0;
        carta.habilidadLista = false;
    });

    // Reiniciar estado del rival
    rival.cartas.forEach(carta => {
        carta.vida = carta.vidaOriginal;
        carta.habilidad = 0;
        carta.habilidadLista = false;
    });

    // Limpiar el tapete
    tapete.innerHTML = '';

    // Volver a colocar las cartas en el tapete
    colocar(jugador, rival, tapete);

    // Resetear turno y actualizar botones
    turno = Math.random() < 0.5 ? 0 : 1;
    actualizarBotones();
    anunciarTurno();

    // Eliminar botón de reinicio si existe previamente
    const botonReiniciarPrevio = document.getElementById('boton-reiniciar');
    if (botonReiniciarPrevio) {
        botonReiniciarPrevio.remove();
    }

    // Crear botón de reinicio si no existe
    const botonReiniciar = document.createElement('button');
    botonReiniciar.classList.add('boton-reiniciar');
    botonReiniciar.innerText = "Reiniciar Partida";
    botonReiniciar.addEventListener('click', reiniciarJuego);

    // Agregar el botón al cuerpo si no está presente
    document.body.appendChild(botonReiniciar);
    turnos = 0;
}

// Llamar a reiniciarJuego() al inicio para establecer todo correctamente
reiniciarJuego();

// Exporta las funciones de ataque, aumento de energía y activación de la técnica especial
export { atacar, turno, aumentarEnergia, activarTecnicaEspecial, cambiarTurno, rival };

/**
 * @param {number} jugadorId - ID del jugador.
 */
async function actualizarEstadisticas(usuario_id, resultado, personaje, vidaFinal, turnos) {
    try {
        const respuesta = await fetch('/actualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id,
                resultado,
                personaje,
                vidaFinal,
                turnos
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'Error al actualizar estadísticas');
        }

        console.log('Estadísticas actualizadas correctamente:', datos.estadisticas);
    } catch (error) {
        console.error('Error al enviar estadísticas:', error);
    }
}
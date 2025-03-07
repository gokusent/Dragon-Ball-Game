// Importamos la clase Carta desde el archivo 'clases.js'
import { Carta } from './clases.js';

// Importamos las funciones necesarias del archivo 'main.js'
import { atacar, aumentarEnergia, activarTecnicaEspecial } from './main.js'; // Asegúrate de que la ruta sea correcta

/**
 * Coloca las cartas del mazo en el tapete de juego.
 * 
 * @param {Object} mazo - Objeto que representa el mazo de cartas.
 * @param {HTMLElement} tapete - Elemento HTML donde se mostrarán las cartas.
 */
function colocar(mazo, tapete) {
    // Limpiamos el contenido previo del tapete
    tapete.innerHTML = '';

    // Iteramos sobre cada carta del mazo
    mazo.cartas.forEach((carta, index) => {
        // Creamos el contenedor principal de la carta
        const cartaContainer = document.createElement('div');
        cartaContainer.classList.add('carta-container');

        // Creamos la estructura visual de la carta
        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('carta');

        // Imagen de la carta
        const img = document.createElement('img');
        img.src = carta.imagen;
        img.classList.add('imagen-carta');
        cartaDiv.appendChild(img);

        // Nombre del personaje en la carta
        const nombre = document.createElement('h3');
        nombre.innerText = carta.nombre;
        cartaDiv.appendChild(nombre);

        // Contenedor de atributos (vida y habilidad)
        const atributos = document.createElement('div');
        atributos.classList.add('atributos');

        // Indicador de vida
        const vida = document.createElement('p');
        vida.innerText = `Vida: ${carta.vida}`;
        atributos.appendChild(vida);

        // Barra de vida
        const barraVida = document.createElement('div');
        barraVida.classList.add('barra-vida');
        const vidaBarra = document.createElement('div');
        vidaBarra.classList.add('vida');
        barraVida.appendChild(vidaBarra);
        atributos.appendChild(barraVida);

        // Indicador de habilidad
        const habilidad = document.createElement('p');
        habilidad.classList.add('habilidad-texto');
        habilidad.innerText = `Habilidad: ${carta.habilidad}`;
        atributos.appendChild(habilidad);

        // Barra de habilidad
        const barraHabilidad = document.createElement('div');
        barraHabilidad.classList.add('barra-habilidad');
        const habilidadBarra = document.createElement('div');
        habilidadBarra.classList.add('habilidad');
        barraHabilidad.appendChild(habilidadBarra);
        atributos.appendChild(barraHabilidad);

        // Añadimos los atributos a la carta
        cartaDiv.appendChild(atributos);

        // Contenedor de los botones de acción
        const botonesContainer = document.createElement('div');
        botonesContainer.classList.add('botones');

        // Botón para aumentar energía
        const botonDefender = document.createElement('button');
        botonDefender.classList.add('boton-defender');
        botonDefender.innerText = 'Energía';
        botonDefender.addEventListener('click', () => {
            aumentarEnergia();
        });

        // Botón para activar la técnica especial
        const botonHabilidad = document.createElement("button");
        botonHabilidad.classList.add("btn-ataque-especial"); // Asegurar la clase correcta
        botonHabilidad.innerText = carta.tecnicaEspecial;
        botonHabilidad.addEventListener('click', () => {
            console.log("Botón de habilidad clickeado");
            activarTecnicaEspecial(index);
            reproducirSonido("specialAttackSound"); // Reproduce sonido de ataque especial
        });

        // Botón para atacar
        const botonAtacar = document.createElement('button');
        botonAtacar.classList.add('btn-ataque'); // Asegurar la clase correcta
        botonAtacar.innerText = 'Atacar';
        botonAtacar.addEventListener('click', () => {
            atacar();
            reproducirSonido("attackSound"); // Reproduce sonido de ataque
        });

        // Añadimos los botones al contenedor
        botonesContainer.append(botonAtacar, botonDefender, botonHabilidad);
        cartaContainer.appendChild(cartaDiv);
        cartaContainer.appendChild(botonesContainer);
        tapete.appendChild(cartaContainer);

        // Si es la primera carta y hay más de una, añadimos un separador "VS"
        if (index === 0 && mazo.cartas.length > 1) {
            const vsPlaceholder = document.createElement('div');
            vsPlaceholder.classList.add('vs-placeholder');
            vsPlaceholder.innerText = 'VS';
            tapete.appendChild(vsPlaceholder);
        }
    });
}

// Exportamos la función para su uso en otros módulos
export { colocar };

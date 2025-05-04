// Importamos la clase Carta desde el archivo 'clases.js'
import { Carta } from './clases.js';

// Importamos las funciones necesarias del archivo 'main.js'
import { atacar, turno, aumentarEnergia, activarTecnicaEspecial } from './main.js'; // Asegúrate de que la ruta sea correcta

function colocar(jugador, rival, tapete) {
    // Limpiamos el contenido previo del tapete
    tapete.innerHTML = '';

    // Crear contenedores separados para el jugador y el rival
    const contenedorJugador = document.createElement('div');
    contenedorJugador.classList.add('contenedor-jugador');

    const contenedorRival = document.createElement('div');
    contenedorRival.classList.add('contenedor-rival');

    // **Colocar las cartas del jugador**
    jugador.cartas.forEach((carta, index) => {
        const cartaContainer = document.createElement('div');
        cartaContainer.classList.add('carta-container');

        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('carta');

        // Imagen de la carta
        const img = document.createElement('img');
        img.src = carta.imagen ? carta.imagen : "cartas/default.png";
        img.classList.add('imagen-carta');
        cartaDiv.appendChild(img);

        // Nombre del personaje
        const nombre = document.createElement('h3');
        nombre.innerText = carta.nombre;
        cartaDiv.appendChild(nombre);

        // Contenedor de atributos
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

        // Añadir atributos a la carta
        cartaDiv.appendChild(atributos);

        // Contenedor de botones de acción (Solo para el jugador)
        const botonesContainer = document.createElement('div');
        botonesContainer.classList.add('botones');

        // Botón para aumentar energía (con identificación del jugador o rival)
        const botonDefender = document.createElement('button');
        botonDefender.classList.add('boton-defender');
        botonDefender.innerText = 'Energía';
        botonDefender.addEventListener('click', () => {
            console.log("Botón Energía clickeado");
            aumentarEnergia(jugador);  // Pasamos el jugador al que pertenece este botón
        });
        // Botón para activar la técnica especial
        const botonHabilidad = document.createElement("button");
        botonHabilidad.classList.add("btn-ataque-especial");
        botonHabilidad.innerText = carta.tecnicaEspecial ? carta.tecnicaEspecial : "Habilidad Desconocida";
        if (jugador.energia < 100) {
            botonHabilidad.disabled = true;
        } else {
            botonHabilidad.disabled = false;
            botonHabilidad.addEventListener('click', () => {
            if (turno === 0) {
                activarTecnicaEspecial(jugador, turno);      
            }
        }); 
    }

        // Botón para atacar
        const botonAtacar = document.createElement('button');
        botonAtacar.classList.add('btn-ataque');
        botonAtacar.innerText = 'Atacar';
        botonAtacar.addEventListener('click', () => atacar(jugador, rival));

        // Agregar botones solo si la carta pertenece al jugador
        botonesContainer.append(botonAtacar, botonDefender, botonHabilidad);
        cartaContainer.appendChild(cartaDiv);
        cartaContainer.appendChild(botonesContainer);

        // Agregar carta del jugador al contenedor
        contenedorJugador.appendChild(cartaContainer);
    });

    // **Colocar las cartas del rival**
    rival.cartas.forEach((carta, index) => {
        const cartaContainer = document.createElement('div');
        cartaContainer.classList.add('carta-container');

        const cartaDiv = document.createElement('div');
        cartaDiv.classList.add('carta');

        // Imagen de la carta
        const img = document.createElement('img');
        img.src = carta.imagen ? carta.imagen : "cartas/default.png";
        img.classList.add('imagen-carta');
        cartaDiv.appendChild(img);

        // Nombre del personaje
        const nombre = document.createElement('h3');
        nombre.innerText = carta.nombre;
        cartaDiv.appendChild(nombre);

        // Contenedor de atributos
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

        // Añadir atributos a la carta del rival
        cartaDiv.appendChild(atributos);

        // **Botones del rival**
        const botonesContainer = document.createElement('div');
        botonesContainer.classList.add('botones');

        // Botón para aumentar energía **(FALTABA)**
        const botonDefender = document.createElement('button');
        botonDefender.classList.add('boton-defender');
        botonDefender.innerText = 'Energía';
        botonDefender.addEventListener('click', () => aumentarEnergia());

        // Botón para activar la técnica especial
        const botonHabilidad = document.createElement("button");
        botonHabilidad.classList.add("btn-ataque-especial");
        botonHabilidad.innerText = carta.tecnicaEspecial ? carta.tecnicaEspecial : "Habilidad Desconocida";
        botonHabilidad.addEventListener('click', () => { 
            if (turno === 1) {
                activarTecnicaEspecial(rival, turno);
        }
    });

        // Botón para atacar
        const botonAtacar = document.createElement('button');
        botonAtacar.classList.add('btn-ataque');
        botonAtacar.innerText = 'Atacar';
        botonAtacar.addEventListener('click', () => atacar(rival, jugador));

        // Agregar botones al rival
        botonesContainer.append(botonAtacar, botonDefender, botonHabilidad);
        cartaContainer.appendChild(cartaDiv);
        cartaContainer.appendChild(botonesContainer);

        // Agregar carta del rival al contenedor
        contenedorRival.appendChild(cartaContainer);
    });

    // **Agregar los contenedores al tapete**
    tapete.appendChild(contenedorJugador);

    // Si es la primera carta y hay más de una, añadimos un separador "VS"
    const vsPlaceholder = document.createElement('div');
    vsPlaceholder.classList.add('vs-placeholder');
    vsPlaceholder.innerText = 'VS';
    tapete.appendChild(vsPlaceholder);
    
    tapete.appendChild(contenedorRival);

    console.log("Cartas colocadas correctamente en el tapete.");
}

// Exportamos la función para su uso en otros módulos
export { colocar };

/**
 * Representa una carta en el juego.
 */
class Carta {
    /**
     * Crea una nueva carta.
     * @param {string} nombre - Nombre del personaje en la carta.
     * @param {number} vida - Puntos de vida de la carta.
     * @param {number} daño - Daño que la carta puede infligir.
     * @param {number} energia - Nivel de energía de la carta.
     * @param {string} tecnicaEspecial - Nombre de la técnica especial de la carta.
     * @param {number} dañoEspecial - Daño causado por la técnica especial.
     * @param {string} imagen - URL de la imagen de la carta.
     */
    constructor(nombre, vida, daño, energia, tecnicaEspecial, dañoEspecial, imagen) {
        this.nombre = nombre;
        this.vida = vida;
        this.daño = daño;
        this.energia = energia;
        this.tecnicaEspecial = tecnicaEspecial;
        this.dañoEspecial = dañoEspecial;
        this.habilidad = 0;
        this.habilidadLista = false;
        this.imagen = imagen;
    }
}

/**
 * Representa un mazo de cartas.
 */
class Mazo {
    /**
     * Crea un nuevo mazo de cartas.
     * @param {Carta[]} [cartas=[]] - Un array de objetos Carta.
     */
    constructor(cartas = []) {
        this.cartas = cartas; // Asegura que siempre sea un array
    }

    /**
     * Agrega una carta al mazo.
     * @param {Carta} carta - La carta que se va a agregar al mazo.
     */
    agregarCarta(carta) {
        this.cartas.push(carta);
    }
}

/**
 * Representa un jugador en el juego.
 */
class Jugador {
    /**
     * Crea un nuevo jugador.
     * @param {string} nombre - Nombre del jugador.
     * @param {Carta[]} cartas - Un array de cartas del jugador.
     */
    constructor(nombre, cartas) {
        this.nombre = nombre;
        this.cartas = cartas; // Un array de objetos de tipo Carta
        this.turno = false;
    }
}

export { Carta, Mazo, Jugador };

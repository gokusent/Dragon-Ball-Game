// Variable global para almacenar la instancia del reproductor de YouTube
let player;

// Bandera para saber si el reproductor ya está listo para usarse
let isPlayerReady = false;

// Objeto que mapea cada página del juego a una lista de IDs de videos de YouTube
const listasPorPagina = {
    /** En éstas páginas no usamos la API de Youtube
     * "index": ['ptopGiouo4c'],
     * "menu": ['hI9kz9nR-G4'],
     * "inventario": ['sb3mznAthlU'],
     * "perfil": ['VRUMHMl4z1g'],
     */
    'seleccion': ['SKyneUmr74Y'],   // Música de la pantalla de selección
    "Alfa": ['R52Yse9lDEY'],        // Música para la pantalla de combate
    "foro": ['QrFyvuu34NU'],        // Música para el foro
    "gacha": ['TTSId7Uwtxs'],       // Música para la sección de gacha
    "sala": ['zdOAOferScI']         // Música para la sala PvP
};

// Esta función es llamada automáticamente cuando la API de YouTube Iframe está lista
function onYouTubeIframeAPIReady() {
    // Obtiene el nombre de la página actual
    const pagina = window.paginaActual;

    // Obtiene la lista de reproducción asociada a la página actual,
    // o la lista de la página 'index' si no hay una definida
    const lista = listasPorPagina[pagina] || listasPorPagina['seleccion'];

    // Comprueba si la música ya se inició previamente en esta sesión
    if (window.sessionStorage.getItem('musicaIniciada') === 'true') {
        // Crea una nueva instancia del reproductor de YouTube
        player = new YT.Player('player', {
            height: '0', // No se muestra en pantalla
            width: '0',  // No se muestra en pantalla
            videoId: lista[0], // Primer video de la lista como video inicial
            playerVars: {
                autoplay: 1,                // Reproducción automática
                playlist: lista.join(','),  // Lista de reproducción
                loop: 1,                    // Repetir la lista en bucle
                rel: 0                      // No mostrar videos relacionados al final
            },
            events: {
                'onReady': (event) => {
                    // Marca el reproductor como listo y ajusta el volumen
                    isPlayerReady = true;
                    event.target.setVolume(50); // Volumen al 50%
                }
            }
        });
    }
}

/**
 * Función que maneja los cambios de estado del reproductor de YouTube.
 * 
 * @function
 * @param {Object} event - El evento que contiene la información sobre el estado del reproductor.
 * @returns {void} No retorna ningún valor.
 */
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        console.log("Video terminado, comenzando de nuevo...");
    }
}

/**
 * Función para obtener la instancia actual del reproductor de YouTube.
 * 
 * @function
 * @returns {YT.Player|null} Retorna la instancia del reproductor si está disponible, de lo contrario retorna null.
 */
function getPlayer() {
    return player; // Retornamos la instancia del reproductor
}

/**
 * Función para alternar la reproducción de la música en el reproductor de YouTube.
 * Pausa la música si está sonando, y la reanuda si está pausada.
 * 
 * @function
 * @returns {void} No retorna ningún valor.
 */
function toggleMusic() {
    if (isPlayerReady) { // Verificamos si el reproductor ya está listo
        const currentPlayer = getPlayer(); // Obtenemos la instancia del reproductor
        if (currentPlayer) {
            const playerState = currentPlayer.getPlayerState(); // Obtenemos el estado actual del reproductor
            if (playerState === YT.PlayerState.PLAYING) { // Si el video está en reproducción...
                currentPlayer.pauseVideo(); // Pausamos la reproducción
            } else {
                currentPlayer.playVideo(); // Si está pausado, reanudamos la reproducción
            }
        }
    } else {
        console.log("El reproductor no está inicializado aún. Espera unos segundos."); // Mensaje en consola si el reproductor aún no está listo
    }
}

// Hacemos que la función `toggleMusic` esté disponible globalmente para poder llamarla desde otros archivos
window.toggleMusic = toggleMusic;

let player;
let isPlayerReady = false;

const listasPorPagina = {
    "index": ['ptopGiouo4c'],
    "menu": ['hI9kz9nR-G4'],
    'seleccion': ['SKyneUmr74Y'],
    "Alfa": ['R52Yse9lDEY'],
    "foro": ['QrFyvuu34NU'],
    "gacha": ['TTSId7Uwtxs'],
    "inventario": ['sb3mznAthlU'],
    "perfil": ['VRUMHMl4z1g'],
    "sala": ['VRUMHMl4z1g']
};

function onYouTubeIframeAPIReady() {
    const pagina = window.paginaActual || 'index';
    const lista = listasPorPagina[pagina] || listasPorPagina['index'];

    if (window.sessionStorage.getItem('musicaIniciada') === 'true') {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: lista[0],
        playerVars: {
            autoplay: 1,
            playlist: lista.join(','),
            loop: 1,
            rel: 0
        },
        events: {
            'onReady': (event) => {
                isPlayerReady = true;
                event.target.setVolume(50);
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

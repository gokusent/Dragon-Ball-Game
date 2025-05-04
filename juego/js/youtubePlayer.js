// Declaramos una variable global para almacenar el reproductor de YouTube
let player;
// Variable de control para verificar si el reproductor está listo
let isPlayerReady = false;

// Lista de videos a reproducir en secuencia
const videoIds = ['VRUMHMl4z1g', 'sb3mznAthlU', '_QSfV9Weomc', 'QrFyvuu34NU'];

/**
 * Función que se llama cuando la API de YouTube está lista y se puede cargar el reproductor.
 * 
 * @function
 * @returns {void} No retorna ningún valor.
 */
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', { 
        height: '0', 
        width: '0',  
        videoId: videoIds[0], // Primer video de la lista
        playerVars: {
            autoplay: 1,  // Reproducción automática
            playlist: videoIds.join(','),  // Lista de videos a reproducir
            loop: 1, // Hacer que la playlist sea un bucle
            rel: 0 // Evita que aparezcan videos relacionados al final
        },
        events: {
            'onReady': (event) => {
                isPlayerReady = true;
                console.log("YouTube Player Ready");
                event.target.setVolume(50); // Ajustamos el volumen al 50%
            },
            'onStateChange': onPlayerStateChange // Detectar cambios de estado
        }
    });
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

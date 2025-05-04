/**
 * Alterna la reproducción de la música en el reproductor de YouTube.
 * Si la música está reproduciéndose, la pausa; si está pausada, la reproduce.
 *
 * @function
 * @returns {void} No retorna ningún valor.
 */
export function toggleMusic() {
    const player = getPlayer(); // Obtiene la instancia del reproductor de YouTube

    // Verifica si el reproductor está inicializado correctamente
    if (!player || typeof player.getPlayerState !== "function") {
        console.log("El reproductor no está inicializado aún. Espera unos segundos.");
        return; // Sale de la función si el reproductor no está listo
    }

    // Obtiene el estado actual del reproductor
    // Estado 1 = Reproduciendo, Estado 2 = Pausado
    if (player.getPlayerState() === 1) {
        player.pauseVideo(); // Pausa la reproducción si está sonando
        console.log("Música pausada.");
    } else {
        player.playVideo(); // Reproduce la música si está pausada
        console.log("Música reproducida.");
    }
}

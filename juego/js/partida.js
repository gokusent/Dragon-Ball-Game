function obtenerEstadoPartida(partidaId) {
    fetch(`/api/partidas/${partidaId}`)
        .then(response => response.json())
        .then(data => {
            // Actualizar la UI con los datos de la partida
            console.log(data);
            // Actualizar el turno, los movimientos previos, etc.
        });
}

function realizarMovimiento(partidaId, jugadorId, cartaId, accion, valor, turno) {
    fetch(`/api/partidas/${partidaId}/movimientos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jugador_id: jugadorId,
            carta_id: cartaId,
            accion: accion,
            valor: valor,
            turno: turno,
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Actualizar la UI con el movimiento realizado
        console.log(data);
    });
}

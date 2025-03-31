const io = require("socket.io")(3000, {
    cors: {
        origin: ["http://127.0.0.1:5503"],
    },
    transports: ["websocket", "polling"], // 🚀 Solo WebSockets para estabilidad
});

let salas = {}; // Objeto para almacenar salas activas

io.on("connection", (socket) => {
    console.log(`✅ Nuevo jugador conectado: ${socket.id}`);

    // 🔄 Buscar partida o crear una nueva
    socket.on("buscar_partida", () => {
        // Verificar si ya está en una sala
        for (let sala in salas) {
            if (salas[sala].jugador1 === socket.id || salas[sala].jugador2 === socket.id) {
                console.log(`⚠️ Jugador ${socket.id} ya está en la sala ${sala}.`);
                return;
            }
        }

        // Buscar sala disponible
        let salaDisponible = Object.keys(salas).find(s => !salas[s].jugador2);

        if (salaDisponible) {
            salas[salaDisponible].jugador2 = socket.id;
            socket.join(salaDisponible);
            console.log(`🎮 Jugador ${socket.id} se unió a la sala ${salaDisponible}`);

            // Cancelar eliminación si un jugador nuevo entra
            if (salas[salaDisponible].timeout) {
                clearTimeout(salas[salaDisponible].timeout);
                delete salas[salaDisponible].timeout;
                console.log(`⏹ Eliminación de la sala ${salaDisponible} cancelada.`);
            }

            io.to(salaDisponible).emit("actualizar_sala", salas[salaDisponible]);
        } else {
            // Crear nueva sala
            let nuevaSala = `sala-${socket.id}`;
            salas[nuevaSala] = { jugador1: socket.id, jugador2: null, listos: 0 };
            socket.join(nuevaSala);
            console.log(`🎮 Nueva sala creada: ${nuevaSala}. Esperando oponente...`);
        }
    });

    // 🔥 Unirse a una sala específica
    socket.on("unirse_sala", (sala) => {
        if (!salas[sala]) {
            console.log(`❌ Sala ${sala} no encontrada.`);
            return;
        }

        socket.join(sala);

        if (!salas[sala].jugador1) {
            salas[sala].jugador1 = socket.id;
        } else if (!salas[sala].jugador2) {
            salas[sala].jugador2 = socket.id;
        }

        console.log(`👥 Jugadores en sala ${sala}:`, salas[sala]);

        io.to(sala).emit("actualizar_sala", salas[sala]);
    });

    // ✅ Marcar jugador como listo
    socket.on("jugador_listo", (sala) => {
        if (salas[sala]) {
            salas[sala].listos++;

            if (salas[sala].listos === 2) {
                io.to(sala).emit("iniciar_partida");
                console.log(`🚀 Partida iniciada en la sala ${sala}`);
            }
        }
    });

    // ❌ Manejo de desconexión
    socket.on("disconnect", () => {
        console.log(`❌ Jugador desconectado: ${socket.id}`);

        for (let sala in salas) {
            let salaActual = salas[sala];

            if (salaActual.jugador1 === socket.id) {
                console.log(`⚠️ El jugador1 (${socket.id}) se desconectó de la sala ${sala}`);
                salaActual.jugador1 = null;
            } else if (salaActual.jugador2 === socket.id) {
                console.log(`⚠️ El jugador2 (${socket.id}) se desconectó de la sala ${sala}`);
                salaActual.jugador2 = null;
            }

            // Eliminar la sala si está vacía
            if (!salaActual.jugador1 && !salaActual.jugador2) {
                console.log(`🕒 Eliminando sala ${sala} en 10 segundos...`);
                salas[sala].timeout = setTimeout(() => {
                    if (!salas[sala].jugador1 && !salas[sala].jugador2) {
                        console.log(`🗑 Sala ${sala} eliminada.`);
                        delete salas[sala];
                    }
                }, 10000);
            }
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(`❌ Desconectado: ${reason}`);
    });
});

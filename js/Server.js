const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const http = require('http');
const socketIo = require('socket.io'); // Importamos socket.io

const app = express();
const server = http.createServer(app); // Creamos el servidor HTTP
const io = socketIo(server); // Inicializamos socket.io con el servidor HTTP

app.use(express.json());
app.use(cors({
  origin: 'http://127.0.0.1:5503', // Asegúrate de que esto sea el origen correcto de tu frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'estadisticas',
  port: 3307
});

const estadisticas = {};

app.post('/actualizar', (req, res) => {
  const { jugador, resultado, personaje, vidaFinal, turnos } = req.body;
  if (!estadisticas[jugador]) {
    estadisticas[jugador] = { victorias: 0, derrotas: 0, numeroPartida: 0, partidas: [] };
  }

  estadisticas[jugador].numeroPartida += 1;

  if (resultado === 'victoria') {
    estadisticas[jugador].victorias += 1;
  } else if (resultado === 'derrota') {
    estadisticas[jugador].derrotas += 1;
  }

  estadisticas[jugador].partidas.push({
    numeroPartida: estadisticas[jugador].numeroPartida,
    personaje, 
    vidaFinal, 
    turnos, 
    resultado
  });

  connection.query('SELECT * FROM estadisticas WHERE jugador = ?', [jugador], (err, results) => {
    if (err) {
      console.error('Error al obtener estadísticas:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    let jugadorEstadisticas = results[0];
    if (!jugadorEstadisticas) {
      connection.query('INSERT INTO estadisticas (jugador, victorias, derrotas, numeroPartida) VALUES (?, ?, ?, ?)', 
      [jugador, 0, 0, 0], (err) => {
        if (err) {
          console.error('Error al insertar jugador:', err);
          return res.status(500).json({ mensaje: 'Error en el servidor' });
        }
      });

      jugadorEstadisticas = { jugador, victorias: 0, derrotas: 0, numeroPartida: 0 };
    }

    jugadorEstadisticas.numeroPartida += 1;
    if (resultado === 'victoria') {
      jugadorEstadisticas.victorias += 1;
    } else if (resultado === 'derrota') {
      jugadorEstadisticas.derrotas += 1;
    }

    connection.query('UPDATE estadisticas SET victorias = ?, derrotas = ?, numeroPartida = ? WHERE jugador = ?', 
    [jugadorEstadisticas.victorias, jugadorEstadisticas.derrotas, jugadorEstadisticas.numeroPartida, jugador], (err) => {
      if (err) {
        console.error('Error al actualizar estadísticas:', err);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
      }

      connection.query('INSERT INTO partidas (jugador_id, personaje, vidaFinal, turnos, resultado) VALUES (?, ?, ?, ?, ?)', 
      [jugadorEstadisticas.id, personaje, vidaFinal, turnos, resultado], (err) => {
        if (err) {
          console.error('Error al insertar partida:', err);
          return res.status(500).json({ mensaje: 'Error al insertar partida' });
        }

        console.log(`Actualizado: ${jugador} - Victorias: ${jugadorEstadisticas.victorias}, Derrotas: ${jugadorEstadisticas.derrotas}`);
        res.json({ mensaje: 'Estadísticas y partida actualizadas', estadisticas: jugadorEstadisticas });
      });
    });
  });
});

app.get('/estadisticas/:jugador', (req, res) => {
  const jugador = req.params.jugador;
  if (estadisticas[jugador]) {
    res.json(estadisticas[jugador]);
  } else {
    res.status(404).json({ mensaje: "Jugador no encontrado" });
  }
});

app.post('/reiniciar', (req, res) => {
  const { jugador } = req.body;
  if (estadisticas[jugador]) {
    estadisticas[jugador] = { victorias: 0, derrotas: 0, numeroPartida: 0, partidas: [] };
  }

  connection.query('UPDATE estadisticas SET victorias = 0, derrotas = 0, numeroPartida = 0 WHERE jugador = ?', [jugador], (err) => {
    if (err) {
      console.error('Error al reiniciar estadísticas:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    console.log(`Estadísticas reiniciadas para ${jugador}`);
    res.json({ mensaje: 'Estadísticas reiniciadas' });
  });
});

// Conexión de socket.io para el juego PvP
let jugadores = []; // Lista de jugadores conectados

io.on('connection', (socket) => {
  console.log('Nuevo jugador conectado: ', socket.id);

  // Registrar jugador
  socket.on('unirseSala', (jugadorId) => {
    jugadores.push({ socketId: socket.id, jugadorId });
    console.log(`${jugadorId} se ha unido a la sala`);

    // Comprobar si hay dos jugadores en la sala
    if (jugadores.length === 2) {
      io.to(jugadores[0].socketId).emit('inicioJuego', jugadores[1].jugadorId);
      io.to(jugadores[1].socketId).emit('inicioJuego', jugadores[0].jugadorId);
    }
  });

  // Escuchar el movimiento del jugador
  socket.on('realizarMovimiento', (data) => {
    const { jugadorId, movimiento } = data;
    // Transmitir el movimiento al otro jugador
    const otroJugador = jugadores.find(j => j.jugadorId !== jugadorId);
    if (otroJugador) {
      io.to(otroJugador.socketId).emit('movimientoRival', { jugadorId, movimiento });
    }
  });

  // Desconexión del jugador
  socket.on('disconnect', () => {
    console.log('Jugador desconectado: ', socket.id);
    jugadores = jugadores.filter(j => j.socketId !== socket.id);
  });
});

server.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});

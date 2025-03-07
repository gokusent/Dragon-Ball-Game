const express = require('express'); // Importar Express para manejar el servidor HTTP
const cors = require('cors'); // Importar CORS para permitir solicitudes desde otros dominios
const mysql = require('mysql2'); // Importar MySQL para interactuar con la base de datos

const app = express();
app.use(express.json()); // Permitir el uso de JSON en las solicitudes
app.use(cors()); // Habilitar CORS para evitar bloqueos entre dominios

/**
 * Configuración de la conexión a la base de datos MySQL.
 * 
 * @constant {Object} connection
 * @property {string} host - Dirección del servidor MySQL.
 * @property {string} user - Nombre de usuario de la base de datos.
 * @property {string} password - Contraseña de acceso a la base de datos.
 * @property {string} database - Nombre de la base de datos utilizada.
 * @property {number} port - Puerto en el que corre MySQL.
 */
const connection = mysql.createConnection({
  host: 'localhost', // Servidor de la base de datos
  user: 'root', // Usuario de la base de datos
  password: '', // Contraseña de la base de datos (dejar vacío si no tiene)
  database: 'estadisticas', // Nombre de la base de datos
  port: 3307 // Puerto en el que corre MySQL
});

// Objeto en memoria para almacenar temporalmente las estadísticas de los jugadores
const estadisticas = {};

/**
 * Ruta para actualizar las estadísticas de un jugador en memoria y en la base de datos.
 * 
 * @route POST /actualizar
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {void} Responde con un mensaje de éxito o error
 */
app.post('/actualizar', (req, res) => {
  const { jugador, resultado, personaje, vidaFinal, turnos } = req.body;

  // Si el jugador no tiene estadísticas previas, inicializarlo
  if (!estadisticas[jugador]) {
    estadisticas[jugador] = { victorias: 0, derrotas: 0, numeroPartida: 0, partidas: [] };
  }

  estadisticas[jugador].numeroPartida += 1; // Aumentar el número de partidas

  // Incrementar el contador de victorias o derrotas según el resultado
  if (resultado === 'victoria') {
    estadisticas[jugador].victorias += 1;
  } else if (resultado === 'derrota') {
    estadisticas[jugador].derrotas += 1;
  }

  // Guardar los detalles de la partida en memoria
  estadisticas[jugador].partidas.push({
    numeroPartida: estadisticas[jugador].numeroPartida,
    personaje, 
    vidaFinal, 
    turnos, 
    resultado
  });

  // Verificar si el jugador ya existe en la base de datos
  connection.query('SELECT * FROM estadisticas WHERE jugador = ?', [jugador], (err, results) => {
    if (err) {
      console.error('Error al obtener estadísticas:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    let jugadorEstadisticas = results[0]; // Obtener datos del jugador
    if (!jugadorEstadisticas) {
      // Si el jugador no existe, insertarlo en la base de datos
      connection.query('INSERT INTO estadisticas (jugador, victorias, derrotas, numeroPartida) VALUES (?, ?, ?, ?)', 
      [jugador, 0, 0, 0], (err) => {
        if (err) {
          console.error('Error al insertar jugador:', err);
          return res.status(500).json({ mensaje: 'Error en el servidor' });
        }
      });

      jugadorEstadisticas = { jugador, victorias: 0, derrotas: 0, numeroPartida: 0 };
    }

    // Actualizar estadísticas del jugador en la base de datos
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

      // Insertar detalles de la partida en la tabla 'partidas'
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

/**
 * Ruta para obtener las estadísticas de un jugador específico.
 * 
 * @route GET /estadisticas/:jugador
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {void} Responde con las estadísticas del jugador o un mensaje de error
 */
app.get('/estadisticas/:jugador', (req, res) => {
  const jugador = req.params.jugador;
  if (estadisticas[jugador]) {
    res.json(estadisticas[jugador]);
  } else {
    res.status(404).json({ mensaje: "Jugador no encontrado" });
  }
});

/**
 * Ruta para reiniciar las estadísticas de un jugador en memoria y en la base de datos.
 * 
 * @route POST /reiniciar
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {void} Responde con un mensaje de éxito o error
 */
app.post('/reiniciar', (req, res) => {
  const { jugador } = req.body;

  // Reiniciar en memoria
  if (estadisticas[jugador]) {
    estadisticas[jugador] = { victorias: 0, derrotas: 0, numeroPartida: 0, partidas: [] };
  }

  // Reiniciar en la base de datos
  connection.query('UPDATE estadisticas SET victorias = 0, derrotas = 0, numeroPartida = 0 WHERE jugador = ?', [jugador], (err) => {
    if (err) {
      console.error('Error al reiniciar estadísticas:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    console.log(`Estadísticas reiniciadas para ${jugador}`);
    res.json({ mensaje: 'Estadísticas reiniciadas' });
  });
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});

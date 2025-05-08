const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const mysql = require('mysql2/promise');
const multer = require("multer");

// Crear conexión a la base de datos
const db = mysql.createPool({
  host: 'localhost',    // o tu host de MySQL
  user: 'root',    // tu usuario de MySQL
  password: '', // tu contraseña
  database: 'juego', // nombre de la base de datos que vas a usar
  port: 3306, // puerto de MySQL (por defecto es 3306)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// NECESARIO para que Express pueda leer JSON:
app.use(express.json());
// ==========================
// API REST
// ==========================
app.get('/api/perfil', async (req, res) => {
  try {
      // Simulación de obtener datos del perfil desde la base de datos
      const [perfil] = await db.execute('SELECT id, nombre, avatar FROM usuarios WHERE id = ?', [1]); // Reemplaza '1' con el ID real
      res.json(perfil[0]);  // Devolver el perfil con avatar
  } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({ message: "Error interno del servidor" });
  }
});


app.get("/api/crear-sala", (req, res) => {
  const token = generarToken();
  res.json({ token });
});

function generarToken() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  return token;
}

// ==========================
// SERVIR JUEGO
// ==========================
const rutaJuego = path.join(__dirname, "juego");
app.use(express.static(rutaJuego));
app.use('/cartas', express.static(path.join(__dirname, 'juego/cartas')));
app.use('/storage/avatars', express.static(path.join(__dirname, 'storage')));

fs.readdirSync(rutaJuego).forEach(file => {
  if (file.endsWith(".html")) {
    app.get(`/${file}`, (req, res) => {
      res.sendFile(path.join(rutaJuego, file));
    });
  }
});

// Establece el almacenamiento para las imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "ruta/del/directorio"); // Establece la ruta donde almacenar las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Filtro para permitir solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']; // Asegúrate de incluir 'image/webp'
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Tipo de archivo no permitido"), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

app.post('/api/perfil/avatar', upload.single('avatar'), (req, res) => {
    // Aquí procesas el archivo cargado
    res.json({ nuevo_avatar_url: `/storage/avatars/${req.file.filename}` });
});


// Ruta para cambiar el avatar
app.post('/api/cambiar-avatar', upload.single('avatar'), async (req, res) => {
  const avatarUrl = `/storage/avatars/${req.file.filename}`;
  
  // Aquí actualizamos la base de datos con la nueva URL del avatar (asegúrate de tener un campo para esto)
  try {
    const [result] = await db.execute(
      'UPDATE usuarios SET avatar = ? WHERE id = ?',
      [avatarUrl, req.body.usuario_id]
    );
    
    res.json({ message: 'Avatar cambiado correctamente', avatarUrl });
  } catch (error) {
    console.error("Error al actualizar el avatar:", error);
    res.status(500).json({ message: 'Error al cambiar el avatar' });
  }
});

// ==========================
// WEBSOCKETS
// ==========================
const salas = {};
const equiposPorJugador = {};
let posts = []; // Array para los posts del foro
const usuarios = {}; // Objeto para almacenar los usuarios registrados

io.on("connection", (socket) => {
  console.log("🔌 Jugador o usuario conectado:", socket.id);

  // --- FORO ---
  socket.on('registrar_usuario', ({ jugador_id, nombre, avatar }) => {
    console.log(`👤 Usuario registrado: ${nombre} con avatar: ${avatar}`);
    usuarios[socket.id] = { jugador_id, nombre, avatar };
});


  socket.on('nuevo_post', async (postData) => {
    const usuario = usuarios[socket.id];
    console.log("Usuario conectado:", usuario);
    console.log("Datos del post:", postData);
  
    if (!usuario || !usuario.jugador_id) {
      console.error('Usuario no registrado correctamente');
      return;
    }
  
    try {
      const [result] = await db.execute(
        'INSERT INTO foro (usuario_id, titulo, contenido) VALUES (?, ?, ?)',
        [usuario.jugador_id, postData.titulo, postData.contenido]
      );
  
      const nuevoPost = {
        id: result.insertId,
        usuario_id: usuario.jugador_id,
        nombre: usuario.nombre,
        avatar: usuario.avatar,
        titulo: postData.titulo,
        contenido: postData.contenido,
        fecha: new Date()
      };
  
      io.emit('post_creado', nuevoPost);
    } catch (error) {
      console.error('Error al insertar nuevo post en foro:', error);
    }
  });

  socket.on('obtener_posts', async () => {
    try {
        const [posts] = await db.execute(`
            SELECT foro.id, foro.usuario_id, usuarios.nombre, usuarios.avatar, foro.titulo, foro.contenido, foro.fecha
            FROM foro
            JOIN usuarios ON foro.usuario_id = usuarios.id
            ORDER BY foro.fecha DESC
        `);

        // Ahora recuperamos los comentarios para cada post
        for (let post of posts) {
            const [comentarios] = await db.execute(`
                SELECT comentarios_foro.id, comentarios_foro.usuario_id, usuarios.nombre, usuarios.avatar, comentarios_foro.contenido, comentarios_foro.fecha
                FROM comentarios_foro
                JOIN usuarios ON comentarios_foro.usuario_id = usuarios.id
                WHERE comentarios_foro.foro_id = ?
                ORDER BY comentarios_foro.fecha ASC
            `, [post.id]);

            post.comentarios = comentarios; // Agregamos los comentarios al post
        }

        socket.emit('todos_los_posts', posts); // Enviamos los posts con comentarios
    } catch (error) {
        console.error('Error al obtener posts y comentarios:', error);
        socket.emit('todos_los_posts', []);
    }
});


  socket.on('nuevo_comentario', async (comentarioData) => {
    const usuario = usuarios[socket.id];
  
    // 1. Depuración: sabemos que llegó el evento
    console.log('Recibiendo nuevo comentario:', comentarioData);
  
    // 2. Creamos el objeto de comentario sin tocar la base de datos
    const nuevoComentario = {
      foro_id: comentarioData.foro_id,
      usuario_id: usuario.jugador_id, // o usuario.id si lo nombraste así
      nombre: usuario.nombre,
      avatar: usuario.avatar,
      contenido: comentarioData.contenido,
      fecha: new Date().toISOString()
    };

    // 3. Intentamos insertar el comentario en la base de datos
    try {
        const [result] = await db.execute(
            'INSERT INTO comentarios_foro (foro_id, usuario_id, contenido) VALUES (?, ?, ?)',
            [nuevoComentario.foro_id, nuevoComentario.usuario_id, nuevoComentario.contenido]
        );
        
        // Asignamos el ID generado por la base de datos al nuevo comentario
        nuevoComentario.id = result.insertId;

        // 4. Depuración: vemos qué vamos a emitir
        console.log('Emitiendo comentario:', {
          postId: nuevoComentario.foro_id,
          mensaje: {
            autor: nuevoComentario.nombre,
            avatar: nuevoComentario.avatar,
            contenido: nuevoComentario.contenido,
            fecha: nuevoComentario.fecha
          }
        });
  
        // 5. Emitimos el evento al resto de clientes
        io.emit('mensaje_en_post', {
            postId: nuevoComentario.foro_id,
            mensaje: {
                autor: nuevoComentario.nombre,
                avatar: nuevoComentario.avatar,
                contenido: nuevoComentario.contenido,
                fecha: nuevoComentario.fecha
            }
        });

    } catch (error) {
        console.error('Error al insertar comentario en la base de datos:', error);
    }
});

  
  socket.on('disconnect', () => {
    delete usuarios[socket.id];
  });
  
  // --- PVP ---
  socket.on("solicitar_sala", ({ jugador_id, nombre }) => {
    let salaLibre = Object.keys(salas).find(key => salas[key].jugador1 && !salas[key].jugador2);

    if (salaLibre) {
      salas[salaLibre].jugador2 = { socket_id: socket.id, jugador_id, nombre };
      socket.join(salaLibre);
      socket.emit("asignar_sala", { sala: salaLibre });

      const estado = {
        jugador1: salas[salaLibre].jugador1,
        jugador2: salas[salaLibre].jugador2
      };

      io.to(salaLibre).emit("estado_sala", estado);
      io.to(salaLibre).emit("jugador_unido", estado);
    } else {
      const nuevaSala = generarToken();
      salas[nuevaSala] = {
        jugador1: { socket_id: socket.id, jugador_id, nombre },
        jugador2: null,
        jugadores: {}
      };
      socket.join(nuevaSala);
      socket.emit("asignar_sala", { sala: nuevaSala });

      const estado = {
        jugador1: salas[nuevaSala].jugador1,
        jugador2: salas[nuevaSala].jugador2
      };

      io.to(nuevaSala).emit("estado_sala", estado);
    }
  });

  socket.on("unirse_sala_pvp", ({ sala, jugador_id, nombre }) => {
    let soyHost = false;
    if (!salas[sala]) {
      salas[sala] = {
        jugador1: { socket_id: socket.id, jugador_id, nombre },
        jugador2: null,
        jugadores: {},
        turno: "jugador1"
      };
      soyHost = true;
    } else if (!salas[sala].jugador2 && salas[sala].jugador1.socket_id !== socket.id) {
      salas[sala].jugador2 = { socket_id: socket.id, jugador_id, nombre };
    }

    socket.join(sala);

    const estado = {
      jugador1: salas[sala].jugador1,
      jugador2: salas[sala].jugador2,
      soyHost: soyHost,
      turno: salas[sala].turno
    };

    io.to(sala).emit("estado_sala", estado);
  });

  function obtenerSalaDelJugador(socketId) {
    for (const [sala, datos] of Object.entries(salas)) {
      if (
        datos.jugador1?.socket_id === socketId ||
        datos.jugador2?.socket_id === socketId
      ) {
        return sala;
      }
    }
    return null;
  }

  socket.on("jugador_listo", ({ sala, jugador_id }) => {
    if (!salas[sala]) return;
    const salaActual = salas[sala];

    if (salaActual.jugador1?.jugador_id === jugador_id) {
      salaActual.jugador1.listo = true;
    } else if (salaActual.jugador2?.jugador_id === jugador_id) {
      salaActual.jugador2.listo = true;
    }

    if (salaActual.jugador1?.listo && salaActual.jugador2?.listo) {
      console.log("🚀 Ambos jugadores listos, iniciando partida en sala", sala);

      const turnoInicial = Math.random() < 0.5 ? "jugador1" : "jugador2";
      salas[sala].turno = turnoInicial;

      io.to(sala).emit("iniciar_partida", { turnoInicial });
    }
  });

  socket.on("solicitar_estado_sala", ({ sala }) => {
    if (salas[sala]) {
      const estado = {
        jugador1: salas[sala].jugador1,
        jugador2: salas[sala].jugador2,
        turno: salas[sala].turno
      };
      io.to(sala).emit("estado_sala", estado);
    }
  });

  socket.on("confirmar_equipo", ({ sala, idJugador, equipo }) => {
    if (!salas[sala]) return;

    equiposPorJugador[idJugador] = equipo;

    if (!salas[sala].jugadores) salas[sala].jugadores = {};
    salas[sala].jugadores[idJugador] = socket;

    const jugadoresConfirmados = Object.keys(salas[sala].jugadores);

    if (jugadoresConfirmados.length === 2) {
      const [id1, id2] = jugadoresConfirmados;

      salas[sala].jugadores[id1].emit("equipo_confirmado", {
        equipoRival: equiposPorJugador[id2]
      });

      salas[sala].jugadores[id2].emit("equipo_confirmado", {
        equipoRival: equiposPorJugador[id1]
      });
    }
  });

  socket.on("solicitar_inicio_partida", () => {
    const sala = obtenerSalaDelJugador(socket.id);
    if (!sala || !salas[sala].jugador1 || !salas[sala].jugador2) return;

    const turnoInicial = Math.random() < 0.5 ? 0 : 1;

    io.to(sala).emit("iniciar_partida", {
      turnoInicial,
      jugador1: salas[sala].jugador1,
      jugador2: salas[sala].jugador2
    });
  });

  socket.on("cambiar_turno", (nuevoTurno) => {
    const sala = obtenerSalaDelJugador(socket.id);
    if (sala && salas[sala]) {
      salas[sala].turno = nuevoTurno;
      console.log(`🔄 Turno actualizado en sala ${sala}:`, nuevoTurno);
      io.to(sala).emit("cambiar_turno", nuevoTurno);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Jugador o usuario desconectado:", socket.id);
    for (const [sala, datos] of Object.entries(salas)) {
      let cambiado = false;

      if (datos.jugador1?.socket_id === socket.id) {
        datos.jugador1 = null;
        cambiado = true;
      }
      if (datos.jugador2?.socket_id === socket.id) {
        datos.jugador2 = null;
        cambiado = true;
      }

      if (cambiado) {
        const estado = {
          jugador1: datos.jugador1,
          jugador2: datos.jugador2
        };
        io.to(sala).emit("estado_sala", estado);
        io.to(sala).emit("oponente_desconectado");
      }
    }
  });
});

// ==========================
// ESTADÍSTICAS
// ==========================
// Ruta para actualizar las estadísticas de la partida
// ==========================
// ESTADÍSTICAS
// ==========================
app.post('/actualizar', async (req, res) => {
  console.log('Datos recibidos:', req.body);

  const { usuario_id, resultado, personaje, vidaFinal, turnos } = req.body;

  if (!usuario_id || !resultado || !personaje || vidaFinal === undefined || turnos === undefined) {
    return res.status(400).json({ mensaje: 'Faltan datos para actualizar las estadísticas' });
  }

  try {
    // 1) Obtener o crear fila de estadísticas
    const [[fila]] = await db.query(
      'SELECT * FROM estadisticas WHERE usuario_id = ?',
      [usuario_id]
    );

    let victorias, derrotas, numeroPartida;

    if (!fila) {
      // No existe: insertar nueva fila
      await db.query(
        'INSERT INTO estadisticas (usuario_id, victorias, derrotas, numeroPartida) VALUES (?,0,0,0)',
        [usuario_id]
      );
      victorias = 0;
      derrotas = 0;
      numeroPartida = 0;
    } else {
      victorias = fila.victorias;
      derrotas = fila.derrotas;
      numeroPartida = fila.numeroPartida;
    }

    // 2) Actualizar contadores
    numeroPartida += 1;
    if (resultado === 'victoria') victorias += 1;
    else if (resultado === 'derrota') derrotas += 1;

    await db.query(
      'UPDATE estadisticas SET victorias = ?, derrotas = ?, numeroPartida = ? WHERE usuario_id = ?',
      [victorias, derrotas, numeroPartida, usuario_id]
    );

    // 3) Insertar detalle de la partida
    await db.query(
      'INSERT INTO partidas (usuario_id, personaje, vidaFinal, turnos, resultado) VALUES (?,?,?,?,?)',
      [usuario_id, personaje, vidaFinal, turnos, resultado]
    );

    console.log(`Estadísticas actualizadas para usuario ${usuario_id} → V:${victorias} D:${derrotas} P:${numeroPartida}`);
    res.json({
      mensaje: 'Estadísticas y partida actualizadas',
      estadisticas: { usuario_id, victorias, derrotas, numeroPartida }
    });

  } catch (err) {
    console.error('Error en /actualizar:', err);
    res.status(500).json({ mensaje: 'Error interno al actualizar estadísticas' });
  }
});


// Cambia este endpoint si lo deseas para ser consistente
app.get('/api/estadisticas/usuario/:id', async (req, res) => {
  const usuarioId = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT victorias, derrotas, numeroPartida FROM estadisticas WHERE usuario_id = ?',
      [usuarioId]
    );

    if (rows.length === 0) {
      return res.json({ victorias: 0, derrotas: 0, numeroPartida: 0 });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en GET /api/estadisticas/:id', err);
    res.status(500).json({ mensaje: 'Error interno al obtener estadísticas' });
  }
});

 
// ==========================
// INICIAR SERVIDOR
// ==========================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});

// ==========================
// Función auxiliar para ID único de post
// ==========================
function generarId() {
  return Math.random().toString(36).substr(2, 9);
}

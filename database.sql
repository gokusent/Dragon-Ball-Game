-- Crear la base de datos
DROP DATABASE IF EXISTS juego;
-- CREATE DATABASE juego;
USE railway;

-- Tabla de usuarios
DROP TABLE IF EXISTS usuarios;  
CREATE TABLE usuarios (
	id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT '/avatars/default.jpg',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);	

-- Tabla de cartas (personajes del juego)
DROP TABLE IF EXISTS cartas;
CREATE TABLE cartas (
	id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    rareza ENUM('Común', 'Raro', 'Épico', 'Legendario') NOT NULL,
    vida INT NOT NULL,
    daño INT NOT NULL,
    energia INT NOT NULL,
    tecnica_especial VARCHAR(100) NOT NULL,
    daño_especial INT NOT NULL,
    imagen_url VARCHAR(255) NOT NULL,
    imagen_url2 VARCHAR(255) NULL
);

-- Tabla de equipos (por usuario)
DROP TABLE IF EXISTS equipos;
CREATE TABLE equipos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    carta_id INT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (carta_id) REFERENCES cartas(id) ON DELETE CASCADE
);

-- Tabla de inventario (relación jugasores - cartas obtenidas)
DROP TABLE IF EXISTS inventario;
CREATE TABLE inventario (
	id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    carta_id INT NOT NULL,
    cantidad INT DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (carta_id) REFERENCES cartas(id) ON DELETE CASCADE
);

-- Tabla del foro 
DROP TABLE IF EXISTS foro;
CREATE TABLE foro (
	id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de comentarios en el foro
DROP TABLE IF EXISTS comentarios_foro;
CREATE TABLE comentarios_foro (
	id INT AUTO_INCREMENT PRIMARY KEY,
	foro_id INT NOT NULL,
	usuario_id INT NOT NULL,
	contenido TEXT NOT NULL,
    imagen TEXT,
	fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (foro_id) REFERENCES foro(id) ON DELETE CASCADE,
	FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de solicitudes de amistad
DROP TABLE IF EXISTS solicitudes_amistad;
CREATE TABLE solicitudes_amistad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitante_id INT NOT NULL,
    solicitado_id INT NOT NULL,
    estado ENUM('pendiente', 'aceptada', 'rechazada'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(solicitante_id, solicitado_id) -- evitar duplicados
);

-- Tabla de amigos
DROP TABLE IF EXISTS amigos;
CREATE TABLE amigos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    amigo_id INT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (amigo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, amigo_id) -- evitar duplicados
);

-- Tabla de estadísticas de jugadores
DROP TABLE IF EXISTS estadisticas;
CREATE TABLE estadisticas (
    usuario_id INT PRIMARY KEY, -- ID del usuario (clave primaria compartida)
    victorias INT DEFAULT 0,
    derrotas INT DEFAULT 0,
    numeroPartida INT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de partidas
DROP TABLE IF EXISTS partidas;
CREATE TABLE partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT, -- ID real del usuario
    personaje VARCHAR(255),
    vidaFinal INT,
    turnos INT,
    resultado ENUM('victoria', 'derrota') NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
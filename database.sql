-- Base de datos creada para el proyecto en la que se guardan las estadisticas
DROP DATABASE IF EXISTS estadisticas;
CREATE DATABASE estadisticas;
USE estadisticas;

CREATE TABLE estadisticas (
	id INT AUTO_INCREMENT PRIMARY KEY,
    jugador VARCHAR(255) NOT NULL UNIQUE,
    victorias INT DEFAULT 0, 
    derrotas INT DEFAULT 0, 
    numeroPartida INT DEFAULT 0
);

CREATE TABLE partidas (
	id INT AUTO_INCREMENT PRIMARY KEY,
    jugador_id INT,
    personaje VARCHAR(255),  
    vidaFinal INT,
    turnos INT,
    resultado VARCHAR(50),
    FOREIGN KEY (jugador_id) REFERENCES estadisticas(id) ON DELETE CASCADE  
);
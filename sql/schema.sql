-- =====================================================================
-- Script de creación de base de datos - App Colaboradores Campaña Política
-- Motor: MariaDB / MySQL
-- Host: 127.0.0.1  Usuario: root
-- =====================================================================

CREATE DATABASE IF NOT EXISTS PIGP
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE PIGP;

-- ---------------------------------------------------------------------
-- Tablas de votación: zonas y puestos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zonas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      CHAR(2)      NOT NULL UNIQUE,
  nombre      VARCHAR(100) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS puestos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  zona_id     INT          NOT NULL,
  numero      CHAR(2)      NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  num_mesas   INT          NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_puestos_zona_numero (zona_id, numero),
  CONSTRAINT fk_puestos_zona FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tablas de división territorial: comunas y barrios
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(10)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS barrios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  comuna_id   INT          NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_barrios_comuna FOREIGN KEY (comuna_id) REFERENCES comunas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tablas accesorias (catálogos)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profesiones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ocupaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS parentescos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Líderes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lideres (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100)  NOT NULL,
  apellidos          VARCHAR(100)  NOT NULL,
  sexo               ENUM('MASCULINO','FEMENINO') NOT NULL,
  cedula             VARCHAR(20)   NOT NULL UNIQUE,
  celular            VARCHAR(20)   NOT NULL,
  email              VARCHAR(150)  NULL,
  comuna_id          INT           NOT NULL,
  barrio_id          INT           NOT NULL,
  direccion          VARCHAR(200)  NOT NULL,
  zona_id            INT           NOT NULL,
  puesto_id          INT           NOT NULL,
  profesion_id       INT           NULL,
  ocupacion_id       INT           NULL,
  fecha_nacimiento   DATE          NOT NULL,
  estado             ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  foto               VARCHAR(255)  NULL,
  usuario            VARCHAR(50)   NOT NULL UNIQUE,
  clave              VARCHAR(255)  NOT NULL,
  vehiculo           TINYINT(1)    NOT NULL DEFAULT 0,
  redes_sociales     TINYINT(1)    NOT NULL DEFAULT 0,
  orador_publico     TINYINT(1)    NOT NULL DEFAULT 0,
  cantante           TINYINT(1)    NOT NULL DEFAULT 0,
  testigo_electoral  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lideres_comuna    FOREIGN KEY (comuna_id)    REFERENCES comunas(id),
  CONSTRAINT fk_lideres_barrio    FOREIGN KEY (barrio_id)    REFERENCES barrios(id),
  CONSTRAINT fk_lideres_zona      FOREIGN KEY (zona_id)      REFERENCES zonas(id),
  CONSTRAINT fk_lideres_puesto    FOREIGN KEY (puesto_id)    REFERENCES puestos(id),
  CONSTRAINT fk_lideres_profesion FOREIGN KEY (profesion_id) REFERENCES profesiones(id),
  CONSTRAINT fk_lideres_ocupacion FOREIGN KEY (ocupacion_id) REFERENCES ocupaciones(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Referidos (dependen de un líder)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referidos (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  lider_id               INT          NOT NULL,
  cedula                 VARCHAR(20)  NOT NULL UNIQUE,
  nombre                 VARCHAR(100) NOT NULL,
  apellidos              VARCHAR(100) NOT NULL,
  sexo                   ENUM('MASCULINO','FEMENINO') NOT NULL,
  celular                VARCHAR(20)  NOT NULL,
  email                  VARCHAR(150) NULL,
  direccion              VARCHAR(200) NOT NULL,
  comuna_id              INT          NOT NULL,
  barrio_id              INT          NOT NULL,
  zona_id                INT          NOT NULL,
  puesto_id              INT          NOT NULL,
  fecha_nacimiento       DATE         NOT NULL,
  parentesco_id          INT          NOT NULL,
  voto_anterior          TINYINT(1)   NOT NULL DEFAULT 0,
  damnificado_terremoto  TINYINT(1)   NOT NULL DEFAULT 0,
  vehiculo               TINYINT(1)   NOT NULL DEFAULT 0,
  redes_sociales         TINYINT(1)   NOT NULL DEFAULT 0,
  orador_publico         TINYINT(1)   NOT NULL DEFAULT 0,
  cantante               TINYINT(1)   NOT NULL DEFAULT 0,
  testigo_electoral      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_referidos_lider      FOREIGN KEY (lider_id)      REFERENCES lideres(id) ON DELETE CASCADE,
  CONSTRAINT fk_referidos_comuna     FOREIGN KEY (comuna_id)     REFERENCES comunas(id),
  CONSTRAINT fk_referidos_barrio     FOREIGN KEY (barrio_id)     REFERENCES barrios(id),
  CONSTRAINT fk_referidos_zona       FOREIGN KEY (zona_id)       REFERENCES zonas(id),
  CONSTRAINT fk_referidos_puesto     FOREIGN KEY (puesto_id)     REFERENCES puestos(id),
  CONSTRAINT fk_referidos_parentesco FOREIGN KEY (parentesco_id) REFERENCES parentescos(id)
) ENGINE=InnoDB;

CREATE INDEX idx_referidos_lider ON referidos(lider_id);
CREATE INDEX idx_lideres_comuna ON lideres(comuna_id);
CREATE INDEX idx_lideres_zona ON lideres(zona_id);

-- =====================================================================
-- Datos semilla (catálogos básicos para empezar a probar de inmediato)
-- =====================================================================

INSERT INTO zonas (codigo, nombre) VALUES
  ('01', 'Zona 1'),
  ('02', 'Zona 2'),
  ('03', 'Zona 3')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO puestos (zona_id, numero, nombre, num_mesas) VALUES
  ((SELECT id FROM (SELECT id FROM zonas WHERE codigo='01') z), '01', 'I.E. Central', 8),
  ((SELECT id FROM (SELECT id FROM zonas WHERE codigo='01') z), '02', 'Coliseo Municipal', 12),
  ((SELECT id FROM (SELECT id FROM zonas WHERE codigo='02') z), '01', 'Escuela San José', 6),
  ((SELECT id FROM (SELECT id FROM zonas WHERE codigo='02') z), '02', 'Casa de la Cultura', 10),
  ((SELECT id FROM (SELECT id FROM zonas WHERE codigo='03') z), '01', 'Polideportivo Norte', 9)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO comunas (codigo, descripcion) VALUES
  ('01', 'Comuna 1 - Centro'),
  ('02', 'Comuna 2 - Norte'),
  ('03', 'Comuna 3 - Sur')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO barrios (comuna_id, nombre) VALUES
  ((SELECT id FROM (SELECT id FROM comunas WHERE codigo='01') c), 'El Centro'),
  ((SELECT id FROM (SELECT id FROM comunas WHERE codigo='01') c), 'La Estación'),
  ((SELECT id FROM (SELECT id FROM comunas WHERE codigo='02') c), 'Los Pinos'),
  ((SELECT id FROM (SELECT id FROM comunas WHERE codigo='02') c), 'Villa Norte'),
  ((SELECT id FROM (SELECT id FROM comunas WHERE codigo='03') c), 'San Fernando');

INSERT INTO profesiones (descripcion) VALUES
  ('Abogado(a)'), ('Ingeniero(a)'), ('Médico(a)'), ('Docente'),
  ('Contador(a)'), ('Comerciante'), ('Técnico(a)'), ('Ninguna'), ('Otra')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO ocupaciones (descripcion) VALUES
  ('Empleado(a)'), ('Independiente'), ('Estudiante'), ('Ama de casa'),
  ('Pensionado(a)'), ('Desempleado(a)'), ('Otra')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO parentescos (descripcion) VALUES
  ('Padre'), ('Madre'), ('Hijo(a)'), ('Hermano(a)'), ('Cónyuge'),
  ('Primo(a)'), ('Amigo(a)'), ('Vecino(a)'), ('Otro')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

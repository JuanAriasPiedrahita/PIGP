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
  descripcion VARCHAR(150) NOT NULL UNIQUE,
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

-- Zonas reales (14 zonas). Los puestos de votación de cada zona se capturan
-- desde el menú "Zonas" de la aplicación; no se siembran datos de ejemplo.
INSERT INTO zonas (codigo) VALUES
  ('01'),('02'),('03'),('04'),('05'),('06'),('07'),('08'),('09'),('10'),('11'),
  ('90'),('98'),('99')
ON DUPLICATE KEY UPDATE codigo = VALUES(codigo);

-- Comunas y barrios reales (Pereira). El orden de inserción determina el id
-- autoincremental (1..20) que usan los barrios de abajo vía comuna_id;
-- esto asume una base de datos recién creada (sin filas previas en estas tablas).
INSERT INTO comunas (descripcion) VALUES
  ('Boston'),
  ('Centro'),
  ('Consotá'),
  ('Cuba'),
  ('Del café'),
  ('Jardin'),
  ('El Oso'),
  ('Poblado'),
  ('El Rocio'),
  ('Ferrocarril'),
  ('Olimpica'),
  ('Oriente'),
  ('Perla del Otún'),
  ('Rio Otún'),
  ('San Joaquín'),
  ('San Nicolás'),
  ('Universidad'),
  ('Villa Santana'),
  ('Vilavicencio'),
  ('Corr Altagracia')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO barrios (nombre, comuna_id) VALUES
	('Belalcázar', 1), ('Bosques de la Salle', 1), ('Boston', 1), ('Caminos de Canaán', 1),
	('Centenario', 1), ('Central', 1), ('Ciudad Palermo', 1), ('Ciudad Pereira', 1),
	('El Vergel', 1), ('Gaviotas', 1), ('Guaduales de Canaán', 1), ('La Arboleda', 1),
	('La Florida', 1), ('La Laguna', 1), ('La Lorena I', 1), ('La Lorena II', 1),
	('La Lorena III', 1), ('La Lorena IV', 1), ('La Platanera', 1), ('La Unidad', 1),
	('Las Gaviotas', 1), ('Los Almendros', 1), ('Los Profesionales', 1), ('Mejía Robledo', 1),
	('Olaya Herrera', 1), ('Pereira', 1), ('Providencia', 1), ('San Luis Gonzaga', 1),
	('San Remo', 1), ('Santa Catalina II', 1), ('Terminal', 1), ('Travesuras - La Churria', 1),
	('Tulcán I', 1), ('Tulcán II', 1), ('Tulcán III', 1), ('Vasconia', 1),
	('Venecia', 1), ('Verona', 1), ('Villa Colombia', 1), ('Villa del Sol', 1),
	('Bloques Primero de Febrero', 2), ('Buenos Aires', 2), ('La Paz', 2), ('La Victoria', 2),
	('Las Garzas', 2), ('Los Nogales', 2), ('Los Periodistas', 2), ('Primero de Febrero', 2),
	('El Porvenir', 2), ('San Esteban', 2), ('Santander', 2), ('30 de Agosto', 2),
	('Galería Central', 2), ('Lago Uribe', 2), ('Parque La Libertad', 2), ('Plaza de Bolívar', 2),
	('Turín', 2), ('Venecia', 2), ('Aguas Claras', 3), ('Las Mercedes', 3),
	('Padre Valencia', 3), ('Bella Sardi', 3), ('Dorado I', 3), ('Dorado II', 3),
	('El Futuro', 3), ('El Rosal', 3), ('La Divisa', 3), ('Las Pirámides', 3),
	('Los Nogales', 3), ('Mirador de Bella Sardi', 3), ('Miraflores', 3), ('Naranjito', 3),
	('Normandía', 3), ('Panorama I', 3), ('Plan Camilo', 3), ('Porvenir', 3),
	('Quintas de Panorama I', 3), ('Quintas de Panorama II', 3), ('Restrepo', 3), ('Sinaí II', 3),
	('Vendedores Ambulantes', 3), ('Villa Andrea', 3), ('Villa Cecilia', 3), ('Panorama II', 3),
	('Villa de La Paz', 3), ('Villa Elena', 3), ('Barberos', 4), ('Brisas del Consotá', 4),
	('Cortés', 4), ('Cuba', 4), ('La Independencia', 4), ('La Playita', 4),
	('La Unión', 4), ('Rafael Uribe I', 4), ('San Fernando', 4), ('Sector A', 5),
	('Sector B', 5), ('Sector C', 5), ('Sector D', 5), ('Sector E', 5),
	('Comfamiliar', 5), ('Llano Grande', 5), ('Altos de Llano Grande', 5), ('Mirador de Llano Grande', 5),
	('Luis Alberto Duque', 5), ('Rincón del Café', 5), ('Málaga', 5), ('Sector Boquia', 5),
	('Bello Horizonte', 5), ('Los Ángeles', 5), ('Alameda del Café', 5), ('Guadualito', 5),
	('Alcázar de Maraya', 6), ('Altos de Tanambí', 6), ('Balcones Condominio', 6), ('Bosques de Santa Elena I', 6),
	('Bosques de Santa Elena II', 6), ('Brasilia', 6), ('Caminos de Maraya', 6), ('Cedritos', 6),
	('Jardín de Vélez y Vélez', 6), ('Jardín I', 6), ('Jardín II', 6), ('Jardín III', 6),
	('La Elvira', 6), ('Las Mangas', 6), ('Los Andes', 6), ('Los Arrayanes', 6),
	('Los Cedros', 6), ('Los Quimbayas', 6), ('Maraya', 6), ('Mayorca', 6),
	('Niza I', 6), ('Niza II', 6), ('Amatista', 6), ('Portal de Los Cedros', 6),
	('Rincón de Las Quintas', 6), ('San Luis', 6), ('30 de Agosto', 6), ('Villas del Jardín I', 6),
	('Villas del Jardín II', 6), ('Villas del Jardín III', 6), ('Alameda', 7), ('Alejandría', 7),
	('Altos de Panorama', 7), ('Cinco de Octubre', 7), ('El Acuario', 7), ('Even-Ezer', 7),
	('Guadalupe', 7), ('Hacienda Cuba', 7), ('Jaime Pardo Leal', 7), ('La Acuarela', 7),
	('La Bretaña', 7), ('La Floresta', 7), ('La Habana', 7), ('La Idalia', 7),
	('La Nueva Villa', 7), ('Villa Maria', 7), ('Villa del Carmen', 7), ('Libertador', 7),
	('Libertador II', 7), ('Los Cristales', 7), ('Los Pinos', 7), ('Villa del Sur', 7),
	('Panorama I, II y III', 7), ('Quinta de los Sauces', 7), ('San Felipe', 7), ('Terranova', 7),
	('Sauces I, II, III , IV y V', 7), ('Villa Elisa', 7), ('Villa Ligia', 7), ('Villa Navarra', 7),
	('Montelibano', 7), ('Balcones de Villa del Prado', 8), ('Barajas', 8), ('Cachipay', 8),
	('Hamburgo', 8), ('Poblado I', 8), ('Poblado II', 8), ('Rocío Bajo', 8),
	('Samaria I', 8), ('Samaria II', 8), ('Villa Verde', 8), ('Villa del Prado', 8),
	('Caracol La Curva', 9), ('Rocío Alto', 9), ('Sureste de La Sierra', 10), ('Gabriel Trujillo', 10),
	('José Hilario López I', 10), ('José Hilario López II', 10), ('La Hacienda', 10), ('La Libertad', 10),
	('Matecaña', 10), ('Portal de La Villa', 10), ('Simón Bolívar', 10), ('Torres de San Mateo', 10),
	('El Plumón', 10), ('El Plumón Alto', 10), ('El Plumón Bajo', 10), ('Nueva Esperanza', 10),
	('Alcázares', 11), ('Alfa', 11), ('Alhambra', 11), ('Altos de Belmonte', 11),
	('Belmonte', 11), ('Cañaveral II', 11), ('Colores de La Villa', 11), ('El Campín I, II y III', 11),
	('El Palmar', 11), ('El Pízamo', 11), ('Fegove', 11), ('Gamma I, II, III, IV y V', 11),
	('Jardines de La Villa', 11), ('La Glorieta', 11), ('La Villa', 11), ('Los Arreboles', 11),
	('Los Corales', 11), ('Los Nogales', 11), ('Mirador de La Cien', 11), ('Multifamiliar La Villa', 11),
	('Olímpico I y II', 11), ('Pinar de Belmonte', 11), ('Pinar de Gamma', 11), ('Reserva de La Villa', 11),
	('Rincón de La Palma', 11), ('Rincón de La Villa', 11), ('Samanes de Belmonte', 11), ('San Felipe', 11),
	('Santa Cruz de Gamma', 11), ('Santa Mónica', 11), ('Toluca', 11), ('Villa Alicia', 11),
	('Villa Ilusión', 11), ('Villa de La Madrid', 11), ('20 de Julio', 12), ('Alfonso López', 12),
	('Altos del Otún', 12), ('Antonio Nariño', 12), ('Arboleda del Río', 12), ('Brisas del Otún', 12),
	('Castaño Robledo', 12), ('Cesar Nader Nader', 12), ('Chicó Restrepo', 12), ('El Pízamo', 12),
	('Hernando Vélez Marulanda', 12), ('Kennedy', 12), ('La Pupi', 12), ('La Rivera', 12),
	('Ormaza', 12), ('Paz del Río', 12), ('Pimpollo - Libare', 12), ('San Francisco', 12),
	('San Gregorio', 12), ('Santander', 12), ('Simón Bolívar', 12), ('Av Ferrocarril', 12),
	('Consotá', 13), ('Aranjuez', 13), ('Carlos Alberto Benavides', 13), ('Departamento', 13),
	('Villa del Bosque', 13), ('El Paraíso', 13), ('Gaviria Trujillo', 13), ('Héroes I y II', 13),
	('Independientes', 13), ('José Domingo Escobar', 13), ('La Albania', 13), ('La Campiña', 13),
	('La Francia', 13), ('La Policía', 13), ('Los Almendros', 13), ('Metropolitano', 13),
	('Neyra Márquez', 13), ('Sinaí', 13), ('Villa Kennedy', 13), ('Villa María', 13),
	('Villa Rocio', 13), ('América', 14), ('Bavaria', 14), ('Byron Gaviria', 14),
	('Campiña del Otún', 14), ('Colinas del Triunfo', 14), ('Constructores', 14), ('El Prado', 14),
	('El Progreso', 14), ('El Triunfo', 14), ('Enrique Millán Rubio', 14), ('Getsemaní', 14),
	('Gualanday', 14), ('Jorge Eliecer Gaitán', 14), ('José Antonio Galán', 14), ('José Martí', 14),
	('La Esperanza', 14), ('La Palmera', 14), ('La Sirena', 14), ('Las Palmas', 14),
	('Los Alcázares', 14), ('Mirasol', 14), ('Nuevo Peñol', 14), ('Primero de Mayo', 14),
	('Cañarte', 14), ('Risaralda', 14), ('Salazar Londoño', 14), ('Salazar Robledo', 14),
	('Salvador Allende', 14), ('San Antonio', 14), ('San Camilo', 14), ('San Jorge', 14),
	('San Juan', 14), ('San Juan de Dios', 14), ('Santa Elena', 14), ('Santa Teresita', 14),
	('Zea', 14), ('Altos de Corales', 15), ('Atenas', 15), ('Bello Horizonte', 15),
	('Campo Alegre', 15), ('Ciudadela Comfamiliar I y II', 15), ('Codelmar I, II, III y IV', 15), ('Coralina', 15),
	('El Cardal', 15), ('El Crucero', 15), ('El Edén', 15), ('El Recreo', 15),
	('Gibraltar', 15), ('Guayacanes', 15), ('José María Córdoba', 15), ('La Isla', 15),
	('Laureles I y II', 15), ('Leningrado I, II y III', 15), ('Letras', 15), ('Los Cisnes', 15),
	('Los Conquistadores', 15), ('Los Geranios', 15), ('Los Girasoles', 15), ('Palmacera', 15),
	('Perla del Sur', 15), ('Plan Carvajal', 15), ('Portal de Corales', 15), ('Portal de San Joaquín I y II', 15),
	('Portales de Birmania', 15), ('Rafael Uribe I, II y III', 15), ('San Joaquín', 15), ('San Marcos', 15),
	('Puertas de Alcalá', 15), ('Campiñas de Alcalá', 15), ('Santa Clara de Las Villas', 15), ('Bulevar del Bosque', 15),
	('Santa Juana de Las Villas', 15), ('Bulevar de las Villas', 15), ('Tinajas', 15), ('Alta Vista', 15),
	('Guadalcanal I II', 15), ('Brisas de Las Américas', 16), ('La Dulcera', 16), ('Las Antillas', 16),
	('Nuevo México (Los Molinos)', 16), ('San Martin de Loba', 16), ('San Nicolás', 16), ('Villa Mery', 16),
	('Villa Nohemy', 16), ('Altos de Canaán', 17), ('Cámbulos', 17), ('Canaán', 17),
	('Ciudad Jardín', 17), ('El Bosque', 17), ('Favi UTP', 17), ('La Aurora', 17),
	('La Enseñanza', 17), ('La Julita', 17), ('La Julia', 17), ('La Parcela', 17),
	('La Sierra', 17), ('Los Álamos', 17), ('Los Alpes', 17), ('Los Ángeles', 17),
	('Los Rosales', 17), ('Pinares de San Martin', 17), ('Popular Modelo', 17), ('Puerta de Abacanto', 17),
	('Quintanar del Cerro', 17), ('San José', 17), ('San José Sur', 17), ('Villa Los Álamos', 17),
	('Bellavista', 18), ('Tokio', 18), ('Comfamiliar Villasantana', 18), ('El Danubio', 18),
	('El Otoño', 18), ('Intermedio', 18), ('La Isla', 18), ('Las Brisas', 18),
	('Las Margaritas', 18), ('Monserrate', 18), ('Nuevo Plan', 18), ('San Vicente', 18),
	('Veracruz I y II', 18), ('El Remanso', 18), ('Guayabal', 18), ('Berlín', 19),
	('Corocito', 19), ('Los Andes', 19), ('Villavicencio', 19), ('Vereda La Una', 20),
	('Vereda El Kiosko', 20), ('Vereda Filo Bonito', 20), ('Andalucia', 6), ('La Castellana', 6);

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

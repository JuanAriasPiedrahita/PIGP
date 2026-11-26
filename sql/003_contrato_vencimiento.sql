-- =====================================================================
-- Agrega a `parametros` el correo del gestor de contratos y el asunto de
-- la plantilla "Vencimiento contratos" (Configuración > Plantillas).
-- El envío automático en sí se agrega más adelante, junto con el evento
-- que lo dispare.
--
-- El servidor de MySQL de producción no acepta la cláusula
-- "ADD COLUMN IF NOT EXISTS" (da error de sintaxis 1064), así que la
-- idempotencia se logra con un procedimiento temporal que verifica en
-- information_schema si la columna ya existe antes de agregarla.
--
-- Este archivo usa DELIMITER y debe ejecutarse con el cliente `mysql`
-- (por ejemplo `mysql -h <host> -u <user> -p <db> < sql/003_contrato_vencimiento.sql`
-- o `mysql ... < archivo` dentro del contenedor/servidor). No pegar su
-- contenido con `-e "..."` ni ejecutarlo por un driver que no entienda
-- DELIMITER (p. ej. mysql2 con multipleStatements): en ese caso, quitar
-- las líneas "DELIMITER" (el cuerpo del procedimiento funciona igual,
-- el servidor interpreta correctamente los ";" internos del BEGIN...END).
-- =====================================================================

USE PIGP;

DELIMITER $$

DROP PROCEDURE IF EXISTS pigp_add_column_if_missing $$

CREATE PROCEDURE pigp_add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_ddl VARCHAR(500)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
  ) THEN
    SET @ddl = p_ddl;
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DELIMITER ;

CALL pigp_add_column_if_missing(
  'parametros', 'correo_gestion_contratos',
  'ALTER TABLE parametros ADD COLUMN correo_gestion_contratos VARCHAR(150) NOT NULL DEFAULT '''' AFTER despacho_automatico_vencimiento_gestion'
);

CALL pigp_add_column_if_missing(
  'parametros', 'plantilla_vencimiento_contrato_asunto',
  'ALTER TABLE parametros ADD COLUMN plantilla_vencimiento_contrato_asunto VARCHAR(200) NOT NULL DEFAULT ''Vencimiento de contrato próximo'' AFTER correo_gestion_contratos'
);

DROP PROCEDURE IF EXISTS pigp_add_column_if_missing;

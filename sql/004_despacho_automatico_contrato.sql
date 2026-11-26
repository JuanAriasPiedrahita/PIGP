-- =====================================================================
-- Agrega a `parametros` el flag de despacho automático de la alerta de
-- vencimiento de contrato (checkbox "Enviar alertas de vencimiento
-- contrato" en Configuración > Parámetros). Nace apagado (0): a
-- diferencia de los otros despachos automáticos, esta es una
-- funcionalidad nueva y conviene que el administrador revise la
-- plantilla y el correo destinatario antes de activarla.
--
-- El MySQL de producción no soporta "ADD COLUMN IF NOT EXISTS" (ver
-- 003_contrato_vencimiento.sql), así que se usa el mismo patrón de
-- procedimiento temporal + information_schema para que la migración
-- siga siendo idempotente. Ejecutar sourceando el archivo completo con
-- el cliente `mysql` (no con -e, por el DELIMITER).
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
  'parametros', 'despacho_automatico_vencimiento_contrato',
  'ALTER TABLE parametros ADD COLUMN despacho_automatico_vencimiento_contrato TINYINT(1) NOT NULL DEFAULT 0 AFTER plantilla_vencimiento_contrato_asunto'
);

DROP PROCEDURE IF EXISTS pigp_add_column_if_missing;

-- =====================================================================
-- Agrega a `parametros` el correo del gestor de contratos y el asunto de
-- la plantilla "Vencimiento contratos" (Configuración > Plantillas).
-- El envío automático en sí se agrega más adelante, junto con el evento
-- que lo dispare.
-- =====================================================================

USE PIGP;

-- En dos ALTER TABLE separados (una columna cada uno): algunas versiones de
-- MySQL no aceptan varias cláusulas "ADD COLUMN IF NOT EXISTS ... AFTER x"
-- combinadas en una sola sentencia cuando la segunda referencia una columna
-- (AFTER) que la primera cláusula de la misma sentencia acaba de agregar.
ALTER TABLE parametros
  ADD COLUMN IF NOT EXISTS correo_gestion_contratos VARCHAR(150) NOT NULL DEFAULT '' AFTER despacho_automatico_vencimiento_gestion;

ALTER TABLE parametros
  ADD COLUMN IF NOT EXISTS plantilla_vencimiento_contrato_asunto VARCHAR(200) NOT NULL DEFAULT 'Vencimiento de contrato próximo' AFTER correo_gestion_contratos;

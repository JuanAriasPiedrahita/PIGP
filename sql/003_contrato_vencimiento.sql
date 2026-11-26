-- =====================================================================
-- Agrega a `parametros` el correo del gestor de contratos y el asunto de
-- la plantilla "Vencimiento contratos" (Configuración > Plantillas).
-- El envío automático en sí se agrega más adelante, junto con el evento
-- que lo dispare.
-- =====================================================================

USE PIGP;

ALTER TABLE parametros
  ADD COLUMN IF NOT EXISTS correo_gestion_contratos VARCHAR(150) NOT NULL DEFAULT '' AFTER despacho_automatico_vencimiento_gestion,
  ADD COLUMN IF NOT EXISTS plantilla_vencimiento_contrato_asunto VARCHAR(200) NOT NULL DEFAULT 'Vencimiento de contrato próximo' AFTER correo_gestion_contratos;

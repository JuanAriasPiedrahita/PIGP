-- =====================================================================
-- Parámetros configurables desde Configuración > Parámetros.
-- Tabla de una sola fila (id fijo = 1); antes vivían como variables de
-- .env a discreción del administrador del sistema.
-- =====================================================================

USE PIGP;

CREATE TABLE IF NOT EXISTS parametros (
  id                                       TINYINT      NOT NULL PRIMARY KEY DEFAULT 1,
  sentinel_birth_year                      SMALLINT     NOT NULL DEFAULT 1900,
  contrato_meses_alerta                    TINYINT      UNSIGNED NOT NULL DEFAULT 1,
  gestiones_vencimiento_dias_alerta         TINYINT      UNSIGNED NOT NULL DEFAULT 2,
  lideres_page_size                        SMALLINT     UNSIGNED NOT NULL DEFAULT 15,
  plantilla_gestion_nueva_asunto           VARCHAR(200) NOT NULL DEFAULT 'Nueva gestión asignada',
  plantilla_cumpleanos_lider_asunto        VARCHAR(200) NOT NULL DEFAULT '¡Feliz cumpleaños!',
  plantilla_vencimiento_gestion_asunto     VARCHAR(200) NOT NULL DEFAULT 'Gestión próxima a vencer',
  despacho_automatico_cumpleanos           TINYINT(1)   NOT NULL DEFAULT 1,
  despacho_automatico_vencimiento_gestion  TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at                               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_parametros_id CHECK (id = 1)
) ENGINE=InnoDB;

-- Fila única con los valores que hoy están en .env. INSERT IGNORE: si la
-- fila ya existe (re-ejecución de este script), no se pisan valores que el
-- administrador ya haya editado desde la UI.
INSERT IGNORE INTO parametros (
  id, sentinel_birth_year, contrato_meses_alerta, gestiones_vencimiento_dias_alerta,
  lideres_page_size, plantilla_gestion_nueva_asunto, plantilla_cumpleanos_lider_asunto,
  plantilla_vencimiento_gestion_asunto, despacho_automatico_cumpleanos, despacho_automatico_vencimiento_gestion
) VALUES (
  1, 1900, 1, 2, 15, 'Nueva gestión asignada', '¡Feliz cumpleaños!', 'Gestión próxima a vencer', 1, 1
);

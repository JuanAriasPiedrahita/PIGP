# Foto de líder: iconos editar/eliminar + opción de borrar foto

## Contexto
`PhotoUpload` (componente compartido) usa un botón de texto "Cambiar foto"/
"Subir foto" y no permite quitar una foto ya guardada. Se usa en el form de
Líderes del panel admin (`LiderForm.tsx`) y en "Mi Cuenta" de `/captura`
(`CapturaPerfilForm.tsx`), ambos contra el mismo backend de líderes.

## Plan

- [x] 1. `src/components/ui/PhotoUpload.tsx`: cuando hay foto (preview), mostrar
      dos botones-icono en vez del botón de texto: lápiz (cambiar foto, abre
      el file picker) y papelera (eliminar foto). Sin foto, mantener el botón
      "Subir foto" tal cual (no hay nada que eliminar). Nuevo prop opcional
      `onRemove?: () => void` que se dispara al hacer click en la papelera,
      además de limpiar el preview local y notificar `onFileSelected(null)`.
- [x] 2. `src/components/lideres/LiderForm.tsx`: estado `eliminarFoto`, se
      activa con `onRemove`, se desactiva si el usuario elige un archivo nuevo
      después. Al enviar el form: si hay `fotoFile` se manda como ahora; si no
      y `eliminarFoto` es true, se manda `eliminar_foto=true`.
- [x] 3. `src/components/captura/CapturaPerfilForm.tsx`: mismo cambio que el
      punto 2.
- [x] 4. `src/app/api/lideres/[id]/route.ts` (PUT): si llega `eliminar_foto=true`
      y no llega un archivo nuevo, borrar el archivo físico existente
      (`deletePhoto`) y guardar `foto=NULL`.
- [x] 5. `src/app/api/captura/perfil/route.ts` (PUT): mismo cambio que el punto 4.
- [x] 6. Verificar `npx tsc --noEmit` sin errores.

## Revisión final

- `PhotoUpload` ahora muestra, cuando ya hay una foto, dos botones-icono
  (lápiz = cambiar, papelera = eliminar) en vez del botón de texto "Cambiar
  foto". Sin foto sigue mostrando "Subir foto" igual que antes.
- Al eliminar, el formulario manda `eliminar_foto=true` en vez del archivo;
  si el usuario luego elige una foto nueva, esa bandera se desactiva sola.
- Ambos backends (`/api/lideres/[id]` y `/api/captura/perfil`) borran el
  archivo físico existente y guardan `foto=NULL` cuando llega esa bandera sin
  un archivo nuevo.
- `npx tsc --noEmit` sin errores.

## Fuera de alcance
- El form de creación de líder (sin foto todavía) no necesita el botón de
  eliminar — solo aplica a edición cuando ya existe una foto guardada.
- No se toca `MultiPhotoUpload` (usado en Gestiones, es un componente distinto
  con su propia lógica de múltiples fotos).

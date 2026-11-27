# Paginación en Referidos + ajuste de texto en Parámetros

## Contexto
La lista de Líderes ya tiene paginación client-side (carga todos los
registros filtrados y los pagina en el navegador), usando
`parametros.lideres_page_size` como tamaño de página inicial, con un
input para cambiarlo localmente y controles de primera/anterior/
siguiente/última página. Se pide el mismo comportamiento en Referidos,
reutilizando el mismo parámetro `lideres_page_size`. También se pide
renombrar el label de ese parámetro en Configuración > Parámetros (ya
no es solo para líderes) y agregar un hint.

## Plan
- [x] `src/app/referidos/page.tsx`: agregar `page`/`pageSize` (inicializado
      desde `GET /api/parametros` → `lideres_page_size`), calcular
      `totalPages`/`paginaActual`/`paginaReferidos` igual que en
      `lideres/page.tsx`, resetear a página 1 en cada `load()`, y
      agregar los mismos controles de paginación (primera/anterior/
      siguiente/última página + input "Registros por página") debajo
      de la tabla.
- [x] `src/components/catalogos/ParametrosManager.tsx`: cambiar el label
      "Registros por página (listado de líderes)" por "Registros por
      página" y agregar `hint="Se aplica en lista de líderes y
      referidos"`.
- [x] Verificar `tsc --noEmit`.

## Fuera de alcance
- Subir y desplegar: en un paso aparte, cuando el usuario lo apruebe.

## Revisión

- Referidos ahora pagina igual que Líderes: carga todos los registros
  filtrados y los pagina en el navegador, con tamaño de página inicial
  tomado de `parametros.lideres_page_size` y controles de primera/
  anterior/siguiente/última página + input para cambiarlo localmente.
- En Configuración > Parámetros, el campo se renombró a "Registros por
  página" con el hint "Se aplica en lista de líderes y referidos", ya
  que ahora aplica a ambas listas.
- Verificado con `tsc --noEmit` sin errores.

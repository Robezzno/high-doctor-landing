# `legacy/` — web antigua (sólo referencia)

Aquí está la web anterior a Astro, tal cual estaba en producción: `index.html`,
`script.js`, `style.css` y `assets/`.

- **No entra en el build.** Astro sólo compila `src/`, así que esta carpeta se
  queda como referencia visual y como fuente del texto de los diccionarios
  (`src/i18n/*.json`, extraídos de `translations` en `legacy/script.js`).
- Sirve para comparar la web nueva con la antigua: `python3 -m http.server 8010 --directory legacy`
  y abrir `http://localhost:8010/`.
- No se toca salvo para consultar. Los cambios de diseño van en `src/`.

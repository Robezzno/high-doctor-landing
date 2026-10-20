# Cómo publicar una noticia (y cómo parar Instagram)

Dos cosas prácticas del día a día. El contrato del contenido está en
`docs/CONTENIDO.md`; la puesta en marcha de Instagram, en
`docs/INSTAGRAM-SETUP.md`.

---

## Publicar una noticia

1. Escribe el post siguiendo `docs/CONTENIDO.md` (a mano, con Pages CMS o con el
   bot: el formato es el mismo).
2. En el frontmatter, decide qué pasa con Instagram:

   ```yaml
   instagram: 'pending'   # se publicará sola en Instagram
   instagram: 'off'       # no se publica en Instagram, nunca
   instagram: 'published' # ya está publicada (lo escribe el flujo, no tú)
   ```

3. Commit y push a `main`. El deploy publica la web y genera la tarjeta
   `/social/<lang>/<slug>.jpg`.
4. Si el deploy va bien y `IG_ENABLED` vale `true`, se lanza solo **Reclamo en
   Instagram**.

### Ver qué va a salir antes de que salga

GitHub → **Actions** → **Reclamo en Instagram** → **Run workflow** → deja
marcado **dry run** → **Run workflow**. El resumen imprime el caption y la URL
de la tarjeta sin publicar nada.

Si prefieres verlo en local: `cd bot && npm run instagram:dry-run` (no llama a
Instagram y no escribe nada).

### Lanzarlo a mano (sin dry run)

Mismo botón, pero **desmarca** la casilla *dry run*. Publica sólo lo que esté en
`instagram: 'pending'` con fecha de hoy o anterior.

---

## Parar Instagram en un clic (botón del pánico)

Todo depende de una única variable de repositorio: **`IG_ENABLED`**.

**Desde la web de GitHub**

1. Repo → **Settings** → **Secrets and variables** → **Actions** →
   pestaña **Variables**.
2. Busca `IG_ENABLED` → **Edit** (o **New repository variable** si no existe).
3. Pon `false` y guarda.

**Desde la terminal**

```bash
gh variable set IG_ENABLED --body false   # apagar
gh variable set IG_ENABLED --body true    # volver a encender
```

Qué pasa con `false`: el workflow **Reclamo en Instagram** arranca y sale sin
hacer nada, sin error. No se publica nada en Instagram y no se toca ningún post.
La web y el bot de noticias no se enteran: siguen funcionando igual.

Ojo: **no** se apaga sólo el bot de noticias ni el deploy. Es sólo Instagram.

### Parar sólo una noticia

Cambia su frontmatter a `instagram: 'off'` en las dos versiones (ES y EN) y haz
commit. El flujo sólo publica lo que esté en `pending`.

### Volver a publicar algo que se quedó a medias

1. Mira el resumen de la última ejecución: dice el motivo del fallo.
2. Arréglalo (token caducado, imagen que no existe, cuenta despublicada…).
3. Vuelve a poner `instagram: 'pending'` si el post se quedó en `off` tras 3
   fallos.
4. **Run workflow** en **Reclamo en Instagram**, con o sin dry run.

Los posts que ya salieron llevan `instagramId` y están en `published`: relanzar
el workflow **nunca los duplica**.

---

## Qué mirar cuando algo no sale

| Sitio | Qué te dice |
|---|---|
| Actions → **Reclamo en Instagram** → resumen | Qué posts ha publicado, cuáles ha omitido y por qué |
| `bot/state/instagram.json` | Cuántas veces ha fallado cada post (a los 3 pasa a `off`) |
| Actions → **Refrescar el token de Instagram** | Si el token mensual se ha renovado (en rojo = hay que generar uno nuevo) |
| `docs/INSTAGRAM-SETUP.md` → *Si algo falla* | Tabla de errores con la solución |

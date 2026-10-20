<<<<<<< HEAD
# Cómo publicar una noticia

Guía corta para escribir en el blog **sin tocar código**. Si algo no sale, al final
está «Si algo falla».

Antes de empezar: el blog está en **https://highdoctor.foundation/noticias/** (español)
y **https://highdoctor.foundation/en/news/** (inglés). El resto de idiomas de la web
muestran las noticias en inglés.

---

## 1. Entrar en el editor (sólo la primera vez hace falta configurar)

1. Abre **https://app.pagescms.org** en el móvil o en el ordenador.
2. Pulsa **Sign in with GitHub** y entra con la cuenta `Robezzno`.
3. La primera vez GitHub te pedirá **instalar la app de Pages CMS** en tu cuenta:
   acepta y dale acceso al repositorio **`Robezzno/high-doctor-landing`**.
4. Elige ese repositorio. Ya estás dentro: a la izquierda verás
   **Noticias (Español)**, **News (English)** y **Media**.

Las siguientes veces basta con entrar en app.pagescms.org: el repositorio queda
guardado.

## 2. Crear una noticia

1. Entra en **Noticias (Español)**.
2. Pulsa el **+** de arriba a la derecha.
3. Rellena los campos de arriba abajo:
   - **Titular**: el título. Máximo 90 caracteres.
   - **Entradilla**: una o dos frases de resumen. Máximo 200 caracteres. Sale en el
     listado, en Google y en el pie de la foto de Instagram.
   - **Texto de la noticia**: escribe normal. Negritas, listas, enlaces y subtítulos
     funcionan con los botones del editor. No repitas el titular como título.
   - **Fecha**: viene con la de hoy. Cámbiala sólo si quieres otra.
   - **Categoría**: elige una. Decide el color de la tarjeta y la página de categoría.
   - **Etiquetas**: opcional, en minúsculas. Pulsa **Add an item** para añadir una
     casilla por etiqueta.
   - **Foto de portada**: pulsa **Upload** y súbela desde el móvil o el PC. Mejor
     horizontal y no muy grande: la web la recorta y la optimiza sola. Si no subes
     foto, la portada es la tarjeta que se genera automáticamente.
   - **Descripción de la foto**: qué se ve, para quien no puede verla. Obligatoria si
     pones foto.
   - **Instagram**: elige **Publicar en Instagram** o **No publicar** (ver punto 5).
   - **Frase para la imagen de Instagram**: opcional, máximo 80 caracteres. Si la
     dejas vacía se usa el titular.
   - **Clave de traducción**: un identificador corto, en minúsculas y con guiones
     (por ejemplo `foundation-launch`). Ver punto 4.
   - **Borrador**: déjalo apagado para publicar (ver punto 6).
4. Pulsa **Save**. Arriba a la derecha también aparece el nombre del fichero
   (`2026-10-21-titular-de-la-noticia.md`): déjalo como está.

## 3. Guardar = publicar (1–2 minutos)

Al guardar, Pages CMS guarda el cambio en GitHub y la web se reconstruye sola.

- Espera **1 o 2 minutos** y recarga **https://highdoctor.foundation/noticias/**.
  Si usas el móvil, cierra la pestaña y vuelve a abrirla: a veces el navegador
  guarda la versión antigua.
- Si has escrito la versión en inglés, aparecerá en **/en/news/**.
- No hace falta avisar a nadie ni tocar GitHub.

## 4. Versión en inglés

1. Crea la noticia en **News (English)** con los mismos datos: **misma fecha,
   misma categoría y la misma «Clave de traducción»**.
2. Con eso, cada versión enlaza con la otra y los posts relacionados coinciden.
3. El titular y el texto pueden ser distintos: son dos textos, no una traducción
   automática.
4. Si sólo la publicas en un idioma, no pasa nada: se queda así.

## 5. ¿Va a Instagram o no?

- **Publicar en Instagram**: la noticia entra en la cola y se publicará en la cuenta
  cuando esté activo el envío automático (prompt 08). **Es lo que viene marcado por
  defecto.**
- **No publicar**: se queda sólo en la web. Elige esto si no la quieres en cola.
- **Ya publicado (lo marca el sistema)**: no lo toques, lo pone el sistema cuando ya
  ha salido en Instagram.
- El estado «Publicar en Instagram» **no** quiere decir que salga al instante: la
  cuenta de Instagram todavía no está conectada. Mientras no lo esté, cambia a
  **No publicar** si no quieres que quede en cola.

**Pausar Instagram del todo** (cuando el prompt 08 esté hecho): GitHub →
`Robezzno/high-doctor-landing` → **Settings** → **Secrets and variables** →
**Actions** → pestaña **Variables** → `IG_ENABLED` → **Edit** → valor `false` →
**Update variable**. Con `false` no se publica nada en Instagram aunque las noticias
estén en cola; con `true` vuelve a funcionar. *(Esa variable todavía no existe: llega
con el prompt 08.)*

## 6. Dejarla como borrador

- Activa **Borrador** y guarda: la noticia **no aparece** en la web, pero sigue
  guardada y se puede seguir editando.
- Cuando quieras publicarla, desactiva **Borrador** y guarda.

## 7. Quitar una noticia

- **Ocultarla sin borrarla**: activa **Borrador** y guarda. Desaparece de la web en
  1–2 minutos y no se pierde el texto.
- **Borrarla del todo**: abre la noticia, pulsa el menú **⋮** (arriba a la derecha,
  junto a Save) → **Delete** → confirma. Tarda lo mismo, 1–2 minutos.
- No borres ni renombres el fichero desde GitHub: si cambia el nombre, cambia la
  dirección de la noticia y los enlaces que ya hay por ahí dejan de funcionar.

## 8. Si algo falla

Cuando guardas, GitHub comprueba la noticia automáticamente. Si algo no cuadra:

- La web **sigue como estaba** (no se publica nada roto).
- GitHub te avisará (correo o notificación) y en el repo aparecerá un comentario
  automático que dice qué campo falla (por ejemplo: «summary: too long», una
  categoría que no existe o una foto que no se encuentra).
- Arregla ese campo en el CMS y vuelve a guardar. Si todo está bien no habrá
  comentario nuevo y la comprobación saldrá en verde.
- Los límites que no se pueden pasar: titular 90 caracteres, entradilla 200,
  frase de Instagram 80. Si te pasas, el editor no te deja guardar y lo dice.

## 9. Tres cosas que no se tocan

1. **Clave de traducción**: el mismo valor en la versión ES y EN del mismo post.
2. **El nombre del fichero**: no lo cambies después de publicar.
3. **La fecha**: si la pones en el futuro, la noticia cuenta como la más reciente
   para ordenar el listado, pero no se programa sola.

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
>>>>>>> feat/instagram

---


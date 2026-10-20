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

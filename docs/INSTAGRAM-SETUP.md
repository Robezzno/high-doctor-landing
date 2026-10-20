# Instagram: cómo dejarlo funcionando (guía para Saf)

Esto es lo que hay que hacer **una vez**, a mano, en el ordenador. Son unos 20
minutos y no cuesta dinero. Cuando termines, cada noticia nueva que se marque con
`instagram: pending` saldrá sola en la cuenta de Instagram con su tarjeta y su
pie de foto.

> **Comprobado el 2026-10-20** contra la documentación oficial de Meta:
> <https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login>
> y <https://developers.facebook.com/docs/instagram-platform/content-publishing>.
> Meta cambia los menús a menudo. Si un botón no se llama exactamente así, busca
> el equivalente más cercano: el orden de los pasos sí es el correcto.

---

## Antes de empezar

Necesitas:

- La cuenta de Instagram de High Doctor (**@highdoctor.foundation** o la que sea)
  y su contraseña.
- Un ordenador con navegador. Desde el móvil no se puede hacer el paso 3.
- Nada más. Ni tarjeta, ni servidor, ni página de Facebook: la API que usamos
  (*Instagram API with Instagram Login*) **no necesita página de Facebook**.

Lo que **no** se usa: los bots antiguos (`high-doctor-channel`, `instagrapi`) se
saltan la app oficial y finge que son un móvil. Instagram los detecta y bloquea
o cierra la cuenta. Aquí se usa la API oficial, que es gratis y legal.

---

## Paso 1 — Pasar la cuenta a Profesional

1. Abre Instagram en el móvil con la cuenta de High Doctor.
2. **Perfil → menú (las tres rayas) → Configuración y privacidad**.
3. Busca **Tipo de cuenta y herramientas** → **Cambiar a cuenta profesional**.
4. Elige **Empresa** (o **Creador**, da igual para esto).
5. En "Categoría", elige algo como *Organización sin ánimo de lucro* o
   *Educación*. No es definitivo, se puede cambiar.

Si ya pone "Cuenta profesional", salta al paso 2.

**Importante:** la cuenta tiene que ser **pública**. Si es privada, la API no
puede publicar.

---

## Paso 2 — Hacerte desarrollador de Meta (gratis)

1. Entra en <https://developers.facebook.com> e inicia sesión con **tu cuenta de
   Facebook personal** (no hace falta que la cuenta de Instagram tenga Facebook).
2. Arriba a la derecha: **Empezar** / **Get started**. Acepta las condiciones.
3. Verifica tu email y tu teléfono cuando te lo pida. Es un SMS o un correo, sin
   coste.

---

## Paso 3 — Crear la app

1. Entra en <https://developers.facebook.com/apps> y pulsa **Crear aplicación**
   (o **Crear primera aplicación**).
2. **Nombre:** `High Doctor Foundation`. **Email de contacto:** el tuyo.
3. **Caso de uso:** elige **Otros** (en inglés, *Other*) y pulsa **Siguiente**.
   - Los documentos de Meta ya no listan el caso de uso "Gestionar mensajes y
     contenido en Instagram": el camino actual es **Otros** y luego añadir el
     producto de Instagram (paso 4). Si tu pantalla sí lo ofrece, también sirve.
4. **Tipo de aplicación:** **Empresa** (*Business*). Es obligatorio: sin esto no
   aparece el producto de Instagram.
5. Pulsa **Crear aplicación** y te lleva al panel de la app.

---

## Paso 4 — Añadir el producto de Instagram

1. En el panel, baja hasta la lista de productos y busca **Instagram**.
2. Pulsa **Configurar** (*Set up*).
3. Te ofrece dos formas de usar la API. Elige **Instagram API con el inicio de
   sesión con Instagram** (*Instagram API with Instagram Login*).
   - **No** elijas la que dice "con el inicio de sesión con Facebook": esa
     necesita una página de Facebook y no es la nuestra.

---

## Paso 5 — Añadir la cuenta de Instagram

1. Dentro de **Instagram → Configuración de la API con el inicio de sesión con
   Instagram** (*API setup with Instagram login*), busca el bloque
   **Generar identificadores de acceso** (*Generate access tokens*).
2. Pulsa **Añadir cuenta** (*Add account*) e inicia sesión con la cuenta de High
   Doctor.
3. Acepta los permisos que te pide la app de Instagram.

Si te aparece una invitación en el móvil, acéptala en **Instagram → Configuración
y privacidad → Apps y sitios web → Invitaciones de probador** (*Tester
invitations*). La cuenta queda añadida y se puede quitar o cambiar en **Roles de
la aplicación → Roles**.

---

## Paso 6 — Generar el token y copiar el ID

1. En el mismo bloque, pulsa **Generar identificador** (*Generate token*) y
   marca **los dos permisos**:
   - `instagram_business_basic` → leer la cuenta.
   - `instagram_business_content_publish` → publicar.
   - (No hacen falta `manage_messages` ni `manage_comments`: no los pedimos.)
2. Inicia sesión otra vez si te lo pide y **copia el token**. Es un texto largo
   que empieza por `IGQV...`.
   - Ese token **es la llave de la cuenta**: no se pega en el repo, ni en un
     issue, ni en un chat público.
3. Copia también el **Instagram User ID**: aparece en el mismo panel con el
   nombre de la cuenta (un número largo, tipo `17841400000000000`). Si no lo
   ves, se puede sacar con una llamada a `GET /me?fields=user_id,username`
   (eso lo hace el agente).

---

## Paso 7 — Pasar los datos por un canal privado

Mándale al agente, por un canal privado (mensaje directo, no un comentario ni un
issue), dos cosas:

```
token: IGQV...      (el del paso 6)
id:    178414...    (el Instagram User ID del paso 6)
```

Y nada más. El agente los guarda en los *secretos* de GitHub, que están cifrados
y no aparecen en el código. Si prefieres hacerlo tú a mano:

1. GitHub → **Settings → Secrets and variables → Actions → New repository
   secret**.
2. Nombre `IG_ACCESS_TOKEN`, valor el token.
3. Nombre `IG_USER_ID`, valor el número.

El token caduca a los 60 días, pero **no tienes que acordarte**: un workflow
mensual lo renueva solo (paso 9).

---

## Paso 8 — Crear el PAT que renueva el token (gratis)

El workflow mensual necesita poder escribir en los *secretos* del repo. Para eso
hace falta un "token personal" (PAT) de GitHub con ese único permiso. No da
acceso al resto de tu cuenta si lo limitas a este repo.

1. Entra en <https://github.com/settings/personal-access-tokens/new>.
2. **Token name:** `high-doctor-instagram-secrets`.
3. **Expiration:** sin caducidad o 1 año (si caduca, hay que repetir este paso).
4. **Repository access:** *Only select repositories* → elige **sólo** el repo de
   la web (`high-doctor-landing`). Nada de "All repositories".
5. **Permissions → Repository permissions → Secrets: Read and write.** Es el
   único permiso que hay que tocar.
6. **Generate token** y copia el valor (empieza por `github_pat_...`). Sólo se
   muestra una vez.
7. Se lo pasas al agente (o lo guardas tú) como secreto con el nombre
   **`GH_PAT_SECRETS`**: GitHub → Settings → Secrets and variables → Actions →
   New repository secret.

---

## Paso 9 — Activar el flujo

Hay un interruptor general. Se enciende una vez:

```bash
gh variable set IG_ENABLED --body true
```

Y así se comprueba que existe:

```bash
gh variable list          # tiene que aparecer IG_ENABLED = true
gh secret list            # IG_ACCESS_TOKEN, IG_USER_ID y GH_PAT_SECRETS
```

Con `IG_ENABLED` distinto de `true`, el workflow sale sin hacer nada (es el
botón del pánico, explicado en `docs/COMO-PUBLICAR.md`).

---

## Paso 10 — Probarlo en seco (sin publicar)

1. GitHub → pestaña **Actions** → workflow **Reclamo en Instagram**.
2. **Run workflow** → deja marcado **dry run** → **Run workflow**.
3. Abre la ejecución y mira el resumen: imprime la URL de la tarjeta y el
   caption exacto, sin publicar nada.

Si ahí se ve bien, la primera publicación real sólo necesita un post con
`instagram: 'pending'` (y `draft: false`, con fecha de hoy o de antes).

---

## Cómo funciona una vez montado (para que no haya sorpresas)

1. Publicas una noticia con `instagram: 'pending'` en el frontmatter.
2. El deploy publica la web y genera la tarjeta `/social/<lang>/<slug>.jpg`.
3. Si el deploy va bien, se lanza solo **Reclamo en Instagram**.
4. El flujo espera a que la tarjeta esté en línea (hasta 5 minutos), comprueba el
   límite diario de Instagram, crea el post, espera a que esté listo y lo publica.
5. En el mismo commit marca el post como `instagram: 'published'` y guarda el
   `instagramId` en **las dos versiones** (ES y EN). Por eso **nunca se publica
   dos veces**, aunque relances el workflow.

Detalles que conviene saber:

- Si una noticia tiene ES y EN, se publica **una sola vez**, en español (se puede
  cambiar con la variable `IG_LANG=en`).
- Se publica **un post por ejecución** por defecto (`IG_MAX_PER_RUN`). Si hay
  varios en cola, el resumen lo dice y el resto sale en la siguiente pasada.
- Si algo falla, el post **sigue en `pending`** y el resumen dice el motivo.
  Tras **3 fallos seguidos** del mismo post, el flujo lo pasa a
  `instagram: 'off'` para no entrar en bucle y lo avisa en el resumen: hay que
  mirarlo a mano.
- Límite de Instagram: 100 publicaciones por API cada 24 h. No llegamos ni de
  lejos, pero el flujo lo consulta antes de publicar.

---

## Si algo falla

| Qué ves | Qué significa | Qué hacer |
|---|---|---|
| `Faltan IG_ACCESS_TOKEN o IG_USER_ID` | Los secretos no están o están vacíos | Repetir el paso 7 |
| `Instagram 401` / `Invalid OAuth access token` | El token caducó o se revocó (p. ej. cambiaste la contraseña o el 2FA) | Paso 6 otra vez y guardar el token nuevo |
| `Instagram 400` al crear el contenedor | La imagen no es accesible o no es JPG | Comprobar que `https://highdoctor.foundation/social/es/<slug>.jpg` abre en el navegador |
| `the image is not online after 5 minutes` | El CDN de Pages tarda más de la cuenta | Relanzar el workflow a mano: el post sigue en `pending` |
| `content_publishing_limit` agotado | 100 publicaciones en 24 h | Esperar; el flujo no publica nada y no marca el post como fallido |
| El job de refresco mensual en rojo | El token no se ha podido renovar | Paso 6 a mano y guardar el token nuevo |
| `The user is not an Instagram professional account` | La cuenta no es Profesional | Paso 1 |

El resumen de cada ejecución (Actions → la ejecución → *Summary*) dice qué
posts ha publicado, cuáles ha omitido y por qué.

---

## Lo que puede cambiar Meta (y cómo detectarlo)

Comprobado el **2026-10-20**. Meta toca esta zona a menudo; esto es lo que hemos
visto cambiar otras veces y cómo reaccionar:

- **Nombres de menús.** El prompt original hablaba del caso de uso "Gestionar
  mensajes y contenido en Instagram". El 2026-10-20 la documentación de Meta ya
  no lo menciona: el camino documentado es **Otros → Empresa → producto
  Instagram → Instagram API con el inicio de sesión con Instagram**. Si un menú
  no coincide, busca el equivalente; no cambia nada del flujo.
- **Nombre de los permisos.** Los valores actuales son
  `instagram_business_basic` y `instagram_business_content_publish`. Los antiguos
  (`business_basic`, `business_content_publish`) quedaron obsoletos el
  27/01/2025: si los ves, son los viejos.
- **Versión de la API.** El flujo usa `v26.0` (variable `IG_API_VERSION` para
  cambiarla sin tocar código).
- **Revisión de la app.** No hace falta: la cuenta es tuya y está añadida a la
  app, así que funciona en modo desarrollo. Sólo sería necesaria para publicar
  en cuentas de terceros.
- **Formato de imagen.** Instagram sólo admite JPG por API, entre 4:5 y 1.91:1.
  Nuestra tarjeta es 1080×1350 (4:5 exacto) y se genera en JPEG.

Si algún día deja de publicar y el resumen habla de permisos o de versión,
empieza por revisar estas dos páginas y compara con este documento:

- <https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login>
- <https://developers.facebook.com/docs/instagram-platform/content-publishing>
- <https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token>

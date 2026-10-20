# 00 — Hotfix: el formulario de contacto no envía nada

## Contexto
La web actual (HTML estático en la raíz del repo) tiene en `script.js` un manejador de `submit` que hace `e.preventDefault()`, resetea el formulario y **nunca envía los datos a Web3Forms**. Además usa `document.getElementById('form-success')`, que no existe en `index.html`, así que lanza un TypeError. Todos los leads se están perdiendo. Este arreglo va **antes** de la migración porque la migración tardará.

## Tarea
1. En `index.html`, añade dentro de `#contact` un bloque de estado accesible (`role="status"`, `aria-live="polite"`) para los mensajes de éxito y error.
2. Añade un checkbox **obligatorio** de consentimiento RGPD ("He leído y acepto la política de privacidad") con clave i18n en los 8 idiomas de `translations`. De momento enlaza a `#privacy`; el prompt 04 creará la página real.
3. En `script.js`, reescribe el submit:
   - `fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })`.
   - Mientras envía, deshabilita el botón y muestra "Enviando…" (i18n).
   - Si la respuesta es OK (`json.success`), resetea el formulario y muestra `form_success` traducido. Si falla, muestra un error traducido (`form_error`) y **no** borres lo que el usuario había escrito.
   - Respeta el honeypot `botcheck` que ya existe.
4. Deja intacto el campo `access_key` (es público por diseño en Web3Forms).

## Verificación
- Abre la página en local (`python3 -m http.server`) y envía el formulario con datos de prueba (nombre "TEST HDF"). Comprueba en la pestaña Network que el POST a Web3Forms devuelve `success: true`.
- Comprueba que no hay errores en la consola.
- Avisa a Saf en una línea de que llegará un email de prueba a la cuenta configurada en Web3Forms.
- Commit `fix: el formulario de contacto envía de verdad a Web3Forms` y push. Comprueba el formulario en producción.

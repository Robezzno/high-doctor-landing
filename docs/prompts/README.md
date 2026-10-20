# Prompts de ejecución — reglas comunes

Estos prompts los ejecuta un agente de código, **uno por sesión y en orden** (00 → 09).
Antes de empezar cualquiera, el agente debe leer:
1. `docs/PLAN.md`: diagnóstico, arquitectura y decisiones. No las vuelvas a discutir.
2. `docs/TAREAS.md`: qué está hecho y por dónde va la cosa.
3. Este README.

## Reglas para todos los prompts
- Idioma: español en commits, documentación y comentarios. Los textos de la web van en sus 8 idiomas (en, es, de, fr, it, pt, nl, pl).
- Git: autor `Robezzno <robezzno@gmail.com>`. **No** añadas `Co-Authored-By` ni ninguna atribución a una IA. Commit y push a `main` al terminar cada bloque que funcione. Usa el remoto HTTPS: no hay clave SSH en este equipo y `gh auth setup-git` ya está configurado.
- Cada push a `main` **publica en producción**. Antes de hacer push: `npm run build` sin errores y revisión visual en local (`npm run preview` + navegador o Playwright).
- Repo **público**: nunca subas secretos, tokens ni datos personales. Los secretos van en GitHub → Settings → Secrets (`gh secret set`).
- Nada que cueste dinero (APIs de pago, dominios, servicios) sin preguntar antes a Saf.
- Toca sólo lo que pide el prompt. Si ves algo mejorable fuera de alcance, apúntalo en `docs/TAREAS.md` en "Ideas pendientes".
- Al terminar un prompt, actualiza `docs/TAREAS.md` (hecho / en curso / cómo retomarlo) y haz commit. Si la sesión se corta, el siguiente agente tiene que poder retomar desde ahí.
- Responde a Saf al grano: qué funciona ya y qué falta. Saf no es programador y no necesita explicaciones del código.

## Definición de "terminado"
- Build OK, sin errores en la consola del navegador y sin enlaces rotos.
- Comprobado en móvil (390 px) y escritorio (1440 px), con capturas guardadas en `docs/capturas/<prompt>/`.
- Desplegado y comprobado en `https://highdoctor.foundation` tras el push (espera a que acabe el workflow y haz `curl` o abre el navegador).
- Si algo no se ha podido probar, se dice en una línea.

## Stack ya decidido (no cambiar sin motivo fuerte)
Astro (salida estática) · TypeScript · CSS propio con custom properties (sin Tailwind, para huir del look genérico) · GSAP + ScrollTrigger · Lenis · Pages CMS · GitHub Actions · Satori/resvg/sharp · Instagram API with Instagram Login.

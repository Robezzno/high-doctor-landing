/**
 * Textos legales y rutas de las páginas legales.
 *
 * Decisión: la entidad es española y el texto de referencia está en español.
 * EN es la traducción de trabajo y los otros seis idiomas muestran el texto EN
 * con un aviso visible (`legal_lang_notice`), porque traducir textos legales a
 * ocho idiomas multiplica el riesgo de error sin aportar nada.
 *
 * Los datos de la entidad se inyectan con marcadores `{{legalName}}`,
 * `{{taxId}}`, `{{address}}`, `{{registry}}` y `{{email}}` desde
 * `src/config/site.ts`. Mientras allí sigan entre corchetes, aquí se ven
 * corchetes: es la señal de que falta el dato, no un fallo.
 *
 * AVISO: esto es una plantilla orientativa. Debe revisarla un profesional
 * (abogado o asesor en protección de datos) antes de darla por definitiva.
 */
import type { Entity } from '../config/site';
import { languages, type Lang } from '../i18n';

export const LEGAL_DOCS = ['notice', 'privacy', 'cookies'] as const;

export type LegalDoc = (typeof LEGAL_DOCS)[number];

/** Idioma en el que está escrito cada documento legal. */
export type LegalLang = 'es' | 'en';

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalPageContent {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/** Slug de cada documento por idioma. Los demás idiomas usan los slugs EN. */
const LEGAL_SLUGS: Record<LegalLang, Record<LegalDoc, string>> = {
  en: { notice: 'legal-notice', privacy: 'privacy', cookies: 'cookies' },
  es: { notice: 'aviso-legal', privacy: 'privacidad', cookies: 'cookies' },
};

/** Fecha de la última revisión de la plantilla (ISO). */
export const LEGAL_UPDATED = '2026-10-20';

/** Idioma del documento legal que corresponde a un idioma de la web. */
export function legalLang(lang: Lang): LegalLang {
  return lang === 'es' ? 'es' : 'en';
}

/** Ruta de una página legal: `/legal/privacy`, `/es/legal/privacidad`… */
export function legalPath(lang: Lang, doc: LegalDoc): string {
  const textLang = legalLang(lang);
  const slug = LEGAL_SLUGS[textLang][doc];
  return lang === 'en' ? `/legal/${slug}` : `/${lang}/legal/${slug}`;
}

/** Slug visible en la URL para un idioma y documento. */
export function legalSlug(textLang: LegalLang, doc: LegalDoc): string {
  return LEGAL_SLUGS[textLang][doc];
}

/**
 * ¿Hay que avisar de que el texto no está en el idioma de la página?
 * Sólo ES y EN tienen texto propio; los otros seis ven el aviso.
 */
export function legalLangNoticeNeeded(lang: Lang): boolean {
  return legalLang(lang) !== lang;
}

/**
 * Ruta de un documento legal en cada idioma de la web, para los `hreflang`.
 * El texto es ES o EN, pero la URL existe en los ocho idiomas (con aviso).
 */
export function legalAlternates(doc: LegalDoc): { lang: Lang; href: string }[] {
  return languages.map((lang) => ({ lang, href: legalPath(lang, doc) }));
}

/** Sustituye los marcadores de la entidad por sus datos reales. */
export function renderLegalText(text: string, data: Entity): string {
  return text
    .replaceAll('{{legalName}}', data.legalName)
    .replaceAll('{{taxId}}', data.taxId)
    .replaceAll('{{address}}', data.address)
    .replaceAll('{{registry}}', data.registry)
    .replaceAll('{{email}}', data.email);
}

const es: Record<LegalDoc, LegalPageContent> = {
  notice: {
    title: 'Aviso legal',
    intro:
      'Quién está detrás de esta web, para qué existe y qué puedes hacer con su contenido.',
    sections: [
      {
        heading: '1. Titular del sitio',
        body: [
          'Este sitio web (highdoctor.foundation) pertenece a {{legalName}}, con NIF {{taxId}} y domicilio en {{address}}. Está inscrita en {{registry}}. Correo de contacto: {{email}}.',
        ],
      },
      {
        heading: '2. Para qué existe esta web',
        body: [
          'Es un proyecto educativo y divulgativo sin ánimo de lucro. No vende productos, no presta servicios sanitarios y no sustituye el consejo de un profesional de la salud.',
        ],
      },
      {
        heading: '3. Uso del contenido',
        body: [
          'Puedes leer, citar y compartir el contenido indicando la fuente y enlazando la página original. No está permitido presentarlo como propio ni usarlo para promocionar productos o servicios.',
        ],
      },
      {
        heading: '4. Propiedad intelectual',
        body: [
          'Los textos, ilustraciones, el logotipo y la marca pertenecen a {{legalName}} o a sus autores, salvo donde se indique otra fuente. Los datos químicos y las referencias científicas son públicos y se citan siempre que se puede.',
        ],
      },
      {
        heading: '5. Responsabilidad',
        body: [
          'Publicamos información divulgativa basada en fuentes citadas. No respondemos del uso que se haga de esa información ni del contenido de las webs externas a las que enlazamos.',
        ],
      },
      {
        heading: '6. Publicidad y patrocinios',
        body: [
          'No hay publicidad, ni contenido patrocinado, ni enlaces de afiliado. Si algún día los hubiera, estarían señalados como tales.',
        ],
      },
      {
        heading: '7. Legislación aplicable',
        body: [
          'Se aplica la legislación española. Para cualquier controversia serán competentes los juzgados del domicilio del titular, salvo que la ley disponga otra cosa.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de privacidad',
    intro:
      'Qué datos recogemos cuando usas el formulario, para qué sirven y cómo puedes borrarlos.',
    sections: [
      {
        heading: '1. Responsable del tratamiento',
        body: [
          'Responsable: {{legalName}}, NIF {{taxId}}, domicilio en {{address}}. Para cualquier cosa relacionada con tus datos, escribe a {{email}}.',
        ],
      },
      {
        heading: '2. Para qué usamos tus datos',
        body: [
          'Sólo para dos cosas: responder al mensaje que envías por el formulario de contacto y, si marcas la casilla correspondiente, enviarte novedades sobre proyectos, eventos y convocatorias.',
          'No hacemos perfilado, no elaboramos perfiles comerciales y no usamos tus datos para publicidad.',
        ],
      },
      {
        heading: '3. Qué datos pedimos',
        body: [
          'Nombre, correo electrónico, país, profesión y área de interés. La organización, el perfil de LinkedIn y el mensaje son opcionales.',
          'El proveedor del formulario puede registrar la dirección IP y la fecha de envío con fines antifraude y antispam.',
        ],
      },
      {
        heading: '4. Base legal',
        body: [
          'Tu consentimiento, que otorgas al marcar la casilla de aceptación antes de enviar (art. 6.1.a del RGPD). Puedes retirarlo en cualquier momento escribiendo a {{email}}: dejar de recibir novedades no afecta a la conversación que ya tengamos abierta.',
        ],
      },
      {
        heading: '5. Quién más ve tus datos (encargados del tratamiento)',
        body: [
          'Web3Forms (api.web3forms.com) gestiona el envío del formulario y nos reenvía el mensaje por correo electrónico. Sólo trata los datos para eso.',
          'Los contenidos de la web se editan con Pages CMS y se guardan en GitHub, que además aloja el sitio publicado. GitHub no recibe los datos del formulario, pero sí el contenido que publicamos.',
          'No cedemos ni vendemos datos a terceros con fines comerciales.',
        ],
      },
      {
        heading: '6. Transferencias internacionales',
        body: [
          'Web3Forms y GitHub están fuera del Espacio Económico Europeo (Estados Unidos) y se apoyan en sus propias garantías contractuales para las transferencias. Si prefieres no pasar por ahí, escríbenos directamente a {{email}}.',
        ],
      },
      {
        heading: '7. Cuánto tiempo los guardamos',
        body: [
          'Los mensajes del formulario, mientras dure la conversación y hasta un año después. Los datos de la lista de novedades, hasta que pidas la baja.',
          'Después se borran o se anonimizan.',
        ],
      },
      {
        heading: '8. Tus derechos (ARCO-POL)',
        body: [
          'Puedes ejercer los derechos de acceso, rectificación, cancelación, oposición, portabilidad, limitación del tratamiento y olvido escribiendo a {{email}}. Contestaremos en el plazo máximo de un mes.',
          'Si no te convence la respuesta, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).',
        ],
      },
      {
        heading: '9. Menores de edad',
        body: [
          'El formulario es para personas mayores de 18 años. No recogemos datos de menores a sabiendas; si detectamos uno, lo borramos.',
        ],
      },
      {
        heading: '10. Cambios en esta política',
        body: [
          'Si cambia algo, actualizaremos la fecha de revisión que aparece arriba y lo avisaremos en la web.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de cookies',
    intro: 'Resumen corto: esta web no usa cookies. Aquí está la explicación completa.',
    sections: [
      {
        heading: '1. Esta web no instala cookies',
        body: [
          'No hay cookies de análisis, ni de publicidad, ni de redes sociales, ni de terceros. Por eso no verás un banner de cookies: no hay nada que aceptar.',
          'Tampoco usamos píxeles de seguimiento ni herramientas de analítica con cookies.',
        ],
      },
      {
        heading: '2. Lo único que guardamos en tu navegador',
        body: [
          'Una entrada en el almacenamiento local del navegador (localStorage) llamada "preferredLang", que recuerda el idioma que elegiste para no redirigirte cada vez que entras.',
          'Se queda en tu dispositivo, no se envía a ningún servidor y puedes borrarla cuando quieras desde los ajustes del navegador.',
        ],
      },
      {
        heading: '3. El formulario de contacto',
        body: [
          'El formulario se envía al servicio Web3Forms, que lo reenvía a nuestro correo. La web no instala cookies para ese envío. Si algún día el proveedor las necesitara, se avisaría aquí antes.',
        ],
      },
      {
        heading: '4. Cómo comprobarlo tú mismo',
        body: [
          'Abre las herramientas de desarrollo del navegador (normalmente con F12), ve a la pestaña "Application" o "Almacenamiento" y mira Cookies y Local Storage. No verás cookies de este sitio.',
        ],
      },
      {
        heading: '5. Si en el futuro añadimos analítica',
        body: [
          'Será sin cookies, con una herramienta que no te siga entre webs (por ejemplo Plausible o Cloudflare Web Analytics), y se explicará en esta misma página.',
        ],
      },
      {
        heading: '6. Dudas',
        body: ['Para cualquier duda sobre privacidad o cookies, escribe a {{email}}.'],
      },
    ],
  },
};

const en: Record<LegalDoc, LegalPageContent> = {
  notice: {
    title: 'Legal notice',
    intro: 'Who is behind this site, what it is for and what you may do with its content.',
    sections: [
      {
        heading: '1. Site owner',
        body: [
          'This website (highdoctor.foundation) belongs to {{legalName}}, tax ID {{taxId}}, registered address {{address}}, entered in {{registry}}. Contact email: {{email}}.',
        ],
      },
      {
        heading: '2. What this site is for',
        body: [
          'It is a non-profit educational and science-communication project. It sells no products, provides no healthcare services and does not replace advice from a health professional.',
        ],
      },
      {
        heading: '3. Using the content',
        body: [
          'You may read, quote and share the content as long as you credit the source and link to the original page. You may not present it as your own or use it to promote products or services.',
        ],
      },
      {
        heading: '4. Intellectual property',
        body: [
          'Texts, illustrations, logo and brand belong to {{legalName}} or their authors, except where another source is credited. Chemical data and scientific references are public and are cited whenever possible.',
        ],
      },
      {
        heading: '5. Liability',
        body: [
          'We publish educational information based on cited sources. We are not liable for how that information is used or for the content of external sites we link to.',
        ],
      },
      {
        heading: '6. Advertising and sponsorship',
        body: [
          'There is no advertising, no sponsored content and no affiliate links. If that ever changes, it will be clearly labelled.',
        ],
      },
      {
        heading: '7. Applicable law',
        body: [
          'Spanish law applies. Any dispute will be heard by the courts of the owner’s registered address, unless the law says otherwise.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'What we collect when you use the form, what it is for and how to have it deleted.',
    sections: [
      {
        heading: '1. Data controller',
        body: [
          'Controller: {{legalName}}, tax ID {{taxId}}, registered address {{address}}. For anything related to your data, write to {{email}}.',
        ],
      },
      {
        heading: '2. What we use your data for',
        body: [
          'Only two things: replying to the message you send through the contact form and, if you tick the box, sending you updates about projects, events and open calls.',
          'We do not profile you, build commercial profiles or use your data for advertising.',
        ],
      },
      {
        heading: '3. What data we ask for',
        body: [
          'Name, email, country, profession and area of interest. Organisation, LinkedIn profile and message are optional.',
          'The form provider may log the IP address and submission time for anti-fraud and anti-spam purposes.',
        ],
      },
      {
        heading: '4. Legal basis',
        body: [
          'Your consent, given when you tick the acceptance box before submitting (art. 6.1.a GDPR). You can withdraw it at any time by writing to {{email}}; opting out of updates does not affect a conversation we already have open.',
        ],
      },
      {
        heading: '5. Who else sees your data (processors)',
        body: [
          'Web3Forms (api.web3forms.com) handles the form submission and forwards the message to us by email. It processes the data for that purpose only.',
          'Website content is edited with Pages CMS and stored on GitHub, which also hosts the published site. GitHub does not receive form submissions, but it does store the content we publish.',
          'We do not share or sell data to third parties for commercial purposes.',
        ],
      },
      {
        heading: '6. International transfers',
        body: [
          'Web3Forms and GitHub are outside the European Economic Area (United States) and rely on their own contractual safeguards for transfers. If you would rather avoid that route, write to us directly at {{email}}.',
        ],
      },
      {
        heading: '7. How long we keep it',
        body: [
          'Form messages: for as long as the conversation lasts and up to one year afterwards. Newsletter data: until you unsubscribe.',
          'After that they are deleted or anonymised.',
        ],
      },
      {
        heading: '8. Your rights (ARCO-POL)',
        body: [
          'You can exercise your rights of access, rectification, erasure, objection, portability, restriction of processing and the right to be forgotten by writing to {{email}}. We answer within one month at the latest.',
          'If you are not happy with our answer, you can lodge a complaint with the Spanish Data Protection Agency (www.aepd.es).',
        ],
      },
      {
        heading: '9. Minors',
        body: [
          'The form is for people aged 18 or over. We do not knowingly collect data from minors; if we spot any, we delete it.',
        ],
      },
      {
        heading: '10. Changes to this policy',
        body: [
          'If anything changes, we will update the review date at the top and announce it on the site.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie policy',
    intro: 'Short version: this site uses no cookies. Here is the full explanation.',
    sections: [
      {
        heading: '1. This site sets no cookies',
        body: [
          'No analytics cookies, no advertising cookies, no social media cookies, no third-party cookies. That is why you will not see a cookie banner: there is nothing to accept.',
          'We do not use tracking pixels or cookie-based analytics either.',
        ],
      },
      {
        heading: '2. The only thing we store in your browser',
        body: [
          'One localStorage entry called "preferredLang", which remembers the language you picked so we do not redirect you every time you visit.',
          'It stays on your device, is never sent to a server and you can delete it from your browser settings whenever you like.',
        ],
      },
      {
        heading: '3. The contact form',
        body: [
          'The form is sent to the Web3Forms service, which forwards it to our inbox. The site sets no cookies for that submission. If the provider ever needed one, we would say so here first.',
        ],
      },
      {
        heading: '4. How to check it yourself',
        body: [
          'Open your browser developer tools (usually F12), go to the "Application" or "Storage" tab and look at Cookies and Local Storage. You will not see cookies set by this site.',
        ],
      },
      {
        heading: '5. If we add analytics later',
        body: [
          'It will be cookieless, using a tool that does not follow you across websites (for example Plausible or Cloudflare Web Analytics), and it will be explained on this page.',
        ],
      },
      {
        heading: '6. Questions',
        body: ['For any privacy or cookie question, write to {{email}}.'],
      },
    ],
  },
};

export const legalContent: Record<LegalLang, Record<LegalDoc, LegalPageContent>> = { es, en };

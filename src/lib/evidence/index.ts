import { z } from 'astro/zod';

import de from '../../data/evidence-pages/de.json';
import en from '../../data/evidence-pages/en.json';
import es from '../../data/evidence-pages/es.json';
import fr from '../../data/evidence-pages/fr.json';
import it from '../../data/evidence-pages/it.json';
import nl from '../../data/evidence-pages/nl.json';
import pl from '../../data/evidence-pages/pl.json';
import pt from '../../data/evidence-pages/pt.json';
import { evidenceTopicIds, evidenceTopics, type EvidenceTopic, type EvidenceTopicId } from '../../data/evidence';
import { defaultLang, languages, type Lang } from '../../i18n';

/**
 * Fichas por tema de evidencia: una página por tema y por idioma, más un índice.
 *
 * - EN: `/evidence/` y `/evidence/<slug>/`.
 * - Resto: `/<lang>/<base>/` y `/<lang>/<base>/<slug>/` (`base` traducido: evidencia, evidenz…).
 *
 * La nota, el nivel, la fuente, «qué dice» y «qué significa» salen de
 * `src/data/evidence.ts` y de `src/i18n/*.json` (los mismos que la portada).
 * El texto propio de cada ficha vive en `src/data/evidence-pages/<lang>.json` y
 * se valida aquí: si a un idioma le falta un tema o un campo, el build falla.
 */

/** Fecha de la última revisión del contenido de las fichas (ISO). */
export const EVIDENCE_REVIEWED = '2026-11-21';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const topicSchema = z.object({
  slug: z.string().regex(SLUG),
  question: z.string().min(1).max(110),
  description: z.string().min(1).max(170),
  studied: z.string().min(1),
  unknown: z.string().min(1),
  practical: z.string().min(1),
});

const uiSchema = z.object({
  hubTitle: z.string().min(1),
  hubLead: z.string().min(1),
  hubDescription: z.string().min(1).max(170),
  crumbHome: z.string().min(1),
  crumbHub: z.string().min(1),
  kindUse: z.string().min(1),
  kindRisk: z.string().min(1),
  verdictLabel: z.string().min(1),
  studied: z.string().min(1),
  unknown: z.string().min(1),
  practical: z.string().min(1),
  scaleTitle: z.string().min(1),
  scaleLead: z.string().min(1),
  relatedNews: z.string().min(1),
  otherTopics: z.string().min(1),
  reviewed: z.string().min(1),
  seePage: z.string().min(1),
  hubLink: z.string().min(1),
  ctaTitle: z.string().min(1),
  ctaText: z.string().min(1),
});

export const evidencePageSchema = z
  .object({
    base: z.string().regex(SLUG),
    ui: uiSchema,
    topics: z.object(
      Object.fromEntries(evidenceTopicIds.map((id) => [id, topicSchema])) as Record<
        EvidenceTopicId,
        typeof topicSchema
      >,
    ),
  })
  .superRefine((page, ctx) => {
    const slugs = Object.values(page.topics).map((topic) => topic.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({ code: 'custom', message: 'slugs repetidos dentro del idioma' });
    }
  });

export type EvidencePageContent = z.infer<typeof evidencePageSchema>;
export type EvidenceTopicContent = z.infer<typeof topicSchema>;

const raw: Record<Lang, unknown> = { en, es, de, fr, it, pt, nl, pl };

/** Contenido validado por idioma (lanza al cargar si algo no cuadra). */
export const evidenceContent = Object.fromEntries(
  languages.map((lang) => {
    const parsed = evidencePageSchema.safeParse(raw[lang]);
    if (!parsed.success) {
      throw new Error(`evidence-pages/${lang}.json no cumple el esquema: ${parsed.error.message}`);
    }
    return [lang, parsed.data];
  }),
) as Record<Lang, EvidencePageContent>;

/** Índice de fichas de un idioma: `/evidence/`, `/es/evidencia/`… */
export function evidenceHubPath(lang: Lang): string {
  const base = evidenceContent[lang].base;
  return lang === defaultLang ? `/${base}/` : `/${lang}/${base}/`;
}

/** Ficha de un tema en un idioma. */
export function evidenceTopicPath(lang: Lang, id: EvidenceTopicId): string {
  return `${evidenceHubPath(lang)}${evidenceContent[lang].topics[id].slug}/`;
}

/** Las 8 versiones de idioma de una página (índice si no se pasa tema). */
export function evidenceAlternates(id?: EvidenceTopicId): { lang: Lang; path: string }[] {
  return languages.map((lang) => ({
    lang,
    path: id ? evidenceTopicPath(lang, id) : evidenceHubPath(lang),
  }));
}

/** Tema por id (siempre existe: los ids salen de la misma lista). */
export function topicById(id: EvidenceTopicId): EvidenceTopic {
  const topic = evidenceTopics.find((item) => item.id === id);
  if (!topic) throw new Error(`tema de evidencia desconocido: ${id}`);
  return topic;
}

/**
 * Otros temas para enlazar al final de una ficha: primero los del mismo grupo
 * (usos o riesgos) y después el resto, sin el propio.
 */
export function otherTopics(id: EvidenceTopicId): EvidenceTopic[] {
  const current = topicById(id);
  const rest = evidenceTopics.filter((topic) => topic.id !== id);
  return [
    ...rest.filter((topic) => topic.group === current.group),
    ...rest.filter((topic) => topic.group !== current.group),
  ];
}

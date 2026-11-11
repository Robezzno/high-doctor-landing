/**
 * "Qué dice la evidencia": la pieza interactiva de la portada.
 *
 * Cada tema lleva el nivel de evidencia de la escala de la revisión de las
 * Academias Nacionales de Ciencias de EE. UU. (NASEM, 2017) —insuficiente,
 * limitada, moderada, sustancial, concluyente— o, cuando hay una decisión del
 * regulador posterior (epilepsia: EMA, 2019), esa decisión.
 *
 * Los textos viven en `src/i18n/*.json` con las claves `evd_<id>_t` (tema),
 * `evd_<id>_f` (qué dice) y `evd_<id>_m` (qué significa). Si se añade un tema
 * aquí, hay que añadir sus tres claves en los 8 idiomas o el build falla.
 *
 * REVISAR antes de cambiar un nivel: tiene que coincidir con la fuente.
 */

export type EvidenceLevel = 1 | 2 | 3 | 4 | 5;

export type SourceId = 'nasem' | 'ema';

export interface EvidenceSource {
  /** Cita completa. */
  name: string;
  /** Cita corta para la etiqueta del hero. */
  short: string;
  url: string;
}

export const evidenceSources: Record<SourceId, EvidenceSource> = {
  nasem: {
    name: 'National Academies of Sciences, Engineering, and Medicine (2017). The Health Effects of Cannabis and Cannabinoids',
    short: 'US National Academies (2017)',
    url: 'https://nap.nationalacademies.org/catalog/24625/the-health-effects-of-cannabis-and-cannabinoids-the-current-state',
  },
  ema: {
    name: 'European Medicines Agency (2019). Epidyolex (cannabidiol), EPAR',
    short: 'European Medicines Agency (2019)',
    url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/epidyolex',
  },
};

export const evidenceTopicIds = [
  'pain',
  'nausea',
  'ms',
  'epilepsy',
  'sleep',
  'anxiety',
  'cancer',
  'psychosis',
  'driving',
  'pregnancy',
] as const;

export type EvidenceTopicId = (typeof evidenceTopicIds)[number];

export interface EvidenceTopic {
  id: EvidenceTopicId;
  /** `use`: posible uso médico. `risk`: riesgo asociado al consumo. */
  group: 'use' | 'risk';
  level: EvidenceLevel;
  source: SourceId;
}

export const evidenceTopics: EvidenceTopic[] = [
  // NASEM 2017: "conclusive or substantial evidence" — dolor crónico en adultos.
  { id: 'pain', group: 'use', level: 4, source: 'nasem' },
  // NASEM 2017: "conclusive evidence" — antieméticos orales en quimioterapia.
  { id: 'nausea', group: 'use', level: 5, source: 'nasem' },
  // NASEM 2017: "substantial evidence" — espasticidad referida por pacientes con EM.
  { id: 'ms', group: 'use', level: 4, source: 'nasem' },
  // EMA 2019: medicamento aprobado tras ensayos aleatorizados (Dravet, Lennox-Gastaut).
  { id: 'epilepsy', group: 'use', level: 5, source: 'ema' },
  // NASEM 2017: "moderate evidence" — sueño a corto plazo con AOS, fibromialgia, dolor, EM.
  { id: 'sleep', group: 'use', level: 3, source: 'nasem' },
  // NASEM 2017: "limited evidence" — ansiedad social (test de hablar en público).
  { id: 'anxiety', group: 'use', level: 2, source: 'nasem' },
  // NASEM 2017: "insufficient evidence" — cánceres, gliomas incluidos.
  { id: 'cancer', group: 'use', level: 1, source: 'nasem' },
  // NASEM 2017: "substantial evidence of a statistical association" — esquizofrenia y psicosis.
  { id: 'psychosis', group: 'risk', level: 4, source: 'nasem' },
  // NASEM 2017: "substantial evidence" — accidentes de tráfico.
  { id: 'driving', group: 'risk', level: 4, source: 'nasem' },
  // NASEM 2017: "substantial evidence" — fumar en el embarazo y menor peso al nacer.
  { id: 'pregnancy', group: 'risk', level: 4, source: 'nasem' },
];

/** Nota A–E de un nivel: A = concluyente (5) … E = insuficiente (1). */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

export function gradeOf(level: EvidenceLevel): Grade {
  return (['E', 'D', 'C', 'B', 'A'] as const)[level - 1];
}

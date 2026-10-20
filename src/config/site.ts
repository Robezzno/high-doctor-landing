/**
 * Configuración de contenido de la web.
 *
 * Decisión de Saf (2026-10-20): todavía **no hay datos reales**, así que no se
 * inventa nada. Cada sección que necesita datos de verdad tiene aquí su flag y
 * sólo se pinta cuando el flag está en `true` **y** hay datos. Las secciones
 * ocultas no dejan huecos: simplemente no se renderizan.
 *
 * Para publicar una sección basta con dos pasos:
 *   1. Rellenar su dato en este fichero (o su colección de contenido).
 *   2. Poner su flag en `true`.
 *
 * Los datos de la entidad legal van entre corchetes a propósito: las páginas
 * de `/legal/` los sustituyen por lo que haya aquí, y mientras sigan entre
 * corchetes se ven como huecos pendientes de rellenar (ver `src/data/legal.ts`).
 */

/** Datos de la entidad legal española (LSSI-CE / RGPD). */
export interface Entity {
  /** Razón social o nombre de la asociación/fundación. */
  legalName: string;
  /** CIF/NIF. */
  taxId: string;
  /** Domicilio social completo. */
  address: string;
  /** Registro donde está inscrita (nombre y número). */
  registry: string;
  /** Email público de contacto y de ejercicio de derechos. */
  email: string;
}

/**
 * Datos legales de la entidad.
 * PENDIENTE DE SAF: sustituir cada corchete por el dato real y poner
 * `sections.entityLegalData` en `true`.
 */
export const entity: Entity = {
  legalName: '[NOMBRE LEGAL]',
  taxId: '[CIF]',
  address: '[DOMICILIO]',
  registry: '[REGISTRO]',
  email: 'highdoctorcsc@gmail.com',
};

/** Email público de contacto (el mismo que usa el formulario y el footer). */
export const contactEmail = entity.email;

export type SectionFlag =
  | 'team'
  | 'partners'
  | 'stats'
  | 'events'
  | 'social'
  | 'entityLegalData';

/**
 * Interruptores de las secciones que dependen de datos reales.
 * Todos en `false` hasta que Saf los aporte: la web se publica sin ellas.
 */
export const sections: Record<SectionFlag, boolean> = {
  /** Equipo: nombre, rol y foto con permiso. */
  team: false,
  /** Socios y colaboradores: logo y permiso de uso. */
  partners: false,
  /** Cifras reales (miembros, eventos, países). Nunca estimaciones. */
  stats: false,
  /** Eventos de la colección `events` (`src/content/events/`). */
  events: false,
  /** Enlaces a redes sociales (cabecera móvil y footer). */
  social: false,
  /** `true` cuando los datos de `entity` estén confirmados. */
  entityLegalData: false,
};

/** Una persona del equipo. Se pinta sólo con `sections.team` en `true`. */
export interface TeamMember {
  name: string;
  role: string;
  /** Foto opcional (se trata con duotono verde/crema en la sección). */
  photo: string | null;
  /** Enlace público, si la persona quiere (LinkedIn, web personal…). */
  url: string | null;
}

/** Un socio o colaborador. Se pinta sólo con `sections.partners` en `true`. */
export interface Partner {
  name: string;
  /** Logo en SVG o PNG con transparencia; se muestra en monocromo. */
  logo: string | null;
  url: string | null;
}

/** Una cifra real. Se pinta sólo con `sections.stats` en `true`. */
export interface Stat {
  /** Número que se muestra (sin ceros a la izquierda). */
  value: number;
  /** Sufijo opcional: `+`, `%`, `k`… */
  suffix: string;
  /** Clave de traducción de la etiqueta. */
  labelKey: 'stat_members' | 'stat_events' | 'stat_countries';
}

/** Una red social. Se pinta sólo con `sections.social` en `true`. */
export interface SocialLink {
  network: 'instagram' | 'telegram' | 'x' | 'linkedin';
  label: string;
  url: string;
}

/** Datos pendientes de Saf: vacíos a propósito (no se inventa nada). */
export const teamMembers: TeamMember[] = [];

export const partners: Partner[] = [];

export const stats: Stat[] = [];

export const socialLinks: SocialLink[] = [];

/** ¿Hay que pintar la sección? Requiere flag activo y datos de verdad. */
export function showSection(flag: Exclude<SectionFlag, 'entityLegalData'>): boolean {
  if (!sections[flag]) return false;
  switch (flag) {
    case 'team':
      return teamMembers.length > 0;
    case 'partners':
      return partners.length > 0;
    case 'stats':
      return stats.length > 0;
    case 'social':
      return socialLinks.length > 0;
    case 'events':
      return true;
  }
}

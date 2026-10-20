import { describe, expect, it } from 'vitest';

import {
  contactEmail,
  entity,
  partners,
  sections,
  showSection,
  socialLinks,
  stats,
  teamMembers,
} from './site';

/**
 * Guardas de la regla de oro del prompt 04: **no se inventa nada**.
 *
 * Si falta el dato real, la sección se queda oculta. Este test impide que un
 * cambio futuro active una sección vacía (que se vería como un hueco en la web)
 * o que alguien rellene los datos legales con texto que parezca real sin que
 * Saf los haya confirmado.
 */

/** Marcadores con los que se declara un dato pendiente: `[NOMBRE LEGAL]`. */
const isPlaceholder = (value: string) => /^\[[^\]]+\]$/.test(value.trim());

describe('showSection', () => {
  const dataBacked = ['team', 'partners', 'stats', 'social'] as const;

  it('no pinta una sección sin datos, aunque el flag esté encendido', () => {
    const previous: Record<string, boolean> = {};
    for (const flag of dataBacked) previous[flag] = sections[flag];

    try {
      for (const flag of dataBacked) sections[flag] = true;

      expect(teamMembers).toHaveLength(0);
      expect(partners).toHaveLength(0);
      expect(stats).toHaveLength(0);
      expect(socialLinks).toHaveLength(0);

      for (const flag of dataBacked) expect(showSection(flag), flag).toBe(false);
    } finally {
      for (const flag of dataBacked) sections[flag] = previous[flag];
    }
  });

  it('los flags de las secciones sin datos están apagados de serie', () => {
    // Cuando Saf pase un dato real, este test se actualiza con su sección.
    expect(showSection('team')).toBe(false);
    expect(showSection('partners')).toBe(false);
    expect(showSection('stats')).toBe(false);
    expect(showSection('social')).toBe(false);
  });
});

describe('datos de la entidad', () => {
  it('mientras no estén confirmados, los datos legales siguen marcados como pendientes', () => {
    if (sections.entityLegalData) return; // Saf ya los confirmó: nada que comprobar.

    expect(isPlaceholder(entity.legalName)).toBe(true);
    expect(isPlaceholder(entity.taxId)).toBe(true);
    expect(isPlaceholder(entity.address)).toBe(true);
    expect(isPlaceholder(entity.registry)).toBe(true);
  });

  it('los datos de la entidad nunca quedan vacíos (vacío = hueco en la web)', () => {
    for (const [key, value] of Object.entries(entity)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('el email público es el mismo que se usa en el contacto', () => {
    expect(contactEmail).toBe(entity.email);
    expect(contactEmail).toContain('@');
  });
});

import { describe, expect, it } from 'vitest';

import {
  LEGAL_DOCS,
  legalAlternates,
  legalContent,
  legalLang,
  legalLangNoticeNeeded,
  legalPath,
  renderLegalText,
} from './legal';
import type { Entity } from '../config/site';

const entity: Entity = {
  legalName: '[NOMBRE LEGAL]',
  taxId: '[CIF]',
  address: '[DOMICILIO]',
  registry: '[REGISTRO]',
  email: 'highdoctorcsc@gmail.com',
};

describe('legalLang', () => {
  it('usa español solo para es y el texto inglés para el resto', () => {
    expect(legalLang('es')).toBe('es');
    expect(legalLang('en')).toBe('en');
    expect(legalLang('de')).toBe('en');
    expect(legalLang('pl')).toBe('en');
  });
});

describe('legalPath', () => {
  it('EN vive en la raíz y ES en /es/', () => {
    expect(legalPath('en', 'privacy')).toBe('/legal/privacy');
    expect(legalPath('en', 'notice')).toBe('/legal/legal-notice');
    expect(legalPath('es', 'notice')).toBe('/es/legal/aviso-legal');
    expect(legalPath('es', 'privacy')).toBe('/es/legal/privacidad');
  });

  it('los otros seis idiomas muestran los slugs en inglés bajo su prefijo', () => {
    expect(legalPath('de', 'cookies')).toBe('/de/legal/cookies');
    expect(legalPath('pl', 'privacy')).toBe('/pl/legal/privacy');
  });
});

describe('legalLangNoticeNeeded', () => {
  it('sólo avisa cuando el texto no está en el idioma de la página', () => {
    expect(legalLangNoticeNeeded('es')).toBe(false);
    expect(legalLangNoticeNeeded('en')).toBe(false);
    expect(legalLangNoticeNeeded('de')).toBe(true);
    expect(legalLangNoticeNeeded('pl')).toBe(true);
  });
});

describe('legalAlternates', () => {
  it('da una ruta legal por idioma, sin repetir y con prefijo correcto', () => {
    const alternates = legalAlternates('cookies');

    expect(alternates).toHaveLength(8);
    expect(new Set(alternates.map((item) => item.lang)).size).toBe(8);
    expect(new Set(alternates.map((item) => item.href)).size).toBe(8);

    const byLang = Object.fromEntries(alternates.map((item) => [item.lang, item.href]));
    expect(byLang.es).toBe('/es/legal/cookies');
    expect(byLang.en).toBe('/legal/cookies');
    expect(byLang.de).toBe('/de/legal/cookies');
  });
});

describe('renderLegalText', () => {
  it('sustituye los datos de la entidad', () => {
    expect(renderLegalText('Titular: {{legalName}} ({{taxId}})', entity)).toBe(
      'Titular: [NOMBRE LEGAL] ([CIF])',
    );
  });

  it('sustituye todas las apariciones del mismo dato', () => {
    expect(renderLegalText('{{email}} o {{email}}', entity)).toBe(
      'highdoctorcsc@gmail.com o highdoctorcsc@gmail.com',
    );
  });

  it('no toca marcadores que no conoce', () => {
    expect(renderLegalText('{{otroDato}}', entity)).toBe('{{otroDato}}');
  });
});

describe('legalContent', () => {
  it('cubre los tres documentos en los dos idiomas y no deja marcadores sin resolver', () => {
    for (const lang of ['es', 'en'] as const) {
      for (const doc of LEGAL_DOCS) {
        const page = legalContent[lang][doc];
        expect(page.title.length).toBeGreaterThan(0);
        expect(page.sections.length).toBeGreaterThan(0);

        const rendered = [
          page.title,
          ...page.sections.flatMap((section) => [section.heading, ...section.body]),
        ]
          .map((text) => renderLegalText(text, entity))
          .join(' ');

        expect(rendered).not.toContain('{{');
      }
    }
  });

  it('la política de privacidad nombra a los encargados del tratamiento', () => {
    const body = legalContent.en.privacy.sections
      .flatMap((section) => section.body)
      .join(' ')
      .toLowerCase();

    expect(body).toContain('web3forms');
    expect(body).toContain('github');
    expect(body).toContain('consent');
    expect(body).toContain('portability');
  });
});

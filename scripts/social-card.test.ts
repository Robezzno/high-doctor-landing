import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { renderOgImage, renderSocialCard } from './social-card';

/** Satori + resvg tardan unos segundos la primera vez (carga de fuentes). */
const RENDER_TIMEOUT = 30_000;

const post = {
  lang: 'es' as const,
  slug: 'nace-high-doctor-foundation',
  title: 'Nace High Doctor Foundation: ciencia abierta sobre cannabinoides',
  hook: 'Nace High Doctor Foundation',
  category: 'fundacion',
  date: new Date('2026-10-01'),
};

describe('generador de tarjetas sociales', () => {
  it('genera la tarjeta de Instagram en JPEG 1080×1350, sRGB y menos de 1 MB', async () => {
    const buffer = await renderSocialCard(post);
    const metadata = await sharp(buffer).metadata();

    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
    expect(metadata.space).toBe('srgb');
    expect(buffer.byteLength).toBeLessThan(1024 * 1024);
  }, RENDER_TIMEOUT);

  it('genera la imagen Open Graph en 1200×630', async () => {
    const buffer = await renderOgImage(post);
    const metadata = await sharp(buffer).metadata();

    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
  }, RENDER_TIMEOUT);

  it('usa el título cuando el post no tiene hook y no se rompe con títulos largos', async () => {
    const buffer = await renderSocialCard({
      ...post,
      hook: undefined,
      title: 'Un título larguísimo para comprobar que la tarjeta aguanta textos de hasta 90 caracteres',
    });
    const metadata = await sharp(buffer).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
  }, RENDER_TIMEOUT);

  it('usa la paleta del tema cuando la categoría es desconocida', async () => {
    const buffer = await renderSocialCard({ ...post, category: 'categoria-inexistente' });
    const metadata = await sharp(buffer).metadata();
    expect(metadata.format).toBe('jpeg');
  }, RENDER_TIMEOUT);
});

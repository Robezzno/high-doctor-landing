import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadHashtags } from '../src/caption.js';
import {
  DEFAULT_API_VERSION,
  MAX_FAILURES,
  type InstagramApi,
  type InstagramState,
  type PostVersion,
  emptyInstagramState,
  errorMessage,
  instagramFlag,
  parseFrontmatter,
  parsePostDate,
  readInstagramState,
  readPostVersions,
  recordFailure,
  runInstagram,
  selectPendingPosts,
  setInstagramFields,
  socialImageUrl,
  waitUntil,
} from '../src/instagram.js';

const FIXTURES = path.join(import.meta.dirname, 'fixtures', 'instagram');
const NOW = new Date('2026-10-20T08:00:00.000Z');
const hashtags = loadHashtags();

/** Copia los fixtures a un directorio temporal para poder escribir en él. */
function tempContentDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hd-ig-'));
  const contentDir = path.join(dir, 'content', 'news');
  cpSync(FIXTURES, contentDir, { recursive: true });
  return contentDir;
}

function fixtureVersions(): PostVersion[] {
  return readPostVersions(FIXTURES, path.dirname(FIXTURES));
}

interface FakeApiOptions {
  imageOk?: boolean;
  limit?: { used: number; total: number } | null;
  statuses?: string[];
  failCreate?: string;
}

function fakeApi(options: FakeApiOptions = {}) {
  const calls = {
    imageChecks: [] as string[],
    createContainers: [] as Array<{ imageUrl: string; caption: string }>,
    statusChecks: [] as string[],
    published: [] as string[],
    limits: 0,
  };
  let statusIndex = 0;
  const statuses = options.statuses ?? ['FINISHED'];
  let created = 0;

  const api: InstagramApi = {
    async imageAvailable(url) {
      calls.imageChecks.push(url);
      return options.imageOk ?? true;
    },
    async publishingLimit() {
      calls.limits += 1;
      return options.limit === undefined ? { used: 0, total: 100 } : options.limit;
    },
    async createContainer(input) {
      if (options.failCreate) throw new Error(options.failCreate);
      calls.createContainers.push(input);
      created += 1;
      return `container-${created}`;
    },
    async containerStatus(containerId) {
      calls.statusChecks.push(containerId);
      const status = statuses[Math.min(statusIndex, statuses.length - 1)];
      statusIndex += 1;
      return status;
    },
    async publishContainer(containerId) {
      calls.published.push(containerId);
      return `1790000000000${calls.published.length}`;
    },
  };

  return { api, calls };
}

function repoFor(contentDir: string) {
  const repoRoot = path.dirname(path.dirname(contentDir));
  return { repoRoot, stateFileAbs: path.join(repoRoot, 'state', 'instagram.json') };
}

const noSleep = async () => {};

describe('selección de posts', () => {
  const versions = fixtureVersions();

  it('elige sólo pending, no borrador y con fecha pasada', () => {
    const { selected, skipped, pendingRemaining } = selectPendingPosts(versions, { now: NOW, lang: 'es' });

    expect(selected).toHaveLength(1);
    expect(selected[0]?.translationKey).toBe('ensayo-cbd-dolor');
    expect(selected[0]?.lang).toBe('es');
    expect(selected[0]?.imageUrl).toBe('https://highdoctor.foundation/social/es/ensayo-cbd-dolor.jpg');
    expect(pendingRemaining).toBe(1);

    const reasons = skipped.map((entry) => `${entry.relPath}: ${entry.reason}`);
    expect(reasons).toContainEqual(expect.stringContaining('borrador (draft: true)'));
    expect(reasons).toContainEqual(expect.stringContaining('programado para el futuro'));
    expect(reasons).toContainEqual(expect.stringContaining('instagram: off'));
    expect(reasons).toContainEqual(expect.stringContaining('ya publicado en Instagram'));
    expect(reasons).toContainEqual(expect.stringContaining('mismo post: se publica la versión es'));
    expect(reasons).toContainEqual(expect.stringContaining('en cola: se publica en la siguiente ejecución'));
  });

  it('con IG_LANG=en publica la versión inglesa del mismo post', () => {
    const { selected } = selectPendingPosts(versions, { now: NOW, lang: 'en' });
    expect(selected).toHaveLength(1);
    expect(selected[0]?.lang).toBe('en');
    expect(selected[0]?.slug).toBe('cbd-pain-trial');
    expect(selected[0]?.imageUrl).toBe('https://highdoctor.foundation/social/en/cbd-pain-trial.jpg');
  });

  it('deduplica ES/EN: el mismo translationKey entra una sola vez', () => {
    const { selected } = selectPendingPosts(versions, { now: NOW, lang: 'es', maxPerRun: 10 });
    const keys = selected.map((post) => post.translationKey);
    expect(keys).toEqual(['ensayo-cbd-dolor', 'evento-fundacion']);
    expect(keys.filter((key) => key === 'ensayo-cbd-dolor')).toHaveLength(1);
  });

  it('respeta maxPerRun y ordena por fecha', () => {
    const first = selectPendingPosts(versions, { now: NOW, lang: 'es', maxPerRun: 1 });
    expect(first.selected.map((post) => post.translationKey)).toEqual(['ensayo-cbd-dolor']);

    const two = selectPendingPosts(versions, { now: NOW, lang: 'es', maxPerRun: 2 });
    expect(two.selected.map((post) => post.translationKey)).toEqual(['ensayo-cbd-dolor', 'evento-fundacion']);
    expect(two.pendingRemaining).toBe(0);
  });

  it('un post sin versión en el idioma preferido cae en ES', () => {
    const soloEs: PostVersion = {
      lang: 'es',
      slug: 'solo-es',
      path: '/repo/es/solo-es.md',
      relPath: 'es/solo-es.md',
      raw: '',
      data: { title: 'Solo ES', summary: 'x', date: '2026-10-01', translationKey: 'solo-es', category: 'salud' },
    };
    const { selected } = selectPendingPosts([soloEs], { now: NOW, lang: 'en' });
    expect(selected[0]?.lang).toBe('es');
  });

  it('no publica nada si la fecha no se puede leer', () => {
    const sinFecha: PostVersion = {
      lang: 'es',
      slug: 'sin-fecha',
      path: '/repo/es/sin-fecha.md',
      relPath: 'es/sin-fecha.md',
      raw: '',
      data: { title: 'Sin fecha', date: 'no-es-una-fecha', instagram: 'pending' },
    };
    const { selected, skipped } = selectPendingPosts([sinFecha], { now: NOW });
    expect(selected).toHaveLength(0);
    expect(skipped[0]?.reason).toBe('sin fecha válida');
  });
});

describe('utilidades del frontmatter', () => {
  it('lee las dos versiones de idioma de los fixtures', () => {
    const versions = fixtureVersions();
    expect(versions.map((version) => `${version.lang}/${version.slug}`)).toEqual([
      'es/apagada',
      'es/borrador-interno',
      'es/ensayo-cbd-dolor',
      'es/evento-fundacion',
      'es/programada-manana',
      'es/ya-publicada',
      'en/cbd-pain-trial',
    ]);
    expect(versions[2]?.data.translationKey).toBe('ensayo-cbd-dolor');
  });

  it('parseFrontmatter acepta fechas sueltas y timestamps', () => {
    expect(parsePostDate('2026-10-01')?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(parsePostDate('2026-10-20T08:30:00.000Z')?.toISOString()).toBe('2026-10-20T08:30:00.000Z');
    expect(parsePostDate('mañana')).toBeNull();
    expect(parseFrontmatter('sin frontmatter')).toBeNull();
  });

  it('instagramFlag normaliza y cae en pending', () => {
    expect(instagramFlag({ instagram: ' OFF ' })).toBe('off');
    expect(instagramFlag({})).toBe('pending');
  });

  it('setInstagramFields cambia sólo las claves de Instagram y deja el resto igual', () => {
    const raw = readFileSync(path.join(FIXTURES, 'es', 'ensayo-cbd-dolor.md'), 'utf8');
    const updated = setInstagramFields(raw, { instagram: 'published', instagramId: '17900000000000000' });
    const split = parseFrontmatter(updated);

    expect(split?.data.instagram).toBe('published');
    expect(split?.data.instagramId).toBe('17900000000000000');
    expect(split?.data.title).toBe('Un ensayo español mide el efecto del CBD en el dolor crónico');
    expect(split?.data.tags).toEqual(['cbd', 'dolor']);
    expect(split?.data.source).toEqual({ name: 'Cáñamo', url: 'https://canamo.net/noticia/ensayo-cbd-dolor' });
    expect(split?.body.trim()).toBe('Cuerpo del post de prueba.');
    // Idempotente: aplicarlo otra vez da lo mismo.
    expect(setInstagramFields(updated, { instagram: 'published', instagramId: '17900000000000000' })).toBe(updated);
  });

  it('socialImageUrl quita la barra final de la base', () => {
    expect(socialImageUrl('es', 'nace-high-doctor-foundation', 'https://highdoctor.foundation/')).toBe(
      'https://highdoctor.foundation/social/es/nace-high-doctor-foundation.jpg',
    );
  });

  it('la versión de la API está fijada en la documentación de Meta', () => {
    expect(DEFAULT_API_VERSION).toMatch(/^v\d+\.\d+$/);
  });
});

describe('contador de fallos', () => {
  it('suma fallos y avisa al llegar a 3', () => {
    let state: InstagramState = emptyInstagramState();
    const first = recordFailure(state, 'ensayo-cbd-dolor', 'boom', NOW);
    expect(first.count).toBe(1);
    expect(first.giveUp).toBe(false);
    const second = recordFailure(first.state, 'ensayo-cbd-dolor', 'boom', NOW);
    expect(second.count).toBe(2);
    expect(second.giveUp).toBe(false);
    const third = recordFailure(second.state, 'ensayo-cbd-dolor', 'boom', NOW);
    expect(third.count).toBe(MAX_FAILURES);
    expect(third.giveUp).toBe(true);
    expect(third.state.failures['ensayo-cbd-dolor']?.lastError).toBe('boom');
  });

  it('el estado ilegible no rompe el flujo', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'hd-ig-state-'));
    const file = path.join(dir, 'instagram.json');
    writeFileSync(file, '{ esto no es json', 'utf8');
    expect(readInstagramState(file)).toEqual(emptyInstagramState());
    expect(readInstagramState(path.join(dir, 'no-existe.json'))).toEqual(emptyInstagramState());
  });
});

describe('waitUntil — backoff de la imagen', () => {
  it('para en el primer intento si la imagen ya está', async () => {
    let attempts = 0;
    const result = await waitUntil({ probe: async () => (attempts += 1) > 0, sleep: noSleep });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.waitedMs).toBe(0);
  });

  it('se rinde al agotar el tiempo sin pasarse del límite', async () => {
    const result = await waitUntil({
      probe: async () => false,
      maxWaitMs: 10000,
      initialDelayMs: 1000,
      sleep: noSleep,
    });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBeGreaterThan(1);
    expect(result.waitedMs).toBeLessThanOrEqual(10000);
  });
});

describe('runInstagram — flujo completo con API falsa', () => {
  it('publica una vez, marca ES y EN como published y commitea', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const { api, calls } = fakeApi();
    const commits: Array<{ paths: string[]; message: string }> = [];
    const logs: string[] = [];

    const result = await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      lang: 'es',
      maxPerRun: 1,
      dryRun: false,
      api,
      hashtags,
      commit: (paths, message) => commits.push({ paths, message }),
      log: (line) => logs.push(line),
      sleep: noSleep,
    });

    expect(result.published).toHaveLength(1);
    expect(result.published[0]?.instagramId).toBe('17900000000001');
    expect(calls.imageChecks).toEqual(['https://highdoctor.foundation/social/es/ensayo-cbd-dolor.jpg']);
    expect(calls.createContainers).toHaveLength(1);
    expect(calls.limits).toBe(1);
    expect(calls.published).toEqual(['container-1']);

    const caption = calls.createContainers[0]?.caption ?? '';
    expect(caption.startsWith('Un ensayo mide el CBD en el dolor crónico')).toBe(true);
    expect(caption).toContain('Fuente: Cáñamo');
    expect(caption.length).toBeLessThanOrEqual(2200);

    // Las DOS versiones del post quedan publicadas y con el mismo id.
    for (const file of ['es/ensayo-cbd-dolor.md', 'en/cbd-pain-trial.md']) {
      const data = parseFrontmatter(readFileSync(path.join(contentDir, file), 'utf8'))?.data;
      expect(data?.instagram, file).toBe('published');
      expect(data?.instagramId, file).toBe('17900000000001');
    }
    // Los borradores y las apagadas no se tocan.
    expect(
      parseFrontmatter(readFileSync(path.join(contentDir, 'es', 'borrador-interno.md'), 'utf8'))?.data.instagram,
    ).toBe('pending');
    expect(readInstagramState(stateFileAbs).failures).toEqual({});

    expect(commits).toHaveLength(1);
    expect(commits[0]?.message).toBe('instagram: publicado "Un ensayo español mide el efecto del CBD en el dolor crónico"');
    expect(commits[0]?.paths).toEqual([
      'content/news/es/ensayo-cbd-dolor.md',
      'content/news/en/cbd-pain-trial.md',
      'state/instagram.json',
    ]);
    expect(logs.join('\n')).toContain('Publicado en Instagram');
  });

  it('con IG_LANG=en publica la tarjeta inglesa y marca las dos versiones', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const { api, calls } = fakeApi();

    await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      lang: 'en',
      maxPerRun: 1,
      dryRun: false,
      api,
      hashtags,
      commit: () => {},
      sleep: noSleep,
    });

    expect(calls.imageChecks).toEqual(['https://highdoctor.foundation/social/en/cbd-pain-trial.jpg']);
    const caption = calls.createContainers[0]?.caption ?? '';
    expect(caption.startsWith('A trial measures CBD for chronic pain')).toBe(true);
    expect(caption).toContain('link in bio');
    for (const file of ['es/ensayo-cbd-dolor.md', 'en/cbd-pain-trial.md']) {
      const data = parseFrontmatter(readFileSync(path.join(contentDir, file), 'utf8'))?.data;
      expect(data?.instagram).toBe('published');
    }
  });

  it('publica varios posts si maxPerRun lo permite', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const { api } = fakeApi();

    const result = await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      maxPerRun: 5,
      dryRun: false,
      api,
      hashtags,
      commit: () => {},
      sleep: noSleep,
    });

    expect(result.published.map((post) => post.translationKey)).toEqual(['ensayo-cbd-dolor', 'evento-fundacion']);
    expect(result.pendingRemaining).toBe(0);
  });

  it('en dry run imprime caption y URL y no escribe ni llama a Meta', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const before = readFileSync(path.join(contentDir, 'es', 'ensayo-cbd-dolor.md'), 'utf8');
    const { api, calls } = fakeApi();
    const commits: string[] = [];

    const result = await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      dryRun: true,
      api: null,
      hashtags,
      commit: (paths, message) => commits.push(message),
      sleep: noSleep,
    });

    expect(result.previews).toHaveLength(1);
    expect(result.previews[0]?.imageUrl).toBe('https://highdoctor.foundation/social/es/ensayo-cbd-dolor.jpg');
    expect(result.previews[0]?.caption).toContain('highdoctor.foundation');
    expect(result.published).toHaveLength(0);
    expect(calls.createContainers).toHaveLength(0);
    expect(commits).toHaveLength(0);
    expect(readFileSync(path.join(contentDir, 'es', 'ensayo-cbd-dolor.md'), 'utf8')).toBe(before);
  });

  it('no publica si se ha agotado el cupo de Instagram', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const { api, calls } = fakeApi({ limit: { used: 100, total: 100 } });
    const commits: string[] = [];

    const result = await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      dryRun: false,
      api,
      hashtags,
      commit: (paths, message) => commits.push(message),
      sleep: noSleep,
    });

    expect(result.quotaExhausted).toBe(true);
    expect(result.published).toHaveLength(0);
    expect(calls.createContainers).toHaveLength(0);
    expect(commits).toHaveLength(0);
    expect(
      parseFrontmatter(readFileSync(path.join(contentDir, 'es', 'ensayo-cbd-dolor.md'), 'utf8'))?.data.instagram,
    ).toBe('pending');
  });

  it('si la imagen no llega a estar en línea, el post sigue pending y suma un fallo', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const { api, calls } = fakeApi({ imageOk: false });
    const commits: Array<{ paths: string[]; message: string }> = [];

    const result = await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      dryRun: false,
      api,
      hashtags,
      commit: (paths, message) => commits.push({ paths, message }),
      sleep: noSleep,
    });

    expect(calls.createContainers).toHaveLength(0);
    expect(result.failed[0]?.failures).toBe(1);
    expect(result.failed[0]?.disabled).toBe(false);
    expect(readInstagramState(stateFileAbs).failures['ensayo-cbd-dolor']?.count).toBe(1);
    expect(
      parseFrontmatter(readFileSync(path.join(contentDir, 'es', 'ensayo-cbd-dolor.md'), 'utf8'))?.data.instagram,
    ).toBe('pending');
    expect(commits[0]?.message).toBe(
      'instagram: fallo al publicar "Un ensayo español mide el efecto del CBD en el dolor crónico"',
    );
    expect(commits[0]?.paths).toEqual(['state/instagram.json']);
  });

  it('tras 3 fallos seguidos pasa el post a instagram: off y lo commitea', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    const commits: string[] = [];

    const run = () =>
      runInstagram({
        repoRoot,
        contentDirAbs: contentDir,
        stateFileAbs,
        now: NOW,
        dryRun: false,
        api: fakeApi({ failCreate: 'Instagram 400: media upload failed' }).api,
        hashtags,
        commit: (paths, message) => commits.push(message),
        sleep: noSleep,
      });

    const first = await run();
    const second = await run();
    const third = await run();

    expect(first.failed[0]?.failures).toBe(1);
    expect(second.failed[0]?.failures).toBe(2);
    expect(third.failed[0]?.failures).toBe(MAX_FAILURES);
    expect(third.failed[0]?.disabled).toBe(true);
    expect(commits[2]).toBe('instagram: desactivado "Un ensayo español mide el efecto del CBD en el dolor crónico"');
    for (const file of ['es/ensayo-cbd-dolor.md', 'en/cbd-pain-trial.md']) {
      expect(parseFrontmatter(readFileSync(path.join(contentDir, file), 'utf8'))?.data.instagram).toBe('off');
    }

    // El siguiente arranque ya no lo intenta: sigue en la cola el otro post.
    const fourth = await run();
    expect(fourth.selected).toBe(1);
    expect(fourth.failed.map((failed) => failed.translationKey)).toEqual(['evento-fundacion']);
  });

  it('un post publicado reinicia su contador de fallos', async () => {
    const contentDir = tempContentDir();
    const { repoRoot, stateFileAbs } = repoFor(contentDir);
    mkdirSync(path.dirname(stateFileAbs), { recursive: true });
    writeFileSync(
      stateFileAbs,
      `${JSON.stringify(
        { version: 1, updatedAt: NOW.toISOString(), failures: { 'ensayo-cbd-dolor': { count: 2, lastError: 'x', lastAttemptAt: NOW.toISOString() } } },
        null,
        2,
      )}\n`,
      'utf8',
    );
    const { api } = fakeApi();

    await runInstagram({
      repoRoot,
      contentDirAbs: contentDir,
      stateFileAbs,
      now: NOW,
      dryRun: false,
      api,
      hashtags,
      commit: () => {},
      sleep: noSleep,
    });

    expect(readInstagramState(stateFileAbs).failures).toEqual({});
  });

  it('errorMessage y el flujo con estado corrupto no lanzan', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('boom')).toBe('boom');
  });
});

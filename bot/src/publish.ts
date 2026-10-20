/**
 * Publicación: escribe los .md ES/EN del contrato de contenido, actualiza
 * state/seen.json y hace el commit (directo a main o en un PR de revisión).
 *
 * Autoría de los commits: SIEMPRE una persona (`output.commit_author`), nunca
 * una IA. Sin `Co-Authored-By`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { canonicalizeUrl, normalizeText } from './filter.js';
import type { BotConfig, FeedItem, GeneratedPost, SeenState } from './types.js';

/**
 * URL de la fuente sin parámetros de seguimiento (utm_*, fbclid…). Se mantiene
 * el esquema y el resto de la URL tal cual viene en el feed.
 */
export function cleanSourceUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_') || ['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'igshid'].includes(lower)) {
        url.searchParams.delete(key);
      }
    }
    url.hash = '';
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

export function slugify(title: string, maxLength = 60): string {
  const base = normalizeText(title)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (base.length <= maxLength) return base || 'noticia';
  // Al recortar, se quita la última palabra incompleta.
  const trimmed = base.slice(0, maxLength).replace(/-[^-]*$/, '').replace(/-$/, '');
  return trimmed || 'noticia';
}

/** Frontmatter exacto del contrato de contenido (docs/CONTENIDO.md). */
export interface PostFrontmatter {
  title: string;
  summary: string;
  date: string;
  lang: 'es' | 'en';
  translationKey: string;
  category: string;
  tags: string[];
  source: { name: string; url: string };
  author: string;
  draft: boolean;
  instagram: string;
  instagramHook: string;
}

export function buildFrontmatter(
  lang: 'es' | 'en',
  post: GeneratedPost,
  item: FeedItem,
  translationKey: string,
  date: Date,
  config: BotConfig,
): PostFrontmatter {
  const localized = post[lang];
  return {
    title: localized.title,
    summary: localized.summary,
    date: date.toISOString(),
    lang,
    translationKey,
    category: post.category,
    tags: localized.tags,
    source: { name: item.sourceName, url: cleanSourceUrl(item.url) },
    author: config.output.author,
    draft: false,
    instagram: config.output.instagram,
    instagramHook: localized.instagramHook,
  };
}

/** Markdown completo con frontmatter YAML + cuerpo. */
export function renderPost(frontmatter: PostFrontmatter, body: string): string {
  const yaml = stringifyYaml(frontmatter, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n${body.trim()}\n`;
}

export interface PostFile {
  lang: 'es' | 'en';
  path: string;
  content: string;
}

export function buildPostFiles(
  post: GeneratedPost,
  item: FeedItem,
  date: Date,
  config: BotConfig,
  contentDirPath: string,
): { translationKey: string; files: PostFile[] } {
  let translationKey = slugify(post.es.title);
  const targetDir = path.join(contentDirPath, 'es');
  if (existsSync(path.join(targetDir, `${translationKey}.md`))) {
    // Mismo slug que un post existente: se desambigua con la fecha.
    translationKey = `${translationKey}-${date.toISOString().slice(0, 10)}`;
  }

  const files: PostFile[] = (['es', 'en'] as const).map((lang) => {
    const frontmatter = buildFrontmatter(lang, post, item, translationKey, date, config);
    return {
      lang,
      path: path.join(contentDirPath, lang, `${translationKey}.md`),
      content: renderPost(frontmatter, post[lang].body),
    };
  });

  return { translationKey, files };
}

export function writePostFiles(files: PostFile[]): void {
  for (const file of files) {
    mkdirSync(path.dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, 'utf8');
  }
}

/** Añade la noticia al estado (idempotencia). Devuelve una copia nueva. */
export function addSeenEntry(state: SeenState, item: FeedItem, now: Date): SeenState {
  const canonicalUrl = canonicalizeUrl(item.url);
  const already = state.seen.some((entry) => canonicalizeUrl(entry.url) === canonicalUrl);
  return {
    version: state.version || 1,
    updatedAt: now.toISOString(),
    seen: already
      ? state.seen
      : [
          ...state.seen,
          {
            url: item.url,
            title: item.title,
            seenAt: now.toISOString(),
            sourceId: item.sourceId,
          },
        ],
  };
}

export function writeSeenState(file: string, state: SeenState): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

/** Títulos de los posts ya publicados (ES y EN) para deduplicar. */
export function readExistingPostTitles(contentDirPath: string): string[] {
  const titles: string[] = [];
  for (const lang of ['es', 'en']) {
    const dir = path.join(contentDirPath, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      try {
        const raw = readFileSync(path.join(dir, file), 'utf8');
        const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!match) continue;
        const data = parseYaml(match[1]) as { title?: unknown; translationKey?: unknown };
        if (typeof data.title === 'string') titles.push(data.title);
      } catch {
        // Un post ilegible no debe tumbar el bot.
      }
    }
  }
  return titles;
}

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export interface PublishOptions {
  repoRoot: string;
  config: BotConfig;
  translationKey: string;
  /** Título ES del post, para mensaje de commit y título del PR. */
  title: string;
  /** Rutas relativas a la raíz del repo que hay que commitear. */
  paths: string[];
}

export interface PublishOutcome {
  mode: 'review' | 'publish';
  branch: string;
  commit: string;
  prUrl?: string;
}

/** Commit + push. En modo review crea rama y PR; en modo publish va a main. */
export function commitAndPublish({
  repoRoot,
  config,
  translationKey,
  title,
  paths,
}: PublishOptions): PublishOutcome {
  const author = config.output.commitAuthor;
  const git = (args: string[]) =>
    run('git', ['-c', `user.name=${author.name}`, '-c', `user.email=${author.email}`, ...args], repoRoot);

  const message = `noticia: ${title}`;
  const mode = config.mode;

  git(['add', ...paths]);

  if (mode === 'review') {
    const branch = `${config.output.prBranchPrefix}${translationKey}`;
    try {
      git(['checkout', '-b', branch]);
    } catch {
      // La rama ya existe de un intento anterior: se reutiliza.
      git(['checkout', branch]);
    }
    git(['commit', '-m', message]);
    git(['push', '-u', 'origin', branch]);
    const commit = git(['rev-parse', 'HEAD']);

    ensureLabel(repoRoot, config.output.prLabel);
    const body = [
      'Noticia generada por el bot de noticias de High Doctor Foundation.',
      '',
      '- Revisa que el texto tenga sentido y cite la fuente.',
      '- Al mergear, el post se publica y sale en Instagram con el prompt 08.',
      '',
      'Fuente y datos están en el frontmatter del post.',
    ].join('\n');

    let prUrl = '';
    try {
      prUrl = run(
        'gh',
        [
          'pr',
          'create',
          '--base',
          'main',
          '--head',
          branch,
          '--title',
          message,
          '--body',
          body,
          '--label',
          config.output.prLabel,
        ],
        repoRoot,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Commit hecho pero no se pudo abrir el PR: ${message}`);
    }

    return { mode, branch, commit, prUrl };
  }

  git(['commit', '-m', message]);
  git(['push', 'origin', 'HEAD:main']);
  const commit = git(['rev-parse', 'HEAD']);
  return { mode, branch: 'main', commit };
}

/** Crea la etiqueta del PR si no existe (gh necesita `issues: write`). */
function ensureLabel(repoRoot: string, label: string): void {
  try {
    run('gh', ['label', 'create', label, '--color', 'FBCA04', '--description', 'Noticia generada por el bot'], repoRoot);
  } catch {
    // Ya existe o no hay permisos: `gh pr create --label` avisará si falla.
  }
}

/**
 * Un push hecho con GITHUB_TOKEN no dispara otros workflows. Para que el
 * deploy se ejecute tras publicar en main, se lanza a mano.
 */
export function triggerDeploy(repoRoot: string, workflow = 'deploy.yml', ref = 'main'): boolean {
  try {
    run('gh', ['workflow', 'run', workflow, '--ref', ref], repoRoot);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[publish] no se pudo lanzar ${workflow}: ${message}`);
    return false;
  }
}

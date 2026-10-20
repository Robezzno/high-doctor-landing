/**
 * Punto de entrada del bot de noticias.
 *
 * Flujo: fuentes → filtro → extracción del artículo → LLM → validación Zod +
 * anti-copia → post ES/EN → commit (review: PR | publish: main).
 *
 * Variables de entorno:
 *   BOT_MODE        review (por defecto) | publish
 *   DRY_RUN         1 imprime el post en el log/summary sin escribir ni commitear
 *   LLM_PROVIDER    github-models (por defecto) | anthropic
 *   LLM_MODEL       modelo a usar (por defecto openai/gpt-4o-mini)
 *   GITHUB_TOKEN    lo pone Actions; también sirve para GitHub Models
 *   ANTHROPIC_API_KEY  sólo si LLM_PROVIDER=anthropic (no configurado)
 */
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { extractArticle } from './article.js';
import {
  REPO_ROOT,
  contentDir,
  envFlag,
  loadConfig,
  loadSources,
  readSeen,
  stateFile,
} from './config.js';
import { fetchAll } from './fetch.js';
import { selectArticle } from './filter.js';
import { createProvider } from './llm.js';
import {
  addSeenEntry,
  buildPostFiles,
  commitAndPublish,
  readExistingPostTitles,
  triggerDeploy,
  writePostFiles,
  writeSeenState,
} from './publish.js';
import type { GeneratedPost, FeedItem } from './types.js';
import { generatePost } from './write.js';

function summary(line = ''): void {
  console.log(line);
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (target) {
    try {
      appendFileSync(target, `${line}\n`, 'utf8');
    } catch {
      // El summary es opcional.
    }
  }
}

async function main(): Promise<number> {
  const dryRun = envFlag('DRY_RUN');
  const config = loadConfig();
  const sources = loadSources();
  const now = new Date();

  summary(`# Bot de noticias — ${now.toISOString()}`);
  summary('');
  summary(`Modo: **${config.mode}**${dryRun ? ' (dry run: no se escribe nada)' : ''}`);
  summary(`LLM: **${config.llm.provider} / ${config.llm.model}**`);
  summary('');

  const { items, errors } = await fetchAll(sources);
  summary(`Fuentes leídas: ${sources.length} (${errors.length} con error), ${items.length} noticias.`);
  for (const error of errors) summary(`- ⚠️ ${error.sourceId}: ${error.message}`);

  const seen = readSeen(stateFile(config));
  const existingTitles = readExistingPostTitles(contentDir(config));

  const selection = selectArticle({ items, config, seen, existingTitles, now });

  if (!selection.selected) {
    summary('');
    summary('**Sin noticia que supere el filtro: no se publica nada.**');
    const reasons = selection.rejected.reduce<Record<string, number>>((acc, item) => {
      acc[item.reason] = (acc[item.reason] ?? 0) + 1;
      return acc;
    }, {});
    for (const [reason, count] of Object.entries(reasons)) summary(`- ${reason}: ${count}`);
    return 0;
  }

  const item: FeedItem = selection.selected;
  summary('');
  summary(`Noticia elegida: **${item.title}**`);
  summary(`- Fuente: ${item.sourceName}`);
  summary(`- URL: ${item.url}`);
  summary(`- Publicada: ${item.publishedAt?.toISOString() ?? 'sin fecha'}`);
  summary(`- Puntuación: ${selection.scored[0]?.score ?? 0}`);
  if (selection.scored[0]?.keywordHits.length) {
    summary(`- Coincidencias: ${selection.scored[0].keywordHits.join(', ')}`);
  }

  const article = await extractArticle(item.url);
  summary(
    article.text
      ? `- Artículo extraído: ${article.text.length} caracteres`
      : `- Sin texto del artículo (${article.skippedReason ?? 'sin acceso'}); se escribe con título y resumen`,
  );

  const provider = createProvider(config);
  let generated: GeneratedPost;
  let overlap = 0;
  try {
    const result = await generatePost({ item, article, provider, config });
    generated = result.post;
    overlap = result.overlap;
    summary('');
    summary(
      `LLM: ${result.attempts} intento(s), ${result.lengthByLang.join(' · ')}, ` +
        `8-gramas copiados: ${(result.overlap * 100).toFixed(1)} %`,
    );
    for (const line of result.history) summary(`- ${line}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summary('');
    summary(`**❌ No se publica: ${message}**`);
    return 1;
  }

  const { translationKey, files } = buildPostFiles(generated, item, now, config, contentDir(config));
  const preview = files
    .map((file) => `### ${file.lang.toUpperCase()} — ${path.basename(file.path)}\n\n\`\`\`markdown\n${file.content}\n\`\`\``)
    .join('\n\n');

  if (dryRun) {
    summary('');
    summary(`Slug: \`${translationKey}\` · 8-gramas copiados: ${(overlap * 100).toFixed(1)} %`);
    summary('');
    summary(preview);
    return 0;
  }

  writePostFiles(files);
  const nextSeen = addSeenEntry(seen, item, now);
  writeSeenState(stateFile(config), nextSeen);

  const relativePaths = [
    ...files.map((file) => path.relative(REPO_ROOT, file.path)),
    path.relative(REPO_ROOT, stateFile(config)),
  ];

  const outcome = commitAndPublish({
    repoRoot: REPO_ROOT,
    config,
    translationKey,
    title: generated.es.title,
    paths: relativePaths,
  });

  summary('');
  summary(`✅ Publicado en modo **${outcome.mode}** (\`${outcome.branch}\`, commit \`${outcome.commit.slice(0, 7)}\`)`);
  if (outcome.prUrl) summary(`PR: ${outcome.prUrl}`);

  if (outcome.mode === 'publish') {
    // Un push con GITHUB_TOKEN no dispara otros workflows: se lanza el deploy a mano.
    const started = triggerDeploy(REPO_ROOT);
    summary(started ? 'Deploy lanzado con `gh workflow run deploy.yml`.' : '⚠️ No se pudo lanzar el deploy.');
  } else {
    summary('Al mergear el PR se publica (el push del merge sí dispara el deploy).');
  }

  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    summary(`**❌ Error del bot:** ${message}`);
    process.exitCode = 1;
  });

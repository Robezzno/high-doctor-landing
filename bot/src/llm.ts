/**
 * Proveedores de LLM.
 *
 * `github-models` es el que se usa por defecto: gratis con el GITHUB_TOKEN del
 * workflow (permiso `models: read`). `anthropic` está implementado pero NO
 * configurado: si algún día se quiere usar, hay que definir ANTHROPIC_API_KEY y
 * LLM_PROVIDER=anthropic. Nada de claves en el repo.
 */
import type { BotConfig } from './types.js';

export interface CompletionRequest {
  system: string;
  user: string;
  temperature?: number;
}

export interface LLMProvider {
  readonly id: string;
  readonly model: string;
  complete(request: CompletionRequest): Promise<string>;
}

const GITHUB_MODELS_ENDPOINT =
  process.env.GITHUB_MODELS_ENDPOINT?.trim() ?? 'https://models.github.ai/inference/chat/completions';
const ANTHROPIC_ENDPOINT =
  process.env.ANTHROPIC_ENDPOINT?.trim() ?? 'https://api.anthropic.com/v1/messages';

interface OpenAICompatibleResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

/** GitHub Models (endpoint compatible con la API de OpenAI). */
export class GitHubModelsProvider implements LLMProvider {
  readonly id = 'github-models';

  constructor(
    readonly model: string,
    private readonly token = process.env.GITHUB_TOKEN ?? '',
    private readonly timeoutMs = 120_000,
  ) {}

  async complete({ system, user, temperature = 0.4 }: CompletionRequest): Promise<string> {
    if (!this.token) {
      throw new Error(
        'Falta GITHUB_TOKEN para usar GitHub Models. En Actions lo pone el propio workflow (permissions: models: read).',
      );
    }

    const response = await fetch(GITHUB_MODELS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        model: this.model,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const payload = (await response.json().catch(() => ({}))) as OpenAICompatibleResponse;
    if (!response.ok) {
      throw new Error(
        `GitHub Models ${response.status}: ${payload.error?.message ?? response.statusText}`,
      );
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('GitHub Models devolvió una respuesta vacía');
    return content;
  }
}

/** Anthropic Messages API. Implementado, no configurado por defecto. */
export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic';

  constructor(
    readonly model: string,
    private readonly apiKey = process.env.ANTHROPIC_API_KEY ?? '',
    private readonly timeoutMs = 120_000,
  ) {}

  async complete({ system, user, temperature = 0.4 }: CompletionRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'Falta ANTHROPIC_API_KEY. El proveedor anthropic es de pago: no se configura sin el OK explícito de Saf (docs/PLAN.md §4).',
      );
    }

    const response = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        temperature,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      content?: { type: string; text?: string }[];
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(`Anthropic ${response.status}: ${payload.error?.message ?? response.statusText}`);
    }

    const text = (payload.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('\n')
      .trim();
    if (!text) throw new Error('Anthropic devolvió una respuesta vacía');
    return text;
  }
}

export function createProvider(config: BotConfig): LLMProvider {
  if (config.llm.provider === 'anthropic') {
    return new AnthropicProvider(config.llm.model, process.env.ANTHROPIC_API_KEY, config.llm.timeoutMs);
  }
  return new GitHubModelsProvider(config.llm.model, process.env.GITHUB_TOKEN, config.llm.timeoutMs);
}

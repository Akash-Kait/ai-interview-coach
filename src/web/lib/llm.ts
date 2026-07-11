import type { LlmClient } from '../../core';
import type { LlmConfig } from './llmConfig';
import { createBrowserLlmClient } from './browserLlmClient';
import { createOpenAiCompatibleLlmClient } from './openAiCompatibleLlmClient';

/** Pick the transport for the configured provider. Anthropic keeps its dedicated
 *  browser client; every other provider goes through the OpenAI-compatible one. */
export function createLlmClient(
  config: LlmConfig,
  getApiKey: () => string | null,
  fetchImpl?: typeof fetch,
): LlmClient {
  if (config.provider === 'anthropic') {
    return createBrowserLlmClient(getApiKey, fetchImpl);
  }
  return createOpenAiCompatibleLlmClient(getApiKey, config.baseUrl, config.model, fetchImpl);
}

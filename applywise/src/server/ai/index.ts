import { OllamaProvider } from "./ollama-provider";
import { MockAiProvider } from "./mock-provider";
import type { AiProvider } from "./types";

let _provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!_provider) {
    // AI_MOCK=true skips Ollama — used in CI and E2E tests
    _provider =
      process.env.AI_MOCK === "true" ? new MockAiProvider() : new OllamaProvider();
  }
  return _provider;
}

export type { AiProvider };
export type { GenerateTextInput, GenerateJsonInput } from "./types";

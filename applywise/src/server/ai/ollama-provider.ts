import { z } from "zod";
import type { AiProvider, GenerateJsonInput, GenerateTextInput } from "./types";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

export class OllamaProvider implements AiProvider {
  async generateText(input: GenerateTextInput): Promise<string> {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: input.prompt,
        system: input.systemPrompt,
        stream: false,
        options: {
          num_predict: input.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response as string;
  }

  async generateJson<T>(input: GenerateJsonInput<T>): Promise<T> {
    const systemPrompt = [
      input.systemPrompt ?? "",
      "Respond ONLY with valid JSON. No markdown, no explanation, no code fences. Only raw JSON.",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.generateText({
      prompt: input.prompt,
      systemPrompt,
      maxTokens: input.maxTokens,
    });

    const json = extractJson(raw);
    return input.schema.parse(json);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

function extractJson(raw: string): unknown {
  // Strip markdown code fences if the model adds them anyway
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : raw;
  return JSON.parse(text.trim());
}

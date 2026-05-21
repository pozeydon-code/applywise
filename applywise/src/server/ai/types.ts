export type GenerateTextInput = {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
};

export type GenerateJsonInput<T> = {
  prompt: string;
  systemPrompt?: string;
  schema: import("zod").ZodType<T>;
  maxTokens?: number;
};

export interface AiProvider {
  generateText(input: GenerateTextInput): Promise<string>;
  generateJson<T>(input: GenerateJsonInput<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}

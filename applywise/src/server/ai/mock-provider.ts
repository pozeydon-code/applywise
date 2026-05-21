import type { AiProvider, GenerateTextInput, GenerateJsonInput } from "./types";

/**
 * Used in tests and CI where a local Ollama instance is not available.
 * Returns deterministic, structurally valid responses for every schema.
 */
export class MockAiProvider implements AiProvider {
  async generateText(_input: GenerateTextInput): Promise<string> {
    return "Mock AI response for testing.";
  }

  async generateJson<T>(input: GenerateJsonInput<T>): Promise<T> {
    const mock = buildMockForSchema(input.schema);
    return input.schema.parse(mock);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMockForSchema(schema: any): unknown {
  const shape = schema._def?.shape?.() ?? schema.shape ?? {};

  const result: Record<string, unknown> = {};

  for (const [key, fieldSchema] of Object.entries(shape)) {
    result[key] = mockValue(fieldSchema);
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockValue(schema: any): unknown {
  const typeName = schema?._def?.typeName ?? schema?.constructor?.name ?? "";

  if (typeName === "ZodOptional") return undefined;
  if (typeName === "ZodNullable") return null;
  if (typeName === "ZodString") return "mock string";
  if (typeName === "ZodNumber") {
    const min = schema._def?.checks?.find((c: { kind: string }) => c.kind === "min")?.value ?? 0;
    const max = schema._def?.checks?.find((c: { kind: string }) => c.kind === "max")?.value ?? 10;
    return Math.floor((min + max) / 2);
  }
  if (typeName === "ZodArray") return [mockValue(schema._def?.type)];
  if (typeName === "ZodObject") return buildMockForSchema(schema);
  return null;
}

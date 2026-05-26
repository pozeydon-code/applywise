const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 512_000;
const MIN_DESCRIPTION_LENGTH = 120;

export interface UrlValidationResult {
  ok: boolean;
  url?: URL;
  error?: string;
}

export interface JobDescriptionExtractionResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export function validateJobPostingUrl(input: string): UrlValidationResult {
  let parsed: URL;

  try {
    parsed = new URL(input.trim());
  } catch {
    return { ok: false, error: "URL inválida." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Solo se aceptan URLs http o https." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "La URL no debe incluir credenciales." };
  }

  if (isUnsafeHostname(parsed.hostname)) {
    return { ok: false, error: "No se aceptan hosts locales o privados." };
  }

  return { ok: true, url: parsed };
}

export async function importJobDescriptionFromUrl(input: string): Promise<JobDescriptionExtractionResult> {
  const validation = validateJobPostingUrl(input);
  if (!validation.ok || !validation.url) {
    return { ok: false, error: validation.error };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(validation.url, {
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
        "User-Agent": "ApplyWise job URL importer/1.0",
      },
    });

    if (!response.ok || response.status >= 300) {
      return { ok: false, error: "No se pudo leer la página." };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      return { ok: false, error: "La URL no devolvió texto legible." };
    }

    const html = await readLimitedText(response);
    const text = extractLikelyJobDescription(html);

    if (!text || text.length < MIN_DESCRIPTION_LENGTH) {
      return { ok: false, error: "No se encontró una descripción de puesto suficiente." };
    }

    return { ok: true, text };
  } catch {
    return { ok: false, error: "No se pudo importar la oferta." };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractLikelyJobDescription(html: string): string {
  const jsonLdDescription = extractJsonLdJobDescription(html);
  if (jsonLdDescription) {
    return cleanExtractedText(htmlToText(jsonLdDescription));
  }

  const candidateHtml = pickBestHtmlCandidate(html);
  return cleanExtractedText(htmlToText(candidateHtml));
}

export function cleanExtractedText(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/\r/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !isNoiseLine(line))
    .join("\n")
    .trim()
    .slice(0, 12_000);
}

function isUnsafeHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^169\.254\./.test(normalized)) {
    return true;
  }

  if (/^192\.168\./.test(normalized)) {
    return true;
  }

  const private172 = normalized.match(/^172\.(\d{1,2})\./);
  if (private172) {
    const secondOctet = Number(private172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  if (/^(fc|fd|fe80):/i.test(normalized)) {
    return true;
  }

  return false;
}

async function readLimitedText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return await response.text();

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > MAX_RESPONSE_BYTES) {
      chunks.push(value.slice(0, value.byteLength - (received - MAX_RESPONSE_BYTES)));
      break;
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(concatChunks(chunks));
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const merged = new Uint8Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return merged;
}

function pickBestHtmlCandidate(html: string): string {
  const withoutNoise = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form\b[\s\S]*?<\/form>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const candidates = [
    ...extractTagBlocks(withoutNoise, "main"),
    ...extractTagBlocks(withoutNoise, "article"),
    ...extractLikelyDivBlocks(withoutNoise),
    withoutNoise,
  ];

  return candidates.reduce((best, candidate) => {
    const candidateScore = scoreCandidate(htmlToText(candidate));
    const bestScore = scoreCandidate(htmlToText(best));
    return candidateScore > bestScore ? candidate : best;
  });
}

function extractTagBlocks(html: string, tag: string): string[] {
  const blocks: string[] = [];
  const pattern = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
  for (const match of html.matchAll(pattern)) {
    blocks.push(match[0]);
  }
  return blocks;
}

function extractLikelyDivBlocks(html: string): string[] {
  const blocks: string[] = [];
  const pattern = /<(section|div)\b[^>]*(?:class|id)=["'][^"']*(job|description|posting|vacancy|content|details|body)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;
  for (const match of html.matchAll(pattern)) {
    blocks.push(match[0]);
  }
  return blocks;
}

function scoreCandidate(text: string): number {
  const lower = text.toLowerCase();
  const keywordHits = [
    "responsibilities",
    "requirements",
    "qualifications",
    "skills",
    "benefits",
    "responsabilidades",
    "requisitos",
    "habilidades",
    "beneficios",
    "buscamos",
    "puesto",
    "job",
  ].filter((keyword) => lower.includes(keyword)).length;

  return Math.min(text.length, 8_000) + keywordHits * 500;
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|ul|ol|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(input: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return input.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function isNoiseLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower === "apply" ||
    lower === "apply now" ||
    lower === "postularme" ||
    lower === "postular ahora" ||
    lower === "share" ||
    lower === "compartir" ||
    lower === "cookie settings" ||
    lower.includes("aceptar cookies") ||
    lower.includes("privacy policy") ||
    lower.includes("política de privacidad")
  );
}

function extractJsonLdJobDescription(html: string): string | null {
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const script of scripts) {
    const rawJson = decodeHtmlEntities(script[1].trim());
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const description = findJobPostingDescription(parsed);
      if (description) return description;
    } catch {
      continue;
    }
  }

  return null;
}

function findJobPostingDescription(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPostingDescription(item);
      if (found) return found;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const type = record["@type"];
  const isJobPosting = Array.isArray(type)
    ? type.includes("JobPosting")
    : type === "JobPosting";

  if (isJobPosting && typeof record.description === "string") {
    return record.description;
  }

  if (Array.isArray(record["@graph"])) {
    return findJobPostingDescription(record["@graph"]);
  }

  return null;
}

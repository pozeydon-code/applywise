export type PdfExtractResult =
  | { success: true; text: string }
  | { success: false; error: string };

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractResult> {
  try {
    // pdf-parse v2 uses a class-based API with { data } for buffer input
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();

    if (!result.text || result.text.trim().length === 0) {
      return {
        success: false,
        error: "El PDF no contiene texto extraíble. Probá con un PDF no escaneado.",
      };
    }

    return { success: true, text: result.text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al procesar el PDF.";
    return { success: false, error: `No se pudo extraer el texto del PDF: ${message}` };
  }
}

import type { AnalysisResult } from "@/shared/types/domain";

function list(items: string[]): string {
  if (!items.length) return "- Sin datos disponibles.";
  return items.map((item) => `- ${item}`).join("\n");
}

export function buildApplicationKitMarkdown(result: AnalysisResult): string {
  const { generatedAssets, applicationKit, matchAnalysis, jobOffer } = result;
  const role = jobOffer.role ?? "Puesto objetivo";
  const company = jobOffer.company ? ` en ${jobOffer.company}` : "";

  const interview = applicationKit.interviewQuestions.length
    ? applicationKit.interviewQuestions
        .map(
          (item, index) =>
            `### ${index + 1}. ${item.question}\n\n**Respuesta honesta sugerida:**\n${item.honestAnswer}\n\n**Evidencia:**\n${item.evidence}`
        )
        .join("\n\n")
    : "Sin preguntas disponibles.";

  return [
    `# Kit de postulación - ${role}${company}`,
    "",
    "## Assets generados",
    "",
    "### Resumen profesional optimizado",
    generatedAssets.optimizedSummary,
    "",
    "### LinkedIn Headline",
    generatedAssets.linkedinHeadline,
    "",
    "### LinkedIn About",
    generatedAssets.linkedinAbout,
    "",
    "### Cover Letter",
    generatedAssets.coverLetter,
    "",
    "## CV antes/después",
    "",
    "### Antes",
    applicationKit.cvComparison.before,
    "",
    "### Después",
    applicationKit.cvComparison.after,
    "",
    "### Mejoras sugeridas",
    list(applicationKit.cvComparison.improvements),
    "",
    "## Simulador de entrevista",
    "",
    interview,
    "",
    "## Checklist y recomendaciones",
    "",
    list([...applicationKit.checklist, ...matchAnalysis.recommendations]),
    "",
  ].join("\n");
}

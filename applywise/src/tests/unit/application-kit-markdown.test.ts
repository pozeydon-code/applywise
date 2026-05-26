import { describe, expect, it } from "vitest";
import { buildApplicationKitMarkdown } from "@/features/application-kit/markdown";
import { MOCK_ANALYSIS_RESULT } from "../e2e/fixtures/mock-analysis";

describe("buildApplicationKitMarkdown", () => {
  it("builds deterministic markdown with assets, CV comparison, interview, and checklist", () => {
    expect(buildApplicationKitMarkdown(MOCK_ANALYSIS_RESULT)).toMatchInlineSnapshot(`
      "# Kit de postulación - Senior Frontend Engineer en StartupXYZ

      ## Assets generados

      ### Resumen profesional optimizado
      Frontend developer with 4 years of experience delivering scalable React and TypeScript applications. Proven track record of improving performance and mentoring teams.

      ### LinkedIn Headline
      Frontend Developer | React · TypeScript · Node.js

      ### LinkedIn About
      I build fast, accessible, and maintainable frontend applications. Currently focused on React ecosystems and TypeScript-first development.

      ### Cover Letter
      Dear Hiring Manager,

      I am excited to apply for the Senior Frontend Engineer position at StartupXYZ. With 4 years of experience building scalable SPAs using React and TypeScript, I am confident in my ability to contribute to your product team.

      Sincerely,
      Ana García

      ## CV antes/después

      ### Antes
      Ana's CV presents solid frontend experience but does not explicitly align every section to the Senior Frontend Engineer role.

      ### Después
      Ana's CV should foreground React, TypeScript, performance work, mentoring, and product collaboration for StartupXYZ.

      ### Mejoras sugeridas
      - Move React and TypeScript impact into the first summary line
      - Mention API integration experience only if Ana has real examples

      ## Simulador de entrevista

      ### 1. How have you improved frontend performance in a React application?

      **Respuesta honesta sugerida:**
      I can discuss the load-time reduction listed in my CV, explain the context, and avoid claiming metrics beyond the documented 30% improvement.

      **Evidencia:**
      CV achievement: Reduced load time by 30%.

      ### 2. What is your experience with GraphQL?

      **Respuesta honesta sugerida:**
      GraphQL is not listed in my CV, so I should be transparent and explain related API integration experience if I have it.

      **Evidencia:**
      Match gap: No GraphQL experience listed.

      ## Checklist y recomendaciones

      - Verify every claim in the CV can be backed with a real example
      - Prepare one honest answer for the GraphQL gap
      - Add GraphQL to your skills if you have experience with it
      - Highlight any API integration experience
      "
    `);
  });
});

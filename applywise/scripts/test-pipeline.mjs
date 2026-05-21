// Quick smoke test for the full AI pipeline
// Run with: node scripts/test-pipeline.mjs
// Requires dev server running on :3000 and Ollama available

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal test PDF (same as E2E fixture)
const pdfPath = path.join(__dirname, "../src/tests/e2e/fixtures/sample.pdf");
const pdfBuffer = readFileSync(pdfPath);

const JOB_DESCRIPTION = `
We are looking for a Senior Frontend Engineer to join our product team.

Requirements:
- 4+ years of experience with React and TypeScript
- Experience with Next.js and server-side rendering
- Knowledge of state management (Redux, Zustand, or similar)
- Experience with REST APIs and GraphQL
- Strong CSS/Tailwind skills
- Experience writing unit and E2E tests

Nice to have:
- Experience with Supabase or Firebase
- Open source contributions
- Mentoring experience

You will:
- Build new product features end-to-end
- Participate in code reviews
- Collaborate closely with design and product
- Improve frontend performance and DX
`.trim();

const formData = new FormData();
formData.append("cv", new Blob([pdfBuffer], { type: "application/pdf" }), "sample.pdf");
formData.append("jobDescription", JOB_DESCRIPTION);

console.log("🚀 Sending analysis request...");
console.log(`   PDF size: ${pdfBuffer.length} bytes`);
console.log(`   Job description: ${JOB_DESCRIPTION.length} chars`);
console.log("");

const startTime = Date.now();

let res;
try {
  res = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    body: formData,
  });
} catch (err) {
  console.error("❌ Connection failed. Is the dev server running on :3000?");
  process.exit(1);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`⏱  Response received in ${elapsed}s — status: ${res.status}`);

const data = await res.json();

if (!res.ok) {
  console.error("❌ Pipeline failed:", data.error);
  process.exit(1);
}

// Print summary
console.log("\n✅ Pipeline completed successfully!\n");
console.log("─".repeat(50));
console.log(`📊 Score:          ${data.matchAnalysis.score}%`);
console.log(`💪 Strengths:      ${data.matchAnalysis.strengths.length} items`);
console.log(`⚠️  Gaps:          ${data.matchAnalysis.gaps.length} items`);
console.log(`🔑 Missing KW:     ${data.matchAnalysis.missingKeywords.length} items`);
console.log(`💡 Recommendations:${data.matchAnalysis.recommendations.length} items`);
console.log("─".repeat(50));
console.log("\n📝 CV Profile detected:");
console.log(`   Name:     ${data.cvProfile.name ?? "(not detected)"}`);
console.log(`   Skills:   ${data.cvProfile.skills.slice(0, 5).join(", ")}`);
console.log(`   Exp:      ${data.cvProfile.experience.length} roles`);
console.log("\n🎯 Job Offer detected:");
console.log(`   Role:     ${data.jobOffer.role ?? "(not detected)"}`);
console.log(`   Required: ${data.jobOffer.requiredSkills.slice(0, 5).join(", ")}`);
console.log("\n✍️  Generated assets:");
console.log(`   Headline: ${data.generatedAssets.linkedinHeadline}`);
console.log(`   Summary:  ${data.generatedAssets.optimizedSummary.slice(0, 100)}...`);
if (data.id) {
  console.log(`\n💾 Saved to Supabase — id: ${data.id}`);
}

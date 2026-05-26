import { describe, expect, it } from "vitest";
import {
  cleanExtractedText,
  extractLikelyJobDescription,
  validateJobPostingUrl,
} from "@/server/job-url/extract-job-description";

describe("validateJobPostingUrl", () => {
  it("accepts public http and https URLs", () => {
    expect(validateJobPostingUrl("https://jobs.example.com/frontend-engineer").ok).toBe(true);
    expect(validateJobPostingUrl("http://careers.example.com/jobs/123").ok).toBe(true);
  });

  it("rejects unsupported protocols and credentials", () => {
    expect(validateJobPostingUrl("file:///etc/passwd").ok).toBe(false);
    expect(validateJobPostingUrl("https://user:pass@example.com/job").ok).toBe(false);
  });

  it("rejects localhost and private IP-ish hosts", () => {
    expect(validateJobPostingUrl("http://localhost:3000/job").ok).toBe(false);
    expect(validateJobPostingUrl("http://127.0.0.1/job").ok).toBe(false);
    expect(validateJobPostingUrl("http://10.0.0.5/job").ok).toBe(false);
    expect(validateJobPostingUrl("http://172.16.0.8/job").ok).toBe(false);
    expect(validateJobPostingUrl("http://192.168.1.2/job").ok).toBe(false);
  });
});

describe("extractLikelyJobDescription", () => {
  it("prefers JobPosting JSON-LD description when present", () => {
    const html = `
      <html>
        <body><nav>Cookie settings</nav><main>Generic marketing content</main></body>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "description": "<p>Buscamos Frontend Engineer para construir productos con React &amp; TypeScript.</p><p>Requisitos: testing, accesibilidad y comunicación clara.</p>"
          }
        </script>
      </html>
    `;

    expect(extractLikelyJobDescription(html)).toContain(
      "Buscamos Frontend Engineer para construir productos con React & TypeScript."
    );
    expect(extractLikelyJobDescription(html)).toContain("Requisitos: testing");
  });

  it("extracts the strongest generic content block and removes noise", () => {
    const html = `
      <html>
        <body>
          <header>Company menu</header>
          <section class="job-description">
            <h1>Senior Frontend Engineer</h1>
            <p>Responsibilities: build accessible interfaces, collaborate with product, and improve performance.</p>
            <p>Requirements: React, TypeScript, automated testing, and strong communication.</p>
            <button>Apply now</button>
          </section>
          <footer>Privacy policy</footer>
        </body>
      </html>
    `;

    const text = extractLikelyJobDescription(html);

    expect(text).toContain("Senior Frontend Engineer");
    expect(text).toContain("Requirements: React, TypeScript");
    expect(text).not.toContain("Company menu");
    expect(text).not.toContain("Privacy policy");
  });
});

describe("cleanExtractedText", () => {
  it("normalizes whitespace, decodes entities, and drops common noise lines", () => {
    expect(cleanExtractedText("Apply now\nReact&nbsp;&amp;&nbsp;TypeScript\n\n\nPrivacy policy")).toBe(
      "React & TypeScript"
    );
  });
});

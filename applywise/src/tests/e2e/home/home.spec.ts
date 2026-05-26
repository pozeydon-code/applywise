import { test, expect } from "@playwright/test";
import path from "path";
import { HomePage } from "./home-page";
import { AnalyzePage } from "../analyze/analyze-page";
import { MOCK_ANALYSIS_RESULT } from "../fixtures/mock-analysis";

const SAMPLE_PDF = path.join(__dirname, "../fixtures/sample.pdf");
const JOB_DESCRIPTION =
  "We are looking for a Senior Frontend Engineer with experience in React and TypeScript.";

test.describe("Landing page", () => {
  test(
    "renders key elements",
    { tag: ["@critical", "@e2e", "@HOME-E2E-001"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await expect(home.heading).toBeVisible();
      await expect(home.pdfInput).toBeAttached();
      await expect(home.jobDescriptionTextarea).toBeVisible();
      await expect(home.analyzeButton).toBeVisible();
    }
  );

  test(
    "analyze button is disabled when inputs are empty",
    { tag: ["@critical", "@e2e", "@HOME-E2E-002"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await expect(home.analyzeButton).toBeDisabled();
    }
  );

  test(
    "analyze button enables after filling both inputs",
    { tag: ["@high", "@e2e", "@HOME-E2E-003"] },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await home.uploadPdf(SAMPLE_PDF);
      await home.fillJobDescription(JOB_DESCRIPTION);

      await expect(home.analyzeButton).toBeEnabled();
    }
  );
});

test.describe("Analysis flow (mocked API)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept /api/analyze and return deterministic mock data
    await page.route("/api/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ANALYSIS_RESULT),
      });
    });
  });

  test(
    "full flow: submit form → navigate to dashboard → show score",
    { tag: ["@critical", "@e2e", "@HOME-E2E-004"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const analyze = new AnalyzePage(page);

      await home.goto();
      await home.submitForm(SAMPLE_PDF, JOB_DESCRIPTION);

      // Wait for navigation to /analyze
      await page.waitForURL("/analyze");
      await expect(analyze.heading).toBeVisible();

      // Score from mock is 74%
      await expect(analyze.scoreText).toContainText("74%");
    }
  );

  test(
    "dashboard shows match analysis tab by default",
    { tag: ["@high", "@e2e", "@HOME-E2E-005"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const analyze = new AnalyzePage(page);

      await home.goto();
      await home.submitForm(SAMPLE_PDF, JOB_DESCRIPTION);
      await page.waitForURL("/analyze");

      // Default tab should show strengths from mock
      await expect(page.getByText("Strong React experience")).toBeVisible();
    }
  );

  test(
    "assets tab shows generated LinkedIn headline",
    { tag: ["@high", "@e2e", "@HOME-E2E-006"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const analyze = new AnalyzePage(page);

      await home.goto();
      await home.submitForm(SAMPLE_PDF, JOB_DESCRIPTION);
      await page.waitForURL("/analyze");
      await analyze.switchToAssetsTab();

      await expect(
        page.getByText("Frontend Developer | React · TypeScript · Node.js")
      ).toBeVisible();
    }
  );

  test(
    "application kit tab shows interview simulator and markdown copy action",
    { tag: ["@high", "@e2e", "@HOME-E2E-009"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const analyze = new AnalyzePage(page);

      await home.goto();
      await home.submitForm(SAMPLE_PDF, JOB_DESCRIPTION);
      await page.waitForURL("/analyze");
      await analyze.switchToApplicationKitTab();

      await expect(page.getByText("Simulador de entrevista")).toBeVisible();
      await expect(page.getByText("How have you improved frontend performance")).toBeVisible();
      await expect(page.getByRole("button", { name: "Copiar kit Markdown" })).toBeVisible();
    }
  );

  test(
    "back button returns to landing",
    { tag: ["@medium", "@e2e", "@HOME-E2E-007"] },
    async ({ page }) => {
      const home = new HomePage(page);
      const analyze = new AnalyzePage(page);

      await home.goto();
      await home.submitForm(SAMPLE_PDF, JOB_DESCRIPTION);
      await page.waitForURL("/analyze");
      await analyze.backButton.click();

      await expect(page).toHaveURL("/");
    }
  );
});

test.describe("Error handling", () => {
  test(
    "shows error when API returns 503",
    { tag: ["@high", "@e2e", "@HOME-E2E-008"] },
    async ({ page }) => {
      await page.route("/api/analyze", async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "El servidor de IA local no está disponible. Asegurate de que Ollama esté corriendo.",
          }),
        });
      });

      const home = new HomePage(page);
      await home.goto();
      await home.submitForm(SAMPLE_PDF, JOB_DESCRIPTION);

      await expect(home.errorMessage).toBeVisible();
      await expect(home.errorMessage).toContainText("Ollama");
    }
  );
});

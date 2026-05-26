import { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly pdfInput: Locator;
  readonly jobUrlInput: Locator;
  readonly importJobUrlButton: Locator;
  readonly jobDescriptionTextarea: Locator;
  readonly analyzeButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: /ApplyWise/i });
    this.pdfInput = page.getByLabel("Subir CV en PDF");
    this.jobUrlInput = page.getByLabel("Importar oferta desde URL");
    this.importJobUrlButton = page.getByRole("button", { name: "Importar oferta" });
    this.jobDescriptionTextarea = page.getByLabel("Descripción del puesto");
    this.analyzeButton = page.getByRole("button", { name: /Analizar CV/i });
    this.errorMessage = page.locator(".bg-red-500\\/10");
  }

  async goto(): Promise<void> {
    await super.goto("/");
  }

  async uploadPdf(filePath: string): Promise<void> {
    await this.pdfInput.setInputFiles(filePath);
  }

  async fillJobDescription(text: string): Promise<void> {
    await this.jobDescriptionTextarea.fill(text);
  }

  async importJobDescription(url: string): Promise<void> {
    await this.jobUrlInput.fill(url);
    await this.importJobUrlButton.click();
  }

  async submitForm(pdfPath: string, jobDescription: string): Promise<void> {
    await this.uploadPdf(pdfPath);
    await this.fillJobDescription(jobDescription);
    await this.analyzeButton.click();
  }
}

import { Page, Locator } from "@playwright/test";
import { BasePage } from "../base-page";

export class AnalyzePage extends BasePage {
  readonly heading: Locator;
  readonly scoreText: Locator;
  readonly matchTab: Locator;
  readonly assetsTab: Locator;
  readonly applicationKitTab: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: /ApplyWise.*Resultados/i });
    this.scoreText = page.getByText(/\d+%/);
    this.matchTab = page.getByRole("button", { name: "Análisis" });
    this.assetsTab = page.getByRole("button", { name: "Contenido generado" });
    this.applicationKitTab = page.getByRole("button", { name: "Kit de postulación" });
    this.backButton = page.getByRole("button", { name: /Nueva búsqueda/i });
  }

  async goto(): Promise<void> {
    await super.goto("/analyze");
  }

  async switchToAssetsTab(): Promise<void> {
    await this.assetsTab.click();
  }

  async switchToMatchTab(): Promise<void> {
    await this.matchTab.click();
  }

  async switchToApplicationKitTab(): Promise<void> {
    await this.applicationKitTab.click();
  }
}

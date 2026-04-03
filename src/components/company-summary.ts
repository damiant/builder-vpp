import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import "./metrics-charts";
import "./selected-company-card";
import "./date-range-selector";
import "./space-selector";

export class CompanySummary extends LitElement {
  static properties = {
    company: { attribute: false },
    metricsData: { attribute: false },
    metricsError: { attribute: false },
    selectedMonth: { type: Number, attribute: false },
    selectedYear: { type: Number, attribute: false },
    spaces: { attribute: false },
    selectedSpaceId: { attribute: false },
    modelMetrics: { attribute: false },
    projectMetrics: { attribute: false },
    featureMetrics: { attribute: false },
    userModelMetrics: { attribute: false },
    designVsPromptMetrics: { attribute: false },
    designMetrics: { attribute: false },
    projectsApiData: { attribute: false },
  };

  declare company: CompanyConfig | null;
  declare metricsData: unknown[] | null;
  declare metricsError: string | null;
  declare selectedMonth: number;
  declare selectedYear: number;
  declare spaces: Array<{ id: string; name: string }>;
  declare selectedSpaceId: string;
  declare modelMetrics: Array<{
    model: string;
    totalLines: number;
    events: number;
    creditsUsed: number;
  }> | null;
  declare projectMetrics: Array<{
    projectName: string;
    totalLines: number;
    creditsUsed: number;
  }> | null;
  declare featureMetrics: Array<{
    feature: string;
    totalLines: number;
    events: number;
    creditsUsed: number;
  }> | null;
  declare userModelMetrics: Array<{
    userEmail: string;
    totalCreditsUsed: number;
    models: Array<{
      model: string;
      totalLines: number;
      events: number;
      creditsUsed: number;
    }>;
  }> | null;
  declare designVsPromptMetrics: Array<{
    type: "Design" | "Prompt";
    count: number;
    creditsUsed: number;
    uniqueDesigns: number;
  }> | null;
  declare designMetrics: Array<{
    designDocumentId: string;
    records: Array<{
      userEmail: string;
      timestamp: string;
      creditsUsed: number;
      tokensUsed: number;
      model: string;
    }>;
  }> | null;
  declare projectsApiData: Array<{
    projectId: string;
    projectName: string;
    metrics: {
      linesAdded: number;
      linesRemoved: number;
      linesAccepted: number;
      userPrompts: number;
      creditsUsed: number;
      activeUsers: number;
      prsMerged: number;
      prsCreated: number;
    };
  }> | null;

  constructor() {
    super();
    this.company = null;
    this.metricsData = null;
    this.metricsError = null;
    this.spaces = [];
    this.selectedSpaceId = "all";
    this.modelMetrics = null;
    this.projectMetrics = null;
    this.featureMetrics = null;
    this.userModelMetrics = null;
    this.designVsPromptMetrics = null;
    this.designMetrics = null;
    this.projectsApiData = null;
  }

  createRenderRoot() {
    return this;
  }

  private handleDateChange = (event: CustomEvent<{ month: number; year: number }>) => {
    console.log("company-summary received date-change event:", event.detail);
    this.dispatchEvent(
      new CustomEvent("date-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleSpaceChange = (event: CustomEvent<{ spaceId: string }>) => {
    console.log("company-summary received space-change event:", event.detail);
    this.dispatchEvent(
      new CustomEvent("space-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <main class="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        <selected-company-card
          .company=${this.company}
          .metricsData=${this.metricsData}
          .selectedMonth=${this.selectedMonth}
          .selectedYear=${this.selectedYear}
          .spaces=${this.spaces}
          .selectedSpaceId=${this.selectedSpaceId}
          @date-change=${this.handleDateChange}
          @space-change=${this.handleSpaceChange}
        ></selected-company-card>

        ${this.metricsData && Array.isArray(this.metricsData) && this.metricsData.length > 0
          ? html`
              <section class="w-full">
                <metrics-charts
                  .data=${this.metricsData}
                  .selectedSpaceId=${this.selectedSpaceId}
                  .company=${this.company}
                  .selectedMonth=${this.selectedMonth}
                  .selectedYear=${this.selectedYear}
                  .modelMetrics=${this.modelMetrics}
                  .projectMetrics=${this.projectMetrics}
                  .featureMetrics=${this.featureMetrics}
                  .userModelMetrics=${this.userModelMetrics}
                  .designVsPromptMetrics=${this.designVsPromptMetrics}
                  .designMetrics=${this.designMetrics}
                  .projectsApiData=${this.projectsApiData}
                ></metrics-charts>
              </section>
            `
          : this.metricsError
            ? html`
                <section
                  class="w-full rounded-[var(--radius-xl)] border border-red-300 bg-red-50 p-8 shadow-[var(--shadow-md)]"
                >
                  <div class="flex flex-col gap-3">
                    <p class="brand-heading text-sm font-medium text-red-900">
                      Error fetching metrics
                    </p>
                    <h2 class="text-2xl font-semibold tracking-tight text-red-900">
                      ${this.metricsError}
                    </h2>
                    <p class="max-w-2xl text-sm leading-6 text-red-800">
                      Make sure the selected company has valid credentials configured in the Edit
                      dialog.
                    </p>
                  </div>
                </section>
              `
            : html`
                <section
                  class="w-full rounded-[var(--radius-xl)] border border-blue-300 bg-blue-50 p-8 shadow-[var(--shadow-md)]"
                >
                  <div class="flex flex-col gap-3">
                    <p class="brand-heading text-sm font-medium text-blue-900">Loading metrics</p>
                    <p class="text-sm leading-6 text-blue-800">
                      Fetching metrics data for the selected company...
                    </p>
                  </div>
                </section>
              `}
      </main>
    `;
  }
}

if (!customElements.get("company-summary")) {
  customElements.define("company-summary", CompanySummary);
}

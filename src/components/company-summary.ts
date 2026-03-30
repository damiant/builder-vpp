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
  };

  declare company: CompanyConfig | null;
  declare metricsData: unknown[] | null;
  declare metricsError: string | null;
  declare selectedMonth: number;
  declare selectedYear: number;
  declare spaces: Array<{ id: string; name: string }>;
  declare selectedSpaceId: string;

  constructor() {
    super();
    this.company = null;
    this.metricsData = null;
    this.metricsError = null;
    this.spaces = [];
    this.selectedSpaceId = "all";
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <main class="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        ${this.metricsData && Array.isArray(this.metricsData) && this.metricsData.length > 0
          ? html`
              <selected-company-card
                .company=${this.company}
                .metricsData=${this.metricsData}
                .selectedMonth=${this.selectedMonth}
                .selectedYear=${this.selectedYear}
                .spaces=${this.spaces}
                .selectedSpaceId=${this.selectedSpaceId}
                @date-change
                @space-change
              ></selected-company-card>

              <section class="w-full">
                <metrics-charts
                  .data=${this.metricsData}
                  .selectedSpaceId=${this.selectedSpaceId}
                  .company=${this.company}
                  .selectedMonth=${this.selectedMonth}
                  .selectedYear=${this.selectedYear}
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

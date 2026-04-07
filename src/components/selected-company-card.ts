import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import "./date-range-selector";
import "./space-selector";

type MetricsItem = {
  userPrompts: number;
  totalLines: number;
  creditsUsed: number;
  designsExported: number;
  prsMerged: number;
  prsCreated: number;
  events: number;
  users: number;
  spaceIds: string[];
  spaces: Array<{ id: string; name: string }>;
};

type MetricsData = {
  period: string;
  metrics: MetricsItem;
}[];

export class SelectedCompanyCard extends LitElement {
  static properties = {
    company: { attribute: false },
    metricsData: { attribute: false },
    selectedMonth: { type: Number, attribute: false },
    selectedYear: { type: Number, attribute: false },
    spaces: { attribute: false },
    selectedSpaceId: { attribute: false },
  };

  declare company: CompanyConfig | null;
  declare metricsData: MetricsData | null;
  declare selectedMonth: number;
  declare selectedYear: number;
  declare spaces: Array<{ id: string; name: string }>;
  declare selectedSpaceId: string;

  constructor() {
    super();
    this.company = null;
    this.metricsData = null;
    const today = new Date();
    this.selectedMonth = today.getMonth();
    this.selectedYear = today.getFullYear();
    this.spaces = [];
    this.selectedSpaceId = "all";
  }

  createRenderRoot() {
    return this;
  }

  override updated() {
    const dateSelector = this.querySelector<any>("date-range-selector");
    if (dateSelector) {
      dateSelector.removeEventListener("date-change", this.handleDateChange);
      dateSelector.addEventListener("date-change", this.handleDateChange);
    }

    const spaceSelector = this.querySelector<any>("space-selector");
    if (spaceSelector) {
      spaceSelector.removeEventListener("space-change", this.handleSpaceChange);
      spaceSelector.addEventListener("space-change", this.handleSpaceChange);
    }
  }

  private handleDateChange = (event: CustomEvent<{ month: number; year: number }>) => {
    console.log("selected-company-card received date-change event:", event.detail);
    this.dispatchEvent(
      new CustomEvent("date-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleSpaceChange = (event: CustomEvent<{ spaceId: string }>) => {
    console.log("selected-company-card received space-change event:", event.detail);
    this.dispatchEvent(
      new CustomEvent("space-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private formatUsdAmount(credits: number): string {
    const usdAmount = credits * 0.05;
    return `$${usdAmount.toFixed(2)}`;
  }

  private getSummaryStats() {
    if (!this.metricsData || this.metricsData.length === 0) {
      return null;
    }

    const latest = this.metricsData[this.metricsData.length - 1];
    const totals = this.metricsData.reduce(
      (acc, item) => ({
        userPrompts: acc.userPrompts + item.metrics.userPrompts,
        totalLines: acc.totalLines + item.metrics.totalLines,
        creditsUsed: acc.creditsUsed + item.metrics.creditsUsed,
        designsExported: acc.designsExported + item.metrics.designsExported,
        prsMerged: acc.prsMerged + item.metrics.prsMerged,
        prsCreated: acc.prsCreated + item.metrics.prsCreated,
        events: acc.events + item.metrics.events,
        users: Math.max(acc.users, item.metrics.users),
      }),
      {
        userPrompts: 0,
        totalLines: 0,
        creditsUsed: 0,
        designsExported: 0,
        prsMerged: 0,
        prsCreated: 0,
        events: 0,
        users: 0,
      },
    );

    // Calculate derived metrics
    const daysCount = this.metricsData.length;
    const avgCreditsPerDay = totals.creditsUsed / daysCount;

    // Get unique spaceIds across all days
    const uniqueSpaces = new Set<string>();
    this.metricsData.forEach((item) => {
      if (Array.isArray(item.metrics.spaceIds)) {
        item.metrics.spaceIds.forEach((spaceId) => {
          uniqueSpaces.add(spaceId);
        });
      }
    });
    const spacesCount = uniqueSpaces.size;

    return { latest, totals, avgCreditsPerDay, spacesCount };
  }

  render() {
    const company = this.company ?? {
      id: "company",
      name: "Company",
      publicKey: "",
      privateKey: "",
    };

    const stats = this.getSummaryStats();

    return html`
      <section
        class="w-full rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)]"
      >
        <div class="mb-8 flex gap-8">
          <div class="flex-1">
            <div class="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] pb-6">
              <p class="brand-heading text-sm font-medium text-[var(--color-brand-strong)]">
                Selected company
              </p>
              <h2 class="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                ${company.name}
              </h2>
              <p class="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Metrics for
                ${new Date(this.selectedYear, this.selectedMonth).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div class="w-64 space-y-4 border-l border-[var(--color-border-subtle)] pl-8">
            <div class="flex flex-col gap-4">
              <div>
                <date-range-selector
                  .month=${this.selectedMonth}
                  .year=${this.selectedYear}
                ></date-range-selector>
              </div>
              ${this.spaces.length > 0
                ? html`
                    <div>
                      <space-selector
                        .spaces=${this.spaces}
                        .selectedSpaceId=${this.selectedSpaceId}
                      ></space-selector>
                    </div>
                  `
                : ""}
            </div>
          </div>
        </div>

        ${stats
          ? html`
              <div class="grid gap-4 md:grid-cols-3">
                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Total user prompts
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-brand)]">
                    ${stats.totals.userPrompts.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Credits used
                  </p>
                  <div class="mt-2 flex items-baseline justify-between">
                    <p class="text-2xl font-semibold text-[var(--color-text-primary)]">
                      ${Math.ceil(stats.totals.creditsUsed).toLocaleString()}
                    </p>
                    <p class="text-sm font-medium text-[var(--color-text-secondary)]">
                      ${this.formatUsdAmount(Math.ceil(stats.totals.creditsUsed))}
                    </p>
                  </div>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Total PRs merged
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.totals.prsMerged.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Total PRs created
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.totals.prsCreated.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Total events
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.totals.events.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Total lines
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.totals.totalLines.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Designs exported
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.totals.designsExported.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Avg Credits per day
                  </p>
                  <div class="mt-2 flex items-baseline justify-between">
                    <p class="text-2xl font-semibold text-[var(--color-text-primary)]">
                      ${Math.ceil(stats.avgCreditsPerDay).toLocaleString()}
                    </p>
                    <p class="text-sm font-medium text-[var(--color-text-secondary)]">
                      ${this.formatUsdAmount(Math.ceil(stats.avgCreditsPerDay))}
                    </p>
                  </div>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Users
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.totals.users.toLocaleString()}
                  </p>
                </div>

                <div
                  class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                >
                  <p
                    class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                  >
                    Spaces
                  </p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                    ${stats.spacesCount.toLocaleString()}
                  </p>
                </div>
              </div>
            `
          : ""}
      </section>
    `;
  }
}

if (!customElements.get("selected-company-card")) {
  customElements.define("selected-company-card", SelectedCompanyCard);
}

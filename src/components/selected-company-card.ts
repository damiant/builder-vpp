import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import { maskSecret } from "../lib/company-store";

type MetricsData = {
  period: string;
  metrics: {
    userPrompts: number;
    totalLines: number;
    creditsUsed: number;
    designsExported: number;
    prsMerged: number;
  };
}[];

export class SelectedCompanyCard extends LitElement {
  static properties = {
    company: { attribute: false },
    metricsData: { attribute: false },
  };

  declare company: CompanyConfig | null;
  declare metricsData: MetricsData | null;

  constructor() {
    super();
    this.company = null;
    this.metricsData = null;
  }

  createRenderRoot() {
    return this;
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
      }),
      {
        userPrompts: 0,
        totalLines: 0,
        creditsUsed: 0,
        designsExported: 0,
        prsMerged: 0,
      },
    );

    return { latest, totals };
  }

  render() {
    const company = this.company ?? {
      id: "company",
      name: "Company",
      publicKey: "",
      privateKey: "",
    };

    const stats = this.getSummaryStats();

    if (!stats) {
      return html``;
    }

    return html`
      <section
        class="w-full rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)]"
      >
        <div class="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] pb-6">
          <p class="brand-heading text-sm font-medium text-[var(--color-brand-strong)]">
            Selected company
          </p>
          <h2 class="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            ${company.name}
          </h2>
          <p class="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Metrics for the last 30 days from
            <code
              class="rounded-[var(--radius-sm)] bg-[var(--color-code-bg)] px-1.5 py-0.5 text-[0.85em] font-medium text-[var(--color-text-primary)]"
              >${stats.latest.period}</code
            >
            to
            <code
              class="rounded-[var(--radius-sm)] bg-[var(--color-code-bg)] px-1.5 py-0.5 text-[0.85em] font-medium text-[var(--color-text-primary)]"
              >${this.metricsData?.[0]?.period ?? "—"}</code
            >.
          </p>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
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
            <p class="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
              ${stats.totals.creditsUsed.toLocaleString()}
            </p>
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
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
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
        </div>

        <div
          class="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
        >
          <p class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Company details
          </p>
          <div class="mt-4 grid gap-3 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--color-text-secondary)]">Public Key:</span>
              <code class="font-mono text-[var(--color-text-primary)]">${maskSecret(company.publicKey)}</code>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--color-text-secondary)]">Private Key:</span>
              <code class="font-mono text-[var(--color-text-primary)]">${maskSecret(company.privateKey)}</code>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}

if (!customElements.get("selected-company-card")) {
  customElements.define("selected-company-card", SelectedCompanyCard);
}

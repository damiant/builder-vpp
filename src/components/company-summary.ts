import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import { maskSecret } from "../lib/company-store";
import "./metrics-charts";
import "./selected-company-card";

export class CompanySummary extends LitElement {
  static properties = {
    company: { attribute: false },
    metricsData: { attribute: false },
  };

  declare company: CompanyConfig | null;
  declare metricsData: unknown[] | null;

  constructor() {
    super();
    this.company = null;
    this.metricsData = null;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const company = this.company ?? {
      id: "company",
      name: "Company",
      publicKey: "",
      privateKey: "",
    };

    return html`
      <main class="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        ${this.metricsData ? html`
          <selected-company-card
            .company=${this.company}
            .metricsData=${this.metricsData}
          ></selected-company-card>

          <section class="w-full">
            <metrics-charts .data=${this.metricsData}></metrics-charts>
          </section>
        ` : html`
          <section
            class="w-full rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)]"
          >
            <div class="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] pb-6">
              <p class="brand-heading text-sm font-medium text-[var(--color-brand-strong)]">
                Connected company
              </p>
              <h2 class="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                ${company.name}
              </h2>
              <p class="max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Save the company name, public key, and private key in the dialog. The connect action
                uses the private key from
                <code
                  class="rounded-[var(--radius-sm)] bg-[var(--color-code-bg)] px-1.5 py-0.5 text-[0.85em] font-medium text-[var(--color-text-primary)]"
                  >metrics.md</code
                >
                and requests the last 30 days of metrics.
              </p>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-3">
              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <p
                  class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                >
                  Company name
                </p>
                <p class="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                  ${company.name}
                </p>
              </div>
              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <p
                  class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                >
                  Public key
                </p>
                <p class="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                  ${maskSecret(company.publicKey)}
                </p>
              </div>
              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <p
                  class="brand-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                >
                  Private key
                </p>
                <p class="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                  ${maskSecret(company.privateKey)}
                </p>
              </div>
            </div>

            <div
              class="mt-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-brand-soft)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
            >
              <span class="font-medium text-[var(--color-text-primary)]">Connect endpoint:</span>
              <span class="ml-1 break-all">https://cdn.builder.io/api/v1/orgs/fusion/metrics</span>
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

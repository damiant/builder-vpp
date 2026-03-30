import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";

export class CompanyHeader extends LitElement {
  static properties = {
    companies: { attribute: false },
    selectedCompanyId: { attribute: false },
  };

  declare companies: CompanyConfig[];
  declare selectedCompanyId: string;

  constructor() {
    super();
    this.companies = [];
    this.selectedCompanyId = "";
  }

  createRenderRoot() {
    return this;
  }

  private handleCompanyChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement;

    this.dispatchEvent(
      new CustomEvent<{ companyId: string }>("company-change", {
        detail: { companyId: target.value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private addCompany = () => {
    this.dispatchEvent(new CustomEvent("add-company", { bubbles: true, composed: true }));
  };

  private openEditor = () => {
    this.dispatchEvent(new CustomEvent("edit-company", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <header
        class="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-4 backdrop-blur"
      >
        <div
          class="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 class="brand-heading text-2xl font-semibold text-[var(--color-text-primary)]">
              Fusion Metrics
            </h1>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-brand-strong)]"
              @click=${this.addCompany}
            >
              Add company
            </button>
            <label
              class="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]"
            >
              <span>Company</span>
              <select
                class="min-w-44 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
                .value=${this.selectedCompanyId}
                @change=${this.handleCompanyChange}
              >
                ${this.companies.map(
                  (company) => html` <option value=${company.id}>${company.name}</option> `,
                )}
              </select>
            </label>

            <button
              type="button"
              class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]"
              @click=${this.openEditor}
            >
              Edit
            </button>
          </div>
        </div>
      </header>
    `;
  }
}

if (!customElements.get("company-header")) {
  customElements.define("company-header", CompanyHeader);
}

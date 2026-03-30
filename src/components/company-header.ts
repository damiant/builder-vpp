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

  private addCompany = () => {
    this.dispatchEvent(new CustomEvent("add-company", { bubbles: true, composed: true }));
  };

  private handleCompanyChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const companyId = target.value;
    this.dispatchEvent(
      new CustomEvent("company-change", {
        detail: { companyId },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleEditCompany = () => {
    this.dispatchEvent(new CustomEvent("edit-company", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <header
        class="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-4 backdrop-blur"
      >
        <div class="mx-auto flex max-w-6xl items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="brand-heading text-2xl font-semibold text-[var(--color-text-primary)]">
              Fusion Metrics
            </h1>
            <div class="flex items-center gap-2">
              <label
                for="company-select"
                class="text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Company
              </label>
              <select
                id="company-select"
                .value=${this.selectedCompanyId}
                @change=${this.handleCompanyChange}
                class="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)]"
              >
                ${this.companies.map(
                  (company) => html`<option value=${company.id}>${company.name}</option>`,
                )}
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)]"
              @click=${this.handleEditCompany}
            >
              Edit
            </button>
            <button
              type="button"
              class="rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-brand-strong)]"
              @click=${this.addCompany}
            >
              Add
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

import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import "./companies-table";

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

  render() {
    return html`
      <header
        class="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-4 backdrop-blur"
      >
        <div class="mx-auto flex max-w-6xl flex-col gap-4">
          <div class="flex items-center justify-between">
            <h1 class="brand-heading text-2xl font-semibold text-[var(--color-text-primary)]">
              Fusion Metrics
            </h1>
            <button
              type="button"
              class="rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-[var(--color-text-inverse)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-brand-strong)]"
              @click=${this.addCompany}
            >
              Add company
            </button>
          </div>

          <companies-table
            .companies=${this.companies}
            .selectedCompanyId=${this.selectedCompanyId}
            @company-change
            @edit-company
          ></companies-table>
        </div>
      </header>
    `;
  }
}

if (!customElements.get("company-header")) {
  customElements.define("company-header", CompanyHeader);
}

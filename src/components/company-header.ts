import { LitElement, html } from "lit";
import type { PropertyValues } from "lit";
import type { CompanyConfig } from "../lib/company-store";

export class CompanyHeader extends LitElement {
  static properties = {
    companies: { attribute: false },
    selectedCompanyId: { attribute: false },
    isExportingPdf: { type: Boolean, attribute: false },
    isExportingPng: { type: Boolean, attribute: false },
    isExportingCsv: { type: Boolean, attribute: false },
    isExportingHtml: { type: Boolean, attribute: false },
  };

  declare companies: CompanyConfig[];
  declare selectedCompanyId: string;
  declare isExportingPdf: boolean;
  declare isExportingPng: boolean;
  declare isExportingCsv: boolean;
  declare isExportingHtml: boolean;

  constructor() {
    super();
    this.companies = [];
    this.selectedCompanyId = "";
    this.isExportingPdf = false;
    this.isExportingPng = false;
    this.isExportingCsv = false;
    this.isExportingHtml = false;
  }

  createRenderRoot() {
    return this;
  }

  protected updated(changedProperties: PropertyValues<this>) {
    // Sync select element value when selectedCompanyId changes
    if (changedProperties.has("selectedCompanyId")) {
      void this.updateComplete.then(() => {
        const selectElement = this.querySelector<HTMLSelectElement>("#company-select");
        if (selectElement && selectElement.value !== this.selectedCompanyId) {
          selectElement.value = this.selectedCompanyId;
          console.log(
            `Synced select value to ${this.selectedCompanyId}, select value is now:`,
            selectElement.value,
          );
        }
      });
    }
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

  private handleRefresh = () => {
    this.dispatchEvent(new CustomEvent("refresh-data", { bubbles: true, composed: true }));
  };

  private handleExportPdf = () => {
    this.dispatchEvent(new CustomEvent("export-pdf", { bubbles: true, composed: true }));
  };

  private handleExportPng = () => {
    this.dispatchEvent(new CustomEvent("export-png", { bubbles: true, composed: true }));
  };

  private handleExportCsv = () => {
    this.dispatchEvent(new CustomEvent("export-csv", { bubbles: true, composed: true }));
  };

  private handleExportHtml = () => {
    this.dispatchEvent(new CustomEvent("export-html", { bubbles: true, composed: true }));
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
                  (company) =>
                    html`<option
                      value=${company.id}
                      ?selected=${company.id === this.selectedCompanyId}
                    >
                      ${company.name}
                    </option>`,
                )}
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              @click=${this.handleEditCompany}
              ?disabled=${this.isExportingPdf ||
              this.isExportingPng ||
              this.isExportingCsv ||
              this.isExportingHtml}
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
            <button
              type="button"
              class="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              @click=${this.handleExportPng}
              ?disabled=${this.isExportingPng ||
              this.isExportingPdf ||
              this.isExportingCsv ||
              this.isExportingHtml}
            >
              ${this.isExportingPng ? "Generating PNG..." : "PNG"}
            </button>
            <button
              type="button"
              class="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              @click=${this.handleExportPdf}
              ?disabled=${this.isExportingPdf ||
              this.isExportingPng ||
              this.isExportingCsv ||
              this.isExportingHtml}
            >
              ${this.isExportingPdf ? "Generating PDF..." : "PDF"}
            </button>
            <button
              type="button"
              class="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              @click=${this.handleExportCsv}
              ?disabled=${this.isExportingCsv ||
              this.isExportingPdf ||
              this.isExportingPng ||
              this.isExportingHtml}
            >
              ${this.isExportingCsv ? "Generating CSV..." : "CSV"}
            </button>
            <button
              type="button"
              class="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              @click=${this.handleExportHtml}
              ?disabled=${this.isExportingHtml ||
              this.isExportingPdf ||
              this.isExportingPng ||
              this.isExportingCsv}
            >
              ${this.isExportingHtml ? "Generating HTML..." : "HTML"}
            </button>
            <button
              type="button"
              class="rounded-[var(--radius-sm)] p-4 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              @click=${this.handleRefresh}
              title="Refresh data"
            >
              <svg
                width="28"
                height="28"
                viewBox="5 -5 33 28"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1 2.12-9.36L23 10"></path>
              </svg>
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

import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";

export class CompaniesTable extends LitElement {
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

  private selectCompany = (companyId: string) => {
    this.dispatchEvent(
      new CustomEvent<{ companyId: string }>("company-change", {
        detail: { companyId },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private editCompany = (event: Event) => {
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent("edit-company", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <div class="w-full">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-[var(--color-border-subtle)]">
              <th class="w-8 px-4 py-3 text-center"></th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
              >
                Company name
              </th>
              <th class="w-20 px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            ${this.companies.map((company) => {
              const isSelected = company.id === this.selectedCompanyId;
              return html`
                <tr
                  class="border-b border-[var(--color-border-subtle)] ${isSelected
                    ? "bg-[var(--color-brand-soft)]"
                    : "hover:bg-[var(--color-surface-muted)]"} cursor-pointer transition"
                  @click=${() => this.selectCompany(company.id)}
                >
                  <td class="px-4 py-3 text-center text-lg font-medium text-[var(--color-brand)]">
                    ${isSelected ? "✓" : ""}
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">
                    ${company.name}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]"
                      @click=${this.editCompany}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }
}

if (!customElements.get("companies-table")) {
  customElements.define("companies-table", CompaniesTable);
}

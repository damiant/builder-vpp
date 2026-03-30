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

  private openEditor = () => {
    this.dispatchEvent(new CustomEvent("edit-company", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <header class="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div
          class="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Fusion metrics
            </p>
            <h1 class="mt-1 text-xl font-semibold text-slate-900">Company connection</h1>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>Company</span>
              <select
                class="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
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
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
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

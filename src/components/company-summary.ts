import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import { maskSecret } from "../lib/company-store";

export class CompanySummary extends LitElement {
  static properties = {
    company: { attribute: false },
  };

  company: CompanyConfig | null = null;

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
      <main class="mx-auto flex max-w-6xl flex-1 items-center px-6 py-12">
        <section class="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="flex flex-col gap-3 border-b border-slate-100 pb-6">
            <p class="text-sm font-medium text-violet-600">Connected company</p>
            <h2 class="text-3xl font-semibold tracking-tight text-slate-900">${company.name}</h2>
            <p class="max-w-2xl text-sm leading-6 text-slate-600">
              Save the company name, public key, and private key in the dialog. The connect action
              uses the private key from
              <code
                class="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-medium text-slate-800"
                >metrics.md</code
              >
              and requests the last 30 days of metrics.
            </p>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Company name
              </p>
              <p class="mt-2 text-sm font-medium text-slate-900">${company.name}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Public key
              </p>
              <p class="mt-2 text-sm font-medium text-slate-900">
                ${maskSecret(company.publicKey)}
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Private key
              </p>
              <p class="mt-2 text-sm font-medium text-slate-900">
                ${maskSecret(company.privateKey)}
              </p>
            </div>
          </div>

          <div
            class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          >
            <span class="font-medium text-slate-900">Connect endpoint:</span>
            <span class="ml-1 break-all">https://builder.io/api/v1/orgs/fusion/metrics</span>
          </div>
        </section>
      </main>
    `;
  }
}

if (!customElements.get("company-summary")) {
  customElements.define("company-summary", CompanySummary);
}

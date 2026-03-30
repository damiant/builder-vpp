import { LitElement, html } from "lit";
import type { PropertyValues } from "lit";
import type { CompanyConfig } from "../lib/company-store";

export class CompanyDialog extends LitElement {
  static properties = {
    company: { attribute: false },
    open: { type: Boolean, attribute: false },
  };

  company: CompanyConfig | null = null;
  open = false;

  createRenderRoot() {
    return this;
  }

  protected updated(changedProperties: PropertyValues<this>) {
    if (!changedProperties.has("open")) {
      return;
    }

    const dialog = this.dialog;

    if (!dialog) {
      return;
    }

    if (this.open && !dialog.open) {
      dialog.showModal();
    }

    if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  private get dialog() {
    return this.querySelector<HTMLDialogElement>("#company-dialog");
  }

  private get companyNameInput() {
    return this.querySelector<HTMLInputElement>("#company-name");
  }

  private get companyPublicKeyInput() {
    return this.querySelector<HTMLInputElement>("#company-public-key");
  }

  private get companyPrivateKeyInput() {
    return this.querySelector<HTMLInputElement>("#company-private-key");
  }

  private readCompany() {
    const baseCompany = this.company ?? {
      id: "company",
      name: "Company",
      publicKey: "",
      privateKey: "",
    };

    return {
      ...baseCompany,
      name: this.companyNameInput?.value.trim() || "Company",
      publicKey: this.companyPublicKeyInput?.value.trim() || "",
      privateKey: this.companyPrivateKeyInput?.value.trim() || "",
    };
  }

  private handleNativeClose = () => {
    if (this.open) {
      this.dispatchEvent(
        new CustomEvent("close-company-dialog", { bubbles: true, composed: true }),
      );
    }
  };

  private closeDialog = () => {
    this.dispatchEvent(new CustomEvent("close-company-dialog", { bubbles: true, composed: true }));
  };

  private saveCompany = () => {
    this.dispatchEvent(
      new CustomEvent<{ company: CompanyConfig }>("save-company", {
        detail: { company: this.readCompany() },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private connectCompany = () => {
    this.dispatchEvent(
      new CustomEvent<{ company: CompanyConfig }>("connect-company", {
        detail: { company: this.readCompany() },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    const company = this.company ?? {
      id: "company",
      name: "Company",
      publicKey: "",
      privateKey: "",
    };

    return html`
      <dialog
        id="company-dialog"
        class="w-[min(92vw,36rem)] rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50"
        @close=${this.handleNativeClose}
      >
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Company settings
              </p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Edit company
              </h2>
            </div>
            <button
              type="button"
              class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close dialog"
              @click=${this.closeDialog}
            >
              ✕
            </button>
          </div>

          <div class="mt-6 grid gap-4">
            <label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Company name</span>
              <input
                id="company-name"
                class="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                type="text"
                placeholder="Enter company name"
                .value=${company.name}
              />
            </label>

            <label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Public Key</span>
              <input
                id="company-public-key"
                class="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                type="text"
                placeholder="Enter public key"
                .value=${company.publicKey}
              />
            </label>

            <label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Private Key</span>
              <input
                id="company-private-key"
                class="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                type="password"
                placeholder="Enter private key"
                .value=${company.privateKey}
              />
            </label>
          </div>

          <p class="mt-4 text-xs leading-5 text-slate-500">
            The private key is sent as the Bearer token in the Authorization header, matching the
            Fusion Metrics API docs.
          </p>

          <div class="mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click=${this.closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              @click=${this.saveCompany}
            >
              Save
            </button>
            <button
              type="button"
              class="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
              @click=${this.connectCompany}
            >
              Connect
            </button>
          </div>
        </div>
      </dialog>
    `;
  }
}

if (!customElements.get("company-dialog")) {
  customElements.define("company-dialog", CompanyDialog);
}

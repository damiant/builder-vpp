import { LitElement, html } from "lit";
import type { PropertyValues } from "lit";
import type { CompanyConfig } from "../lib/company-store";

export class CompanyDialog extends LitElement {
  static properties = {
    company: { attribute: false },
    open: { type: Boolean, attribute: false },
  };

  declare company: CompanyConfig | null;
  declare open: boolean;

  constructor() {
    super();
    this.company = null;
    this.open = false;
  }

  createRenderRoot() {
    return this;
  }

  protected updated(changedProperties: PropertyValues<this>) {
    // Sync input values when company or open state changes
    if (changedProperties.has("company") || changedProperties.has("open")) {
      const company = this.company ?? {
        id: "company",
        name: "Company",
        publicKey: "",
        privateKey: "",
      };

      const nameInput = this.companyNameInput;
      const publicKeyInput = this.companyPublicKeyInput;
      const privateKeyInput = this.companyPrivateKeyInput;

      if (nameInput) nameInput.value = company.name;
      if (publicKeyInput) publicKeyInput.value = company.publicKey;
      if (privateKeyInput) privateKeyInput.value = company.privateKey;
    }

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

  private deleteCompany = () => {
    if (!this.company) {
      return;
    }

    if (confirm(`Delete "${this.company.name}"? This action cannot be undone.`)) {
      this.dispatchEvent(
        new CustomEvent<{ companyId: string }>("delete-company", {
          detail: { companyId: this.company.id },
          bubbles: true,
          composed: true,
        }),
      );
    }
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
        class="w-[min(92vw,36rem)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-md)]"
        @close=${this.handleNativeClose}
      >
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p
                class="brand-heading text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]"
              >
                Company settings
              </p>
              <h2
                class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]"
              >
                Edit company
              </h2>
            </div>
            <button
              type="button"
              class="p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
              aria-label="Close dialog"
              @click=${this.closeDialog}
            >
              ✕
            </button>
          </div>

          <div class="mt-6 grid gap-4">
            <label class="grid gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <span>Company name</span>
              <input
                id="company-name"
                class="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
                type="text"
                placeholder="Enter company name"
                value=${company.name}
              />
            </label>

            <label class="grid gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <span>Public Key</span>
              <input
                id="company-public-key"
                class="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
                type="text"
                placeholder="Enter public key"
                value=${company.publicKey}
              />
            </label>

            <label class="grid gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <span>Private Key</span>
              <input
                id="company-private-key"
                class="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
                type="password"
                placeholder="Enter private key"
                value=${company.privateKey}
              />
            </label>
          </div>

          <p class="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
            The private key is sent as the Bearer token in the Authorization header, matching the
            Fusion Metrics API docs.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              class="rounded-[var(--radius-sm)] border border-[var(--color-destructive-soft)] bg-[var(--color-destructive-soft)] px-4 py-2.5 text-sm font-medium text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)] hover:text-white"
              @click=${this.deleteCompany}
            >
              Delete
            </button>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]"
                @click=${this.closeDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]"
                @click=${this.saveCompany}
              >
                Save
              </button>
              <button
                type="button"
                class="rounded-[var(--radius-sm)] bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-strong)]"
                @click=${this.connectCompany}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </dialog>
    `;
  }
}

if (!customElements.get("company-dialog")) {
  customElements.define("company-dialog", CompanyDialog);
}

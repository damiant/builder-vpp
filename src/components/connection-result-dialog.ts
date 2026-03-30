import { LitElement, html } from "lit";
import type { PropertyValues } from "lit";

type ConnectionResult = {
  status: number;
  ok: boolean;
  message?: string;
  data?: unknown;
  url?: string;
  headers?: Record<string, string>;
};

export class ConnectionResultDialog extends LitElement {
  static properties = {
    result: { attribute: false },
    open: { type: Boolean, attribute: false },
  };

  declare result: ConnectionResult | null;
  declare open: boolean;

  constructor() {
    super();
    this.result = null;
    this.open = false;
  }

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
    return this.querySelector<HTMLDialogElement>("#connection-result-dialog");
  }

  private handleNativeClose = () => {
    if (this.open) {
      this.dispatchEvent(
        new CustomEvent("close-result-dialog", { bubbles: true, composed: true }),
      );
    }
  };

  private closeDialog = () => {
    this.dispatchEvent(new CustomEvent("close-result-dialog", { bubbles: true, composed: true }));
  };

  render() {
    const result = this.result;

    if (!result) {
      return html``;
    }

    return html`
      <dialog
        id="connection-result-dialog"
        class="w-[min(92vw,48rem)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-md)]"
        @close=${this.handleNativeClose}
      >
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="brand-heading text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
                Connection result
              </p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                ${result.ok ? "Success" : "Failed"}
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

          <div class="mt-6 space-y-4">
            <div class="rounded-[var(--radius-lg)] border ${result.ok ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"} px-4 py-3">
              <p class="font-medium ${result.ok ? "text-green-900" : "text-red-900"}">
                Status: ${result.status} ${result.ok ? "✓" : "✗"}
              </p>
              <p class="mt-1 text-sm ${result.ok ? "text-green-800" : "text-red-800"}">
                ${result.message}
              </p>
            </div>

            ${result.url ? html`
              <div class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4">
                <p class="font-medium text-[var(--color-text-primary)]">Request URL:</p>
                <pre class="mt-2 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-3 text-xs font-mono text-[var(--color-text-primary)]">${result.url}</pre>
              </div>
            ` : ""}

            ${result.headers ? html`
              <div class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4">
                <p class="font-medium text-[var(--color-text-primary)]">Request Headers:</p>
                <pre class="mt-2 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-3 text-xs font-mono text-[var(--color-text-primary)]">${JSON.stringify(result.headers, null, 2)}</pre>
              </div>
            ` : ""}

            ${result.data ? html`
              <div class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4">
                <p class="font-medium text-[var(--color-text-primary)]">Response Data:</p>
                <pre class="mt-2 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-3 text-xs font-mono text-[var(--color-text-primary)]">${JSON.stringify(result.data, null, 2)}</pre>
              </div>
            ` : ""}
          </div>

          <div class="mt-8 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)]"
              @click=${this.closeDialog}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    `;
  }
}

if (!customElements.get("connection-result-dialog")) {
  customElements.define("connection-result-dialog", ConnectionResultDialog);
}

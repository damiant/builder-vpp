import { LitElement, html } from "lit";

type Space = {
  id: string;
  name: string;
};

export class SpaceSelector extends LitElement {
  static properties = {
    spaces: { attribute: false },
    selectedSpaceId: { type: String, attribute: false },
  };

  declare spaces: Space[];
  declare selectedSpaceId: string;

  constructor() {
    super();
    this.spaces = [];
    this.selectedSpaceId = "all";
  }

  createRenderRoot() {
    return this;
  }

  private handleSpaceChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.selectedSpaceId = target.value;
    this.dispatchEvent(
      new CustomEvent("space-change", {
        detail: { spaceId: this.selectedSpaceId },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <div class="flex flex-col gap-2">
        <label for="space-select" class="text-sm font-medium text-[var(--color-text-secondary)]">
          Space
        </label>
        <select
          id="space-select"
          .value=${this.selectedSpaceId}
          @change=${this.handleSpaceChange}
          class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
        >
          <option value="all">All Spaces</option>
          ${this.spaces.map((space) => html` <option value=${space.id}>${space.name}</option> `)}
        </select>
      </div>
    `;
  }
}

if (!customElements.get("space-selector")) {
  customElements.define("space-selector", SpaceSelector);
}

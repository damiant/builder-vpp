import { LitElement, html } from "lit";

export class DateRangeSelector extends LitElement {
  static properties = {
    month: { type: Number, attribute: false },
    year: { type: Number, attribute: false },
  };

  declare month: number;
  declare year: number;

  constructor() {
    super();
    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();
  }

  createRenderRoot() {
    return this;
  }

  private handleMonthChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.month = parseInt(target.value, 10);
    this.dispatchEvent(
      new CustomEvent("date-change", {
        detail: { month: this.month, year: this.year },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleYearChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    this.year = parseInt(target.value, 10);
    this.dispatchEvent(
      new CustomEvent("date-change", {
        detail: { month: this.month, year: this.year },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return html`
      <div class="flex gap-4">
        <div class="flex flex-col gap-2">
          <label for="month-select" class="text-sm font-medium text-[var(--color-text-secondary)]">
            Month
          </label>
          <select
            id="month-select"
            .value=${String(this.month)}
            @change=${this.handleMonthChange}
            class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
          >
            ${months.map((name, index) => html` <option value=${index}>${name}</option> `)}
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label for="year-select" class="text-sm font-medium text-[var(--color-text-secondary)]">
            Year
          </label>
          <select
            id="year-select"
            .value=${String(this.year)}
            @change=${this.handleYearChange}
            class="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-ring)]"
          >
            ${years.map((y) => html` <option value=${y}>${y}</option> `)}
          </select>
        </div>
      </div>
    `;
  }
}

if (!customElements.get("date-range-selector")) {
  customElements.define("date-range-selector", DateRangeSelector);
}

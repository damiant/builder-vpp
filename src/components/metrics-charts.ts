import { LitElement, html } from "lit";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

type MetricsData = {
  period: string;
  metrics: {
    userPrompts: number;
    totalLines: number;
    creditsUsed: number;
    designsExported: number;
    prsMerged: number;
    events: number;
  };
}[];

export class MetricsCharts extends LitElement {
  static properties = {
    data: { attribute: false },
  };

  declare data: MetricsData | null;

  private charts: Map<string, Chart> = new Map();

  constructor() {
    super();
    this.data = null;
  }

  createRenderRoot() {
    return this;
  }

  override updated() {
    if (!this.data) return;

    // Destroy existing charts
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();

    const chartConfigs = [
      {
        id: "userPrompts",
        label: "User Prompts",
        dataKey: "userPrompts",
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
      },
      {
        id: "totalLines",
        label: "Total Lines",
        dataKey: "totalLines",
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        id: "creditsUsed",
        label: "Credits Used",
        dataKey: "creditsUsed",
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
      },
      {
        id: "designsExported",
        label: "Designs Exported",
        dataKey: "designsExported",
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
      },
      {
        id: "prsMerged",
        label: "PRs Merged",
        dataKey: "prsMerged",
        borderColor: "#ec4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
      },
      {
        id: "events",
        label: "Events",
        dataKey: "events",
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6, 182, 212, 0.1)",
      },
    ] as const;

    chartConfigs.forEach((config) => {
      setTimeout(() => this.createChart(config), 0);
    });
  }

  private formatDateLabel(dateString: string): string {
    try {
      const date = new Date(dateString);
      const month = date.toLocaleString("en-US", { month: "short" });
      const day = date.getDate();
      return `${month} ${day}`;
    } catch {
      return dateString;
    }
  }

  private createChart(
    config: Readonly<{
      id: string;
      label: string;
      dataKey: keyof MetricsData[0]["metrics"];
      borderColor: string;
      backgroundColor: string;
    }>,
  ) {
    const canvas = this.querySelector<HTMLCanvasElement>(`#chart-${config.id}`);
    if (!canvas) return;

    const dates = this.data!.map((d) => d.period);
    const formattedDates = dates.map((d) => this.formatDateLabel(d));
    const values = this.data!.map((d) => d.metrics[config.dataKey]);

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: config.label,
            data: values,
            backgroundColor: config.borderColor,
            borderColor: config.borderColor,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#431407",
              font: { family: '"Inter", system-ui, sans-serif', size: 12 },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#7c2d12",
              font: { family: '"Inter", system-ui, sans-serif' },
            },
            grid: {
              color: "rgba(253, 186, 116, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#7c2d12",
              font: { family: '"Inter", system-ui, sans-serif' },
            },
            grid: {
              color: "rgba(253, 186, 116, 0.1)",
            },
          },
        },
      },
    });

    this.charts.set(config.id, chart);
  }

  render() {
    if (!this.data || this.data.length === 0) {
      return html``;
    }

    return html`
      <div class="mt-8 space-y-6">
        <div>
          <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Metrics Charts
          </h3>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <canvas id="chart-userPrompts"></canvas>
          </div>

          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <canvas id="chart-totalLines"></canvas>
          </div>

          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <canvas id="chart-creditsUsed"></canvas>
          </div>

          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <canvas id="chart-designsExported"></canvas>
          </div>

          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <canvas id="chart-prsMerged"></canvas>
          </div>

          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <canvas id="chart-events"></canvas>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get("metrics-charts")) {
  customElements.define("metrics-charts", MetricsCharts);
}

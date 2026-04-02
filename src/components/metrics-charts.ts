import { LitElement, html } from "lit";
import { Chart, registerables } from "chart.js";
import type { CompanyConfig } from "../lib/company-store";
import { buildUsersUrl } from "../lib/company-store";
import { getCachedUsers, cacheUsers } from "../lib/metrics-cache";

Chart.register(...registerables);

type MetricsItem = {
  userPrompts: number;
  totalLines: number;
  creditsUsed: number;
  designsExported: number;
  prsMerged: number;
  events: number;
  users: number;
  spaceIds: string[];
  spaces: Array<{ id: string; name: string }>;
  models?: Array<{ model: string; tokensUsed: number; creditsUsed: number; linesOfCode: number }>;
};

type MetricsData = {
  period: string;
  metrics: MetricsItem;
}[];

export class MetricsCharts extends LitElement {
  static properties = {
    data: { attribute: false },
    selectedSpaceId: { attribute: false },
    company: { attribute: false },
    selectedMonth: { type: Number, attribute: false },
    selectedYear: { type: Number, attribute: false },
    usersData: { attribute: false },
    modelMetrics: { attribute: false },
    projectMetrics: { attribute: false },
    featureMetrics: { attribute: false },
    userModelMetrics: { attribute: false },
    designVsPromptMetrics: { attribute: false },
    projectsApiData: { attribute: false },
  };

  declare data: MetricsData | null;
  declare selectedSpaceId: string;
  declare company: CompanyConfig | null;
  declare selectedMonth: number;
  declare selectedYear: number;
  declare usersData: Array<any> | null;
  declare modelMetrics: Array<{
    model: string;
    totalLines: number;
    events: number;
    creditsUsed: number;
  }> | null;
  declare projectMetrics: Array<{
    projectName: string;
    totalLines: number;
    creditsUsed: number;
  }> | null;
  declare featureMetrics: Array<{
    feature: string;
    totalLines: number;
    events: number;
    creditsUsed: number;
  }> | null;
  declare userModelMetrics: Array<{
    userEmail: string;
    totalCreditsUsed: number;
    models: Array<{
      model: string;
      totalLines: number;
      events: number;
      creditsUsed: number;
    }>;
  }> | null;
  declare designVsPromptMetrics: Array<{
    type: "Design" | "Prompt";
    count: number;
    creditsUsed: number;
    uniqueDesigns: number;
  }> | null;
  declare projectsApiData: Array<{
    projectId: string;
    projectName: string;
    metrics: {
      linesAdded: number;
      linesRemoved: number;
      linesAccepted: number;
      userPrompts: number;
      creditsUsed: number;
      activeUsers: number;
      prsMerged: number;
      prsCreated: number;
    };
  }> | null;

  private charts: Map<string, Chart<any>> = new Map();

  constructor() {
    super();
    this.data = null;
    this.selectedSpaceId = "all";
    this.company = null;
    this.selectedMonth = new Date().getMonth();
    this.selectedYear = new Date().getFullYear();
    this.usersData = null;
    this.modelMetrics = null;
    this.projectMetrics = null;
    this.featureMetrics = null;
    this.userModelMetrics = null;
    this.designVsPromptMetrics = null;
    this.projectsApiData = null;
  }

  createRenderRoot() {
    return this;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up all charts when component is removed
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }

  override updated(changedProperties: Map<string, unknown>) {
    const dataChanged = changedProperties.has("data");
    const usersContextChanged =
      changedProperties.has("company") ||
      changedProperties.has("selectedMonth") ||
      changedProperties.has("selectedYear");

    // Only recreate charts when data changes
    if (dataChanged) {
      if (!this.data) return;
      this.charts.forEach((chart) => chart.destroy());
      this.charts.clear();
    }

    // Only fetch users when company or date range changes (not when usersData changes)
    if (usersContextChanged && this.company && this.company.privateKey) {
      this.usersData = null;
      void this.fetchUsersData();
    }

    if (!dataChanged) return;

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

  private async fetchUsersData() {
    if (!this.company) return;

    const { startDate, endDate } = this.getDateRange();
    const cachedData = await getCachedUsers(
      this.company.publicKey,
      this.company.privateKey,
      startDate,
      endDate,
    );

    if (cachedData) {
      this.usersData = cachedData as Array<any>;
      return;
    }

    const url = buildUsersUrl(startDate, endDate);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.company.privateKey}`,
    };

    try {
      console.log("Fetching users data from:", url.toString());
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        console.error("Failed to fetch users data:", response.status);
        return;
      }

      const responseData = await response.json();
      const usersArray = Array.isArray(responseData) ? responseData : responseData.data || [];

      await cacheUsers(
        this.company.publicKey,
        this.company.privateKey,
        startDate,
        endDate,
        usersArray,
      );

      this.usersData = usersArray;
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  }

  private getDateRange() {
    const startDate = new Date(this.selectedYear, this.selectedMonth, 1);
    const endDate = new Date(this.selectedYear, this.selectedMonth + 1, 0);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  private getSpaceMetrics(): Array<{
    spaceId: string;
    spaceName: string;
    totalLines: number;
    events: number;
    creditsUsed: number;
  }> {
    if (!this.data) return [];

    const spaceMap = new Map<
      string,
      {
        spaceId: string;
        spaceName: string;
        totalLines: number;
        events: number;
        creditsUsed: number;
      }
    >();

    this.data.forEach((item) => {
      const rawSpaces = item.metrics.spaces || [];
      rawSpaces.forEach(
        (space: {
          id: string;
          name: string;
          totalLines?: number;
          events?: number;
          creditsUsed?: number;
        }) => {
          const spaceId = space.id;
          if (!spaceMap.has(spaceId)) {
            spaceMap.set(spaceId, {
              spaceId,
              spaceName: space.name,
              totalLines: 0,
              events: 0,
              creditsUsed: 0,
            });
          }
          const spaceData = spaceMap.get(spaceId)!;
          spaceData.totalLines += space.totalLines || 0;
          spaceData.events += space.events || 0;
          spaceData.creditsUsed += space.creditsUsed || 0;
        },
      );
    });

    return Array.from(spaceMap.values()).sort((a, b) => b.creditsUsed - a.creditsUsed);
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

    // Destroy existing chart if it exists
    const existingChart = this.charts.get(config.id);
    if (existingChart) {
      existingChart.destroy();
    }

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
              color: "#111111",
              font: { family: '"Inter", system-ui, sans-serif', size: 12 },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#4b5563",
              font: { family: '"Inter", system-ui, sans-serif' },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.06)",
            },
          },
          x: {
            ticks: {
              color: "#4b5563",
              font: { family: '"Inter", system-ui, sans-serif' },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.06)",
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

    const spaceMetrics = this.getSpaceMetrics();
    const shouldShowSpacesTable = this.selectedSpaceId === "all" && spaceMetrics.length > 0;
    const shouldShowModelsTable = this.modelMetrics && this.modelMetrics.length > 0;
    const shouldShowDesignVsPromptTable =
      this.designVsPromptMetrics && this.designVsPromptMetrics.length > 0;
    const shouldShowProjectsTable = this.projectsApiData && this.projectsApiData.length > 0;
    const shouldShowFeaturesTable = this.featureMetrics && this.featureMetrics.length > 0;
    const shouldShowUserModelBreakdown = this.userModelMetrics && this.userModelMetrics.length > 0;

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

        ${shouldShowSpacesTable
          ? html`
              <div>
                <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Spaces
                </h3>
              </div>

              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-[var(--color-border-subtle)]">
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Space Name
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Total Lines
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Events
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Used
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${spaceMetrics.map(
                        (space) => html`
                          <tr
                            class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                          >
                            <td class="px-4 py-3 text-[var(--color-text-primary)]">
                              ${space.spaceName}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${space.totalLines.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${space.events.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${Math.ceil(space.creditsUsed).toLocaleString()}
                            </td>
                          </tr>
                        `,
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ""}
        ${shouldShowModelsTable
          ? html`
              <div>
                <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Models
                </h3>
              </div>

              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-[var(--color-border-subtle)]">
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Model
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Total Lines
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Events
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Used
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Per Event
                        </th>
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Credit Distribution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.modelMetrics!.map((model) => {
                        const maxCredits = Math.max(
                          ...this.modelMetrics!.map((m) => m.creditsUsed),
                          1,
                        );
                        const creditPercentage = (model.creditsUsed / maxCredits) * 100;
                        const creditsPerEvent =
                          model.events > 0 ? model.creditsUsed / model.events : 0;

                        return html`
                          <tr
                            class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                          >
                            <td class="px-4 py-3 text-[var(--color-text-primary)]">
                              ${model.model}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${model.totalLines.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${model.events.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${Math.round(model.creditsUsed).toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${creditsPerEvent.toFixed(2)}
                            </td>
                            <td class="px-4 py-3">
                              <div class="w-full max-w-xs">
                                <div class="rounded-full bg-[var(--color-border-subtle)] p-0.5 h-6">
                                  <div
                                    class="h-full rounded-full bg-[#10b981] transition-all duration-300"
                                    style="width: ${creditPercentage}%"
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        `;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ""}
        ${shouldShowDesignVsPromptTable
          ? html`
              <div>
                <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Design vs Prompt
                </h3>
              </div>

              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-[var(--color-border-subtle)]">
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Type
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Count
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Used
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Unique Designs
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.designVsPromptMetrics!.map((item) => {
                        return html`
                          <tr
                            class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                          >
                            <td class="px-4 py-3 text-[var(--color-text-primary)]">${item.type}</td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${item.count.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${Math.round(item.creditsUsed).toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${item.uniqueDesigns.toLocaleString()}
                            </td>
                          </tr>
                        `;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ""}
        ${shouldShowProjectsTable
          ? html`
              <div>
                <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Projects
                </h3>
              </div>

              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-[var(--color-border-subtle)]">
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Project Name
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Lines Added
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Lines Removed
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          User Prompts
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Used
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Active Users
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          PRs Merged
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          PRs Created
                        </th>
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Credit Distribution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.projectsApiData!.map((project) => {
                        const maxCredits = Math.max(
                          ...this.projectsApiData!.map((item) => item.metrics.creditsUsed),
                          1,
                        );
                        const creditPercentage = (project.metrics.creditsUsed / maxCredits) * 100;

                        return html`
                          <tr
                            class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                          >
                            <td class="px-4 py-3 text-[var(--color-text-primary)]">
                              ${project.projectName}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${project.metrics.linesAdded.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${project.metrics.linesRemoved.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${project.metrics.userPrompts.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${Math.round(project.metrics.creditsUsed).toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${project.metrics.activeUsers.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${project.metrics.prsMerged.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${project.metrics.prsCreated.toLocaleString()}
                            </td>
                            <td class="px-4 py-3">
                              <div class="w-full max-w-xs">
                                <div class="h-6 rounded-full bg-[var(--color-border-subtle)] p-0.5">
                                  <div
                                    class="h-full rounded-full bg-[#10b981] transition-all duration-300"
                                    style="width: ${creditPercentage}%"
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        `;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ""}
        ${shouldShowFeaturesTable
          ? html`
              <div>
                <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Feature
                </h3>
              </div>

              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-[var(--color-border-subtle)]">
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Feature
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Total Lines
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Events
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Used
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Per Event
                        </th>
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Credit Distribution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.featureMetrics!.map((feature) => {
                        const maxCredits = Math.max(
                          ...this.featureMetrics!.map((item) => item.creditsUsed),
                          1,
                        );
                        const creditPercentage = (feature.creditsUsed / maxCredits) * 100;
                        const creditsPerEvent =
                          feature.events > 0 ? feature.creditsUsed / feature.events : 0;

                        return html`
                          <tr
                            class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                          >
                            <td class="px-4 py-3 text-[var(--color-text-primary)]">
                              ${feature.feature}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${feature.totalLines.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${feature.events.toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${Math.round(feature.creditsUsed).toLocaleString()}
                            </td>
                            <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                              ${creditsPerEvent.toFixed(2)}
                            </td>
                            <td class="px-4 py-3">
                              <div class="w-full max-w-xs">
                                <div class="h-6 rounded-full bg-[var(--color-border-subtle)] p-0.5">
                                  <div
                                    class="h-full rounded-full bg-[#10b981] transition-all duration-300"
                                    style="width: ${creditPercentage}%"
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        `;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ""}
        ${this.usersData && Array.isArray(this.usersData) && this.usersData.length > 0
          ? html`
              <div>
                <h3 class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Users
                </h3>
              </div>

              <div
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-[var(--color-border-subtle)]">
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          User Email
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Total Lines
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          User Prompts
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Design Exports
                        </th>
                        <th
                          class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                        >
                          Credits Used
                        </th>
                        <th
                          class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                        >
                          Credit Distribution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.usersData
                        .filter((user: any) => user.userEmail) // Filter out unknown users
                        .sort((a: any, b: any) => b.metrics.creditsUsed - a.metrics.creditsUsed)
                        .map((user: any, _index: number, users: any[]) => {
                          const maxCredits = Math.max(
                            ...users.map((item: any) => item.metrics.creditsUsed),
                            1,
                          );
                          const creditPercentage = (user.metrics.creditsUsed / maxCredits) * 100;

                          return html`
                            <tr
                              class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                            >
                              <td class="px-4 py-3 text-[var(--color-text-primary)]">
                                ${user.userEmail}
                              </td>
                              <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                                ${user.metrics.totalLines.toLocaleString()}
                              </td>
                              <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                                ${user.metrics.userPrompts.toLocaleString()}
                              </td>
                              <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                                ${user.designExports.toLocaleString()}
                              </td>
                              <td class="px-4 py-3 text-right text-[var(--color-text-secondary)]">
                                ${Math.ceil(user.metrics.creditsUsed).toLocaleString()}
                              </td>
                              <td class="px-4 py-3">
                                <div class="w-full max-w-xs">
                                  <div
                                    class="h-6 rounded-full bg-[var(--color-border-subtle)] p-0.5"
                                  >
                                    <div
                                      class="h-full rounded-full bg-[#10b981] transition-all duration-300"
                                      style="width: ${creditPercentage}%"
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          `;
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ""}
        ${shouldShowUserModelBreakdown
          ? html`
              <details
                class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
              >
                <summary class="cursor-pointer list-none">
                  <div class="flex items-center justify-between gap-4">
                    <h3
                      class="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]"
                    >
                      User-Level Model Usage Breakdown
                    </h3>
                    <span class="text-sm font-medium text-[var(--color-text-secondary)]">
                      Expand
                    </span>
                  </div>
                </summary>

                <div class="mt-4 space-y-4">
                  ${this.userModelMetrics!.map((user) => {
                    const maxCredits = Math.max(
                      ...user.models.map((model) => model.creditsUsed),
                      1,
                    );

                    return html`
                      <div
                        class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4"
                      >
                        <div class="border-b border-[var(--color-border-subtle)] px-4 pb-3">
                          <h4 class="text-base font-semibold text-[var(--color-text-primary)]">
                            ${user.userEmail}
                          </h4>
                        </div>
                        <div class="overflow-x-auto">
                          <table class="w-full text-sm">
                            <thead>
                              <tr class="border-b border-[var(--color-border-subtle)]">
                                <th
                                  class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                                >
                                  Model
                                </th>
                                <th
                                  class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                                >
                                  Total Lines
                                </th>
                                <th
                                  class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                                >
                                  Events
                                </th>
                                <th
                                  class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                                >
                                  Credits Per Event
                                </th>
                                <th
                                  class="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)]"
                                >
                                  Credits Used
                                </th>
                                <th
                                  class="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]"
                                >
                                  Credit Distribution
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              ${user.models.map((model) => {
                                const creditPercentage = (model.creditsUsed / maxCredits) * 100;
                                const creditsPerEvent =
                                  model.events > 0 ? model.creditsUsed / model.events : 0;

                                return html`
                                  <tr
                                    class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-elevated)]"
                                  >
                                    <td class="px-4 py-3 text-[var(--color-text-primary)]">
                                      ${model.model}
                                    </td>
                                    <td
                                      class="px-4 py-3 text-right text-[var(--color-text-secondary)]"
                                    >
                                      ${model.totalLines.toLocaleString()}
                                    </td>
                                    <td
                                      class="px-4 py-3 text-right text-[var(--color-text-secondary)]"
                                    >
                                      ${model.events.toLocaleString()}
                                    </td>
                                    <td
                                      class="px-4 py-3 text-right text-[var(--color-text-secondary)]"
                                    >
                                      ${creditsPerEvent.toFixed(2)}
                                    </td>
                                    <td
                                      class="px-4 py-3 text-right text-[var(--color-text-secondary)]"
                                    >
                                      ${Math.round(model.creditsUsed).toLocaleString()}
                                    </td>
                                    <td class="px-4 py-3">
                                      <div class="w-full max-w-xs">
                                        <div
                                          class="h-6 rounded-full bg-[var(--color-border-subtle)] p-0.5"
                                        >
                                          <div
                                            class="h-full rounded-full bg-[#10b981] transition-all duration-300"
                                            style="width: ${creditPercentage}%"
                                          ></div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                `;
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              </details>
            `
          : ""}
      </div>
    `;
  }
}

if (!customElements.get("metrics-charts")) {
  customElements.define("metrics-charts", MetricsCharts);
}

import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import "./metrics-charts";
import "./selected-company-card";
import "./date-range-selector";
import "./space-selector";

export class CompanySummary extends LitElement {
  static properties = {
    company: { attribute: false },
    metricsData: { attribute: false },
    metricsError: { attribute: false },
    selectedMonth: { type: Number, attribute: false },
    selectedYear: { type: Number, attribute: false },
    spaces: { attribute: false },
    selectedSpaceId: { attribute: false },
    modelMetrics: { attribute: false },
    projectMetrics: { attribute: false },
    featureMetrics: { attribute: false },
    userModelMetrics: { attribute: false },
    designVsPromptMetrics: { attribute: false },
    designMetrics: { attribute: false },
    eventsData: { attribute: false },
    sessionMetrics: { attribute: false },
    sessionTableData: { attribute: false },
    userSessionData: { attribute: false },
    showSessions: { type: Boolean, attribute: false },
    selectedUserEmail: { attribute: false },
    projectsApiData: { attribute: false },
    refreshTrigger: { type: Number, attribute: false },
  };

  declare company: CompanyConfig | null;
  declare metricsData: unknown[] | null;
  declare metricsError: string | null;
  declare selectedMonth: number;
  declare selectedYear: number;
  declare spaces: Array<{ id: string; name: string }>;
  declare selectedSpaceId: string;
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
  declare designMetrics: Array<{
    designDocumentId: string;
    records: Array<{
      userEmail: string;
      timestamp: string;
      earliestTimestamp?: string;
      creditsUsed: number;
      tokensUsed: number;
      model: string;
    }>;
  }> | null;
  declare eventsData: Array<any> | null;
  declare sessionMetrics: Map<string, number> | null;
  declare sessionTableData: Array<any> | null;
  declare userSessionData: Map<string, Array<any>> | null;
  declare showSessions: boolean;
  declare selectedUserEmail: string;
  declare refreshTrigger: number;
  declare projectsApiData: Array<{
    projectId: string;
    projectName: string;
    repoUrl?: string;
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

  constructor() {
    super();
    this.company = null;
    this.metricsData = null;
    this.metricsError = null;
    this.spaces = [];
    this.selectedSpaceId = "all";
    this.modelMetrics = null;
    this.projectMetrics = null;
    this.featureMetrics = null;
    this.userModelMetrics = null;
    this.designVsPromptMetrics = null;
    this.designMetrics = null;
    this.eventsData = null;
    this.sessionMetrics = null;
    this.sessionTableData = null;
    this.userSessionData = null;
    this.showSessions = false;
    this.selectedUserEmail = "";
    this.projectsApiData = null;
  }

  createRenderRoot() {
    return this;
  }

  private handleDateChange = (event: CustomEvent<{ month: number; year: number }>) => {
    console.log("company-summary received date-change event:", event.detail);
    this.dispatchEvent(
      new CustomEvent("date-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleSpaceChange = (event: CustomEvent<{ spaceId: string }>) => {
    console.log("company-summary received space-change event:", event.detail);
    this.dispatchEvent(
      new CustomEvent("space-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleUserSelected = (e: CustomEvent<{ userEmail: string }>) => {
    this.selectedUserEmail = e.detail.userEmail;
  };

  render() {
    if (this.selectedUserEmail) {
      const sessions = this.userSessionData?.get(this.selectedUserEmail) ?? [];
      const toTimeStr = (iso: string) =>
        iso
          ? new Date(iso)
              .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
              .toLowerCase()
          : "";
      const formatSessionTitle = (start: string, end: string) => {
        if (!start) return "";
        const dateStr = new Date(start).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const startStr = toTimeStr(start);
        const endStr = end && end !== start ? toTimeStr(end) : "";
        const durationMs =
          end && end !== start ? new Date(end).getTime() - new Date(start).getTime() : 0;
        const durationStr = (() => {
          if (durationMs <= 0) return "";
          const totalSecs = Math.floor(durationMs / 1000);
          const hrs = Math.floor(totalSecs / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          const secs = totalSecs % 60;
          return ` (${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")})`;
        })();
        return endStr
          ? `${dateStr}, ${startStr}-${endStr}${durationStr}`
          : `${dateStr}, ${startStr}`;
      };
      return html`
        <main class="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
          <div class="flex items-center gap-4">
            <button
              class="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              @click=${() => {
                this.selectedUserEmail = "";
              }}
            >
              ← Back
            </button>
            <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              ${this.selectedUserEmail}
            </h2>
          </div>

          ${sessions.length === 0
            ? html`<p class="text-sm text-[var(--color-text-secondary)]">No sessions found.</p>`
            : sessions.map(
                (session) => html`
                  <details
                    class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
                  >
                    <summary class="cursor-pointer list-none">
                      <div class="flex items-start justify-between gap-4">
                        <h4
                          class="font-mono text-sm font-semibold text-[var(--color-text-primary)]"
                        >
                          ${session.sessionId}
                        </h4>
                        <div class="text-right">
                          <p class="text-sm font-semibold text-[var(--color-text-primary)]">
                            $${session.events
                              .reduce((sum: number, ev: any) => sum + ev.creditsUsed * 0.05, 0)
                              .toFixed(2)}
                          </p>
                          <p class="text-xs text-[var(--color-text-tertiary)]">
                            ${session.events.length} event${session.events.length === 1 ? "" : "s"}
                          </p>
                          <p class="text-xs text-[var(--color-text-tertiary)]">
                            ${session.events.filter((ev: any) => ev.isDesign).length}
                            design${session.events.filter((ev: any) => ev.isDesign).length === 1
                              ? ""
                              : "s"}
                          </p>
                        </div>
                      </div>
                      <p class="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        ${formatSessionTitle(session.startTime, session.endTime)}
                      </p>
                      <p class="mt-1 text-xs text-[var(--color-text-tertiary)]">
                        ${session.spaceName} · ${session.projectName}
                      </p>
                    </summary>
                    <div class="mt-3 overflow-x-auto">
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="border-b border-[var(--color-border-subtle)]">
                            <th
                              class="px-4 py-2 text-left font-semibold text-[var(--color-text-primary)]"
                            >
                              Timestamp
                            </th>
                            <th
                              class="px-4 py-2 text-left font-semibold text-[var(--color-text-primary)]"
                            >
                              Feature
                            </th>
                            <th
                              class="px-4 py-2 text-right font-semibold text-[var(--color-text-primary)]"
                            >
                              Credits
                            </th>
                            <th
                              class="px-4 py-2 text-right font-semibold text-[var(--color-text-primary)]"
                            >
                              Amount
                            </th>
                            <th
                              class="px-4 py-2 text-right font-semibold text-[var(--color-text-primary)]"
                            >
                              Lines
                            </th>
                            <th
                              class="px-4 py-2 text-left font-semibold text-[var(--color-text-primary)]"
                            >
                              Model
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          ${session.events.map(
                            (ev: any) => html`
                              <tr
                                class="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]"
                              >
                                <td class="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                                  ${ev.timestamp
                                    ? new Date(ev.timestamp).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true,
                                      })
                                    : "—"}
                                </td>
                                <td class="px-4 py-2 text-[var(--color-text-secondary)]">
                                  ${ev.feature || "—"}
                                </td>
                                <td class="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                                  ${Math.round(ev.creditsUsed).toLocaleString()}
                                </td>
                                <td class="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                                  $${(ev.creditsUsed * 0.05).toFixed(3)}
                                </td>
                                <td class="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                                  ${ev.linesOfCode.toLocaleString()}
                                </td>
                                <td class="px-4 py-2 text-[var(--color-text-primary)]">
                                  ${ev.model || "—"}
                                </td>
                              </tr>
                            `,
                          )}
                        </tbody>
                      </table>
                    </div>
                  </details>
                `,
              )}
        </main>
      `;
    }

    if (this.showSessions) {
      return html`
        <main class="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
          <div class="flex items-center gap-4">
            <button
              class="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              @click=${() => {
                this.showSessions = false;
                this.selectedUserEmail = "";
              }}
            >
              ← Back
            </button>
            <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Sessions
            </h2>
          </div>
          <div
            class="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4"
          >
            <metrics-charts
              .data=${this.metricsData}
              .selectedSpaceId=${this.selectedSpaceId}
              .company=${this.company}
              .selectedMonth=${this.selectedMonth}
              .selectedYear=${this.selectedYear}
              .sessionTableData=${this.sessionTableData}
              .userSessionData=${this.userSessionData}
              .view=${"sessions"}
              @user-selected=${this.handleUserSelected}
            ></metrics-charts>
          </div>
        </main>
      `;
    }

    return html`
      <main class="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
        <selected-company-card
          .company=${this.company}
          .metricsData=${this.metricsData}
          .selectedMonth=${this.selectedMonth}
          .selectedYear=${this.selectedYear}
          .spaces=${this.spaces}
          .selectedSpaceId=${this.selectedSpaceId}
          @date-change=${this.handleDateChange}
          @space-change=${this.handleSpaceChange}
        ></selected-company-card>

        ${this.sessionTableData && this.sessionTableData.length > 0
          ? html`
              <div>
                <button
                  class="flex w-full items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-4 text-left hover:bg-[var(--color-surface)]"
                  @click=${() => {
                    this.showSessions = true;
                  }}
                >
                  <div>
                    <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Sessions</h3>
                    <p class="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                      ${this.sessionTableData.length}
                      session${this.sessionTableData.length === 1 ? "" : "s"} this period
                    </p>
                  </div>
                  <span class="text-sm font-medium text-[var(--color-text-secondary)]">View →</span>
                </button>
              </div>
            `
          : ""}
        ${this.metricsData && Array.isArray(this.metricsData) && this.metricsData.length > 0
          ? html`
              <section class="w-full">
                <metrics-charts
                  .data=${this.metricsData}
                  .selectedSpaceId=${this.selectedSpaceId}
                  .company=${this.company}
                  .selectedMonth=${this.selectedMonth}
                  .selectedYear=${this.selectedYear}
                  .modelMetrics=${this.modelMetrics}
                  .projectMetrics=${this.projectMetrics}
                  .featureMetrics=${this.featureMetrics}
                  .userModelMetrics=${this.userModelMetrics}
                  .designVsPromptMetrics=${this.designVsPromptMetrics}
                  .designMetrics=${this.designMetrics}
                  .eventsData=${this.eventsData}
                  .sessionMetrics=${this.sessionMetrics}
                  .sessionTableData=${this.sessionTableData}
                  .userSessionData=${this.userSessionData}
                  .projectsApiData=${this.projectsApiData}
                  @user-selected=${this.handleUserSelected}
                  .refreshTrigger=${this.refreshTrigger}
                ></metrics-charts>
              </section>
            `
          : this.metricsError
            ? html`
                <section
                  class="w-full rounded-[var(--radius-xl)] border border-red-300 bg-red-50 p-8 shadow-[var(--shadow-md)]"
                >
                  <div class="flex flex-col gap-3">
                    <p class="brand-heading text-sm font-medium text-red-900">
                      Error fetching metrics
                    </p>
                    <h2 class="text-2xl font-semibold tracking-tight text-red-900">
                      ${this.metricsError}
                    </h2>
                    <p class="max-w-2xl text-sm leading-6 text-red-800">
                      Make sure the selected company has valid credentials configured in the Edit
                      dialog.
                    </p>
                  </div>
                </section>
              `
            : html`
                <section
                  class="w-full rounded-[var(--radius-xl)] border border-blue-300 bg-blue-50 p-8 shadow-[var(--shadow-md)]"
                >
                  <div class="flex flex-col gap-3">
                    <p class="brand-heading text-sm font-medium text-blue-900">Loading metrics</p>
                    <p class="text-sm leading-6 text-blue-800">
                      Fetching metrics data for the selected company...
                    </p>
                  </div>
                </section>
              `}
      </main>
    `;
  }
}

if (!customElements.get("company-summary")) {
  customElements.define("company-summary", CompanySummary);
}

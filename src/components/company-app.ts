import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import {
  buildMetricsUrl,
  buildEventsUrl,
  createCompany,
  defaultCompanies,
  deleteCompany,
  getSelectedCompany,
  loadCompanies,
  saveCompanies,
  upsertCompany,
} from "../lib/company-store";
import {
  cacheMetrics,
  getCachedMetrics,
  cacheEvents,
  getCachedEvents,
  clearAllCaches,
} from "../lib/metrics-cache";
import "./company-dialog";
import "./company-header";
import "./company-summary";
import "./companies-table";
import "./connection-result-dialog";
import "./metrics-charts";
import "./selected-company-card";
import "./date-range-selector";
import "./space-selector";

type ConnectionResult = {
  status: number;
  ok: boolean;
  message?: string;
  data?: unknown;
  url?: string;
  headers?: Record<string, string>;
};

type ModelMetric = {
  model: string;
  totalLines: number;
  events: number;
  creditsUsed: number;
};

type ProjectMetric = {
  projectName: string;
  totalLines: number;
  creditsUsed: number;
};

export class CompanyApp extends LitElement {
  static properties = {
    companies: { attribute: false },
    selectedCompanyId: { attribute: false },
    dialogOpen: { type: Boolean, attribute: false },
    dialogCompany: { attribute: false },
    connectionResult: { attribute: false },
    resultDialogOpen: { type: Boolean, attribute: false },
    metricsData: { attribute: false },
    metricsError: { attribute: false },
    selectedMonth: { type: Number, attribute: false },
    selectedYear: { type: Number, attribute: false },
    selectedSpaceId: { attribute: false },
    isFetchingUncachedMetrics: { type: Boolean, attribute: false },
    modelMetrics: { attribute: false },
    projectMetrics: { attribute: false },
  };

  declare companies: CompanyConfig[];
  declare selectedCompanyId: string;
  declare dialogOpen: boolean;
  declare dialogCompany: CompanyConfig | null;
  declare connectionResult: ConnectionResult | null;
  declare resultDialogOpen: boolean;
  declare metricsData: unknown[] | null;
  declare metricsError: string | null;
  declare selectedMonth: number;
  declare selectedYear: number;
  declare selectedSpaceId: string;
  declare isFetchingUncachedMetrics: boolean;
  declare modelMetrics: ModelMetric[] | null;
  declare projectMetrics: ProjectMetric[] | null;

  constructor() {
    super();
    this.companies = [...defaultCompanies];
    // Try to load saved company ID from localStorage, otherwise use first company
    const savedCompanyId = this.getSelectedCompanyIdFromStorage();
    this.selectedCompanyId = savedCompanyId || this.companies[0]?.id || defaultCompanies[0].id;
    this.dialogOpen = false;
    this.dialogCompany = null;
    this.connectionResult = null;
    this.resultDialogOpen = false;
    this.metricsData = null;
    this.metricsError = null;
    this.selectedSpaceId = "all";
    this.isFetchingUncachedMetrics = false;
    this.modelMetrics = null;
    this.projectMetrics = null;
    const today = new Date();
    this.selectedMonth = today.getMonth();
    this.selectedYear = today.getFullYear();
  }

  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    void this.initializeApp();
  }

  private async initializeApp() {
    await this.restoreCompanies();
    await this.fetchMetrics();
    await this.fetchEventsData();
  }

  private get selectedCompany() {
    return getSelectedCompany(this.companies, this.selectedCompanyId);
  }

  private get filteredMetricsData() {
    if (!this.metricsData || !Array.isArray(this.metricsData)) {
      return this.metricsData;
    }

    // If "All Spaces" is selected, return all data
    if (this.selectedSpaceId === "all") {
      return this.metricsData;
    }

    // Filter data to only include the selected space
    const mapped = this.metricsData.map((item: any) => {
      const spaces = item.metrics?.spaces || [];
      const hasSelectedSpace = spaces.some((space: any) => space.id === this.selectedSpaceId);

      if (!hasSelectedSpace) {
        return null;
      }

      return item;
    });
    return mapped.filter((item: any) => item !== null);
  }

  private async restoreCompanies() {
    const companies = await loadCompanies();

    this.companies = companies;
    // Load saved company ID from localStorage, or use first company in list
    const savedCompanyId = this.getSelectedCompanyIdFromStorage();
    const initialCompanyId = savedCompanyId || companies[0]?.id || defaultCompanies[0].id;

    // Verify the selected company exists in the loaded companies list
    this.selectedCompanyId = getSelectedCompany(companies, initialCompanyId).id;
    this.saveSelectedCompanyIdToStorage(this.selectedCompanyId);
  }

  private async persistCompanies() {
    await saveCompanies(this.companies);
  }

  private getSelectedCompanyIdFromStorage(): string | null {
    try {
      return window.localStorage.getItem("selectedCompanyId");
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  }

  private saveSelectedCompanyIdToStorage(companyId: string): void {
    try {
      window.localStorage.setItem("selectedCompanyId", companyId);
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }

  private handleCompanyChange = (event: CustomEvent<{ companyId: string }>) => {
    this.selectedCompanyId = event.detail.companyId;
    this.saveSelectedCompanyIdToStorage(this.selectedCompanyId);
    void this.fetchMetrics();
    void this.fetchEventsData();
  };

  private handleDateChange = (event: CustomEvent<{ month: number; year: number }>) => {
    this.selectedMonth = event.detail.month;
    this.selectedYear = event.detail.year;
    void this.fetchMetrics();
    void this.fetchEventsData();
  };

  private handleSpaceChange = (event: CustomEvent<{ spaceId: string }>) => {
    this.selectedSpaceId = event.detail.spaceId;
  };

  private handleRefresh = async () => {
    console.log("Clearing caches and refreshing data...");
    await clearAllCaches();
    void this.fetchMetrics();
    void this.fetchEventsData();
  };

  private getUniqueSpaces(): Array<{ id: string; name: string }> {
    if (!this.metricsData || !Array.isArray(this.metricsData)) {
      return [];
    }

    const spaceMap = new Map<string, string>();
    const data = this.metricsData as any[];

    data.forEach((item) => {
      const spaces = item.metrics?.spaces;
      if (Array.isArray(spaces)) {
        spaces.forEach((space) => {
          if (space?.id && space?.name) {
            spaceMap.set(space.id, space.name);
          }
        });
      }
    });

    const arr: Array<{ id: string; name: string }> = [];
    spaceMap.forEach((name, id) => {
      arr.push({ id, name });
    });

    return arr;
  }

  private getMetricsDateRange() {
    // Get the first and last day of the selected month
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

  private normalizeSpaces(dataArray: any[]): any[] {
    return dataArray.map((item: any) => {
      const metrics = item.metrics || item;

      // Extract spaceIds and normalize spaces format
      let spaceIds: string[] = [];
      let spaces: Array<{
        id: string;
        name: string;
        totalLines?: number;
        events?: number;
        creditsUsed?: number;
      }> = [];

      const rawSpaces = Array.isArray(metrics.spaces) ? metrics.spaces : [];
      if (rawSpaces.length > 0) {
        // API returns spaces with spaceId and spaceName
        spaceIds = rawSpaces.map((space: any) => space.spaceId).filter(Boolean);
        spaces = rawSpaces
          .map((space: any) => ({
            id: space.spaceId,
            name: space.spaceName,
            totalLines: space.totalLines,
            events: space.events,
            creditsUsed: space.creditsUsed,
          }))
          .filter(
            (space: {
              id: string;
              name: string;
              totalLines?: number;
              events?: number;
              creditsUsed?: number;
            }) => space.id && space.name,
          );
      }

      // Extract and normalize models from metadata
      let models: Array<{
        model: string;
        tokensUsed: number;
        creditsUsed: number;
        linesOfCode: number;
      }> = [];

      const toNumber = (val: any): number => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };

      // Check if there's metadata with model information
      if (metrics.metadata && metrics.metadata.model) {
        models.push({
          model: metrics.metadata.model,
          tokensUsed: toNumber(metrics.metadata.tokensUsed),
          creditsUsed: toNumber(metrics.metadata.creditsUsed),
          linesOfCode: toNumber(metrics.metadata.linesOfCode),
        });
      }

      return {
        period: item.period || item.date || "",
        metrics: {
          ...metrics,
          userPrompts: toNumber(metrics.userPrompts),
          totalLines: toNumber(metrics.totalLines || metrics.linesAccepted),
          creditsUsed: toNumber(metrics.creditsUsed),
          designsExported: toNumber(metrics.designExports ?? metrics.designsExported),
          prsMerged: toNumber(metrics.prsMerged),
          events: toNumber(metrics.events),
          users: toNumber(metrics.users),
          spaceIds: spaceIds,
          spaces: spaces,
          models: models,
        },
      };
    });
  }

  private transformMetricsData(dataArray: any[]): any[] {
    const firstItem = dataArray[0];

    // Check if already in correct format
    if (firstItem.period && firstItem.metrics) {
      // Still need to normalize spaces to extract spaceIds
      return this.normalizeSpaces(dataArray);
    }

    // Transform to correct format
    const transformedData = dataArray.map((item: any) => {
      const metrics = item.metrics || item;
      const toNumber = (val: any): number => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };

      return {
        period: item.period || item.date || "",
        metrics: {
          userPrompts: toNumber(metrics.userPrompts),
          totalLines: toNumber(metrics.totalLines || metrics.linesAccepted),
          creditsUsed: toNumber(metrics.creditsUsed),
          designsExported: toNumber(metrics.designExports ?? metrics.designsExported),
          prsMerged: toNumber(metrics.prsMerged),
          events: toNumber(metrics.events),
          users: toNumber(metrics.users),
          spaces: metrics.spaces || [],
          metadata: metrics.metadata || {},
        },
      };
    });

    // Normalize spaces in all items (extract spaceIds from space objects)
    return this.normalizeSpaces(transformedData);
  }

  private async fetchEventsData() {
    const company = this.selectedCompany;

    if (!company.privateKey) {
      console.log("Skipping events fetch - no private key");
      this.modelMetrics = null;
      this.projectMetrics = null;
      return;
    }

    const { startDate, endDate } = this.getMetricsDateRange();

    // Check cache first
    const cachedEvents = await getCachedEvents(
      company.publicKey,
      company.privateKey,
      startDate,
      endDate,
    );

    let allEvents: any[] = [];

    if (cachedEvents && Array.isArray(cachedEvents)) {
      console.log("Using cached events data");
      allEvents = cachedEvents;
    } else {
      // Fetch all events with pagination
      let hasMore = true;
      let page = 1;
      const limit = 1000;

      console.log("Fetching events data with pagination");

      const maxPages = 10; // Limit to 10 pages (10,000 events) to avoid excessive API calls
      while (hasMore && page <= maxPages) {
        try {
          const url = buildEventsUrl(startDate, endDate, page, limit);
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${company.privateKey}`,
          };

          const response = await fetch(url, {
            method: "GET",
            headers: headers,
          });

          if (!response.ok) {
            console.error("Failed to fetch events, stopping pagination:", response.status);
            break;
          }

          const data = await response.json();
          const events = data.data || [];
          allEvents = allEvents.concat(events);

          const pagination = data.pagination || {};
          hasMore = pagination.hasNext ?? false;
          page += 1;

          console.log(`Fetched page ${page - 1}, total events so far: ${allEvents.length}`);
          if (page > maxPages) {
            console.warn(`Reached maximum page limit (${maxPages}), stopping pagination`);
          }
        } catch (error) {
          console.error("Error fetching events page:", error);
          break;
        }
      }

      if (allEvents.length === 0) {
        console.warn("No events found for the selected date range");
      }

      // Cache the events
      if (allEvents.length > 0) {
        await cacheEvents(company.publicKey, company.privateKey, startDate, endDate, allEvents);
      }
    }

    // Aggregate models and projects from events
    const modelMap = new Map<
      string,
      {
        model: string;
        totalLines: number;
        events: number;
        creditsUsed: number;
      }
    >();
    const projectMap = new Map<
      string,
      {
        projectName: string;
        totalLines: number;
        creditsUsed: number;
      }
    >();

    allEvents.forEach((event: any) => {
      const metadata = event.metadata;
      if (!metadata) return;

      if (metadata.model) {
        const model = metadata.model;
        if (!modelMap.has(model)) {
          modelMap.set(model, {
            model,
            totalLines: 0,
            events: 0,
            creditsUsed: 0,
          });
        }
        const modelData = modelMap.get(model)!;
        modelData.totalLines += Number(metadata.linesOfCode) || 0;
        modelData.events += 1;
        modelData.creditsUsed += Number(metadata.creditsUsed) || 0;
      }

      const projectName = String(metadata.projectName || event.projectName || "Unknown");
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, {
          projectName,
          totalLines: 0,
          creditsUsed: 0,
        });
      }
      const projectData = projectMap.get(projectName)!;
      projectData.totalLines += Number(metadata.linesOfCode) || 0;
      projectData.creditsUsed += Number(metadata.creditsUsed) || 0;
    });

    this.modelMetrics = Array.from(modelMap.values()).sort((a, b) => b.creditsUsed - a.creditsUsed);
    this.projectMetrics = Array.from(projectMap.values()).sort(
      (a, b) => b.creditsUsed - a.creditsUsed,
    );
    console.log("Aggregated model metrics:", this.modelMetrics);
    console.log("Aggregated project metrics:", this.projectMetrics);
  }

  private async fetchMetrics() {
    const company = this.selectedCompany;

    if (!company.privateKey) {
      this.isFetchingUncachedMetrics = false;
      this.metricsError = "Private key is required to fetch metrics";
      this.metricsData = null;
      return;
    }

    const { startDate, endDate } = this.getMetricsDateRange();

    // Check cache first
    const cachedData = await getCachedMetrics(
      company.publicKey,
      company.privateKey,
      startDate,
      endDate,
    );

    if (cachedData) {
      this.isFetchingUncachedMetrics = false;
      console.log("Using cached metrics data");
      try {
        const transformedData = this.transformMetricsData(cachedData);
        this.metricsData = transformedData;
        this.metricsError = null;
      } catch (error) {
        console.error("Error processing cached metrics:", error);
        this.metricsError = "Failed to process cached metrics";
      }
      return;
    }

    this.isFetchingUncachedMetrics = true;

    const url = buildMetricsUrl(startDate, endDate);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${company.privateKey}`,
    };

    try {
      console.log("Fetching fresh metrics from:", url.toString());
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData && typeof errorData === "object" && "message" in errorData
            ? String((errorData as { message?: unknown }).message)
            : `Request failed with status ${response.status}`;
        console.error("API Error:", message);
        this.metricsError = message;
        this.metricsData = null;
        return;
      }

      const data = await response.json();
      console.log("Raw metrics API response:", JSON.stringify(data, null, 2));
      console.log("Response type:", typeof data, "Is array:", Array.isArray(data));

      // Log first item structure for debugging
      const firstDataItem = Array.isArray(data) ? data[0] : data.data?.[0];
      if (firstDataItem) {
        console.log("First item keys:", Object.keys(firstDataItem));
        const spaceIds = firstDataItem.spaceIds || firstDataItem.metrics?.spaceIds || "NOT FOUND";
        console.log("First item spaceIds field:", spaceIds);
      }

      if (!data) {
        this.metricsError = "No data returned from API";
        this.metricsData = null;
        return;
      }

      // Handle different response formats
      let dataArray: any[] = [];

      if (Array.isArray(data)) {
        dataArray = data;
        console.log("Data is an array with", data.length, "items");
      } else if (data.data && Array.isArray(data.data)) {
        dataArray = data.data;
        console.log("Data wrapped in .data property, found", dataArray.length, "items");
      } else {
        console.error("Unexpected data format:", data);
        this.metricsError = `Unexpected API response format. Check browser console for details.`;
        this.metricsData = null;
        return;
      }

      if (dataArray.length === 0) {
        this.metricsError = "No metrics data available for the selected period";
        this.metricsData = null;
        return;
      }

      try {
        const transformedData = this.transformMetricsData(dataArray);

        console.log("Transformed metrics:", transformedData);

        // Cache the original data
        await cacheMetrics(company.publicKey, company.privateKey, startDate, endDate, dataArray);

        this.metricsData = transformedData;
        this.metricsError = null;
      } catch (transformError) {
        console.error("Error transforming metrics:", transformError);
        const errMsg = transformError instanceof Error ? transformError.message : "unknown error";
        this.metricsError = `Failed to process metrics data: ${errMsg}`;
        this.metricsData = null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Metrics fetch failed:", message, error);
      this.metricsError = `Failed to fetch metrics: ${message}`;
      this.metricsData = null;
    } finally {
      this.isFetchingUncachedMetrics = false;
    }
  }

  private openDialog = () => {
    this.dialogCompany = { ...this.selectedCompany };
    this.dialogOpen = true;
    this.connectionResult = null;
    this.metricsError = null;
  };

  private addCompany = () => {
    this.dialogCompany = createCompany();
    this.dialogOpen = true;
    this.connectionResult = null;
    this.metricsError = null;
  };

  private closeDialog = () => {
    this.dialogOpen = false;
    this.dialogCompany = null;
  };

  private saveCompany = async (event: CustomEvent<{ company: CompanyConfig }>) => {
    const updatedCompany = event.detail.company;

    this.companies = upsertCompany(this.companies, updatedCompany);
    this.selectedCompanyId = updatedCompany.id;
    this.saveSelectedCompanyIdToStorage(this.selectedCompanyId);
    await this.persistCompanies();
    this.metricsError = null;
    this.closeDialog();
  };

  private connectCompany = async (event: CustomEvent<{ company: CompanyConfig }>) => {
    const updatedCompany = event.detail.company;

    this.companies = upsertCompany(this.companies, updatedCompany);
    this.selectedCompanyId = updatedCompany.id;
    this.saveSelectedCompanyIdToStorage(this.selectedCompanyId);
    await this.persistCompanies();

    if (!updatedCompany.privateKey) {
      this.connectionResult = {
        status: 0,
        ok: false,
        message: "Private key is required to connect.",
      };
      this.resultDialogOpen = true;
      return;
    }

    const { startDate, endDate } = this.getMetricsDateRange();
    const url = buildMetricsUrl(startDate, endDate);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${updatedCompany.privateKey}`,
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      const data = await response.json().catch(() => null);

      this.connectionResult = {
        status: response.status,
        ok: response.ok,
        message: response.ok
          ? "Connection successful"
          : data && typeof data === "object" && "message" in data
            ? String((data as { message?: unknown }).message)
            : `Request failed with status ${response.status}`,
        data: data,
        url: url.toString(),
        headers: headers,
      };

      this.resultDialogOpen = true;
      if (response.ok && Array.isArray(data)) {
        // Cache the metrics
        const { startDate, endDate } = this.getMetricsDateRange();
        await cacheMetrics(
          updatedCompany.publicKey,
          updatedCompany.privateKey,
          startDate,
          endDate,
          data,
        );
        const transformedData = this.transformMetricsData(data);
        this.metricsData = transformedData;
        await this.fetchEventsData();
        setTimeout(() => this.closeDialog(), 1000);
      }
    } catch (error) {
      this.connectionResult = {
        status: 0,
        ok: false,
        message: error instanceof Error ? error.message : "Connection error",
        url: url.toString(),
        headers: headers,
      };
      this.resultDialogOpen = true;
    }
  };

  private removeCompany = async (event: CustomEvent<{ companyId: string }>) => {
    const companyId = event.detail.companyId;

    this.companies = deleteCompany(this.companies, companyId);
    await this.persistCompanies();

    // If the deleted company was selected, select another one
    if (this.selectedCompanyId === companyId) {
      this.selectedCompanyId = this.companies[0]?.id ?? defaultCompanies[0].id;
      this.saveSelectedCompanyIdToStorage(this.selectedCompanyId);
    }

    this.closeDialog();
  };

  private closeResultDialog = () => {
    this.resultDialogOpen = false;
  };

  render() {
    return html`
      <div class="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text-primary)]">
        <company-header
          .companies=${this.companies}
          .selectedCompanyId=${this.selectedCompanyId}
          @company-change=${this.handleCompanyChange}
          @add-company=${this.addCompany}
          @edit-company=${this.openDialog}
          @refresh-data=${this.handleRefresh}
        ></company-header>

        <company-summary
          .company=${this.selectedCompany}
          .metricsData=${this.filteredMetricsData}
          .metricsError=${this.metricsError}
          .selectedMonth=${this.selectedMonth}
          .selectedYear=${this.selectedYear}
          .spaces=${this.getUniqueSpaces()}
          .selectedSpaceId=${this.selectedSpaceId}
          .modelMetrics=${this.modelMetrics}
          .projectMetrics=${this.projectMetrics}
          @date-change=${this.handleDateChange}
          @space-change=${this.handleSpaceChange}
        ></company-summary>

        <company-dialog
          .company=${this.dialogCompany ?? this.selectedCompany}
          .open=${this.dialogOpen}
          @close-company-dialog=${this.closeDialog}
          @save-company=${this.saveCompany}
          @connect-company=${this.connectCompany}
          @delete-company=${this.removeCompany}
        ></company-dialog>

        ${this.isFetchingUncachedMetrics
          ? html`
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div
                  class="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]"
                >
                  <div
                    class="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border-subtle)] border-t-[var(--color-brand)]"
                  ></div>
                  <p class="text-sm font-medium text-[var(--color-text-secondary)]">
                    Loading metrics...
                  </p>
                </div>
              </div>
            `
          : ""}

        <connection-result-dialog
          .result=${this.connectionResult}
          .open=${this.resultDialogOpen}
          @close-result-dialog=${this.closeResultDialog}
        ></connection-result-dialog>
      </div>
    `;
  }
}

if (!customElements.get("company-app")) {
  customElements.define("company-app", CompanyApp);
}

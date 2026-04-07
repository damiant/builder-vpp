import { LitElement, html } from "lit";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { CompanyConfig } from "../lib/company-store";
import {
  buildMetricsUrl,
  buildEventsUrl,
  buildProjectsUrl,
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
  cacheProjects,
  getCachedProjects,
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

type FeatureMetric = {
  feature: string;
  totalLines: number;
  events: number;
  creditsUsed: number;
};

type UserModelMetric = {
  userEmail: string;
  totalCreditsUsed: number;
  models: Array<{
    model: string;
    totalLines: number;
    events: number;
    creditsUsed: number;
  }>;
};

type DesignVsPromptMetric = {
  type: "Design" | "Prompt";
  count: number;
  creditsUsed: number;
  uniqueDesigns: number;
};

type DesignRecord = {
  userEmail: string;
  timestamp: string;
  earliestTimestamp?: string;
  creditsUsed: number;
  tokensUsed: number;
  model: string;
};

type DesignMetric = {
  designDocumentId: string;
  records: DesignRecord[];
};

type ProjectApiData = {
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
    isFetchingEventPages: { type: Boolean, attribute: false },
    currentEventPage: { type: Number, attribute: false },
    totalEventPages: { type: Number, attribute: false },
    isExportingPdf: { type: Boolean, attribute: false },
    isExportingPng: { type: Boolean, attribute: false },
    isExportingCsv: { type: Boolean, attribute: false },
    isExportingHtml: { type: Boolean, attribute: false },
    modelMetrics: { attribute: false },
    projectMetrics: { attribute: false },
    featureMetrics: { attribute: false },
    userModelMetrics: { attribute: false },
    designVsPromptMetrics: { attribute: false },
    designMetrics: { attribute: false },
    eventsData: { attribute: false },
    projectsApiData: { attribute: false },
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
  declare isFetchingEventPages: boolean;
  declare currentEventPage: number;
  declare totalEventPages: number;
  declare isExportingPdf: boolean;
  declare isExportingPng: boolean;
  declare isExportingCsv: boolean;
  declare isExportingHtml: boolean;
  declare modelMetrics: ModelMetric[] | null;
  declare projectMetrics: ProjectMetric[] | null;
  declare featureMetrics: FeatureMetric[] | null;
  declare userModelMetrics: UserModelMetric[] | null;
  declare designVsPromptMetrics: DesignVsPromptMetric[] | null;
  declare designMetrics: DesignMetric[] | null;
  declare eventsData: any[] | null;
  declare projectsApiData: ProjectApiData[] | null;

  private eventsFetchRequestId = 0;

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
    this.isFetchingEventPages = false;
    this.currentEventPage = 1;
    this.totalEventPages = 1;
    this.isExportingPdf = false;
    this.isExportingPng = false;
    this.isExportingCsv = false;
    this.isExportingHtml = false;
    this.modelMetrics = null;
    this.projectMetrics = null;
    this.featureMetrics = null;
    this.userModelMetrics = null;
    this.designVsPromptMetrics = null;
    this.designMetrics = null;
    this.eventsData = null;
    this.projectsApiData = null;
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
    await this.fetchProjectsData();
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
    void this.fetchProjectsData();
  };

  private handleDateChange = (event: CustomEvent<{ month: number; year: number }>) => {
    console.log("Date changed to:", event.detail.month, event.detail.year);
    this.selectedMonth = event.detail.month;
    this.selectedYear = event.detail.year;
    void this.fetchMetrics();
    void this.fetchEventsData();
    void this.fetchProjectsData();
  };

  private handleSpaceChange = (event: CustomEvent<{ spaceId: string }>) => {
    this.selectedSpaceId = event.detail.spaceId;
  };

  private handleRefresh = async () => {
    console.log("Clearing caches and refreshing data...");
    await clearAllCaches();
    void this.fetchMetrics();
    void this.fetchEventsData();
    void this.fetchProjectsData();
  };

  private handleExportPdf = async () => {
    if (this.isExportingPdf || this.isExportingPng) return;

    const exportRoot = this.querySelector<HTMLElement>("company-summary main");
    if (!exportRoot) {
      console.error("Unable to find page content for PDF export");
      return;
    }

    this.isExportingPdf = true;
    const previousScrollX = window.scrollX;
    const previousScrollY = window.scrollY;

    try {
      await this.updateComplete;
      await customElements.whenDefined("company-summary");
      await document.fonts.ready;
      window.scrollTo(0, 0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const companyName = this.selectedCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const month = String(this.selectedMonth + 1).padStart(2, "0");
      const filename = `fusion-metrics-${companyName}-${this.selectedYear}-${month}.pdf`;
      const margin = 24;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const availableWidth = pageWidth - margin * 2;
      const contentWidth = Math.max(exportRoot.scrollWidth, exportRoot.clientWidth);

      await new Promise<void>((resolve, reject) => {
        pdf
          .html(exportRoot, {
            margin,
            width: availableWidth,
            windowWidth: contentWidth,
            autoPaging: "text",
            html2canvas: {
              backgroundColor: "#ffffff",
              scale: 0.45,
              useCORS: true,
              scrollX: 0,
              scrollY: 0,
              windowWidth: contentWidth,
            },
            callback: (doc) => {
              doc.save(filename);
              resolve();
            },
          })
          .catch(reject);
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      window.scrollTo(previousScrollX, previousScrollY);
      this.isExportingPdf = false;
    }
  };

  private handleExportPng = async () => {
    if (this.isExportingPng || this.isExportingPdf) return;

    const exportRoot = this.querySelector<HTMLElement>("company-summary main");
    if (!exportRoot) {
      console.error("Unable to find page content for PNG export");
      return;
    }

    this.isExportingPng = true;

    try {
      await this.updateComplete;
      await customElements.whenDefined("company-summary");
      await document.fonts.ready;

      const companyName = this.selectedCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const month = String(this.selectedMonth + 1).padStart(2, "0");
      const filename = `fusion-metrics-${companyName}-${this.selectedYear}-${month}.png`;
      const contentWidth = Math.max(exportRoot.scrollWidth, exportRoot.clientWidth);
      const dataUrl = await toPng(exportRoot, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 2,
        canvasWidth: contentWidth,
        width: contentWidth,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting PNG:", error);
    } finally {
      this.isExportingPng = false;
    }
  };

  private handleExportCsv = async () => {
    if (this.isExportingCsv || this.isExportingPdf || this.isExportingPng) return;

    this.isExportingCsv = true;

    try {
      if (!this.eventsData || this.eventsData.length === 0) {
        console.warn("No events data available for export");
        alert("No events data available to export");
        return;
      }

      // Generate CSV content
      const csv = this.generateCsvContent(this.eventsData);

      // Create download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Generate filename with company name, month, and year
      const companyName = this.selectedCompany.name.replace(/[^a-zA-Z0-9 ]/g, "");
      const monthName = new Date(this.selectedYear, this.selectedMonth).toLocaleDateString(
        "en-US",
        { month: "long" },
      );
      const filename = `${companyName}-${monthName}-${this.selectedYear}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV");
    } finally {
      this.isExportingCsv = false;
    }
  };

  private handleExportHtml = async () => {
    if (this.isExportingHtml || this.isExportingPdf || this.isExportingPng || this.isExportingCsv)
      return;

    const exportRoot = this.querySelector<HTMLElement>("company-summary main");
    if (!exportRoot) {
      console.error("Unable to find page content for HTML export");
      return;
    }

    this.isExportingHtml = true;

    try {
      await this.updateComplete;
      await customElements.whenDefined("company-summary");
      await document.fonts.ready;

      // Clone the export root to avoid modifying the original
      const clonedContent = exportRoot.cloneNode(true) as HTMLElement;

      // Collect all CSS from stylesheets
      let cssContent = "";

      // Get CSS from all stylesheets
      for (const stylesheet of document.styleSheets) {
        try {
          // Skip stylesheets from different origins
          if (stylesheet.href && new URL(stylesheet.href).origin !== window.location.origin) {
            continue;
          }

          if (stylesheet.cssRules) {
            for (const rule of stylesheet.cssRules) {
              cssContent += rule.cssText + "\n";
            }
          }
        } catch {
          // Skip stylesheets we can't access
          continue;
        }
      }

      // Get inline styles from all elements
      const allElements = clonedContent.querySelectorAll("*");
      let inlineStylesContent = "";

      allElements.forEach((el) => {
        if (el.hasAttribute("style")) {
          const elementClass = el.className || `element-${Math.random().toString(36).slice(2, 9)}`;
          if (!el.className) {
            el.className = elementClass;
          }
          inlineStylesContent += `.${el.className} { ${el.getAttribute("style")} }\n`;
        }
      });

      // Create the HTML document
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fusion Metrics - ${this.selectedCompany.name}</title>
  <style>
    ${cssContent}
    ${inlineStylesContent}
  </style>
</head>
<body>
  ${clonedContent.outerHTML}
</body>
</html>`;

      // Create download link
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const companyName = this.selectedCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const month = String(this.selectedMonth + 1).padStart(2, "0");
      const filename = `fusion-metrics-${companyName}-${this.selectedYear}-${month}.html`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting HTML:", error);
    } finally {
      this.isExportingHtml = false;
    }
  };

  private generateCsvContent(events: any[]): string {
    // CSV headers
    const headers = [
      "timestamp",
      "userEmail",
      "spaceName",
      "spaceId",
      "projectName",
      "designExportId",
      "creditsUsed",
      "linesOfCode",
      "feature",
      "model",
    ];

    // Helper function to escape CSV values
    const escapeCsvValue = (value: unknown): string => {
      if (value === null || value === undefined) {
        return "";
      }
      let str: string;
      if (typeof value === "string") {
        str = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        str = String(value);
      } else {
        str = JSON.stringify(value);
      }
      // If the value contains comma, newline, or double quote, wrap in double quotes and escape double quotes
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Convert events to CSV rows
    const rows = events.map((event: any) => {
      const metadata = event.metadata || {};
      return [
        escapeCsvValue(event.timestamp || ""),
        escapeCsvValue(event.userEmail || metadata.userEmail || ""),
        escapeCsvValue(event.spaceName || metadata.spaceName || ""),
        escapeCsvValue(event.spaceId || metadata.spaceId || ""),
        escapeCsvValue(event.projectName || metadata.projectName || ""),
        escapeCsvValue(event.designExportId || metadata.designExportId || ""),
        escapeCsvValue(event.creditsUsed || metadata.creditsUsed || ""),
        escapeCsvValue(event.linesOfCode || metadata.linesOfCode || ""),
        escapeCsvValue(event.feature || metadata.feature || ""),
        escapeCsvValue(event.model || metadata.model || ""),
      ].join(",");
    });

    // Combine headers and rows
    return [headers.join(","), ...rows].join("\n");
  }

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
          prsCreated: toNumber(metrics.prsCreated),
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
          prsCreated: toNumber(metrics.prsCreated),
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
    const requestId = ++this.eventsFetchRequestId;
    const isLatestRequest = () => requestId === this.eventsFetchRequestId;
    const company = this.selectedCompany;

    if (!company.privateKey) {
      if (!isLatestRequest()) {
        return;
      }

      console.log("Skipping events fetch - no private key");
      this.isFetchingEventPages = false;
      this.currentEventPage = 1;
      this.totalEventPages = 1;
      this.eventsData = null;
      this.modelMetrics = null;
      this.projectMetrics = null;
      this.featureMetrics = null;
      this.userModelMetrics = null;
      this.designVsPromptMetrics = null;
      this.designMetrics = null;
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

    if (!isLatestRequest()) {
      return;
    }

    let allEvents: any[] = [];

    if (cachedEvents && Array.isArray(cachedEvents)) {
      console.log("Using cached events data");
      allEvents = cachedEvents;
      this.eventsData = allEvents;
      this.isFetchingEventPages = false;
      this.currentEventPage = 1;
      this.totalEventPages = 1;
    } else {
      // Fetch all events with concurrent pagination (8 at a time)
      const limit = 1000;
      const concurrency = 8;

      console.log("Fetching events data with pagination");
      this.isFetchingEventPages = true;
      this.currentEventPage = 1;
      this.totalEventPages = 1;

      // Fetch first page to get total pages
      try {
        if (!isLatestRequest()) {
          return;
        }

        const firstPageUrl = buildEventsUrl(startDate, endDate, 1, limit);
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${company.privateKey}`,
        };

        const firstResponse = await fetch(firstPageUrl, {
          method: "GET",
          headers: headers,
        });

        if (!isLatestRequest()) {
          return;
        }

        if (!firstResponse.ok) {
          console.error("Failed to fetch first page of events:", firstResponse.status);
          this.isFetchingEventPages = false;
          this.currentEventPage = 1;
          this.totalEventPages = 1;
          return;
        }

        const firstData = await firstResponse.json();
        const firstPageEvents = firstData.data || [];
        allEvents = allEvents.concat(firstPageEvents);

        const pagination = firstData.pagination || {};
        const totalPages = Number(pagination.totalPages) || 1;
        this.totalEventPages = totalPages;

        console.log(
          `Fetched page 1, total pages: ${totalPages}, total events so far: ${allEvents.length}`,
        );

        // Fetch remaining pages in batches of 4
        if (totalPages > 1) {
          for (let batchStart = 2; batchStart <= totalPages; batchStart += concurrency) {
            if (!isLatestRequest()) {
              return;
            }

            // Create batch of up to 4 page requests
            const batchEnd = Math.min(batchStart + concurrency - 1, totalPages);
            const pagePromises = [];

            for (let page = batchStart; page <= batchEnd; page++) {
              const pageUrl = buildEventsUrl(startDate, endDate, page, limit);
              pagePromises.push(
                fetch(pageUrl, {
                  method: "GET",
                  headers: headers,
                }).then((response) => {
                  if (!response.ok) {
                    console.error(`Failed to fetch page ${page}:`, response.status);
                    return null;
                  }
                  return response.json();
                }),
              );
            }

            // Wait for all requests in this batch to complete
            const batchResults = await Promise.all(pagePromises);

            if (!isLatestRequest()) {
              return;
            }

            // Process batch results
            for (const data of batchResults) {
              if (data) {
                const events = data.data || [];
                allEvents = allEvents.concat(events);
              }
            }

            this.currentEventPage = Math.min(batchEnd, totalPages);
            console.log(
              `Fetched pages ${batchStart}-${batchEnd}, total events so far: ${allEvents.length}`,
            );
          }
        }

        this.isFetchingEventPages = false;
        this.currentEventPage = 1;
      } catch (error) {
        console.error("Error fetching events:", error);
        this.isFetchingEventPages = false;
        this.currentEventPage = 1;
        this.totalEventPages = 1;
      }

      if (!isLatestRequest()) {
        return;
      }

      if (allEvents.length === 0) {
        console.warn("No events found for the selected date range");
      }

      // Cache events (including empty arrays) so empty periods don't re-fetch every time
      await cacheEvents(company.publicKey, company.privateKey, startDate, endDate, allEvents);
    }

    if (!isLatestRequest()) {
      return;
    }

    // Store events data for export
    this.eventsData = allEvents;

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
    const featureMap = new Map<
      string,
      {
        feature: string;
        totalLines: number;
        events: number;
        creditsUsed: number;
      }
    >();
    const userModelMap = new Map<
      string,
      {
        userEmail: string;
        totalCreditsUsed: number;
        models: Map<
          string,
          {
            model: string;
            totalLines: number;
            events: number;
            creditsUsed: number;
          }
        >;
      }
    >();

    allEvents.forEach((event: any) => {
      const metadata = event.metadata || {};
      const creditsUsed = Number(metadata.creditsUsed ?? event.creditsUsed) || 0;
      const totalLines = Number(metadata.linesOfCode ?? event.linesOfCode) || 0;
      const model = metadata.model || event.model;

      if (model) {
        if (!modelMap.has(model)) {
          modelMap.set(model, {
            model,
            totalLines: 0,
            events: 0,
            creditsUsed: 0,
          });
        }
        const modelData = modelMap.get(model)!;
        modelData.totalLines += totalLines;
        modelData.events += 1;
        modelData.creditsUsed += creditsUsed;
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
      projectData.totalLines += totalLines;
      projectData.creditsUsed += creditsUsed;

      const feature = String(event.feature || metadata.feature || "Unknown");
      if (!featureMap.has(feature)) {
        featureMap.set(feature, {
          feature,
          totalLines: 0,
          events: 0,
          creditsUsed: 0,
        });
      }
      const featureData = featureMap.get(feature)!;
      featureData.totalLines += totalLines;
      featureData.events += 1;
      featureData.creditsUsed += creditsUsed;

      const userEmail = String(
        event.userEmail || metadata.userEmail || event.userId || metadata.userId || "Unknown",
      );
      const modelName = String(model || "Unknown");
      if (!userModelMap.has(userEmail)) {
        userModelMap.set(userEmail, {
          userEmail,
          totalCreditsUsed: 0,
          models: new Map(),
        });
      }
      const userData = userModelMap.get(userEmail)!;
      userData.totalCreditsUsed += creditsUsed;

      if (!userData.models.has(modelName)) {
        userData.models.set(modelName, {
          model: modelName,
          totalLines: 0,
          events: 0,
          creditsUsed: 0,
        });
      }
      const userModelData = userData.models.get(modelName)!;
      userModelData.totalLines += totalLines;
      userModelData.events += 1;
      userModelData.creditsUsed += creditsUsed;
    });

    this.modelMetrics = Array.from(modelMap.values()).sort((a, b) => b.creditsUsed - a.creditsUsed);
    this.projectMetrics = Array.from(projectMap.values()).sort(
      (a, b) => b.creditsUsed - a.creditsUsed,
    );
    this.featureMetrics = Array.from(featureMap.values()).sort(
      (a, b) => b.creditsUsed - a.creditsUsed,
    );
    this.userModelMetrics = Array.from(userModelMap.values())
      .map((user) => ({
        userEmail: user.userEmail,
        totalCreditsUsed: user.totalCreditsUsed,
        models: Array.from(user.models.values()).sort((a, b) => b.creditsUsed - a.creditsUsed),
      }))
      .sort((a, b) => a.userEmail.localeCompare(b.userEmail));

    // Calculate Design vs Prompt metrics
    let designCount = 0;
    let designCreditsUsed = 0;
    let promptCount = 0;
    let promptCreditsUsed = 0;
    const designUniqueIds = new Set<string>();

    allEvents.forEach((event: any) => {
      const creditsUsed = Number(event.metadata?.creditsUsed ?? event.creditsUsed) || 0;
      const designExportId = event.designExportId || event.metadata?.designExportId;

      if (designExportId) {
        designCount += 1;
        designCreditsUsed += creditsUsed;
        designUniqueIds.add(String(designExportId));
      } else {
        promptCount += 1;
        promptCreditsUsed += creditsUsed;
      }
    });

    this.designVsPromptMetrics = [
      {
        type: "Design",
        count: designCount,
        creditsUsed: designCreditsUsed,
        uniqueDesigns: designUniqueIds.size,
      },
      {
        type: "Prompt",
        count: promptCount,
        creditsUsed: promptCreditsUsed,
        uniqueDesigns: 0,
      },
    ];

    // Aggregate design metrics
    const designMap = new Map<string, DesignRecord[]>();

    allEvents.forEach((event: any) => {
      const designExportId = event.designExportId || event.metadata?.designExportId;

      if (designExportId) {
        const creditsUsed = Number(event.metadata?.creditsUsed ?? event.creditsUsed) || 0;
        const tokensUsed = Number(event.metadata?.tokensUsed ?? event.tokensUsed) || 0;
        const model = event.metadata?.model || event.model || "Unknown";
        const userEmail = String(
          event.userEmail ||
            event.metadata?.userEmail ||
            event.userId ||
            event.metadata?.userId ||
            "Unknown",
        );
        const timestamp = event.timestamp || new Date().toISOString();

        if (!designMap.has(designExportId)) {
          designMap.set(designExportId, []);
        }

        designMap.get(designExportId)!.push({
          userEmail,
          timestamp,
          creditsUsed,
          tokensUsed,
          model,
        });
      }
    });

    // Group records within 5-minute windows for same user and model
    const groupRecordsByWindow = (records: DesignRecord[]): DesignRecord[] => {
      // Sort by timestamp ascending
      const sortedRecords = records.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const groupedRecords: DesignRecord[] = [];
      const fiveMinutesInMs = 5 * 60 * 1000;

      for (const record of sortedRecords) {
        // Find if there's a recent group for the same user and model
        const lastMatchingGroup = groupedRecords.reverse().find((r) => {
          if (r.userEmail !== record.userEmail || r.model !== record.model) {
            return false;
          }
          const timeDiff = new Date(record.timestamp).getTime() - new Date(r.timestamp).getTime();
          return timeDiff <= fiveMinutesInMs;
        });
        groupedRecords.reverse();

        if (lastMatchingGroup) {
          // Combine with existing group
          lastMatchingGroup.creditsUsed += record.creditsUsed;
          lastMatchingGroup.tokensUsed += record.tokensUsed;
          // Update timestamp to the latest one
          lastMatchingGroup.timestamp = record.timestamp;
          // Ensure earliestTimestamp is set (use the group's timestamp if not already set)
          if (!lastMatchingGroup.earliestTimestamp) {
            lastMatchingGroup.earliestTimestamp = lastMatchingGroup.timestamp;
          }
        } else {
          // Add as new record
          const newRecord: DesignRecord = { ...record };
          newRecord.earliestTimestamp = record.timestamp;
          groupedRecords.push(newRecord);
        }
      }

      return groupedRecords;
    };

    this.designMetrics = Array.from(designMap.entries())
      .map(([designDocumentId, records]) => ({
        designDocumentId,
        records: groupRecordsByWindow(records).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      }))
      .sort((a, b) => b.records.length - a.records.length);

    console.log("Aggregated model metrics:", this.modelMetrics);
    console.log("Aggregated project metrics:", this.projectMetrics);
    console.log("Aggregated feature metrics:", this.featureMetrics);
    console.log("Aggregated user model metrics:", this.userModelMetrics);
    console.log("Design vs Prompt metrics:", this.designVsPromptMetrics);
    console.log("Design metrics:", this.designMetrics);
  }

  private async fetchProjectsData() {
    const company = this.selectedCompany;

    if (!company.privateKey) {
      console.log("Skipping projects fetch - no private key");
      this.projectsApiData = null;
      return;
    }

    const { startDate, endDate } = this.getMetricsDateRange();

    // Check cache first
    const cachedData = await getCachedProjects(
      company.publicKey,
      company.privateKey,
      startDate,
      endDate,
    );

    if (cachedData) {
      console.log("Using cached projects data");
      this.projectsApiData = (cachedData as ProjectApiData[]) || null;
      return;
    }

    const url = buildProjectsUrl(startDate, endDate);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${company.privateKey}`,
    };

    try {
      console.log("Fetching projects data from:", url.toString());
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        console.error("Failed to fetch projects data:", response.status);
        this.projectsApiData = null;
        return;
      }

      const responseData = await response.json();
      const projectsArray = Array.isArray(responseData) ? responseData : responseData.data || [];

      await cacheProjects(company.publicKey, company.privateKey, startDate, endDate, projectsArray);

      this.projectsApiData = projectsArray;
      console.log("Projects data fetched and cached:", projectsArray);
    } catch (error) {
      console.error("Error fetching projects data:", error);
      this.projectsApiData = null;
    }
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

      // Cache the original data (including empty arrays) so subsequent calls are fast
      await cacheMetrics(company.publicKey, company.privateKey, startDate, endDate, dataArray);

      if (dataArray.length === 0) {
        this.metricsError = "No metrics data available for the selected period";
        this.metricsData = null;
        return;
      }

      try {
        const transformedData = this.transformMetricsData(dataArray);

        console.log("Transformed metrics:", transformedData);

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
      if (response.ok) {
        const metricsArray = Array.isArray(data)
          ? data
          : data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)
            ? (data as { data: unknown[] }).data
            : null;

        if (metricsArray) {
          // Cache the metrics
          const { startDate, endDate } = this.getMetricsDateRange();
          await cacheMetrics(
            updatedCompany.publicKey,
            updatedCompany.privateKey,
            startDate,
            endDate,
            metricsArray,
          );
          const transformedData = this.transformMetricsData(metricsArray as any[]);
          this.metricsData = transformedData;
          await this.fetchEventsData();
          setTimeout(() => this.closeDialog(), 1000);
        }
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
          .isExportingPdf=${this.isExportingPdf}
          .isExportingPng=${this.isExportingPng}
          .isExportingCsv=${this.isExportingCsv}
          .isExportingHtml=${this.isExportingHtml}
          @company-change=${this.handleCompanyChange}
          @add-company=${this.addCompany}
          @edit-company=${this.openDialog}
          @export-png=${this.handleExportPng}
          @export-pdf=${this.handleExportPdf}
          @export-csv=${this.handleExportCsv}
          @export-html=${this.handleExportHtml}
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
          .featureMetrics=${this.featureMetrics}
          .userModelMetrics=${this.userModelMetrics}
          .designVsPromptMetrics=${this.designVsPromptMetrics}
          .designMetrics=${this.designMetrics}
          .projectsApiData=${this.projectsApiData}
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

        ${this.isFetchingUncachedMetrics || this.isFetchingEventPages
          ? html`
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div
                  class="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]"
                >
                  <div
                    class="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border-subtle)] border-t-[var(--color-brand)]"
                  ></div>
                  <p class="text-sm font-medium text-[var(--color-text-secondary)]">
                    ${this.isFetchingEventPages
                      ? `reading page ${this.currentEventPage} of ${this.totalEventPages}`
                      : "Loading metrics..."}
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

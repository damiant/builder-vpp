import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import {
  buildMetricsUrl,
  createCompany,
  defaultCompanies,
  deleteCompany,
  getSelectedCompany,
  loadCompanies,
  saveCompanies,
  upsertCompany,
} from "../lib/company-store";
import "./company-dialog";
import "./company-header";
import "./company-summary";
import "./companies-table";
import "./connection-result-dialog";
import "./metrics-charts";
import "./selected-company-card";
import "./date-range-selector";

type ConnectionResult = {
  status: number;
  ok: boolean;
  message?: string;
  data?: unknown;
  url?: string;
  headers?: Record<string, string>;
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

  constructor() {
    super();
    this.companies = [...defaultCompanies];
    this.selectedCompanyId = this.companies[0]?.id ?? defaultCompanies[0].id;
    this.dialogOpen = false;
    this.dialogCompany = null;
    this.connectionResult = null;
    this.resultDialogOpen = false;
    this.metricsData = null;
    this.metricsError = null;
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
  }

  private get selectedCompany() {
    return getSelectedCompany(this.companies, this.selectedCompanyId);
  }

  private async restoreCompanies() {
    const companies = await loadCompanies();

    this.companies = companies;
    this.selectedCompanyId = getSelectedCompany(companies, this.selectedCompanyId).id;
  }

  private async persistCompanies() {
    await saveCompanies(this.companies);
  }

  private handleCompanyChange = (event: CustomEvent<{ companyId: string }>) => {
    this.selectedCompanyId = event.detail.companyId;
    void this.fetchMetrics();
  };

  private handleDateChange = (event: CustomEvent<{ month: number; year: number }>) => {
    this.selectedMonth = event.detail.month;
    this.selectedYear = event.detail.year;
    void this.fetchMetrics();
  };

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

  private async fetchMetrics() {
    const company = this.selectedCompany;

    if (!company.privateKey) {
      this.metricsError = "Private key is required to fetch metrics";
      this.metricsData = null;
      return;
    }

    const { startDate, endDate } = this.getMetricsDateRange();
    const url = buildMetricsUrl(startDate, endDate);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${company.privateKey}`,
    };

    try {
      console.log("Fetching metrics from:", url.toString());
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
        const firstItem = dataArray[0];
        console.log("First item structure:", firstItem);

        // Check if already in correct format
        if (firstItem.period && firstItem.metrics) {
          console.log("Data is already in correct format");
          this.metricsData = dataArray;
          this.metricsError = null;
          return;
        }

        // Transform to correct format
        const transformedData = dataArray.map((item: any) => {
          const metrics = item.metrics || item;
          const toNumber = (val: any): number => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
          };
          const transformed = {
            period: item.period || item.date || "",
            metrics: {
              userPrompts: toNumber(metrics.userPrompts),
              totalLines: toNumber(metrics.totalLines || metrics.linesAccepted),
              creditsUsed: toNumber(metrics.creditsUsed),
              designsExported: toNumber(metrics.designsExported),
              prsMerged: toNumber(metrics.prsMerged),
            },
          };
          return transformed;
        });

        console.log("Transformed metrics:", transformedData);
        this.metricsData = transformedData;
        this.metricsError = null;
      } catch (transformError) {
        console.error("Error transforming metrics:", transformError);
        this.metricsError = `Failed to process metrics data: ${transformError instanceof Error ? transformError.message : "unknown error"}`;
        this.metricsData = null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Metrics fetch failed:", message, error);
      this.metricsError = `Failed to fetch metrics: ${message}`;
      this.metricsData = null;
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
    await this.persistCompanies();
    this.metricsError = null;
    this.closeDialog();
  };

  private connectCompany = async (event: CustomEvent<{ company: CompanyConfig }>) => {
    const updatedCompany = event.detail.company;

    this.companies = upsertCompany(this.companies, updatedCompany);
    this.selectedCompanyId = updatedCompany.id;
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
        this.metricsData = data;
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
        ></company-header>

        <company-summary
          .company=${this.selectedCompany}
          .metricsData=${this.metricsData}
          .metricsError=${this.metricsError}
          .selectedMonth=${this.selectedMonth}
          .selectedYear=${this.selectedYear}
          @date-change=${this.handleDateChange}
        ></company-summary>

        <company-dialog
          .company=${this.dialogCompany ?? this.selectedCompany}
          .open=${this.dialogOpen}
          @close-company-dialog=${this.closeDialog}
          @save-company=${this.saveCompany}
          @connect-company=${this.connectCompany}
          @delete-company=${this.removeCompany}
        ></company-dialog>

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

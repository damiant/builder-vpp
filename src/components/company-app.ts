import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import {
  buildMetricsUrl,
  createCompany,
  defaultCompanies,
  deleteCompany,
  getMetricsDates,
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
  };

  declare companies: CompanyConfig[];
  declare selectedCompanyId: string;
  declare dialogOpen: boolean;
  declare dialogCompany: CompanyConfig | null;
  declare connectionResult: ConnectionResult | null;
  declare resultDialogOpen: boolean;
  declare metricsData: unknown[] | null;

  constructor() {
    super();
    this.companies = [...defaultCompanies];
    this.selectedCompanyId = this.companies[0]?.id ?? defaultCompanies[0].id;
    this.dialogOpen = false;
    this.dialogCompany = null;
    this.connectionResult = null;
    this.resultDialogOpen = false;
    this.metricsData = null;
  }

  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    void this.restoreCompanies();
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
  };

  private openDialog = () => {
    this.dialogCompany = { ...this.selectedCompany };
    this.dialogOpen = true;
    this.connectionResult = null;
  };

  private addCompany = () => {
    this.dialogCompany = createCompany();
    this.dialogOpen = true;
    this.connectionResult = null;
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

    const { startDate, endDate } = getMetricsDates();
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
        message: response.ok ? "Connection successful" : (
          data && typeof data === "object" && "message" in data
            ? String((data as { message?: unknown }).message)
            : `Request failed with status ${response.status}`
        ),
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

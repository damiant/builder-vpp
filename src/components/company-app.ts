import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import {
  buildMetricsUrl,
  defaultCompanies,
  getMetricsDates,
  getSelectedCompany,
  loadCompanies,
  saveCompanies,
} from "../lib/company-store";
import "./company-dialog";
import "./company-header";
import "./company-summary";

export class CompanyApp extends LitElement {
  static properties = {
    companies: { attribute: false },
    selectedCompanyId: { attribute: false },
    dialogOpen: { type: Boolean, attribute: false },
  };

  declare companies: CompanyConfig[];
  declare selectedCompanyId: string;
  declare dialogOpen: boolean;

  constructor() {
    super();
    this.companies = loadCompanies();
    this.selectedCompanyId = this.companies[0]?.id ?? defaultCompanies[0].id;
    this.dialogOpen = false;
  }

  createRenderRoot() {
    return this;
  }

  private get selectedCompany() {
    return getSelectedCompany(this.companies, this.selectedCompanyId);
  }

  private handleCompanyChange = (event: CustomEvent<{ companyId: string }>) => {
    this.selectedCompanyId = event.detail.companyId;
  };

  private openDialog = () => {
    this.dialogOpen = true;
  };

  private closeDialog = () => {
    this.dialogOpen = false;
  };

  private saveCompany = (event: CustomEvent<{ company: CompanyConfig }>) => {
    const updatedCompany = event.detail.company;

    this.companies = this.companies.map((company) =>
      company.id === updatedCompany.id ? updatedCompany : company,
    );
    saveCompanies(this.companies);
    this.selectedCompanyId = updatedCompany.id;
    this.dialogOpen = false;
  };

  private connectCompany = async (event: CustomEvent<{ company: CompanyConfig }>) => {
    const updatedCompany = event.detail.company;

    this.companies = this.companies.map((company) =>
      company.id === updatedCompany.id ? updatedCompany : company,
    );
    saveCompanies(this.companies);
    this.selectedCompanyId = updatedCompany.id;

    if (!updatedCompany.privateKey) {
      console.error("Private key is required to connect.");
      return;
    }

    const { startDate, endDate } = getMetricsDates();
    const url = buildMetricsUrl(startDate, endDate);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${updatedCompany.privateKey}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          result && typeof result === "object" && "message" in result
            ? String((result as { message?: unknown }).message)
            : `Request failed with status ${response.status}`;

        console.error(`Connection failed: ${message}`);
        return;
      }

      console.log(result);
      this.dialogOpen = false;
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    return html`
      <div class="min-h-screen bg-slate-50 text-slate-900">
        <company-header
          .companies=${this.companies}
          .selectedCompanyId=${this.selectedCompanyId}
          @company-change=${this.handleCompanyChange}
          @edit-company=${this.openDialog}
        ></company-header>

        <company-summary .company=${this.selectedCompany}></company-summary>

        <company-dialog
          .company=${this.selectedCompany}
          .open=${this.dialogOpen}
          @close-company-dialog=${this.closeDialog}
          @save-company=${this.saveCompany}
          @connect-company=${this.connectCompany}
        ></company-dialog>
      </div>
    `;
  }
}

if (!customElements.get("company-app")) {
  customElements.define("company-app", CompanyApp);
}

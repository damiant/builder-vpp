import { LitElement, html } from "lit";
import type { CompanyConfig } from "../lib/company-store";
import {
  buildMetricsUrl,
  createCompany,
  defaultCompanies,
  getMetricsDates,
  getSelectedCompany,
  loadCompanies,
  saveCompanies,
  upsertCompany,
} from "../lib/company-store";
import "./company-dialog";
import "./company-header";
import "./company-summary";

export class CompanyApp extends LitElement {
  static properties = {
    companies: { attribute: false },
    selectedCompanyId: { attribute: false },
    dialogOpen: { type: Boolean, attribute: false },
    dialogCompany: { attribute: false },
  };

  declare companies: CompanyConfig[];
  declare selectedCompanyId: string;
  declare dialogOpen: boolean;
  declare dialogCompany: CompanyConfig | null;

  constructor() {
    super();
    this.companies = [...defaultCompanies];
    this.selectedCompanyId = this.companies[0]?.id ?? defaultCompanies[0].id;
    this.dialogOpen = false;
    this.dialogCompany = null;
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
  };

  private addCompany = () => {
    this.dialogCompany = createCompany();
    this.dialogOpen = true;
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
      this.closeDialog();
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
          @add-company=${this.addCompany}
          @edit-company=${this.openDialog}
        ></company-header>

        <company-summary .company=${this.selectedCompany}></company-summary>

        <company-dialog
          .company=${this.dialogCompany ?? this.selectedCompany}
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

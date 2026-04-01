import { get, set } from "idb-keyval";

export type CompanyConfig = {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
};

export const storageKey = "builder-company-configs";

export const defaultCompanies: CompanyConfig[] = [
  {
    id: "company",
    name: "Company",
    publicKey: "",
    privateKey: "",
  },
];

export async function loadCompanies() {
  try {
    const storedValue = await get<CompanyConfig[]>(storageKey);

    if (!Array.isArray(storedValue) || storedValue.length === 0) {
      return [...defaultCompanies];
    }

    return storedValue;
  } catch {
    return [...defaultCompanies];
  }
}

export async function saveCompanies(companies: CompanyConfig[]) {
  await set(storageKey, companies);
}

export function getSelectedCompany(companies: CompanyConfig[], selectedCompanyId: string) {
  return (
    companies.find((company) => company.id === selectedCompanyId) ??
    companies[0] ??
    defaultCompanies[0]
  );
}

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMetricsDates() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 30);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

export function maskSecret(value: string) {
  if (!value) {
    return "Not set";
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}••••${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function buildMetricsUrl(startDate: string, endDate: string) {
  const url = new URL("https://cdn.builder.io/api/v1/orgs/fusion/metrics");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  return url;
}

export function buildUsersUrl(startDate: string, endDate: string) {
  const url = new URL("https://cdn.builder.io/api/v1/orgs/fusion/users");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  return url;
}

export function buildEventsUrl(
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 1000,
) {
  const url = new URL("https://cdn.builder.io/api/v1/orgs/fusion/events");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  return url;
}

export function createCompany(name = "") {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `company-${Date.now()}`,
    name,
    publicKey: "",
    privateKey: "",
  };
}

export function upsertCompany(companies: CompanyConfig[], updatedCompany: CompanyConfig) {
  const companyExists = companies.some((company) => company.id === updatedCompany.id);

  if (companyExists) {
    return companies.map((company) =>
      company.id === updatedCompany.id ? updatedCompany : company,
    );
  }

  return [...companies, updatedCompany];
}

export function deleteCompany(companies: CompanyConfig[], companyId: string) {
  return companies.filter((company) => company.id !== companyId);
}

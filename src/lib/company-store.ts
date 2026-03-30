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

export function loadCompanies() {
  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return [...defaultCompanies];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as CompanyConfig[];

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return [...defaultCompanies];
    }

    return parsedValue;
  } catch {
    return [...defaultCompanies];
  }
}

export function saveCompanies(companies: CompanyConfig[]) {
  localStorage.setItem(storageKey, JSON.stringify(companies));
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
  const url = new URL("https://builder.io/api/v1/orgs/fusion/metrics");
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  return url;
}

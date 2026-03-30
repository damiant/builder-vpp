import "./style.css";

type CompanyConfig = {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
};

const storageKey = "builder-company-configs";
const app = document.querySelector<HTMLDivElement>("#app")!;

const defaultCompanies: CompanyConfig[] = [
  {
    id: "company",
    name: "Company",
    publicKey: "",
    privateKey: "",
  },
];

let companies = loadCompanies();
let selectedCompanyId = companies[0]?.id ?? defaultCompanies[0].id;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadCompanies() {
  const storedValue = localStorage.getItem(storageKey);

  if (!storedValue) {
    return defaultCompanies;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as CompanyConfig[];

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return defaultCompanies;
    }

    return parsedValue;
  } catch {
    return defaultCompanies;
  }
}

function saveCompanies() {
  localStorage.setItem(storageKey, JSON.stringify(companies));
}

function getSelectedCompany() {
  return (
    companies.find((company) => company.id === selectedCompanyId) ??
    companies[0] ??
    defaultCompanies[0]
  );
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMetricsDates() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 30);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

function maskSecret(value: string) {
  if (!value) {
    return "Not set";
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}••••${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function render() {
  const selectedCompany = getSelectedCompany();

  app.innerHTML = `
    <div class="min-h-screen bg-slate-50 text-slate-900">
      <header class="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Fusion metrics</p>
            <h1 class="mt-1 text-xl font-semibold text-slate-900">Company connection</h1>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>Company</span>
              <select id="company-select" class="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
                ${companies
                  .map(
                    (company) => `
                      <option value="${escapeHtml(company.id)}" ${company.id === selectedCompanyId ? "selected" : ""}>
                        ${escapeHtml(company.name)}
                      </option>
                    `,
                  )
                  .join("")}
              </select>
            </label>

            <button
              id="edit-company"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
            >
              Edit
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto flex max-w-6xl flex-1 items-center px-6 py-12">
        <section class="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="flex flex-col gap-3 border-b border-slate-100 pb-6">
            <p class="text-sm font-medium text-violet-600">Connected company</p>
            <h2 class="text-3xl font-semibold tracking-tight text-slate-900">${escapeHtml(selectedCompany.name)}</h2>
            <p class="max-w-2xl text-sm leading-6 text-slate-600">
              Save the company name, public key, and private key in the dialog. The connect action uses the private key from
              <code class="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-medium text-slate-800">metrics.md</code>
              and requests the last 30 days of metrics.
            </p>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company name</p>
              <p class="mt-2 text-sm font-medium text-slate-900">${escapeHtml(selectedCompany.name)}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Public key</p>
              <p class="mt-2 text-sm font-medium text-slate-900">${escapeHtml(maskSecret(selectedCompany.publicKey))}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Private key</p>
              <p class="mt-2 text-sm font-medium text-slate-900">${escapeHtml(maskSecret(selectedCompany.privateKey))}</p>
            </div>
          </div>

          <div class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span class="font-medium text-slate-900">Connect endpoint:</span>
            <span class="ml-1 break-all">https://cdn.builder.io/api/v1/orgs/fusion/metrics</span>
          </div>
        </section>
      </main>

      <dialog
        id="company-dialog"
        class="w-[min(92vw,36rem)] rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50"
      >
        <div class="p-6 sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Company settings</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Edit company</h2>
            </div>
            <button
              id="close-company-dialog"
              type="button"
              class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <div class="mt-6 grid gap-4">
            <label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Company name</span>
              <input
                id="company-name"
                class="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                type="text"
                placeholder="Enter company name"
              />
            </label>

            <label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Public Key</span>
              <input
                id="company-public-key"
                class="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                type="text"
                placeholder="Enter public key"
              />
            </label>

            <label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Private Key</span>
              <input
                id="company-private-key"
                class="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                type="password"
                placeholder="Enter private key"
              />
            </label>
          </div>

          <p class="mt-4 text-xs leading-5 text-slate-500">
            The private key is sent as the Bearer token in the Authorization header, matching the Fusion Metrics API docs.
          </p>

          <div class="mt-8 flex flex-wrap justify-end gap-3">
            <button
              id="cancel-company"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="save-company"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Save
            </button>
            <button
              id="connect-company"
              type="button"
              class="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Connect
            </button>
          </div>
        </div>
      </dialog>
    </div>
  `;

  const companySelect = document.querySelector<HTMLSelectElement>("#company-select");
  const editCompanyButton = document.querySelector<HTMLButtonElement>("#edit-company");
  const dialog = document.querySelector<HTMLDialogElement>("#company-dialog");
  const closeDialogButton = document.querySelector<HTMLButtonElement>("#close-company-dialog");
  const cancelButton = document.querySelector<HTMLButtonElement>("#cancel-company");
  const saveButton = document.querySelector<HTMLButtonElement>("#save-company");
  const connectButton = document.querySelector<HTMLButtonElement>("#connect-company");
  const companyNameInput = document.querySelector<HTMLInputElement>("#company-name");
  const companyPublicKeyInput = document.querySelector<HTMLInputElement>("#company-public-key");
  const companyPrivateKeyInput = document.querySelector<HTMLInputElement>("#company-private-key");

  companySelect?.addEventListener("change", () => {
    selectedCompanyId = companySelect.value;
    render();
  });

  const openDialog = () => {
    if (!dialog || !companyNameInput || !companyPublicKeyInput || !companyPrivateKeyInput) {
      return;
    }

    const company = getSelectedCompany();
    companyNameInput.value = company.name;
    companyPublicKeyInput.value = company.publicKey;
    companyPrivateKeyInput.value = company.privateKey;
    dialog.showModal();
    companyNameInput.focus();
  };

  const closeDialog = () => {
    dialog?.close();
  };

  editCompanyButton?.addEventListener("click", openDialog);
  closeDialogButton?.addEventListener("click", closeDialog);
  cancelButton?.addEventListener("click", closeDialog);

  saveButton?.addEventListener("click", () => {
    if (!companyNameInput || !companyPublicKeyInput || !companyPrivateKeyInput) {
      return;
    }

    const company = getSelectedCompany();
    const updatedCompany = {
      ...company,
      name: companyNameInput.value.trim() || "Company",
      publicKey: companyPublicKeyInput.value.trim(),
      privateKey: companyPrivateKeyInput.value.trim(),
    };

    companies = companies.map((entry) => (entry.id === company.id ? updatedCompany : entry));
    saveCompanies();
    selectedCompanyId = updatedCompany.id;
    closeDialog();
    render();
  });

  connectButton?.addEventListener("click", async () => {
    if (!companyNameInput || !companyPublicKeyInput || !companyPrivateKeyInput) {
      return;
    }

    const company = getSelectedCompany();
    const updatedCompany = {
      ...company,
      name: companyNameInput.value.trim() || "Company",
      publicKey: companyPublicKeyInput.value.trim(),
      privateKey: companyPrivateKeyInput.value.trim(),
    };

    companies = companies.map((entry) => (entry.id === company.id ? updatedCompany : entry));
    saveCompanies();
    selectedCompanyId = updatedCompany.id;

    if (!updatedCompany.privateKey) {
      console.error("Private key is required to connect.");
      return;
    }

    const { startDate, endDate } = getMetricsDates();
    const url = new URL("https://cdn.builder.io/api/v1/orgs/fusion/metrics");
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${updatedCompany.privateKey}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        return;
      }

      console.log(result);
      closeDialog();
      render();
    } catch (error) {
      console.error(error);
    }
  });
}

render();

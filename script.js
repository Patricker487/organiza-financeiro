const categoryColors = {
  Alimentação: "#69a87c",
  Moradia: "#e8bd68",
  Transporte: "#a48ad4",
  Saúde: "#e68671",
  Lazer: "#85b8bd",
  Educação: "#d49a62",
  Salário: "#69a87c",
  Vendas: "#85b8bd",
  Outros: "#dce5dc"
};
const categoryIcons = {
  Alimentação: "◒",
  Moradia: "⌂",
  Transporte: "↗",
  Saúde: "✚",
  Lazer: "✳",
  Educação: "▤",
  Salário: "↗",
  Vendas: "◇",
  Outros: "·"
};
const categoryNames = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Salário",
  "Vendas",
  "Outros"
];

function localIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const transactionList = document.querySelector("#transaction-list");
const searchInput = document.querySelector("#search-input");
const modal = document.querySelector("#transaction-modal");
const form = document.querySelector("#transaction-form");
const formError = document.querySelector("#form-error");
let transactions = [];
let activeFilter = "";
let toastTimeout;

async function apiRequest(method, ...arguments_) {
  const api = window.pywebview?.api;
  if (!api || typeof api[method] !== "function") {
    throw new Error("O Organiza precisa ser iniciado pelo aplicativo Python.");
  }
  const result = await api[method](...arguments_);
  if (!result.success) {
    throw new Error(result.error || "Não foi possível concluir a operação.");
  }
  return result.data;
}

function formatCurrency(value) {
  return currency.format(value);
}

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderSummary() {
  const currentMonth = localIsoDate().slice(0, 7);
  const thisMonth = transactions.filter((item) => item.date.startsWith(currentMonth));
  const income = thisMonth.filter((item) => item.type === "Receita").reduce((total, item) => total + item.amount, 0);
  const expenses = thisMonth.filter((item) => item.type === "Despesa").reduce((total, item) => total + item.amount, 0);
  const allIncome = transactions.filter((item) => item.type === "Receita").reduce((total, item) => total + item.amount, 0);
  const allExpenses = transactions.filter((item) => item.type === "Despesa").reduce((total, item) => total + item.amount, 0);

  document.querySelector("#balance-value").textContent = formatCurrency(allIncome - allExpenses);
  document.querySelector("#income-value").textContent = formatCurrency(income);
  document.querySelector("#expense-value").textContent = formatCurrency(expenses);
  document.querySelector("#income-trend").textContent =
    `${thisMonth.filter((item) => item.type === "Receita").length} movimentações`;
  document.querySelector("#expense-trend").textContent =
    `${thisMonth.filter((item) => item.type === "Despesa").length} movimentações`;

  const totalExpenses = transactions
    .filter((item) => item.type === "Despesa")
    .reduce((total, item) => total + item.amount, 0);
  document.querySelector("#donut-total").textContent = formatCurrency(totalExpenses);
}

function renderChart() {
  const container = document.querySelector("#chart-columns");
  const currentDate = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5 + index, 1);
    const key = localIsoDate(date).slice(0, 7);
    const monthlyTransactions = transactions.filter((item) => item.date.startsWith(key));
    return {
      label: monthNames[date.getMonth()],
      income: monthlyTransactions
        .filter((item) => item.type === "Receita")
        .reduce((total, item) => total + item.amount, 0),
      expense: monthlyTransactions
        .filter((item) => item.type === "Despesa")
        .reduce((total, item) => total + item.amount, 0)
    };
  });
  const maxAmount = Math.max(
    8000,
    Math.ceil(Math.max(...months.flatMap((month) => [month.income, month.expense])) / 2000) * 2000
  );
  document.querySelector("#chart-grid").innerHTML = [1, 0.75, 0.5, 0.25, 0]
    .map((ratio) => {
      const value = maxAmount * ratio;
      const label = value === 0
        ? "R$ 0"
        : `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
      return `<span>${label}</span>`;
    }).join("");
  container.innerHTML = months.map((month) => {
    const incomeHeight = `${month.income / maxAmount * 100}%`;
    const expenseHeight = `${month.expense / maxAmount * 100}%`;
    return `<div class="chart-month">
      <div class="chart-bars">
        <span class="chart-bar income-bar" style="height:${incomeHeight}" title="Entradas: ${formatCurrency(month.income)}"></span>
        <span class="chart-bar expense-bar" style="height:${expenseHeight}" title="Saídas: ${formatCurrency(month.expense)}"></span>
      </div>
      <span class="chart-month-label">${month.label}</span>
    </div>`;
  }).join("");
}

function renderCategories() {
  const expenses = transactions.filter((item) => item.type === "Despesa");
  const totals = expenses.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + item.amount;
    return result;
  }, {});
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  let offset = 0;
  const segments = sorted.map(([category, value]) => {
    const start = offset;
    offset += total ? value / total * 100 : 0;
    return `${categoryColors[category] || categoryColors.Outros} ${start}% ${offset}%`;
  });
  if (!segments.length) segments.push(`${categoryColors.Outros} 0% 100%`);
  document.querySelector("#donut-chart").style.background = `conic-gradient(${segments.join(", ")})`;

  const legend = document.querySelector("#category-legend");
  legend.innerHTML = sorted.slice(0, 4).map(([category, value]) => `
    <div class="category-item">
      <i class="category-color" style="background:${categoryColors[category] || categoryColors.Outros}"></i>
      <span>${escapeHtml(category)}</span>
      <span>${total ? Math.round(value / total * 100) : 0}%</span>
    </div>`).join("");
  if (!sorted.length) {
    legend.innerHTML = '<div class="category-item"><span>Sem despesas</span></div>';
  }

  document.querySelector("#category-list").innerHTML = categoryNames.map((category) => {
    const categoryTransactions = transactions.filter((item) => item.category === category);
    const income = categoryTransactions
      .filter((item) => item.type === "Receita")
      .reduce((sum, item) => sum + item.amount, 0);
    const categoryExpenses = categoryTransactions
      .filter((item) => item.type === "Despesa")
      .reduce((sum, item) => sum + item.amount, 0);
    return `<tr>
      <td><span class="category-badge">${escapeHtml(category)}</span></td>
      <td><span class="amount income">${formatCurrency(income)}</span></td>
      <td><span class="amount expense">${formatCurrency(categoryExpenses)}</span></td>
      <td>${categoryTransactions.length}</td>
      <td><button class="text-link category-filter" data-category="${escapeHtml(category)}" type="button">Ver lançamentos</button></td>
    </tr>`;
  }).join("");
}

function renderReports() {
  const monthInput = document.querySelector("#report-month");
  if (!monthInput.value) monthInput.value = localIsoDate().slice(0, 7);
  const selectedMonth = monthInput.value;
  const monthlyTransactions = transactions
    .filter((item) => item.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const income = monthlyTransactions
    .filter((item) => item.type === "Receita")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthlyTransactions
    .filter((item) => item.type === "Despesa")
    .reduce((sum, item) => sum + item.amount, 0);

  document.querySelector("#report-income").textContent = formatCurrency(income);
  document.querySelector("#report-expenses").textContent = formatCurrency(expenses);
  document.querySelector("#report-balance").textContent = formatCurrency(income - expenses);
  document.querySelector("#report-period-title").textContent =
    `Movimentações por categoria — ${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
      .format(new Date(`${selectedMonth}-02T00:00:00`))}`;

  const totalsByCategory = new Map();
  monthlyTransactions.forEach((item) => {
    const totals = totalsByCategory.get(item.category) || { income: 0, expenses: 0, count: 0 };
    totals[item.type === "Receita" ? "income" : "expenses"] += item.amount;
    totals.count += 1;
    totalsByCategory.set(item.category, totals);
  });
  const reportTable = document.querySelector("#report-category-list");
  reportTable.innerHTML = [...totalsByCategory.entries()]
    .sort((a, b) => b[1].expenses - a[1].expenses || a[0].localeCompare(b[0], "pt-BR"))
    .map(([category, totals]) => `
      <tr>
        <td><span class="category-badge">${escapeHtml(category)}</span></td>
        <td><span class="amount income">${formatCurrency(totals.income)}</span></td>
        <td><span class="amount expense">${formatCurrency(totals.expenses)}</span></td>
        <td>${formatCurrency(totals.income - totals.expenses)}</td>
        <td>${totals.count}</td>
      </tr>`).join("");
  const hasTransactions = monthlyTransactions.length > 0;
  document.querySelector("#report-empty").hidden = hasTransactions;
  reportTable.closest("table").hidden = !hasTransactions;
}

function escapeCsv(value) {
  const text = String(value);
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function exportMonthlyReport() {
  const selectedMonth = document.querySelector("#report-month").value;
  const monthlyTransactions = transactions
    .filter((item) => item.date.startsWith(selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  if (!monthlyTransactions.length) {
    showToast("Não há movimentações neste mês para exportar.");
    return;
  }

  const rows = [
    ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"],
    ...monthlyTransactions.map((item) => [
      formatDate(item.date),
      item.description,
      item.category,
      item.type,
      item.amount.toFixed(2).replace(".", ",")
    ])
  ];
  const csv = `\uFEFFsep=;\r\n${rows.map((row) => row.map(escapeCsv).join(";")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-organiza-${selectedMonth}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Relatório CSV exportado.");
}

function renderTransactions() {
  const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filtered = transactions
    .filter((item) => !activeFilter || item.category === activeFilter)
    .filter((item) => `${item.description} ${item.category} ${item.type}`.toLocaleLowerCase("pt-BR").includes(term))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  transactionList.innerHTML = filtered.map((item) => {
    const typeClass = item.type === "Receita" ? "income" : "expense";
    const sign = item.type === "Receita" ? "+" : "−";
    return `<tr>
      <td><div class="transaction-description">
        <span class="transaction-icon ${typeClass}" aria-hidden="true">${categoryIcons[item.category] || categoryIcons.Outros}</span>
        <span><span class="transaction-title">${escapeHtml(item.description)}</span><span class="transaction-subtitle">${escapeHtml(item.type)}</span></span>
      </div></td>
      <td><span class="category-badge">${escapeHtml(item.category)}</span></td>
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td><span class="amount ${typeClass}">${sign} ${formatCurrency(item.amount)}</span></td>
      <td><button class="row-menu" data-delete="${item.id}" type="button" aria-label="Excluir ${escapeHtml(item.description)}">···</button></td>
    </tr>`;
  }).join("");

  document.querySelector("#empty-state").hidden = filtered.length > 0;
  document.querySelector(".table-wrap table").hidden = filtered.length === 0;
}

function render() {
  renderSummary();
  renderChart();
  renderCategories();
  renderReports();
  renderTransactions();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function openModal() {
  form.reset();
  document.querySelector("#transaction-date").value = localIsoDate();
  document.querySelector("#transaction-type").value = "Despesa";
  document.querySelectorAll(".type-option").forEach((button) => {
    button.classList.toggle("selected", button.dataset.type === "Despesa");
  });
  formError.hidden = true;
  modal.hidden = false;
  document.querySelector("#description").focus();
}

function closeModal() {
  modal.hidden = true;
  document.querySelector("#add-transaction").focus();
}

function setActiveNavigation(section) {
  document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === section);
  });
}

function setTodayLabel() {
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  document.querySelector("#today-label").textContent = today.toLocaleUpperCase("pt-BR");
}

document.querySelector("#add-transaction").addEventListener("click", openModal);
document.querySelector(".close-modal").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelectorAll(".type-option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".type-option").forEach((option) => option.classList.toggle("selected", option === button));
    document.querySelector("#transaction-type").value = button.dataset.type;
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const amountText = document.querySelector("#amount").value.trim().replace(/\s/g, "");
  const normalizedAmount = amountText.includes(",")
    ? amountText.replace(/\./g, "").replace(",", ".")
    : amountText;
  const amount = Number(normalizedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    formError.textContent = "Informe um valor válido maior que zero.";
    formError.hidden = false;
    return;
  }

  const date = document.querySelector("#transaction-date").value;
  if (!date || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    formError.textContent = "Informe uma data válida.";
    formError.hidden = false;
    return;
  }

  const transaction = {
    description: document.querySelector("#description").value.trim(),
    category: document.querySelector("#category").value,
    date,
    type: document.querySelector("#transaction-type").value,
    amount: amountText.includes(",") ? amountText : amountText.replace(".", ",")
  };
  if (!transaction.description) {
    formError.textContent = "Informe uma descrição para a movimentação.";
    formError.hidden = false;
    return;
  }

  try {
    const savedTransaction = await apiRequest("create_transaction", transaction);
    transactions.push(savedTransaction);
    render();
    closeModal();
    showToast("Movimentação salva no banco de dados.");
  } catch (error) {
    formError.textContent = error.message;
    formError.hidden = false;
  }
});

transactionList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const transaction = transactions.find((item) => item.id === Number(button.dataset.delete));
  if (!transaction) return;
  button.disabled = true;
  try {
    await apiRequest("delete_transaction", transaction.id);
    transactions = transactions.filter((item) => item.id !== transaction.id);
    render();
    showToast("Movimentação removida do banco de dados.");
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
});

searchInput.addEventListener("input", renderTransactions);

document.querySelectorAll(".nav-link[data-section]").forEach((link) => {
  link.addEventListener("click", () => {
    const section = link.dataset.section;
    if (section === "categorias") {
      activeFilter = "";
      searchInput.value = "";
      renderTransactions();
    }
    document.querySelector(`#${section === "categorias" ? "categorias-detalhe" : section === "relatorios" ? "relatorios-detalhe" : section}`)
      .scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNavigation(section);
  });
});

document.querySelector("#category-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeFilter = button.dataset.category;
  searchInput.value = "";
  renderTransactions();
  document.querySelector("#movimentacoes").scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveNavigation("movimentacoes");
});

document.querySelector("#all-categories").addEventListener("click", () => {
  activeFilter = "";
  searchInput.value = "";
  renderTransactions();
  document.querySelector("#movimentacoes").scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveNavigation("movimentacoes");
});
document.querySelector("#category-more").addEventListener("click", () => {
  document.querySelector("#all-categories").click();
});
document.querySelector("#see-all").addEventListener("click", () => {
  activeFilter = "";
  searchInput.value = "";
  renderTransactions();
  showToast("Exibindo todas as movimentações.");
});
document.querySelector("#period-button").addEventListener("click", () => {
  showToast("O gráfico exibe os últimos seis meses.");
});
document.querySelector("#report-month").addEventListener("change", renderReports);
document.querySelector("#export-report").addEventListener("click", exportMonthlyReport);
document.querySelector("#exit-button").addEventListener("click", async () => {
  try {
    await apiRequest("close_app");
  } catch (error) {
    showToast(error.message);
  }
});

setTodayLabel();
render();
const inicializacaoPython = window.pywebview?.api
  ? Promise.resolve()
  : new Promise((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error("O Organiza precisa ser iniciado pelo aplicativo Python.")),
        15000
      );
      window.addEventListener("pywebviewready", () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });

inicializacaoPython
  .then(() => apiRequest("list_transactions"))
  .then((savedTransactions) => {
    if (!Array.isArray(savedTransactions)) {
      throw new Error("O servidor retornou uma lista de movimentações inválida.");
    }
    transactions = savedTransactions;
    render();
  })
  .catch((error) => {
    showToast(`Não foi possível conectar ao Python: ${error.message}`);
    console.error("Falha ao carregar movimentações do servidor.", error);
  });

import type { AppData, Transaction } from "@/types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function transactionsToCSV(data: AppData, txns: Transaction[]): string {
  const personName = (id: string) => data.people.find((p) => p.id === id)?.name ?? "";
  const accName = (id?: string) => data.accounts.find((a) => a.id === id)?.name ?? "";
  const catName = (id?: string) => data.categories.find((c) => c.id === id)?.name ?? "";
  const header = ["Date", "Type", "Person", "Account", "To Account", "Category", "Amount", "Description", "Tags"];
  const rows = txns.map((t) =>
    [
      t.date,
      t.type,
      personName(t.personId),
      accName(t.accountId),
      accName(t.toAccountId),
      catName(t.categoryId),
      t.amount,
      t.description ?? "",
      t.tags.join("; "),
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function exportCSV(data: AppData, txns: Transaction[], name = "transactions") {
  download(`${name}-${new Date().toISOString().slice(0, 10)}.csv`, transactionsToCSV(data, txns), "text/csv;charset=utf-8;");
}

/** Excel-compatible export: CSV with a .xls extension opens cleanly in Excel/Sheets. */
export function exportExcel(data: AppData, txns: Transaction[], name = "transactions") {
  const tsv = transactionsToCSV(data, txns).replace(/,/g, "\t");
  download(`${name}-${new Date().toISOString().slice(0, 10)}.xls`, tsv, "application/vnd.ms-excel");
}

export function exportJSON(data: AppData) {
  download(`finova-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
}

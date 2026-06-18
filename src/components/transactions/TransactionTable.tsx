import { useStore } from "@/store/useStore";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/currency";
import { fmtDate } from "@/lib/dates";
import type { Transaction } from "@/types";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

const typeMeta = {
  income: { tone: "green" as const, icon: ArrowDownLeft, sign: "+" },
  expense: { tone: "red" as const, icon: ArrowUpRight, sign: "−" },
  transfer: { tone: "blue" as const, icon: ArrowLeftRight, sign: "" },
  adjustment: { tone: "neutral" as const, icon: SlidersHorizontal, sign: "" },
};

export function TransactionTable({ txns }: { txns: Transaction[] }) {
  const { people, accounts, categories, settings } = useStore();
  const openTxModal = useStore((s) => s.openTxModal);

  const person = (id: string) => people.find((p) => p.id === id);
  const acc = (id?: string) => accounts.find((a) => a.id === id);
  const cat = (id?: string) => categories.find((c) => c.id === id);

  if (txns.length === 0) {
    return <div className="grid place-items-center py-16 text-sm text-slate-400">No transactions match these filters.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-400 dark:border-slate-800">
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">Description</th>
            <th className="px-3 py-2.5 font-medium">Category</th>
            <th className="px-3 py-2.5 font-medium">Person</th>
            <th className="px-3 py-2.5 font-medium">Account</th>
            <th className="px-3 py-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {txns.map((t) => {
            const meta = typeMeta[t.type];
            const p = person(t.personId);
            return (
              <tr
                key={t.id}
                onClick={() => openTxModal(t.id)}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">{fmtDate(t.date, "dd MMM")}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                      t.type === "income" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" :
                      t.type === "expense" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" :
                      t.type === "transfer" ? "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400" :
                      "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                      <meta.icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {t.description || (t.type === "transfer" ? `Transfer → ${acc(t.toAccountId)?.name ?? ""}` : meta && cat(t.categoryId)?.name) || "—"}
                      </p>
                      {t.tags.length > 0 && (
                        <p className="truncate text-[11px] text-slate-400">{t.tags.map((x) => `#${x}`).join(" ")}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {t.type === "transfer" ? (
                    <Badge tone="blue">Transfer</Badge>
                  ) : cat(t.categoryId) ? (
                    <Badge tone="neutral">{cat(t.categoryId)!.name}</Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: p?.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{p?.name ?? "—"}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">{acc(t.accountId)?.name ?? "—"}</td>
                <td className={cn("whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums",
                  t.type === "income" ? "text-emerald-600 dark:text-emerald-400" :
                  t.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300")}>
                  {meta.sign}{formatMoney(t.amount, settings.currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

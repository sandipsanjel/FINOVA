import { useStore } from "@/store/useStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { formatMoney } from "@/lib/currency";
import { monthRange } from "@/lib/dates";
import { parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export function Budgets() {
  const data = useStore();
  const addBudget = useStore((s) => s.addBudget);
  const removeBudget = useStore((s) => s.removeBudget);
  const { currency } = data.settings;

  const expenseCats = data.categories.filter((c) => c.type === "expense");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });

  const spentByCat = useMemo(() => {
    const { from, to } = monthRange();
    const map: Record<string, number> = {};
    for (const t of data.transactions) {
      if (t.type !== "expense" || !t.categoryId) continue;
      const d = parseISO(t.date);
      if (d >= from && d <= to) map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
    return map;
  }, [data.transactions]);

  const totalBudget = data.budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = data.budgets.reduce((s, b) => s + (spentByCat[b.categoryId] ?? 0), 0);

  const save = () => {
    if (!form.categoryId || !Number(form.amount)) return;
    addBudget({ categoryId: form.categoryId, amount: Number(form.amount) });
    setForm({ categoryId: "", amount: "" });
    setModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Monthly Budgets</h2>
          <p className="text-sm text-slate-400">
            {formatMoney(totalSpent, currency)} of {formatMoney(totalBudget, currency)} used this month
          </p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> New Budget</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.budgets.map((b) => {
          const cat = data.categories.find((c) => c.id === b.categoryId);
          const spent = spentByCat[b.categoryId] ?? 0;
          const pct = (spent / b.amount) * 100;
          const over = spent > b.amount;
          return (
            <Card key={b.id}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: cat?.color }} />
                  <span className="font-medium">{cat?.name ?? "—"}</span>
                </div>
                <button onClick={() => removeBudget(b.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button>
              </div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-xl font-bold tabular-nums">{formatMoney(spent, currency)}</span>
                <span className="text-xs text-slate-400">of {formatMoney(b.amount, currency)}</span>
              </div>
              <Progress value={pct} color={over ? "#f43f5e" : pct > 80 ? "#f59e0b" : "#10b981"} />
              <div className="mt-2 flex items-center justify-between text-xs">
                <Badge tone={over ? "red" : pct > 80 ? "amber" : "green"}>
                  {over ? `Over by ${formatMoney(spent - b.amount, currency)}` : `${formatMoney(b.amount - spent, currency)} left`}
                </Badge>
                <span className="text-slate-400">{pct.toFixed(0)}%</span>
              </div>
            </Card>
          );
        })}
        {data.budgets.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <p className="py-10 text-center text-sm text-slate-400">No budgets yet. Create one to track spending limits.</p>
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Budget">
        <div className="space-y-4">
          <FormRow label="Category">
            <Select autoFocus value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select…</option>
              {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Monthly limit">
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" onKeyDown={(e) => e.key === "Enter" && save()} />
          </FormRow>
          <div className="flex justify-end"><Button onClick={save}>Create Budget</Button></div>
        </div>
      </Modal>
    </div>
  );
}

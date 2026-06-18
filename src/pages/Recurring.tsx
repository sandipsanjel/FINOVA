import { useStore } from "@/store/useStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { formatMoney } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/dates";
import type { Recurrence, TransactionType } from "@/types";
import { Play, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";

export function Recurring() {
  const data = useStore();
  const addRecurring = useStore((s) => s.addRecurring);
  const removeRecurring = useStore((s) => s.removeRecurring);
  const updateRecurring = useStore((s) => s.updateRecurring);
  const runDue = useStore((s) => s.runDueRecurring);
  const { currency } = data.settings;

  const [modal, setModal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", type: "expense" as TransactionType, amount: "", personId: data.people[0]?.id ?? "",
    accountId: "", categoryId: "", recurrence: "monthly" as Recurrence, startDate: todayISO(),
  });

  const save = () => {
    if (!form.name.trim() || !Number(form.amount) || !form.personId || !form.accountId) return;
    addRecurring({
      name: form.name.trim(), type: form.type, amount: Number(form.amount), personId: form.personId,
      accountId: form.accountId, categoryId: form.categoryId || undefined, tags: [],
      recurrence: form.recurrence, startDate: form.startDate, active: true,
    });
    setForm({ ...form, name: "", amount: "" });
    setModal(false);
  };

  const generate = () => {
    const n = runDue();
    setMsg(n > 0 ? `Generated ${n} transaction${n !== 1 ? "s" : ""} from active rules.` : "No due occurrences — everything is up to date.");
    setTimeout(() => setMsg(null), 4000);
  };

  const ownedAccounts = data.accounts.filter((a) => a.ownerId === form.personId);
  const cats = data.categories.filter((c) => form.type !== "transfer" && c.type === form.type);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recurring Transactions</h2>
          <p className="text-sm text-slate-400">Auto-generate salary, rent, bills and more.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generate}><Play size={15} /> Generate due</Button>
          <Button onClick={() => setModal(true)}><Plus size={16} /> New Rule</Button>
        </div>
      </div>

      {msg && <div className="rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">{msg}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.recurring.map((r) => {
          const cat = data.categories.find((c) => c.id === r.categoryId);
          const person = data.people.find((p) => p.id === r.personId);
          const account = data.accounts.find((a) => a.id === r.accountId);
          return (
            <Card key={r.id}>
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-[11px] capitalize text-slate-400">{r.recurrence} · {person?.name} · {account?.name}</p>
                </div>
                <Badge tone={r.type === "income" ? "green" : r.type === "expense" ? "red" : "blue"} className="capitalize">{r.type}</Badge>
              </div>
              <p className="text-xl font-bold tabular-nums">{formatMoney(r.amount, currency)}</p>
              <p className="text-xs text-slate-400">
                {cat ? cat.name + " · " : ""}since {fmtDate(r.startDate, "dd MMM yyyy")}
                {r.lastRun && ` · last ${fmtDate(r.lastRun, "dd MMM")}`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => updateRecurring(r.id, { active: !r.active })}>
                  <Power size={14} /> {r.active ? "Active" : "Paused"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeRecurring(r.id)}><Trash2 size={15} /></Button>
              </div>
            </Card>
          );
        })}
        {data.recurring.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <p className="py-10 text-center text-sm text-slate-400">No recurring rules yet.</p>
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Recurring Rule">
        <div className="space-y-4">
          <FormRow label="Name"><Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Salary" /></FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType, categoryId: "" })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </FormRow>
            <FormRow label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Person">
              <Select value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value, accountId: "" })}>
                <option value="">Select…</option>
                {data.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormRow>
            <FormRow label="Account">
              <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                <option value="">Select…</option>
                {ownedAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Category">
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Uncategorized</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormRow>
            <FormRow label="Frequency">
              <Select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value as Recurrence })}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </FormRow>
          </div>
          <FormRow label="Start date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FormRow>
          <div className="flex justify-end"><Button onClick={save}>Create Rule</Button></div>
        </div>
      </Modal>
    </div>
  );
}

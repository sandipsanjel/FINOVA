import { useStore } from "@/store/useStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Progress } from "@/components/ui/Progress";
import { FormRow, Input } from "@/components/ui/Field";
import { formatMoney } from "@/lib/currency";
import { fmtDate } from "@/lib/dates";
import { Minus, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";

const COLORS = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ec4899"];

export function Goals() {
  const data = useStore();
  const addGoal = useStore((s) => s.addGoal);
  const removeGoal = useStore((s) => s.removeGoal);
  const contributeGoal = useStore((s) => s.contributeGoal);
  const { currency } = data.settings;

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", savedAmount: "", targetDate: "", color: COLORS[0] });

  const save = () => {
    if (!form.name.trim() || !Number(form.targetAmount)) return;
    addGoal({
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      savedAmount: Number(form.savedAmount) || 0,
      targetDate: form.targetDate || undefined,
      color: form.color,
    });
    setForm({ name: "", targetAmount: "", savedAmount: "", targetDate: "", color: COLORS[0] });
    setModal(false);
  };

  const totalTarget = data.goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = data.goals.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Savings Goals</h2>
          <p className="text-sm text-slate-400">{formatMoney(totalSaved, currency)} saved of {formatMoney(totalTarget, currency)} target</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> New Goal</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.goals.map((g) => {
          const pct = (g.savedAmount / g.targetAmount) * 100;
          const remaining = Math.max(0, g.targetAmount - g.savedAmount);
          return (
            <Card key={g.id}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: g.color }}>
                    <Target size={16} />
                  </span>
                  <div>
                    <p className="font-medium leading-tight">{g.name}</p>
                    {g.targetDate && <p className="text-[11px] text-slate-400">by {fmtDate(g.targetDate)}</p>}
                  </div>
                </div>
                <button onClick={() => removeGoal(g.id)} className="text-slate-400 hover:text-rose-500"><Trash2 size={15} /></button>
              </div>

              <div className="mb-1 flex items-end justify-between">
                <span className="text-xl font-bold tabular-nums">{formatMoney(g.savedAmount, currency)}</span>
                <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
              </div>
              <Progress value={pct} color={g.color} />
              <p className="mt-2 text-xs text-slate-400">{formatMoney(remaining, currency)} to go · target {formatMoney(g.targetAmount, currency)}</p>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { const v = prompt("Add contribution amount:"); if (v) contributeGoal(g.id, Math.abs(Number(v))); }}>
                  <Plus size={14} /> Add
                </Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { const v = prompt("Withdraw amount:"); if (v) contributeGoal(g.id, -Math.abs(Number(v))); }}>
                  <Minus size={14} /> Withdraw
                </Button>
              </div>
            </Card>
          );
        })}
        {data.goals.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <p className="py-10 text-center text-sm text-slate-400">No goals yet. Set a savings target to track progress.</p>
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Savings Goal">
        <div className="space-y-4">
          <FormRow label="Goal name">
            <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Target amount">
              <Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="0" />
            </FormRow>
            <FormRow label="Already saved">
              <Input type="number" value={form.savedAmount} onChange={(e) => setForm({ ...form, savedAmount: e.target.value })} placeholder="0" />
            </FormRow>
          </div>
          <FormRow label="Target date (optional)">
            <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </FormRow>
          <FormRow label="Color">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })} className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-slate-900 ${form.color === c ? "ring-slate-400" : "ring-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </FormRow>
          <div className="flex justify-end"><Button onClick={save}>Create Goal</Button></div>
        </div>
      </Modal>
    </div>
  );
}

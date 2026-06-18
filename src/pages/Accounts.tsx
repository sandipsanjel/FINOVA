import { useStore } from "@/store/useStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { balancesByAccount, netWorth } from "@/lib/analytics";
import { formatMoney } from "@/lib/currency";
import type { AccountType } from "@/types";
import { Landmark, Plus, UserPlus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

const ACCT_TYPES: { id: AccountType; label: string }[] = [
  { id: "bank", label: "Bank" },
  { id: "cash", label: "Cash Wallet" },
  { id: "savings", label: "Savings" },
  { id: "investment", label: "Investment" },
];
const COLORS = ["#10b981", "#3b82f6", "#ec4899", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444"];

export function Accounts() {
  const data = useStore();
  const addPerson = useStore((s) => s.addPerson);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const removeAccount = useStore((s) => s.removeAccount);
  const removePerson = useStore((s) => s.removePerson);

  const balances = useMemo(() => balancesByAccount(data), [data.transactions, data.accounts]);
  const nw = useMemo(() => netWorth(data), [data.transactions, data.accounts]);
  const { currency } = data.settings;

  const [personModal, setPersonModal] = useState(false);
  const [acctModal, setAcctModal] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personColor, setPersonColor] = useState(COLORS[0]);
  const [acct, setAcct] = useState({ name: "", ownerId: "", type: "bank" as AccountType, openingBalance: "", notes: "" });

  const savePerson = () => {
    if (!personName.trim()) return;
    addPerson({ name: personName.trim(), color: personColor });
    setPersonName("");
    setPersonModal(false);
  };

  const saveAccount = () => {
    if (!acct.name.trim() || !acct.ownerId) return;
    addAccount({
      name: acct.name.trim(),
      ownerId: acct.ownerId,
      type: acct.type,
      openingBalance: Number(acct.openingBalance) || 0,
      notes: acct.notes.trim() || undefined,
      active: true,
    });
    setAcct({ name: "", ownerId: "", type: "bank", openingBalance: "", notes: "" });
    setAcctModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Net Worth" value={formatMoney(nw, currency)} icon={Landmark} accent="brand" />
        <StatCard label="Accounts" value={String(data.accounts.length)} icon={Wallet} accent="sky" />
        <StatCard label="Family Members" value={String(data.people.length)} icon={UserPlus} accent="violet" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Family Members & Accounts</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPersonModal(true)}>
            <UserPlus size={15} /> Add Member
          </Button>
          <Button size="sm" onClick={() => { setAcct((a) => ({ ...a, ownerId: data.people[0]?.id ?? "" })); setAcctModal(true); }}>
            <Plus size={15} /> Add Account
          </Button>
        </div>
      </div>

      {data.people.map((person) => {
        const accs = data.accounts.filter((a) => a.ownerId === person.id);
        const personTotal = accs.reduce((s, a) => s + (balances[a.id] ?? 0), 0);
        return (
          <Card key={person.id}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: person.color }}>
                  {person.name.charAt(0)}
                </span>
                <div>
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-xs text-slate-400">{accs.length} account{accs.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{formatMoney(personTotal, currency)}</p>
                <button onClick={() => confirm(`Remove ${person.name} and their accounts?`) && removePerson(person.id)} className="text-[11px] text-rose-500 hover:underline">
                  Remove
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accs.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <Badge tone="neutral" className="mt-1 capitalize">{a.type}</Badge>
                    </div>
                    <button onClick={() => updateAccount(a.id, { active: !a.active })} title="Toggle status">
                      <Badge tone={a.active ? "green" : "neutral"}>{a.active ? "Active" : "Inactive"}</Badge>
                    </button>
                  </div>
                  <p className="mt-3 text-xl font-bold tabular-nums">{formatMoney(balances[a.id] ?? 0, currency)}</p>
                  <p className="text-[11px] text-slate-400">Opening {formatMoney(a.openingBalance, currency)}</p>
                  {a.notes && <p className="mt-2 text-xs text-slate-500">{a.notes}</p>}
                  <button onClick={() => confirm(`Delete account ${a.name}?`) && removeAccount(a.id)} className="mt-2 text-[11px] text-rose-500 hover:underline">
                    Delete account
                  </button>
                </div>
              ))}
              {accs.length === 0 && <p className="text-sm text-slate-400">No accounts for {person.name}.</p>}
            </div>
          </Card>
        );
      })}

      {data.people.length === 0 && (
        <Card>
          <p className="py-10 text-center text-sm text-slate-400">Add a family member to get started.</p>
        </Card>
      )}

      {/* Person modal */}
      <Modal open={personModal} onClose={() => setPersonModal(false)} title="Add Family Member">
        <div className="space-y-4">
          <FormRow label="Name">
            <Input autoFocus value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g. Brother" onKeyDown={(e) => e.key === "Enter" && savePerson()} />
          </FormRow>
          <FormRow label="Color">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setPersonColor(c)} className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-slate-900 ${personColor === c ? "ring-slate-400" : "ring-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </FormRow>
          <div className="flex justify-end"><Button onClick={savePerson}>Add Member</Button></div>
        </div>
      </Modal>

      {/* Account modal */}
      <Modal open={acctModal} onClose={() => setAcctModal(false)} title="Add Account">
        <div className="space-y-4">
          <FormRow label="Account name">
            <Input autoFocus value={acct.name} onChange={(e) => setAcct({ ...acct, name: e.target.value })} placeholder="e.g. Nabil Bank" />
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Owner">
              <Select value={acct.ownerId} onChange={(e) => setAcct({ ...acct, ownerId: e.target.value })}>
                <option value="">Select…</option>
                {data.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormRow>
            <FormRow label="Type">
              <Select value={acct.type} onChange={(e) => setAcct({ ...acct, type: e.target.value as AccountType })}>
                {ACCT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </FormRow>
          </div>
          <FormRow label="Opening balance">
            <Input type="number" value={acct.openingBalance} onChange={(e) => setAcct({ ...acct, openingBalance: e.target.value })} placeholder="0" />
          </FormRow>
          <FormRow label="Notes (optional)">
            <Input value={acct.notes} onChange={(e) => setAcct({ ...acct, notes: e.target.value })} />
          </FormRow>
          <div className="flex justify-end"><Button onClick={saveAccount}>Add Account</Button></div>
        </div>
      </Modal>
    </div>
  );
}

import { useStore } from "@/store/useStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Select, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { todayISO } from "@/lib/dates";
import type { TransactionType } from "@/types";
import { useEffect, useMemo, useState } from "react";

const TYPES: { id: TransactionType; label: string; color: string }[] = [
  { id: "expense", label: "Expense", color: "bg-rose-500" },
  { id: "income", label: "Income", color: "bg-emerald-500" },
  { id: "transfer", label: "Transfer", color: "bg-sky-500" },
  { id: "adjustment", label: "Adjustment", color: "bg-slate-500" },
];

const CAT_COLORS = [
  "#f97316", "#ef4444", "#eab308", "#a855f7", "#ec4899", "#f43f5e",
  "#3b82f6", "#8b5cf6", "#0ea5e9", "#10b981", "#14b8a6", "#d946ef",
];

const blank = {
  type: "expense" as TransactionType,
  date: todayISO(),
  amount: "",
  personId: "",
  accountId: "",
  toAccountId: "",
  categoryId: "",
  description: "",
  tags: "",
};

export function TransactionModal() {
  const { people, accounts, categories } = useStore();
  const open = useStore((s) => s.ui.txModalOpen);
  const editingId = useStore((s) => s.ui.editingTxId);
  const close = useStore((s) => s.closeTxModal);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const removeTransaction = useStore((s) => s.removeTransaction);
  const addCategory = useStore((s) => s.addCategory);
  const editing = useStore((s) => s.transactions.find((t) => t.id === s.ui.editingTxId));

  const [form, setForm] = useState(blank);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    if (!open) return;
    setAddingCat(false);
    setNewCatName("");
    if (editing) {
      setForm({
        type: editing.type,
        date: editing.date,
        amount: String(editing.amount),
        personId: editing.personId,
        accountId: editing.accountId,
        toAccountId: editing.toAccountId ?? "",
        categoryId: editing.categoryId ?? "",
        description: editing.description ?? "",
        tags: editing.tags.join(", "),
      });
    } else {
      setForm({
        ...blank,
        date: todayISO(),
        personId: people[0]?.id ?? "",
        accountId: accounts[0]?.id ?? "",
      });
    }
  }, [open, editingId]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const commitNewCat = () => {
    const name = newCatName.trim();
    if (!name || form.type === "transfer") return;
    const existing = categories.find(
      (c) => c.type === form.type && c.name.toLowerCase() === name.toLowerCase()
    );
    const cat = existing ?? addCategory({ name, type: form.type, color: CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)] });
    set({ categoryId: cat.id });
    setAddingCat(false);
    setNewCatName("");
  };

  const ownedAccounts = useMemo(
    () => (form.personId ? accounts.filter((a) => a.ownerId === form.personId) : accounts),
    [form.personId, accounts]
  );
  const catOptions = useMemo(
    () => categories.filter((c) => (form.type === "transfer" ? false : c.type === form.type || (form.type === "adjustment" && c.type === "adjustment"))),
    [categories, form.type]
  );

  const valid =
    Number(form.amount) > 0 &&
    form.personId &&
    form.accountId &&
    (form.type !== "transfer" || (form.toAccountId && form.toAccountId !== form.accountId));

  const save = (addAnother = false) => {
    if (!valid) return;
    const payload = {
      type: form.type,
      date: form.date,
      amount: Math.abs(Number(form.amount)),
      personId: form.personId,
      accountId: form.accountId,
      toAccountId: form.type === "transfer" ? form.toAccountId : undefined,
      categoryId: form.type === "transfer" ? undefined : form.categoryId || undefined,
      description: form.description.trim() || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (editing) updateTransaction(editing.id, payload);
    else addTransaction(payload);

    if (addAnother) {
      setForm((f) => ({ ...blank, type: f.type, date: f.date, personId: f.personId, accountId: f.accountId }));
    } else {
      close();
    }
  };

  return (
    <Modal open={open} onClose={close} title={editing ? "Edit Transaction" : "Add Transaction"}>
      <div className="space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => set({ type: t.id, categoryId: "" })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition",
                form.type === t.id
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", t.color)} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Amount">
            <Input
              type="number"
              inputMode="decimal"
              autoFocus
              placeholder="0"
              value={form.amount}
              onChange={(e) => set({ amount: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && save(false)}
            />
          </FormRow>
          <FormRow label="Date">
            <Input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Person">
            <Select value={form.personId} onChange={(e) => set({ personId: e.target.value, accountId: "" })}>
              <option value="">Select…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormRow>
          <FormRow label={form.type === "transfer" ? "From account" : "Account"}>
            <Select value={form.accountId} onChange={(e) => set({ accountId: e.target.value })}>
              <option value="">Select…</option>
              {ownedAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </FormRow>
        </div>

        {form.type === "transfer" ? (
          <FormRow label="To account">
            <Select value={form.toAccountId} onChange={(e) => set({ toAccountId: e.target.value })}>
              <option value="">Select…</option>
              {accounts.filter((a) => a.id !== form.accountId).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({people.find((p) => p.id === a.ownerId)?.name})
                </option>
              ))}
            </Select>
          </FormRow>
        ) : (
          <FormRow label="Category">
            {addingCat ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="New category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitNewCat(); }
                    if (e.key === "Escape") { setAddingCat(false); setNewCatName(""); }
                  }}
                />
                <Button type="button" variant="primary" disabled={!newCatName.trim()} onClick={commitNewCat}>
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setAddingCat(false); setNewCatName(""); }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  className="flex-1"
                  value={form.categoryId}
                  onChange={(e) => set({ categoryId: e.target.value })}
                >
                  <option value="">Uncategorized</option>
                  {catOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Button type="button" variant="outline" onClick={() => setAddingCat(true)}>
                  + New
                </Button>
              </div>
            )}
          </FormRow>
        )}

        <FormRow label="Description">
          <Input
            placeholder="e.g. Groceries at Bhatbhateni"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save(false)}
          />
        </FormRow>

        <FormRow label="Tags (comma separated)">
          <Input placeholder="essential, monthly" value={form.tags} onChange={(e) => set({ tags: e.target.value })} />
        </FormRow>

        <div className="flex items-center gap-2 pt-1">
          {editing && (
            <Button
              variant="danger"
              onClick={() => {
                removeTransaction(editing.id);
                close();
              }}
            >
              Delete
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            {!editing && (
              <Button variant="outline" disabled={!valid} onClick={() => save(true)}>
                Save & add another
              </Button>
            )}
            <Button disabled={!valid} onClick={() => save(false)}>
              {editing ? "Save changes" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

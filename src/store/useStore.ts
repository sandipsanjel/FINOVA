import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Account,
  AppData,
  Budget,
  Category,
  Filters,
  Goal,
  Person,
  RecurringRule,
  Settings,
  Transaction,
} from "@/types";
import { demoData, emptyData } from "@/lib/seed";
import { uid } from "@/lib/id";
import { addMonths, addWeeks, addYears, format, parseISO } from "date-fns";

interface UIState {
  filters: Filters;
  txModalOpen: boolean;
  editingTxId: string | null;
}

interface StoreState extends AppData {
  ui: UIState;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  toggleTheme: () => void;

  // people
  addPerson: (p: Omit<Person, "id" | "createdAt">) => void;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;

  // accounts
  addAccount: (a: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => void;

  // categories
  addCategory: (c: Omit<Category, "id">) => Category;
  removeCategory: (id: string) => void;

  // transactions
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // budgets
  addBudget: (b: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (id: string, patch: Partial<Budget>) => void;
  removeBudget: (id: string) => void;

  // goals
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  contributeGoal: (id: string, amount: number) => void;

  // recurring
  addRecurring: (r: Omit<RecurringRule, "id" | "createdAt">) => void;
  updateRecurring: (id: string, patch: Partial<RecurringRule>) => void;
  removeRecurring: (id: string) => void;
  runDueRecurring: () => number; // returns count generated

  // filters / ui
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  openTxModal: (id?: string) => void;
  closeTxModal: () => void;

  // data ops
  loadDemo: () => void;
  resetAll: () => void;
  importData: (data: AppData) => void;
  exportData: () => AppData;
}

const now = () => new Date().toISOString();

const initial = demoData();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initial,
      ui: {
        filters: { personId: "all", accountId: "all", categoryId: "all", type: "all" },
        txModalOpen: false,
        editingTxId: null,
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleTheme: () =>
        set((s) => ({ settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" } })),

      addPerson: (p) => set((s) => ({ people: [...s.people, { ...p, id: uid("p"), createdAt: now() }] })),
      updatePerson: (id, patch) =>
        set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePerson: (id) =>
        set((s) => ({
          people: s.people.filter((p) => p.id !== id),
          accounts: s.accounts.filter((a) => a.ownerId !== id),
          transactions: s.transactions.filter((t) => t.personId !== id),
        })),

      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, { ...a, id: uid("a"), createdAt: now() }] })),
      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
        })),

      addCategory: (c) => {
        const cat: Category = { ...c, id: uid("cat") };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addTransaction: (t) =>
        set((s) => ({ transactions: [{ ...t, id: uid("t"), createdAt: now() }, ...s.transactions] })),
      updateTransaction: (id, patch) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addBudget: (b) => set((s) => ({ budgets: [...s.budgets, { ...b, id: uid("b"), createdAt: now() }] })),
      updateBudget: (id, patch) =>
        set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      removeBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid("g"), createdAt: now() }] })),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      contributeGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, savedAmount: Math.max(0, g.savedAmount + amount) } : g
          ),
        })),

      addRecurring: (r) =>
        set((s) => ({ recurring: [...s.recurring, { ...r, id: uid("r"), createdAt: now() }] })),
      updateRecurring: (id, patch) =>
        set((s) => ({ recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeRecurring: (id) => set((s) => ({ recurring: s.recurring.filter((r) => r.id !== id) })),

      runDueRecurring: () => {
        const s = get();
        const today = new Date();
        const generated: Transaction[] = [];
        const updatedRules = s.recurring.map((r) => {
          if (!r.active) return r;
          let cursor = r.lastRun ? nextDate(parseISO(r.lastRun), r.recurrence) : parseISO(r.startDate);
          let last = r.lastRun ? parseISO(r.lastRun) : undefined;
          while (cursor <= today) {
            generated.push({
              id: uid("t"),
              type: r.type,
              date: format(cursor, "yyyy-MM-dd"),
              amount: r.amount,
              personId: r.personId,
              accountId: r.accountId,
              toAccountId: r.toAccountId,
              categoryId: r.categoryId,
              description: `${r.name} (auto)`,
              tags: [...r.tags, "recurring"],
              createdAt: now(),
            });
            last = cursor;
            cursor = nextDate(cursor, r.recurrence);
          }
          return last ? { ...r, lastRun: format(last, "yyyy-MM-dd") } : r;
        });
        if (generated.length) {
          set({ transactions: [...generated, ...s.transactions], recurring: updatedRules });
        }
        return generated.length;
      },

      setFilters: (patch) => set((s) => ({ ui: { ...s.ui, filters: { ...s.ui.filters, ...patch } } })),
      resetFilters: () =>
        set((s) => ({
          ui: {
            ...s.ui,
            filters: { personId: "all", accountId: "all", categoryId: "all", type: "all" },
          },
        })),
      openTxModal: (id) => set((s) => ({ ui: { ...s.ui, txModalOpen: true, editingTxId: id ?? null } })),
      closeTxModal: () => set((s) => ({ ui: { ...s.ui, txModalOpen: false, editingTxId: null } })),

      loadDemo: () => set({ ...demoData() }),
      resetAll: () => set({ ...emptyData() }),
      importData: (data) => set({ ...data }),
      exportData: () => {
        const s = get();
        return {
          people: s.people,
          accounts: s.accounts,
          categories: s.categories,
          transactions: s.transactions,
          recurring: s.recurring,
          budgets: s.budgets,
          goals: s.goals,
          settings: s.settings,
        };
      },
    }),
    {
      name: "finova-store",
      version: 1,
      partialize: (s) => ({
        people: s.people,
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.transactions,
        recurring: s.recurring,
        budgets: s.budgets,
        goals: s.goals,
        settings: s.settings,
      }),
    }
  )
);

function nextDate(d: Date, rec: RecurringRule["recurrence"]): Date {
  if (rec === "weekly") return addWeeks(d, 1);
  if (rec === "yearly") return addYears(d, 1);
  return addMonths(d, 1);
}

// Convenience selector hook for the active filtered data set & settings.
export const useSettings = () => useStore((s) => s.settings);

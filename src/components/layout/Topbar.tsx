import { Button } from "@/components/ui/Button";
import { useStore } from "@/store/useStore";
import { Menu, Moon, Plus, Sun } from "lucide-react";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  accounts: "Accounts",
  analytics: "Analytics",
  budgets: "Budgets",
  goals: "Goals",
  recurring: "Recurring",
  reports: "Reports",
  settings: "Settings",
};

export function Topbar({ page, onOpenMobile }: { page: string; onOpenMobile: () => void }) {
  const theme = useStore((s) => s.settings.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const openTxModal = useStore((s) => s.openTxModal);

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-[#0b0f17]/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">{TITLES[page] ?? "Dashboard"}</h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button onClick={() => openTxModal()} className="shadow-sm">
          <Plus size={18} />
          <span className="hidden sm:inline">Add Transaction</span>
        </Button>
      </div>
    </header>
  );
}

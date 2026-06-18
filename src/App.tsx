import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Sidebar, type Page } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Dashboard } from "@/pages/Dashboard";
import { Transactions } from "@/pages/Transactions";
import { Accounts } from "@/pages/Accounts";
import { Analytics } from "@/pages/Analytics";
import { Budgets } from "@/pages/Budgets";
import { Goals } from "@/pages/Goals";
import { Recurring } from "@/pages/Recurring";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useStore((s) => s.settings.theme);
  const openTxModal = useStore((s) => s.openTxModal);

  // apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // global keyboard shortcut: "n" opens new transaction
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n") {
        e.preventDefault();
        openTxModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openTxModal]);

  return (
    <div className="min-h-screen">
      <Sidebar page={page} onNavigate={setPage} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <Topbar page={page} onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {page === "dashboard" && <Dashboard />}
          {page === "transactions" && <Transactions />}
          {page === "accounts" && <Accounts />}
          {page === "analytics" && <Analytics />}
          {page === "budgets" && <Budgets />}
          {page === "goals" && <Goals />}
          {page === "recurring" && <Recurring />}
          {page === "reports" && <Reports />}
          {page === "settings" && <Settings />}
        </main>
      </div>
      <TransactionModal />
    </div>
  );
}

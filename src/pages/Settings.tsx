import { useStore } from "@/store/useStore";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { exportJSON } from "@/lib/export";
import { useSyncStatus, testConnection, forceSync, type SyncPhase } from "@/lib/sync";
import { useAuth } from "@/components/auth/AuthGate";
import type { AppData, CurrencyCode } from "@/types";
import { Cloud, CloudOff, Database, Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const CURRENCIES: CurrencyCode[] = ["NPR", "INR", "USD", "EUR", "GBP"];

export function Settings() {
  const data = useStore();
  const updateSettings = useStore((s) => s.updateSettings);
  const loadDemo = useStore((s) => s.loadDemo);
  const resetAll = useStore((s) => s.resetAll);
  const importData = useStore((s) => s.importData);
  const exportData = useStore((s) => s.exportData);
  const fileRef = useRef<HTMLInputElement>(null);

  const { cloud, email } = useAuth();
  const sync = useSyncStatus();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestResult(await testConnection());
    setTesting(false);
  };
  const runForceSync = async () => {
    setTesting(true);
    setTestResult(null);
    setTestResult(await forceSync());
    setTesting(false);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        if (parsed.accounts && parsed.transactions) {
          importData(parsed);
          alert("Data imported successfully.");
        } else alert("That file doesn't look like a Finova backup.");
      } catch {
        alert("Could not parse that JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Card>
        <CardHeader title="Preferences" subtitle="Currency, theme and targets" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormRow label="Currency">
            <Select value={data.settings.currency} onChange={(e) => updateSettings({ currency: e.target.value as CurrencyCode })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormRow>
          <FormRow label="Theme">
            <Select value={data.settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as "light" | "dark" })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </Select>
          </FormRow>
          <FormRow label="Monthly savings target (%)">
            <Input type="number" value={data.settings.monthlySavingsTarget} onChange={(e) => updateSettings({ monthlySavingsTarget: Number(e.target.value) })} />
          </FormRow>
        </div>
      </Card>

      <Card>
        <CardHeader title="Cloud Sync" subtitle="Supabase connection & sync status" />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <SyncBadge phase={sync.phase} />
            <span className="text-slate-500 dark:text-slate-400">
              Configured:{" "}
              <strong className={cloud ? "text-emerald-500" : "text-rose-500"}>
                {cloud ? "Yes" : "No"}
              </strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Account: <strong>{email ?? (cloud ? "—" : "local-only mode")}</strong>
            </span>
            {sync.lastSavedAt && (
              <span className="text-slate-500 dark:text-slate-400">
                Last saved: <strong>{new Date(sync.lastSavedAt).toLocaleString()}</strong>
              </span>
            )}
          </div>

          {sync.lastError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <strong>Last sync error:</strong> {sync.lastError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={testing} onClick={runTest}>
              <Cloud size={16} /> Test connection
            </Button>
            <Button variant="outline" disabled={testing || !cloud} onClick={runForceSync}>
              <RefreshCw size={16} /> Force sync now
            </Button>
          </div>

          {testResult && (
            <div
              className={
                "rounded-xl p-3 text-xs " +
                (testResult.ok
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300")
              }
            >
              {testResult.message}
            </div>
          )}

          {!cloud && (
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <CloudOff size={15} className="mt-0.5 shrink-0" />
              <p>
                Running in local-only mode. Set <code>VITE_SUPABASE_URL</code> and{" "}
                <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, then restart{" "}
                <code>npm run dev</code> to enable cloud sync.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Data Management" subtitle="Local-first — everything lives in this browser" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportJSON(exportData())}><Download size={16} /> Export backup (JSON)</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import backup</Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          <Button variant="secondary" onClick={() => confirm("Replace current data with demo dataset?") && loadDemo()}><RefreshCw size={16} /> Load demo data</Button>
          <Button variant="danger" onClick={() => confirm("Erase ALL data? This cannot be undone.") && resetAll()}><Trash2 size={16} /> Reset everything</Button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
          <Database size={15} className="mt-0.5 shrink-0" />
          <p>
            Data is stored in your browser's local storage. Export a JSON backup regularly. The data layer is
            structured so a cloud backend (e.g. Supabase) can be added later without changing the UI.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Stats" subtitle="Current dataset" />
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="People" value={data.people.length} />
          <Stat label="Accounts" value={data.accounts.length} />
          <Stat label="Transactions" value={data.transactions.length} />
          <Stat label="Categories" value={data.categories.length} />
        </div>
      </Card>
    </div>
  );
}

const PHASE_META: Record<SyncPhase, { label: string; cls: string }> = {
  offline: { label: "Local only", cls: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  idle: { label: "Not signed in", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  connecting: { label: "Connecting…", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" },
  synced: { label: "Synced", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  saving: { label: "Saving…", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" },
  saved: { label: "Saved", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  error: { label: "Error", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
};

function SyncBadge({ phase }: { phase: SyncPhase }) {
  const m = PHASE_META[phase];
  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " + m.cls}>
      {m.label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

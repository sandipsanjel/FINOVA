import { useStore } from "@/store/useStore";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormRow, Input, Select } from "@/components/ui/Field";
import { exportJSON } from "@/lib/export";
import type { AppData, CurrencyCode } from "@/types";
import { Database, Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

const CURRENCIES: CurrencyCode[] = ["NPR", "INR", "USD", "EUR", "GBP"];

export function Settings() {
  const data = useStore();
  const updateSettings = useStore((s) => s.updateSettings);
  const loadDemo = useStore((s) => s.loadDemo);
  const resetAll = useStore((s) => s.resetAll);
  const importData = useStore((s) => s.importData);
  const exportData = useStore((s) => s.exportData);
  const fileRef = useRef<HTMLInputElement>(null);

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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

import { useStore } from "@/store/useStore";
import { Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { RotateCcw, Search } from "lucide-react";

export function FilterBar({ showSearch = true }: { showSearch?: boolean }) {
  const { people, accounts, categories } = useStore();
  const filters = useStore((s) => s.ui.filters);
  const setFilters = useStore((s) => s.setFilters);
  const resetFilters = useStore((s) => s.resetFilters);

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      {showSearch && (
        <div className="relative min-w-[160px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search description or tag…"
            value={filters.search ?? ""}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>
      )}
      <Input
        type="date"
        value={filters.from ?? ""}
        onChange={(e) => setFilters({ from: e.target.value || undefined })}
        className="w-auto"
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.to ?? ""}
        onChange={(e) => setFilters({ to: e.target.value || undefined })}
        className="w-auto"
        aria-label="To date"
      />
      <Select value={filters.personId ?? "all"} onChange={(e) => setFilters({ personId: e.target.value })} className="w-auto">
        <option value="all">All people</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
      <Select value={filters.accountId ?? "all"} onChange={(e) => setFilters({ accountId: e.target.value })} className="w-auto">
        <option value="all">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </Select>
      <Select value={filters.categoryId ?? "all"} onChange={(e) => setFilters({ categoryId: e.target.value })} className="w-auto">
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>
      <Select value={filters.type ?? "all"} onChange={(e) => setFilters({ type: e.target.value as any })} className="w-auto">
        <option value="all">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="transfer">Transfer</option>
        <option value="adjustment">Adjustment</option>
      </Select>
      <Select value={filters.sortOrder ?? "desc"} onChange={(e) => setFilters({ sortOrder: e.target.value as "asc" | "desc" })} className="w-auto">
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </Select>
      <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset filters">
        <RotateCcw size={16} />
      </Button>
    </div>
  );
}

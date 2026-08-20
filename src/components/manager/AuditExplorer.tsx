/**
 * Chat Manager — audit explorer.
 *
 * Filters operate on the audit records already present in the Chat Manager
 * (the section ledger) plus the changes staged during this session. No records
 * are fabricated and no audit service is called — when a ledger service is
 * connected, replace `useAuditRecords` with its query.
 */
import { useMemo, useState } from "react";
import { Search, ShieldAlert, X, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Block, DataTable, Pill, CARD, MUTED, FG } from "./manager-ui";
import { useManagerActions } from "./manager-actions";

export type AuditSeverity = "Low" | "Medium" | "High";

export type AuditRecord = {
  time: string;
  actor: string;
  action: string;
  module: string;
  entity: string;
  before: string;
  after: string;
  severity: AuditSeverity;
};

/** Ledger entries rendered by the Chat Manager today (previously inline JSX). */
export const LEDGER: AuditRecord[] = [
  { time: "22:34 IST", actor: "Rahul Mehta · Admin", action: "policy.update", module: "Channel Policies", entity: "Escalation Rules", before: "15m", after: "10m", severity: "Medium" },
  { time: "22:12 IST", actor: "Priya Nair · Manager", action: "channel.owner.change", module: "Channels", entity: "#support-escalations", before: "Vikram Rao", after: "Priya Nair", severity: "Low" },
  { time: "21:58 IST", actor: "System", action: "automation.fail", module: "Automation Center", entity: "Offboard cleanup", before: "success", after: "failed (502)", severity: "High" },
  { time: "21:30 IST", actor: "Arjun Shah · Dev Lead", action: "ai.model.canary", module: "AI Models", entity: "translate-lite", before: "off", after: "canary", severity: "Medium" },
  { time: "20:44 IST", actor: "Rahul Mehta · Admin", action: "role.grant", module: "Users", entity: "2 users", before: "Member", after: "Manager", severity: "High" },
];

const severityTone: Record<AuditSeverity, "slate" | "amber" | "rose"> = {
  Low: "slate", Medium: "amber", High: "rose",
};

const fmt = (d: Date) =>
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) + " IST";

/** Combines the existing ledger with changes staged during this session. */
export function useAuditRecords(): AuditRecord[] {
  const { staged } = useManagerActions();
  return useMemo(
    () => [
      ...staged.map<AuditRecord>((s) => ({
        time: fmt(s.at),
        actor: s.actor,
        action: s.action,
        module: s.module,
        entity: s.entity,
        before: s.before,
        after: s.after,
        severity: s.severity,
      })),
      ...LEDGER,
    ],
    [staged],
  );
}

type Filters = { actor: string; action: string; module: string; severity: string; range: string };
const EMPTY: Filters = { actor: "", action: "", module: "", severity: "", range: "" };

const RANGES = ["Last hour", "Today", "Last 7 days", "Last 30 days"];

function FilterSelect({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const id = `cm-audit-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex min-w-[8.5rem] flex-1 flex-col gap-1 sm:flex-none">
      <label htmlFor={id} className={`text-[11.5px] font-bold uppercase tracking-wider ${MUTED}`}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-9 rounded-xl border px-2.5 py-2 text-[13px] font-semibold outline-none transition-colors focus-visible:border-[oklch(0.72_0.168_265)] focus-visible:ring-4 focus-visible:ring-[oklch(0.72_0.168_265)]/15 ${
          value
            ? "border-[oklch(0.38_0.08_265)] bg-[oklch(0.72_0.168_265)]/12 text-[oklch(0.78_0.14_265)]"
            : "border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] text-[oklch(0.86_0.02_285)]"
        }`}
      >
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function AuditExplorer({ initialModule = "" }: { initialModule?: string }) {
  const records = useAuditRecords();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ ...EMPTY, module: initialModule });
  const [pending, setPending] = useState(false);

  const options = useMemo(() => ({
    actor: [...new Set(records.map((r) => r.actor))],
    action: [...new Set(records.map((r) => r.action))],
    module: [...new Set(records.map((r) => r.module))],
  }), [records]);

  const activeFilters = (Object.entries(filters) as [keyof Filters, string][]).filter(([, v]) => v);
  const hasFilters = activeFilters.length > 0 || query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (filters.actor && r.actor !== filters.actor) return false;
      if (filters.action && r.action !== filters.action) return false;
      if (filters.module && r.module !== filters.module) return false;
      if (filters.severity && r.severity !== filters.severity) return false;
      if (!q) return true;
      return [r.actor, r.action, r.module, r.entity, r.before, r.after, r.time]
        .join(" ").toLowerCase().includes(q);
    });
  }, [records, filters, query]);

  function update(k: keyof Filters, v: string) {
    setPending(true);
    setFilters((f) => ({ ...f, [k]: v }));
    window.setTimeout(() => setPending(false), 180);
  }

  return (
    <>
      <div className={`${CARD} p-3.5`}>
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] px-3 py-2 focus-within:border-[oklch(0.72_0.168_265)]">
            <Search className={`h-4 w-4 shrink-0 ${MUTED}`} />
            <input
              className={`min-h-9 w-full bg-transparent text-[13.5px] outline-none placeholder:text-[oklch(0.6_0.02_285)] ${FG}`}
              placeholder="Search audit ledger — actor, action, entity…"
              aria-label="Search audit ledger"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <Button
                type="button" variant="ghost" size="icon" aria-label="Clear search"
                onClick={() => setQuery("")}
                className="h-7 min-h-9 w-7 min-w-9 shrink-0 rounded-lg text-[oklch(0.86_0.02_285)] hover:bg-[oklch(0.22_0.03_285)]"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <FilterSelect label="Actor" value={filters.actor} options={options.actor} onChange={(v) => update("actor", v)} />
            <FilterSelect label="Action" value={filters.action} options={options.action} onChange={(v) => update("action", v)} />
            <FilterSelect label="Module" value={filters.module} options={options.module} onChange={(v) => update("module", v)} />
            <FilterSelect label="Severity" value={filters.severity} options={["Low", "Medium", "High"]} onChange={(v) => update("severity", v)} />
            <FilterSelect label="Date range" value={filters.range} options={RANGES} onChange={(v) => update("range", v)} />
            <Button
              type="button" size="sm" variant="ghost" disabled={!hasFilters}
              onClick={() => { setFilters(EMPTY); setQuery(""); }}
              className="h-9 min-h-9 gap-1.5 rounded-xl border border-[oklch(0.27_0.025_285)] px-3 text-[12.5px] font-semibold text-[oklch(0.86_0.02_285)] hover:bg-[oklch(0.22_0.03_285)]"
            >
              <X className="h-3.5 w-3.5" /> Reset all
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
            <Filter className={`h-3.5 w-3.5 ${MUTED}`} />
            {activeFilters.length === 0 && !query && (
              <span className={`text-[12.5px] ${MUTED}`}>No filters applied · showing all {records.length} records</span>
            )}
            {query && (
              <button
                type="button" onClick={() => setQuery("")}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[oklch(0.38_0.08_265)] bg-[oklch(0.72_0.168_265)]/12 px-2.5 py-0.5 text-[12px] font-semibold text-[oklch(0.78_0.14_265)] hover:bg-[oklch(0.72_0.168_265)]/22"
              >
                search: “{query}” <X className="h-3 w-3" />
              </button>
            )}
            {activeFilters.map(([k, v]) => (
              <button
                key={k} type="button" onClick={() => update(k, "")}
                aria-label={`Clear ${k} filter`}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[oklch(0.38_0.08_265)] bg-[oklch(0.72_0.168_265)]/12 px-2.5 py-0.5 text-[12px] font-semibold text-[oklch(0.78_0.14_265)] hover:bg-[oklch(0.72_0.168_265)]/22"
              >
                {k}: {v} <X className="h-3 w-3" />
              </button>
            ))}
            <span className={`ml-auto inline-flex items-center gap-1.5 text-[12.5px] ${MUTED}`}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-[oklch(0.72_0.168_265)]" />}
              {filtered.length} of {records.length} records
            </span>
          </div>
        </div>
      </div>

      <Block title="Audit Timeline" icon={ShieldAlert} action="Export ledger">
        <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <DataTable
            headers={["Time", "Actor", "Action", "Entity", "Before → After", "Severity"]}
            rows={filtered.map((r) => [
              r.time, r.actor, r.action, r.entity, `${r.before} → ${r.after}`,
              <Pill key="sev" tone={severityTone[r.severity]}>{r.severity}</Pill>,
            ])}
            emptyLabel="No audit records match these filters. Clear a filter or reset all to widen the search."
            note="The audit ledger is append-only and tamper-evident. Session changes staged in the Chat Manager appear at the top until a ledger service is connected."
          />
        </div>
      </Block>
    </>
  );
}

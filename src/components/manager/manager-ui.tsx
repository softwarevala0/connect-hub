/**
 * Chat Manager — shared presentation primitives.
 *
 * Extracted from ManagementSections.tsx so sections, the permission matrix,
 * the audit explorer and the role assignment panel share one design language.
 * Behaviour is unchanged; the DataTable gained a mobile card representation and
 * Block actions now resolve to real action specs.
 */
import type { ComponentType, ReactNode } from "react";
import { CircleDot } from "lucide-react";
import { ActionButton } from "./manager-actions";
import { resolveActionSpec } from "./action-registry";

export const CARD =
  "rounded-2xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.205_0.028_285)] shadow-[0_1px_2px_rgba(0,0,0,0.09)]";
export const MUTED = "text-[oklch(0.72_0.02_285)]";
export const FG = "text-[oklch(0.965_0.012_285)]";

export type Tone = "emerald" | "amber" | "rose" | "indigo" | "slate";

export const toneCls: Record<Tone, string> = {
  emerald: "border-[oklch(0.38_0.1_155)] text-[oklch(0.72_0.1725_155)] bg-[oklch(0.185_0.02_285)]",
  amber: "border-[oklch(0.34_0.09_85)] text-[oklch(0.78_0.147_75)] bg-[oklch(0.185_0.02_285)]",
  rose: "border-[oklch(0.36_0.11_20)] text-[oklch(0.74_0.16_20)] bg-[oklch(0.185_0.02_285)]",
  indigo: "border-[oklch(0.38_0.08_265)] text-[oklch(0.72_0.168_265)] bg-[oklch(0.185_0.02_285)]",
  slate: "border-[oklch(0.27_0.025_285)] text-[oklch(0.86_0.02_285)] bg-[oklch(0.185_0.02_285)]",
};

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[13.5px] font-bold ${toneCls[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Responsive record grid.
 * - ≥1024px: full dense enterprise table.
 * - 768–1023px: table with de-emphasised low-priority columns.
 * - <768px: stacked cards, first column as the record title.
 */
export function DataTable({
  headers, rows, note, emptyLabel = "No records match the current view.",
}: {
  headers: string[];
  rows: ReactNode[][];
  note?: string;
  emptyLabel?: string;
}) {
  const empty = rows.length === 0;

  return (
    <div className={`overflow-hidden ${CARD}`}>
      {/* Tablet + desktop */}
      <div className="scrollbar-thin hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse lg:min-w-[720px]">
          <thead className="bg-[oklch(0.185_0.02_285)]">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`px-3 py-2.5 text-left text-[13.5px] font-bold uppercase tracking-wider ${MUTED} ${i > 3 ? "hidden lg:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empty ? (
              <tr>
                <td colSpan={headers.length} className={`px-3 py-10 text-center text-[14.5px] ${MUTED}`}>{emptyLabel}</td>
              </tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={`transition-colors hover:bg-[oklch(0.185_0.02_285)] ${i > 0 ? "border-t border-[oklch(0.185_0.02_285)]" : ""}`}>
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={`px-3 py-2.5 text-[15px] ${j === 0 ? `font-semibold ${FG}` : "text-[oklch(0.86_0.02_285)]"} ${j > 3 ? "hidden lg:table-cell" : ""}`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked record cards, no horizontal scrolling */}
      <ul className="flex flex-col gap-2 p-2 md:hidden">
        {empty && <li className={`px-2 py-6 text-center text-[14.5px] ${MUTED}`}>{emptyLabel}</li>}
        {rows.map((r, i) => (
          <li
            key={i}
            className="rounded-xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] p-3 transition-colors"
          >
            <div className={`text-[15.5px] font-bold ${FG}`}>{r[0]}</div>
            <dl className="mt-2 grid grid-cols-1 gap-1.5">
              {r.slice(1).map((c, j) => (
                <div key={j} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-2">
                  <dt className={`text-[13px] font-bold uppercase tracking-wider ${MUTED}`}>{headers[j + 1]}</dt>
                  <dd className="min-w-0 text-[15px] text-[oklch(0.86_0.02_285)]">{c}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {note && <div className={`border-t border-[oklch(0.185_0.02_285)] bg-[oklch(0.185_0.02_285)] px-3 py-2 text-[14px] ${MUTED}`}>{note}</div>}
    </div>
  );
}

export function MiniStats({
  items,
}: { items: { label: string; value: string; hint?: string; tone?: Tone; icon?: ComponentType<{ className?: string }> }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((s) => {
        const Icon = s.icon ?? CircleDot;
        return (
          <div key={s.label} className={`${CARD} p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)]`}>
            <div className="flex items-center gap-2">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${toneCls[s.tone ?? "indigo"]}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className={`min-w-0 truncate text-[13.5px] font-bold uppercase tracking-wider ${MUTED}`}>{s.label}</span>
            </div>
            <div className={`mt-2 font-mono text-[19px] font-bold sm:text-[21px] ${FG}`}>{s.value}</div>
            {s.hint && <div className={`mt-0.5 text-[13.5px] ${MUTED}`}>{s.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function Bar({ value, tone = "indigo" }: { value: number; tone?: Tone }) {
  const color =
    tone === "emerald" ? "bg-[oklch(0.78_0.16_155)]"
    : tone === "amber" ? "bg-[oklch(0.78_0.16_75)]"
    : tone === "rose" ? "bg-[oklch(0.7_0.19_20)]"
    : "bg-[oklch(0.72_0.168_265)]";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 min-w-[72px] flex-1 overflow-hidden rounded-full bg-[oklch(0.185_0.02_285)]">
        <span className={`block h-full rounded-full ${color} transition-[width] duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="shrink-0 font-mono text-[13.5px] font-bold text-[oklch(0.86_0.02_285)]">{value}%</span>
    </div>
  );
}

/** Section block. `action` is a registry label — it renders a working action button. */
export function Block({
  title, icon: Icon, children, action,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  action?: string;
}) {
  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <header className="mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[oklch(0.38_0.08_265)] bg-[oklch(0.185_0.02_285)] text-[oklch(0.72_0.168_265)]">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className={`min-w-0 truncate text-[15px] font-bold tracking-tight ${FG}`}>{title}</h3>
        {action && (
          <div className="col-span-2 sm:ml-auto">
            <ActionButton spec={resolveActionSpec(action, title)} className="w-full sm:w-auto" />
          </div>
        )}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

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

export const CARD = "card3d card-tone-blue";
export const MUTED = "text-[oklch(0.84_0.05_248)]";
export const FG = "text-[oklch(0.98_0.012_255)]";

/** Rotating colour tones so adjacent cards never collide on the same colour. */
const CARD_TONES = [
  "card-tone-blue", "card-tone-violet", "card-tone-cyan",
  "card-tone-emerald", "card-tone-amber", "card-tone-rose",
] as const;

/** Index-based tone: cycle through the palette in order. */
export function toneAt(index: number) {
  const i = ((index % CARD_TONES.length) + CARD_TONES.length) % CARD_TONES.length;
  return CARD_TONES[i]!;
}

/**
 * Index-based tone keyed by first-seen order of a card title.
 * Replaces hashing so two neighbouring cards can never land on the same tone.
 */
const toneOrder = new Map<string, number>();

export function cardTone(seed: string) {
  let idx = toneOrder.get(seed);
  if (idx === undefined) {
    idx = toneOrder.size;
    toneOrder.set(seed, idx);
  }
  return toneAt(idx);
}

export type Tone = "emerald" | "amber" | "rose" | "indigo" | "slate";

export const toneCls: Record<Tone, string> = {
  emerald: "border-[oklch(0.62_0.16_158)] text-[oklch(0.9_0.18_158)] bg-[oklch(0.34_0.1_158)]",
  amber: "border-[oklch(0.66_0.15_78)] text-[oklch(0.93_0.16_88)] bg-[oklch(0.36_0.1_70)]",
  rose: "border-[oklch(0.6_0.19_18)] text-[oklch(0.9_0.14_20)] bg-[oklch(0.34_0.12_18)]",
  indigo: "border-[oklch(0.6_0.2_262)] text-[oklch(0.92_0.11_250)] bg-[oklch(0.36_0.14_262)]",
  slate: "border-[oklch(1_0_0/0.2)] text-[oklch(0.92_0.03_250)] bg-[oklch(0.3_0.05_264)]",
};

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[13.5px] font-extrabold shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_2px_6px_-2px_oklch(0_0_0/0.6)] ${toneCls[tone]}`}>
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
                    className={`px-3 py-2.5 text-[15px] ${j === 0 ? `font-semibold ${FG}` : "text-[oklch(0.93_0.03_250)]"} ${j > 3 ? "hidden lg:table-cell" : ""}`}
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
            className="glass3d rounded-xl p-3 transition-colors"
          >
            <div className={`text-[15.5px] font-bold ${FG}`}>{r[0]}</div>
            <dl className="mt-2 grid grid-cols-1 gap-1.5">
              {r.slice(1).map((c, j) => (
                <div key={j} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-2">
                  <dt className={`text-[13px] font-bold uppercase tracking-wider ${MUTED}`}>{headers[j + 1]}</dt>
                  <dd className="min-w-0 text-[15px] text-[oklch(0.93_0.03_250)]">{c}</dd>
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
      {items.map((s, i) => {
        const Icon = s.icon ?? CircleDot;
        return (
          <div key={s.label} className={`card3d ${toneAt(i)} p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)]`}>
            <div className="flex items-center gap-2">
              <span className="icon3d h-9 w-9 shrink-0">
                <Icon className="h-4 w-4" />
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
    tone === "emerald" ? "bg-gradient-to-r from-[oklch(0.7_0.16_170)] to-[oklch(0.85_0.19_150)]"
    : tone === "amber" ? "bg-gradient-to-r from-[oklch(0.7_0.16_60)] to-[oklch(0.88_0.17_88)]"
    : tone === "rose" ? "bg-gradient-to-r from-[oklch(0.62_0.2_10)] to-[oklch(0.8_0.16_28)]"
    : "bg-gradient-to-r from-[oklch(0.6_0.21_265)] to-[oklch(0.82_0.15_215)]";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 min-w-[72px] shadow-[inset_0_1px_3px_oklch(0_0_0/0.6)] flex-1 overflow-hidden rounded-full bg-[oklch(0.185_0.02_285)]">
        <span className={`block h-full rounded-full ${color} transition-[width] duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="shrink-0 font-mono text-[13.5px] font-bold text-[oklch(0.93_0.03_250)]">{value}%</span>
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
    <section className={`card3d ${cardTone(title)} p-4 md:p-5`}>
      <header className="mb-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap">
        <span className="icon3d h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="cm-heading min-w-0 truncate text-[17px]">{title}</h3>
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

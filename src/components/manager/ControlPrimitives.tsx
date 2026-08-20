import { useEffect, useRef, useState } from "react";
import {
  Boxes, ShieldCheck, Activity, CircleDot, Clock, GitBranch, Link2,
} from "lucide-react";

/* ─────────── Animated counter ─────────── */

export function AnimatedNumber({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);
  return <>{n}</>;
}

/* ─────────── Progress ring ─────────── */

export function ProgressRing({
  value, size = 34, stroke = 4, tone = "indigo",
}: {
  value: number; size?: number; stroke?: number;
  tone?: "indigo" | "emerald" | "amber" | "slate";
}) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setP(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    tone === "emerald" ? "oklch(0.78 0.16 155)"
    : tone === "amber" ? "oklch(0.78 0.16 75)"
    : tone === "slate" ? "oklch(0.45 0.025 285)"
    : "oklch(0.72 0.168 265)";
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.27 0.025 285)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c}
        strokeDashoffset={c - (c * Math.min(100, Math.max(0, p))) / 100}
        style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

/* ─────────── Activity timeline ─────────── */

type TimelineTone = "indigo" | "emerald" | "amber" | "slate";

const TIMELINE: { title: string; meta: string; time: string; tone: TimelineTone }[] = [
  { title: "Security policy revision published", meta: "Governance · Security Policy", time: "2m ago", tone: "emerald" },
  { title: "Retention window changed to 7 years", meta: "Governance · Retention Policy", time: "18m ago", tone: "indigo" },
  { title: "Escalation rule awaiting approval", meta: "Workflow · Escalation Rules", time: "1h ago", tone: "amber" },
  { title: "Module registry synchronised", meta: "Workspace · Module Mapping", time: "3h ago", tone: "slate" },
  { title: "Role access matrix reviewed", meta: "Governance · Role Access Matrix", time: "Yesterday", tone: "indigo" },
];

const dotCls: Record<TimelineTone, string> = {
  indigo: "bg-[oklch(0.72_0.168_265)] ring-[oklch(0.3_0.066_265)]",
  emerald: "bg-[oklch(0.78_0.16_155)] ring-[oklch(0.3_0.088_155)]",
  amber: "bg-[oklch(0.78_0.16_75)] ring-[oklch(0.3_0.088_85)]",
  slate: "bg-[oklch(0.45_0.025_285)] ring-[oklch(0.27_0.025_285)]",
};

export function ActivityTimeline() {
  return (
    <section className="rounded-2xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.205_0.028_285)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.09)] md:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Activity className="h-4 w-4 text-[oklch(0.72_0.168_265)]" />
        <h3 className="text-[15px] font-bold tracking-tight text-[oklch(0.965_0.012_285)]">Recent Activity</h3>
        <span className="rounded-full border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] px-2 py-0.5 text-[11.5px] font-semibold text-[oklch(0.72_0.02_285)]">
          Control-plane changes
        </span>
        <button className="ml-auto text-[12.5px] font-semibold text-[oklch(0.72_0.168_265)] transition-colors hover:text-[oklch(0.68_0.184_268)]">
          View full audit trail
        </button>
      </header>
      <ol className="relative space-y-3 pl-5 before:absolute before:left-[5px] before:top-1.5 before:bottom-2 before:w-px before:bg-[oklch(0.27_0.025_285)]">
        {TIMELINE.map((t) => (
          <li key={t.title} className="group relative">
            <span className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-4 transition-transform group-hover:scale-125 ${dotCls[t.tone]}`} />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-2 py-1 transition-colors hover:bg-[oklch(0.185_0.02_285)]">
              <span className="text-[14px] font-semibold text-[oklch(0.965_0.012_285)]">{t.title}</span>
              <span className="text-[12.5px] text-[oklch(0.72_0.02_285)]">{t.meta}</span>
              <span className="ml-auto inline-flex items-center gap-1 font-mono text-[12px] text-[oklch(0.72_0.02_285)]">
                <Clock className="h-2.5 w-2.5" /> {t.time}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────── Module control grid ─────────── */

const MODULES: {
  name: string; code: string; desc: string; status: "Enabled" | "Restricted" | "Disabled";
  visibility: string; roles: number; linked: string[]; health: number; updated: string;
}[] = [
  { name: "Asset Management", code: "AMS", desc: "Conversations spawned from asset tickets and inspections.", status: "Enabled", visibility: "All departments", roles: 6, linked: ["Projects", "Support"], health: 98, updated: "2h ago" },
  { name: "Projects", code: "PRJ", desc: "Project rooms, milestone threads and delivery escalations.", status: "Enabled", visibility: "Delivery + Leads", roles: 5, linked: ["AMS", "Accounts"], health: 96, updated: "5h ago" },
  { name: "Support Desk", code: "SUP", desc: "Customer support conversations with SLA routing.", status: "Enabled", visibility: "Support only", roles: 4, linked: ["AMS"], health: 92, updated: "1d ago" },
  { name: "Sales", code: "SLS", desc: "Pre-sales threads, quotations and client handover.", status: "Restricted", visibility: "Sales leads", roles: 3, linked: ["Accounts"], health: 88, updated: "2d ago" },
  { name: "Accounts", code: "ACC", desc: "Billing clarifications and finance approvals.", status: "Restricted", visibility: "Finance only", roles: 2, linked: ["Projects", "Sales"], health: 90, updated: "3d ago" },
  { name: "Development", code: "DEV", desc: "Engineering rooms, incident bridges and code reviews.", status: "Enabled", visibility: "Engineering", roles: 5, linked: ["Projects"], health: 94, updated: "6h ago" },
];

const statusCls: Record<string, string> = {
  Enabled: "border-[oklch(0.38_0.1_155)] bg-[oklch(0.185_0.02_285)] text-[oklch(0.68_0.1725_155)]",
  Restricted: "border-[oklch(0.3_0.088_85)] bg-[oklch(0.185_0.02_285)] text-[oklch(0.72_0.147_75)]",
  Disabled: "border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] text-[oklch(0.72_0.02_285)]",
};

export function ModuleControlGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {MODULES.map((m) => (
        <article
          key={m.code}
          className="group rounded-2xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.205_0.028_285)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.07)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[oklch(0.45_0.025_285)] hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.62)]"
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] text-[oklch(0.72_0.168_265)]">
              <Boxes className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h4 className="truncate text-[14.5px] font-bold text-[oklch(0.965_0.012_285)]">{m.name}</h4>
                <span className="shrink-0 rounded-md bg-[oklch(0.185_0.02_285)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[oklch(0.72_0.02_285)]">{m.code}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-[oklch(0.72_0.02_285)]">{m.desc}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11.5px] font-bold ${statusCls[m.status]}`}>{m.status}</span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[oklch(0.185_0.02_285)] pt-3 text-[12.5px]">
            <div className="flex items-center gap-1.5 text-[oklch(0.72_0.02_285)]">
              <ShieldCheck className="h-3 w-3" /> <dt className="sr-only">Visibility</dt>
              <dd className="truncate text-[oklch(0.86_0.02_285)]">{m.visibility}</dd>
            </div>
            <div className="flex items-center gap-1.5 text-[oklch(0.72_0.02_285)]">
              <CircleDot className="h-3 w-3" /> <dt className="sr-only">Assigned roles</dt>
              <dd className="text-[oklch(0.86_0.02_285)]">{m.roles} roles assigned</dd>
            </div>
            <div className="flex items-center gap-1.5 text-[oklch(0.72_0.02_285)]">
              <GitBranch className="h-3 w-3" /> <dt className="sr-only">Dependencies</dt>
              <dd className="truncate text-[oklch(0.86_0.02_285)]">{m.linked.join(" · ")}</dd>
            </div>
            <div className="flex items-center gap-1.5 text-[oklch(0.72_0.02_285)]">
              <Clock className="h-3 w-3" /> <dt className="sr-only">Last updated</dt>
              <dd className="text-[oklch(0.86_0.02_285)]">Updated {m.updated}</dd>
            </div>
          </dl>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[oklch(0.185_0.02_285)]">
              <span
                className="block h-full rounded-full bg-[oklch(0.78_0.16_155)] transition-[width] duration-700"
                style={{ width: `${m.health}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[12px] font-bold text-[oklch(0.68_0.1725_155)]">{m.health}% health</span>
            <button className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[oklch(0.27_0.025_285)] px-2 py-1 text-[12px] font-semibold text-[oklch(0.86_0.02_285)] opacity-0 transition-all hover:bg-[oklch(0.185_0.02_285)] focus-visible:opacity-100 group-hover:opacity-100">
              <Link2 className="h-3 w-3" /> Configure
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

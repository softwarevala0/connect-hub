/**
 * Chat Manager — interactive permission matrix.
 *
 * Same roles, modules and actions as before; the computed baseline is now the
 * *current value* and each cell can be toggled to a *modified value* which is
 * tracked as an unsaved draft. Saving stages the diff in the session change log
 * (no backend is connected to the Chat Manager in this build).
 */
import { useMemo, useState } from "react";
import { RotateCcw, Save, Undo2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useManagerActions } from "./manager-actions";
import { Pill, CARD, MUTED, FG } from "./manager-ui";

export const PM_ROLES = ["Admin", "Manager", "Dev Lead", "Support", "Sales", "Client"] as const;
export const PM_MODULES = ["Conversations", "Channels", "Policies", "Automation", "Integrations", "Analytics"] as const;
export const PM_ACTIONS = ["Read", "Create", "Update", "Delete", "Approve"] as const;

const PM_LEVEL: Record<string, number> = {
  Admin: 5, Manager: 4, "Dev Lead": 3, Support: 3, Sales: 2, Client: 1,
};
const PM_WEIGHT: Record<string, number> = { Read: 1, Create: 2, Update: 3, Delete: 5, Approve: 4 };
const PM_MOD_WEIGHT: Record<string, number> = {
  Conversations: 0, Channels: 1, Policies: 2, Automation: 1, Integrations: 2, Analytics: 0,
};

const key = (role: string, mod: string, action: string) => `${role}|${mod}|${action}`;

/** Baseline (current) effective permission — unchanged rules. */
export function baselineAllowed(role: string, mod: string, action: string) {
  return (PM_LEVEL[role] ?? 0) >= (PM_WEIGHT[action] ?? 0) + (PM_MOD_WEIGHT[mod] ?? 0);
}

export function PermissionMatrixGrid() {
  const { stage } = useManagerActions();
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const changes = useMemo(
    () => Object.entries(draft).filter(([k, v]) => {
      const [role = "", mod = "", action = ""] = k.split("|");
      return baselineAllowed(role, mod, action) !== v;
    }),
    [draft],
  );
  const dirty = changes.length > 0;

  function toggle(role: string, mod: string, action: string) {
    const k = key(role, mod, action);
    const current = draft[k] ?? baselineAllowed(role, mod, action);
    setSaved(null);
    setDraft((d) => {
      const next = { ...d, [k]: !current };
      if (next[k] === baselineAllowed(role, mod, action)) delete next[k];
      return next;
    });
  }

  function reset() {
    setDraft({});
    setConfirming(false);
    setSaved(null);
  }

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 420));
    changes.forEach(([k, v]) => {
      const [role = "", mod = "", action = ""] = k.split("|");
      stage({
        actor: "You · Workspace Owner",
        action: "permission.update",
        module: "Permissions",
        entity: `${role} · ${mod} · ${action}`,
        before: baselineAllowed(role, mod, action) ? "Allow" : "Deny",
        after: v ? "Allow" : "Deny",
        severity: v ? "High" : "Medium",
      });
    });
    setSaved(`${changes.length} permission change${changes.length === 1 ? "" : "s"} staged in this session.`);
    setDraft({});
    setSaving(false);
    setConfirming(false);
  }

  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-[oklch(0.185_0.02_285)] bg-[oklch(0.185_0.02_285)] px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 text-[oklch(0.72_0.168_265)]" />
        <span className={`text-[14.5px] font-bold ${FG}`}>Role × Module permissions</span>
        <span
          aria-live="polite"
          className={`text-[14px] font-semibold ${dirty ? "text-[oklch(0.78_0.147_75)]" : MUTED}`}
        >
          {dirty
            ? `${changes.length} unsaved change${changes.length === 1 ? "" : "s"}`
            : (saved ?? "No unsaved changes")}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            type="button" size="sm" variant="ghost" disabled={!dirty || saving}
            onClick={reset}
            className="h-8 min-h-9 gap-1.5 rounded-lg border border-[oklch(0.27_0.025_285)] px-2.5 text-[14px] text-[oklch(0.86_0.02_285)] hover:bg-[oklch(0.22_0.03_285)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button
            type="button" size="sm" variant="ghost" disabled={!dirty || saving}
            onClick={() => { setDraft({}); setConfirming(false); }}
            className="h-8 min-h-9 gap-1.5 rounded-lg border border-[oklch(0.27_0.025_285)] px-2.5 text-[14px] text-[oklch(0.86_0.02_285)] hover:bg-[oklch(0.22_0.03_285)]"
          >
            <Undo2 className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button
            type="button" size="sm" variant="ghost" disabled={!dirty} loading={saving}
            onClick={() => (confirming ? void save() : setConfirming(true))}
            className="h-8 min-h-9 gap-1.5 rounded-lg border border-[oklch(0.38_0.08_265)] bg-[oklch(0.72_0.168_265)]/14 px-2.5 text-[14px] text-[oklch(0.78_0.14_265)] hover:bg-[oklch(0.72_0.168_265)]/24"
          >
            <Save className="h-3.5 w-3.5" /> {confirming ? "Confirm save" : "Save changes"}
          </Button>
        </div>
        {confirming && dirty && (
          <p className="w-full text-[14px] text-[oklch(0.78_0.147_75)]">
            Applying {changes.length} permission change{changes.length === 1 ? "" : "s"} affects every user holding the role. Press “Confirm save” to continue.
          </p>
        )}
      </div>

      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <caption className="sr-only">
            Permission matrix. Each cell is a toggle button switching between Allow and Deny.
          </caption>
          <thead className="bg-[oklch(0.185_0.02_285)]">
            <tr>
              <th scope="col" className={`sticky left-0 z-10 bg-[oklch(0.185_0.02_285)] px-3 py-2.5 text-left text-[13.5px] font-bold uppercase tracking-wider ${MUTED}`}>Role × Module</th>
              {PM_ACTIONS.map((a) => (
                <th key={a} scope="col" className={`px-3 py-2.5 text-center text-[13.5px] font-bold uppercase tracking-wider ${MUTED}`}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PM_ROLES.flatMap((role) =>
              PM_MODULES.map((mod) => (
                <tr key={`${role}-${mod}`} className="border-t border-[oklch(0.185_0.02_285)] hover:bg-[oklch(0.185_0.02_285)]">
                  <th scope="row" className={`sticky left-0 z-10 bg-[oklch(0.205_0.028_285)] px-3 py-2 text-left text-[15px] font-semibold ${FG}`}>
                    {role} <span className={MUTED}>· {mod}</span>
                  </th>
                  {PM_ACTIONS.map((a) => {
                    const k = key(role, mod, a);
                    const base = baselineAllowed(role, mod, a);
                    const value = draft[k] ?? base;
                    const changed = value !== base;
                    return (
                      <td key={a} className="px-3 py-2 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={value}
                          aria-label={`${role}, ${mod}, ${a}: ${value ? "Allow" : "Deny"}${changed ? " (modified)" : ""}`}
                          onClick={() => toggle(role, mod, a)}
                          className={`inline-flex min-h-9 items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.168_265)] focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.205_0.028_285)] ${changed ? "ring-2 ring-[oklch(0.78_0.147_75)] ring-offset-2 ring-offset-[oklch(0.205_0.028_285)]" : ""}`}
                        >
                          <Pill tone={value ? "emerald" : "slate"}>
                            {value ? "Allow" : "Deny"}
                            {changed && <span className="ml-1 text-[oklch(0.78_0.147_75)]">•</span>}
                          </Pill>
                        </button>
                        {changed && (
                          <span className="mt-0.5 block text-[12.5px] text-[oklch(0.78_0.147_75)]">
                            was {base ? "Allow" : "Deny"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <div className={`border-t border-[oklch(0.185_0.02_285)] bg-[oklch(0.185_0.02_285)] px-3 py-2 text-[14px] ${MUTED}`}>
        Effective permissions are computed per role, module and action. Management-side only — never exposed in the user dashboard.
        Changes stay staged in this session until a permission service is connected.
      </div>
    </div>
  );
}

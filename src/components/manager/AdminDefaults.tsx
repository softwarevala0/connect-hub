import { useEffect, useMemo, useState } from "react";
import { Settings2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useManagerActions } from "./manager-actions";
import {
  builtInAllowed, D_ACTIONS, D_MODULES, D_ROLES, dKey, resetDefaults, saveDefaults, usePermissionDefaults,
} from "./permission-defaults";

export function AdminDefaults() {
  const saved = usePermissionDefaults();
  const { stage } = useManagerActions();
  const [baseRole, setBaseRole] = useState(saved.baseRole);
  const [role, setRole] = useState<string>(saved.baseRole);
  const [cells, setCells] = useState<Record<string, boolean>>(saved.cells);

  useEffect(() => { setBaseRole(saved.baseRole); setRole(saved.baseRole); setCells(saved.cells); }, [saved]);

  const val = (r: string, m: string, a: string) => cells[dKey(r, m, a)] ?? builtInAllowed(r, m, a);
  const dirty = useMemo(
    () => baseRole !== saved.baseRole || JSON.stringify(cells) !== JSON.stringify(saved.cells),
    [baseRole, cells, saved],
  );

  function toggle(m: string, a: string) {
    const k = dKey(role, m, a);
    setCells((c) => ({ ...c, [k]: !val(role, m, a) }));
  }

  function save() {
    saveDefaults({ baseRole, cells });
    stage({
      actor: "You · Workspace Owner", action: "defaults.update", module: "Permissions",
      entity: "Permission defaults", before: `Base role: ${saved.baseRole}`, after: `Base role: ${baseRole}`, severity: "Medium",
    });
    toast.success("Defaults saved", { description: "The matrix and AI advisor now use these defaults." });
  }

  function reset() {
    resetDefaults();
    toast.success("Defaults restored to built-in rules");
  }

  return (
    <section aria-labelledby="admin-defaults-title" className="card3d glass3d flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="admin-defaults-title" className="flex items-center gap-2 font-display text-[16px] font-bold text-primary">
            <Settings2 className="h-4 w-4" /> Admin defaults
          </h3>
          <p className="text-[14px] text-muted-foreground">Set the base role and each role's default permissions. The matrix and AI advisor start from these.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Built-in rules</Button>
          <Button size="sm" disabled={!dirty} onClick={save}><Save className="h-3.5 w-3.5" /> Save defaults</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[14px] font-semibold">
          Base role for new teams
          <select value={baseRole} onChange={(e) => setBaseRole(e.target.value)}
            className="focus-ring rounded-xl border border-border bg-background px-3 py-2 text-[14.5px]">
            {D_ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[14px] font-semibold">
          Editing defaults for
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="focus-ring rounded-xl border border-border bg-background px-3 py-2 text-[14.5px]">
            {D_ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[14px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="px-2 py-2 text-left font-semibold">Module</th>
              {D_ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center font-semibold">{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {D_MODULES.map((m) => (
              <tr key={m} className="border-t border-border">
                <td className="px-2 py-1.5 font-semibold">{m}</td>
                {D_ACTIONS.map((a) => {
                  const on = val(role, m, a);
                  return (
                    <td key={a} className="px-2 py-1.5 text-center">
                      <button type="button" role="switch" aria-checked={on}
                        aria-label={`${role} default ${m} ${a}`}
                        onClick={() => toggle(m, a)}
                        className={`focus-ring min-h-8 rounded-lg border px-2.5 text-[13px] font-bold ${on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>
                        {on ? "Allow" : "Deny"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {saved.updatedAt && <p className="text-[13px] text-muted-foreground">Last saved {new Date(saved.updatedAt).toLocaleString()} · stored on this device.</p>}
    </section>
  );
}

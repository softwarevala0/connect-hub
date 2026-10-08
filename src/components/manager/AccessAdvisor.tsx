import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wand2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessRecommendation } from "@/lib/access-advisor.functions";
import { useManagerActions } from "./manager-actions";
import { baselineAllowed, PM_ACTIONS } from "./PermissionMatrix";

type Rec = Extract<Awaited<ReturnType<typeof getAccessRecommendation>>, { ok: true }>["rec"];

export function AccessAdvisor() {
  const run = useServerFn(getAccessRecommendation);
  const { stage, permissions, applyPermissions } = useManagerActions();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<Rec | null>(null);
  const [applied, setApplied] = useState(false);

  async function submit() {
    setLoading(true); setError(null); setRec(null); setApplied(false);
    try {
      const r = await run({ data: { description: text } });
      if (r.ok) setRec(r.rec); else setError(r.error);
    } catch {
      setError("Please describe the team in at least 10 characters.");
    } finally { setLoading(false); }
  }

  function apply() {
    if (!rec) return;
    const patch: Record<string, boolean> = {};
    rec.grants.forEach((g) => {
      g.actions.forEach((a) => {
        patch[`${rec.role}|${g.module}|${a}`] = true;
        stage({
          actor: "You · Workspace Owner (AI advisor)",
          action: "permission.recommend",
          module: "Permissions",
          entity: `${rec.role} · ${g.module} · ${a}`,
          before: (permissions[`${rec.role}|${g.module}|${a}`] ?? baselineAllowed(rec.role, g.module, a)) ? "Allow" : "Deny",
          after: "Allow",
          severity: a === "Delete" || a === "Approve" ? "High" : "Low",
        });
      });
    });
    applyPermissions(patch);
    setApplied(true);
  }

  return (
    <div className="card3d mb-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="icon3d grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><Wand2 className="h-4 w-4" /></span>
        <div>
          <h3 className="text-[16px] font-bold text-primary">AI Least-Privilege Advisor</h3>
          <p className="text-[14px] text-muted-foreground">Describe what a team does; get the minimum permissions they need.</p>
        </div>
      </div>
      <label htmlFor="advisor-input" className="sr-only">Team access needs</label>
      <textarea
        id="advisor-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="e.g. Our support team answers customer chats, tags conversations, and needs to see CSAT reports but should never change channels or policies."
        className="focus-ring mt-3 w-full rounded-xl border border-border bg-background p-3 text-[14.5px] text-foreground placeholder:text-muted-foreground"
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} loading={loading} disabled={text.trim().length < 10} className="gap-1.5">
          <Wand2 className="h-3.5 w-3.5" /> Recommend permissions
        </Button>
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-[14px] text-destructive">{error}</p>}

      {rec && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <p className="text-[14.5px] text-foreground"><span className="font-bold">Base role: {rec.role}.</span> {rec.summary}</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Module</th>
                  {PM_ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center font-semibold">{a}</th>)}
                  <th className="px-3 py-2 text-left font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {rec.grants.map((g) => (
                  <tr key={g.module} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{g.module}</td>
                    {PM_ACTIONS.map((a) => (
                      <td key={a} className="px-2 py-2 text-center">
                        {g.actions.includes(a) ? <CheckCircle2 aria-label="Allow" className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-muted-foreground">{g.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rec.risks.length > 0 && (
            <ul className="space-y-1 text-[14px] text-muted-foreground">
              {rec.risks.map((r) => <li key={r} className="flex gap-1.5"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>)}
            </ul>
          )}
          <div className="flex items-center justify-end gap-2">
            {applied && <span className="text-[14px] text-primary">Applied to the permission matrix and logged.</span>}
            <Button size="sm" variant="outline" onClick={apply} disabled={applied}>Apply recommendation</Button>
          </div>
        </div>
      )}
    </div>
  );
}

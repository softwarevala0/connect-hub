/**
 * Chat Manager — role assignment.
 *
 * Assign or revoke a role for the users already listed in the access overview.
 * Changes are staged in the session change log (no identity service is wired to
 * the Chat Manager in this build).
 */
import { useMemo, useState } from "react";
import { KeyRound, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Block, Pill, MUTED, FG } from "./manager-ui";
import { useManagerActions } from "./manager-actions";

export const ROLES = ["Owner", "Admin", "Manager", "Dev Lead", "Support", "Sales", "Accounts", "Client"] as const;

const PEOPLE = [
  { name: "Rahul Mehta", dept: "Operations", role: "Admin" },
  { name: "Priya Nair", dept: "Delivery", role: "Manager" },
  { name: "Arjun Shah", dept: "Engineering", role: "Dev Lead" },
  { name: "Deepa Iyer", dept: "Support", role: "Support" },
  { name: "Vikram Rao", dept: "Sales", role: "Sales" },
];

export function RoleAssignmentPanel() {
  const { stage } = useManagerActions();
  const [assignments, setAssignments] = useState<Record<string, string>>(
    Object.fromEntries(PEOPLE.map((p) => [p.name, p.role])),
  );
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const elevated = useMemo(
    () => Object.values(assignments).filter((r) => r === "Owner" || r === "Admin").length,
    [assignments],
  );

  function begin(name: string, role: string) {
    setPendingUser(name);
    setPendingRole(role);
    setStatus(null);
  }

  async function confirm() {
    if (!pendingUser) return;
    const before = assignments[pendingUser] ?? "—";
    setBusy(true);
    await new Promise((r) => setTimeout(r, 380));
    setAssignments((a) => ({ ...a, [pendingUser]: pendingRole }));
    stage({
      actor: "You · Workspace Owner",
      action: pendingRole === "Client" ? "role.revoke" : "role.grant",
      module: "Access Control",
      entity: pendingUser,
      before,
      after: pendingRole,
      severity: pendingRole === "Owner" || pendingRole === "Admin" ? "High" : "Medium",
    });
    setStatus(`${pendingUser}: ${before} → ${pendingRole} staged in this session.`);
    setPendingUser(null);
    setBusy(false);
  }

  return (
    <Block title="Role Assignment" icon={KeyRound} action="Assign role">
      <p className={`text-[14px] ${MUTED}`}>
        {elevated} user{elevated === 1 ? "" : "s"} hold elevated roles. Changing a role takes effect for every module
        governed by the permission matrix.
      </p>
      <ul className="flex flex-col gap-2">
        {PEOPLE.map((p) => {
          const role = assignments[p.name] ?? p.role;
          const changed = role !== p.role;
          const selecting = pendingUser === p.name;
          return (
            <li
              key={p.name}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] p-3 transition-colors hover:bg-[oklch(0.22_0.03_285)]"
            >
              <div className="min-w-0">
                <div className={`truncate text-[15px] font-bold ${FG}`}>{p.name}</div>
                <div className={`truncate text-[14px] ${MUTED}`}>{p.dept}</div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={changed ? "amber" : "indigo"}>{role}</Pill>
                <label className="sr-only" htmlFor={`role-${p.name.replace(/\s+/g, "-")}`}>Role for {p.name}</label>
                <select
                  id={`role-${p.name.replace(/\s+/g, "-")}`}
                  value={selecting ? pendingRole : role}
                  onChange={(e) => begin(p.name, e.target.value)}
                  className="min-h-9 rounded-lg border border-[oklch(0.27_0.025_285)] bg-[oklch(0.205_0.028_285)] px-2 text-[14px] font-semibold text-[oklch(0.86_0.02_285)] outline-none focus-visible:border-[oklch(0.72_0.168_265)] focus-visible:ring-4 focus-visible:ring-[oklch(0.72_0.168_265)]/15"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {selecting && (
                <div className="col-span-2 flex flex-wrap items-center gap-2 border-t border-[oklch(0.27_0.025_285)] pt-2">
                  <span className="text-[14px] text-[oklch(0.78_0.147_75)]">
                    Change {p.name} from {role} to {pendingRole}?
                  </span>
                  <div className="ml-auto flex gap-1.5">
                    <Button
                      type="button" size="sm" variant="ghost" disabled={busy}
                      onClick={() => setPendingUser(null)}
                      className="h-8 min-h-9 gap-1 rounded-lg border border-[oklch(0.27_0.025_285)] px-2.5 text-[14px] text-[oklch(0.86_0.02_285)]"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button
                      type="button" size="sm" variant="ghost" loading={busy}
                      onClick={() => void confirm()}
                      className="h-8 min-h-9 gap-1 rounded-lg border border-[oklch(0.38_0.08_265)] bg-[oklch(0.72_0.168_265)]/14 px-2.5 text-[14px] text-[oklch(0.78_0.14_265)]"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Apply role
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className={`text-[14px] ${status ? "text-[oklch(0.72_0.1725_155)]" : MUTED}`}>
        {status ?? "Role changes are staged in this session until an identity service is connected."}
      </p>
    </Block>
  );
}

/**
 * Admin-defined permission defaults: the base role for new teams and the
 * default allow/deny per role × module × action. Saved on this device and
 * used as the matrix baseline and as context for the AI advisor.
 */
import { useEffect, useState } from "react";

const STORE_KEY = "cm.permissionDefaults";
const EVT = "cm:defaults";

export const D_ROLES = ["Admin", "Manager", "Dev Lead", "Support", "Sales", "Client"] as const;
export const D_MODULES = ["Conversations", "Channels", "Policies", "Automation", "Integrations", "Analytics"] as const;
export const D_ACTIONS = ["Read", "Create", "Update", "Delete", "Approve"] as const;

const LEVEL: Record<string, number> = { Admin: 5, Manager: 4, "Dev Lead": 3, Support: 3, Sales: 2, Client: 1 };
const WEIGHT: Record<string, number> = { Read: 1, Create: 2, Update: 3, Delete: 5, Approve: 4 };
const MOD_WEIGHT: Record<string, number> = { Conversations: 0, Channels: 1, Policies: 2, Automation: 1, Integrations: 2, Analytics: 0 };

export const dKey = (r: string, m: string, a: string) => `${r}|${m}|${a}`;

/** Built-in rule used when an admin hasn't set a default. */
export function builtInAllowed(r: string, m: string, a: string) {
  return (LEVEL[r] ?? 0) >= (WEIGHT[a] ?? 0) + (MOD_WEIGHT[m] ?? 0);
}

export type PermissionDefaults = { baseRole: string; cells: Record<string, boolean>; updatedAt?: string };

const EMPTY: PermissionDefaults = { baseRole: "Client", cells: {} };
let current: PermissionDefaults = EMPTY;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (s) current = { ...EMPTY, ...JSON.parse(s) };
  } catch { /* ignore */ }
}

export function getDefaults(): PermissionDefaults { load(); return current; }

export function defaultAllowed(r: string, m: string, a: string) {
  return getDefaults().cells[dKey(r, m, a)] ?? builtInAllowed(r, m, a);
}

export function saveDefaults(next: PermissionDefaults) {
  current = { ...next, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(STORE_KEY, JSON.stringify(current)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}

export function resetDefaults() {
  current = EMPTY;
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}

/** Subscribe to defaults; returns EMPTY during SSR/first render to avoid hydration mismatch. */
export function usePermissionDefaults() {
  const [d, setD] = useState<PermissionDefaults>(EMPTY);
  useEffect(() => {
    const sync = () => setD(getDefaults());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return d;
}

/** Compact allowed-list per role for the AI advisor. */
export function defaultsForAdvisor(d: PermissionDefaults) {
  return {
    baseRole: d.baseRole,
    defaults: D_ROLES.map((r) => ({
      role: r,
      grants: D_MODULES.map((m) => ({
        module: m,
        actions: D_ACTIONS.filter((a) => d.cells[dKey(r, m, a)] ?? builtInAllowed(r, m, a)),
      })).filter((g) => g.actions.length),
    })),
  };
}

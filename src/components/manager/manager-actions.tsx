/**
 * Chat Manager — action system.
 *
 * Gives every management action a real UI flow (form dialog, confirmation,
 * detail view) with idle / validating / processing / success / error states.
 *
 * IMPORTANT: this build has no backend wired to the Chat Manager. Actions
 * therefore *stage* a change in an in-memory session store and record it in the
 * session audit log. Nothing pretends to have been persisted — every success
 * state says so explicitly, and the staged store is the single place a real
 * service call would be plugged in later (see `commitStagedChange`).
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/* ─────────── Optional sound feedback (muted by default) ─────────── */

const SOUND_KEY = "cm.sound.enabled";

export type SoundEvent = "success" | "error" | "warning" | "notice";

const TONES: Record<SoundEvent, number[]> = {
  success: [660, 880],
  error: [220, 165],
  warning: [440, 392],
  notice: [523],
};

export function isSoundEnabled() {
  try { return localStorage.getItem(SOUND_KEY) === "1"; } catch { return false; }
}
export function setSoundEnabled(on: boolean) {
  try { localStorage.setItem(SOUND_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

export function playManagerSound(kind: SoundEvent) {
  if (typeof window === "undefined" || !isSoundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    TONES[kind].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.16);
    });
    setTimeout(() => void ctx.close(), 600);
  } catch { /* audio unavailable — silently skip */ }
}

/* ─────────── Session stores (staged changes + audit) ─────────── */

export type StagedChange = {
  id: string;
  at: Date;
  actor: string;
  action: string;
  module: string;
  entity: string;
  before: string;
  after: string;
  severity: "Low" | "Medium" | "High";
};

/* ─────────── Field / action specs ─────────── */

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "switch";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  defaultValue?: string;
};

export type ActionSpec = {
  /** Short verb shown on the trigger button, e.g. "Invite user". */
  label: string;
  title?: string;
  description?: string;
  module: string;
  /** Audit action key, e.g. "user.invite". */
  action?: string;
  fields?: FieldSpec[];
  /** Renders a read-only detail panel instead of / above the form. */
  detail?: ReactNode;
  submitLabel?: string;
  destructive?: boolean;
  /** Extra confirmation step before applying. */
  confirm?: string;
  /** Optional custom handler; return a summary string for the audit entry. */
  onSubmit?: (values: Record<string, string>) => Promise<string> | string;
  /** Navigate somewhere instead of opening a dialog. */
  navigateTo?: string;
};

type Ctx = {
  run: (spec: ActionSpec) => void;
  stage: (c: Omit<StagedChange, "id" | "at">) => void;
  staged: StagedChange[];
  clearStaged: () => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
};

const ManagerActionContext = createContext<Ctx | null>(null);

export function useManagerActions(): Ctx {
  const ctx = useContext(ManagerActionContext);
  if (!ctx) throw new Error("useManagerActions must be used within ManagerActionProvider");
  return ctx;
}

/** Ask the Chat Manager shell to open a section (used by cross-component links). */
export function requestSection(id: string) {
  window.dispatchEvent(new CustomEvent("cm:navigate", { detail: id }));
}

/* ─────────── Provider ─────────── */

let seq = 0;

export function ManagerActionProvider({ children }: { children: ReactNode }) {
  const [spec, setSpec] = useState<ActionSpec | null>(null);
  const [staged, setStaged] = useState<StagedChange[]>([]);
  const [soundOn, setSoundOnState] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setSoundOnState(isSoundEnabled()); }, []);

  const setSoundOn = useCallback((v: boolean) => { setSoundEnabled(v); setSoundOnState(v); }, []);

  const stage = useCallback((c: Omit<StagedChange, "id" | "at">) => {
    setStaged((prev) => [{ ...c, id: `STG-${++seq}`, at: new Date() }, ...prev].slice(0, 200));
  }, []);

  const run = useCallback((s: ActionSpec) => {
    if (s.navigateTo) { requestSection(s.navigateTo); return; }
    triggerRef.current = (document.activeElement as HTMLElement) ?? null;
    setSpec(s);
  }, []);

  const close = useCallback(() => {
    setSpec(null);
    // Restore focus to whatever opened the dialog.
    window.setTimeout(() => triggerRef.current?.focus?.(), 0);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ run, stage, staged, clearStaged: () => setStaged([]), soundOn, setSoundOn }),
    [run, stage, staged, soundOn, setSoundOn],
  );

  return (
    <ManagerActionContext.Provider value={value}>
      {children}
      <ActionDialog spec={spec} onClose={close} onStage={stage} />
      <Toaster position="bottom-right" richColors closeButton />
    </ManagerActionContext.Provider>
  );
}

/* ─────────── The dialog engine ─────────── */

type Phase = "form" | "confirm" | "processing" | "success" | "error";

function ActionDialog({
  spec, onClose, onStage,
}: { spec: ActionSpec | null; onClose: () => void; onStage: Ctx["stage"] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!spec) return;
    const init: Record<string, string> = {};
    (spec.fields ?? []).forEach((f) => { init[f.name] = f.defaultValue ?? (f.type === "switch" ? "off" : ""); });
    setValues(init);
    setErrors({});
    setPhase("form");
    setMessage("");
  }, [spec]);

  if (!spec) return null;

  const fields = spec.fields ?? [];
  const dirty = fields.some((f) => (values[f.name] ?? "") !== (f.defaultValue ?? (f.type === "switch" ? "off" : "")));

  function validate() {
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) next[f.name] = `${f.label} is required`;
      else if (f.type === "number" && v && Number.isNaN(Number(v))) next[f.name] = "Must be a number";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function apply() {
    if (!spec) return;
    setPhase("processing");
    try {
      let summary: string;
      if (spec.onSubmit) {
        summary = await spec.onSubmit(values);
      } else {
        const after = fields.length
          ? fields.map((f) => `${f.label}: ${values[f.name] || "—"}`).join(" · ")
          : spec.label;
        summary = after;
      }
      onStage({
        actor: "You · Workspace Owner",
        action: spec.action ?? spec.label.toLowerCase().replace(/\s+/g, "."),
        module: spec.module,
        entity: spec.title ?? spec.label,
        before: "—",
        after: summary,
        severity: spec.destructive ? "High" : "Medium",
      });
      setMessage(summary);
      setPhase("success");
      playManagerSound("success");
      toast.success(`${spec.label} staged`, {
        description: "Recorded in this session's change log — connect a service to persist it.",
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "The action could not be completed.");
      setPhase("error");
      playManagerSound("error");
      toast.error(`${spec.label} failed`);
    }
  }

  function onPrimary() {
    if (phase === "form") {
      if (!validate()) { playManagerSound("warning"); return; }
      if (spec?.confirm) { setPhase("confirm"); return; }
      void apply();
    } else if (phase === "confirm") {
      void apply();
    } else if (phase === "error") {
      setPhase("form");
    } else {
      onClose();
    }
  }

  const busy = phase === "processing";

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <DialogContent className="max-h-[88dvh] w-[calc(100vw-2rem)] max-w-[560px] overflow-y-auto border-[oklch(0.27_0.025_285)] bg-[oklch(0.205_0.028_285)] text-[oklch(0.965_0.012_285)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16.5px] font-bold tracking-tight">
            {spec.destructive && <ShieldAlert className="h-4 w-4 text-[oklch(0.74_0.16_20)]" />}
            {spec.title ?? spec.label}
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-[oklch(0.72_0.02_285)]">
            {spec.description ?? `${spec.module} · management action`}
          </DialogDescription>
        </DialogHeader>

        {spec.detail && phase === "form" && (
          <div className="rounded-xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] p-3 text-[13.5px]">
            {spec.detail}
          </div>
        )}

        {phase === "form" && fields.length > 0 && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => { e.preventDefault(); onPrimary(); }}
          >
            {fields.map((f) => {
              const id = `cm-f-${f.name}`;
              const err = errors[f.name];
              const common = "w-full rounded-xl border bg-[oklch(0.185_0.02_285)] px-3 py-2 text-[14px] text-[oklch(0.965_0.012_285)] outline-none transition-colors placeholder:text-[oklch(0.6_0.02_285)] focus-visible:border-[oklch(0.72_0.168_265)] focus-visible:ring-4 focus-visible:ring-[oklch(0.72_0.168_265)]/15";
              const border = err ? "border-[oklch(0.6_0.19_20)]" : "border-[oklch(0.27_0.025_285)]";
              return (
                <div key={f.name} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className="text-[13px] font-semibold text-[oklch(0.86_0.02_285)]">
                    {f.label}{f.required && <span className="ml-0.5 text-[oklch(0.74_0.16_20)]">*</span>}
                  </label>
                  {f.type === "select" ? (
                    <select
                      id={id}
                      className={`${common} ${border}`}
                      value={values[f.name] ?? ""}
                      aria-invalid={!!err}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={id}
                      rows={3}
                      className={`${common} ${border}`}
                      placeholder={f.placeholder}
                      value={values[f.name] ?? ""}
                      aria-invalid={!!err}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  ) : f.type === "switch" ? (
                    <button
                      type="button"
                      id={id}
                      role="switch"
                      aria-checked={values[f.name] === "on"}
                      onClick={() => setValues((v) => ({ ...v, [f.name]: v[f.name] === "on" ? "off" : "on" }))}
                      className={`inline-flex h-7 w-12 items-center rounded-full border px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[oklch(0.72_0.168_265)]/25 ${
                        values[f.name] === "on"
                          ? "border-[oklch(0.72_0.168_265)] bg-[oklch(0.72_0.168_265)]"
                          : "border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)]"
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-full bg-white transition-transform ${values[f.name] === "on" ? "translate-x-5" : ""}`} />
                    </button>
                  ) : (
                    <input
                      id={id}
                      type={f.type === "number" ? "text" : "text"}
                      inputMode={f.type === "number" ? "numeric" : undefined}
                      className={`${common} ${border}`}
                      placeholder={f.placeholder}
                      value={values[f.name] ?? ""}
                      aria-invalid={!!err}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  )}
                  {(err || f.hint) && (
                    <span className={`text-[12.5px] ${err ? "text-[oklch(0.74_0.16_20)]" : "text-[oklch(0.72_0.02_285)]"}`}>
                      {err ?? f.hint}
                    </span>
                  )}
                </div>
              );
            })}
            <button type="submit" className="sr-only">Submit</button>
          </form>
        )}

        {phase === "confirm" && (
          <div className="flex items-start gap-2 rounded-xl border border-[oklch(0.34_0.09_85)] bg-[oklch(0.185_0.02_285)] p-3 text-[13.5px] text-[oklch(0.86_0.02_285)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.78_0.147_75)]" />
            <span>{spec.confirm}</span>
          </div>
        )}

        {phase === "processing" && (
          <div className="flex items-center gap-2 rounded-xl border border-[oklch(0.27_0.025_285)] bg-[oklch(0.185_0.02_285)] p-3 text-[13.5px] text-[oklch(0.86_0.02_285)]">
            <Loader2 className="h-4 w-4 animate-spin text-[oklch(0.72_0.168_265)]" /> Applying…
          </div>
        )}

        {phase === "success" && (
          <div className="flex items-start gap-2 rounded-xl border border-[oklch(0.38_0.1_155)] bg-[oklch(0.185_0.02_285)] p-3 text-[13.5px] text-[oklch(0.86_0.02_285)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.72_0.1725_155)]" />
            <span>
              <span className="font-semibold text-[oklch(0.965_0.012_285)]">{spec.label} staged.</span>{" "}
              {message}
              <span className="mt-1 block text-[12.5px] text-[oklch(0.72_0.02_285)]">
                Kept in this session&apos;s change log and audit view. No backend service is connected to the Chat Manager in this build, so nothing was written to a server.
              </span>
            </span>
          </div>
        )}

        {phase === "error" && (
          <div className="flex items-start gap-2 rounded-xl border border-[oklch(0.36_0.11_20)] bg-[oklch(0.185_0.02_285)] p-3 text-[13.5px] text-[oklch(0.86_0.02_285)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.74_0.16_20)]" /> {message}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {phase !== "success" && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant={spec.destructive && phase !== "success" ? "destructive" : "default"}
            disabled={busy}
            onClick={onPrimary}
          >
            {phase === "success" ? "Done"
              : phase === "error" ? "Try again"
              : phase === "confirm" ? "Yes, apply"
              : (spec.submitLabel ?? spec.label)}
          </Button>
        </DialogFooter>

        {phase === "form" && dirty && (
          <p className="text-[12.5px] text-[oklch(0.78_0.147_75)]">Unsaved changes in this form.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

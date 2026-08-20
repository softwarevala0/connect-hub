import {
  Users, Users2, Building2, Radio, ShieldCheck, KeyRound, GitCompare, CheckCircle2,
  Layers, Route as RouteIcon, Timer, Flag, Cog, Sparkles, Brain, Gauge, Activity,
  Server, Database, HardDrive, Globe2, AlertTriangle, PlugZap, Webhook, BarChart3,
  ShieldAlert, History, Search, Clock, Zap, CircleDot, TrendingUp,
} from "lucide-react";

/* ─────────── Ids owned by this module ─────────── */

export type ManagementSectionId =
  | "users" | "teams" | "channels" | "channel-policies"
  | "access-overview" | "config-versions" | "approval-center"
  | "queues" | "assignment-rules" | "routing-rules" | "sla" | "automation-center"
  | "ai-providers" | "ai-models" | "ai-usage" | "ai-limits" | "ai-health"
  | "incidents";

/* ─────────── Shared primitives (extracted to keep this file section-only) ─────────── */

import { Bar, Block, DataTable, MiniStats, Pill } from "./manager-ui";
import { RoleAssignmentPanel } from "./RoleAssignment";

export { Bar, DataTable, MiniStats, Pill } from "./manager-ui";
export { PermissionMatrixGrid } from "./PermissionMatrix";


/* ─────────── Section bodies ─────────── */

export function ManagementSection({ id }: { id: ManagementSectionId }) {
  switch (id) {
    /* 1 — User & Team Management */
    case "users":
      return (
        <>
          <MiniStats items={[
            { label: "Total users", value: "248", hint: "Across 9 departments", icon: Users },
            { label: "Active now", value: "126", tone: "emerald", icon: Activity },
            { label: "Invited", value: "12", tone: "amber", icon: Clock },
            { label: "Suspended", value: "3", tone: "rose", icon: ShieldAlert },
          ]} />
          <Block title="User Directory" icon={Users} action="Invite user">
            <DataTable
              headers={["User", "Role", "Department", "Team", "Status", "Last active"]}
              rows={[
                ["Rahul Mehta", "Admin", "IT", "Platform", <Pill tone="emerald">Active</Pill>, "2m ago"],
                ["Priya Nair", "Manager", "Support", "Tier-2", <Pill tone="emerald">Active</Pill>, "14m ago"],
                ["Arjun Shah", "Dev Lead", "Development", "Core", <Pill tone="emerald">Active</Pill>, "1h ago"],
                ["Neha Kapoor", "Sales", "Sales", "Enterprise", <Pill tone="amber">Invited</Pill>, "—"],
                ["Vikram Rao", "Support", "Support", "Tier-1", <Pill tone="rose">Suspended</Pill>, "6d ago"],
              ]}
              note="User status changes are audited and require an Admin approval when the role is elevated."
            />
          </Block>
          <Block title="User Status Controls" icon={ShieldCheck}>
            <DataTable
              headers={["Status", "Meaning", "Chat access", "Auto-transition"]}
              rows={[
                ["Active", "Fully onboarded member", <Pill tone="emerald">Allowed</Pill>, "—"],
                ["Invited", "Invitation pending acceptance", <Pill tone="slate">Blocked</Pill>, "Expires in 7 days"],
                ["Suspended", "Temporarily disabled by admin", <Pill tone="rose">Blocked</Pill>, "Manual reinstate"],
                ["Offboarded", "Left the organisation", <Pill tone="rose">Blocked</Pill>, "Records retained"],
              ]}
            />
          </Block>
        </>
      );
    case "teams":
      return (
        <>
          <MiniStats items={[
            { label: "Teams", value: "18", icon: Users2 },
            { label: "Departments", value: "9", icon: Building2 },
            { label: "Roles defined", value: "11", icon: KeyRound },
            { label: "Unassigned users", value: "4", tone: "amber", icon: AlertTriangle },
          ]} />
          <Block title="Teams" icon={Users2} action="Create team">
            <DataTable
              headers={["Team", "Department", "Lead", "Members", "Channels", "Status"]}
              rows={[
                ["Platform", "IT", "Rahul Mehta", "14", "6", <Pill tone="emerald">Active</Pill>],
                ["Tier-1 Support", "Support", "Priya Nair", "22", "4", <Pill tone="emerald">Active</Pill>],
                ["Core Engineering", "Development", "Arjun Shah", "19", "8", <Pill tone="emerald">Active</Pill>],
                ["Enterprise Sales", "Sales", "Neha Kapoor", "11", "3", <Pill tone="amber">Review</Pill>],
              ]}
            />
          </Block>
          <Block title="Departments" icon={Building2}>
            <DataTable
              headers={["Department", "Code", "Teams", "Owner", "Default queue"]}
              rows={[
                ["Support", "DPT-SUP", "4", "Priya Nair", "Q-SUPPORT"],
                ["Development", "DPT-DEV", "5", "Arjun Shah", "Q-ENG"],
                ["Sales", "DPT-SLS", "3", "Neha Kapoor", "Q-SALES"],
                ["Accounts", "DPT-ACC", "2", "Deepa Iyer", "Q-FIN"],
              ]}
            />
          </Block>
          <Block title="Roles" icon={KeyRound}>
            <DataTable
              headers={["Role", "Scope", "Users", "Elevation", "Approval required"]}
              rows={[
                ["Owner", "Workspace", "1", <Pill tone="rose">Highest</Pill>, "—"],
                ["Admin", "Workspace", "5", <Pill tone="amber">High</Pill>, "Owner"],
                ["Manager", "Department", "16", <Pill tone="indigo">Medium</Pill>, "Admin"],
                ["Member", "Team", "203", <Pill tone="slate">Standard</Pill>, "Manager"],
              ]}
            />
          </Block>
        </>
      );

    /* 2 — Channel Management */
    case "channels":
      return (
        <>
          <MiniStats items={[
            { label: "Channels", value: "64", icon: Radio },
            { label: "Public", value: "21", icon: Globe2 },
            { label: "Restricted", value: "37", tone: "amber", icon: ShieldCheck },
            { label: "Archived", value: "6", tone: "slate", icon: Layers },
          ]} />
          <Block title="Channel Registry" icon={Radio} action="Register channel">
            <DataTable
              headers={["Channel", "Type", "Owner", "Members", "Module", "Status"]}
              rows={[
                ["#ams-incidents", "Restricted", "Rahul Mehta", "38", "AMS", <Pill tone="emerald">Active</Pill>],
                ["#project-atlas", "Private", "Arjun Shah", "19", "Projects", <Pill tone="emerald">Active</Pill>],
                ["#support-escalations", "Restricted", "Priya Nair", "27", "Support", <Pill tone="emerald">Active</Pill>],
                ["#sales-handover", "Private", "Neha Kapoor", "12", "Sales", <Pill tone="amber">Review</Pill>],
                ["#finance-approvals", "Private", "Deepa Iyer", "8", "Accounts", <Pill tone="slate">Archived</Pill>],
              ]}
              note="Channel ownership must always resolve to an active user — orphan channels are flagged automatically."
            />
          </Block>
          <Block title="Channel Members & Access" icon={Users}>
            <DataTable
              headers={["Channel", "Owner", "Managers", "Members", "Guests", "Join policy"]}
              rows={[
                ["#ams-incidents", "Rahul Mehta", "2", "34", "2", "Request + approval"],
                ["#project-atlas", "Arjun Shah", "1", "18", "0", "Invite only"],
                ["#support-escalations", "Priya Nair", "3", "24", "0", "Auto-join (Support)"],
              ]}
            />
          </Block>
        </>
      );
    case "channel-policies":
      return (
        <>
          <Block title="Channel Policies" icon={ShieldCheck} action="New policy">
            <DataTable
              headers={["Policy", "Applies to", "Retention", "External guests", "Enforcement"]}
              rows={[
                ["Incident channels", "AMS · Support", "Permanent", <Pill tone="rose">Blocked</Pill>, <Pill tone="emerald">Hard-locked</Pill>],
                ["Project channels", "Projects", "Permanent", <Pill tone="amber">On approval</Pill>, <Pill tone="emerald">Enforced</Pill>],
                ["Client channels", "Sales · Accounts", "Permanent", <Pill tone="emerald">Allowed</Pill>, <Pill tone="emerald">Enforced</Pill>],
                ["Archived channels", "All", "Permanent", <Pill tone="rose">Blocked</Pill>, <Pill tone="slate">Read-only</Pill>],
              ]}
              note="Channel policies inherit the workspace message-immutability rules and cannot relax them."
            />
          </Block>
          <Block title="Lifecycle Rules" icon={Layers}>
            <DataTable
              headers={["Rule", "Trigger", "Action", "Status"]}
              rows={[
                ["Auto-archive idle channel", "No activity for 90 days", "Archive + notify owner", <Pill tone="emerald">On</Pill>],
                ["Orphan owner detection", "Owner offboarded", "Reassign to department head", <Pill tone="emerald">On</Pill>],
                ["Guest expiry", "Guest inactive 30 days", "Revoke channel access", <Pill tone="amber">Review</Pill>],
              ]}
            />
          </Block>
        </>
      );

    /* 3 — Routing & Queue Management */
    case "queues":
      return (
        <>
          <MiniStats items={[
            { label: "Queues", value: "12", icon: Layers },
            { label: "Waiting", value: "37", tone: "amber", icon: Clock },
            { label: "In progress", value: "84", icon: Activity },
            { label: "Breaching SLA", value: "2", tone: "rose", icon: AlertTriangle },
          ]} />
          <Block title="Queues" icon={Layers} action="New queue">
            <DataTable
              headers={["Queue", "Department", "Agents", "Waiting", "Avg wait", "SLA", "Load"]}
              rows={[
                ["Q-SUPPORT", "Support", "22", "14", "3m 20s", "15m", <Bar value={62} />],
                ["Q-ENG", "Development", "19", "6", "11m", "60m", <Bar value={41} />],
                ["Q-SALES", "Sales", "11", "9", "6m", "30m", <Bar value={78} tone="amber" />],
                ["Q-FIN", "Accounts", "6", "8", "22m", "120m", <Bar value={88} tone="rose" />],
              ]}
            />
          </Block>
        </>
      );
    case "assignment-rules":
      return (
        <Block title="Assignment Rules" icon={Users2} action="New rule">
          <DataTable
            headers={["Rule", "Match", "Assign to", "Strategy", "Priority", "Status"]}
            rows={[
              ["P0 incidents", "priority = P0", "On-call engineer", "Direct", "1", <Pill tone="emerald">Active</Pill>],
              ["Support intake", "module = Support", "Q-SUPPORT", "Round robin", "2", <Pill tone="emerald">Active</Pill>],
              ["Enterprise accounts", "tag = enterprise", "Enterprise Sales", "Least busy", "3", <Pill tone="emerald">Active</Pill>],
              ["Billing questions", "category = billing", "Q-FIN", "Skill based", "4", <Pill tone="amber">Draft</Pill>],
            ]}
            note="Rules evaluate top-down; the first match wins unless a rule is marked as continue-on-match."
          />
        </Block>
      );
    case "routing-rules":
      return (
        <>
          <Block title="Routing Rules" icon={RouteIcon} action="New route">
            <DataTable
              headers={["Route", "Source", "Condition", "Destination", "Fallback", "Status"]}
              rows={[
                ["AMS → Support", "AMS ticket", "severity ≥ high", "Q-SUPPORT", "Q-GENERAL", <Pill tone="emerald">Active</Pill>],
                ["Project escalation", "Projects", "milestone slipped", "Q-ENG", "Dev Lead", <Pill tone="emerald">Active</Pill>],
                ["Client intake", "Web widget", "office hours", "Q-SALES", "Voicemail flow", <Pill tone="emerald">Active</Pill>],
                ["After hours", "Any", "outside 10:00–19:00 IST", "On-call rota", "Queue hold", <Pill tone="amber">Partial</Pill>],
              ]}
            />
          </Block>
          <Block title="Priority Model" icon={Flag}>
            <DataTable
              headers={["Priority", "Definition", "First response", "Resolution", "Notify"]}
              rows={[
                [<Pill tone="rose">P0</Pill>, "Production down", "5m", "4h", "SMS + call"],
                [<Pill tone="amber">P1</Pill>, "Major degradation", "15m", "8h", "Push + email"],
                [<Pill tone="indigo">P2</Pill>, "Limited impact", "1h", "2d", "Email"],
                [<Pill tone="slate">P3</Pill>, "Request / query", "4h", "5d", "Digest"],
              ]}
            />
          </Block>
        </>
      );
    case "sla":
      return (
        <>
          <MiniStats items={[
            { label: "SLA attainment", value: "97.4%", tone: "emerald", icon: TrendingUp },
            { label: "At risk", value: "5", tone: "amber", icon: Clock },
            { label: "Breached (7d)", value: "3", tone: "rose", icon: AlertTriangle },
            { label: "Policies", value: "8", icon: Timer },
          ]} />
          <Block title="SLA Policies" icon={Timer} action="New SLA">
            <DataTable
              headers={["Policy", "Scope", "First response", "Resolution", "Business hours", "Attainment"]}
              rows={[
                ["Enterprise", "Tier-1 clients", "5m", "4h", "24×7", <Bar value={98} tone="emerald" />],
                ["Standard", "All clients", "30m", "1d", "10:00–19:00 IST", <Bar value={96} tone="emerald" />],
                ["Internal", "Employee requests", "2h", "3d", "Working days", <Bar value={91} tone="amber" />],
              ]}
            />
          </Block>
          <Block title="Escalation Ladder" icon={AlertTriangle}>
            <DataTable
              headers={["Stage", "Fires after", "Escalates to", "Channel", "Status"]}
              rows={[
                ["Stage 1", "50% of SLA", "Queue lead", "In-app", <Pill tone="emerald">On</Pill>],
                ["Stage 2", "80% of SLA", "Department manager", "Push + email", <Pill tone="emerald">On</Pill>],
                ["Stage 3", "SLA breached", "Head of Operations", "SMS + call", <Pill tone="emerald">On</Pill>],
                ["Stage 4", "2× SLA", "Executive bridge", "Incident bridge", <Pill tone="amber">Approval pending</Pill>],
              ]}
            />
          </Block>
        </>
      );
    case "automation-center":
      return (
        <>
          <MiniStats items={[
            { label: "Workflows", value: "34", icon: Cog },
            { label: "Runs (24h)", value: "8,412", icon: Zap },
            { label: "Failed (24h)", value: "17", tone: "rose", icon: AlertTriangle },
            { label: "Scheduled", value: "9", tone: "indigo", icon: Clock },
          ]} />
          <Block title="Workflows" icon={Cog} action="New workflow">
            <DataTable
              headers={["Workflow", "Trigger", "Actions", "Schedule", "Last run", "Status"]}
              rows={[
                ["Escalate stale P1", "SLA 80% reached", "Notify · Reassign", "Event", "3m ago", <Pill tone="emerald">Healthy</Pill>],
                ["Nightly audit export", "Cron", "Export · Upload SIEM", "02:00 IST daily", "18h ago", <Pill tone="emerald">Healthy</Pill>],
                ["Auto-tag billing", "Message intent", "Tag · Route", "Event", "1m ago", <Pill tone="emerald">Healthy</Pill>],
                ["Client CSAT request", "Conversation resolved", "Send survey", "Event", "22m ago", <Pill tone="amber">Degraded</Pill>],
                ["Offboard cleanup", "User offboarded", "Revoke · Reassign", "Event", "2d ago", <Pill tone="rose">Failing</Pill>],
              ]}
            />
          </Block>
          <Block title="Execution History" icon={History} action="View all runs">
            <DataTable
              headers={["Run", "Workflow", "Started", "Duration", "Result"]}
              rows={[
                ["RUN-84213", "Auto-tag billing", "22:31 IST", "0.4s", <Pill tone="emerald">Success</Pill>],
                ["RUN-84212", "Escalate stale P1", "22:28 IST", "1.2s", <Pill tone="emerald">Success</Pill>],
                ["RUN-84208", "Offboard cleanup", "21:55 IST", "3.8s", <Pill tone="rose">Failed · 502 from HRIS</Pill>],
                ["RUN-84201", "Client CSAT request", "21:40 IST", "2.1s", <Pill tone="amber">Retried</Pill>],
              ]}
              note="Failed automations retry with exponential backoff up to 5 attempts, then raise an incident."
            />
          </Block>
        </>
      );

    /* 4 — AI Control Center */
    case "ai-providers":
      return (
        <>
          <Block title="AI Providers" icon={Sparkles} action="Connect provider">
            <DataTable
              headers={["Provider", "Region", "Auth", "Models", "Status", "Latency"]}
              rows={[
                ["Primary Gateway", "ap-south-1", "Managed key", "6", <Pill tone="emerald">Connected</Pill>, "412 ms"],
                ["Secondary Gateway", "eu-west-1", "Managed key", "4", <Pill tone="emerald">Standby</Pill>, "620 ms"],
                ["On-prem inference", "Datacenter", "mTLS", "2", <Pill tone="amber">Limited</Pill>, "180 ms"],
              ]}
            />
          </Block>
          <Block title="Provider Policies" icon={ShieldCheck}>
            <DataTable
              headers={["Policy", "Value", "Enforcement"]}
              rows={[
                ["Data residency", "India-first, EU failover", <Pill tone="emerald">Hard-locked</Pill>],
                ["Training on workspace data", "Disabled", <Pill tone="emerald">Hard-locked</Pill>],
                ["PII redaction before inference", "Enabled", <Pill tone="emerald">Hard-locked</Pill>],
                ["Provider failover", "Automatic after 3 failures", <Pill tone="indigo">Configurable</Pill>],
              ]}
            />
          </Block>
        </>
      );
    case "ai-models":
      return (
        <Block title="AI Models" icon={Brain} action="Add model">
          <DataTable
            headers={["Model", "Provider", "Use case", "Default", "Cost / 1k", "Status"]}
            rows={[
              ["flash-latest", "Primary Gateway", "Summaries · smart reply", <Pill tone="emerald">Default</Pill>, "₹0.42", <Pill tone="emerald">Active</Pill>],
              ["pro-latest", "Primary Gateway", "Complex reasoning", <Pill tone="slate">—</Pill>, "₹3.10", <Pill tone="emerald">Active</Pill>],
              ["intent-small", "On-prem inference", "Routing & intent", <Pill tone="emerald">Default</Pill>, "₹0.05", <Pill tone="emerald">Active</Pill>],
              ["translate-lite", "Secondary Gateway", "EN ⇄ HI translation", <Pill tone="slate">—</Pill>, "₹0.18", <Pill tone="amber">Canary</Pill>],
            ]}
            note="Only one default model may be active per use case. Changing a default requires an Admin approval."
          />
        </Block>
      );
    case "ai-usage":
      return (
        <>
          <MiniStats items={[
            { label: "Requests (24h)", value: "24,880", icon: Zap },
            { label: "Tokens (24h)", value: "18.4M", icon: Gauge },
            { label: "Spend (MTD)", value: "₹42,310", tone: "amber", icon: TrendingUp },
            { label: "Avg latency", value: "480 ms", tone: "emerald", icon: Activity },
          ]} />
          <Block title="Usage by Capability" icon={BarChart3}>
            <DataTable
              headers={["Capability", "Requests (24h)", "Tokens", "Share", "Trend"]}
              rows={[
                ["Smart reply", "11,204", "6.1M", <Bar value={45} />, "▲ 8%"],
                ["Summaries", "6,942", "7.8M", <Bar value={28} />, "▲ 3%"],
                ["Intent routing", "5,110", "1.2M", <Bar value={20} />, "▼ 2%"],
                ["Translation", "1,624", "3.3M", <Bar value={7} />, "▲ 12%"],
              ]}
            />
          </Block>
        </>
      );
    case "ai-limits":
      return (
        <>
          <Block title="AI Limits" icon={Gauge} action="Edit limits">
            <DataTable
              headers={["Limit", "Scope", "Threshold", "Used", "On breach"]}
              rows={[
                ["Monthly spend", "Workspace", "₹75,000", <Bar value={56} />, "Notify + throttle"],
                ["Requests / minute", "Workspace", "1,200", <Bar value={38} />, "Queue"],
                ["Tokens / user / day", "Per user", "80,000", <Bar value={44} />, "Soft block"],
                ["Concurrent jobs", "Automation", "25", <Bar value={72} tone="amber" />, "Backpressure"],
              ]}
            />
          </Block>
          <Block title="AI Policies" icon={ShieldCheck}>
            <DataTable
              headers={["Policy", "State", "Applies to"]}
              rows={[
                ["Human review before client-facing AI reply", <Pill tone="emerald">Required</Pill>, "Sales · Support"],
                ["AI disabled on legal-hold conversations", <Pill tone="emerald">Enforced</Pill>, "All"],
                ["Prompt & response logging", <Pill tone="emerald">Enabled</Pill>, "Audit ledger"],
                ["Model change approval", <Pill tone="amber">Admin approval</Pill>, "All models"],
              ]}
            />
          </Block>
        </>
      );
    case "ai-health":
      return (
        <>
          <MiniStats items={[
            { label: "Gateway", value: "OK", tone: "emerald", icon: Activity },
            { label: "Error rate", value: "0.34%", tone: "emerald", icon: AlertTriangle },
            { label: "p95 latency", value: "1.1s", tone: "amber", icon: Clock },
            { label: "Fallbacks (24h)", value: "9", tone: "indigo", icon: RouteIcon },
          ]} />
          <Block title="Model Health" icon={Activity}>
            <DataTable
              headers={["Model", "Availability", "p95", "Errors (24h)", "State"]}
              rows={[
                ["flash-latest", <Bar value={99} tone="emerald" />, "0.9s", "31", <Pill tone="emerald">Healthy</Pill>],
                ["pro-latest", <Bar value={98} tone="emerald" />, "2.4s", "12", <Pill tone="emerald">Healthy</Pill>],
                ["intent-small", <Bar value={100} tone="emerald" />, "0.2s", "0", <Pill tone="emerald">Healthy</Pill>],
                ["translate-lite", <Bar value={93} tone="amber" />, "1.8s", "48", <Pill tone="amber">Degraded</Pill>],
              ]}
            />
          </Block>
        </>
      );

    /* 5 — Access overview / versioning / approvals */
    case "access-overview":
      return (
        <>
          <MiniStats items={[
            { label: "Roles", value: "11", icon: KeyRound },
            { label: "Elevated users", value: "6", tone: "amber", icon: ShieldAlert },
            { label: "Overrides", value: "14", icon: ShieldCheck },
            { label: "Stale access", value: "3", tone: "rose", icon: Clock },
          ]} />
          <Block title="Access Overview" icon={ShieldCheck} action="Run access review">
            <DataTable
              headers={["Role", "Users", "Modules", "Sensitive actions", "Last review"]}
              rows={[
                ["Owner", "1", "All", <Pill tone="rose">Full</Pill>, "12 Aug 2026"],
                ["Admin", "5", "All", <Pill tone="amber">Delete · Approve</Pill>, "12 Aug 2026"],
                ["Manager", "16", "8 of 12", <Pill tone="indigo">Approve</Pill>, "02 Aug 2026"],
                ["Support", "42", "4 of 12", <Pill tone="slate">Read · Update</Pill>, "28 Jul 2026"],
                ["Client", "97", "1 of 12", <Pill tone="slate">Read</Pill>, "28 Jul 2026"],
              ]}
              note="Access reviews are due quarterly. Roles past 90 days are flagged as stale access."
            />
          </Block>
          <RoleAssignmentPanel />
        </>
      );
    case "config-versions":
      return (
        <>
          <Block title="Configuration Versions" icon={GitCompare} action="Compare versions">
            <DataTable
              headers={["Version", "Scope", "Author", "Published", "Changes", "State"]}
              rows={[
                ["v14.2.1", "Workspace", "Rahul Mehta", "2h ago", "7", <Pill tone="emerald">Live</Pill>],
                ["v14.2.0", "Governance", "Priya Nair", "1d ago", "12", <Pill tone="slate">Superseded</Pill>],
                ["v14.3.0-rc1", "Workflow", "Arjun Shah", "—", "9", <Pill tone="amber">Draft</Pill>],
                ["v14.1.4", "Workspace", "Rahul Mehta", "6d ago", "4", <Pill tone="slate">Superseded</Pill>],
              ]}
              note="Publishing a version snapshots every policy, rule and matrix so it can be previewed or rolled back atomically."
            />
          </Block>
          <Block title="Version Actions" icon={History}>
            <DataTable
              headers={["Action", "Description", "Requires"]}
              rows={[
                ["Preview", "Render the workspace as it would behave on this version", "Manager"],
                ["Compare", "Field-level diff between any two versions", "Manager"],
                ["Publish", "Promote a draft version to live", "Admin approval"],
                ["Rollback", "Restore a previous published version", "Owner approval"],
              ]}
            />
          </Block>
        </>
      );
    case "approval-center":
      return (
        <>
          <MiniStats items={[
            { label: "Pending", value: "9", tone: "amber", icon: Clock },
            { label: "Approved (7d)", value: "31", tone: "emerald", icon: CheckCircle2 },
            { label: "Rejected (7d)", value: "4", tone: "rose", icon: AlertTriangle },
            { label: "Avg decision", value: "3h 12m", icon: Timer },
          ]} />
          <Block title="Pending Approvals" icon={CheckCircle2} action="Bulk review">
            <DataTable
              headers={["Request", "Type", "Requested by", "Age", "Approver", "Risk"]}
              rows={[
                ["Tighten P0 escalation SLA", "Policy", "Priya Nair", "2h", "Admin", <Pill tone="amber">Medium</Pill>],
                ["Publish v14.3.0-rc1", "Configuration", "Arjun Shah", "5h", "Owner", <Pill tone="rose">High</Pill>],
                ["Enable translate-lite default", "AI model", "Rahul Mehta", "1d", "Admin", <Pill tone="amber">Medium</Pill>],
                ["New workflow: Offboard cleanup v2", "Workflow", "Deepa Iyer", "1d", "Manager", <Pill tone="slate">Low</Pill>],
                ["Elevate 2 users to Manager", "Access", "Priya Nair", "2d", "Admin", <Pill tone="rose">High</Pill>],
              ]}
              note="Every approval decision is written to the audit ledger with before/after values."
            />
          </Block>
        </>
      );

    /* 6 — Incidents */
    case "incidents":
      return (
        <>
          <MiniStats items={[
            { label: "Open incidents", value: "2", tone: "rose", icon: AlertTriangle },
            { label: "Monitoring", value: "1", tone: "amber", icon: Activity },
            { label: "Resolved (30d)", value: "14", tone: "emerald", icon: CheckCircle2 },
            { label: "MTTR", value: "42m", icon: Timer },
          ]} />
          <Block title="Critical Incidents" icon={ShieldAlert} action="Declare incident">
            <DataTable
              headers={["Incident", "Severity", "Component", "Opened", "Owner", "Status"]}
              rows={[
                ["INC-2041 · HRIS sync failing", <Pill tone="rose">SEV-1</Pill>, "Automation", "41m ago", "Rahul Mehta", <Pill tone="rose">Investigating</Pill>],
                ["INC-2040 · Translation latency", <Pill tone="amber">SEV-3</Pill>, "AI Gateway", "3h ago", "Arjun Shah", <Pill tone="amber">Monitoring</Pill>],
                ["INC-2038 · Attachment upload errors", <Pill tone="amber">SEV-2</Pill>, "Storage", "1d ago", "Priya Nair", <Pill tone="emerald">Resolved</Pill>],
              ]}
            />
          </Block>
          <Block title="Resolution Timeline · INC-2041" icon={History}>
            <DataTable
              headers={["Time", "Event", "Actor"]}
              rows={[
                ["21:55 IST", "Automation run RUN-84208 failed with 502", "System"],
                ["22:02 IST", "Incident auto-declared at SEV-1", "System"],
                ["22:06 IST", "On-call paged, bridge opened", "Escalation rule"],
                ["22:18 IST", "HRIS vendor confirmed upstream outage", "Rahul Mehta"],
                ["22:31 IST", "Workflow paused, retries queued", "Rahul Mehta"],
              ]}
            />
          </Block>
        </>
      );
  }
}

/* ─────────── Upgraded bodies for existing Operations sections ─────────── */

export function SystemHealthCenter() {
  return (
    <>
      <MiniStats items={[
        { label: "Overall", value: "Healthy", tone: "emerald", icon: Activity },
        { label: "Uptime (30d)", value: "99.98%", tone: "emerald", icon: TrendingUp },
        { label: "Open incidents", value: "2", tone: "rose", icon: AlertTriangle },
        { label: "Realtime clients", value: "1,284", icon: Zap },
      ]} />
      <Block title="Subsystem Health" icon={Server}>
        <DataTable
          headers={["Subsystem", "Status", "Latency", "Error rate", "Availability"]}
          rows={[
            ["Realtime fabric", <Pill tone="emerald">Operational</Pill>, "42 ms", "0.01%", <Bar value={100} tone="emerald" />],
            ["API gateway", <Pill tone="emerald">Operational</Pill>, "118 ms", "0.06%", <Bar value={99} tone="emerald" />],
            ["Database", <Pill tone="emerald">Operational</Pill>, "9 ms", "0.00%", <Bar value={100} tone="emerald" />],
            ["Queue workers", <Pill tone="amber">Degraded</Pill>, "1.4 s", "1.20%", <Bar value={94} tone="amber" />],
            ["Object storage", <Pill tone="emerald">Operational</Pill>, "62 ms", "0.02%", <Bar value={99} tone="emerald" />],
          ]}
        />
      </Block>
      <Block title="Regional Health" icon={Globe2}>
        <DataTable
          headers={["Region", "Role", "Status", "Replication lag", "Traffic"]}
          rows={[
            ["ap-south-1", "Primary", <Pill tone="emerald">Operational</Pill>, "—", <Bar value={78} />],
            ["ap-southeast-1", "Read replica", <Pill tone="emerald">Operational</Pill>, "180 ms", <Bar value={14} />],
            ["eu-west-1", "DR standby", <Pill tone="amber">Standby</Pill>, "1.4 s", <Bar value={8} />],
          ]}
        />
      </Block>
      <Block title="Storage" icon={HardDrive}>
        <DataTable
          headers={["Store", "Used", "Quota", "Growth (30d)", "Utilisation"]}
          rows={[
            ["Messages", "412 GB", "2 TB", "+18 GB", <Bar value={21} />],
            ["Attachments", "1.6 TB", "5 TB", "+96 GB", <Bar value={32} />],
            ["Audit ledger", "220 GB", "1 TB", "+11 GB", <Bar value={22} />],
            ["Search index", "310 GB", "750 GB", "+14 GB", <Bar value={41} />],
          ]}
        />
      </Block>
    </>
  );
}

export function IntegrationHub() {
  return (
    <>
      <MiniStats items={[
        { label: "Integrations", value: "17", icon: PlugZap },
        { label: "Webhooks", value: "23", icon: Webhook },
        { label: "Failing", value: "1", tone: "rose", icon: AlertTriangle },
        { label: "Events (24h)", value: "64,220", icon: Zap },
      ]} />
      <Block title="External Integrations" icon={PlugZap} action="Add integration">
        <DataTable
          headers={["Integration", "Direction", "Auth", "Connection", "Last sync", "Sync state"]}
          rows={[
            ["AMS Core", "Bi-directional", "OAuth 2.0", <Pill tone="emerald">Connected</Pill>, "1m ago", <Pill tone="emerald">In sync</Pill>],
            ["Project Tracker", "Inbound", "API key", <Pill tone="emerald">Connected</Pill>, "4m ago", <Pill tone="emerald">In sync</Pill>],
            ["HRIS", "Inbound", "OAuth 2.0", <Pill tone="rose">Failing</Pill>, "41m ago", <Pill tone="rose">Stalled</Pill>],
            ["SIEM stream", "Outbound", "mTLS", <Pill tone="emerald">Connected</Pill>, "Live", <Pill tone="emerald">Streaming</Pill>],
            ["Billing suite", "Bi-directional", "API key", <Pill tone="amber">Key ageing</Pill>, "12m ago", <Pill tone="emerald">In sync</Pill>],
          ]}
        />
      </Block>
      <Block title="APIs & Webhooks" icon={Webhook} action="New webhook">
        <DataTable
          headers={["Endpoint", "Type", "Events", "Deliveries (24h)", "Failures", "Status"]}
          rows={[
            ["/api/public/ams-events", "Inbound API", "ticket.*", "18,204", "3", <Pill tone="emerald">Healthy</Pill>],
            ["/api/public/webhooks/hris", "Inbound webhook", "employee.*", "412", "112", <Pill tone="rose">Failing</Pill>],
            ["https://siem.internal/ingest", "Outbound webhook", "audit.*", "44,918", "0", <Pill tone="emerald">Healthy</Pill>],
            ["https://billing.internal/hook", "Outbound webhook", "invoice.*", "686", "2", <Pill tone="emerald">Healthy</Pill>],
          ]}
        />
      </Block>
      <Block title="Integration Logs" icon={History} action="Open log explorer">
        <DataTable
          headers={["Time", "Integration", "Event", "Result"]}
          rows={[
            ["22:34 IST", "SIEM stream", "audit.batch.flush", <Pill tone="emerald">200 OK</Pill>],
            ["22:33 IST", "HRIS", "employee.updated", <Pill tone="rose">502 Bad Gateway</Pill>],
            ["22:31 IST", "AMS Core", "ticket.escalated", <Pill tone="emerald">200 OK</Pill>],
            ["22:28 IST", "Billing suite", "invoice.created", <Pill tone="emerald">201 Created</Pill>],
          ]}
        />
      </Block>
    </>
  );
}

export function AnalyticsCenter() {
  return (
    <>
      <MiniStats items={[
        { label: "Conversations (7d)", value: "6,412", icon: BarChart3 },
        { label: "First response", value: "4m 10s", tone: "emerald", icon: Timer },
        { label: "SLA attainment", value: "97.4%", tone: "emerald", icon: TrendingUp },
        { label: "CSAT", value: "4.6 / 5", tone: "indigo", icon: Sparkles },
      ]} />
      <Block title="Communication Metrics" icon={BarChart3}>
        <DataTable
          headers={["Metric", "This week", "Last week", "Trend"]}
          rows={[
            ["Conversations opened", "6,412", "5,980", "▲ 7.2%"],
            ["Messages sent", "184,220", "171,004", "▲ 7.7%"],
            ["Avg handling time", "18m 40s", "20m 12s", "▼ 7.6%"],
            ["Reopened conversations", "112", "138", "▼ 18.8%"],
          ]}
        />
      </Block>
      <Block title="Team Performance" icon={Users2}>
        <DataTable
          headers={["Team", "Handled", "First response", "SLA", "CSAT", "Load"]}
          rows={[
            ["Tier-1 Support", "2,940", "3m 05s", "98%", "4.7", <Bar value={82} />],
            ["Core Engineering", "1,208", "12m", "95%", "4.4", <Bar value={64} />],
            ["Enterprise Sales", "884", "6m 40s", "97%", "4.6", <Bar value={57} />],
            ["Accounts", "402", "24m", "91%", "4.2", <Bar value={38} tone="amber" />],
          ]}
        />
      </Block>
      <Block title="AI Usage & Trends" icon={Brain}>
        <DataTable
          headers={["Signal", "Value", "30-day trend"]}
          rows={[
            ["AI-assisted replies", "38% of all replies", <Bar value={38} />],
            ["Summaries generated", "4,120", <Bar value={62} />],
            ["Deflection via smart reply", "11%", <Bar value={11} />],
            ["AI spend vs budget", "₹42,310 / ₹75,000", <Bar value={56} tone="amber" />],
          ]}
        />
      </Block>
    </>
  );
}

/** Audit explorer now lives in ./AuditExplorer with working filters. */
export { AuditExplorer } from "./AuditExplorer";


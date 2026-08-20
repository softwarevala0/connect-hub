/**
 * Chat Manager — action registry.
 *
 * Every management action rendered by the Chat Manager resolves to a real
 * ActionSpec here, so no visible button is left dead. Specs describe the UI
 * flow only (form fields, confirmation, detail panel). Applying a spec stages
 * the change in the session change log inside `manager-actions.tsx`; there is
 * no backend wired to the Chat Manager in this repository and nothing here
 * pretends otherwise.
 */
import type { ActionSpec } from "./manager-actions";

export const ACTION_SPECS: Record<string, ActionSpec> = {
  "Invite user": {
    label: "Invite user",
    title: "Invite user",
    description: "Send a workspace invitation with a pre-assigned role and department.",
    module: "Users",
    action: "user.invite",
    submitLabel: "Send invite",
    fields: [
      { name: "email", label: "Work email", required: true, placeholder: "name@softwarevala.com" },
      { name: "name", label: "Full name", required: true, placeholder: "Priya Nair" },
      { name: "role", label: "Role", type: "select", required: true, options: ["Admin", "Manager", "Dev Lead", "Developer", "Support", "Sales", "Accounts", "Client"] },
      { name: "department", label: "Department", type: "select", required: true, options: ["Engineering", "Delivery", "Support", "Sales", "Finance", "Operations"] },
      { name: "note", label: "Invitation note", type: "textarea", hint: "Optional message included in the invite email." },
    ],
  },
  "Create team": {
    label: "Create team",
    description: "Define a team used for routing, ownership and queue assignment.",
    module: "Teams",
    action: "team.create",
    submitLabel: "Create team",
    fields: [
      { name: "name", label: "Team name", required: true, placeholder: "Escalation Response" },
      { name: "department", label: "Department", type: "select", required: true, options: ["Engineering", "Delivery", "Support", "Sales", "Finance", "Operations"] },
      { name: "lead", label: "Team lead", required: true, placeholder: "Existing user" },
      { name: "purpose", label: "Purpose", type: "textarea" },
    ],
  },
  "Register channel": {
    label: "Register channel",
    description: "Register a channel in the control plane and bind it to a module.",
    module: "Channels",
    action: "channel.register",
    submitLabel: "Register",
    fields: [
      { name: "name", label: "Channel name", required: true, placeholder: "#support-escalations" },
      { name: "module", label: "Bound module", type: "select", required: true, options: ["AMS", "Projects", "Support Desk", "Sales", "Accounts", "Development"] },
      { name: "owner", label: "Owner", required: true },
      { name: "visibility", label: "Visibility", type: "select", options: ["Private", "Department", "Workspace"], defaultValue: "Department" },
      { name: "guests", label: "Allow guests", type: "switch" },
    ],
  },
  "New policy": {
    label: "New policy",
    description: "Create a channel policy governing access, retention and guests.",
    module: "Channel Policies",
    action: "policy.create",
    submitLabel: "Create policy",
    confirm: "Policies apply to every channel in scope as soon as they are published. Continue?",
    fields: [
      { name: "name", label: "Policy name", required: true },
      { name: "scope", label: "Scope", type: "select", required: true, options: ["All channels", "Module bound", "Department", "Single channel"] },
      { name: "retention", label: "Retention (days)", type: "number", required: true, defaultValue: "365" },
      { name: "rule", label: "Rule description", type: "textarea", required: true },
    ],
  },
  "New queue": {
    label: "New queue",
    description: "Add a work queue with its owning team and capacity settings.",
    module: "Queues",
    action: "queue.create",
    submitLabel: "Create queue",
    fields: [
      { name: "name", label: "Queue name", required: true },
      { name: "team", label: "Owning team", required: true },
      { name: "capacity", label: "Max concurrent items", type: "number", defaultValue: "25" },
      { name: "sla", label: "SLA policy", type: "select", options: ["P0 Critical", "P1 High", "P2 Normal", "P3 Low"] },
    ],
  },
  "New rule": {
    label: "New rule",
    description: "Create an assignment rule that places conversations onto a queue or agent.",
    module: "Assignment Rules",
    action: "assignment.rule.create",
    submitLabel: "Create rule",
    fields: [
      { name: "name", label: "Rule name", required: true },
      { name: "condition", label: "Condition", required: true, placeholder: "module = Support AND priority = P0" },
      { name: "target", label: "Assign to", required: true, placeholder: "Queue, team or agent" },
      { name: "priority", label: "Evaluation order", type: "number", defaultValue: "10" },
    ],
  },
  "New route": {
    label: "New route",
    description: "Define a source → destination route with condition and fallback.",
    module: "Routing Rules",
    action: "routing.route.create",
    submitLabel: "Create route",
    fields: [
      { name: "source", label: "Source", required: true },
      { name: "destination", label: "Destination", required: true },
      { name: "condition", label: "Condition", placeholder: "priority >= P1" },
      { name: "fallback", label: "Fallback", placeholder: "Support Desk queue" },
    ],
  },
  "New SLA": {
    label: "New SLA",
    description: "Add an SLA target and its escalation ladder.",
    module: "SLA & Escalation",
    action: "sla.create",
    submitLabel: "Create SLA",
    fields: [
      { name: "name", label: "SLA name", required: true },
      { name: "firstResponse", label: "First response target (minutes)", type: "number", required: true, defaultValue: "15" },
      { name: "resolution", label: "Resolution target (hours)", type: "number", required: true, defaultValue: "8" },
      { name: "escalateTo", label: "Escalate to", required: true, placeholder: "Department Lead" },
    ],
  },
  "New workflow": {
    label: "New workflow",
    description: "Create an automation workflow: trigger, condition, action.",
    module: "Automation Center",
    action: "automation.workflow.create",
    submitLabel: "Create workflow",
    fields: [
      { name: "name", label: "Workflow name", required: true },
      { name: "trigger", label: "Trigger", type: "select", required: true, options: ["Conversation created", "SLA breached", "Priority changed", "Member added", "Schedule"] },
      { name: "condition", label: "Condition", placeholder: "module = AMS" },
      { name: "action", label: "Action", required: true, placeholder: "Notify escalation channel" },
      { name: "enabled", label: "Enable immediately", type: "switch", defaultValue: "on" },
    ],
  },
  "View all runs": {
    label: "View all runs",
    title: "Execution history",
    description: "Session view of workflow execution history for the automation center.",
    module: "Automation Center",
    action: "automation.runs.view",
    submitLabel: "Close",
    detail: (
      <div className="flex flex-col gap-1.5">
        <p>Execution history is rendered from the automation center state in this build.</p>
        <p className="text-[oklch(0.72_0.02_285)]">
          No run store is connected, so only the runs already listed in the section are available.
          Connect the automation service to page through the full history.
        </p>
      </div>
    ),
  },
  "Connect provider": {
    label: "Connect provider",
    description: "Register an AI gateway provider for the workspace.",
    module: "AI Providers",
    action: "ai.provider.connect",
    submitLabel: "Connect",
    fields: [
      { name: "provider", label: "Provider", type: "select", required: true, options: ["Lovable AI Gateway", "Azure OpenAI", "AWS Bedrock", "Self-hosted"] },
      { name: "region", label: "Region", type: "select", options: ["ap-south-1", "eu-west-1", "us-east-1"] },
      { name: "alias", label: "Display alias", required: true },
      { name: "notes", label: "Policy notes", type: "textarea" },
    ],
  },
  "Add model": {
    label: "Add model",
    description: "Make a model available to Chat Manager capabilities.",
    module: "AI Models",
    action: "ai.model.add",
    submitLabel: "Add model",
    fields: [
      { name: "model", label: "Model id", required: true, placeholder: "translate-lite" },
      { name: "useCase", label: "Use case", type: "select", required: true, options: ["Smart reply", "Summarisation", "Translation", "Intent routing", "Redaction"] },
      { name: "default", label: "Set as default for use case", type: "switch" },
    ],
  },
  "Edit limits": {
    label: "Edit limits",
    description: "Adjust AI spend, token and rate ceilings for the workspace.",
    module: "AI Limits",
    action: "ai.limits.update",
    submitLabel: "Apply limits",
    confirm: "Lowering a ceiling can immediately throttle live AI features. Apply the new limits?",
    fields: [
      { name: "monthlySpend", label: "Monthly spend ceiling (₹)", type: "number", required: true, defaultValue: "150000" },
      { name: "dailyTokens", label: "Daily token ceiling", type: "number", required: true, defaultValue: "8000000" },
      { name: "rate", label: "Requests / minute", type: "number", required: true, defaultValue: "600" },
      { name: "hardStop", label: "Hard stop at ceiling", type: "switch", defaultValue: "on" },
    ],
  },
  "Run access review": {
    label: "Run access review",
    description: "Start an access review cycle across roles and modules.",
    module: "Access Overview",
    action: "access.review.run",
    submitLabel: "Start review",
    confirm: "Reviewers will be asked to re-certify every role assignment in scope. Start the review?",
    fields: [
      { name: "scope", label: "Scope", type: "select", required: true, options: ["All roles", "Privileged roles only", "Single department"] },
      { name: "due", label: "Due in (days)", type: "number", required: true, defaultValue: "14" },
      { name: "reviewer", label: "Primary reviewer", required: true },
    ],
  },
  "Compare versions": {
    label: "Compare versions",
    description: "Compare two control-plane configuration versions.",
    module: "Configuration Versions",
    action: "config.version.compare",
    submitLabel: "Compare",
    fields: [
      { name: "base", label: "Base version", type: "select", required: true, options: ["v42 (current)", "v41", "v40", "v39"] },
      { name: "target", label: "Compare against", type: "select", required: true, options: ["v41", "v40", "v39", "v38"] },
    ],
  },
  Publish: {
    label: "Publish",
    title: "Publish configuration version",
    description: "Publish the selected configuration version to the control plane.",
    module: "Configuration Versions",
    action: "config.version.publish",
    submitLabel: "Publish version",
    confirm: "Publishing replaces the live control-plane configuration for every module. Continue?",
    fields: [
      { name: "version", label: "Version", type: "select", required: true, options: ["v42 (draft)", "v41", "v40"] },
      { name: "changelog", label: "Changelog", type: "textarea", required: true },
    ],
  },
  "Bulk review": {
    label: "Bulk review",
    description: "Decide on all pending approvals in one pass.",
    module: "Approval Center",
    action: "approval.bulk.review",
    submitLabel: "Apply decision",
    confirm: "The decision is applied to every pending approval in the selected scope. Continue?",
    destructive: true,
    fields: [
      { name: "decision", label: "Decision", type: "select", required: true, options: ["Approve all", "Reject all", "Send back for changes"] },
      { name: "scope", label: "Scope", type: "select", required: true, options: ["All pending", "Policy changes", "AI changes", "Workflow changes"] },
      { name: "comment", label: "Reviewer comment", type: "textarea", required: true },
    ],
  },
  "Declare incident": {
    label: "Declare incident",
    description: "Open a critical incident and notify the response team.",
    module: "Incident Center",
    action: "incident.declare",
    submitLabel: "Declare incident",
    destructive: true,
    confirm: "Declaring an incident pages the on-call responders for the selected severity. Continue?",
    fields: [
      { name: "title", label: "Incident title", required: true },
      { name: "severity", label: "Severity", type: "select", required: true, options: ["SEV1", "SEV2", "SEV3"] },
      { name: "module", label: "Affected module", type: "select", required: true, options: ["AMS", "Projects", "Support Desk", "Sales", "Accounts", "Development"] },
      { name: "summary", label: "Summary", type: "textarea", required: true },
    ],
  },
  "Add integration": {
    label: "Add integration",
    description: "Connect an external system to the Communication Hub.",
    module: "Integration Hub",
    action: "integration.create",
    submitLabel: "Add integration",
    fields: [
      { name: "system", label: "System", required: true, placeholder: "Jira, Zoho, ServiceNow…" },
      { name: "direction", label: "Sync direction", type: "select", required: true, options: ["Inbound", "Outbound", "Bi-directional"] },
      { name: "owner", label: "Technical owner", required: true },
    ],
  },
  "New webhook": {
    label: "New webhook",
    description: "Register an outbound webhook endpoint.",
    module: "Integration Hub",
    action: "integration.webhook.create",
    submitLabel: "Register webhook",
    fields: [
      { name: "url", label: "Endpoint URL", required: true, placeholder: "https://…" },
      { name: "events", label: "Events", required: true, placeholder: "conversation.created, sla.breached" },
      { name: "secret", label: "Signing secret", required: true },
      { name: "active", label: "Active", type: "switch", defaultValue: "on" },
    ],
  },
  "Open log explorer": {
    label: "Open log explorer",
    title: "Integration log explorer",
    description: "Filter integration delivery logs in the audit explorer.",
    module: "Integration Hub",
    action: "integration.logs.open",
    navigateTo: "audit",
  },
  "Export ledger": {
    label: "Export ledger",
    description: "Export the currently filtered audit ledger view.",
    module: "Audit",
    action: "audit.export",
    submitLabel: "Prepare export",
    fields: [
      { name: "format", label: "Format", type: "select", required: true, options: ["CSV", "JSON", "NDJSON"], defaultValue: "CSV" },
      { name: "range", label: "Range", type: "select", required: true, options: ["Current filters", "Last 24 hours", "Last 7 days", "Last 30 days"], defaultValue: "Current filters" },
    ],
  },
  "Add user": {
    label: "Add user",
    description: "Add an existing directory user to this workspace scope.",
    module: "Users",
    action: "user.add",
    submitLabel: "Add",
    fields: [
      { name: "user", label: "User", required: true },
      { name: "role", label: "Role", type: "select", required: true, options: ["Admin", "Manager", "Dev Lead", "Developer", "Support", "Sales", "Accounts", "Client"] },
    ],
  },
};

/** Resolve a registry entry by its label; unknown labels get a safe generic spec. */
export function resolveActionSpec(label: string, module = "Chat Manager"): ActionSpec {
  return (
    ACTION_SPECS[label] ?? {
      label,
      module,
      action: label.toLowerCase().replace(/\s+/g, "."),
      description: `${label} — ${module}`,
      submitLabel: label,
    }
  );
}

/** Configuration flow for a module card in the module control grid. */
export function moduleConfigSpec(m: {
  name: string; code: string; status: string; visibility: string; roles: number;
}): ActionSpec {
  return {
    label: "Configure",
    title: `Configure ${m.name}`,
    description: `Module ${m.code} — status, visibility and role exposure for the control plane.`,
    module: "Module Registry",
    action: "module.configure",
    submitLabel: "Apply configuration",
    confirm: `Changing ${m.name} affects every channel bound to ${m.code}. Continue?`,
    fields: [
      { name: "status", label: "Status", type: "select", required: true, options: ["Enabled", "Restricted", "Disabled"], defaultValue: m.status },
      { name: "visibility", label: "Visibility", required: true, defaultValue: m.visibility },
      { name: "roles", label: "Roles assigned", type: "number", defaultValue: String(m.roles) },
      { name: "guests", label: "Allow guest access", type: "switch" },
      { name: "reason", label: "Change reason", type: "textarea", required: true, hint: "Recorded in the audit ledger with before/after values." },
    ],
  };
}

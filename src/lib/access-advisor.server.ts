import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

export const ROLES = ["Admin", "Manager", "Dev Lead", "Support", "Sales", "Client"] as const;
export const MODULES = ["Conversations", "Channels", "Policies", "Automation", "Integrations", "Analytics"] as const;
export const ACTIONS = ["Read", "Create", "Update", "Delete", "Approve"] as const;

const schema = z.object({
  summary: z.string(),
  role: z.enum(ROLES),
  grants: z.array(
    z.object({
      module: z.enum(MODULES),
      actions: z.array(z.enum(ACTIONS)),
      reason: z.string(),
    }),
  ),
  risks: z.array(z.string()),
});
export type AccessRecommendation = z.infer<typeof schema>;

export class AdvisorError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function recommendAccess(description: string): Promise<AccessRecommendation> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new AdvisorError("AI is not configured for this app.", 401);

  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
      if (!res.ok) {
        const body = await res.clone().text().catch(() => "");
        let msg = "The AI service could not complete the request.";
        try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? msg; } catch { /* keep */ }
        if (res.status === 429) msg = "Too many requests right now — please try again shortly.";
        if (res.status === 402) msg = msg || "AI credits are used up for this workspace.";
        throw new AdvisorError(msg, res.status);
      }
      return res;
    },
  });

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: `You are a security advisor applying the principle of least privilege.
Permission matrix: roles ${ROLES.join(", ")}; modules ${MODULES.join(", ")}; actions ${ACTIONS.join(", ")}.
Given a team's described responsibilities, pick the single closest base role and list ONLY the module/action grants strictly needed. Omit modules with no needed actions. Prefer Read over write actions; grant Delete or Approve only when explicitly required. Keep each reason under 20 words, summary under 40 words, and list up to 4 risks or caveats.`,
    messages: [{ role: "user", content: description }],
    output: Output.object({ schema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    const out = await result.output;
    return { ...out, grants: out.grants.filter((g) => g.actions.length > 0) };
  } catch (e) {
    if (e instanceof AdvisorError) throw e;
    const cause = (e as { cause?: unknown })?.cause;
    if (cause instanceof AdvisorError) throw cause;
    if (NoObjectGeneratedError.isInstance(e)) throw new AdvisorError("The AI returned an unreadable recommendation. Try rephrasing.", 502);
    throw e;
  }
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAccessRecommendation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    description: z.string().trim().min(10).max(2000),
    baseRole: z.string().max(40).optional(),
    defaults: z.array(z.object({
      role: z.string().max(40),
      grants: z.array(z.object({ module: z.string().max(40), actions: z.array(z.string().max(20)).max(10) })).max(20),
    })).max(20).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const { recommendAccess, AdvisorError } = await import("./access-advisor.server");
    try {
      return { ok: true as const, rec: await recommendAccess(data.description, { baseRole: data.baseRole, defaults: data.defaults }) };
    } catch (e) {
      if (e instanceof AdvisorError) return { ok: false as const, status: e.status, error: e.message };
      console.error(e);
      return { ok: false as const, status: 500, error: "Something went wrong generating a recommendation." };
    }
  });

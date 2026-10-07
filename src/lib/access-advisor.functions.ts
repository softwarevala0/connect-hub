import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAccessRecommendation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ description: z.string().trim().min(10).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const { recommendAccess, AdvisorError } = await import("./access-advisor.server");
    try {
      return { ok: true as const, rec: await recommendAccess(data.description) };
    } catch (e) {
      if (e instanceof AdvisorError) return { ok: false as const, status: e.status, error: e.message };
      console.error(e);
      return { ok: false as const, status: 500, error: "Something went wrong generating a recommendation." };
    }
  });

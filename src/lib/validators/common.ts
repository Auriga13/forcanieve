import { z } from "zod";

export const uuidParam = z.string().uuid("ID inválido");

export const cronAuthSchema = z.object({
  authorization: z.string().refine(
    (val) => val === `Bearer ${process.env.CRON_SECRET}`,
    "Unauthorized"
  ),
});

import { z } from "zod";

export const subscribeSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .max(254, "Email demasiado largo")
    .transform((e) => e.toLowerCase().trim()),
  zones: z
    .array(z.string().uuid("ID de zona inválido"))
    .min(1, "Selecciona al menos una zona")
    .max(8, "Máximo 8 zonas"),
  frequency: z.enum(["daily", "weekly"], {
    error: "Frecuencia debe ser 'daily' o 'weekly'",
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscribeSchema } from "@/lib/validators/subscription";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, zones, frequency } = parsed.data;

    // Rate limit by email
    const emailLimit = checkRateLimit(`subscribe:${email}`, {
      windowMs: 3600000,
      max: 5,
    });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Inténtalo más tarde." },
        { status: 429 }
      );
    }

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ipLimit = checkRateLimit(`subscribe-ip:${ip}`, {
      windowMs: 3600000,
      max: 20,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Inténtalo más tarde." },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Validate zone IDs exist
    const { data: validZones } = await supabase
      .from("zones")
      .select("id")
      .in("id", zones);

    if (!validZones || validZones.length !== zones.length) {
      return NextResponse.json(
        { error: "Una o más zonas no son válidas" },
        { status: 400 }
      );
    }

    // Generate verification token
    const verifyToken = randomBytes(32).toString("hex");
    const verifyExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    // Upsert subscriber
    const { error: insertError } = await supabase.from("subscribers").upsert(
      {
        email,
        zones,
        frequency,
        verify_token: verifyToken,
        verify_expires_at: verifyExpiresAt,
        is_verified: false,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (insertError) {
      console.error("Error inserting subscriber:", insertError);
      return NextResponse.json(
        { error: "Error al crear la suscripción" },
        { status: 500 }
      );
    }

    // TODO: Send magic link email via Resend (Phase 4)
    // For now, log the verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    console.log(
      `Verification link: ${appUrl}/api/subscribe/verify?token=${verifyToken}`
    );

    return NextResponse.json(
      { message: "Te hemos enviado un enlace de verificación a tu correo." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unhandled error in /api/subscribe:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

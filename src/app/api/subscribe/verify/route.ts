import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token de verificación requerido" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find subscriber with this token
    const { data: subscriber, error } = await supabase
      .from("subscribers")
      .select("*")
      .eq("verify_token", token)
      .single();

    if (error || !subscriber) {
      return NextResponse.json(
        { error: "Enlace de verificación inválido o expirado." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(subscriber.verify_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Enlace de verificación expirado. Suscríbete de nuevo." },
        { status: 400 }
      );
    }

    // Verify the subscriber
    await supabase
      .from("subscribers")
      .update({
        is_verified: true,
        verify_token: null,
        verify_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id);

    // Redirect to manage page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/suscripcion/gestionar?verified=true`
    );
  } catch (err) {
    console.error("Unhandled error in /api/subscribe/verify:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

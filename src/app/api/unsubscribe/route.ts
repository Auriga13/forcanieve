import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token de desuscripción requerido" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("subscribers")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", token);

    if (error) {
      return NextResponse.json(
        { error: "Token de desuscripción inválido." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/suscripcion?unsubscribed=true`);
  } catch (err) {
    console.error("Unhandled error in /api/unsubscribe:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

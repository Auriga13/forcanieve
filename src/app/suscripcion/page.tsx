"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

// Zone list — hardcoded for the form (avoids extra API call)
const ZONES = [
  { slug: "anso-hecho", name: "Valle de Ansó / Hecho" },
  { slug: "canfranc", name: "Canfranc / Astún / Candanchú" },
  { slug: "tena", name: "Valle de Tena / Formigal-Panticosa" },
  { slug: "ordesa", name: "Ordesa / Monte Perdido / Bujaruelo" },
  { slug: "bielsa", name: "Bielsa / Pineta" },
  { slug: "benasque", name: "Benasque / Maladeta / Aneto" },
  { slug: "posets", name: "Posets / Eriste" },
  { slug: "cerler", name: "Cerler / Ampriu" },
];

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Cargando...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const unsubscribed = searchParams.get("unsubscribed") === "true";

  const [email, setEmail] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleZone = (slug: string) => {
    setSelectedZones((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, zones: selectedZones, frequency }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Error desconocido");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
    }
  };

  if (unsubscribed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Te has dado de baja</h1>
        <p className="text-muted-foreground">
          Ya no recibirás informes por correo. Puedes volver a suscribirte en
          cualquier momento.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <Mail className="h-10 w-10 text-sky-600 mx-auto mb-2" />
          <CardTitle className="text-xl">Suscríbete a ForcaNieve</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Recibe informes personalizados de las condiciones del Pirineo
            directamente en tu correo.
          </p>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Te hemos enviado un enlace de verificación a <strong>{email}</strong>.
                Revisa tu bandeja de entrada.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-3">
                  Zonas de interés
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {ZONES.map((zone) => (
                    <label
                      key={zone.slug}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedZones.includes(zone.slug)}
                        onCheckedChange={() => toggleZone(zone.slug)}
                      />
                      <span className="text-sm">{zone.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Frecuencia</p>
                <RadioGroup
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as "daily" | "weekly")}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <label htmlFor="daily" className="text-sm cursor-pointer">
                      Diario (cada mañana)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <label htmlFor="weekly" className="text-sm cursor-pointer">
                      Semanal (lunes por la mañana)
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  status === "loading" || !email || selectedZones.length === 0
                }
              >
                {status === "loading" ? "Enviando..." : "Suscribirse"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Puedes darte de baja en cualquier momento desde el enlace en
                cada correo.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

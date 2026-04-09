import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webcams — ForcaNieve",
};

export const revalidate = 3600; // 1 hour

interface WebcamGroup {
  zoneName: string;
  webcams: {
    id: string;
    name: string;
    embedUrl: string;
    type: "img" | "iframe";
    source: string | null;
  }[];
}

export default async function WebcamsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: webcamRows } = await supabase
    .from("webcams")
    .select("*, zones(name)")
    .eq("is_active", true)
    .order("sort_order");

  // Group by zone
  const grouped = new Map<string, WebcamGroup>();
  for (const row of webcamRows ?? []) {
    const zoneName = (row.zones as { name: string })?.name ?? "Otra";
    if (!grouped.has(zoneName)) {
      grouped.set(zoneName, { zoneName, webcams: [] });
    }
    grouped.get(zoneName)!.webcams.push({
      id: row.id,
      name: row.name,
      embedUrl: row.embed_url,
      type: row.thumbnail_url === "iframe" ? "iframe" : "img",
      source: row.source,
    });
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-8">
        <Camera className="h-6 w-6 text-sky-600" />
        <h1 className="text-2xl font-bold">Webcams del Pirineo</h1>
      </div>

      {grouped.size === 0 ? (
        <p className="text-muted-foreground">
          No hay webcams disponibles en este momento.
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.values()).map((group) => (
            <section key={group.zoneName}>
              <h2 className="text-lg font-semibold mb-4">{group.zoneName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.webcams.map((cam) => (
                  <Card key={cam.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{cam.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {cam.type === "iframe" ? (
                          <iframe
                            src={cam.embedUrl}
                            title={`Webcam: ${cam.name}`}
                            className="w-full h-full"
                            allow="autoplay"
                            loading="lazy"
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={cam.embedUrl}
                            alt={`Webcam: ${cam.name}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      {cam.source && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Fuente: {cam.source}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

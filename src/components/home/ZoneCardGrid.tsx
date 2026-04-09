import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AvalancheRiskBadge } from "@/components/shared/AvalancheRiskBadge";
import type { ZoneSummary } from "@/types/zone";
import { Thermometer, Snowflake } from "lucide-react";

interface ZoneCardGridProps {
  zones: ZoneSummary[];
}

export function ZoneCardGrid({ zones }: ZoneCardGridProps) {
  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-xl font-semibold mb-6">Zonas del Pirineo</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}
      </div>
    </section>
  );
}

function ZoneCard({ zone }: { zone: ZoneSummary }) {
  return (
    <Link href={`/zona/${zone.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div
          className="h-36 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
          style={{
            backgroundImage: zone.imageUrl
              ? `url(${zone.imageUrl})`
              : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
          }}
        />
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm leading-tight">{zone.name}</h3>

          <div className="flex items-center justify-between">
            {zone.avalancheRisk !== null && (
              <AvalancheRiskBadge level={zone.avalancheRisk} size="sm" />
            )}
            {zone.weather && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Thermometer className="h-3 w-3" />
                <span>
                  {zone.weather.tempMin}°/{zone.weather.tempMax}°
                </span>
              </div>
            )}
          </div>

          {zone.snowDepth && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Snowflake className="h-3 w-3 text-sky-400" />
              <span>
                {Object.entries(zone.snowDepth)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([alt, depth]) => `${alt}m: ${depth}cm`)
                  .slice(0, 2)
                  .join(" · ")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

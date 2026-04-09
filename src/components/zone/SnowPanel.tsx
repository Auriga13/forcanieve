import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SnowDepthBar } from "@/components/shared/SnowDepthBar";
import type { SnowData } from "@/types/snow";
import { Snowflake } from "lucide-react";

interface SnowPanelProps {
  snow: SnowData;
}

export function SnowPanel({ snow }: SnowPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-sky-400" />
          Nieve
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SnowDepthBar depthByAltitude={snow.depthByAltitude} />

        <div className="grid grid-cols-3 gap-2 text-center">
          <SnowfallStat label="24h" value={snow.snowfall24h} />
          <SnowfallStat label="48h" value={snow.snowfall48h} />
          <SnowfallStat label="7 días" value={snow.snowfall7d} />
        </div>
      </CardContent>
    </Card>
  );
}

function SnowfallStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">
        {value !== null ? `${value}cm` : "—"}
      </p>
    </div>
  );
}

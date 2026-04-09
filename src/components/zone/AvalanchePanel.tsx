import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvalancheRiskBadge } from "@/components/shared/AvalancheRiskBadge";
import type { AvalancheInfo } from "@/types/avalanche";
import { TriangleAlert, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AvalanchePanelProps {
  avalanche: AvalancheInfo;
}

export function AvalanchePanel({ avalanche }: AvalanchePanelProps) {
  const TrendIcon =
    avalanche.trend === "rising"
      ? TrendingUp
      : avalanche.trend === "falling"
        ? TrendingDown
        : Minus;

  const trendLabel =
    avalanche.trend === "rising"
      ? "En aumento"
      : avalanche.trend === "falling"
        ? "En descenso"
        : "Estable";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-orange-500" />
          Riesgo de aludes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <AvalancheRiskBadge level={avalanche.riskLevel} size="lg" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendIcon className="h-4 w-4" />
            <span>{trendLabel}</span>
          </div>
        </div>

        {avalanche.bulletinSummary && (
          <p className="text-sm leading-relaxed">{avalanche.bulletinSummary}</p>
        )}

        {avalanche.bulletinUrl && (
          <a
            href={avalanche.bulletinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-600 hover:underline"
          >
            Ver boletín oficial
          </a>
        )}
      </CardContent>
    </Card>
  );
}

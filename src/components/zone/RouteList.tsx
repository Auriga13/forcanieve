import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConditionBadge } from "@/components/shared/ConditionBadge";
import type { RouteWithCondition } from "@/types/route";
import { MapPin } from "lucide-react";

interface RouteListProps {
  routes: RouteWithCondition[];
}

export function RouteList({ routes }: RouteListProps) {
  if (routes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Rutas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {routes.map((route) => (
            <div key={route.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{route.name}</span>
                    <span className="text-xs text-muted-foreground bg-gray-100 rounded px-1.5 py-0.5">
                      {route.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {route.altitudeMin}m — {route.altitudeMax}m
                    {route.altitudeGain && ` · ${route.altitudeGain}m D+`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {route.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ConditionBadge
                    badge={route.conditionBadge}
                    reason={route.conditionReason}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Planificación avanzada de rutas, tracks GPX y reportes de condiciones
          </p>
          <p className="text-xs font-medium text-sky-600 mt-1">Próximamente</p>
        </div>
      </CardContent>
    </Card>
  );
}

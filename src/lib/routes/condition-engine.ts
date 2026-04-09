import type { ConditionBadge, RouteRow } from "@/types/route";
import type { AvalancheTrend } from "@/types/zone";

interface ConditionInput {
  route: Pick<RouteRow, "altitude_min" | "altitude_max" | "aspects" | "activity_type">;
  avalanche: {
    riskLevel: number;
    trend: AvalancheTrend;
  } | null;
  snowDepthAtAltitude: number | null;
  weather: {
    windSpeedKmh: number;
    alertSeverity: "yellow" | "orange" | "red" | null;
  } | null;
}

interface ConditionResult {
  badge: ConditionBadge;
  reason: string;
}

export function calculateRouteCondition(input: ConditionInput): ConditionResult {
  const { route, avalanche, snowDepthAtAltitude, weather } = input;

  // NOT RECOMMENDED checks
  if (avalanche && avalanche.riskLevel >= 4) {
    return {
      badge: "not_recommended",
      reason: `Riesgo de aludes ${avalanche.riskLevel} (fuerte/muy fuerte)`,
    };
  }

  if (weather?.alertSeverity === "red") {
    return {
      badge: "not_recommended",
      reason: "Alerta meteorológica roja activa",
    };
  }

  if (weather && weather.windSpeedKmh > 80) {
    return {
      badge: "not_recommended",
      reason: `Viento muy fuerte en altitud (${weather.windSpeedKmh} km/h)`,
    };
  }

  if (avalanche && avalanche.riskLevel === 3 && hasMatchingAspects(route.aspects)) {
    return {
      badge: "not_recommended",
      reason: `Riesgo de aludes notable (3) en orientaciones ${route.aspects.join("/")}`,
    };
  }

  // CAUTION checks
  if (avalanche && avalanche.riskLevel === 3) {
    return {
      badge: "caution",
      reason: "Riesgo de aludes notable (3)",
    };
  }

  if (avalanche && avalanche.riskLevel === 2 && avalanche.trend === "rising") {
    return {
      badge: "caution",
      reason: "Riesgo de aludes limitado (2) en aumento",
    };
  }

  if (weather?.alertSeverity === "orange" || weather?.alertSeverity === "yellow") {
    return {
      badge: "caution",
      reason: `Alerta meteorológica ${weather.alertSeverity === "orange" ? "naranja" : "amarilla"} activa`,
    };
  }

  if (weather && weather.windSpeedKmh >= 50) {
    return {
      badge: "caution",
      reason: `Viento fuerte en altitud (${weather.windSpeedKmh} km/h)`,
    };
  }

  if (
    route.activity_type === "ski_touring" &&
    snowDepthAtAltitude !== null &&
    snowDepthAtAltitude < 50
  ) {
    return {
      badge: "caution",
      reason: `Escasa nieve (${snowDepthAtAltitude} cm) para esquí de montaña`,
    };
  }

  return {
    badge: "good",
    reason: "Buenas condiciones",
  };
}

// For risk level 3, dangerous aspects are typically N-facing slopes.
// This is a simplified check — the real BRA specifies exact aspects.
function hasMatchingAspects(routeAspects: string[]): boolean {
  const dangerousAspects = ["N", "NE", "NW"];
  return routeAspects.some((a) => dangerousAspects.includes(a));
}

export function getSnowDepthAtAltitude(
  depthByAltitude: Record<string, number> | null,
  routeAltitudeMin: number,
  routeAltitudeMax: number
): number | null {
  if (!depthByAltitude) return null;
  const midAltitude = (routeAltitudeMin + routeAltitudeMax) / 2;

  const altitudes = Object.keys(depthByAltitude)
    .map(Number)
    .sort((a, b) => a - b);

  // Find closest altitude band
  let closest = altitudes[0];
  let minDiff = Math.abs(midAltitude - closest);
  for (const alt of altitudes) {
    const diff = Math.abs(midAltitude - alt);
    if (diff < minDiff) {
      minDiff = diff;
      closest = alt;
    }
  }

  return depthByAltitude[String(closest)] ?? null;
}

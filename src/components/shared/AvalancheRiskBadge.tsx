import { AVALANCHE_RISK_LABELS, AVALANCHE_RISK_COLORS } from "@/lib/utils/constants";

interface AvalancheRiskBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

export function AvalancheRiskBadge({ level, size = "md" }: AvalancheRiskBadgeProps) {
  const label = AVALANCHE_RISK_LABELS[level] ?? "Desconocido";
  const color = AVALANCHE_RISK_COLORS[level] ?? "#6B7280";

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold`}
        style={{ backgroundColor: color }}
        role="img"
        aria-label={`Riesgo de aludes: ${level} - ${label}`}
      >
        {level}
      </div>
      {size !== "sm" && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

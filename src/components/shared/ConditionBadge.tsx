import { CONDITION_LABELS, CONDITION_COLORS } from "@/lib/utils/constants";
import type { ConditionBadge as ConditionBadgeType } from "@/types/route";

interface ConditionBadgeProps {
  badge: ConditionBadgeType;
  reason?: string;
}

export function ConditionBadge({ badge, reason }: ConditionBadgeProps) {
  const label = CONDITION_LABELS[badge];
  const color = CONDITION_COLORS[badge];

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
      {reason && badge !== "good" && (
        <span className="text-xs text-muted-foreground">{reason}</span>
      )}
    </div>
  );
}

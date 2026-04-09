import { formatTimestamp } from "@/lib/utils/date";

interface LastUpdatedProps {
  date: string | null;
}

export function LastUpdated({ date }: LastUpdatedProps) {
  if (!date) return null;

  return (
    <p className="text-xs text-muted-foreground">
      Última actualización: {formatTimestamp(date)}
    </p>
  );
}

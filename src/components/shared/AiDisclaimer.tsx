import { AI_DISCLAIMER } from "@/lib/utils/constants";

export function AiDisclaimer() {
  return (
    <p className="text-xs italic text-muted-foreground mt-2">
      {AI_DISCLAIMER}
    </p>
  );
}

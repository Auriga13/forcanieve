// Altitude bands used for snow depth measurements (meters)
export const ALTITUDE_BANDS = [1800, 2200, 2600, 3000] as const;

// European avalanche risk scale
export const AVALANCHE_RISK_LABELS: Record<number, string> = {
  1: "Débil",
  2: "Limitado",
  3: "Notable",
  4: "Fuerte",
  5: "Muy fuerte",
};

export const AVALANCHE_RISK_COLORS: Record<number, string> = {
  1: "#059669", // emerald-600
  2: "#F59E0B", // amber-500
  3: "#EA580C", // orange-600
  4: "#DC2626", // red-600
  5: "#1F2937", // gray-800 (near black)
};

// Route difficulty scale (simplified IFAS/French)
export const DIFFICULTY_ORDER = ["F", "F+", "PD-", "PD", "PD+", "AD-", "AD", "AD+", "D-", "D", "D+", "TD-", "TD", "MD-", "MD"];

// Condition badge labels
export const CONDITION_LABELS: Record<string, string> = {
  good: "Buenas condiciones",
  caution: "Precaución",
  not_recommended: "No recomendado",
};

export const CONDITION_COLORS: Record<string, string> = {
  good: "#059669",
  caution: "#F59E0B",
  not_recommended: "#DC2626",
};

// Data refresh intervals
export const DATA_REVALIDATE_SECONDS = 1800; // 30 minutes ISR
export const DATA_FETCH_INTERVAL_HOURS = 6;

// LLM disclaimer text
export const AI_DISCLAIMER =
  "Resumen generado por IA. Consulta siempre las fuentes oficiales antes de salir a la montaña.";

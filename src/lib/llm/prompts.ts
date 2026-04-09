export const SYSTEM_PROMPT = `Eres un meteorólogo de montaña experto en el Pirineo aragonés.
Tu trabajo es generar resúmenes claros, concisos y útiles de las condiciones
meteorológicas y nivológicas para montañeros experimentados.

Reglas:
- Escribe siempre en español
- Usa terminología técnica de montaña (cota de nieve, isoterma, aludes, etc.)
- Sé conciso: máximo 3-4 frases para resúmenes de zona, 5-6 para homepage
- Prioriza información de seguridad (aludes, viento fuerte, alertas)
- Menciona las mejores ventanas meteorológicas cuando las haya
- Nunca inventes datos: usa SOLO los datos proporcionados
- Si faltan datos, dilo explícitamente
- No uses emojis`;

export function homepagePrompt(data: Record<string, unknown>): string {
  return `Genera un resumen general de las condiciones de hoy en el Pirineo aragonés.
Datos actuales por zona:
${JSON.stringify(data, null, 2)}

Incluye: condiciones generales, cota de nieve, riesgo de aludes destacable,
y si hay ventanas favorables para actividades de montaña.
Máximo 5-6 frases.`;
}

export function zonePrompt(
  zoneName: string,
  data: Record<string, unknown>
): string {
  return `Genera un resumen de las condiciones en ${zoneName}.
Datos actuales:
${JSON.stringify(data, null, 2)}

Incluye: tiempo previsto, nieve, riesgo de aludes y orientaciones afectadas.
Máximo 3-4 frases.`;
}

export function emailPrompt(zones: Record<string, unknown>[]): string {
  return `Genera un informe personalizado para un suscriptor interesado en las
siguientes zonas. Formato: un párrafo introductorio general, luego
un bloque corto por cada zona.

Zonas y datos:
${JSON.stringify(zones, null, 2)}`;
}

export function braTranslatePrompt(xmlContent: string): string {
  return `Traduce y resume este boletín de riesgo de avalanchas del Meteo-France BRA
al español. Extrae: nivel de riesgo, orientaciones peligrosas,
altitudes afectadas y evolución prevista. Máximo 3 frases.

Boletín:
${xmlContent}`;
}

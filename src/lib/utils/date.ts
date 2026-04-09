const spanishDays = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

const spanishMonths = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatDateSpanish(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate();
  const month = spanishMonths[d.getMonth()];
  return `${day} de ${month}`;
}

export function formatDayName(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return spanishDays[d.getDay()];
}

export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  return formatDateSpanish(d);
}

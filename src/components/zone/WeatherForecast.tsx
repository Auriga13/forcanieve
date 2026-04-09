import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DayForecast, TrendDay } from "@/types/weather";
import { formatDayName, formatDateSpanish } from "@/lib/utils/date";
import {
  Thermometer,
  Wind,
  CloudSnow,
  Snowflake,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

interface WeatherForecastProps {
  forecast: DayForecast[];
  trend7d: TrendDay[];
}

export function WeatherForecast({ forecast, trend7d }: WeatherForecastProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Previsión meteorológica</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {forecast.map((day, i) => (
            <DayCard key={day.date} day={day} isToday={i === 0} />
          ))}
        </div>

        {trend7d.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Tendencia 7 días
            </h4>
            <div className="flex gap-3 overflow-x-auto">
              {trend7d.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-1 min-w-[60px]"
                >
                  <span className="text-xs text-muted-foreground">
                    {formatDayName(day.date).slice(0, 3)}
                  </span>
                  <TendencyIcon tendency={day.tendency} />
                  <span className="text-xs">{day.tempRange}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DayCard({ day, isToday }: { day: DayForecast; isToday: boolean }) {
  return (
    <div
      className={`flex-shrink-0 w-40 rounded-xl border p-3 space-y-2 ${
        isToday ? "bg-sky-50 border-sky-200" : "bg-white"
      }`}
    >
      <p className="text-xs font-medium">
        {isToday ? "Hoy" : formatDayName(day.date)}
        <span className="text-muted-foreground ml-1">
          {formatDateSpanish(day.date)}
        </span>
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-3 w-3 text-orange-500" />
          <span>
            {day.tempMin}° / {day.tempMax}°
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Snowflake className="h-3 w-3 text-sky-400" />
          <span>Cota: {day.snowLineMeter}m</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="h-3 w-3 text-gray-500" />
          <span>
            {day.windSpeedKmh} km/h {day.windDirection}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CloudSnow className="h-3 w-3 text-blue-400" />
          <span>{day.precipitationMm} mm</span>
        </div>
      </div>
    </div>
  );
}

function TendencyIcon({ tendency }: { tendency: TrendDay["tendency"] }) {
  switch (tendency) {
    case "improving":
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    case "worsening":
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
}

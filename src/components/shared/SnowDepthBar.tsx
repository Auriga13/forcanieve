interface SnowDepthBarProps {
  depthByAltitude: Record<string, number>;
}

export function SnowDepthBar({ depthByAltitude }: SnowDepthBarProps) {
  const entries = Object.entries(depthByAltitude)
    .map(([alt, depth]) => ({ altitude: Number(alt), depth }))
    .sort((a, b) => b.altitude - a.altitude);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de nieve</p>;
  }

  const maxDepth = Math.max(...entries.map((e) => e.depth), 1);

  return (
    <div className="space-y-2">
      {entries.map(({ altitude, depth }) => (
        <div key={altitude} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14 text-right">
            {altitude}m
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all"
              style={{ width: `${(depth / maxDepth) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium w-12">{depth} cm</span>
        </div>
      ))}
    </div>
  );
}

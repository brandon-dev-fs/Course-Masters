const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface UnitMarker {
  label: string;
  color: string;
  weekIndex: number; // 0-based week within the month
}

interface MonthGridProps {
  year: number;
  month: number; // 0-indexed
  markers: UnitMarker[];
}

export default function MonthGrid({ year, month, markers }: MonthGridProps) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells: leading empty slots + day cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => {
          const marker = markers.find((m) => m.weekIndex === wi);
          return (
            <div key={wi} className="relative">
              {marker && (
                <div
                  className="absolute inset-0 rounded-lg opacity-15"
                  style={{ backgroundColor: marker.color }}
                />
              )}
              <div className="grid grid-cols-7 relative">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`text-center text-xs py-2 rounded-md ${
                      day ? 'text-foreground' : 'text-transparent'
                    }`}
                  >
                    {day ?? '·'}
                  </div>
                ))}
              </div>
              {marker && (
                <div className="px-1 pb-1">
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: marker.color }}
                  >
                    {marker.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

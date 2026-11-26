import { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';

const LEVEL_CLASSES = [
  'bg-[var(--surface-hover)] border-[var(--border)]',
  'bg-[var(--accent)]/30 border-[var(--accent)]/40',
  'bg-[var(--accent)]/60 border-[var(--accent)]/70',
  'bg-[var(--cyan)]/70 border-[var(--cyan)]/80',
  'bg-[var(--cyan)] border-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]',
];

export default function ContributionHeatmap({ events = [], title = 'Builder Momentum', weeks = 20 }) {
  const [hovered, setHovered] = useState(null);

  const { grid, totalPoints } = useMemo(() => {
    const countsByDay = new Map();
    let sum = 0;

    events.forEach((ev) => {
      const d = ev?.createdAt ? new Date(ev.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      const pts = Number(ev.points || ev.amount || 5);
      countsByDay.set(key, (countsByDay.get(key) || 0) + pts);
      sum += pts;
    });

    const totalDays = weeks * 7;
    const today = new Date();
    const cols = [];

    for (let w = weeks - 1; w >= 0; w -= 1) {
      const col = [];
      for (let d = 6; d >= 0; d -= 1) {
        const offset = w * 7 + d;
        const dt = new Date(today.getTime() - offset * 86400000);
        const key = dt.toISOString().slice(0, 10);
        const raw = countsByDay.get(key) || 0;

        // Deterministic subtle ambient pulse if no live events on that day, or real count
        let level = 0;
        if (raw >= 40) level = 4;
        else if (raw >= 25) level = 3;
        else if (raw >= 10) level = 2;
        else if (raw > 0) level = 1;

        col.push({ key, xp: raw, level, idx: totalDays - offset });
      }
      cols.push(col);
    }

    return { grid: cols, totalPoints: sum };
  }, [events, weeks]);

  return (
    <div className="glass rounded-[var(--radius-lg)] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-[var(--cyan)]" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            {title}
          </h3>
        </div>
        <span className="mono text-xs text-[var(--text-tertiary)]">
          {hovered ? `${hovered.key}: ${hovered.xp} XP` : `${totalPoints} XP logged (${weeks}w)`}
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {grid.map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col gap-1.5">
            {col.map((cell) => (
              <button
                key={cell.key}
                type="button"
                aria-label={`${cell.key}: ${cell.xp} XP`}
                onMouseEnter={() => setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
                className={`h-3.5 w-3.5 rounded-[4px] border transition-transform hover:scale-125 ${
                  LEVEL_CLASSES[cell.level]
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[var(--text-tertiary)]">
        <span>Less</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-[3px] border ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

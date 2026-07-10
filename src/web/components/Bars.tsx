import type { Bucket } from '../../core';

interface Row {
  id: string;
  label: string;
  score: number;
  bucket: Bucket;
}

const FILL: Record<Bucket, string> = {
  strong: 'bg-emerald-400',
  push: 'bg-amber-400',
  gap: 'bg-rose-400',
};

export default function Bars({ items }: { items: Row[] }) {
  return (
    <section aria-label="Competency scores" className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-slate-300" title={it.label}>
              {it.label}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <span
                className={`block h-full rounded-full ${FILL[it.bucket]}`}
                style={{ width: `${Math.max(0, Math.min(100, it.score))}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-sm tabular-nums text-slate-400">
              {Math.round(it.score)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

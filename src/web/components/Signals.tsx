import type { Bucket } from '../../core';

interface Row {
  id: string;
  label: string;
  bucket: Bucket;
}

const GROUPS: { bucket: Bucket; title: string; dot: string }[] = [
  { bucket: 'strong', title: 'Strong', dot: 'bg-emerald-400' },
  { bucket: 'push', title: 'Push', dot: 'bg-amber-400' },
  { bucket: 'gap', title: 'Gaps', dot: 'bg-rose-400' },
];

export default function Signals({ items }: { items: Row[] }) {
  return (
    <section aria-label="Signals" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {GROUPS.map((g) => {
        const rows = items.filter((it) => it.bucket === g.bucket);
        return (
          <div key={g.bucket} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <span className={`h-2 w-2 rounded-full ${g.dot}`} />
              {g.title}
            </h3>
            <ul className="mt-2 space-y-1">
              {rows.length === 0 ? (
                <li className="text-xs text-slate-600">—</li>
              ) : (
                rows.map((it) => (
                  <li key={it.id} className="text-xs text-slate-400">
                    {it.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

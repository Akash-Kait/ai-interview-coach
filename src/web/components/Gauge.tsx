interface GaugeProps {
  value: number; // 0–100 overall readiness
  verdict: string;
  subtitle: string;
}

// 270° arc: circle path is 100 units (pathLength); the visible arc is 75 (= 270°),
// rotated so the 25-unit (90°) gap sits centered at the bottom.
const CX = 60;
const CY = 60;
const R = 52;
const SWEEP = 75; // 270° as a fraction of pathLength=100
const ROT = `rotate(135 ${CX} ${CY})`;
const TICKS = [30, 55, 75, 88]; // band thresholds

function arcPoint(frac: number, radius: number) {
  const a = ((135 + frac * 270) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

export default function Gauge({ value, verdict, subtitle }: GaugeProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const filled = (v / 100) * SWEEP;
  return (
    <div
      role="img"
      aria-label={`Readiness ${v} percent — ${verdict}`}
      className="relative mx-auto h-48 w-48"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="gaugeFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth={10}
          strokeLinecap="round" pathLength={100} strokeDasharray={`${SWEEP} 100`} transform={ROT}
        />
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke="url(#gaugeFill)" strokeWidth={10}
          strokeLinecap="round" pathLength={100} strokeDasharray={`${filled} 100`} transform={ROT}
        />
        {TICKS.map((t) => {
          const p = arcPoint(t / 100, R);
          return <circle key={t} cx={p.x} cy={p.y} r={1.6} fill="#475569" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-4xl font-semibold tabular-nums text-transparent">
          {v}
          <span className="text-xl">%</span>
        </span>
        <span className="mt-1 text-sm font-medium text-slate-200">{verdict}</span>
        <span className="mt-0.5 text-xs text-slate-500">{subtitle}</span>
      </div>
    </div>
  );
}

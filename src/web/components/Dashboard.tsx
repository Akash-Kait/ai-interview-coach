import type { AppState, CompanyProfile, VerdictBand } from '../../core';
import { COMPETENCY_LABELS, competencyBreakdown, overallScore, verdict } from '../../core';
import Gauge from './Gauge';
import Bars from './Bars';
import Signals from './Signals';

const SUBTITLE: Record<VerdictBand, string> = {
  Foundations: 'Building the fundamentals.',
  Building: 'Filling the gaps.',
  'Interview-capable': 'Ready to practice hard.',
  'Strong — start applying': 'Start applying.',
  Ready: 'Cleared for takeoff.',
};

export default function Dashboard({ state, company }: { state: AppState; company: CompanyProfile }) {
  const overall = Math.round(overallScore(state, company));
  const band = verdict(overall);
  const rows = competencyBreakdown(state, company).map((r) => ({ ...r, label: COMPETENCY_LABELS[r.id] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <Gauge value={overall} verdict={band} subtitle={SUBTITLE[band]} />
        <p className="mt-1 text-xs text-slate-500">Weighted for {company.name}</p>
      </div>
      <Bars items={rows} />
      <Signals items={rows} />
    </div>
  );
}

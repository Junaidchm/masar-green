import { useMemo, useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { useGetTrips, getGetTripsQueryKey, type Trip } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { EmptyState, ErrorState, ModeChip, PageHeader, Sk, StatusPill } from '@/components/common';

export function TripRow({ trip }: { trip: Trip }) {
  const { t, num, date } = useI18n();
  const [open, setOpen] = useState(false);
  const score = trip.verificationScore <= 1 ? trip.verificationScore * 100 : trip.verificationScore;
  return (
    <div className="py-3" data-testid={`row-trip-${trip.id}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 text-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{trip.from} <span className="text-muted-foreground">→</span> {trip.to}</span>
            <StatusPill status={trip.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{date(trip.startedAt)}</span><ModeChip mode={trip.mode} />
            <span className="num">{num(trip.distance, 1)} {t('km')} · {num(trip.minutes)} {t('min')}</span>
          </div>
        </div>
        <div className="text-end">
          <div className="num font-bold text-[#00732F] dark:text-emerald-400">−{num(trip.saved, 2)} {t('kg')}</div>
          <div className="num text-xs text-muted-foreground">+{num(trip.credits)} {t('credits')}</div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div><div className="text-xs text-muted-foreground">CO₂</div><div className="num font-semibold">{num(trip.co2, 2)} {t('kg')}</div></div>
            <div><div className="text-xs text-muted-foreground">{t('plan.price')}</div><div className="num font-semibold">{t('aed')} {num(trip.price, 2)}</div></div>
            <div><div className="text-xs text-muted-foreground">{t('trips.score')}</div><div className="num font-semibold">{num(score)}%</div></div>
            <div><div className="text-xs text-muted-foreground">{t('active.since')}</div><div className="font-semibold">{trip.endedAt ? date(trip.endedAt) : '—'}</div></div>
          </div>
          {trip.reason && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{trip.reason}</p>}
          {trip.legs.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {trip.legs.map((l, i) => <li key={i} className="flex items-center gap-2 text-xs"><ModeChip mode={l.mode} line={l.line} /><span>{l.instruction || `${l.from} → ${l.to}`}</span><span className="num ms-auto text-muted-foreground">{num(l.minutes)} {t('min')}</span></li>)}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  const { t, num } = useI18n();
  const q = useGetTrips({ query: { queryKey: getGetTripsQueryKey() } });
  const [f, setF] = useState<'all' | 'completed' | 'pending' | 'active'>('all');
  const list = useMemo(() => (q.data ?? []).filter((tr) => {
    const s = tr.status.toLowerCase();
    if (f === 'all') return true;
    if (f === 'pending') return s.includes('pend');
    if (f === 'active') return s.includes('active');
    return s.includes('complete') || s.includes('verif');
  }), [q.data, f]);
  const totals = useMemo(() => (q.data ?? []).filter(tr=>tr.status==='verified'||tr.status==='completed').reduce((a, tr) => ({ s: a.s + tr.saved, c: a.c + tr.credits }), { s: 0, c: 0 }), [q.data]);

  return (
    <div>
      <PageHeader title={t('trips.title')} sub={q.data ? `${num(q.data.length)} · ${num(totals.s, 1)} ${t('kg')} CO₂ · ${num(totals.c)} ${t('credits')}` : undefined} />
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none">
        {(['all', 'completed', 'pending', 'active'] as const).map((k) => (
          <button key={k} onClick={() => setF(k)} className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold ${f === k ? 'bg-foreground text-background' : 'border bg-card'}`} data-testid={`filter-trips-${k}`}>{t(`trips.${k}`)}</button>
        ))}
      </div>
      <div className="card-soft px-4 md:px-5">
        {q.isLoading ? <div className="space-y-3 py-4">{[...Array(6)].map((_, i) => <Sk key={i} className="h-14" />)}</div>
          : q.isError ? <div className="py-4"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div>
          : list.length === 0 ? <div className="py-6"><EmptyState icon={<History className="h-6 w-6" />} text={t('trips.empty')} /></div>
          : <div className="divide-y">{list.map((tr) => <TripRow key={tr.id} trip={tr} />)}</div>}
      </div>
    </div>
  );
}

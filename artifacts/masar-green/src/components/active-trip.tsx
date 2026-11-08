import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Nfc, Square, FlaskConical } from 'lucide-react';
import {
  useEndTrip, getGetDashboardQueryKey, getGetTripsQueryKey, getGetWalletQueryKey, getGetChallengesQueryKey, getGetLeaderboardQueryKey,
  type Trip,
} from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { friendlyError, useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { useCelebrate } from './celebration';
import { ModeChip } from './common';

export function invalidateTripData(qc: ReturnType<typeof useQueryClient>) {
  [getGetDashboardQueryKey(), getGetTripsQueryKey(), getGetWalletQueryKey(), getGetChallengesQueryKey(), getGetLeaderboardQueryKey()]
    .forEach((k) => void qc.invalidateQueries({ queryKey: k }));
}

export function ActiveTripCard({ trip }: { trip: Trip }) {
  const { t, date } = useI18n();
  const { requireAuth } = useAuth();
  const qc = useQueryClient();
  const celebrate = useCelebrate();
  const end = useEndTrip();

  const finish = (tapOut: boolean) => requireAuth(() => end.mutate({ id: trip.id, data: { simulate: true, tapOut } }, {
    onSuccess: (done) => { invalidateTripData(qc); celebrate(done); },
    onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
  }));

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-card p-4 md:p-5" data-testid="card-active-trip">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
        <span className="relative flex h-2.5 w-2.5"><span className="pulse-dot absolute inset-0 rounded-full bg-primary" /><span className="relative h-2.5 w-2.5 rounded-full bg-primary" /></span>
        {t('active.title')}
      </div>
      <div className="mt-2 text-lg font-bold">{trip.from} <span className="text-muted-foreground">→</span> {trip.to}</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{t('active.since')} {date(trip.startedAt)}</span>
        {trip.legs.filter((l) => !l.mode.toLowerCase().includes('walk')).slice(0, 4).map((l, i) => <ModeChip key={i} mode={l.mode} line={l.line} />)}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button disabled={end.isPending} onClick={() => finish(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#00732F] px-4 font-semibold text-white active:scale-[.98] disabled:opacity-60" data-testid="button-end-trip-simulate">
          {end.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Nfc className="h-4 w-4" />} {t('active.simulate')}
        </button>
        <button disabled={end.isPending} onClick={() => finish(false)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold hover:bg-muted" data-testid="button-end-trip-notap">
          <Square className="h-3.5 w-3.5" /> {t('active.noTap')}
        </button>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t('active.simNote')} {t('active.noTapNote')}</p>
    </div>
  );
}

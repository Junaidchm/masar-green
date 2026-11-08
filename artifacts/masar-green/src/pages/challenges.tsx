import { SponsoredSlot } from '@/components/sponsored';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Award, Check, Loader2, Lock, Trophy } from 'lucide-react';
import {
  useGetChallenges, getGetChallengesQueryKey, useGetLeaderboard, getGetLeaderboardQueryKey, useClaimChallenge,
  getGetWalletQueryKey, getGetDashboardQueryKey,
} from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { friendlyError, useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState, ModeIcon, PageHeader, SectionTitle, Sk } from '@/components/common';

export default function ChallengesPage() {
  const { t, num, date, lang } = useI18n();
  const { requireAuth } = useAuth();
  const qc = useQueryClient();
  const ch = useGetChallenges({ query: { queryKey: getGetChallengesQueryKey() } });
  const lb = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  const claim = useClaimChallenge();
  const [board, setBoard] = useState<'individual' | 'workplace' | 'neighbourhood'>('individual');

  const doClaim = (id: number) => requireAuth(() => claim.mutate({ id }, {
    onSuccess: () => {
      [getGetChallengesQueryKey(), getGetWalletQueryKey(), getGetDashboardQueryKey(), getGetLeaderboardQueryKey()].forEach((k) => void qc.invalidateQueries({ queryKey: k }));
      toast({ title: t('ch.claimedToast') });
    },
    onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
  }));

  const leaders = lb.data?.[board] ?? [];
  const top = leaders[0]?.saved || 1;

  return (
    <div>
      <PageHeader title={t('ch.title')} />
      <div className="mb-6"><SponsoredSlot placement="community" /></div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <SectionTitle>{t('ch.weekly')}</SectionTitle>
          {ch.isLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}</div>
            : ch.isError ? <ErrorState error={ch.error} onRetry={() => ch.refetch()} />
            : !ch.data?.length ? <EmptyState icon={<Trophy className="h-6 w-6" />} text={t('ch.empty')} />
            : (
              <div className="space-y-3">
                {ch.data.map((c) => {
                  const pct = Math.min(100, (c.progress / Math.max(c.target, 1)) * 100);
                  const done = c.progress >= c.target;
                  return (
                    <div key={c.id} className="card-soft p-4" data-testid={`card-challenge-${c.id}`}>
                      <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><ModeIcon mode={c.mode} className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold">{lang === 'ar' ? c.titleAr || c.title : c.title}</div>
                          <p className="text-sm text-muted-foreground">{t(c.description)}</p>
                        </div>
                        <span className="num shrink-0 rounded-full bg-[#B8964B]/15 px-2.5 py-1 text-xs font-bold text-[#8a6d2f] dark:text-[#d9bd7f]">+{num(c.bonus)} {t('ch.bonus')}</span>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[#00732F] transition-[width] duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="num">{num(c.progress)} / {num(c.target)} · {t('ch.ends')} {date(c.endsAt, false)}</span>
                        {c.claimed ? <span className="inline-flex items-center gap-1 font-semibold text-[#00732F] dark:text-emerald-400"><Check className="h-3.5 w-3.5" />{t('ch.claimed')}</span>
                          : done ? <button disabled={claim.isPending} onClick={() => doClaim(c.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground" data-testid={`button-claim-${c.id}`}>{claim.isPending && claim.variables?.id === c.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{t('ch.claim')}</button>
                          : <span className="num">{num(pct)}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </section>

        <div className="space-y-6">
          <section className="card-soft p-4 md:p-5">
            <SectionTitle>{t('ch.leaders')}</SectionTitle>
            <div className="mb-3 grid grid-cols-3 rounded-lg bg-muted p-1">
              {(['individual', 'workplace', 'neighbourhood'] as const).map((k) => <button key={k} onClick={() => setBoard(k)} className={`h-9 rounded-md text-xs font-semibold ${board === k ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} data-testid={`tab-board-${k}`}>{t(`ch.${k}`)}</button>)}
            </div>
            {lb.isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
              : lb.isError ? <ErrorState error={lb.error} onRetry={() => lb.refetch()} />
              : (
                <ol className="space-y-1.5">
                  {leaders.map((l) => (
                    <li key={`${l.rank}-${l.name}`} className={`relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 ${l.isYou ? 'ring-2 ring-primary' : ''}`}>
                      <span className="absolute inset-y-0 start-0 bg-accent" style={{ width: `${(l.saved / top) * 100}%` }} />
                      <span className={`num relative grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${l.rank === 1 ? 'bg-[#B8964B] text-[#111]' : l.rank <= 3 ? 'bg-foreground text-background' : 'bg-card'}`}>{l.rank}</span>
                      <span className="relative flex-1 truncate text-sm font-semibold">{l.name}{l.isYou && <span className="ms-2 text-xs text-primary">({t('ch.you')})</span>}</span>
                      <span className="num relative text-sm font-bold">{num(l.saved, 1)} {t('kg')}</span>
                    </li>
                  ))}
                </ol>
              )}
          </section>
          <section className="card-soft p-4 md:p-5">
            <SectionTitle>{t('ch.badges')}</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(lb.data?.badges ?? []).map((b) => (
                <div key={b.name} title={t(b.description)} className={`rounded-xl border p-3 text-center ${b.earned ? 'border-[#B8964B]/60 bg-[#B8964B]/10' : 'opacity-55'}`} data-testid={`badge-${b.name}`}>
                  <span className={`mx-auto grid h-11 w-11 place-items-center rounded-full ${b.earned ? 'bg-[#B8964B] text-[#111]' : 'bg-muted'}`}>{b.earned ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}</span>
                  <div className="mt-2 text-xs font-bold">{b.name}</div>
                  <div className="text-[10px] text-muted-foreground">{b.earned ? t('ch.earned') : t('ch.locked')}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

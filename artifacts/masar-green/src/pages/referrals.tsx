import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Clipboard, Gift, Info, Leaf, LockKeyhole, Share2, UsersRound } from 'lucide-react';
import { useGetReferrals, getGetReferralsQueryKey, getGetWalletQueryKey, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { pendingReferral, clearReferral } from '@/lib/referral-invite';
import { EmptyState, ErrorState, PageHeader, SectionTitle, Sk } from '@/components/common';
import './referral.css';

export default function ReferralsPage() {
  const { t, num, date } = useI18n();
  const { user, isGuest, loading, openLogin } = useAuth();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<'invite' | 'existing' | 'invalid' | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const linkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const code = pendingReferral();
    setNotice(code ? (/^[A-F0-9]{12}$/.test(code) ? (user ? 'existing' : 'invite') : 'invalid') : null);
  }, [user?.id]);

  const commuter = user?.role === 'commuter';
  const queryEnabled = commuter && !isGuest && !loading;
  const q = useGetReferrals({
    query: {
      queryKey: getGetReferralsQueryKey(),
      enabled: queryEnabled,
      refetchOnMount: true,
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  });
  const shareUrl = useMemo(() => {
    if (!q.data?.code || typeof window === 'undefined') return '';
    const url = new URL(import.meta.env.BASE_URL + 'referrals', window.location.origin);
    url.searchParams.set('ref', q.data.code);
    return url.toString();
  }, [q.data?.code]);
  useEffect(() => {
    if (q.data) {
      void qc.invalidateQueries({queryKey:getGetWalletQueryKey()});
      void qc.invalidateQueries({queryKey:getGetDashboardQueryKey()});
    }
  }, [q.data?.creditsEarned, qc]);
  const shareText = t('rf.shareText');

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('success');
    } catch {
      setCopyState('error');
      linkRef.current?.focus();
      linkRef.current?.select();
    }
  };
  const shareInvite = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('rf.shareTitle'), text: shareText, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copyLink();
  };
  const clearInviteNotice = () => {
    clearReferral();
    setNotice(null);
    setCopyState('idle');
  };

  if (loading) return <div className="space-y-4"><Sk className="h-24" /><Sk className="h-64" /></div>;
  return (
    <div className="referral-page space-y-6" data-testid="page-referrals">
      <PageHeader title={t('rf.title')} sub={t('rf.sub')} />

      {notice && (
        <section className={`rf-notice ${notice === 'existing' ? 'rf-notice-existing' : ''}`} role="status" data-testid="notice-referral-invite">
          <span className="rf-notice-icon"><Info className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">{t(notice === 'existing' ? 'rf.existingTitle' : notice === 'invalid' ? 'rf.invalid' : 'rf.inviteTitle')}</h2>
            {notice === 'invite' && <p className="mt-1 text-sm leading-relaxed">{t('rf.inviteBody')}</p>}
            {notice === 'existing' && <p className="mt-1 text-sm leading-relaxed">{t('rf.existing')}</p>}
          </div>
          <button type="button" onClick={clearInviteNotice} className="rf-quiet-button" data-testid="button-clear-invite">{t('rf.clearInvite')}</button>
        </section>
      )}

      {isGuest ? (
        <section className="rf-guest-panel card-soft" data-testid="card-referrals-guest">
          <span className="rf-guest-mark"><UsersRound className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="rf-eyebrow">{t('rf.signInTitle')}</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{t('rf.signInBody')}</p>
          </div>
          <button onClick={openLogin} className="rf-primary-button" data-testid="button-referrals-signin">{t('rf.signIn')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button>
        </section>
      ) : !commuter ? (
        <section className="rf-role-message" data-testid="message-commuter-only"><LockKeyhole className="h-5 w-5" /><p>{t('rf.commuterOnly')}</p></section>
      ) : q.isLoading ? (
        <div className="space-y-4"><Sk className="h-60" /><Sk className="h-32" /><Sk className="h-48" /></div>
      ) : q.isError || !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          {q.data.invitedByReferral && <div className="rf-success-note" role="status"><Check className="h-4 w-4" />{t('rf.connected')}</div>}
          <section className="rf-share-panel" aria-labelledby="referral-share-heading">
            <div className="rf-share-art" aria-hidden="true"><div className="rf-orbit rf-orbit-one" /><div className="rf-orbit rf-orbit-two" /><div className="rf-leaf"><Leaf /></div><span className="rf-art-dot" /></div>
            <div className="rf-share-content">
              <div className="rf-reward-tag"><Gift className="h-4 w-4" />{t('rf.reward')}</div>
              <h2 id="referral-share-heading">{t('rf.shareTitle')}</h2>
              <p>{t('rf.rewardLine')} <span>{t('rf.rewardValue')}</span></p>
              <label htmlFor="referral-link" className="rf-input-label">{t('rf.linkLabel')}</label>
              <div className="rf-link-row">
                <input ref={linkRef} id="referral-link" aria-label={t('rf.linkLabel')} readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} data-testid="input-referral-link" />
                <button onClick={copyLink} className="rf-copy-button" data-testid="button-copy-referral"><Clipboard className="h-4 w-4" />{t('rf.copy')}</button>
              </div>
              <div className="rf-actions">
                {typeof navigator !== 'undefined' && 'share' in navigator && <button onClick={shareInvite} className="rf-share-button" data-testid="button-share-referral"><Share2 className="h-4 w-4" />{t('rf.share')}</button>}
                {copyState !== 'idle' && <span className={`rf-feedback ${copyState === 'error' ? 'is-error' : ''}`} role="status">{t(copyState === 'success' ? 'rf.copied' : 'rf.copyError')}</span>}
              </div>
              <p className="rf-link-note">{t('rf.shareHint')}</p>
            </div>
          </section>

          <section className="rf-activity" aria-labelledby="referral-stats-heading">
            <div className="rf-activity-heading">
              <div><p className="rf-eyebrow">{t('rf.statsTitle')}</p><h2 id="referral-stats-heading">{t('rf.trackingTitle')}</h2></div>
              <div className="rf-total-credit"><span>{num(q.data.creditsEarned)}</span><small>{t('credits')}</small></div>
            </div>
            <div className="rf-stat-grid">
              <div className="rf-stat rf-stat-joined"><span>{t('rf.joined')}</span><strong>{num(q.data.joinedCount)}</strong></div>
              <div className="rf-stat rf-stat-pending"><span>{t('rf.pending')}</span><strong>{num(q.data.pendingCount)}</strong></div>
              <div className="rf-stat rf-stat-rewarded"><span>{t('rf.rewarded')}</span><strong>{num(q.data.rewardedCount)}</strong></div>
            </div>
            <div className="rf-privacy-line"><LockKeyhole className="h-4 w-4 shrink-0" /><p>{t('rf.trackingBody')}</p></div>
            <div className="rf-referral-list">
              <SectionTitle>{t('rf.statsTitle')}</SectionTitle>
              {q.data.referrals.length === 0 ? <EmptyState icon={<UsersRound className="h-6 w-6" />} text={t('rf.noInvites')} /> : (
                <ul className="divide-y divide-border">
                  {q.data.referrals.map((referral) => (
                    <li className="rf-referral-row" key={referral.id} data-testid={`row-referral-${referral.id}`}>
                      <span className={`rf-status-mark ${referral.status}`} aria-hidden="true">{referral.status === 'rewarded' ? <Check className="h-4 w-4" /> : <UsersRound className="h-4 w-4" />}</span>
                      <div className="min-w-0 flex-1"><strong>{t(referral.status === 'rewarded' ? 'rf.rewardedStatus' : 'rf.pendingStatus')}</strong><span>{t('rf.joinedOn')} · {date(referral.joinedAt, false)}</span></div>
                      {referral.status === 'rewarded' && <span className="rf-row-credits">+{num(referral.rewardCredits)} {t('credits')}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      <section className="rf-rules card-soft">
        <div className="rf-rules-heading"><span className="rf-rules-icon"><Info className="h-5 w-5" /></span><div><p className="rf-eyebrow">{t('rf.rulesTitle')}</p><h2>{t('rf.rewardLine')}</h2></div></div>
        <ol>
          <li><span>01</span><p>{t('rf.ruleOne')}</p></li>
          <li><span>02</span><p>{t('rf.ruleTwo')}</p></li>
          <li><span>03</span><p>{t('rf.ruleThree')}</p></li>
        </ol>
        <Link href="/carbon" className="rf-info-link">{t('rf.privacy')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
      </section>
    </div>
  );
}

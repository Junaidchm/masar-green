import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, CreditCard, Gift, Sprout, Landmark, QrCode, Loader2, ArrowDownLeft, ArrowUpRight, Clock, Ticket } from 'lucide-react';
import { useGetWallet, getGetWalletQueryKey, useRedeemCredits, getGetDashboardQueryKey, type Redemption, type RedemptionInputKind, type Partner } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { friendlyError, useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EmptyState, ErrorState, PageHeader, SectionTitle, Sk } from '@/components/common';

type Sheet = { kind: RedemptionInputKind; partner?: Partner } | null;

export default function WalletPage() {
  const { t, num, aed, date } = useI18n();
  const { requireAuth } = useAuth();
  const qc = useQueryClient();
  const q = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const redeem = useRedeemCredits();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [amount, setAmount] = useState('10');
  const [qr, setQr] = useState<Redemption | null>(null);
  const [tab, setTab] = useState<'history' | 'vouchers'>('history');
  const [bankConfirmation, setBankConfirmation] = useState(false);
  const [project, setProject] = useState('tree');

  if (q.isLoading) return <div className="space-y-4"><Sk className="h-48" /><Sk className="h-40" /><Sk className="h-80" /></div>;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const w = q.data;
  const rate = w.aed > 0 ? w.credits / w.aed : 100;

  const open = (s: Sheet) => requireAuth(() => {
    setAmount(s?.kind === 'bank' ? '50' : s?.partner ? String(Math.max(s.partner.minimumAed, 5)) : '10');
    setSheet(s);
  });
  const amt = Number(amount);
  const min = sheet?.kind === 'bank' ? 50 : sheet?.kind === 'nol' ? 5 : sheet?.partner?.minimumAed ?? 1;
  const invalid = !Number.isFinite(amt) || amt < min || amt > 500;
  const insufficient = sheet?.kind !== 'bank' && amt > w.aed;

  const confirm = () => {
    if (!sheet || invalid) return;
    redeem.mutate({ data: { kind: sheet.kind, amount: amt, partnerId: sheet.kind==='donation' ? (project==='solar'?2:1) : sheet.partner?.id } }, {
      onSuccess: (r) => {
        void qc.invalidateQueries({ queryKey: getGetWalletQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setSheet(null);
        if(r.status==='coming soon'){setBankConfirmation(true);return;}
        toast({ title: t('wallet.success'), description: `${aed(r.amount)} · ${r.partner}` });
        if (r.code) { setQr(r); setTab('vouchers'); }
      },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };

  const ledgerIcon = (type: string) => type.includes('redeem') ? <ArrowUpRight className="h-4 w-4" /> : type.includes('expir') ? <Clock className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />;
  const sheetTitle = sheet ? (sheet.kind === 'nol' ? t('wallet.nol') : sheet.kind === 'donation' ? t('wallet.donate') : sheet.kind === 'bank' ? t('wallet.bank') : sheet.partner?.name ?? '') : '';

  return (
    <div className="space-y-6">
      <PageHeader title={t('wallet.title')} />
      <section className="grain relative overflow-hidden rounded-2xl bg-[#111111] p-6 text-[#F5F6F7] md:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#B8964B] via-[#e4cc92] to-[#B8964B]" />
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#d9bd7f]">{t('wallet.balance')}</div>
            <div className="num mt-1 text-5xl font-extrabold" data-testid="text-wallet-balance">{aed(w.aed)}</div>
            <div className="num mt-1 text-sm text-white/60">{num(w.credits)} {t('credits')} · {num(rate)} {t('wallet.rate')}</div>
          </div>
          <div><div className="text-xs text-white/50">{t('wallet.earned')}</div><div className="num text-xl font-bold">{num(w.totalEarned)} {t('credits')}</div></div>
          <div><div className="text-xs text-white/50">{t('wallet.expiring')}</div><div className="num text-xl font-bold text-[#e4cc92]">{num(w.expiringCredits)} {t('credits')}</div></div>
        </div>
      </section>
      {w.expiringCredits > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm" data-testid="alert-expiry">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><span><b className="num">{num(w.expiringCredits)}</b> {t('wallet.expiryWarn')}</span>
        </div>
      )}

      <section>
        <SectionTitle>{t('wallet.redeem')}</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <button onClick={() => open({ kind: 'nol' })} className="card-soft group p-5 text-start transition-transform hover:-translate-y-0.5" data-testid="button-redeem-nol">
            <CreditCard className="h-6 w-6 text-primary" /><div className="mt-3 font-bold">{t('wallet.nol')}</div><p className="text-sm text-muted-foreground">{t('wallet.nolDesc')}</p>
          </button>
          <button onClick={() => open({ kind: 'donation' })} className="card-soft p-5 text-start transition-transform hover:-translate-y-0.5" data-testid="button-redeem-donation">
            <Sprout className="h-6 w-6 text-[#00732F]" /><div className="mt-3 font-bold">{t('wallet.donate')}</div><p className="text-sm text-muted-foreground">{t('wallet.donateDesc')}</p>
          </button>
          <button onClick={() => open({ kind: 'bank' })} className="card-soft relative p-5 text-start transition-transform hover:-translate-y-0.5" data-testid="button-redeem-bank">
            <span className="absolute end-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">{t('wallet.comingSoon')}</span>
            <Landmark className="h-6 w-6" /><div className="mt-3 font-bold">{t('wallet.bank')}</div><p className="text-sm text-muted-foreground">{t('wallet.bankDesc')}</p>
          </button>
        </div>
        <h3 className="mb-2 mt-5 text-sm font-bold">{t('wallet.partners')}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none md:grid md:grid-cols-5 md:overflow-visible">
          {w.partners.map((p) => (
            <button key={p.id} onClick={() => open({ kind: 'voucher', partner: p })} className="min-w-[190px] rounded-xl border border-[#B8964B]/40 bg-card p-4 text-start transition-colors hover:border-[#B8964B]" data-testid={`button-partner-${p.id}`}>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#B8964B]/15 text-sm font-extrabold text-[#8a6d2f] dark:text-[#d9bd7f]">{p.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}</div>
              <div className="mt-2 font-bold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.category}</div>
              <p className="mt-1 line-clamp-2 text-xs">{p.description}</p>
              <div className="num mt-2 text-xs font-semibold text-[#8a6d2f] dark:text-[#d9bd7f]">{t('wallet.min')} {aed(p.minimumAed)}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card-soft p-4 md:p-5">
        <div className="mb-3 flex gap-2">
          {(['history', 'vouchers'] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={`h-9 rounded-full px-4 text-sm font-semibold ${tab === k ? 'bg-foreground text-background' : 'border'}`} data-testid={`tab-wallet-${k}`}>{t(`wallet.${k}`)}{k === 'vouchers' ? ` (${w.redemptions.length})` : ''}</button>)}
        </div>
        {tab === 'history' ? (w.history.length === 0 ? <EmptyState icon={<Clock className="h-6 w-6" />} text={t('wallet.noHistory')} /> : (
          <ul className="divide-y">
            {w.history.map((h) => {
              const neg = h.credits < 0;
              return (
                <li key={h.id} className="flex items-center gap-3 py-3" data-testid={`row-ledger-${h.id}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${neg ? 'bg-muted' : 'bg-accent text-accent-foreground'}`}>{ledgerIcon(h.type.toLowerCase())}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t(h.description)}</div>
                    <div className="text-xs text-muted-foreground">{date(h.createdAt)}{h.expiresAt ? ` · ${t('wallet.expires')} ${date(h.expiresAt, false)}` : ''}</div>
                  </div>
                  <div className="text-end">
                    <div className={`num font-bold ${neg ? '' : 'text-[#00732F] dark:text-emerald-400'}`}>{neg ? '' : '+'}{num(h.credits)}</div>
                    <div className="num text-xs text-muted-foreground">{aed(Math.abs(h.credits) / rate)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )) : (w.redemptions.length === 0 ? <EmptyState icon={<Ticket className="h-6 w-6" />} text={t('wallet.noVouchers')} /> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {w.redemptions.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-dashed border-[#B8964B]/60 p-4" data-testid={`card-voucher-${r.id}`}>
                <Gift className="h-6 w-6 shrink-0 text-[#B8964B]" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{r.partner} · <span className="num">{aed(r.amount)}</span></div>
                  <div dir="ltr" className="num truncate font-mono text-xs text-muted-foreground">{r.code}</div>
                  <div className="text-xs text-muted-foreground">{t('wallet.expires')} {date(r.expiresAt, false)} · {t(r.status)}</div>
                </div>
                {r.code && <button onClick={() => setQr(r)} className="inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold hover:bg-muted" data-testid={`button-qr-${r.id}`}><QrCode className="h-4 w-4" />{t('wallet.qr')}</button>}
              </li>
            ))}
          </ul>
        ))}
      </section>

      <Dialog open={!!sheet} onOpenChange={(o) => !o && setSheet(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{sheetTitle}</DialogTitle>
          <DialogDescription>{sheet?.kind === 'bank' ? t('wallet.bankBody') : sheet?.partner?.description ? t(sheet.partner.description) : (sheet?.kind === 'nol' ? t('wallet.nolDesc') : t('wallet.donateDesc'))}</DialogDescription>
          {sheet?.kind==='donation' && <label className="block text-sm font-semibold">{t('wallet.project')}<select value={project} onChange={e=>setProject(e.target.value)} className="mt-1 h-12 w-full rounded-lg border bg-card px-3"><option value="tree">{t('wallet.treeProject')}</option><option value="solar">{t('wallet.solarProject')}</option></select></label>}
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t('wallet.amount')}</span>
            <input dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} className="num h-12 w-full rounded-lg border border-input bg-card px-3 text-lg font-bold" data-testid="input-redeem-amount" />
          </label>
          <div className="flex flex-wrap gap-2">
            {(sheet?.kind === 'bank' ? [50, 100, 200] : [5, 10, 25, 50]).map((v) => <button key={v} onClick={() => setAmount(String(v))} className="num h-9 rounded-full border px-3 text-sm font-semibold hover:bg-muted">{aed(v)}</button>)}
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            {t('wallet.cost')} <b className="num">{num(Math.round((amt || 0) * rate))}</b> {t('credits')} · {t('wallet.balance')} <span className="num">{aed(w.aed)}</span>
            {amt < min && <div className="mt-1 text-primary">{t('wallet.min')} {aed(min)}</div>}
            {insufficient && <div className="mt-1 text-primary">{t('wallet.insufficient')}</div>}
          </div>
          <button disabled={invalid || insufficient || redeem.isPending} onClick={confirm} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-confirm-redeem">
            {redeem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{sheet?.kind === 'bank' ? t('wallet.registerInterest') : t('wallet.confirm')}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={bankConfirmation} onOpenChange={setBankConfirmation}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{t('wallet.bank')}</DialogTitle>
          <DialogDescription>{t('wallet.bankConfirmation')}</DialogDescription>
          <button className="h-12 rounded-lg bg-primary px-4 font-semibold text-primary-foreground" onClick={()=>setBankConfirmation(false)}>{t('wallet.closeConfirmation')}</button>
        </DialogContent>
      </Dialog>
      <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="text-center text-xl font-extrabold">{qr?.partner}</DialogTitle>
          <DialogDescription className="text-center">{qr && `${aed(qr.amount)} · ${t('wallet.expires')} ${date(qr.expiresAt, false)}`}</DialogDescription>
          {qr && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl border-4 border-[#B8964B] bg-[#F5F6F7] p-4"><QRCodeSVG value={`MASARGREEN:${qr.code}`} size={200} fgColor="#111111" bgColor="#F5F6F7" /></div>
              <div dir="ltr" className="num font-mono text-lg font-bold tracking-widest" data-testid="text-voucher-code">{qr.code}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

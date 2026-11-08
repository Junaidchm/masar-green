import { useState } from 'react';
import { Nfc, KeyRound, CreditCard, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';

const DEMOS = [
  { card: '12345678', pin: '1111', key: 'demo.amina', initials: 'AM', tone: '#00732F' },
  { card: '87654321', pin: '2222', key: 'demo.new', initials: 'NU', tone: '#5B5F66' },
  { card: '11223344', pin: '3333', key: 'demo.omar', initials: 'OM', tone: '#B8964B' },
  { card: '55667788', pin: '4444', key: 'demo.employer', initials: 'EA', tone: '#111111' },
  { card: '99887766', pin: '5555', key: 'demo.city', initials: 'CA', tone: '#C8102E' },
];

export function NolCardGraphic({ number }: { number: string }) {
  const shown = (number || '').padEnd(10, '•').replace(/(.{4})/g, '$1 ').trim();
  return (
    <div dir="ltr" className="grain relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-[#111111] p-5 text-[#F5F6F7] shadow-2xl">
      <div className="absolute inset-y-0 left-0 w-3 bg-[#C8102E]" />
      <svg className="absolute -right-10 -top-6 h-48 w-48 opacity-90" viewBox="0 0 200 200" aria-hidden>
        <path d="M10 170 C 70 170, 70 90, 120 90 S 170 30, 195 20" stroke="#00732F" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M10 170 C 70 170, 70 90, 120 90 S 170 30, 195 20" stroke="#B8964B" strokeWidth="2" fill="none" strokeDasharray="2 8" />
      </svg>
      <div className="relative flex h-full flex-col justify-between ps-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Transit card</span>
          <Nfc className="h-5 w-5 text-white/70" />
        </div>
        <div className="h-8 w-11 rounded-md bg-gradient-to-br from-[#d9c08a] to-[#9c7d3a]" />
        <div>
          <div className="num font-mono text-lg tracking-[0.18em]">{shown}</div>
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-white/60"><span>Masar Green linked</span><span>Simulated</span></div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { signIn, signingIn } = useAuth();
  const [card, setCard] = useState('');
  const [pin, setPin] = useState('');
  const [errs, setErrs] = useState<{ card?: string; pin?: string }>({});
  const [nfcMsg, setNfcMsg] = useState<string | null>(null);

  const submit = (c = card, p = pin) => {
    const e: typeof errs = {};
    if (!/^\d{8,10}$/.test(c)) e.card = t('login.cardErr');
    if (!/^\d{4}$/.test(p)) e.pin = t('login.pinErr');
    setErrs(e);
    if (Object.keys(e).length) return;
    void signIn(c, p);
  };

  const tap = async () => {
    const W = window as unknown as { NDEFReader?: new () => { scan: () => Promise<void>; addEventListener: (n: string, f: (ev: { serialNumber?: string }) => void) => void } };
    if (!W.NDEFReader) { setNfcMsg(t('login.nfcUnsupported')); return; }
    try {
      const r = new W.NDEFReader();
      await r.scan();
      setNfcMsg(t('login.nfcReady'));
      r.addEventListener('reading', (ev) => {
        const digits = (ev.serialNumber ?? '').split(':').map((h) => parseInt(h, 16)).join('').slice(0, 10);
        if (digits.length >= 8) { setCard(digits); toast({ title: t('login.nfcRead') }); setNfcMsg(null); }
      });
    } catch {
      setNfcMsg(t('login.nfcUnsupported'));
    }
  };

  return (
    <div className="space-y-5">
      {!compact && <NolCardGraphic number={card} />}
      <p className="flex items-start gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm text-accent-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t('login.explain')}</p>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="block">
          <span className="mb-1 flex justify-between text-sm font-semibold">{t('login.card')}<span className="font-normal text-muted-foreground">{t('login.cardHint')}</span></span>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input dir="ltr" inputMode="numeric" autoComplete="off" maxLength={10} value={card} onChange={(e) => setCard(e.target.value.replace(/\D/g, ''))}
              className="num h-12 w-full rounded-lg border border-input bg-card ps-10 pe-3 font-mono tracking-widest text-start" placeholder="12345678" data-testid="input-card" aria-invalid={!!errs.card} />
          </div>
          {errs.card && <span className="mt-1 block text-xs font-medium text-primary">{errs.card}</span>}
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-sm font-semibold">{t('login.pin')}<span className="font-normal text-muted-foreground">{t('login.pinHint')}</span></span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input dir="ltr" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="num h-12 w-full rounded-lg border border-input bg-card ps-10 pe-3 font-mono tracking-[0.5em] text-start" placeholder="••••" data-testid="input-pin" aria-invalid={!!errs.pin} />
          </div>
          {errs.pin && <span className="mt-1 block text-xs font-medium text-primary">{errs.pin}</span>}
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={signingIn} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-transform active:scale-[.98] disabled:opacity-60" data-testid="button-login">
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 rtl:rotate-180" />} {t('login.submit')}
          </button>
          <button type="button" onClick={tap} className="inline-flex h-12 items-center gap-2 rounded-lg border px-4 text-sm font-semibold hover:bg-muted" data-testid="button-nfc">
            <Nfc className="h-4 w-4" /> {t('login.tap')}
          </button>
        </div>
        {nfcMsg && <p className="text-xs text-muted-foreground" data-testid="text-nfc">{nfcMsg}</p>}
      </form>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-bold">{t('login.demo')}</span>
          <span className="text-xs text-muted-foreground">{t('login.demoHint')}</span>
        </div>
        <div className="grid gap-2">
          {DEMOS.map((d) => (
            <button key={d.card} type="button" disabled={signingIn} onClick={() => { setCard(d.card); setPin(d.pin); submit(d.card, d.pin); }}
              className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-start transition-colors hover:border-foreground/30 hover:bg-muted/60" data-testid={`button-demo-${d.card}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-xs font-bold text-white" style={{ background: d.tone }}>{d.initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{t(d.key)}</span>
                <span dir="ltr" className="num block font-mono text-xs text-muted-foreground">{d.card} · PIN {d.pin}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t('login.local')}</p>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Car, ShieldCheck, Equal } from 'lucide-react';
import { useGetCarbonConfig, getGetCarbonConfigQueryKey } from '@workspace/api-client-react';
import { MODE_COLOR, modeKey, useI18n } from '@/lib/i18n';
import { ErrorState, ModeIcon, PageHeader, SectionTitle, Sk } from '@/components/common';

export default function CarbonPage() {
  const { t, num, aed } = useI18n();
  const q = useGetCarbonConfig({ query: { queryKey: getGetCarbonConfigQueryKey() } });
  const [km, setKm] = useState(18);
  const [mode, setMode] = useState('metro');

  const calc = useMemo(() => {
    if (!q.data) return null;
    const f = q.data.factors.find((x) => x.mode === mode)?.factor ?? 0;
    const saved = Math.max(0, (q.data.baseline - f) * km);
    const credits = Math.floor(saved * q.data.creditsPerKg);
    return { f, saved, credits, aed: credits / q.data.creditsPerAed, base: q.data.baseline * km, actual: f * km };
  }, [q.data, km, mode]);

  if (q.isLoading) return <div className="space-y-4"><Sk className="h-40" /><Sk className="h-72" /></div>;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data;
  const maxF = Math.max(c.baseline, ...c.factors.map((x) => x.factor));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t('carbon.title')} sub={t('carbon.explanation')} />
      <section className="grid gap-3 rounded-2xl bg-[#111111] p-6 text-[#F5F6F7] md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        <div><Car className="h-5 w-5 text-white/60" /><div className="mt-2 text-xs text-white/60">{t('carbon.baseline')}</div><div className="num text-2xl font-extrabold">{num(c.baseline, 2)}</div></div>
        <span className="text-2xl text-white/40">−</span>
        <div><ModeIcon mode={mode} className="h-5 w-5 text-white/60" /><div className="mt-2 text-xs text-white/60">{t('carbon.mode')}</div><div className="num text-2xl font-extrabold">{num(calc?.f ?? 0, 2)}</div></div>
        <Equal className="h-6 w-6 text-white/40" />
        <div><div className="text-xs text-white/60">{t('carbon.factorUnit')}</div><div className="num text-2xl font-extrabold text-[#5fd48f]">{num(c.baseline - (calc?.f ?? 0), 2)}</div></div>
        <p className="text-sm text-white/70 md:col-span-5">{t('carbon.formula')}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-soft p-5">
          <SectionTitle kicker={t('carbon.factorUnit')}>{t('carbon.factors')}</SectionTitle>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-3 text-sm"><span className="w-28 font-semibold">{t('mode.car')}</span><span className="h-3 flex-1 rounded-full bg-muted"><span className="block h-3 rounded-full bg-foreground" style={{ width: `${(c.baseline / maxF) * 100}%` }} /></span><span className="num w-12 text-end font-bold">{num(c.baseline, 2)}</span></li>
            {c.factors.map((f) => (
              <li key={f.mode} className="flex items-center gap-3 text-sm">
                <span className="w-28 font-semibold">{t(`mode.${modeKey(f.mode)}`)}</span>
                <span className="h-3 flex-1 rounded-full bg-muted"><span className="block h-3 rounded-full" style={{ width: `${Math.max(2, (f.factor / maxF) * 100)}%`, background: MODE_COLOR[modeKey(f.mode)] }} /></span>
                <span className="num w-12 text-end font-bold">{num(f.factor, 2)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card-soft p-5">
          <SectionTitle>{t('carbon.try')}</SectionTitle>
          <label className="block text-sm font-semibold">{t('carbon.distance')}: <span className="num">{num(km)} {t('km')}</span>
            <input type="range" min={1} max={60} value={km} onChange={(e) => setKm(Number(e.target.value))} className="mt-2 w-full accent-[#00732F]" data-testid="slider-distance" /></label>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.factors.map((f) => <button key={f.mode} onClick={() => setMode(f.mode)} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${mode === f.mode ? 'bg-foreground text-background' : 'border'}`} data-testid={`button-mode-${f.mode}`}><ModeIcon mode={f.mode} className="h-3.5 w-3.5" />{t(`mode.${modeKey(f.mode)}`)}</button>)}
          </div>
          {calc && (
            <div className="mt-5 rounded-xl bg-accent p-4 text-accent-foreground">
              <div className="text-xs font-bold uppercase tracking-wider">{t('carbon.result')}</div>
              <div className="num mt-1 text-3xl font-extrabold" data-testid="text-calc-saved">{num(calc.saved, 2)} {t('kg')} CO₂</div>
              <div className="num mt-1 text-sm">{num(calc.base, 2)} − {num(calc.actual, 2)} · = {num(calc.credits)} {t('credits')} = {aed(calc.aed)}</div>
            </div>
          )}
          <h4 className="mt-5 text-sm font-bold">{t('carbon.conversion')}</h4>
          <p className="num text-sm text-muted-foreground">1 {t('kg')} CO₂ = {num(c.creditsPerKg)} {t('credits')} · {num(c.creditsPerAed)} {t('credits')} = {aed(1)}</p>
        </section>
      </div>

      <section className="card-soft p-5">
        <SectionTitle>{t('carbon.verify')}</SectionTitle>
        <p className="text-sm">{t('carbon.verifyBody')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">{t('carbon.threshold')}</div><div className="num text-xl font-bold">{num(c.verificationThreshold <= 1 ? c.verificationThreshold * 100 : c.verificationThreshold)}%</div></div>
          <div className="rounded-lg bg-muted p-3"><div className="text-xs text-muted-foreground">{t('carbon.cap')}</div><div className="num text-xl font-bold">{num(c.dailyCap)} {t('credits')}</div></div>
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00732F]" />{t('carbon.abuse')}</div>
        </div>
      </section>
    </div>
  );
}

import type { ReactNode } from 'react';
import { Bike, Bus, Car, Footprints, Layers, Ship, TrainFront, TramFront, CarTaxiFront, AlertTriangle, RotateCw } from 'lucide-react';
import { MODE_COLOR, modeKey, useI18n } from '@/lib/i18n';
import { friendlyError } from '@/lib/auth';

export function ModeIcon({ mode, className = 'h-4 w-4' }: { mode: string; className?: string }) {
  const k = modeKey(mode);
  const I = { metro: TrainFront, bus: Bus, tram: TramFront, water: Ship, taxi: CarTaxiFront, bike: Bike, walk: Footprints, car: Car, mixed: Layers }[k] ?? Layers;
  return <I className={className} aria-hidden />;
}

export function ModeChip({ mode, line }: { mode: string; line?: string }) {
  const { t } = useI18n();
  const k = modeKey(mode);
  const c = MODE_COLOR[k];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold" style={{ background: `${c}18`, color: c }}>
      <ModeIcon mode={mode} className="h-3.5 w-3.5" />
      {line && line !== '-' ? line : t(`mode.${k}`)}
    </span>
  );
}

export function SectionTitle({ children, action, kicker }: { children: ReactNode; action?: ReactNode; kicker?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {kicker && <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{kicker}</div>}
        <h2 className="text-lg font-bold tracking-tight">{children}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="page-heading flex flex-wrap items-end justify-between gap-4 rise">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="card-soft flex flex-col items-center gap-3 p-8 text-center" data-testid="state-error">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><AlertTriangle className="h-6 w-6" /></div>
      <div className="font-semibold">{t('err.load')}</div>
      <p className="text-sm text-muted-foreground">{friendlyError(error, t)}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted" data-testid="button-retry">
          <RotateCw className="h-4 w-4" /> {t('err.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, text, action }: { icon: ReactNode; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">{icon}</div>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const raw = status.toLowerCase();
  const s = raw.includes('pend') ? 'pending_review' : raw === 'verified' ? 'completed' : raw;
  const cls = s.includes('pend') ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    : s.includes('active') ? 'bg-primary/10 text-primary'
    : s.includes('reject') ? 'bg-muted text-muted-foreground'
    : 'bg-accent text-accent-foreground';
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{t(`status.${s}`)}</span>;
}

export function FlagStripe() {
  return <div className="flag-stripe" aria-hidden><span className="r" /><span className="h"><i style={{ background: 'var(--uae-green)' }} /><i style={{ background: 'hsl(var(--card))' }} /><i style={{ background: 'var(--uae-black)' }} /></span></div>;
}

export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="150" fill="#1b6654" />
      <path d="M138 328 C105 226 190 170 275 168 C330 166 356 133 366 109 C409 263 345 365 245 357 C198 354 175 341 167 326" stroke="#d6ed74" strokeWidth="29" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M142 401 C162 310 212 257 304 222 M197 300 L190 251 M227 269 L281 282" stroke="#d6ed74" strokeWidth="26" fill="none" strokeLinecap="round" />
    </svg>
  );
}

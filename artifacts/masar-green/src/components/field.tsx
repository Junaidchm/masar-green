import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';

export function Field({ label, error, children, hint, id }: { label: string; error?: string; children: ReactNode; hint?: string; id: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {error ? <p className="text-xs font-semibold text-primary" role="alert" data-testid={`error-${id}`}>{t(error)}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, testid }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; testid: string }) {
  return (
    <div className="segmented-control flex flex-wrap gap-1.5" role="radiogroup">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} data-testid={`${testid}-${o.v}`}
          className="segment-option px-3 py-2 text-xs font-bold">{o.l}</button>
      ))}
    </div>
  );
}

export function sessionKey(): string {
  const k = 'mg-ad-session';
  let v = sessionStorage.getItem(k);
  if (!v || v.length < 20) {
    v = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(k, v);
  }
  return v;
}

export function seenOnce(id: number): boolean {
  const k = `mg-ad-seen-${id}`;
  if (sessionStorage.getItem(k)) return true;
  sessionStorage.setItem(k, '1');
  return false;
}

export function isHttps(u: string): boolean {
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
}

export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(v: string): string {
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function len(v: string, min: number, max: number): string | undefined {
  const s = v.trim();
  if (!s) return min > 0 ? 'v.required' : undefined;
  if (s.length < min) return 'v.min';
  if (s.length > max) return 'v.max';
  return undefined;
}

export const SEV_CLS: Record<string, string> = {
  info: 'bg-[#0F7C8C]/12 text-[#0F7C8C] dark:text-[#5ec4d1]',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  critical: 'bg-primary/12 text-primary',
};

export function isActiveAlert(a: { status: string; publishedAt: string; expiresAt: string }, now = Date.now()): boolean {
  return a.status === 'published' && new Date(a.publishedAt).getTime() <= now && new Date(a.expiresAt).getTime() > now;
}

export const fieldCls = 'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary aria-[invalid=true]:border-primary';
export const areaCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary aria-[invalid=true]:border-primary';

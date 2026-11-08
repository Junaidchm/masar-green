import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BellRing, Check, Clock, MapPin, Pencil, Plus, CheckCircle2, Send, LogIn, X } from 'lucide-react';
import {
  useGetServiceAlerts, getGetServiceAlertsQueryKey, useCreateServiceAlert, useUpdateServiceAlert, useMarkServiceAlertRead,
  useGetLocations, getGetLocationsQueryKey, type ServiceAlert, type AlertInput,
} from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth, friendlyError } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState, PageHeader, SectionTitle, Sk } from '@/components/common';
import { Field, Seg } from '@/components/field';
import { areaCls, fieldCls, fromLocalInput, isActiveAlert, len, SEV_CLS, toLocalInput } from '@/lib/engagement';

function useServices() {
  const q = useGetLocations({ query: { queryKey: getGetLocationsQueryKey(), staleTime: 300_000 } });
  return useMemo(() => {
    const places = q.data ?? [];
    const lines = [...new Set(places.map((p) => p.line).filter((l) => l && l !== '-'))].sort();
    const stations = [...new Set(places.map((p) => p.name))].sort();
    return { lines, stations, places };
  }, [q.data]);
}

function AlertCard({ a, admin, onEdit }: { a: ServiceAlert; admin?: boolean; onEdit?: (a: ServiceAlert) => void }) {
  const { t, lang, date } = useI18n();
  const qc = useQueryClient();
  const read = useMarkServiceAlertRead();
  const upd = useUpdateServiceAlert();
  const active = isActiveAlert(a);
  const expired = a.status === 'published' && new Date(a.expiresAt).getTime() <= Date.now();
  const st = expired ? 'expired' : a.status;
  const patch = (x: ServiceAlert) => qc.setQueryData<ServiceAlert[]>(getGetServiceAlertsQueryKey(), (old) => old?.map((o) => (o.id === x.id ? { ...o, ...x } : o)));
  const markRead = () => read.mutate({ id: a.id }, {
    onSuccess: () => { patch({ ...a, read: true }); toast({ title: t('al.markedRead') }); },
    onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
  });
  const setStatus = (status: AlertInput['status']) => {
    const { id, read: _r, simulated: _s, ...input } = a;
    void _r; void _s;
    upd.mutate({ id, data: { ...input, status, publishedAt: status === 'published' && new Date(a.publishedAt) > new Date() ? new Date().toISOString() : a.publishedAt } }, {
      onSuccess: (x) => { patch(x); toast({ title: `${t('al.saved')}: ${t(`ast.${x.status}`)}` }); },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };
  const ar = lang === 'ar';
  return (
    <article className={`card-soft relative overflow-hidden p-4 ${!a.read && active && !admin ? '' : ''}`} data-testid={`card-alert-${a.id}`}>
      <span className={`absolute inset-y-0 start-0 w-1 ${a.severity === 'critical' ? 'bg-[#C8102E]' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-[#0F7C8C]'}`} aria-hidden />
      <div className="flex flex-wrap items-center gap-2 ps-1">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${SEV_CLS[a.severity]}`}>{t(`sev.${a.severity}`)}</span>
        <span className="text-xs font-semibold">{t(`cat.${a.category}`)}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold"><MapPin className="h-3 w-3" />{a.audience === 'all' ? t('al.network') : `${t(`aud.${a.audience}`)}: ${a.service}`}</span>
        {admin && <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold" data-testid={`status-alert-${a.id}`}>{t(`ast.${st}`)}</span>}
        {a.simulated && <span className="rounded border border-dashed px-1.5 text-[10px] font-bold uppercase text-muted-foreground">{t('sp.simulated')}</span>}
        {!admin && !a.read && <span className="ms-auto h-2.5 w-2.5 rounded-full bg-[#C8102E]" aria-label={t('al.unread')} />}
      </div>
      <h3 className="mt-2 ps-1 font-bold" dir={ar ? 'rtl' : 'ltr'}>{ar ? a.titleAr : a.title}</h3>
      <p className="mt-1 whitespace-pre-wrap break-words ps-1 text-sm text-muted-foreground">{ar ? a.bodyAr : a.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 ps-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t('al.published')} {date(a.publishedAt)}</span>
        <span>{t('al.expires')} {date(a.expiresAt)}</span>
        <span className="ms-auto flex flex-wrap gap-2">
          {!admin && (a.read ? <span className="inline-flex items-center gap-1 font-semibold"><Check className="h-3.5 w-3.5" />{t('al.read')}</span>
            : <button onClick={markRead} disabled={read.isPending} className="h-8 rounded-lg border px-3 font-semibold text-foreground hover:bg-muted disabled:opacity-50" data-testid={`button-read-${a.id}`}>{t('al.markRead')}</button>)}
          {admin && <>
            <button onClick={() => onEdit?.(a)} className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 font-semibold text-foreground hover:bg-muted" data-testid={`button-edit-alert-${a.id}`}><Pencil className="h-3.5 w-3.5" />{t('al.edit')}</button>
            {a.status !== 'published' && <button onClick={() => setStatus('published')} disabled={upd.isPending} className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 font-semibold text-primary-foreground disabled:opacity-50" data-testid={`button-publish-alert-${a.id}`}><Send className="h-3.5 w-3.5 rtl:rotate-180" />{t('al.publishNow')}</button>}
            {a.status === 'published' && <button onClick={() => setStatus('resolved')} disabled={upd.isPending} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#00732F] px-3 font-semibold text-white disabled:opacity-50" data-testid={`button-resolve-alert-${a.id}`}><CheckCircle2 className="h-3.5 w-3.5" />{t('al.resolve')}</button>}
          </>}
        </span>
      </div>
    </article>
  );
}

type Form = Omit<AlertInput, 'publishedAt' | 'expiresAt'> & { publishedAt: string; expiresAt: string };
const blank = (): Form => ({
  title: '', body: '', titleAr: '', bodyAr: '', severity: 'warning', category: 'delay', audience: 'all', service: '', status: 'published',
  publishedAt: toLocalInput(new Date().toISOString()), expiresAt: toLocalInput(new Date(Date.now() + 6 * 3600e3).toISOString()),
});

function Publisher({ editing, onDone }: { editing: ServiceAlert | null; onDone: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { lines, stations } = useServices();
  const [f, setF] = useState<Form>(() => editing ? { ...editing, publishedAt: toLocalInput(editing.publishedAt), expiresAt: toLocalInput(editing.expiresAt) } : blank());
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const create = useCreateServiceAlert();
  const update = useUpdateServiceAlert();
  const pending = create.isPending || update.isPending;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const opts = f.audience === 'line' ? lines : f.audience === 'station' ? stations : [];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = fromLocalInput(f.publishedAt), x = fromLocalInput(f.expiresAt);
    const er = {
      title: len(f.title, 3, 120), titleAr: len(f.titleAr, 3, 120), body: len(f.body, 10, 2000), bodyAr: len(f.bodyAr, 10, 2000),
      service: f.audience !== 'all' && !opts.includes(f.service) ? 'v.service' : undefined,
      publishedAt: !p ? 'v.required' : undefined, expiresAt: !x ? 'v.required' : p && new Date(x) <= new Date(p) ? 'v.dates' : undefined,
    };
    setErrs(er);
    if (Object.values(er).some(Boolean)) return;
    const data: AlertInput = { title: f.title.trim(), titleAr: f.titleAr.trim(), body: f.body.trim(), bodyAr: f.bodyAr.trim(), severity: f.severity, category: f.category,
      audience: f.audience, service: f.audience === 'all' ? '' : f.service, status: f.status, publishedAt: p, expiresAt: x };
    const opt = {
      onSuccess: () => { toast({ title: t('al.saved') }); void qc.invalidateQueries({ queryKey: getGetServiceAlertsQueryKey() }); onDone(); },
      onError: (e: unknown) => toast({ title: friendlyError(e, t), variant: 'destructive' as const }),
    };
    if (editing) update.mutate({ id: editing.id, data }, opt); else create.mutate({ data }, opt);
  };
  const txt = (k: 'title' | 'titleAr', id: string, label: string, dir: 'ltr' | 'rtl') => (
    <Field id={id} label={label} error={errs[k]}><input id={id} data-testid={id} dir={dir} className={fieldCls} aria-invalid={!!errs[k]} value={f[k]} maxLength={120} onChange={(e) => set(k, e.target.value)} /></Field>
  );
  const area = (k: 'body' | 'bodyAr', id: string, label: string, dir: 'ltr' | 'rtl') => (
    <Field id={id} label={label} error={errs[k]}><textarea id={id} data-testid={id} dir={dir} rows={3} className={areaCls} aria-invalid={!!errs[k]} value={f[k]} maxLength={2000} onChange={(e) => set(k, e.target.value)} /></Field>
  );
  return (
    <form onSubmit={submit} noValidate className="card-soft space-y-4 p-5" data-testid="form-alert">
      <SectionTitle kicker={t('al.publisher')} action={editing && <button type="button" onClick={onDone} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted" aria-label={t('al.cancel')} data-testid="button-cancel-edit"><X className="h-4 w-4" /></button>}>
        {editing ? t('al.edit') : t('al.new')}
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">{txt('title', 'input-alert-title', t('al.titleEn'), 'ltr')}{txt('titleAr', 'input-alert-title-ar', t('al.titleAr'), 'rtl')}</div>
      <div className="grid gap-4 sm:grid-cols-2">{area('body', 'input-alert-body', t('al.bodyEn'), 'ltr')}{area('bodyAr', 'input-alert-body-ar', t('al.bodyAr'), 'rtl')}</div>
      <div className="space-y-1.5"><span className="text-sm font-semibold">{t('al.severity')}</span>
        <Seg testid="seg-severity" value={f.severity} onChange={(v) => set('severity', v)} options={(['info', 'warning', 'critical'] as const).map((v) => ({ v, l: t(`sev.${v}`) }))} /></div>
      <div className="space-y-1.5"><span className="text-sm font-semibold">{t('al.category')}</span>
        <Seg testid="seg-category" value={f.category} onChange={(v) => set('category', v)} options={(['delay', 'closure', 'disruption', 'general'] as const).map((v) => ({ v, l: t(`cat.${v}`) }))} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><span className="text-sm font-semibold">{t('al.audience')}</span>
          <Seg testid="seg-audience" value={f.audience} onChange={(v) => setF((p) => ({ ...p, audience: v, service: '' }))} options={(['all', 'line', 'station'] as const).map((v) => ({ v, l: t(`aud.${v}`) }))} /></div>
        {f.audience !== 'all' && (
          <Field id="select-alert-service" label={t('al.service')} error={errs.service}>
            <select id="select-alert-service" data-testid="select-alert-service" className={fieldCls} aria-invalid={!!errs.service} value={f.service} onChange={(e) => set('service', e.target.value)}>
              <option value="">—</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="select-alert-status" label={t('al.status')}>
          <select id="select-alert-status" data-testid="select-alert-status" className={fieldCls} value={f.status} onChange={(e) => set('status', e.target.value as Form['status'])}>
            {(['draft', 'published', 'resolved'] as const).map((s) => <option key={s} value={s}>{t(`ast.${s}`)}</option>)}
          </select>
        </Field>
        <Field id="input-alert-publish" label={t('al.publishAt')} error={errs.publishedAt}><input id="input-alert-publish" data-testid="input-alert-publish" type="datetime-local" className={fieldCls} value={f.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} /></Field>
        <Field id="input-alert-expire" label={t('al.expireAt')} error={errs.expiresAt}><input id="input-alert-expire" data-testid="input-alert-expire" type="datetime-local" className={fieldCls} aria-invalid={!!errs.expiresAt} value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} /></Field>
      </div>
      <button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-alert">
        <Send className="h-4 w-4 rtl:rotate-180" />{pending ? '…' : t('al.save')}
      </button>
    </form>
  );
}

export default function NotificationsPage() {
  const { t, num } = useI18n();
  const { user, openLogin, loading } = useAuth();
  const q = useGetServiceAlerts({ query: { queryKey: getGetServiceAlertsQueryKey(), enabled: !!user, refetchInterval: 15_000 } });
  const [svc, setSvc] = useState('');
  const [editing, setEditing] = useState<ServiceAlert | null>(null);
  const [formKey, setFormKey] = useState(0);
  const isCity = user?.role === 'city';
  const active = (q.data ?? []).filter((a) => isActiveAlert(a)).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  const services = [...new Set(active.filter((a) => a.audience !== 'all').map((a) => a.service))].sort();
  const shown = svc ? active.filter((a) => a.service === svc) : active;
  const unread = active.filter((a) => !a.read).length;

  if (loading) return <div className="space-y-3"><Sk className="h-16" /><Sk className="h-32" /><Sk className="h-32" /></div>;
  if (!user) return (
    <div><PageHeader title={t('al.title')} sub={t('al.sub')} />
      <EmptyState icon={<BellRing className="h-6 w-6" />} text={t('al.signIn')} action={<button onClick={openLogin} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="button-alerts-signin"><LogIn className="h-4 w-4 rtl:rotate-180" />{t('signInNol')}</button>} />
    </div>
  );

  return (
    <div>
      <PageHeader title={t('al.title')} sub={t('al.sub')} right={<span className="rounded-full bg-[#111111] px-3 py-1 text-sm font-bold text-[#F5F6F7] num dark:bg-[#F5F6F7] dark:text-[#111111]" data-testid="text-page-unread">{num(unread)} {t('al.unread')}</span>} />
      <div className={`grid gap-6 ${isCity ? 'xl:grid-cols-[1fr_1.1fr]' : ''}`}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="select-filter-service" className="text-sm font-semibold">{t('al.filterService')}</label>
            <select id="select-filter-service" data-testid="select-filter-service" className={`${fieldCls} h-10 w-auto min-w-[12rem]`} value={svc} onChange={(e) => setSvc(e.target.value)}>
              <option value="">{t('al.allServices')}</option>{services.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {q.isLoading ? <div className="space-y-3"><Sk className="h-32" /><Sk className="h-32" /></div>
            : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
            : !shown.length ? <EmptyState icon={<BellRing className="h-6 w-6" />} text={t('al.empty')} />
            : <div className="space-y-3">{shown.map((a) => <AlertCard key={a.id} a={a} />)}</div>}
        </section>
        {isCity && (
          <section className="space-y-4">
            {editing || formKey > 0 ? (
              <Publisher key={editing ? `e${editing.id}` : `n${formKey}`} editing={editing} onDone={() => { setEditing(null); setFormKey(0); }} />
            ) : (
              <button onClick={() => setFormKey(1)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 font-semibold hover:bg-muted" data-testid="button-new-alert"><Plus className="h-4 w-4" />{t('al.new')}</button>
            )}
            <SectionTitle>{t('al.allAlerts')}</SectionTitle>
            {q.isLoading ? <Sk className="h-32" /> : !q.data?.length ? <EmptyState icon={<BellRing className="h-6 w-6" />} text={t('al.noAll')} />
              : <div className="space-y-3">{[...q.data].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).map((a) => <AlertCard key={a.id} a={a} admin onEdit={(x) => { setEditing(x); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />)}</div>}
          </section>
        )}
      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquareWarning, Send, LogIn, Info, Reply, Lightbulb } from 'lucide-react';
import {
  useGetFeedback, getGetFeedbackQueryKey, useCreateFeedback, useReviewFeedback, useGetLocations, getGetLocationsQueryKey,
  type FeedbackTicket, type FeedbackInput, type FeedbackReviewStatus,
} from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth, friendlyError } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState, PageHeader, SectionTitle, Sk } from '@/components/common';
import { Field, Seg } from '@/components/field';
import { areaCls, fieldCls, len } from '@/lib/engagement';

const CATS = ['metro', 'bus', 'tram', 'water', 'accessibility', 'cleanliness', 'other'] as const;
const STATUSES = ['submitted', 'in_review', 'planned', 'resolved', 'closed'] as const;
const ST_CLS: Record<string, string> = {
  submitted: 'bg-muted text-foreground', in_review: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', planned: 'bg-[#0F7C8C]/12 text-[#0F7C8C] dark:text-[#5ec4d1]',
  resolved: 'bg-accent text-accent-foreground', closed: 'bg-muted text-muted-foreground',
};

function SubmitForm() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const loc = useGetLocations({ query: { queryKey: getGetLocationsQueryKey(), staleTime: 300_000 } });
  const stations = [...new Set((loc.data ?? []).map((p) => p.name))].sort();
  const init = (): FeedbackInput => ({ kind: 'complaint', category: 'metro', station: '', subject: '', description: '' });
  const [f, setF] = useState<FeedbackInput>(init);
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const [ref, setRef] = useState<string | null>(null);
  const m = useCreateFeedback();
  const set = <K extends keyof FeedbackInput>(k: K, v: FeedbackInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er = { subject: len(f.subject, 3, 120), description: len(f.description, 10, 4000) };
    setErrs(er);
    if (Object.values(er).some(Boolean)) return;
    m.mutate({ data: { ...f, subject: f.subject.trim(), description: f.description.trim() } }, {
      onSuccess: (tk) => {
        setRef(tk.reference); setF(init()); setErrs({});
        toast({ title: `${t('fb.submitted')} ${tk.reference}` });
        qc.setQueryData<FeedbackTicket[]>(getGetFeedbackQueryKey(), (old) => (old ? [tk, ...old] : [tk]));
      },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };
  return (
    <form onSubmit={submit} noValidate className="card-soft space-y-4 p-5" data-testid="form-feedback">
      <SectionTitle>{t('fb.new')}</SectionTitle>
      {ref && <div className="rounded-lg bg-accent p-3 text-sm font-semibold text-accent-foreground" data-testid="text-feedback-ref">{t('fb.submitted')} <span className="font-mono" dir="ltr">{ref}</span></div>}
      <div className="space-y-1.5"><span className="text-sm font-semibold">{t('fb.kind')}</span>
        <Seg testid="seg-kind" value={f.kind} onChange={(v) => set('kind', v)} options={[{ v: 'complaint', l: t('fb.complaint') }, { v: 'suggestion', l: t('fb.suggestion') }]} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="select-fb-category" label={t('fb.category')}>
          <select id="select-fb-category" data-testid="select-fb-category" className={fieldCls} value={f.category} onChange={(e) => set('category', e.target.value as FeedbackInput['category'])}>
            {CATS.map((c) => <option key={c} value={c}>{t(`fbc.${c}`)}</option>)}
          </select>
        </Field>
        <Field id="select-fb-station" label={t('fb.station')}>
          <select id="select-fb-station" data-testid="select-fb-station" className={fieldCls} value={f.station} onChange={(e) => set('station', e.target.value)}>
            <option value="">{t('fb.noStation')}</option>{stations.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field id="input-fb-subject" label={t('fb.subject')} error={errs.subject}><input id="input-fb-subject" data-testid="input-fb-subject" className={fieldCls} aria-invalid={!!errs.subject} value={f.subject} maxLength={120} onChange={(e) => set('subject', e.target.value)} /></Field>
      <Field id="input-fb-desc" label={t('fb.description')} error={errs.description} hint={`${f.description.length}/4000`}><textarea id="input-fb-desc" data-testid="input-fb-desc" rows={5} className={areaCls} aria-invalid={!!errs.description} value={f.description} maxLength={4000} onChange={(e) => set('description', e.target.value)} /></Field>
      <button disabled={m.isPending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-submit-feedback">
        <Send className="h-4 w-4 rtl:rotate-180" />{m.isPending ? '…' : t('fb.submit')}
      </button>
    </form>
  );
}

function Ticket({ tk, admin }: { tk: FeedbackTicket; admin?: boolean }) {
  const { t, date } = useI18n();
  const qc = useQueryClient();
  const [status, setStatus] = useState<FeedbackReviewStatus>(tk.status);
  const [reply, setReply] = useState('');
  const m = useReviewFeedback();
  const save = () => {
    if (reply.length > 2000) return;
    m.mutate({ id: tk.id, data: { status, ...(reply.trim() ? { reply: reply.trim() } : {}) } }, {
      onSuccess: (x) => { setReply(''); qc.setQueryData<FeedbackTicket[]>(getGetFeedbackQueryKey(), (old) => old?.map((o) => (o.id === x.id ? x : o))); toast({ title: t('fb.updated') }); },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };
  const Icon = tk.kind === 'suggestion' ? Lightbulb : MessageSquareWarning;
  return (
    <article className="card-soft p-4" data-testid={`card-feedback-${tk.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold" dir="ltr" data-testid={`text-ref-${tk.id}`}>{tk.reference}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ST_CLS[tk.status]}`} data-testid={`status-feedback-${tk.id}`}>{t(`fbs.${tk.status}`)}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5" />{t(tk.kind === 'suggestion' ? 'fb.suggestion' : 'fb.complaint')} · {t(`fbc.${tk.category}`)}{tk.station ? ` · ${tk.station}` : ''}</span>
        <span className="ms-auto text-xs text-muted-foreground">{date(tk.createdAt)}</span>
      </div>
      <h3 className="mt-2 break-words font-bold">{tk.subject}</h3>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{tk.description}</p>
      <div className="mt-3 border-t pt-3">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fb.replies')}</div>
        {tk.replies.length === 0 ? <p className="text-sm text-muted-foreground">{t('fb.noReplies')}</p> : (
          <ul className="space-y-2">{tk.replies.map((r) => (
            <li key={r.id} className="rounded-lg border-s-2 border-[#00732F] bg-muted/60 px-3 py-2 text-sm">
              <p className="whitespace-pre-wrap break-words">{r.body}</p><span className="text-[11px] text-muted-foreground">{date(r.createdAt)}</span>
            </li>))}</ul>
        )}
      </div>
      {admin && (
        <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
          <select aria-label={t('al.status')} data-testid={`select-status-${tk.id}`} className={`${fieldCls} h-10`} value={status} onChange={(e) => setStatus(e.target.value as FeedbackReviewStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`fbs.${s}`)}</option>)}
          </select>
          <textarea aria-label={t('fb.reply')} placeholder={t('fb.reply')} data-testid={`input-reply-${tk.id}`} rows={1} maxLength={2000} className={areaCls} value={reply} onChange={(e) => setReply(e.target.value)} />
          <button onClick={save} disabled={m.isPending || (status === tk.status && !reply.trim())} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" data-testid={`button-review-${tk.id}`}>
            <Reply className="h-4 w-4 rtl:-scale-x-100" />{t('fb.update')}
          </button>
        </div>
      )}
    </article>
  );
}

export default function FeedbackPage() {
  const { t } = useI18n();
  const { user, loading, openLogin } = useAuth();
  const q = useGetFeedback({ query: { queryKey: getGetFeedbackQueryKey(), enabled: !!user, refetchInterval: 30_000 } });
  const [st, setSt] = useState('');
  const [cat, setCat] = useState('');
  const isCity = user?.role === 'city';
  const list = (q.data ?? []).filter((x) => (!st || x.status === st) && (!cat || x.category === cat)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  if (loading) return <div className="space-y-3"><Sk className="h-16" /><Sk className="h-64" /></div>;
  return (
    <div>
      <PageHeader title={t('fb.title')} sub={t('fb.sub')} />
      {!user ? (
        <EmptyState icon={<MessageSquareWarning className="h-6 w-6" />} text={t('fb.signIn')} action={<button onClick={openLogin} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="button-feedback-signin"><LogIn className="h-4 w-4 rtl:rotate-180" />{t('signInNol')}</button>} />
      ) : (
        <div className={`grid gap-6 ${isCity ? '' : 'lg:grid-cols-[1fr_1.1fr]'}`}>
          {user.role === 'commuter' && <SubmitForm />}
          {user.role === 'employer' && <p className="card-soft flex h-fit items-start gap-2 p-4 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0" />{t('fb.commuterOnly')}</p>}
          <section>
            <SectionTitle>{isCity ? t('fb.queue') : t('fb.mine')}</SectionTitle>
            {isCity && (
              <div className="mb-4 flex flex-wrap gap-2">
                <select aria-label={t('al.status')} data-testid="select-filter-status" className={`${fieldCls} h-10 w-auto`} value={st} onChange={(e) => setSt(e.target.value)}>
                  <option value="">{t('fb.allStatus')}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`fbs.${s}`)}</option>)}
                </select>
                <select aria-label={t('fb.category')} data-testid="select-filter-category" className={`${fieldCls} h-10 w-auto`} value={cat} onChange={(e) => setCat(e.target.value)}>
                  <option value="">{t('fb.allCat')}</option>{CATS.map((c) => <option key={c} value={c}>{t(`fbc.${c}`)}</option>)}
                </select>
              </div>
            )}
            {q.isLoading ? <div className="space-y-3"><Sk className="h-36" /><Sk className="h-36" /></div>
              : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
              : !list.length ? <EmptyState icon={<MessageSquareWarning className="h-6 w-6" />} text={isCity ? t('fb.queueEmpty') : t('fb.empty')} />
              : <div className={`grid gap-3 ${isCity ? 'xl:grid-cols-2' : ''}`}>{list.map((x) => <Ticket key={`${x.id}-${x.status}`} tk={x} admin={isCity} />)}</div>}
          </section>
        </div>
      )}
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Megaphone, Inbox, Send, ShieldCheck, Info, LogIn, Eye, MousePointerClick } from 'lucide-react';
import {
  useGetCampaigns, getGetCampaignsQueryKey, useCreateCampaign, useModerateCampaign,
  useGetSponsorshipEnquiries, getGetSponsorshipEnquiriesQueryKey, useCreateSponsorshipEnquiry,
  getGetSponsoredPlacementsQueryKey, type Campaign, type CampaignModerationStatus,
} from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth, friendlyError } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState, PageHeader, SectionTitle, Sk } from '@/components/common';
import { Field, Seg } from '@/components/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { areaCls, fieldCls, fromLocalInput, isHttps, len, toLocalInput } from '@/lib/engagement';

type Placement = 'dashboard' | 'community';
const CS_CLS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', approved: 'bg-[#0F7C8C]/12 text-[#0F7C8C] dark:text-[#5ec4d1]',
  published: 'bg-accent text-accent-foreground', paused: 'bg-muted text-muted-foreground', rejected: 'bg-primary/10 text-primary',
};

function EnquiryForm() {
  const { t } = useI18n();
  const { user, openLogin } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ company: '', contactName: '', email: '', placement: 'dashboard' as Placement, message: '' });
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const m = useCreateSponsorshipEnquiry();
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) { openLogin(); return; }
    const er = {
      company: len(f.company, 2, 100), contactName: len(f.contactName, 2, 100),
      email: !f.email.trim() ? 'v.required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) || f.email.length > 200 ? 'v.email' : undefined,
      message: len(f.message, 10, 2000),
    };
    setErrs(er);
    if (Object.values(er).some(Boolean)) return;
    m.mutate({ data: { ...f, company: f.company.trim(), contactName: f.contactName.trim(), email: f.email.trim(), message: f.message.trim() } }, {
      onSuccess: () => {
        toast({ title: t('ad.sent') });
        setF({ company: '', contactName: '', email: '', placement: 'dashboard', message: '' });
        void qc.invalidateQueries({ queryKey: getGetSponsorshipEnquiriesQueryKey() });
      },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };
  return (
    <form onSubmit={submit} noValidate className="card-soft space-y-4 p-5" data-testid="form-enquiry">
      <SectionTitle kicker={t('ad.tab.enquire')}>{t('ad.enquiry')}</SectionTitle>
      {!user && <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm"><LogIn className="mt-0.5 h-4 w-4 shrink-0" />{t('ad.signInEnquire')}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="input-company" label={t('ad.company')} error={errs.company}><input id="input-company" data-testid="input-company" className={fieldCls} aria-invalid={!!errs.company} value={f.company} maxLength={100} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field id="input-contact" label={t('ad.contact')} error={errs.contactName}><input id="input-contact" data-testid="input-contact" className={fieldCls} aria-invalid={!!errs.contactName} value={f.contactName} maxLength={100} onChange={(e) => set('contactName', e.target.value)} /></Field>
      </div>
      <Field id="input-email" label={t('ad.email')} error={errs.email}><input id="input-email" type="email" dir="ltr" data-testid="input-email" className={fieldCls} aria-invalid={!!errs.email} value={f.email} maxLength={200} onChange={(e) => set('email', e.target.value)} /></Field>
      <div className="space-y-1.5"><span className="text-sm font-semibold">{t('ad.placement')}</span>
        <Seg testid="seg-enquiry-placement" value={f.placement} onChange={(v) => set('placement', v)} options={[{ v: 'dashboard', l: t('place.dashboard') }, { v: 'community', l: t('place.community') }]} /></div>
      <Field id="input-message" label={t('ad.message')} error={errs.message}><textarea id="input-message" data-testid="input-message" rows={4} className={areaCls} aria-invalid={!!errs.message} value={f.message} maxLength={2000} onChange={(e) => set('message', e.target.value)} /></Field>
      <button disabled={m.isPending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-send-enquiry">
        <Send className="h-4 w-4 rtl:rotate-180" />{m.isPending ? '…' : t('ad.send')}
      </button>
    </form>
  );
}

function EnquiryList() {
  const { t, date } = useI18n();
  const { user } = useAuth();
  const q = useGetSponsorshipEnquiries({ query: { queryKey: getGetSponsorshipEnquiriesQueryKey(), enabled: !!user, refetchInterval: 30_000 } });
  if (!user) return null;
  return (
    <section className="card-soft p-5">
      <SectionTitle>{user.role === 'city' ? t('ad.allEnquiries') : t('ad.myEnquiries')}</SectionTitle>
      {q.isLoading ? <div className="space-y-2"><Sk className="h-16" /><Sk className="h-16" /></div>
        : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
        : !q.data?.length ? <EmptyState icon={<Inbox className="h-6 w-6" />} text={t('ad.noEnquiries')} />
        : <ul className="divide-y">{q.data.map((e) => (
          <li key={e.id} className="py-3" data-testid={`row-enquiry-${e.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{e.company}</span><span className="text-xs text-muted-foreground">{date(e.createdAt)}</span></div>
            <div className="text-xs text-muted-foreground">{e.contactName} · <span dir="ltr">{e.email}</span> · {t(`place.${e.placement}`)}</div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{e.message}</p>
          </li>))}</ul>}
    </section>
  );
}

function CampaignForm() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const now = new Date();
  const init = () => ({ advertiser: '', title: '', description: '', destinationUrl: 'https://', imageUrl: '', placement: 'dashboard' as Placement,
    startsAt: toLocalInput(now.toISOString()), endsAt: toLocalInput(new Date(now.getTime() + 14 * 864e5).toISOString()), budgetAed: '2500' });
  const [f, setF] = useState(init);
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const m = useCreateCampaign();
  const set = (k: keyof ReturnType<typeof init>, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = fromLocalInput(f.startsAt), en = fromLocalInput(f.endsAt), b = Number(f.budgetAed);
    const er = {
      advertiser: len(f.advertiser, 2, 100), title: len(f.title, 3, 120), description: len(f.description, 10, 600),
      destinationUrl: !isHttps(f.destinationUrl.trim()) ? 'v.https' : f.destinationUrl.length > 500 ? 'v.max' : undefined,
      imageUrl: f.imageUrl.trim() && !isHttps(f.imageUrl.trim()) ? 'v.https' : f.imageUrl.length > 500 ? 'v.max' : undefined,
      startsAt: !s ? 'v.required' : undefined,
      endsAt: !en ? 'v.required' : s && new Date(en) <= new Date(s) ? 'v.dates' : undefined,
      budgetAed: f.budgetAed === '' || !Number.isFinite(b) || b < 0 || b > 1_000_000 ? 'v.budget' : undefined,
    };
    setErrs(er);
    if (Object.values(er).some(Boolean)) return;
    m.mutate({ data: { advertiser: f.advertiser.trim(), title: f.title.trim(), description: f.description.trim(), destinationUrl: f.destinationUrl.trim(),
      imageUrl: f.imageUrl.trim(), placement: f.placement, startsAt: s, endsAt: en, budgetAed: b } }, {
      onSuccess: () => { toast({ title: t('ad.created') }); setF(init()); setErrs({}); void qc.invalidateQueries({ queryKey: getGetCampaignsQueryKey() }); },
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };
  const inp = (k: keyof ReturnType<typeof init>, id: string, label: string, extra: Record<string, unknown> = {}) => (
    <Field id={id} label={label} error={errs[k]}>
      <input id={id} data-testid={id} className={fieldCls} aria-invalid={!!errs[k]} value={f[k]} onChange={(e) => set(k, e.target.value)} {...extra} />
    </Field>
  );
  return (
    <form onSubmit={submit} noValidate className="card-soft space-y-4 p-5" data-testid="form-campaign">
      <SectionTitle kicker={t('nav.employer')}>{t('ad.newCampaign')}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {inp('advertiser', 'input-advertiser', t('ad.advertiser'), { maxLength: 100 })}
        {inp('title', 'input-campaign-title', t('ad.cTitle'), { maxLength: 120 })}
      </div>
      <Field id="input-campaign-desc" label={t('ad.description')} error={errs.description}>
        <textarea id="input-campaign-desc" data-testid="input-campaign-desc" rows={3} className={areaCls} aria-invalid={!!errs.description} value={f.description} maxLength={600} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {inp('destinationUrl', 'input-destination', t('ad.destination'), { dir: 'ltr', type: 'url', maxLength: 500 })}
        {inp('imageUrl', 'input-image', t('ad.image'), { dir: 'ltr', type: 'url', maxLength: 500 })}
      </div>
      <div className="space-y-1.5"><span className="text-sm font-semibold">{t('ad.placement')}</span>
        <Seg testid="seg-campaign-placement" value={f.placement} onChange={(v) => set('placement', v)} options={[{ v: 'dashboard', l: t('place.dashboard') }, { v: 'community', l: t('place.community') }]} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {inp('startsAt', 'input-starts', t('ad.starts'), { type: 'datetime-local' })}
        {inp('endsAt', 'input-ends', t('ad.ends'), { type: 'datetime-local' })}
        {inp('budgetAed', 'input-budget', t('ad.budget'), { type: 'number', min: 0, max: 1000000, inputMode: 'decimal' })}
      </div>
      <button disabled={m.isPending} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-submit-campaign">
        <Megaphone className="h-4 w-4" />{m.isPending ? '…' : t('ad.submit')}
      </button>
    </form>
  );
}

function CampaignCard({ c, moderate }: { c: Campaign; moderate?: boolean }) {
  const { t, num, date, aed } = useI18n();
  const qc = useQueryClient();
  const m = useModerateCampaign();
  const act = (status: CampaignModerationStatus) => m.mutate({ id: c.id, data: { status } }, {
    onSuccess: (upd) => {
      qc.setQueryData<Campaign[]>(getGetCampaignsQueryKey(), (old) => old?.map((x) => (x.id === upd.id ? upd : x)));
      void qc.invalidateQueries({ queryKey: getGetSponsoredPlacementsQueryKey() });
      toast({ title: `${t('ad.moderated')}: ${t(`cs.${upd.status}`)}` });
    },
    onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
  });
  const actions: { s: CampaignModerationStatus; l: string }[] = [
    { s: 'approved', l: t('ad.approve') }, { s: 'published', l: t('ad.publish') }, { s: 'paused', l: t('ad.pause') }, { s: 'rejected', l: t('ad.reject') },
  ];
  const ctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0;
  return (
    <article className="card-soft p-4" data-testid={`card-campaign-${c.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${CS_CLS[c.status]}`} data-testid={`status-campaign-${c.id}`}>{t(`cs.${c.status}`)}</span>
        <span className="text-xs font-semibold text-muted-foreground">{t(`place.${c.placement}`)}</span>
        {c.simulated && <span className="rounded border border-dashed px-1.5 text-[10px] font-bold uppercase text-muted-foreground">{t('sp.simulated')}</span>}
      </div>
      <h3 className="mt-2 font-bold">{c.title}</h3>
      <div className="text-xs text-muted-foreground">{c.advertiser} · {date(c.startsAt, false)} – {date(c.endsAt, false)}</div>
      <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{c.description}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-muted p-2"><dt className="flex items-center gap-1 text-[11px] text-muted-foreground"><Eye className="h-3 w-3" />{t('ad.impressions')}</dt><dd className="font-bold num">{num(c.impressions)}</dd></div>
        <div className="rounded-lg bg-muted p-2"><dt className="flex items-center gap-1 text-[11px] text-muted-foreground"><MousePointerClick className="h-3 w-3" />{t('ad.clicks')}</dt><dd className="font-bold num">{num(c.clicks)}</dd></div>
        <div className="rounded-lg bg-muted p-2"><dt className="text-[11px] text-muted-foreground">{t('ad.ctr')}</dt><dd className="font-bold num">{num(ctr, 1)}%</dd></div>
        <div className="rounded-lg border border-dashed p-2"><dt className="text-[11px] text-muted-foreground">{t('ad.indicative')}</dt><dd className="font-bold num">{aed(c.budgetAed)}</dd></div>
      </dl>
      {moderate && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.filter((a) => a.s !== c.status).map((a) => (
            <button key={a.s} disabled={m.isPending} onClick={() => act(a.s)} data-testid={`button-${a.s}-${c.id}`}
              className={`h-9 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${a.s === 'published' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}>{a.l}</button>
          ))}
        </div>
      )}
    </article>
  );
}

function CampaignList({ moderate }: { moderate?: boolean }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const q = useGetCampaigns({ query: { queryKey: getGetCampaignsQueryKey(), enabled: user?.role === 'employer' || user?.role === 'city', refetchInterval: 30_000 } });
  return (
    <section>
      <SectionTitle>{moderate ? t('ad.queue') : t('ad.myCampaigns')}</SectionTitle>
      <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />{moderate ? t('ad.cityNote') : t('ad.aggregate')}</p>
      {q.isLoading ? <div className="space-y-3"><Sk className="h-40" /><Sk className="h-40" /></div>
        : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
        : !q.data?.length ? <EmptyState icon={<Megaphone className="h-6 w-6" />} text={moderate ? t('ad.noQueue') : t('ad.noCampaigns')} />
        : <div className="grid gap-3 xl:grid-cols-2">{[...q.data].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0)).map((c) => <CampaignCard key={c.id} c={c} moderate={moderate} />)}</div>}
    </section>
  );
}

export default function AdvertisePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const role = user?.role;
  return (
    <div>
      <PageHeader title={t('ad.title')} sub={t('ad.sub')} />
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#B8964B]/40 bg-[#B8964B]/10 p-3.5 text-sm" data-testid="text-ad-disclaimer">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6f33] dark:text-[#d9bd7c]" />{t('ad.disclaimer')}
      </div>
      <Tabs defaultValue={role === 'city' ? 'moderation' : role === 'employer' ? 'campaigns' : 'enquire'}>
        <TabsList className="mb-5 h-auto flex-wrap">
          <TabsTrigger value="enquire" data-testid="tab-enquire">{t('ad.tab.enquire')}</TabsTrigger>
          {role !== 'city' && <TabsTrigger value="campaigns" data-testid="tab-campaigns">{t('ad.tab.campaigns')}</TabsTrigger>}
          {role === 'city' && <TabsTrigger value="moderation" data-testid="tab-moderation">{t('ad.tab.moderation')}</TabsTrigger>}
        </TabsList>
        <TabsContent value="enquire">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"><EnquiryForm /><EnquiryList /></div>
        </TabsContent>
        {role !== 'city' && (
          <TabsContent value="campaigns">
            {role === 'employer'
              ? <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]"><CampaignForm /><CampaignList /></div>
              : <EmptyState icon={<Megaphone className="h-6 w-6" />} text={t('ad.employerOnly')} />}
          </TabsContent>
        )}
        {role === 'city' && <TabsContent value="moderation"><CampaignList moderate /></TabsContent>}
      </Tabs>
    </div>
  );
}

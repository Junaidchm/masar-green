import { Link } from 'wouter';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Route as RouteIcon, Map, Wallet, Trophy, TreePine, Flame, Medal, Leaf, ArrowRight, CreditCard, Bell, HeartHandshake, Sparkles } from 'lucide-react';
import { useGetDashboard, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { ActiveTripCard } from '@/components/active-trip';
import { EmptyState, ErrorState, SectionTitle, Sk } from '@/components/common';
import { TripRow } from './trips';
import { SponsoredSlot } from '@/components/sponsored';
import { SustainabilityQuote } from '@/components/sustainability-quote';

function greetingKey() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: 'numeric', hour12: false }).format(new Date()));
  return h < 12 ? 'home.greeting.morning' : h < 18 ? 'home.greeting.afternoon' : 'home.greeting.evening';
}

export default function HomePage() {
  const { t, num, aed } = useI18n();
  const { isGuest } = useAuth();
  const q = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });

  if (q.isLoading) return (
    <div className="grid gap-4 lg:grid-cols-3"><Sk className="h-64 lg:col-span-2" /><Sk className="h-64" /><Sk className="h-32" /><Sk className="h-32" /><Sk className="h-32" /><Sk className="h-72 lg:col-span-2" /><Sk className="h-72" /></div>
  );
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const max = Math.max(...d.weekly.map((w) => w.value), 0.01);

  const stats = [
    { icon: TreePine, label: t('home.trees'), value: num(d.trees, 1), unit: t('home.trees.unit'), tone: '#00732F' },
    { icon: Flame, label: t('home.streak'), value: num(d.streak), unit: t('home.days'), tone: '#C8102E' },
    { icon: Medal, label: t('home.rank'), value: `#${num(d.rank)}`, unit: '', tone: '#111111' },
    { icon: RouteIcon, label: t('home.trips'), value: num(d.tripCount), unit: '', tone: '#5B5F66' },
  ];
  const qa = [
    { href: '/plan', icon: RouteIcon, label: t('qa.plan'), tone: 'plan' },
    { href: '/map', icon: Map, label: t('qa.map'), tone: 'map' },
    { href: '/wallet', icon: Wallet, label: t('qa.wallet'), tone: 'wallet' },
    { href: '/challenges', icon: Trophy, label: t('qa.challenges'), tone: 'challenges' },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      {d.activeTrip && <ActiveTripCard trip={d.activeTrip} />}

      <section className="home-welcome rise">
        <div className="home-eyebrow mb-3">{t('ui.today')}</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1>{t(greetingKey())}, <span data-testid="text-username">{d.user.name}</span>.</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('ui.subtitle')}</p>
          </div>
          {isGuest && <span className="rounded-full border bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('guest.short')}</span>}
        </div>
      </section>

      <nav className="home-support" aria-label={t('ui.support')}>
        <Link href="/notifications" data-testid="link-home-notifications"><Bell className="h-4 w-4" />{t('nav.notifications')}</Link>
        <Link href="/feedback" data-testid="link-home-feedback"><HeartHandshake className="h-4 w-4" />{t('nav.feedback')}</Link>
        <Link href="/assistant" data-testid="link-home-assistant"><Sparkles className="h-4 w-4" />{t('as.title')}</Link>
      </nav>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hero impact */}
        <section className="home-impact rise relative overflow-hidden lg:col-span-2" data-testid="card-hero">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white/80">{t('home.month')}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#d6ed74]"><Leaf className="h-5 w-5" /></span>
            </div>
            <div className="mt-6 flex flex-wrap items-baseline gap-2">
              <span className="home-number num" data-testid="text-month-saved">{num(d.monthSaved, 2)}</span>
              <span className="text-lg font-semibold text-white/70">{t('kg')} CO₂</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-white/70">{t('home.heroLine')}</p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div><div className="text-white/50">{t('home.total')}</div><div className="num text-lg font-bold">{num(d.totalSaved, 1)} {t('kg')}</div></div>
              <div><div className="text-white/50">{t('home.nol')}</div><div className="num text-lg font-bold">{aed(d.user.cardBalance)}</div></div>
            </div>
          </div>
        </section>

        {/* Wallet */}
        <Link href="/wallet" className="home-wallet rise group relative flex flex-col justify-between overflow-hidden" data-testid="card-wallet">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">{t('home.wallet')}</span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 dark:bg-white/5"><CreditCard className="h-4 w-4" /></span>
          </div>
          <div className="my-6">
            <div className="home-number num !text-[40px] md:!text-[44px]" data-testid="text-wallet-aed">{aed(d.aed)}</div>
            <div className="num mt-1 text-sm opacity-70">{num(d.credits)} {t('credits')}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">{t('wallet.redeem')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" /></span>
        </Link>
      </div>

      <SustainabilityQuote />

      <div className="home-stats grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="card-soft rise p-4" style={{ animationDelay: `${i * 60}ms` }}>
            <s.icon className="stat-icon h-[18px] w-[18px]" />
            <div className="stat-label">{s.label}</div>
            <div className="num text-2xl font-extrabold">{s.value} <span className="text-sm font-medium text-muted-foreground">{s.unit}</span></div>
          </div>
        ))}
      </div>

      <section>
        <SectionTitle>{t('home.quick')}</SectionTitle>
        <div className="home-quick grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {qa.map((a) => (
            <Link key={a.href} href={a.href} className={`home-action home-action-${a.tone} flex items-center gap-2 p-3 text-start text-xs font-bold transition-transform hover:-translate-y-0.5 md:text-sm`} data-testid={`link-qa-${a.href.slice(1)}`}>
              <span className="action-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl"><a.icon className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0 flex-1">{a.label}</span><ArrowRight className="h-4 w-4 shrink-0 opacity-70 rtl:rotate-180" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <div className="home-content-grid grid gap-4 lg:grid-cols-5">
        <section className="card-soft p-5 lg:col-span-2">
          <SectionTitle kicker={`${t('kg')} CO₂`}>{t('home.weekly')}</SectionTitle>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.weekly} margin={{ left: -20, right: 4, top: 8 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v: number) => [`${num(v, 2)} ${t('kg')}`, 'CO₂']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {d.weekly.map((w, i) => <Cell key={i} fill={w.value === max ? '#00732F' : 'hsl(145 30% 70%)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <div className="lg:col-span-3"><SponsoredSlot placement="dashboard" /></div>
        <section className="card-soft p-5 lg:col-span-3">
          <SectionTitle action={<Link href="/trips" className="text-sm font-semibold text-primary" data-testid="link-all-trips">{t('home.viewAll')}</Link>}>{t('home.recent')}</SectionTitle>
          {d.recentTrips.length === 0 ? (
            <EmptyState icon={<Leaf className="h-6 w-6" />} text={t('home.noTrips')} action={<Link href="/plan" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t('qa.plan')}</Link>} />
          ) : (
            <div className="divide-y">{d.recentTrips.slice(0, 5).map((tr) => <TripRow key={tr.id} trip={tr} />)}</div>
          )}
        </section>
      </div>

      <section className="home-ai">
        <span className="home-ai-icon"><Sparkles className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">{t('as.title')}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('ui.aiBody')}</p>
        </div>
        <Link href="/assistant" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground" data-testid="link-home-ask">{t('ui.aiAction')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
      </section>
    </div>
  );
}

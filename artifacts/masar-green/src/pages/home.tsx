import { Link } from 'wouter';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Route as RouteIcon, Map, Wallet, Trophy, TreePine, Flame, Medal, Leaf, ArrowRight, CreditCard } from 'lucide-react';
import { useGetDashboard, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { ActiveTripCard } from '@/components/active-trip';
import { EmptyState, ErrorState, SectionTitle, Sk } from '@/components/common';
import { TripRow } from './trips';

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
    { href: '/plan', icon: RouteIcon, label: t('qa.plan'), c: 'bg-primary text-primary-foreground' },
    { href: '/map', icon: Map, label: t('qa.map'), c: 'bg-foreground text-background' },
    { href: '/wallet', icon: Wallet, label: t('qa.wallet'), c: 'bg-[#B8964B] text-[#111111]' },
    { href: '/challenges', icon: Trophy, label: t('qa.challenges'), c: 'bg-[#00732F] text-white' },
  ];

  return (
    <div className="space-y-6">
      {d.activeTrip && <ActiveTripCard trip={d.activeTrip} />}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hero impact */}
        <section className="grain rise relative overflow-hidden rounded-2xl bg-[#111111] p-6 text-[#F5F6F7] md:p-8 lg:col-span-2" data-testid="card-hero">
          <div className="absolute inset-y-0 start-0 w-1.5 bg-[#C8102E]" />
          <svg className="pointer-events-none absolute -bottom-6 end-0 h-56 w-[70%] opacity-90 rtl:-scale-x-100" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden>
            <path d="M0 190 C 120 190, 140 110, 220 110 S 330 30, 400 20" stroke="#00732F" strokeWidth="18" fill="none" strokeLinecap="round" />
            <path d="M0 190 C 120 190, 140 110, 220 110 S 330 30, 400 20" stroke="#F5F6F7" strokeOpacity=".35" strokeWidth="1.5" fill="none" strokeDasharray="3 10" />
            <circle cx="220" cy="110" r="9" fill="#F5F6F7" /><circle cx="400" cy="20" r="11" fill="#B8964B" />
          </svg>
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              <span>{t(greetingKey())}, <b className="text-white" data-testid="text-username">{d.user.name}</b></span>
              {isGuest && <span className="rounded-full border border-[#B8964B]/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d9bd7f]">{t('guest.short')}</span>}
            </div>
            <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{t('home.month')}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-6xl font-extrabold tracking-tight md:text-7xl" data-testid="text-month-saved">{num(d.monthSaved, 1)}</span>
              <span className="text-xl font-semibold text-white/70">{t('kg')} CO₂</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-white/70">{t('home.heroLine')}</p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div><div className="text-white/50">{t('home.total')}</div><div className="num text-lg font-bold">{num(d.totalSaved, 1)} {t('kg')}</div></div>
              <div><div className="text-white/50">{t('home.nol')}</div><div className="num text-lg font-bold">{aed(d.user.cardBalance)}</div></div>
            </div>
          </div>
        </section>

        {/* Wallet */}
        <Link href="/wallet" className="rise group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#B8964B]/50 bg-gradient-to-br from-[#f7f0df] to-[#efe3c3] p-6 text-[#111111] dark:from-[#2a2416] dark:to-[#1d190f] dark:text-[#F5F6F7]" data-testid="card-wallet">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6d2f] dark:text-[#d9bd7f]">{t('home.wallet')}</span>
            <CreditCard className="h-5 w-5 text-[#8a6d2f] dark:text-[#d9bd7f]" />
          </div>
          <div className="my-6">
            <div className="num text-4xl font-extrabold" data-testid="text-wallet-aed">{aed(d.aed)}</div>
            <div className="num mt-1 text-sm opacity-70">{num(d.credits)} {t('credits')}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">{t('wallet.redeem')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" /></span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="card-soft rise p-4" style={{ animationDelay: `${i * 60}ms` }}>
            <s.icon className="h-5 w-5" style={{ color: s.tone }} />
            <div className="mt-3 text-xs text-muted-foreground">{s.label}</div>
            <div className="num text-2xl font-extrabold">{s.value} <span className="text-sm font-medium text-muted-foreground">{s.unit}</span></div>
          </div>
        ))}
      </div>

      <section>
        <SectionTitle>{t('home.quick')}</SectionTitle>
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {qa.map((a) => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 rounded-xl p-2 text-center text-xs font-semibold transition-transform hover:-translate-y-0.5 md:flex-row md:bg-card md:p-3 md:text-start md:text-sm md:shadow-sm" data-testid={`link-qa-${a.href.slice(1)}`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${a.c}`}><a.icon className="h-5 w-5" /></span>{a.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
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
        <section className="card-soft p-5 lg:col-span-3">
          <SectionTitle action={<Link href="/trips" className="text-sm font-semibold text-primary" data-testid="link-all-trips">{t('home.viewAll')}</Link>}>{t('home.recent')}</SectionTitle>
          {d.recentTrips.length === 0 ? (
            <EmptyState icon={<Leaf className="h-6 w-6" />} text={t('home.noTrips')} action={<Link href="/plan" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t('qa.plan')}</Link>} />
          ) : (
            <div className="divide-y">{d.recentTrips.slice(0, 5).map((tr) => <TripRow key={tr.id} trip={tr} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}

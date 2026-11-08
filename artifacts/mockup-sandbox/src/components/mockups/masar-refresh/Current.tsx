import { useState } from 'react';
import { Route as RouteIcon, Map, Wallet, Trophy, TreePine, Flame, Medal, ArrowRight, CreditCard } from 'lucide-react';
import './_group.css';

// Source: Masar Green HomePage's impact, wallet, stats and quick-action sections.
// Original JSX/classes retained; API/context/router dependencies stubbed for isolation.
const d = { user: { name: 'Amina Hassan', cardBalance: 42.5 }, monthSaved:43.85, totalSaved:346.57, trees:2.01, streak:7, rank:2, tripCount:101, aed:31.05, credits:3105 };
const labels: Record<string,string> = {
  'guest.short':'Demo data','home.month':"This month's CO₂ saved",'home.heroLine':'Every metro ride, every walk to the station, counted.',
  'home.total':'Lifetime saved','home.nol':'NOL card balance (mock)','home.wallet':'Green Wallet','home.trees':'Tree-equivalent',
  'home.trees.unit':'trees','home.streak':'Current streak','home.days':'days','home.rank':'Community rank','home.trips':'Trips logged',
  'home.quick':'Quick actions','qa.plan':'Plan a trip','qa.map':'Live map','qa.wallet':'My wallet','qa.challenges':'Challenges',
  'wallet.redeem':'Redeem',kg:'kg',credits:'credits',
};
const t=(k:string)=>labels[k]??k;
const num=(n:number,p=0)=>new Intl.NumberFormat('en',{minimumFractionDigits:p,maximumFractionDigits:p}).format(n);
const aed=(n:number)=>`AED ${num(n,2)}`;

export function Current() {
  const [destination,setDestination]=useState('');
  const isGuest=true;
  const stats=[
    {icon:TreePine,label:t('home.trees'),value:num(d.trees,1),unit:t('home.trees.unit'),tone:'#00732F'},
    {icon:Flame,label:t('home.streak'),value:num(d.streak),unit:t('home.days'),tone:'#C8102E'},
    {icon:Medal,label:t('home.rank'),value:`#${num(d.rank)}`,unit:'',tone:'#111111'},
    {icon:RouteIcon,label:t('home.trips'),value:num(d.tripCount),unit:'',tone:'#5B5F66'},
  ];
  const qa=[
    {href:'/plan',icon:RouteIcon,label:t('qa.plan'),c:'bg-primary text-primary-foreground'},
    {href:'/map',icon:Map,label:t('qa.map'),c:'bg-foreground text-background'},
    {href:'/wallet',icon:Wallet,label:t('qa.wallet'),c:'bg-[#B8964B] text-[#111111]'},
    {href:'/challenges',icon:Trophy,label:t('qa.challenges'),c:'bg-[#00732F] text-white'},
  ];
  return <div className="masar-current min-h-screen bg-background p-4 text-foreground md:p-8">
    <p className="mb-6 text-xs text-muted-foreground">CURRENT APP · EXTRACTED DASHBOARD OVERVIEW · DEMO DATA</p>
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="grain rise relative overflow-hidden rounded-2xl bg-[#111111] p-6 text-[#F5F6F7] md:p-8 lg:col-span-2" data-testid="card-hero">
          <div className="absolute inset-y-0 start-0 w-1.5 bg-[#C8102E]" />
          <svg className="pointer-events-none absolute -bottom-6 end-0 h-56 w-[70%] opacity-90 rtl:-scale-x-100" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden>
            <path d="M0 190 C 120 190, 140 110, 220 110 S 330 30, 400 20" stroke="#00732F" strokeWidth="18" fill="none" strokeLinecap="round" />
            <path d="M0 190 C 120 190, 140 110, 220 110 S 330 30, 400 20" stroke="#F5F6F7" strokeOpacity=".35" strokeWidth="1.5" fill="none" strokeDasharray="3 10" />
            <circle cx="220" cy="110" r="9" fill="#F5F6F7" /><circle cx="400" cy="20" r="11" fill="#B8964B" />
          </svg>
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              <span>Good afternoon, <b className="text-white" data-testid="text-username">{d.user.name}</b></span>
              {isGuest && <span className="rounded-full border border-[#B8964B]/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d9bd7f]">{t('guest.short')}</span>}
            </div>
            <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{t('home.month')}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-6xl font-extrabold tracking-tight md:text-7xl" data-testid="text-month-saved">{num(d.monthSaved,1)}</span>
              <span className="text-xl font-semibold text-white/70">{t('kg')} CO₂</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-white/70">{t('home.heroLine')}</p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div><div className="text-white/50">{t('home.total')}</div><div className="num text-lg font-bold">{num(d.totalSaved,1)} {t('kg')}</div></div>
              <div><div className="text-white/50">{t('home.nol')}</div><div className="num text-lg font-bold">{aed(d.user.cardBalance)}</div></div>
            </div>
          </div>
        </section>
        <button onClick={()=>setDestination('/wallet')} className="rise group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#B8964B]/50 bg-gradient-to-br from-[#f7f0df] to-[#efe3c3] p-6 text-start text-[#111111] dark:from-[#2a2416] dark:to-[#1d190f] dark:text-[#F5F6F7]" data-testid="card-wallet">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6d2f] dark:text-[#d9bd7f]">{t('home.wallet')}</span>
            <CreditCard className="h-5 w-5 text-[#8a6d2f] dark:text-[#d9bd7f]" />
          </div>
          <div className="my-6">
            <div className="num text-4xl font-extrabold" data-testid="text-wallet-aed">{aed(d.aed)}</div>
            <div className="num mt-1 text-sm opacity-70">{num(d.credits)} {t('credits')}</div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">{t('wallet.redeem')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" /></span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s,i)=><div key={i} className="card-soft rise p-4" style={{animationDelay:`${i*60}ms`}}>
          <s.icon className="h-5 w-5" style={{color:s.tone}}/>
          <div className="mt-3 text-xs text-muted-foreground">{s.label}</div>
          <div className="num text-2xl font-extrabold">{s.value} <span className="text-sm font-medium text-muted-foreground">{s.unit}</span></div>
        </div>)}
      </div>
      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold tracking-tight">{t('home.quick')}</h2></div></div>
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {qa.map(a=><button key={a.href} onClick={()=>setDestination(a.href)} className="flex flex-col items-center gap-2 rounded-xl p-2 text-center text-xs font-semibold transition-transform hover:-translate-y-0.5 md:flex-row md:bg-card md:p-3 md:text-start md:text-sm md:shadow-sm">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${a.c}`}><a.icon className="h-5 w-5"/></span>{a.label}
          </button>)}
        </div>
      </section>
      {destination&&<div role="status" className="rounded-lg border p-3 text-sm">Navigation preview: {destination}. Open the working app for this feature.<button onClick={()=>setDestination('')} className="ms-3 underline">Dismiss</button></div>}
    </div>
  </div>;
}

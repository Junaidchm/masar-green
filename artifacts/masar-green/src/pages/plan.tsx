import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, Crosshair, Search, Accessibility, Loader2, Play, MapPin, Clock, Leaf, Users, Footprints, Repeat, Route as RouteIcon } from 'lucide-react';
import {
  useGetLocations, getGetLocationsQueryKey, usePlanTrip, useStartTrip, useGetDashboard, getGetDashboardQueryKey, getGetTripsQueryKey,
  type Place, type RouteOption, type PlanInputSort,
} from '@workspace/api-client-react';
import { MODE_COLOR, modeKey, useI18n } from '@/lib/i18n';
import { friendlyError, useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { LeafletMap, toLatLng, type LatLng, type MapLine, type MapPoint } from '@/components/leaflet-map';
import { ActiveTripCard } from '@/components/active-trip';
import { EmptyState, ModeChip, ModeIcon, PageHeader, Sk } from '@/components/common';

const SORTS: PlanInputSort[] = ['Greenest', 'Cheapest', 'Fastest', 'Least Crowded'];

function PlacePicker({ label, value, onChange, places, testid }: { label: string; value: Place | null; onChange: (p: Place) => void; places: Place[]; testid: string }) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const name = (p: Place) => (lang === 'ar' ? p.nameAr || p.name : p.name);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return places.filter((p) => !s || p.name.toLowerCase().includes(s) || p.nameAr.includes(q.trim())).slice(0, 8);
  }, [q, places]);
  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={open ? q : value ? name(value) : q} placeholder={t('plan.search')}
          onFocus={() => { setOpen(true); setQ(''); }} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={(e) => setQ(e.target.value)}
          className="h-12 w-full rounded-lg border border-input bg-card ps-10 pe-3 font-medium" data-testid={testid} />
      </div>
      {open && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-xl">
          {list.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">—</li>}
          {list.map((p) => (
            <li key={p.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(p); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm hover:bg-muted" data-testid={`option-place-${p.id}`}>
                <span className="grid h-7 w-7 place-items-center rounded-md" style={{ background: `${MODE_COLOR[modeKey(p.type)]}18`, color: MODE_COLOR[modeKey(p.type)] }}><ModeIcon mode={p.type} className="h-3.5 w-3.5" /></span>
                <span className="flex-1"><span className="block font-medium">{name(p)}</span><span className="block text-xs text-muted-foreground">{p.line}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PlanPage() {
  const { t, num, aed } = useI18n();
  const { user, requireAuth } = useAuth();
  const qc = useQueryClient();
  const locs = useGetLocations({ query: { queryKey: getGetLocationsQueryKey() } });
  const dash = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const plan = usePlanTrip();
  const start = useStartTrip();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [accessible, setAccessible] = useState(false);
  const [sort, setSort] = useState<PlanInputSort>('Greenest');
  const [selected, setSelected] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const places = locs.data ?? [];
  const planRef = useRef(plan.mutate); planRef.current = plan.mutate;

  const search = (s = sort, acc = accessible) => {
    if (!from || !to) { toast({ title: t('plan.pick') }); return; }
    if (from.id === to.id) { toast({ title: t('plan.same'), variant: 'destructive' }); return; }
    planRef.current({ data: { fromId: from.id, toId: to.id, accessible: acc, sort: s } }, {
      onSuccess: (r) => setSelected(r[0]?.id ?? null),
      onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
    });
  };

  const useMyLocation = () => {
    if (!user) { requireAuth(() => undefined); return; }
    if (!user.locationConsent) { toast({ title: t('plan.locNeedConsent') }); return; }
    if (!('geolocation' in navigator)) { toast({ title: t('plan.locUnsupported'), variant: 'destructive' }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocating(false);
      const { latitude, longitude } = pos.coords;
      let best: Place | null = null; let bd = Infinity;
      places.forEach((p) => { const d = (p.lat - latitude) ** 2 + ((p.lng - longitude) * Math.cos(latitude * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = p; } });
      if (best) { setFrom(best); toast({ title: t('plan.locFound'), description: (best as Place).name }); }
    }, () => { setLocating(false); toast({ title: t('plan.locDenied'), variant: 'destructive' }); }, { timeout: 10000 });
  };

  const routes = plan.data ?? [];
  const sel = routes.find((r) => r.id === selected) ?? routes[0];

  const { lines, points, fit } = useMemo(() => {
    const lines: MapLine[] = []; const points: MapPoint[] = []; const fit: LatLng[] = [];
    if (sel) sel.legs.forEach((l, i) => {
      const k = modeKey(l.mode);
      const coords = l.coordinates.map(toLatLng);
      lines.push({ id: `${i}`, coords, color: MODE_COLOR[k], dashed: k === 'walk', weight: k === 'walk' ? 4 : 6 });
      fit.push(...coords);
      if (coords[0]) points.push({ id: `s${i}`, lat: coords[0][0], lng: coords[0][1], color: MODE_COLOR[k], radius: 5, label: l.from });
    });
    [from, to].forEach((p, i) => { if (p) { points.push({ id: `e${i}`, lat: p.lat, lng: p.lng, color: i ? '#C8102E' : '#111111', radius: 9, label: p.name }); if (!sel) fit.push([p.lat, p.lng]); } });
    return { lines, points, fit };
  }, [sel, from, to]);

  const startTrip = (r: RouteOption) => requireAuth(() => start.mutate({ data: { fromId: r.fromId, toId: r.toId, routeId: r.id } }, {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetTripsQueryKey() });
      toast({ title: t('plan.started'), description: t('plan.startedDesc') });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (e) => toast({ title: friendlyError(e, t), variant: 'destructive' }),
  }));

  const active = user ? dash.data?.activeTrip : null;

  return (
    <div>
      <PageHeader title={t('plan.title')} sub={t('plan.sub')} />
      {active && <div className="mb-5"><ActiveTripCard trip={active} /></div>}
      <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); search(); }} className="card-soft space-y-3 p-4">
            {locs.isLoading ? <><Sk className="h-14" /><Sk className="h-14" /></> : (
              <>
                <PlacePicker label={t('plan.from')} value={from} onChange={setFrom} places={places} testid="input-from" />
                <div className="flex items-center justify-between">
                  <button type="button" onClick={useMyLocation} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary" data-testid="button-use-location">
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}{t('plan.useLoc')}
                  </button>
                  <button type="button" onClick={() => { setFrom(to); setTo(from); }} className="grid h-9 w-9 place-items-center rounded-full border hover:bg-muted" aria-label={t('plan.swap')} data-testid="button-swap"><ArrowUpDown className="h-4 w-4" /></button>
                </div>
                <PlacePicker label={t('plan.to')} value={to} onChange={setTo} places={places} testid="input-to" />
              </>
            )}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5 text-sm font-medium">
              <input type="checkbox" checked={accessible} onChange={(e) => { setAccessible(e.target.checked); if (routes.length) search(sort, e.target.checked); }} className="h-4 w-4 accent-[#00732F]" data-testid="checkbox-accessible" />
              <Accessibility className="h-4 w-4" />{t('plan.accessible')}
            </label>
            <button type="submit" disabled={plan.isPending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-plan">
              {plan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RouteIcon className="h-4 w-4" />}{t('plan.go')}
            </button>
          </form>

          {routes.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold"><span className="num">{num(routes.length)}</span> {t('plan.options')}</span><span className="text-muted-foreground">{t('plan.sort')}</span></div>
              <div className="mb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
                {SORTS.map((s) => (
                  <button key={s} onClick={() => { setSort(s); search(s); }} className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold ${sort === s ? 'bg-foreground text-background' : 'border bg-card'}`} data-testid={`sort-${s}`}>{t(`tag.${s}`)}</button>
                ))}
              </div>
              <div className="space-y-2.5">
                {routes.map((r) => {
                  const on = sel?.id === r.id;
                  return (
                    <div key={r.id} onClick={() => setSelected(r.id)} className={`cursor-pointer rounded-xl border bg-card p-3.5 transition-all ${on ? 'border-foreground shadow-md' : 'hover:border-foreground/30'}`} data-testid={`card-route-${r.id}`}>
                      <div className="flex flex-wrap gap-1">
                        {r.tags.map((tg) => <span key={tg} className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tg === 'Greenest' ? 'bg-[#00732F] text-white' : tg === 'Cheapest' ? 'bg-[#B8964B] text-[#111]' : tg === 'Fastest' ? 'bg-primary text-white' : 'bg-foreground text-background'}`}>{t(`tag.${tg}`)}</span>)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {r.legs.map((l, i) => <span key={i} className="flex items-center gap-1">{i > 0 && <span className="text-muted-foreground">›</span>}<ModeChip mode={l.mode} line={modeKey(l.mode) === 'walk' ? `${num(l.minutes)}′` : l.line} /></span>)}
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                        <div><div className="text-[10px] text-muted-foreground">{t('plan.price')}</div><div className="num text-sm font-bold">{aed(r.price)}</div></div>
                        <div><div className="text-[10px] text-muted-foreground">{t('plan.time')}</div><div className="num text-sm font-bold">{num(r.minutes)} {t('min')}</div></div>
                        <div><div className="text-[10px] text-muted-foreground">{t('plan.co2')}</div><div className="num text-sm font-bold">{num(r.co2, 2)} {t('kg')}</div></div>
                        <div><div className="text-[10px] text-muted-foreground">{t('plan.crowd')}</div><div className={`text-sm font-bold ${r.crowd === 'High' ? 'text-primary' : r.crowd === 'Low' ? 'text-[#00732F] dark:text-emerald-400' : ''}`}>{t(`crowd.${r.crowd}`)}</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {plan.isPending && !routes.length && <div className="space-y-2.5">{[...Array(4)].map((_, i) => <Sk key={i} className="h-36" />)}</div>}
          {!plan.isPending && !routes.length && <EmptyState icon={<MapPin className="h-6 w-6" />} text={t('plan.empty')} />}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft h-[340px] overflow-hidden md:h-[460px]"><LeafletMap lines={lines} points={points} fit={fit} fitKey={`${sel?.id}-${from?.id}-${to?.id}`} /></div>
          {sel && (
            <div className="card-soft p-5" data-testid="panel-route-detail">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{sel.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span className="num">{num(sel.minutes)} {t('min')}</span></span>
                    <span className="inline-flex items-center gap-1"><Footprints className="h-3.5 w-3.5" /><span className="num">{num(sel.walkingMinutes)} {t('min')} {t('plan.walk')}</span></span>
                    <span className="inline-flex items-center gap-1"><Repeat className="h-3.5 w-3.5" /><span className="num">{num(sel.transfers)} {t('plan.transfers')}</span></span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t(`crowd.${sel.crowd}`)}</span>
                    {sel.accessible && <span className="inline-flex items-center gap-1"><Accessibility className="h-3.5 w-3.5" /></span>}
                  </div>
                </div>
                <div className="rounded-lg bg-accent px-3 py-2 text-end text-accent-foreground">
                  <div className="text-[10px] font-bold uppercase tracking-wider">{t('plan.earn')}</div>
                  <div className="num font-extrabold"><Leaf className="me-1 inline h-3.5 w-3.5" />{num(sel.saved, 2)} {t('kg')} · {num(sel.credits)} {t('credits')}</div>
                </div>
              </div>
              <ol className="relative mt-5 space-y-4 border-s-2 border-dashed ps-5">
                {sel.legs.map((l, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -start-[29px] top-0.5 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: MODE_COLOR[modeKey(l.mode)] }}><ModeIcon mode={l.mode} className="h-3 w-3" /></span>
                    <div className="text-sm font-semibold">{t(l.instruction) || `${l.from} → ${l.to}`}</div>
                    <div className="num text-xs text-muted-foreground">{l.line && l.line !== '-' ? `${l.line} · ` : ''}{num(l.minutes)} {t('min')} · {num(l.distance, 1)} {t('km')}</div>
                  </li>
                ))}
              </ol>
              <button disabled={start.isPending || !!active} onClick={() => startTrip(sel)} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#00732F] font-semibold text-white disabled:opacity-50" data-testid="button-start-trip">
                {start.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 rtl:rotate-180" />}{user ? t('plan.start') : `${t('signIn')} · ${t('plan.start')}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

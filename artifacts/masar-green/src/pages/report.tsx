import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Download, Lock, Leaf, Users, Car, TrendingUp, Route as RouteIcon } from 'lucide-react';
import { useGetReport, getGetReportQueryKey, type GetReportKind } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { downloadFile, toCsv } from '@/lib/pwa';
import { LeafletMap, type MapPoint } from '@/components/leaflet-map';
import { ErrorState, PageHeader, SectionTitle, Sk } from '@/components/common';

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function ReportPage({ kind }: { kind: GetReportKind }) {
  const { t, num } = useI18n();
  const { user, openLogin, loading } = useAuth();
  const allowed = user?.role === kind;
  const [range, setRange] = useState(() => ({ from: iso(new Date(Date.now() - 30 * 864e5)), to: iso(new Date()) }));
  const [draft, setDraft] = useState(range);
  const params = kind === 'city' ? { kind, from: range.from, to: range.to } : { kind };
  const q = useGetReport(params, { query: { enabled: allowed, queryKey: getGetReportQueryKey(params) } });

  const heat = useMemo<MapPoint[]>(() => {
    const max = Math.max(1, ...(q.data?.heatmap ?? []).map((h) => h.count));
    return (q.data?.heatmap ?? []).map((h, i) => ({ id: `h${i}`, lat: h.lat, lng: h.lng, color: '#C8102E', stroke: '#C8102E', radius: 6 + (h.count / max) * 22, fillOpacity: 0.2 + (h.count / max) * 0.45, label: `${h.name}: ${h.count}` }));
  }, [q.data]);

  const title = kind === 'employer' ? t('emp.title') : t('city.title');
  const sub = kind === 'employer' ? t('emp.sub') : t('city.sub');

  if (!loading && !allowed) return (
    <div className="mx-auto max-w-md py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted"><Lock className="h-6 w-6" /></div>
      <h1 className="mt-4 text-xl font-extrabold">{t('rep.forbidden')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('rep.forbiddenBody')}</p>
      <button onClick={openLogin} className="mt-5 h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground" data-testid="button-report-signin">{t('signIn')}</button>
    </div>
  );

  const exportCsv = () => {
    const r = q.data; if (!r) return;
    const rows: (string | number)[][] = [
      ['metric', 'value'], ['report', r.title], ['from', r.from], ['to', r.to], ['total_co2_saved_kg', r.totalSaved], ['trips', r.trips],
      ['participants', r.participants], ['participation_pct', r.participation], ['cars_removed_est', r.carsRemoved], ['ridership_change_pct', r.ridershipChange],
      [], ['group', 'co2_saved_kg'], ...r.groups.map((g) => [g.name, g.value]),
      [], ['line', 'peak_crowding'], ...r.crowding.map((g) => [g.name, g.value]),
      ...(kind === 'city' ? [[], ['area', 'lat', 'lng', 'trip_count'], ...r.heatmap.map((h) => [h.name, h.lat, h.lng, h.count])] : []),
    ];
    downloadFile(`masar-green-${kind}-report-${r.from}-${r.to}.csv`, toCsv(rows), 'text/csv');
  };

  const r = q.data;
  const kpis = r ? [
    { icon: Leaf, label: t('rep.saved'), v: `${num(r.totalSaved, 1)} ${t('kg')}` },
    { icon: Users, label: t('rep.participation'), v: `${num(r.participation, 1)}%`, sub: `${num(r.participants)} ${t('rep.participants')}` },
    { icon: RouteIcon, label: t('rep.trips'), v: num(r.trips) },
    kind === 'city' ? { icon: Car, label: t('rep.cars'), v: num(r.carsRemoved) } : { icon: TrendingUp, label: t('rep.ridership'), v: `${r.ridershipChange >= 0 ? '+' : ''}${num(r.ridershipChange, 1)}%` },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader title={r?.title || title} sub={sub} right={<button disabled={!r} onClick={exportCsv} className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40" data-testid="button-export-csv"><Download className="h-4 w-4" />{t('rep.csv')}</button>} />
      {kind === 'city' && (
        <form onSubmit={(e) => { e.preventDefault(); setRange(draft); }} className="card-soft flex flex-wrap items-end gap-3 p-4">
          <label className="text-sm font-semibold">{t('rep.from')}<input type="date" value={draft.from} max={draft.to} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="mt-1 block h-10 rounded-lg border border-input bg-card px-3" data-testid="input-date-from" /></label>
          <label className="text-sm font-semibold">{t('rep.to')}<input type="date" value={draft.to} min={draft.from} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="mt-1 block h-10 rounded-lg border border-input bg-card px-3" data-testid="input-date-to" /></label>
          <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="button-apply-range">{t('rep.apply')}</button>
        </form>
      )}
      {q.isLoading || loading ? <div className="grid gap-3 md:grid-cols-4">{[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}<Sk className="h-72 md:col-span-4" /></div>
        : q.isError || !r ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
        : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {kpis.map((k, i) => (
                <div key={i} className="card-soft p-4"><k.icon className="h-5 w-5 text-[#00732F]" /><div className="mt-2 text-xs text-muted-foreground">{k.label}</div><div className="num text-2xl font-extrabold">{k.v}</div>{k.sub && <div className="text-xs text-muted-foreground">{k.sub}</div>}</div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="card-soft p-5">
                <SectionTitle kicker={`${t('kg')} CO₂`}>{kind === 'employer' ? t('rep.groups') : t('rep.cityGroups')}</SectionTitle>
                <div className="h-64" dir="ltr"><ResponsiveContainer><BarChart data={r.groups} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v: number) => [`${num(v, 1)} ${t('kg')}`, 'CO₂']} />
                  <Bar dataKey="value" fill="#00732F" radius={[0, 6, 6, 0]} />
                </BarChart></ResponsiveContainer></div>
              </section>
              <section className="card-soft p-5">
                <SectionTitle kicker="%">{t('rep.crowding')}</SectionTitle>
                <div className="h-64" dir="ltr"><ResponsiveContainer><BarChart data={r.crowding}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" /><YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{r.crowding.map((c, i) => <Cell key={i} fill={c.value > 75 ? '#C8102E' : c.value > 50 ? '#B8964B' : '#00732F'} />)}</Bar>
                </BarChart></ResponsiveContainer></div>
              </section>
            </div>
            {kind === 'city' && (
              <section className="card-soft overflow-hidden">
                <div className="p-5 pb-3"><SectionTitle>{t('rep.heatmap')}</SectionTitle></div>
                <div className="h-[420px]"><LeafletMap points={heat} fit={heat.map((h) => [h.lat, h.lng] as [number, number])} fitKey={`${range.from}${range.to}${heat.length}`} /></div>
              </section>
            )}
            <p className="text-xs text-muted-foreground">{t('rep.period')}: {r.from} — {r.to}</p>
          </>
        )}
    </div>
  );
}

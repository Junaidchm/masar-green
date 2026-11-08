import { useMemo, useState } from 'react';
import { Radio, X } from 'lucide-react';
import { useGetLiveMap, getGetLiveMapQueryKey } from '@workspace/api-client-react';
import { MODE_COLOR, modeKey, useI18n } from '@/lib/i18n';
import { LeafletMap, toLatLng, type MapLine, type MapPoint } from '@/components/leaflet-map';
import { ErrorState, ModeChip, ModeIcon, PageHeader, Sk } from '@/components/common';

const LAYERS = ['metro', 'bus', 'tram', 'water', 'bike'] as const;
type Layer = typeof LAYERS[number];
const layerOf = (m: string): Layer | null => { const k = modeKey(m); return k === 'taxi' || k === 'walk' || k === 'car' || k === 'mixed' ? null : (k as Layer); };

export default function MapPage() {
  const { t, num, time } = useI18n();
  const q = useGetLiveMap({ query: { queryKey: getGetLiveMapQueryKey(), refetchInterval: 5000, refetchIntervalInBackground: false } });
  const [on, setOn] = useState<Record<Layer, boolean>>({ metro: true, bus: true, tram: true, water: true, bike: true });
  const [sel, setSel] = useState<{ type: 'v' | 's'; id: number } | null>(null);
  const d = q.data;
  const visible = (m: string) => { const l = layerOf(m); return l ? on[l] : true; };

  const { lines, points } = useMemo(() => {
    if (!d) return { lines: [] as MapLine[], points: [] as MapPoint[] };
    const lines: MapLine[] = d.lines.filter((l) => visible(l.mode)).map((l) => ({ id: `l${l.id}`, coords: l.coordinates.map(toLatLng), color: l.color || MODE_COLOR[modeKey(l.mode)], weight: 4, opacity: 0.7 }));
    const points: MapPoint[] = [
      ...d.stations.filter((s) => visible(s.type)).map((s) => ({ id: `s${s.id}`, lat: s.lat, lng: s.lng, color: '#F5F6F7', stroke: MODE_COLOR[modeKey(s.type)], radius: 5, label: s.name, selected: sel?.type === 's' && sel.id === s.id, onClick: () => setSel({ type: 's', id: s.id }) })),
      ...d.vehicles.filter((v) => visible(v.mode)).map((v) => ({ id: `v${v.id}`, lat: v.lat, lng: v.lng, color: MODE_COLOR[modeKey(v.mode)], radius: 7, label: `${v.line} → ${v.nextStop}`, selected: sel?.type === 'v' && sel.id === v.id, onClick: () => setSel({ type: 'v', id: v.id }) })),
    ];
    return { lines, points };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, on, sel]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    d?.vehicles.forEach((v) => { const l = layerOf(v.mode); if (l) c[l] = (c[l] ?? 0) + 1; });
    return c;
  }, [d]);

  const vehicle = sel?.type === 'v' ? d?.vehicles.find((v) => v.id === sel.id) : undefined;
  const station = sel?.type === 's' ? d?.stations.find((s) => s.id === sel.id) : undefined;
  const arrivals = station ? (d?.vehicles ?? []).filter((v) => v.nextStop === station.name || v.nextStop === station.nameAr).sort((a, b) => a.eta - b.eta) : [];
  const nearby = station && arrivals.length === 0 ? (d?.vehicles ?? []).filter((v) => modeKey(v.mode) === modeKey(station.type) && (station.line ? v.line === station.line : true)).sort((a, b) => a.eta - b.eta).slice(0, 4) : [];

  return (
    <div>
      <PageHeader title={t('map.title')} sub={d ? `${num(d.vehicles.length)} ${t('map.vehicles')} · ${t('map.updated')} ${time(d.updatedAt)}` : t('map.polling')}
        right={<span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"><Radio className="h-3.5 w-3.5 animate-pulse" />{t('map.polling')}</span>} />
      <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-none" role="group" aria-label={t('map.layers')}>
        {LAYERS.map((l) => (
          <button key={l} onClick={() => setOn({ ...on, [l]: !on[l] })} aria-pressed={on[l]} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors ${on[l] ? 'text-white' : 'bg-card text-muted-foreground'}`} style={on[l] ? { background: MODE_COLOR[l], borderColor: MODE_COLOR[l] } : undefined} data-testid={`toggle-layer-${l}`}>
            <ModeIcon mode={l} />{t(`map.${l}`)}<span className="num rounded-full bg-black/15 px-1.5 text-xs">{counts[l] ?? 0}</span>
          </button>
        ))}
      </div>
      {q.isError && !d ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="card-soft relative h-[58dvh] min-h-[380px] overflow-hidden lg:h-[640px]">
            {q.isLoading ? <Sk className="h-full rounded-none" /> : <LeafletMap lines={lines} points={points} fitKey="once" zoom={11} />}
          </div>
          <aside className="card-soft p-5" data-testid="panel-map-detail">
            {!vehicle && !station && <p className="text-sm text-muted-foreground">{t('map.select')}</p>}
            {vehicle && (
              <div>
                <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('map.vehicle')}</span><button onClick={() => setSel(null)} aria-label="close"><X className="h-4 w-4" /></button></div>
                <div className="mt-2"><ModeChip mode={vehicle.mode} line={vehicle.line} /></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">{t('map.nextStop')}</dt><dd className="font-semibold">{vehicle.nextStop}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">{t('map.eta')}</dt><dd className="num font-semibold">{num(vehicle.eta)} {t('min')}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">{t('plan.crowd')}</dt><dd className="font-semibold">{t(`crowd.${vehicle.crowd}`)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">{t('map.line')}</dt><dd className="font-semibold">{vehicle.line}</dd></div>
                </dl>
              </div>
            )}
            {station && (
              <div>
                <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('map.station')}</span><button onClick={() => setSel(null)} aria-label="close"><X className="h-4 w-4" /></button></div>
                <h3 className="mt-1 text-lg font-bold">{station.name}</h3>
                <div className="text-sm text-muted-foreground" dir="rtl">{station.nameAr}</div>
                <div className="mt-2"><ModeChip mode={station.type} line={station.line} /></div>
                <h4 className="mt-5 text-sm font-bold">{t('map.arrivals')}</h4>
                <ul className="mt-2 divide-y">
                  {[...arrivals, ...nearby].slice(0, 6).map((v) => (
                    <li key={v.id} className="flex items-center gap-2 py-2 text-sm">
                      <ModeChip mode={v.mode} line={v.line} /><span className="text-xs text-muted-foreground">{t(`crowd.${v.crowd}`)}</span>
                      <span className="num ms-auto font-bold">{num(v.eta)} {t('min')}</span>
                    </li>
                  ))}
                  {arrivals.length + nearby.length === 0 && <li className="py-2 text-sm text-muted-foreground">{t('map.noArrivals')}</li>}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

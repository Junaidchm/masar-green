import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type LatLng = [number, number];
export interface MapLine { id: string; coords: LatLng[]; color: string; dashed?: boolean; weight?: number; opacity?: number }
export interface MapPoint {
  id: string; lat: number; lng: number; color: string; radius?: number; label?: string;
  onClick?: () => void; selected?: boolean; fillOpacity?: number; stroke?: string;
}

/** Normalise [lat,lng] vs [lng,lat]: Dubai lat ~25, lng ~55. */
export function toLatLng(c: number[]): LatLng {
  const [a, b] = c;
  return a > 40 && b < 40 ? [b, a] : [a, b];
}

const DUBAI: LatLng = [25.2048, 55.2708];

export function LeafletMap({ lines = [], points = [], fitKey, fit, className = '', zoom = 11 }: {
  lines?: MapLine[]; points?: MapPoint[]; fitKey?: string; fit?: LatLng[]; className?: string; zoom?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const lastFit = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView(DUBAI, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
  }, [zoom]);

  useEffect(() => {
    const g = layer.current; const m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    lines.forEach((ln) => {
      if (ln.coords.length < 2) return;
      L.polyline(ln.coords, { color: '#ffffff', weight: (ln.weight ?? 5) + 3, opacity: 0.8 }).addTo(g);
      L.polyline(ln.coords, { color: ln.color, weight: ln.weight ?? 5, opacity: ln.opacity ?? 0.95, dashArray: ln.dashed ? '2 9' : undefined, lineCap: 'round' }).addTo(g);
    });
    points.forEach((p) => {
      const mk = L.circleMarker([p.lat, p.lng], {
        radius: (p.radius ?? 7) + (p.selected ? 3 : 0), color: p.stroke ?? '#ffffff', weight: p.selected ? 4 : 2,
        fillColor: p.color, fillOpacity: p.fillOpacity ?? 1,
      }).addTo(g);
      if (p.label) mk.bindTooltip(p.label, { direction: 'top', offset: [0, -6] });
      if (p.onClick) mk.on('click', p.onClick);
    });
    if (fitKey !== lastFit.current) {
      lastFit.current = fitKey;
      const pts = fit ?? [];
      if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [32, 32], maxZoom: 15 });
      else if (pts.length === 1) m.setView(pts[0], 14);
    }
  }, [lines, points, fitKey, fit]);

  return <div dir="ltr" ref={el} className={`isolate h-full w-full ${className}`} data-testid="map-leaflet" />;
}

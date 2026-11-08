import { useEffect, useRef } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import { useGetSponsoredPlacements, getGetSponsoredPlacementsQueryKey, useTrackPlacementEvent, type SponsoredPlacement } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { isHttps, seenOnce, sessionKey } from '@/lib/engagement';

function Card({ p }: { p: SponsoredPlacement }) {
  const { t, date } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const track = useTrackPlacementEvent();
  const trackRef = useRef(track.mutate);
  trackRef.current = track.mutate;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5)) {
        io.disconnect();
        if (!seenOnce(p.id)) trackRef.current({ id: p.id, data: { kind: 'impression', sessionKey: sessionKey() } });
      }
    }, { threshold: [0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [p.id]);

  const safe = isHttps(p.destinationUrl);
  const img = p.imageUrl && isHttps(p.imageUrl) ? p.imageUrl : null;
  return (
    <aside ref={ref} className="card-soft relative flex gap-4 overflow-hidden p-4" aria-label={`${t('sp.label')}: ${p.advertiser}`} data-testid={`card-sponsored-${p.id}`}>
      <span className="absolute inset-y-0 start-0 w-1 bg-[#B8964B]" aria-hidden />
      {img ? <img src={img} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg object-cover sm:h-24 sm:w-28" />
        : <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-[#B8964B]/15 text-[#8a6f33] dark:text-[#d9bd7c] sm:h-24 sm:w-28"><Megaphone className="h-7 w-7" /></span>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
          <span className="rounded bg-[#111111] px-1.5 py-0.5 text-[#F5F6F7] dark:bg-[#F5F6F7] dark:text-[#111111]">{t('sp.label')}</span>
          <span className="truncate text-muted-foreground">{p.advertiser}</span>
          {p.simulated && <span className="rounded border border-dashed px-1.5 py-0.5 text-muted-foreground">{t('sp.simulated')}</span>}
        </div>
        <h3 className="mt-1 font-bold leading-snug">{p.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {safe && (
            <a href={p.destinationUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
              onClick={() => track.mutate({ id: p.id, data: { kind: 'click', sessionKey: sessionKey() } })}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" data-testid={`link-sponsored-${p.id}`}>
              {t('sp.visit')} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <span>{t('sp.until')} {date(p.endsAt, false)}</span>
          <span className="hidden sm:inline">{t('sp.why')}</span>
        </div>
      </div>
    </aside>
  );
}

export function SponsoredSlot({ placement }: { placement: 'dashboard' | 'community' }) {
  const q = useGetSponsoredPlacements({ query: { queryKey: getGetSponsoredPlacementsQueryKey(), refetchInterval: 60_000 } });
  const items = (q.data ?? []).filter((p) => p.placement === placement).slice(0, 1);
  if (!items.length) return null;
  return <div className="space-y-3" data-testid={`slot-sponsored-${placement}`}>{items.map((p) => <Card key={p.id} p={p} />)}</div>;
}

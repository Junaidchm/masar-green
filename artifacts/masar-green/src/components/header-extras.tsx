import { Link, useLocation } from 'wouter';
import { Bell, Megaphone, MessageSquareWarning, MoreHorizontal, BellRing, ArrowRight, Sparkles } from 'lucide-react';
import { useGetServiceAlerts, getGetServiceAlertsQueryKey } from '@workspace/api-client-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { isActiveAlert, SEV_CLS } from '@/lib/engagement';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function useActiveAlerts() {
  const { user } = useAuth();
  const q = useGetServiceAlerts({ query: { queryKey: getGetServiceAlertsQueryKey(), enabled: !!user, refetchInterval: 15_000, refetchIntervalInBackground: false } });
  const active = (q.data ?? []).filter((a) => isActiveAlert(a));
  return { q, active, unread: active.filter((a) => !a.read) };
}

export function AlertBell() {
  const { t, lang, date } = useI18n();
  const { user } = useAuth();
  const { unread } = useActiveAlerts();
  if (!user) return null;
  const n = unread.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid h-10 w-10 place-items-center rounded-md text-white/80 hover:bg-white/10" aria-label={`${t('al.bell')}${n ? `, ${n} ${t('al.unread')}` : ''}`} data-testid="button-bell">
          <Bell className="h-4 w-4" />
          {n > 0 && <span className="absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#C8102E] px-1 text-[10px] font-bold text-white ring-2 ring-[#111111] num" data-testid="text-unread-count">{n > 9 ? '9+' : n}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,22rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-bold">{t('al.bell')}</span>
          <span className="text-xs text-muted-foreground num">{n} {t('al.unread')}</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {n === 0 ? <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground"><BellRing className="h-4 w-4" />{t('al.empty')}</p>
            : unread.slice(0, 5).map((a) => (
              <Link key={a.id} href="/notifications" className="block border-b px-4 py-3 last:border-0 hover:bg-muted" data-testid={`link-bell-alert-${a.id}`}>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEV_CLS[a.severity]}`}>{t(`sev.${a.severity}`)}</span>
                <span className="mt-1 block text-sm font-semibold">{lang === 'ar' ? a.titleAr : a.title}</span>
                <span className="block text-xs text-muted-foreground">{a.service || t('al.network')} · {date(a.publishedAt)}</span>
              </Link>
            ))}
        </div>
        <Link href="/notifications" className="flex items-center justify-center gap-1.5 border-t px-4 py-2.5 text-sm font-semibold text-primary hover:bg-muted" data-testid="link-bell-all">
          {t('al.viewAll')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export function MoreMenu() {
  const { t } = useI18n();
  const [loc, navigate] = useLocation();
  const items = [
    { href: '/assistant', label: t('nav.assistant'), icon: Sparkles },
    { href: '/notifications', label: t('nav.notifications'), icon: Bell },
    { href: '/feedback', label: t('nav.feedback'), icon: MessageSquareWarning },
    { href: '/advertise', label: t('nav.advertise'), icon: Megaphone },
  ];
  const on = items.some((i) => loc.startsWith(i.href));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`grid h-10 w-10 place-items-center rounded-md hover:bg-white/10 ${on ? 'text-white' : 'text-white/80'}`} aria-label={t('nav.moreMenu')} data-testid="button-more">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {items.map((i) => (
          <DropdownMenuItem key={i.href} onSelect={() => navigate(i.href)} className={`gap-2.5 py-2.5 ${loc.startsWith(i.href) ? 'font-bold text-primary' : ''}`} data-testid={`menu-${i.href.slice(1)}`}>
            <i.icon className="h-4 w-4" />{i.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

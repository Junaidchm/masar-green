import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Route as RouteIcon, Map, Wallet, UserRound, Moon, Sun, Languages, LogIn, LogOut, Trophy, History, Calculator, Building2, Landmark, Eye, WifiOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useUpdateProfile, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BrandMark, FlagStripe } from './common';
import { LoginForm } from './login-form';
import { AlertBell, MoreMenu } from './header-extras';

function usePrefs() {
  const { lang, setLang, dark, setDark } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const upd = useUpdateProfile();
  const save = (d: { language?: 'en' | 'ar'; darkMode?: boolean }) => {
    if (user) upd.mutate({ data: d }, { onSuccess: () => void qc.invalidateQueries({ queryKey: getGetMeQueryKey() }) });
  };
  return {
    toggleLang: () => { const l = lang === 'en' ? 'ar' : 'en'; setLang(l); save({ language: l }); },
    toggleDark: () => { setDark(!dark); save({ darkMode: !dark }); },
    dark,
  };
}

export function Shell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, isGuest, openLogin, signOut, loginOpen, closeLogin, loading } = useAuth();
  const [loc] = useLocation();
  const { toggleLang, toggleDark, dark } = usePrefs();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const bare = loc === '/login' || loc === '/onboarding';
  const nav = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/plan', label: t('nav.plan'), icon: RouteIcon },
    { href: '/map', label: t('nav.map'), icon: Map },
    { href: '/wallet', label: t('nav.wallet'), icon: Wallet },
    { href: '/challenges', label: t('nav.challenges'), icon: Trophy },
    { href: '/trips', label: t('nav.trips'), icon: History },
    { href: '/carbon', label: t('nav.carbon'), icon: Calculator },
    ...(user?.role === 'employer' ? [{ href: '/employer', label: t('nav.employer'), icon: Building2 }] : []),
    ...(user?.role === 'city' ? [{ href: '/city', label: t('nav.city'), icon: Landmark }] : []),
  ];
  const tabs = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/plan', label: t('nav.plan'), icon: RouteIcon },
    { href: '/map', label: t('nav.mapShort'), icon: Map },
    { href: '/wallet', label: t('nav.wallet'), icon: Wallet },
    { href: '/profile', label: t('nav.profile'), icon: UserRound },
  ];
  const active = (h: string) => (h === '/' ? loc === '/' : loc.startsWith(h));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-50 bg-[#111111] text-[#F5F6F7]">
        <FlagStripe />
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:h-16 md:px-6">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
            <BrandMark className="h-8 w-8" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight">Masar Green</span>
              <span className="block text-[10px] font-medium text-white/60" style={{ fontFamily: 'Noto Kufi Arabic' }}>مسار الأخضر</span>
            </span>
          </Link>
          <nav className="ms-4 hidden flex-1 items-center gap-0.5 lg:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.href.slice(1) || 'home'}`}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${active(n.href) ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                {n.label}
                {active(n.href) && <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-t bg-[#C8102E]" />}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            <AlertBell />
            <MoreMenu />
            <button onClick={toggleLang} className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-white/80 hover:bg-white/10" data-testid="button-lang" aria-label="Language">
              <Languages className="h-4 w-4" /><span className="hidden md:inline">{t('toggle.lang')}</span>
            </button>
            <button onClick={toggleDark} className="grid h-10 w-10 place-items-center rounded-md text-white/80 hover:bg-white/10" aria-label={t('toggle.theme')} data-testid="button-theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {loading ? <span className="h-9 w-20 animate-pulse rounded-md bg-white/10" /> : user ? (
              <>
                <Link href="/profile" className="ms-1 hidden items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10 md:flex" data-testid="link-profile">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#00732F] text-xs font-bold">{(user.name || '?').slice(0, 2).toUpperCase()}</span>
                  <span className="max-w-[8rem] truncate text-sm font-semibold">{user.name}</span>
                </Link>
                <button onClick={signOut} className="hidden h-10 w-10 place-items-center rounded-md text-white/70 hover:bg-white/10 md:grid" aria-label={t('signOut')} data-testid="button-logout-header"><LogOut className="h-4 w-4 rtl:rotate-180" /></button>
              </>
            ) : (
              <button onClick={openLogin} aria-label={t('signIn')} className="ms-1 inline-flex h-10 items-center gap-2 rounded-md bg-[#C8102E] px-3 text-sm font-semibold text-white hover:brightness-110" data-testid="button-signin">
                <LogIn className="h-4 w-4 rtl:rotate-180" /><span className="hidden min-[400px]:inline">{t('signIn')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!online && <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-black"><WifiOff className="h-4 w-4" />{t('offline')}</div>}
      {isGuest && !loading && !bare && (
        <div className="border-b border-[#B8964B]/40 bg-[#B8964B]/12" data-testid="banner-guest">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 md:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#F5F6F7]"><Eye className="h-3 w-3" />{t('guest.label')}</span>
            <span className="flex-1 text-sm">{t('guest.text')}</span>
            <button onClick={openLogin} className="text-sm font-bold text-primary underline-offset-4 hover:underline" data-testid="button-guest-signin">{t('signInNol')}</button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 md:px-6 lg:pb-12">{children}</main>

      <footer className="border-t bg-card/60 pb-24 lg:pb-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:px-6">
          <span data-testid="text-disclaimer">{t('footer')}</span>
          <span className="flex gap-4">
            <Link href="/carbon" className="hover:text-foreground">{t('nav.carbon')}</Link>
            <Link href="/profile" className="hover:text-foreground">{t('profile.privacy')}</Link>
          </span>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Primary">
        <div className="grid grid-cols-5">
          {tabs.map((n) => {
            const on = active(n.href);
            return (
              <Link key={n.href} href={n.href} className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${on ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`tab-${n.href.slice(1) || 'home'}`}>
                {on && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-primary" />}
                <n.icon className="h-5 w-5" />{n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Dialog open={loginOpen} onOpenChange={(o) => !o && closeLogin()}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{t('login.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('login.explain')}</DialogDescription>
          <LoginForm compact />
        </DialogContent>
      </Dialog>
    </div>
  );
}

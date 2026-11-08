import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Route as RouteIcon, Map, Wallet, UserRound, Moon, Sun, Languages, LogIn, LogOut, Building2, Landmark, Eye, WifiOff, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useUpdateProfile, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BrandMark } from './common';
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
      <a className="skip-link" href="#main-content">{t('ui.skip')}</a>
      <header className="app-header sticky top-0 z-50">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-2 px-4 md:h-20 md:gap-3 md:px-6">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
            <BrandMark className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight">Masar Green</span>
              <span className="block text-[10px] font-medium text-muted-foreground" style={{ fontFamily: 'Noto Kufi Arabic' }}>مسار الأخضر</span>
            </span>
          </Link>
          <nav className="ms-3 hidden flex-1 items-center gap-1 lg:flex" aria-label={t('ui.navigation')}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.href.slice(1) || 'home'}`}
                aria-current={active(n.href) ? 'page' : undefined}
                className={`app-nav-link gap-1.5 px-3 py-2 text-[13px] font-semibold ${active(n.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            <AlertBell />
            <MoreMenu />
            <button onClick={toggleLang} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-foreground hover:bg-muted" data-testid="button-lang" aria-label={t('toggle.lang')}>
              <Languages className="h-4 w-4" /><span className="hidden md:inline">{t('toggle.lang')}</span>
            </button>
            <button onClick={toggleDark} className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted" aria-label={t('toggle.theme')} data-testid="button-theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {loading ? <span className="h-9 w-16 animate-pulse rounded-xl bg-muted" /> : user ? (
              <>
                <Link href="/profile" className="ms-1 hidden items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted md:flex" data-testid="link-profile">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{(user.name || '?').slice(0, 2).toUpperCase()}</span>
                  <span className="hidden max-w-[8rem] truncate text-sm font-semibold xl:inline">{user.name}</span>
                </Link>
                <button onClick={signOut} className="hidden h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted md:grid" aria-label={t('signOut')} data-testid="button-logout-header"><LogOut className="h-4 w-4 rtl:rotate-180" /></button>
              </>
            ) : (
              <button onClick={openLogin} aria-label={t('signIn')} className="ms-1 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:brightness-110" data-testid="button-signin">
                <LogIn className="h-4 w-4 rtl:rotate-180" /><span className="hidden min-[400px]:inline">{t('signIn')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!online && <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-black"><WifiOff className="h-4 w-4" />{t('offline')}</div>}
      {isGuest && !loading && !bare && (
        <div className="guest-banner" data-testid="banner-guest">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 md:px-6">
            <span className="guest-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"><Eye className="h-3 w-3" />{t('guest.label')}</span>
            <span className="min-w-[180px] flex-1 text-xs leading-relaxed text-muted-foreground">{t('guest.text')}</span>
            <button onClick={openLogin} className="min-h-9 text-xs font-bold text-primary underline-offset-4 hover:underline" data-testid="button-guest-signin">{t('signInNol')}</button>
          </div>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="app-main mx-auto w-full max-w-7xl flex-1 px-4 pb-28 md:px-6 lg:pb-12">{children}</main>

      <footer className="border-t bg-card/60 pb-24 lg:pb-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:px-6">
          <span data-testid="text-disclaimer">{t('footer')}</span>
          <span className="flex gap-4">
            <Link href="/carbon" className="hover:text-foreground">{t('nav.carbon')}</Link>
            <Link href="/profile" className="hover:text-foreground">{t('profile.privacy')}</Link>
          </span>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label={t('ui.navigation')}>
        <div className="grid grid-cols-5">
          {tabs.map((n) => {
            const on = active(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1 text-[10px] font-semibold ${on ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`tab-${n.href.slice(1) || 'home'}`}>
                <span className={`grid h-7 w-11 place-items-center rounded-full ${on ? 'bg-primary/10' : ''}`}><n.icon className="h-[18px] w-[18px]" /></span>{n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {!bare && loc !== '/assistant' && (
        <Link href="/assistant" aria-label={t('as.launcher')} data-testid="link-assistant-launcher"
          className="group fixed end-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#194e43] ps-1.5 pe-4 text-sm font-bold text-[#fffef9] shadow-lg ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 active:scale-95 bottom-[calc(80px+env(safe-area-inset-bottom))] lg:bottom-6 lg:end-6">
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[#d6ed74]">
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
          </span>
          <span>{t('as.launcherShort')}</span>
        </Link>
      )}

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

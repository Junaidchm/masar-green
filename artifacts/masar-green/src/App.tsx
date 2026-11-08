import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Shell } from '@/components/shell';
import { CelebrationProvider } from '@/components/celebration';
import HomePage from '@/pages/home';
import PlanPage from '@/pages/plan';
import MapPage from '@/pages/map';
import WalletPage from '@/pages/wallet';
import ChallengesPage from '@/pages/challenges';
import ProfilePage from '@/pages/profile';
import TripsPage from '@/pages/trips';
import CarbonPage from '@/pages/carbon';
import ReportPage from '@/pages/report';
import AdvertisePage from '@/pages/advertise';
import NotificationsPage from '@/pages/notifications';
import FeedbackPage from '@/pages/feedback';
import { LoginPage, OnboardingPage, NotFoundPage } from '@/pages/auth-pages';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: (n, e) => (e as { status?: number })?.status !== 401 && n < 2, refetchOnWindowFocus: false, staleTime: 15_000 } },
});

function OnboardingGate() {
  const { needsOnboarding } = useAuth();
  const [loc, navigate] = useLocation();
  useEffect(() => { if (needsOnboarding && loc !== '/onboarding') navigate('/onboarding'); }, [needsOnboarding, loc, navigate]);
  return null;
}

function PageMetadata() {
  const [location] = useLocation();
  const { t } = useI18n();
  useEffect(() => {
    const pages: Record<string, readonly [string, string]> = {
      '/advertise': ['ad.title', 'ad.sub'],
      '/notifications': ['al.title', 'al.sub'],
      '/feedback': ['fb.title', 'fb.sub'],
    };
    const page = pages[location];
    const title = page ? `${t(page[0])} · Masar Green` : 'Masar Green';
    const description = page ? `${t(page[1])} ${t('footer')}` : t('footer');
    document.title = title;
    for (const [name, content] of [['description', description], ['og:title', title], ['og:description', description]]) {
      const property = name.startsWith('og:') ? 'property' : 'name';
      let meta = document.head.querySelector<HTMLMetaElement>(`meta[${property}="${name}"]`);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(property, name); document.head.appendChild(meta); }
      meta.content = content;
    }
  }, [location, t]);
  return null;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/plan" component={PlanPage} />
        <Route path="/map" component={MapPage} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/challenges" component={ChallengesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/trips" component={TripsPage} />
        <Route path="/carbon" component={CarbonPage} />
        <Route path="/employer">{() => <ReportPage kind="employer" />}</Route>
        <Route path="/city">{() => <ReportPage kind="city" />}</Route>
        <Route path="/advertise" component={AdvertisePage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/feedback" component={FeedbackPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <I18nProvider>
            <AuthProvider>
              <CelebrationProvider>
                <OnboardingGate />
                <PageMetadata />
                <Shell><Router /></Shell>
              </CelebrationProvider>
            </AuthProvider>
          </I18nProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

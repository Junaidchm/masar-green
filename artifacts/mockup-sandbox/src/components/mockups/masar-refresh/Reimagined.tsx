import { useState } from 'react';
import {
  ArrowDownLeft, ArrowRight, Bell, BusFront, CalendarDays, Check, ChevronRight, CircleHelp,
  CreditCard, Flame, Gift, Globe2, HeartHandshake, History, Leaf, Map, Medal, Navigation,
  Route as RouteIcon, Search, Send, Sparkles, TreePine, Trophy, Wallet,
} from 'lucide-react';
import './_group.css';
import './_refined.css';
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from '@/components/ui/dialog';

type Panel = 'plan' | 'alerts' | 'feedback' | 'assistant' | 'route' | null;
type Lang = 'en' | 'ar';
const values = {
  month: 43.85, lifetime: 346.57, credits: 3105, reward: 31.05,
  nol: 42.50, streak: 7, trips: 101, trees: 2.01,
};

const copy = {
  en: {
    today: 'YOUR EVERYDAY JOURNEY · DUBAI', greeting: 'A steadier way across the city, Amina.',
    subtitle: 'Your everyday choices are adding up.', impact: 'YOUR IMPACT THIS MONTH',
    month: 'kg CO₂ saved', impactLine: 'Small shifts in how you move make a real difference.',
    lifetime: 'Saved over time', nol: 'Simulated NOL balance', wallet: 'GREEN WALLET',
    credits: 'credits', redeem: 'See reward options', trees: 'Tree-equivalent', streak: 'Ride streak',
    days: 'days', rank: 'Community place', trips: 'Trips logged', recent: 'A GOOD WAY TO GO',
    recentSub: 'Your latest greener journey · Demo trip', route: 'Dubai Marina → Burj Khalifa / Dubai Mall',
    metro: 'METRO', mins: '57 min', distance: '24.34 km', saved: '3.44 kg saved', gained: '+34 credits',
    history: 'Trip history', challenge: 'THIS WEEK’S SMALL WIN', challengeTitle: 'Make 3 metro journeys',
    challengeCopy: 'One more ride to reach your next reward.', progress: '2 of 3 journeys', viewChallenge: 'View challenge',
    quick: 'Your next move', plan: 'Plan a journey', network: 'Network map', feedback: 'Share feedback',
    alertTitle: 'Service updates', sponsor: 'Sponsored offers', explain: 'Your carbon story',
    aiTitle: 'Ask Masar', aiSub: 'A calm guide to greener ways around Dubai.', ask: 'Ask a question',
    demo: 'DEMO PROFILE', demoNote: 'Concept preview · Values and trips are simulated for demonstration.',
    footer: 'Masar Green is an independent concept and is not affiliated with RTA or NOL.',
    lang: 'العربية', notifications: 'Updates', profile: 'Amina Hassan', savedNote: 'Tree-equivalent is a comparison, not an offset.',
    dialogPlan: 'Plan a greener journey', planDesc: 'Try a sample route. This prototype does not use live transit data.',
    from: 'Starting point', to: 'Where are you headed?', search: 'Show sample route', sampleRoute: 'Sample journey',
    planResult: 'Metro from Dubai Marina to Burj Khalifa / Dubai Mall · 57 min · 24.34 km',
    planImpact: 'Example estimate: 3.44 kg CO₂ saved and 34 simulated credits.',
    alertsDesc: 'Examples only — no live service feed is connected.',
    alertOne: 'Metro service · Demo update', alertOneText: 'A sample notice for the Red Line. Check official channels for current travel information.',
    alertTwo: 'Gentle reminder · Demo', alertTwoText: 'You are one journey away from completing this week’s simulated challenge.',
    feedbackTitle: 'Tell us what would help', feedbackDesc: 'Draft a suggestion for this concept. Nothing is sent to a transport authority.',
    type: 'What is this about?', message: 'Your suggestion', sendDraft: 'Preview my draft', feedbackConfirm: 'Your draft is ready in this local preview. It has not been sent.',
    assistantTitle: 'Ask Masar · Preview', assistantDesc: 'Choose a starter question for a sample answer. No AI or remote service is connected.',
    q1: 'How can I make my commute greener?', q2: 'What does tree-equivalent mean?', q3: 'How do my credits work?',
    answer1: 'A simple place to start: compare a Metro-led route with your usual trip, and add a short walk where it suits you. Journey times here are examples, not live guidance.',
    answer2: 'It is a way to make a carbon number easier to picture. It does not mean trees were planted, or that your saved emissions have been offset.',
    answer3: 'Credits are simulated in this prototype. Your 3,105 credits show an example reward value of AED 31.05; there is no redemption or payment here.',
    routePreview: 'Section preview', previewDesc: 'This prototype keeps you on the dashboard. In the full Masar Green experience, this section would open here.',
    close: 'Close', complaint: 'Complaint or suggestion', profileLink: 'Your profile', carbon: 'How impact is estimated',
    map: 'Dubai network map', walletLink: 'Green Wallet', challenges: 'Challenges', tripsLink: 'Trip history',
    sponsorTitle: 'Sponsored · Dubai mobility offer', sponsorText: 'A clearly labeled example placement for a local mobility partner. No booking or tracking is active.',
    exploreSponsor: 'Explore sponsored options',
  },
  ar: {
    today: 'رحلتك اليومية · دبي', greeting: 'تنقّل أكثر هدوءاً في المدينة يا أمينة.',
    subtitle: 'اختياراتك اليومية تصنع فرقاً.', impact: 'أثرك هذا الشهر',
    month: 'كجم من CO₂ تم توفيرها', impactLine: 'التغييرات الصغيرة في تنقّلك تصنع فرقاً حقيقياً.',
    lifetime: 'إجمالي ما تم توفيره', nol: 'رصيد نول تجريبي', wallet: 'المحفظة الخضراء',
    credits: 'رصيد', redeem: 'عرض خيارات المكافآت', trees: 'ما يعادل الأشجار', streak: 'سلسلة التنقّل',
    days: 'أيام', rank: 'ترتيب المجتمع', trips: 'رحلة مسجّلة', recent: 'رحلة خضراء جميلة',
    recentSub: 'أحدث رحلة مستدامة · رحلة تجريبية', route: 'دبي مارينا ← برج خليفة / دبي مول',
    metro: 'المترو', mins: '٥٧ دقيقة', distance: '٢٤٫٣٤ كم', saved: '٣٫٤٤ كجم تم توفيرها', gained: '+٣٤ رصيداً',
    history: 'سجل الرحلات', challenge: 'إنجازك الصغير هذا الأسبوع', challengeTitle: '٣ رحلات بالمترو',
    challengeCopy: 'رحلة أخرى للوصول إلى مكافأتك التالية.', progress: 'رحلتان من ٣', viewChallenge: 'عرض التحدي',
    quick: 'خطوتك التالية', plan: 'خطّط لرحلتك', network: 'خريطة الشبكة', feedback: 'شاركنا رأيك',
    alertTitle: 'تحديثات الخدمة', sponsor: 'عروض برعاية', explain: 'أثر رحلاتك',
    aiTitle: 'اسأل مسار', aiSub: 'دليل هادئ لخيارات تنقّل أفضل في دبي.', ask: 'اطرح سؤالاً',
    demo: 'ملف تجريبي', demoNote: 'معاينة للمفهوم · القيم والرحلات محاكاة للعرض فقط.',
    footer: 'مسار الأخضر مفهوم مستقل وغير تابع لهيئة الطرق والمواصلات أو نول.',
    lang: 'English', notifications: 'التحديثات', profile: 'أمينة حسن', savedNote: 'ما يعادل الأشجار للمقارنة فقط وليس تعويضاً للكربون.',
    dialogPlan: 'خطّط لرحلة أكثر استدامة', planDesc: 'جرّب مساراً نموذجياً. لا يستخدم هذا النموذج بيانات النقل المباشرة.',
    from: 'نقطة الانطلاق', to: 'إلى أين تتجهين؟', search: 'اعرض مساراً نموذجياً', sampleRoute: 'رحلة نموذجية',
    planResult: 'المترو من دبي مارينا إلى برج خليفة / دبي مول · ٥٧ دقيقة · ٢٤٫٣٤ كم',
    planImpact: 'تقدير توضيحي: توفير ٣٫٤٤ كجم من CO₂ و٣٤ رصيداً تجريبياً.',
    alertsDesc: 'أمثلة فقط — لا توجد خدمة مباشرة للتحديثات.',
    alertOne: 'خدمة المترو · تحديث تجريبي', alertOneText: 'إشعار تجريبي للخط الأحمر. يرجى مراجعة القنوات الرسمية لمعلومات السفر الحالية.',
    alertTwo: 'تذكير لطيف · تجريبي', alertTwoText: 'تبقّت لك رحلة واحدة لإكمال تحدي هذا الأسبوع المحاكى.',
    feedbackTitle: 'أخبرينا بما يساعدك', feedbackDesc: 'اكتبي اقتراحاً لهذا المفهوم. لن يتم إرساله إلى جهة النقل.',
    type: 'ما موضوع الاقتراح؟', message: 'اقتراحك', sendDraft: 'معاينة الاقتراح', feedbackConfirm: 'اقتراحك جاهز في هذه المعاينة المحلية، ولم يتم إرساله.',
    assistantTitle: 'اسأل مسار · معاينة', assistantDesc: 'اختاري سؤالاً للحصول على إجابة نموذجية. لا يوجد ذكاء اصطناعي أو اتصال خارجي.',
    q1: 'كيف أجعل تنقّلي اليومي أكثر استدامة؟', q2: 'ماذا يعني ما يعادل الأشجار؟', q3: 'كيف يعمل الرصيد؟',
    answer1: 'ابدئي بمقارنة مسار يعتمد على المترو مع رحلتك المعتادة، وأضيفي مسافة قصيرة سيراً عندما يناسبك. الأوقات هنا أمثلة وليست إرشادات مباشرة.',
    answer2: 'إنها طريقة لتصوّر رقم الكربون. لا تعني زراعة أشجار أو تعويض الانبعاثات التي تم توفيرها.',
    answer3: 'الرصيد محاكاة في هذا النموذج. ٣٬١٠٥ رصيداً تساوي قيمة مكافآت توضيحية قدرها ٣١٫٠٥ درهم، ولا يوجد استرداد أو دفع.',
    routePreview: 'معاينة القسم', previewDesc: 'يبقيك هذا النموذج في لوحة المعلومات. في تجربة مسار الأخضر الكاملة سيفتح هذا القسم هنا.',
    close: 'إغلاق', complaint: 'شكوى أو اقتراح', profileLink: 'ملفك الشخصي', carbon: 'كيف نحسب الأثر',
    map: 'خريطة شبكة دبي', walletLink: 'المحفظة الخضراء', challenges: 'التحديات', tripsLink: 'سجل الرحلات',
    sponsorTitle: 'برعاية · عرض تنقّل في دبي', sponsorText: 'مثال واضح لموضع إعلان لشريك تنقّل محلي. لا يوجد حجز أو تتبّع.',
    exploreSponsor: 'استكشفي العروض المدعومة',
  },
};

const routes: Record<string, string> = {
  '/plan':'Plan a journey', '/map':'Dubai network map', '/wallet':'Green Wallet',
  '/challenges':'Challenges', '/trips':'Trip history', '/carbon':'How impact is estimated',
  '/profile':'Your profile', '/notifications':'Service updates', '/feedback':'Complaint or suggestion',
  '/advertise':'Sponsored offers', '/assistant':'Ask Masar',
};

export function Reimagined() {
  const [lang, setLang] = useState<Lang>('en');
  const [panel, setPanel] = useState<Panel>(null);
  const [destination, setDestination] = useState('');
  const [from, setFrom] = useState('Dubai Marina');
  const [to, setTo] = useState('Burj Khalifa / Dubai Mall');
  const [showRoute, setShowRoute] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);
  const [answer, setAnswer] = useState('');
  const [alertSeen, setAlertSeen] = useState(false);
  const t = copy[lang];
  const rtl = lang === 'ar';

  const preview = (path: string) => {
    if (path === '/') {
      setPanel(null);
      window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      return;
    }
    const sectionNames: Record<string,string> = {
      '/map':t.map,'/wallet':t.walletLink,'/challenges':t.challenges,
      '/trips':t.tripsLink,'/carbon':t.carbon,'/profile':t.profileLink,'/advertise':t.sponsor,
    };
    setDestination(sectionNames[path] || routes[path] || t.profileLink);
    setPanel('route');
  };
  const openPanel = (next: Panel) => {
    setDestination('');
    if (next === 'feedback') setSent(false);
    if (next === 'assistant') setAnswer('');
    if (next === 'plan') setShowRoute(false);
    setPanel(next);
  };
  const go = (path: string) => {
    if (path === '/plan') openPanel('plan');
    else if (path === '/notifications') { setAlertSeen(true); openPanel('alerts'); }
    else if (path === '/feedback') openPanel('feedback');
    else if (path === '/assistant') openPanel('assistant');
    else preview(path);
  };

  const nav = [
    { path: '/', label: rtl ? 'الرئيسية' : 'Home', icon: Leaf },
    { path: '/plan', label: t.plan, icon: RouteIcon },
    { path: '/map', label: t.network, icon: Map },
    { path: '/wallet', label: t.wallet, icon: Wallet },
  ];
  const quick = [
    { path:'/plan', label:t.plan, icon:RouteIcon, cls:'' },
    { path:'/map', label:t.network, icon:Map, cls:'' },
    { path:'/feedback', label:t.feedback, icon:HeartHandshake, cls:'' },
    { path:'/notifications', label:t.alertTitle, icon:Bell, cls:'alert-action' },
    { path:'/carbon', label:t.explain, icon:Leaf, cls:'' },
    { path:'/advertise', label:t.sponsor, icon:Globe2, cls:'sponsor' },
    { path:'/trips', label:t.history, icon:History, cls:'' },
    { path:'/profile', label:t.profileLink, icon:CircleHelp, cls:'' },
  ];

  return (
    <div className="masar-refined" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
      <div className="mr-shell">
        <header className="mr-topbar">
          <button className="mr-brand" onClick={() => preview('/')} aria-label="Masar Green home">
            <span className="mr-mark"><Leaf size={22} strokeWidth={2.4}/></span>
            <span><span className="mr-brand-name">Masar Green</span><span className="mr-brand-ar">مسار الأخضر</span></span>
          </button>
          <nav className="mr-nav" aria-label="Main navigation">
            {nav.map((item, i) => <button key={item.path} className={`mr-nav-btn ${i === 0 ? 'active' : ''}`} onClick={() => go(item.path)}>
              <item.icon aria-hidden="true"/>{item.label}
            </button>)}
          </nav>
          <div className="mr-tools">
            <button className="mr-icon-btn" aria-label={t.notifications} onClick={() => go('/notifications')}>
              <Bell size={18}/>{!alertSeen && <span className="mr-alert-dot" aria-hidden="true"/>}
            </button>
            <button className="mr-lang" onClick={() => setLang(rtl ? 'en' : 'ar')} aria-label={rtl ? 'Switch to English' : 'التبديل إلى العربية'}>
              <Globe2 size={15}/>{t.lang}
            </button>
            <button className="mr-profile" onClick={() => go('/profile')} aria-label={t.profileLink}>
              <span className="mr-avatar">AH</span>
              <span className="mr-profile-name">{t.profile}<span className="mr-profile-sub">{t.demo}</span></span>
            </button>
          </div>
        </header>

        <main className="mr-content">
          <div className="mr-welcome">
            <div>
              <div className="mr-eyebrow"><i aria-hidden="true"/>{t.today}</div>
              <h1 className="mr-display">{t.greeting}</h1>
              <p>{t.subtitle}</p>
            </div>
            <div className="mr-date">{t.demo} · Amina Hassan</div>
          </div>

          <nav className="mr-service-shortcuts" aria-label={rtl?'خدمات المساعدة':'Commuter support'}>
            <button onClick={()=>go('/notifications')}><Bell size={16}/>{t.alertTitle}</button>
            <button onClick={()=>go('/feedback')}><HeartHandshake size={16}/>{t.feedback}</button>
            <button onClick={()=>go('/assistant')}><Sparkles size={16}/>{t.aiTitle}<ArrowRight size={14}/></button>
          </nav>

          <div className="mr-grid-main">
            <section className="mr-impact" aria-label={t.impact}>
              <div className="mr-impact-head">
                <span className="mr-tag"><span aria-hidden="true">●</span>{t.impact}</span>
                <span className="mr-impact-mark"><Leaf size={18}/></span>
              </div>
              <div className="mr-impact-label">{t.month}</div>
              <div className="mr-impact-number mr-num">{values.month.toFixed(2)} <small>kg</small></div>
              <p className="mr-impact-copy">{t.impactLine}</p>
              <div className="mr-impact-bottom">
                <div><span className="mr-impact-foot-label">{t.lifetime}</span><span className="mr-impact-foot-value mr-num">{values.lifetime.toFixed(2)} kg</span></div>
                <div><span className="mr-impact-foot-label">{t.nol}</span><span className="mr-impact-foot-value mr-num">AED {values.nol.toFixed(2)}</span></div>
              </div>
            </section>
            <button className="mr-wallet" onClick={() => go('/wallet')} aria-label={`${t.wallet} AED ${values.reward.toFixed(2)}`}>
              <div>
                <div className="mr-wallet-top"><span>{t.wallet}</span><span className="mr-wallet-chip"><CreditCard size={18}/></span></div>
                <div className="mr-wallet-amount mr-num">AED {values.reward.toFixed(2)}</div>
                <div className="mr-wallet-sub mr-num">{values.credits.toLocaleString('en')} {t.credits} · demo value</div>
              </div>
              <div className="mr-wallet-bottom"><span className="mr-link-button">{t.redeem}<ArrowRight size={15}/></span><Gift size={18} color="#1b6654"/></div>
            </button>
          </div>

          <section className="mr-metrics" aria-label="Your mobility snapshot">
            <div className="mr-metric"><div className="mr-metric-top">{t.trees}<TreePine className="mr-metric-icon" size={17}/></div><div className="mr-metric-value mr-num">{values.trees.toFixed(2)} <small>×</small></div></div>
            <div className="mr-metric"><div className="mr-metric-top">{t.streak}<Flame className="mr-metric-icon" size={17}/></div><div className="mr-metric-value mr-num">{values.streak} <small>{t.days}</small></div></div>
            <div className="mr-metric"><div className="mr-metric-top">{t.rank}<Medal className="mr-metric-icon" size={17}/></div><div className="mr-metric-value mr-num">#2</div></div>
            <div className="mr-metric"><div className="mr-metric-top">{t.trips}<RouteIcon className="mr-metric-icon" size={17}/></div><div className="mr-metric-value mr-num">{values.trips}</div></div>
          </section>

          <div className="mr-lower">
            <section className="mr-panel">
              <div className="mr-section-head">
                <div><h2 className="mr-section-title">{t.recent}</h2><p className="mr-section-sub">{t.recentSub}</p></div>
                <button className="mr-link-button mr-trips-link" onClick={() => go('/trips')}>{t.history}<ChevronRight size={15}/></button>
              </div>
              <div className="mr-journey">
                <span className="mr-route-art"><Navigation size={22}/></span>
                <div className="mr-journey-main">
                  <div className="mr-journey-route">{t.route}</div>
                  <div className="mr-journey-meta mr-num">{t.distance} <span aria-hidden="true">·</span> {t.mins}</div>
                </div>
                <span className="mr-trip-badge">{t.metro}</span>
              </div>
              <div className="mr-trip-impact">
                <span className="mr-saved"><Leaf size={14} style={{verticalAlign:'-2px', marginInlineEnd:4}}/>{t.saved}</span>
                <span className="mr-saved">+34 {t.credits}</span>
              </div>
            </section>
            <div className="mr-right-column">
              <section className="mr-challenge">
                <div className="mr-challenge-kicker"><Trophy size={13} style={{verticalAlign:'-3px',marginInlineEnd:5}}/>{t.challenge}</div>
                <h2 className="mr-challenge-title">{t.challengeTitle}</h2>
                <p className="mr-challenge-copy">{t.challengeCopy}</p>
                <div className="mr-progress-row"><span>{t.progress}</span><span>+60 credits</span></div>
                <div className="mr-progress" aria-label={t.progress}><span/></div>
                <button className="mr-link-button mr-challenge-action" onClick={() => go('/challenges')}>{t.viewChallenge}<ArrowRight size={14}/></button>
              </section>
              <section className="mr-panel" style={{padding:'16px 18px'}}>
                <div className="mr-section-head" style={{marginBottom:10}}>
                  <div><h2 className="mr-section-title" style={{fontSize:14}}>{t.sponsor}</h2><p className="mr-section-sub">{t.sponsorTitle}</p></div>
                  <span className="mr-preview-stamp">Sponsored</span>
                </div>
                <p style={{margin:0,fontSize:11,color:'var(--mr-muted)',lineHeight:1.5}}>{t.sponsorText}</p>
                <button className="mr-link-button" style={{marginTop:8}} onClick={() => go('/advertise')}>{t.exploreSponsor}<ArrowRight size={14}/></button>
              </section>
            </div>
          </div>

          <section className="mr-bottom-actions" aria-label={t.quick}>
            {quick.map((item) => <button className={`mr-action ${item.cls}`} key={item.path} onClick={() => go(item.path)}>
              <span className="mr-action-icon"><item.icon size={17}/></span><span>{item.label}</span>
            </button>)}
          </section>

          <section className="mr-ai">
            <span className="mr-ai-orb"><Sparkles size={19}/></span>
            <div className="mr-ai-text"><div className="mr-ai-title">{t.aiTitle}</div><div className="mr-ai-sub">{t.aiSub}</div></div>
            <button className="mr-ai-button" onClick={() => openPanel('assistant')}>{t.ask}<ArrowRight size={14} style={{verticalAlign:'-3px',marginInlineStart:6}}/></button>
          </section>
          <footer className="mr-footer"><span>{t.footer}</span><span>{t.demoNote} {t.savedNote}</span></footer>
        </main>
      </div>

      <nav className="mr-mobile-nav" aria-label="Primary navigation">
        <button className="mr-mobile-tab active" onClick={() => preview('/')}><Leaf/>{rtl ? 'الرئيسية' : 'Home'}</button>
        <button className="mr-mobile-tab" onClick={() => go('/plan')}><RouteIcon/>{t.plan}</button>
        <button className="mr-mobile-tab" onClick={() => go('/map')}><Map/>{rtl ? 'الخريطة' : 'Map'}</button>
        <button className="mr-mobile-tab" onClick={() => go('/wallet')}><Wallet/>{rtl ? 'المحفظة' : 'Wallet'}</button>
        <button className="mr-mobile-tab" onClick={() => go('/profile')}><CircleHelp/>{rtl ? 'ملفي' : 'Profile'}</button>
      </nav>

      <Dialog open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        <DialogContent className="mr-dialog max-h-[88dvh] overflow-y-auto sm:rounded-2xl" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          {panel === 'plan' && <>
            <DialogTitle>{t.dialogPlan}</DialogTitle><DialogDescription>{t.planDesc}</DialogDescription>
            <label htmlFor="route-from">{t.from}</label><input id="route-from" value={from} readOnly />
            <label htmlFor="route-to">{t.to}</label><div style={{display:'flex',gap:8}}><input id="route-to" value={to} readOnly /><button className="mr-dialog-secondary" aria-label={rtl?'تبديل محطتي المثال':'Swap sample locations'} onClick={() => {setFrom(to);setTo(from);setShowRoute(false);}}><ArrowDownLeft size={17}/></button></div>
            <button className="mr-dialog-primary" style={{marginTop:14,width:'100%'}} onClick={() => setShowRoute(true)}><Search size={15} style={{verticalAlign:'-3px',marginInlineEnd:7}}/>{t.search}</button>
            {showRoute && <div className="mr-notice" style={{marginTop:14}}><strong>{t.sampleRoute}</strong><p style={{margin:'6px 0'}}>{t.metro} · <bdi>{from} → {to}</bdi> · {t.mins} · {t.distance}</p><div>{t.planImpact}</div></div>}
          </>}
          {panel === 'alerts' && <>
            <DialogTitle>{t.alertTitle}</DialogTitle><DialogDescription>{t.alertsDesc}</DialogDescription>
            <div className="mr-notification"><span className="mr-notification-icon"><BusFront size={17}/></span><div><strong>{t.alertOne}</strong><p>{t.alertOneText}</p></div></div>
            <div className="mr-notification"><span className="mr-notification-icon"><CalendarDays size={17}/></span><div><strong>{t.alertTwo}</strong><p>{t.alertTwoText}</p></div></div>
            <div className="mr-notice">{t.alertsDesc}</div>
          </>}
          {panel === 'feedback' && <>
            <DialogTitle>{t.feedbackTitle}</DialogTitle><DialogDescription>{t.feedbackDesc}</DialogDescription>
            {!sent ? <form onSubmit={(e) => {e.preventDefault(); if (feedback.trim()) setSent(true);}}>
              <label htmlFor="feedback-type">{t.type}</label><select id="feedback-type"><option>{t.complaint}</option><option>{t.feedback}</option></select>
              <label htmlFor="feedback-text">{t.message}</label><textarea id="feedback-text" required value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={rtl ? 'اكتبي ملاحظتك هنا…' : 'Write a note about your commute…'}/>
              <button className="mr-dialog-primary" style={{marginTop:14,width:'100%'}} type="submit"><Send size={14} style={{verticalAlign:'-3px',marginInlineEnd:7}}/>{t.sendDraft}</button>
            </form> : <div className="mr-confirm"><Check size={16} style={{verticalAlign:'-4px',marginInlineEnd:6}}/>{t.feedbackConfirm}<p style={{margin:'10px 0 0',fontWeight:500}}>{feedback}</p></div>}
          </>}
          {panel === 'assistant' && <>
            <DialogTitle>{t.assistantTitle}</DialogTitle><DialogDescription>{t.assistantDesc}</DialogDescription>
            <button className="mr-question" onClick={() => setAnswer(t.answer1)}>{t.q1}</button>
            <button className="mr-question" onClick={() => setAnswer(t.answer2)}>{t.q2}</button>
            <button className="mr-question" onClick={() => setAnswer(t.answer3)}>{t.q3}</button>
            {answer && <div className="mr-notice" style={{marginTop:13}}>{answer}</div>}
          </>}
          {panel === 'route' && <>
            <div className="mr-preview-stamp">{t.routePreview}</div>
            <DialogTitle>{destination || t.profileLink}</DialogTitle>
            <DialogDescription>{t.previewDesc}</DialogDescription>
            {destination.includes('Sponsored') || destination.includes('advert') || destination.includes('عروض') ? <div className="mr-notice">{t.sponsorText}</div> : null}
            {destination.includes('impact') || destination.includes('carbon') || destination.includes('أثر') ? <div className="mr-notice">{t.savedNote} {t.impactLine}</div> : null}
            <button className="mr-dialog-primary" style={{marginTop:6}} onClick={() => setPanel(null)}>{t.close}</button>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

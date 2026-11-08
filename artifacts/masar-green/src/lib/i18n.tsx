import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiText } from './api-text';

export type Lang = 'en' | 'ar';

const en = {
  brand: 'Masar Green',
  'nav.home': 'Home', 'nav.plan': 'Plan', 'nav.map': 'Live map', 'nav.mapShort': 'Map', 'nav.wallet': 'Wallet',
  'nav.challenges': 'Challenges', 'nav.profile': 'Profile', 'nav.trips': 'Trips', 'nav.carbon': 'How it works',
  'nav.employer': 'Employer', 'nav.city': 'City insights', 'nav.more': 'More',
  signIn: 'Sign in', signOut: 'Sign out', signInNol: 'Sign in with NOL Card',
  footer: 'Concept prototype. Not affiliated with RTA, NOL or any government entity. Data is simulated.',
  'guest.label': 'Guest preview', 'guest.text': "You're viewing demo commuter Amina's simulated data. Sign in to plan, earn and redeem.",
  'guest.short': 'Demo data',
  'toggle.lang': 'العربية', 'toggle.theme': 'Toggle dark mode',
  aed: 'AED', kg: 'kg', km: 'km', min: 'min', credits: 'credits', gst: 'GST',
  'home.greeting.morning': 'Good morning', 'home.greeting.afternoon': 'Good afternoon', 'home.greeting.evening': 'Good evening',
  'home.month': "This month's CO₂ saved", 'home.trees': 'Tree-equivalent', 'home.streak': 'Current streak', 'home.rank': 'Community rank',
  'home.days': 'days', 'home.trees.unit': 'trees', 'home.nol': 'NOL card balance (mock)', 'home.wallet': 'Green Wallet',
  'home.weekly': 'CO₂ saved this week', 'home.recent': 'Recent trips', 'home.quick': 'Quick actions', 'home.viewAll': 'View all',
  'home.total': 'Lifetime saved', 'home.trips': 'Trips logged', 'home.heroLine': 'Every metro ride, every walk to the station, counted.',
  'home.noTrips': 'No trips yet. Plan your first green journey and watch the savings start.',
  'qa.plan': 'Plan a trip', 'qa.map': 'Live map', 'qa.wallet': 'My wallet', 'qa.challenges': 'Challenges',
  'plan.title': 'Plan a journey', 'plan.sub': 'Metro, bus, tram, abra, bike and walking — compared side by side.',
  'plan.from': 'From', 'plan.to': 'To', 'plan.search': 'Search Dubai places', 'plan.useLoc': 'Use my location', 'plan.swap': 'Swap',
  'plan.accessible': 'Step-free route (lifts, ramps)', 'plan.go': 'Find routes', 'plan.sort': 'Sort by',
  'plan.options': 'route options', 'plan.start': 'Start trip', 'plan.legs': 'Step by step', 'plan.walk': 'walking',
  'plan.transfers': 'transfers', 'plan.crowd': 'Crowd', 'plan.price': 'Price', 'plan.time': 'Time', 'plan.co2': 'CO₂',
  'plan.earn': 'Earns', 'plan.empty': 'Choose where you are and where you are going. We will compare every way across the city.',
  'plan.same': 'Pick two different places.', 'plan.pick': 'Choose both a start and a destination.',
  'plan.locNeedConsent': 'Location is off. Turn on location consent in Profile to use this.',
  'plan.locUnsupported': 'Your browser cannot share location.', 'plan.locDenied': 'Location permission was denied.',
  'plan.locFound': 'Nearest place set', 'plan.started': 'Trip started', 'plan.startedDesc': 'Tap out with the simulation button when you arrive.',
  'tag.Greenest': 'Greenest', 'tag.Cheapest': 'Cheapest', 'tag.Fastest': 'Fastest', 'tag.Least Crowded': 'Least crowded',
  'crowd.Low': 'Low', 'crowd.Medium': 'Medium', 'crowd.High': 'High',
  'active.title': 'Trip in progress', 'active.since': 'Started', 'active.simulate': 'Simulate arrival + tap out',
  'active.simNote': 'Accelerated simulation: no real tracking happens. This button stands in for the NOL tap-out at your destination.',
  'active.noTap': 'End without tap-out', 'active.noTapNote': 'Without a tap-out the trip may be held for review.',
  'celebrate.title': 'Journey complete', 'celebrate.saved': 'You saved', 'celebrate.earned': 'and earned',
  'celebrate.pending': 'Held for review', 'celebrate.pendingDesc': 'This trip scored below the verification threshold, so credits are paused until it is verified.',
  'celebrate.done': 'Lovely, thanks', 'celebrate.verify': 'Verification score',
  'map.title': 'Live network', 'map.updated': 'Updated', 'map.layers': 'Layers', 'map.metro': 'Metro', 'map.bus': 'Bus',
  'map.tram': 'Tram', 'map.water': 'Water taxi', 'map.bike': 'Bikes', 'map.select': 'Tap a vehicle or station to see arrivals.',
  'map.arrivals': 'Next arrivals', 'map.noArrivals': 'No vehicles heading here in the next few minutes.', 'map.nextStop': 'Next stop',
  'map.eta': 'ETA', 'map.vehicles': 'vehicles moving', 'map.station': 'Station', 'map.vehicle': 'Vehicle', 'map.line': 'Line',
  'map.polling': 'Refreshes every 5 seconds',
  'wallet.title': 'Green Wallet', 'wallet.balance': 'Available', 'wallet.earned': 'Earned all time', 'wallet.expiring': 'Expiring within 30 days',
  'wallet.expiryWarn': 'credits expire soon. Credits last 12 months from the day you earn them.',
  'wallet.redeem': 'Redeem', 'wallet.history': 'History', 'wallet.vouchers': 'My vouchers', 'wallet.nol': 'Top up NOL card',
  'wallet.nolDesc': 'Move credit value onto your card balance (simulated).', 'wallet.partners': 'Partner vouchers',
  'wallet.donate': 'Donate', 'wallet.donateDesc': 'Fund mangrove planting and rooftop solar projects (simulated).',
  'wallet.bank': 'Withdraw to bank', 'wallet.bankDesc': 'Minimum AED 50. Coming soon.', 'wallet.amount': 'Amount (AED)',
  'wallet.confirm': 'Confirm', 'wallet.cost': 'Uses', 'wallet.insufficient': 'Not enough credits for that amount.',
  'wallet.min': 'Minimum', 'wallet.success': 'Redeemed', 'wallet.qr': 'Show QR', 'wallet.expires': 'Expires',
  'wallet.code': 'Code', 'wallet.noHistory': 'No wallet activity yet.', 'wallet.noVouchers': 'No vouchers yet. Redeem credits to create one.',
  'wallet.comingSoon': 'Coming soon', 'wallet.bankBody': 'Bank withdrawals are not live in this prototype. You can register your interest and we will record the request — no money moves.',
  'wallet.registerInterest': 'Register interest', 'wallet.rate': 'credits = AED 1',
  'ledger.earned': 'Earned', 'ledger.redeemed': 'Redeemed', 'ledger.expired': 'Expired', 'ledger.bonus': 'Bonus',
  'ch.title': 'Challenges & community', 'ch.weekly': 'This week', 'ch.claim': 'Claim bonus', 'ch.claimed': 'Claimed',
  'ch.ends': 'Ends', 'ch.bonus': 'bonus', 'ch.leaders': 'Leaderboards', 'ch.individual': 'Individual', 'ch.workplace': 'Workplace',
  'ch.neighbourhood': 'Neighbourhood', 'ch.badges': 'Badges', 'ch.you': 'You', 'ch.claimedToast': 'Bonus added to your wallet',
  'ch.empty': 'No challenges running this week.', 'ch.earned': 'Earned', 'ch.locked': 'Locked',
  'trips.title': 'Trip history', 'trips.all': 'All', 'trips.completed': 'Completed', 'trips.pending': 'Pending review',
  'trips.active': 'In progress', 'trips.empty': 'No trips here yet.', 'trips.score': 'Verification',
  'status.completed': 'Verified', 'status.pending_review': 'Pending review', 'status.pending': 'Pending review', 'status.active': 'In progress', 'status.rejected': 'Rejected',
  'carbon.title': 'How is this calculated?', 'carbon.baseline': 'Baseline: a solo petrol car over the same distance',
  'carbon.explanation': 'Compare your route with a solo petrol car over the same distance. Actual emissions are the sum of each leg’s distance × its transport factor. Only verified trips earn credits, rounded down and capped at 500 per GST day. 100 credits = AED 1 in simulated value. Trees equivalent uses 21.77 kg CO₂/tree-year; it is a comparison, not a carbon offset. Factors are illustrative, not audited UAE measurements.',
  'wallet.project':'Choose a project', 'wallet.treeProject':'Ghaf tree planting', 'wallet.solarProject':'Community solar',
  'wallet.bankConfirmation':'Bank withdrawals are coming soon. This is a concept confirmation only. No bank details were collected, no money moved, and no credits were deducted.',
  'wallet.closeConfirmation':'Understood',
  'carbon.formula': 'CO₂ saved = (baseline factor − your mode factor) × distance, never below zero',
  'carbon.factors': 'Emission factors', 'carbon.factorUnit': 'kg CO₂ per passenger-km', 'carbon.conversion': 'From kilograms to dirhams',
  'carbon.try': 'Try it', 'carbon.distance': 'Distance', 'carbon.mode': 'Your mode', 'carbon.result': 'Saved vs. driving',
  'carbon.verify': 'Verification', 'carbon.verifyBody': 'Each trip gets a score from the simulated NOL tap-in/tap-out and GPS plausibility (speed and route match). Below the threshold, a trip waits for review and earns nothing until verified.',
  'carbon.threshold': 'Threshold', 'carbon.cap': 'Daily earning cap', 'carbon.abuse': 'Duplicate trips and impossible speeds are rejected automatically.',
  'profile.title': 'Profile & privacy', 'profile.settings': 'Settings', 'profile.name': 'Name', 'profile.language': 'Language',
  'profile.dark': 'Dark mode', 'profile.notifications': 'Notifications', 'profile.notificationsDesc': 'Challenge reminders and voucher expiry alerts.',
  'profile.privacy': 'Privacy centre', 'profile.location': 'Location access', 'profile.locationDesc': 'Lets "Use my location" find your nearest station. Only asked when you press it.',
  'profile.tracking': 'Trip tracking', 'profile.trackingDesc': 'Links your NOL tap-ins and tap-outs to Green Credits.',
  'profile.collect': 'What we collect and why', 'profile.collectBody': 'Your card number, trip start and end points, and modes — to calculate CO₂ saved and credits. We never sell data. Employers and city analysts only see anonymised totals.',
  'profile.export': 'Download my data', 'profile.delete': 'Delete trip history', 'profile.deleteConfirm': 'Delete all trips?',
  'profile.deleteBody': 'This permanently removes your trip history. Credits already earned stay in your wallet.',
  'profile.cancel': 'Cancel', 'profile.deleted': 'Trip history deleted', 'profile.saved': 'Saved', 'profile.card': 'Card',
  'profile.install': 'Install app', 'profile.installDesc': 'Add Masar Green to your home screen for quick access. Works offline for the app shell only.',
  'profile.installBtn': 'Install', 'profile.installed': 'Already installed', 'profile.installIos': 'On iPhone: tap Share, then Add to Home Screen.',
  'profile.installNo': 'Your browser does not offer installation here. Try Chrome or Edge, or Safari on iPhone.',
  'profile.guest': 'Sign in to manage your settings and privacy.', 'profile.role': 'Role', 'profile.save': 'Save',
  'role.commuter': 'Commuter', 'role.employer': 'Employer admin', 'role.city': 'City analyst',
  'login.title': 'Sign in with your NOL card', 'login.explain': 'Your NOL card links your verified public transport trips to your Green Credits',
  'login.card': 'Card number', 'login.cardHint': '8 to 10 digits', 'login.pin': 'PIN', 'login.pinHint': '4 digits',
  'login.submit': 'Sign in', 'login.tap': 'Tap your card', 'login.nfcUnsupported': 'Card tapping (Web NFC) is not supported on this device. Type your card number instead.',
  'login.nfcReady': 'Hold your card near the back of your phone', 'login.nfcRead': 'Card read', 'login.demo': 'Demo cards',
  'login.demoHint': 'Simulated cards for this prototype. Choose one to sign in.', 'login.cardErr': 'Card number must be 8 to 10 digits.',
  'login.pinErr': 'PIN must be 4 digits.', 'login.welcome': 'Welcome', 'login.local': 'Local card + PIN simulation. No real NOL account is contacted.',
  'demo.amina': 'Amina — regular metro commuter', 'demo.new': 'New card — first-time onboarding', 'demo.omar': 'Omar — heavy user, high balance',
  'demo.employer': 'Employer admin — Al Noor Logistics', 'demo.city': 'City analyst — aggregated insights',
  'onb.title': 'Welcome aboard', 'onb.sub': 'Three quick things and you are ready to ride greener.', 'onb.name': 'What should we call you?',
  'onb.lang': 'Preferred language', 'onb.consent': 'Your choices', 'onb.consentNote': 'Both are off until you switch them on. You can change them any time in Profile.',
  'onb.finish': 'Start using Masar Green', 'onb.nameErr': 'Please enter your name.',
  'emp.title': 'Employer ESG report', 'emp.sub': 'Aggregated and anonymised. Individual locations are never shown.',
  'city.title': 'City mobility insights', 'city.sub': 'Anonymised origins and destinations, crowding and ridership.',
  'rep.saved': 'Commute CO₂ saved', 'rep.participation': 'Participation', 'rep.participants': 'Participants', 'rep.trips': 'Trips',
  'rep.cars': 'Cars off the road (est.)', 'rep.ridership': 'Ridership change', 'rep.groups': 'Top teams', 'rep.cityGroups': 'CO₂ saved by area',
  'rep.crowding': 'Peak-hour crowding by line', 'rep.heatmap': 'Trip origin & destination heatmap', 'rep.csv': 'Export CSV',
  'rep.from': 'From', 'rep.to': 'To', 'rep.apply': 'Apply', 'rep.period': 'Period', 'rep.forbidden': 'This view is for a different role',
  'rep.forbiddenBody': 'Sign in with the matching demo card to open this report.',
  'err.generic': 'Something went wrong. Please try again.', 'err.auth': 'Please sign in to do that.', 'err.rate': 'Too many attempts. Wait a minute and try again.',
  'err.network': 'Cannot reach the server. Check your connection.', 'err.retry': 'Try again', 'err.load': 'We could not load this.',
  'nf.title': 'This road does not exist', 'nf.body': 'The page you are looking for is not on the network map.', 'nf.home': 'Back home',
  'mode.metro': 'Metro', 'mode.bus': 'Bus', 'mode.tram': 'Tram', 'mode.water': 'Water taxi', 'mode.taxi': 'Taxi', 'mode.bike': 'Bike / e-scooter',
  'mode.walk': 'Walk', 'mode.car': 'Car', 'mode.mixed': 'Multimodal',
  offline: 'You are offline. Showing the saved app shell; live data needs a connection.',
};

type Key = keyof typeof en;
const ar: Partial<Record<Key, string>> = {
  brand: 'مسار الأخضر',
  'nav.home': 'الرئيسية', 'nav.plan': 'خطط', 'nav.map': 'الخريطة الحية', 'nav.mapShort': 'الخريطة', 'nav.wallet': 'المحفظة',
  'nav.challenges': 'التحديات', 'nav.profile': 'حسابي', 'nav.trips': 'الرحلات', 'nav.carbon': 'طريقة الحساب',
  'nav.employer': 'جهة العمل', 'nav.city': 'رؤى المدينة', 'nav.more': 'المزيد',
  signIn: 'تسجيل الدخول', signOut: 'تسجيل الخروج', signInNol: 'الدخول ببطاقة نول',
  footer: 'نموذج تجريبي. غير تابع لهيئة الطرق والمواصلات أو نول أو أي جهة حكومية. البيانات محاكاة.',
  'guest.label': 'معاينة الضيف', 'guest.text': 'تشاهد بيانات محاكاة للمستخدمة التجريبية أمينة. سجّل الدخول للتخطيط والكسب والاستبدال.',
  'guest.short': 'بيانات تجريبية', 'toggle.lang': 'English', 'toggle.theme': 'تبديل الوضع الداكن',
  aed: 'د.إ', kg: 'كغ', km: 'كم', min: 'د', credits: 'رصيد', gst: 'بتوقيت الخليج',
  'home.greeting.morning': 'صباح الخير', 'home.greeting.afternoon': 'مساء الخير', 'home.greeting.evening': 'مساء النور',
  'home.month': 'ثاني أكسيد الكربون الموفَّر هذا الشهر', 'home.trees': 'ما يعادل أشجاراً', 'home.streak': 'السلسلة الحالية', 'home.rank': 'الترتيب في المجتمع',
  'home.days': 'أيام', 'home.trees.unit': 'شجرة', 'home.nol': 'رصيد بطاقة نول (محاكاة)', 'home.wallet': 'المحفظة الخضراء',
  'home.weekly': 'التوفير هذا الأسبوع', 'home.recent': 'أحدث الرحلات', 'home.quick': 'إجراءات سريعة', 'home.viewAll': 'عرض الكل',
  'home.total': 'إجمالي التوفير', 'home.trips': 'الرحلات المسجلة', 'home.heroLine': 'كل رحلة مترو وكل خطوة إلى المحطة محسوبة.',
  'home.noTrips': 'لا رحلات بعد. خطط لرحلتك الخضراء الأولى.',
  'qa.plan': 'خطط رحلة', 'qa.map': 'الخريطة الحية', 'qa.wallet': 'محفظتي', 'qa.challenges': 'التحديات',
  'plan.title': 'خطط لرحلتك', 'plan.sub': 'المترو والحافلة والترام والعبرة والدراجة والمشي — مقارنة جنباً إلى جنب.',
  'plan.from': 'من', 'plan.to': 'إلى', 'plan.search': 'ابحث عن أماكن في دبي', 'plan.useLoc': 'استخدم موقعي', 'plan.swap': 'تبديل',
  'plan.accessible': 'مسار بلا درج (مصاعد ومنحدرات)', 'plan.go': 'ابحث عن المسارات', 'plan.sort': 'رتّب حسب',
  'plan.options': 'خيارات المسار', 'plan.start': 'ابدأ الرحلة', 'plan.legs': 'خطوة بخطوة', 'plan.walk': 'مشي',
  'plan.transfers': 'تبديلات', 'plan.crowd': 'الازدحام', 'plan.price': 'السعر', 'plan.time': 'الوقت', 'plan.co2': 'الانبعاثات',
  'plan.earn': 'تكسب', 'plan.empty': 'اختر نقطة الانطلاق والوجهة وسنقارن كل الطرق عبر المدينة.',
  'plan.same': 'اختر مكانين مختلفين.', 'plan.pick': 'اختر نقطة الانطلاق والوجهة.',
  'plan.locNeedConsent': 'الموقع غير مفعّل. فعّل موافقة الموقع من صفحة حسابي.',
  'plan.locUnsupported': 'متصفحك لا يدعم مشاركة الموقع.', 'plan.locDenied': 'تم رفض إذن الموقع.',
  'plan.locFound': 'تم تحديد أقرب مكان', 'plan.started': 'بدأت الرحلة', 'plan.startedDesc': 'استخدم زر المحاكاة عند الوصول لتسجيل الخروج.',
  'tag.Greenest': 'الأكثر خضرة', 'tag.Cheapest': 'الأرخص', 'tag.Fastest': 'الأسرع', 'tag.Least Crowded': 'الأقل ازدحاماً',
  'crowd.Low': 'منخفض', 'crowd.Medium': 'متوسط', 'crowd.High': 'مرتفع',
  'active.title': 'رحلة جارية', 'active.since': 'بدأت', 'active.simulate': 'محاكاة الوصول وتسجيل الخروج',
  'active.simNote': 'محاكاة مُسرّعة: لا يوجد تتبع حقيقي. هذا الزر يحاكي تسجيل خروج بطاقة نول عند الوجهة.',
  'active.noTap': 'إنهاء بدون تسجيل خروج', 'active.noTapNote': 'بدون تسجيل الخروج قد تخضع الرحلة للمراجعة.',
  'celebrate.title': 'اكتملت الرحلة', 'celebrate.saved': 'وفّرت', 'celebrate.earned': 'وكسبت',
  'celebrate.pending': 'قيد المراجعة', 'celebrate.pendingDesc': 'نتيجة التحقق أقل من الحد المطلوب، لذا الرصيد معلّق حتى التحقق.',
  'celebrate.done': 'رائع، شكراً', 'celebrate.verify': 'نتيجة التحقق',
  'map.title': 'الشبكة الحية', 'map.updated': 'آخر تحديث', 'map.layers': 'الطبقات', 'map.metro': 'المترو', 'map.bus': 'الحافلات',
  'map.tram': 'الترام', 'map.water': 'التاكسي المائي', 'map.bike': 'الدراجات', 'map.select': 'اضغط على مركبة أو محطة لرؤية المواعيد.',
  'map.arrivals': 'الوصول التالي', 'map.noArrivals': 'لا مركبات متجهة إلى هنا في الدقائق القادمة.', 'map.nextStop': 'المحطة التالية',
  'map.eta': 'الوصول المتوقع', 'map.vehicles': 'مركبة تتحرك', 'map.station': 'محطة', 'map.vehicle': 'مركبة', 'map.line': 'الخط',
  'map.polling': 'يتحدث كل 5 ثوانٍ',
  'wallet.title': 'المحفظة الخضراء', 'wallet.balance': 'المتاح', 'wallet.earned': 'إجمالي المكتسب', 'wallet.expiring': 'ينتهي خلال 30 يوماً',
  'wallet.expiryWarn': 'رصيد سينتهي قريباً. صلاحية الرصيد 12 شهراً من تاريخ كسبه.',
  'wallet.redeem': 'استبدال', 'wallet.history': 'السجل', 'wallet.vouchers': 'قسائمي', 'wallet.nol': 'شحن بطاقة نول',
  'wallet.nolDesc': 'انقل قيمة الرصيد إلى بطاقتك (محاكاة).', 'wallet.partners': 'قسائم الشركاء',
  'wallet.donate': 'تبرّع', 'wallet.donateDesc': 'ادعم زراعة القرم ومشاريع الطاقة الشمسية (محاكاة).',
  'wallet.bank': 'سحب إلى البنك', 'wallet.bankDesc': 'الحد الأدنى 50 د.إ. قريباً.', 'wallet.amount': 'المبلغ (د.إ)',
  'wallet.confirm': 'تأكيد', 'wallet.cost': 'يستخدم', 'wallet.insufficient': 'الرصيد غير كافٍ لهذا المبلغ.',
  'wallet.min': 'الحد الأدنى', 'wallet.success': 'تم الاستبدال', 'wallet.qr': 'عرض الرمز', 'wallet.expires': 'ينتهي',
  'wallet.code': 'الرمز', 'wallet.noHistory': 'لا يوجد نشاط بعد.', 'wallet.noVouchers': 'لا قسائم بعد. استبدل رصيدك لإنشاء واحدة.',
  'wallet.comingSoon': 'قريباً', 'wallet.bankBody': 'السحب البنكي غير متاح في هذا النموذج. يمكنك تسجيل اهتمامك وسنسجل الطلب — دون تحويل أموال.',
  'wallet.registerInterest': 'سجّل اهتمامك', 'wallet.rate': 'رصيد = 1 د.إ',
  'ledger.earned': 'مكتسب', 'ledger.redeemed': 'مستبدل', 'ledger.expired': 'منتهي', 'ledger.bonus': 'مكافأة',
  'ch.title': 'التحديات والمجتمع', 'ch.weekly': 'هذا الأسبوع', 'ch.claim': 'اطلب المكافأة', 'ch.claimed': 'تم الطلب',
  'ch.ends': 'ينتهي', 'ch.bonus': 'مكافأة', 'ch.leaders': 'لوحات الصدارة', 'ch.individual': 'أفراد', 'ch.workplace': 'جهات العمل',
  'ch.neighbourhood': 'الأحياء', 'ch.badges': 'الشارات', 'ch.you': 'أنت', 'ch.claimedToast': 'أضيفت المكافأة إلى محفظتك',
  'ch.empty': 'لا تحديات هذا الأسبوع.', 'ch.earned': 'مكتسبة', 'ch.locked': 'مقفلة',
  'trips.title': 'سجل الرحلات', 'trips.all': 'الكل', 'trips.completed': 'مكتملة', 'trips.pending': 'قيد المراجعة',
  'trips.active': 'جارية', 'trips.empty': 'لا رحلات هنا بعد.', 'trips.score': 'التحقق',
  'status.completed': 'موثّقة', 'status.pending_review': 'قيد المراجعة', 'status.pending': 'قيد المراجعة', 'status.active': 'جارية', 'status.rejected': 'مرفوضة',
  'carbon.title': 'كيف نحسب ذلك؟', 'carbon.baseline': 'خط الأساس: سيارة بنزين بسائق واحد للمسافة نفسها',
  'carbon.explanation':'نقارن مسارك بسيارة بنزين بسائق واحد للمسافة نفسها. الانبعاثات الفعلية هي مجموع مسافة كل جزء مضروبة في معامل وسيلته. تكسب الرحلات الموثّقة فقط أرصدة تُقرّب للأسفل بحد 500 رصيد يومياً بتوقيت الخليج. كل 100 رصيد يساوي درهماً واحداً بقيمة افتراضية. يعادل تقدير الأشجار 21.77 كغ سنوياً للشجرة، وهو للمقارنة وليس تعويضاً كربونياً. المعاملات افتراضية وليست قياسات إماراتية معتمدة.',
  'wallet.project':'اختر مشروعاً', 'wallet.treeProject':'زراعة أشجار الغاف', 'wallet.solarProject':'الطاقة الشمسية المجتمعية',
  'wallet.bankConfirmation':'السحب البنكي قريباً. هذا تأكيد تجريبي فقط. لم تُجمع بيانات بنكية ولم تُنقل أموال ولم تُخصم أي أرصدة.',
  'wallet.closeConfirmation':'فهمت',
  'carbon.formula': 'التوفير = (معامل خط الأساس − معامل وسيلتك) × المسافة، ولا يقل عن صفر',
  'carbon.factors': 'معاملات الانبعاث', 'carbon.factorUnit': 'كغ ثاني أكسيد الكربون لكل راكب-كم', 'carbon.conversion': 'من الكيلوغرامات إلى الدراهم',
  'carbon.try': 'جرّب بنفسك', 'carbon.distance': 'المسافة', 'carbon.mode': 'وسيلتك', 'carbon.result': 'التوفير مقارنة بالقيادة',
  'carbon.verify': 'التحقق', 'carbon.verifyBody': 'تحصل كل رحلة على نتيجة من محاكاة دخول وخروج نول ومعقولية GPS (السرعة ومطابقة المسار). تحت الحد تنتظر الرحلة المراجعة ولا تكسب شيئاً حتى التحقق.',
  'carbon.threshold': 'الحد', 'carbon.cap': 'الحد اليومي للكسب', 'carbon.abuse': 'تُرفض الرحلات المكررة والسرعات المستحيلة تلقائياً.',
  'profile.title': 'الحساب والخصوصية', 'profile.settings': 'الإعدادات', 'profile.name': 'الاسم', 'profile.language': 'اللغة',
  'profile.dark': 'الوضع الداكن', 'profile.notifications': 'الإشعارات', 'profile.notificationsDesc': 'تذكير بالتحديات وتنبيهات انتهاء القسائم.',
  'profile.privacy': 'مركز الخصوصية', 'profile.location': 'الوصول إلى الموقع', 'profile.locationDesc': 'يتيح لزر "استخدم موقعي" إيجاد أقرب محطة. لا يُطلب إلا عند الضغط.',
  'profile.tracking': 'تتبع الرحلات', 'profile.trackingDesc': 'يربط دخولك وخروجك ببطاقة نول بالرصيد الأخضر.',
  'profile.collect': 'ما نجمعه ولماذا', 'profile.collectBody': 'رقم بطاقتك ونقاط بداية ونهاية الرحلة ووسائل النقل — لحساب التوفير والرصيد. لا نبيع البيانات. جهات العمل ومحللو المدينة يرون مجاميع مجهولة فقط.',
  'profile.export': 'تنزيل بياناتي', 'profile.delete': 'حذف سجل الرحلات', 'profile.deleteConfirm': 'حذف كل الرحلات؟',
  'profile.deleteBody': 'سيتم حذف سجل رحلاتك نهائياً. يبقى الرصيد المكتسب في محفظتك.',
  'profile.cancel': 'إلغاء', 'profile.deleted': 'تم حذف سجل الرحلات', 'profile.saved': 'تم الحفظ', 'profile.card': 'البطاقة',
  'profile.install': 'تثبيت التطبيق', 'profile.installDesc': 'أضف مسار الأخضر إلى الشاشة الرئيسية. يعمل دون اتصال لواجهة التطبيق فقط.',
  'profile.installBtn': 'تثبيت', 'profile.installed': 'مثبت بالفعل', 'profile.installIos': 'على آيفون: اضغط مشاركة ثم إضافة إلى الشاشة الرئيسية.',
  'profile.installNo': 'متصفحك لا يتيح التثبيت هنا. جرّب كروم أو إيدج، أو سفاري على آيفون.',
  'profile.guest': 'سجّل الدخول لإدارة إعداداتك وخصوصيتك.', 'profile.role': 'الدور', 'profile.save': 'حفظ',
  'role.commuter': 'متنقل', 'role.employer': 'مسؤول جهة العمل', 'role.city': 'محلل المدينة',
  'login.title': 'سجّل الدخول ببطاقة نول', 'login.explain': 'بطاقة نول تربط رحلاتك الموثقة في النقل العام برصيدك الأخضر',
  'login.card': 'رقم البطاقة', 'login.cardHint': 'من 8 إلى 10 أرقام', 'login.pin': 'الرمز السري', 'login.pinHint': '4 أرقام',
  'login.submit': 'تسجيل الدخول', 'login.tap': 'المس بطاقتك', 'login.nfcUnsupported': 'لمس البطاقة (Web NFC) غير مدعوم على هذا الجهاز. اكتب رقم البطاقة بدلاً من ذلك.',
  'login.nfcReady': 'قرّب بطاقتك من ظهر هاتفك', 'login.nfcRead': 'تمت قراءة البطاقة', 'login.demo': 'بطاقات تجريبية',
  'login.demoHint': 'بطاقات محاكاة لهذا النموذج. اختر واحدة لتسجيل الدخول.', 'login.cardErr': 'رقم البطاقة يجب أن يكون من 8 إلى 10 أرقام.',
  'login.pinErr': 'الرمز السري 4 أرقام.', 'login.welcome': 'أهلاً', 'login.local': 'محاكاة محلية للبطاقة والرمز. لا يتم الاتصال بحساب نول حقيقي.',
  'demo.amina': 'أمينة — تستخدم المترو بانتظام', 'demo.new': 'بطاقة جديدة — إعداد لأول مرة', 'demo.omar': 'عمر — مستخدم نشط برصيد مرتفع',
  'demo.employer': 'مسؤول جهة العمل — النور للخدمات اللوجستية', 'demo.city': 'محلل المدينة — رؤى مجمّعة',
  'onb.title': 'أهلاً بك', 'onb.sub': 'ثلاث خطوات سريعة وتكون جاهزاً لتنقّل أكثر خضرة.', 'onb.name': 'ماذا نسميك؟',
  'onb.lang': 'اللغة المفضلة', 'onb.consent': 'اختياراتك', 'onb.consentNote': 'كلاهما متوقف حتى تفعّله. يمكنك التغيير في أي وقت من حسابي.',
  'onb.finish': 'ابدأ استخدام مسار الأخضر', 'onb.nameErr': 'يرجى إدخال اسمك.',
  'emp.title': 'تقرير الاستدامة لجهة العمل', 'emp.sub': 'بيانات مجمّعة ومجهولة. لا تظهر المواقع الفردية أبداً.',
  'city.title': 'رؤى التنقل في المدينة', 'city.sub': 'نقاط انطلاق ووجهات مجهولة، الازدحام وعدد الركاب.',
  'rep.saved': 'التوفير من التنقل', 'rep.participation': 'نسبة المشاركة', 'rep.participants': 'المشاركون', 'rep.trips': 'الرحلات',
  'rep.cars': 'سيارات أُزيلت من الطرق (تقديري)', 'rep.ridership': 'تغيّر عدد الركاب', 'rep.groups': 'أفضل الفرق', 'rep.cityGroups': 'التوفير حسب المنطقة',
  'rep.crowding': 'الازدحام في ساعة الذروة حسب الخط', 'rep.heatmap': 'خريطة حرارية لنقاط الانطلاق والوجهات', 'rep.csv': 'تصدير CSV',
  'rep.from': 'من', 'rep.to': 'إلى', 'rep.apply': 'تطبيق', 'rep.period': 'الفترة', 'rep.forbidden': 'هذا العرض لدور آخر',
  'rep.forbiddenBody': 'سجّل الدخول بالبطاقة التجريبية المناسبة لفتح هذا التقرير.',
  'err.generic': 'حدث خطأ ما. حاول مرة أخرى.', 'err.auth': 'يرجى تسجيل الدخول للقيام بذلك.', 'err.rate': 'محاولات كثيرة. انتظر دقيقة ثم حاول.',
  'err.network': 'تعذر الوصول إلى الخادم. تحقق من اتصالك.', 'err.retry': 'حاول مجدداً', 'err.load': 'تعذر تحميل هذا المحتوى.',
  'nf.title': 'هذا الطريق غير موجود', 'nf.body': 'الصفحة المطلوبة ليست على خريطة الشبكة.', 'nf.home': 'العودة للرئيسية',
  'mode.metro': 'مترو', 'mode.bus': 'حافلة', 'mode.tram': 'ترام', 'mode.water': 'تاكسي مائي', 'mode.taxi': 'تاكسي', 'mode.bike': 'دراجة / سكوتر',
  'mode.walk': 'مشي', 'mode.car': 'سيارة', 'mode.mixed': 'متعدد الوسائط',
  offline: 'أنت غير متصل. تُعرض واجهة التطبيق المحفوظة؛ البيانات الحية تحتاج اتصالاً.',
};

export type TKey = Key;

interface Ctx {
  lang: Lang; setLang: (l: Lang) => void; dark: boolean; setDark: (d: boolean) => void;
  t: (k: Key | string) => string; dir: 'ltr' | 'rtl';
  num: (n: number, d?: number) => string; aed: (n: number) => string; date: (iso: string, withTime?: boolean) => string;
  time: (iso: string) => string;
}
const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>(() => (localStorage.getItem('mg-lang') as Lang) || 'en');
  const [dark, setDarkS] = useState<boolean>(() => localStorage.getItem('mg-dark') === '1');
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('mg-lang', lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mg-dark', dark ? '1' : '0');
  }, [dark]);
  const setLang = useCallback((l: Lang) => setLangS(l), []);
  const setDark = useCallback((d: boolean) => setDarkS(d), []);
  const value = useMemo<Ctx>(() => {
    const loc = lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-AE';
    const t = (k: string) => (lang === 'ar' ? (ar as Record<string, string>)[k] : undefined) ?? (en as Record<string, string>)[k] ?? (lang==='ar'?apiText(k):k);
    const num = (n: number, d = 0) => new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number.isFinite(n) ? n : 0);
    return {
      lang, setLang, dark, setDark, t, dir: lang === 'ar' ? 'rtl' : 'ltr', num,
      aed: (n) => (lang === 'ar' ? `${num(n, 2)} د.إ` : `AED ${num(n, 2)}`),
      date: (iso, withTime = true) => {
        const d = new Date(iso); if (isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat(loc, { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', year: withTime ? undefined : 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(d) + (withTime ? ` ${t('gst')}` : '');
      },
      time: (iso) => {
        const d = new Date(iso); if (isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat(loc, { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d) + ` ${t('gst')}`;
      },
    };
  }, [lang, dark, setLang, setDark]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export function useI18n() {
  const c = useContext(I18n);
  if (!c) throw new Error('I18nProvider missing');
  return c;
}

export function modeKey(mode: string): string {
  const m = (mode || '').toLowerCase();
  if (m.includes('metro')) return 'metro';
  if (m.includes('tram')) return 'tram';
  if (m.includes('bus')) return 'bus';
  if (m.includes('water') || m.includes('abra') || m.includes('ferry')) return 'water';
  if (m.includes('taxi')) return 'taxi';
  if (m.includes('bike') || m.includes('scooter') || m.includes('cycl')) return 'bike';
  if (m.includes('walk')) return 'walk';
  if (m.includes('car')) return 'car';
  return 'mixed';
}

export const MODE_COLOR: Record<string, string> = {
  metro: '#C8102E', bus: '#00732F', tram: '#0F7C8C', water: '#2B5DA8', taxi: '#5B5F66', bike: '#B8964B', walk: '#8A8F98', car: '#3A3A3A', mixed: '#111111',
};

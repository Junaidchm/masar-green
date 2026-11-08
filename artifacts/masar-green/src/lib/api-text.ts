// Localise simulated API-owned copy too, not only navigation and form labels.
// Place/partner names remain recognisable proper names.
const phrases:Record<string,string>={
  "Complete 5 verified metro trips this week.":"أكمل 5 رحلات مترو موثّقة هذا الأسبوع.",
  "Complete a verified public transport trip on Friday.":"أكمل رحلة نقل عام موثّقة يوم الجمعة.",
  "Save 10 kg CO₂ on verified journeys this week.":"وفّر 10 كغ من ثاني أكسيد الكربون في رحلات موثّقة هذا الأسبوع.",
  "Complete 2 verified bike or e-scooter journeys.":"أكمل رحلتين موثّقتين بالدراجة أو السكوتر الكهربائي.",
  "First Trip":"الرحلة الأولى","7-day Streak":"7 أيام متتالية","100 kg Saver":"موفّر 100 كغ","Tree Planter":"زارع الأشجار",
  "Complete your first verified journey.":"أكمل رحلتك الموثّقة الأولى.",
  "Travel sustainably for seven consecutive days.":"تنقّل بشكل مستدام سبعة أيام متتالية.",
  "Save 100 kg of CO₂.":"وفّر 100 كغ من ثاني أكسيد الكربون.",
  "Donate Green Credits to a planting project.":"تبرّع بالأرصدة الخضراء لمشروع زراعة.",
  "Fresh groceries, lighter footprint. Simulated partner.":"منتجات غذائية طازجة بأثر أخف. شريك افتراضي.",
  "A better commute deserves a good coffee. Simulated partner.":"تنقّل أفضل يستحق قهوة جيدة. شريك افتراضي.",
  "Bike and e-scooter minutes. Simulated partner.":"دقائق دراجات وسكوتر كهربائي. شريك افتراضي.",
  "Shared-ride credit for the last mile. Simulated partner.":"رصيد رحلة مشتركة للمسافة الأخيرة. شريك افتراضي.",
  "Everyday wellbeing essentials. Simulated partner.":"أساسيات العناية اليومية. شريك افتراضي.",
  "active":"صالحة","expired":"منتهية","coming soon":"قريباً",
  "Low":"منخفض","Medium":"متوسط","High":"مرتفع",
  "Red Line":"الخط الأحمر","Green Line":"الخط الأخضر","Dubai Tram":"ترام دبي","Creek Water Taxi":"التاكسي المائي بالخور",
  "Product & Design":"المنتج والتصميم","Engineering":"الهندسة","Operations":"العمليات",
  "Unused credits expired after 12 months":"أرصدة غير مستخدمة انتهت بعد 12 شهراً",
  "Verified carbon savings · earlier commutes":"توفير كربوني موثّق · رحلات سابقة",
  "Historical verified savings · expired example":"توفير تاريخي موثّق · مثال منتهي",
  "Journey reward · trip history deleted":"مكافأة رحلة · تم حذف سجل الرحلات",
  "Sign in with a demo NOL card to continue.":"سجّل الدخول ببطاقة نول تجريبية للمتابعة.",
  "Enter an 8–10 digit card number and a 4-digit PIN.":"أدخل رقم بطاقة من 8 إلى 10 أرقام ورمزاً سرياً من 4 أرقام.",
  "The card number or PIN is incorrect.":"رقم البطاقة أو الرمز السري غير صحيح.",
  "This demo card is temporarily locked. Try again in 15 minutes.":"البطاقة التجريبية مقفلة مؤقتاً. أعد المحاولة بعد 15 دقيقة.",
  "Too many sign-in attempts. Please wait 15 minutes.":"محاولات تسجيل دخول كثيرة. يرجى الانتظار 15 دقيقة.",
  "Choose two different Dubai locations.":"اختر موقعين مختلفين في دبي.",
  "Enable trip-tracking consent in Profile before starting a simulated tracked trip.":"فعّل الموافقة على تتبّع الرحلات في الملف الشخصي قبل بدء رحلة محاكاة.",
  "End your active trip before starting another.":"أنه رحلتك الحالية قبل بدء رحلة أخرى.",
  "This trip has already ended.":"انتهت هذه الرحلة بالفعل.",
  "Not enough Green Credits for this redemption.":"الأرصدة الخضراء غير كافية لهذا الاستبدال.",
  "Bonus already claimed.":"تم استلام المكافأة بالفعل.",
  "Complete the challenge before claiming your bonus.":"أكمل التحدّي قبل استلام المكافأة.",
  "Choose a valid date range, with start before end.":"اختر فترة صالحة يكون تاريخ بدايتها قبل نهايتها.",
  "This report requires the matching employer admin or city analyst demo account.":"يتطلب التقرير الحساب التجريبي المناسب لمسؤول الشركة أو محلل المدينة.",
};
export function apiText(value:string):string{
  if(phrases[value])return phrases[value]!;
  const walk=value.match(/^Walk (\d+) min to (.*)$/);
  if(walk)return `امشِ ${walk[1]} دقيقة إلى ${walk[2]}`;
  const take=value.match(/^Take (.*) toward (.*?)( · step-free access)?$/);
  if(take)return `استقل ${phrases[take[1]!]??take[1]} باتجاه ${take[2]}${take[3]?" · وصول دون درجات":""}`;
  return value.replace(/ · weekly bonus/g," · مكافأة أسبوعية")
    .replace(/ · simulated AED /g," · محاكاة د.إ ")
    .replace(/Minimum redemption is AED ([\d.]+)\./g,"الحد الأدنى للاستبدال هو $1 د.إ.")
    .replace(/(\d+) bonus Green Credits added to your wallet\./g,"أُضيف $1 رصيد أخضر كمكافأة إلى محفظتك.");
}

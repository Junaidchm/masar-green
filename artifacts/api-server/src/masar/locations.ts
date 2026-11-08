export const locations = [
  ["Burj Khalifa / Dubai Mall","برج خليفة / دبي مول",25.1972,55.2744,"metro","Red Line"],
  ["Dubai Marina","دبي مارينا",25.0805,55.1403,"tram","Dubai Tram"],
  ["Business Bay","الخليج التجاري",25.1912,55.2607,"metro","Red Line"],
  ["DXB Airport Terminal 1","مطار دبي المبنى 1",25.2487,55.3523,"metro","Red Line"],
  ["DXB Airport Terminal 3","مطار دبي المبنى 3",25.2456,55.3599,"metro","Red Line"],
  ["Jumeirah Lakes Towers","أبراج بحيرات جميرا",25.0696,55.1408,"metro","Red Line"],
  ["Deira City Centre","سيتي سنتر ديرة",25.2518,55.3326,"metro","Red Line"],
  ["Al Ghubaiba","الغبيبة",25.2631,55.2885,"metro","Green Line"],
  ["Union","الاتحاد",25.2673,55.3145,"metro","Red / Green Line"],
  ["Expo City Dubai","مدينة إكسبو دبي",24.9618,55.1498,"metro","Red Line"],
  ["Ibn Battuta","ابن بطوطة",25.0443,55.1204,"metro","Red Line"],
  ["Dubai Internet City","مدينة دبي للإنترنت",25.1017,55.1734,"metro","Red Line"],
  ["Al Qusais","القصيص",25.2797,55.3838,"metro","Green Line"],
  ["Mall of the Emirates","مول الإمارات",25.1181,55.2006,"metro","Red Line"],
  ["Dubai Frame","برواز دبي",25.2355,55.3004,"bus","F09"],
  ["Museum of the Future","متحف المستقبل",25.2197,55.2817,"metro","Red Line"],
  ["World Trade Centre","المركز التجاري العالمي",25.2292,55.2886,"metro","Red Line"],
  ["Financial Centre","المركز المالي",25.2115,55.2751,"metro","Red Line"],
  ["Emirates Towers","أبراج الإمارات",25.2174,55.2798,"metro","Red Line"],
  ["BurJuman","برجمان",25.2531,55.3041,"metro","Red / Green Line"],
  ["ADCB","بنك أبوظبي التجاري",25.2446,55.2982,"metro","Red Line"],
  ["Al Rigga","الرقة",25.2613,55.3236,"metro","Red Line"],
  ["Gold Souq","سوق الذهب",25.2721,55.3005,"metro","Green Line"],
  ["Baniyas Square","بني ياس",25.2695,55.3087,"metro","Green Line"],
  ["Al Fahidi / Sharaf DG","الفهيدي / شرف دي جي",25.2585,55.2970,"metro","Green Line"],
  ["Oud Metha","عود ميثاء",25.2449,55.3151,"metro","Green Line"],
  ["Dubai Healthcare City","مدينة دبي الطبية",25.2300,55.3237,"metro","Green Line"],
  ["Creek","الخور",25.2209,55.3384,"water_taxi","Creek Water Taxi"],
  ["Al Jaddaf","الجداف",25.2250,55.3333,"metro","Green Line"],
  ["Dubai Festival City","دبي فستيفال سيتي",25.2214,55.3522,"water_taxi","Creek Water Taxi"],
  ["Palm Jumeirah","نخلة جميرا",25.1146,55.1390,"tram","Dubai Tram"],
  ["JBR The Walk","ممشى جي بي آر",25.0783,55.1334,"tram","Dubai Tram"],
  ["Dubai Knowledge Park","مجمع دبي للمعرفة",25.1037,55.1649,"tram","Dubai Tram"],
  ["Al Sufouh","الصفوح",25.1138,55.1740,"tram","Dubai Tram"],
  ["Jumeirah Beach","شاطئ جميرا",25.1933,55.2307,"bike","Jumeirah Cycle Track"],
  ["Kite Beach","كايت بيتش",25.1646,55.2095,"bike","Jumeirah Cycle Track"],
  ["City Walk","سيتي ووك",25.2080,55.2638,"bus","C14"],
  ["Dubai Design District","حي دبي للتصميم",25.1870,55.3002,"bus","D03"],
  ["Dubai Silicon Oasis","واحة دبي للسيليكون",25.1212,55.3835,"bus","365"],
  ["International City","المدينة العالمية",25.1671,55.4080,"bus","53"],
  ["Centrepoint","سنتر بوينت",25.2304,55.3911,"metro","Red Line"],
  ["Etisalat by e&","اتصالات",25.2735,55.4004,"metro","Green Line"],
] as const;
export const places = locations.map((p, i) => ({
  id: i + 1, name: p[0], nameAr: p[1], lat: p[2], lng: p[3], type: p[4], line: p[5],
}));
export const transitLines = [
  { id: 1, name: "Red Line", mode: "metro", color: "#C8102E", ids: [10,11,6,2,12,14,3,1,18,19,16,17,21,20,9,22,7,4,5,41] },
  { id: 2, name: "Green Line", mode: "metro", color: "#00732F", ids: [8,25,20,26,27,29,28,9,24,23,13,42] },
  { id: 3, name: "Dubai Tram", mode: "tram", color: "#7656a2", ids: [32,2,31,33,34] },
  { id: 4, name: "Bus C14", mode: "bus", color: "#267ca5", ids: [8,25,17,16,37,1,3,38] },
  { id: 5, name: "Creek Water Taxi", mode: "water_taxi", color: "#0891b2", ids: [8,23,28,30] },
  { id: 6, name: "Jumeirah Cycle Track", mode: "bike", color: "#b8964b", ids: [35,36,34,31,32] },
].map(l => ({ ...l, coordinates: l.ids.map(id => { const p = places[id - 1]!; return [p.lat,p.lng]; }) }));
export function km(a: {lat:number;lng:number}, b: {lat:number;lng:number}) {
  const rad = Math.PI / 180;
  const dlat = (b.lat-a.lat)*rad, dlng = (b.lng-a.lng)*rad;
  const h = Math.sin(dlat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

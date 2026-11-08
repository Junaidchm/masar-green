import { all, one, run, sql } from "./store";
import { carbonConfig, round, dayGST } from "./carbon";

export function publicUser(id:number) {
  const u=one(`SELECT u.*, c.number, c.balance FROM users u LEFT JOIN cards c ON c.user_id=u.id WHERE u.id=?`,id)!;
  return {id:u.id,name:u.name,role:u.role,cardNumber:u.number??"",cardBalance:u.balance??0,language:u.language,locationConsent:!!u.location_consent,trackingConsent:!!u.tracking_consent,notifications:!!u.notifications,darkMode:!!u.dark_mode,onboarded:!!u.onboarded};
}
export function tripList(userId:number) {
  return all("SELECT * FROM trips WHERE user_id=? ORDER BY started_at DESC",userId).map(trip);
}
export function trip(row:Record<string,any>) {
  return {id:row.id,from:row.origin,to:row.destination,mode:row.mode,status:row.status,startedAt:row.started_at,endedAt:row.ended_at,distance:row.distance,minutes:row.minutes,co2:row.co2,saved:row.saved,credits:row.credits,verificationScore:row.verification_score,reason:row.reason,price:row.price,legs:all("SELECT data FROM trip_legs WHERE trip_id=? ORDER BY position",row.id).map(l=>JSON.parse(l.data))};
}
export function expireCredits(userId:number) {
  sql.transaction(()=>{
    const now=new Date().toISOString();
    for(const entry of all("SELECT * FROM green_ledger WHERE user_id=? AND remaining>0 AND expires_at<=?",userId,now)){
      run("INSERT INTO green_ledger (user_id,type,credits,description,created_at) VALUES (?,'expired',?,?,?)",userId,-entry.remaining,"Unused credits expired after 12 months",now);
      run("UPDATE green_ledger SET remaining=0 WHERE id=?",entry.id);
    }
  })();
}
export function wallet(userId:number) {
  expireCredits(userId);
  const entries=all("SELECT * FROM green_ledger WHERE user_id=? ORDER BY created_at DESC,id DESC",userId);
  const credits=entries.reduce((s,e)=>s+e.credits,0);
  const soon=new Date(Date.now()+30*86400000).toISOString();
  return {
    credits,aed:round(credits/carbonConfig.creditsPerAed),
    totalEarned:entries.filter(e=>e.credits>0).reduce((s,e)=>s+e.credits,0),
    expiringCredits:entries.filter(e=>e.remaining>0&&e.expires_at<=soon).reduce((s,e)=>s+e.remaining,0),
    history:entries.map(e=>({id:e.id,type:e.type,credits:e.credits,description:e.description,createdAt:e.created_at,expiresAt:e.expires_at})),
    partners:all("SELECT * FROM partners").map(p=>({id:p.id,name:p.name,category:p.category,description:p.description,minimumAed:p.minimum_aed})),
    redemptions:all("SELECT * FROM redemptions WHERE user_id=? ORDER BY id DESC",userId).map(r=>({id:r.id,kind:r.kind,amount:r.amount,credits:r.credits,code:r.code,expiresAt:r.expires_at,partner:r.partner,status:r.expires_at<new Date().toISOString()?"expired":r.status})),
  };
}
export function streak(userId:number) {
  const days=new Set(all("SELECT DISTINCT gst_day FROM trips WHERE user_id=? AND status='verified'",userId).map(r=>r.gst_day));
  let count=0;
  const today=Date.now();
  const offset=days.has(dayGST())?0:1;
  for(let i=offset;i<366;i++){
    if(!days.has(dayGST(new Date(today-i*86400000))))break;
    count++;
  }
  return count;
}
export function dashboard(userId:number) {
  const trips=tripList(userId), verified=trips.filter(t=>t.status==="verified");
  const month=dayGST().slice(0,7);
  const monthSaved=round(verified.filter(t=>dayGST(new Date(t.startedAt)).startsWith(month)).reduce((s,t)=>s+t.saved,0));
  const totalSaved=round(verified.reduce((s,t)=>s+t.saved,0));
  const w=wallet(userId);
  return {
    user:publicUser(userId),monthSaved,totalSaved,trees:round(monthSaved/21.77),streak:streak(userId),
    rank:1+(one("SELECT COUNT(*) AS n FROM (SELECT user_id,SUM(saved) AS s FROM trips WHERE status='verified' GROUP BY user_id HAVING s>?)",totalSaved)?.n??0),
    tripCount:verified.length,credits:w.credits,aed:w.aed,
    weekly:Array.from({length:7},(_,i)=>{
      const date=new Date(Date.now()-(6-i)*86400000),day=dayGST(date);
      return {name:new Intl.DateTimeFormat("en",{weekday:"short",timeZone:"Asia/Dubai"}).format(date),value:round(verified.filter(t=>dayGST(new Date(t.startedAt))===day).reduce((s,t)=>s+t.saved,0))};
    }),
    recentTrips:trips.slice(0,4),activeTrip:trips.find(t=>t.status==="active")??null,
  };
}
export function weekStart() {
  const day=new Date(`${dayGST()}T00:00:00Z`);const weekday=day.getUTCDay();
  day.setUTCDate(day.getUTCDate()-((weekday+6)%7));return day.toISOString().slice(0,10);
}
export function challenges(userId:number) {
  const start=weekStart(),end=new Date(`${start}T00:00:00Z`);end.setUTCDate(end.getUTCDate()+7);
  const trips=all("SELECT * FROM trips WHERE user_id=? AND status='verified' AND gst_day>=?",userId,start);
  return all("SELECT * FROM challenges").map(c=>{
    const progress=c.mode==="carbon"?Math.floor(trips.reduce((s,t)=>s+t.saved,0)):trips.filter(t=>c.mode==="friday"?new Date(`${t.gst_day}T00:00:00Z`).getUTCDay()===5&&t.mode!=="taxi":t.mode===c.mode).length;
    return {id:c.id,title:c.title,titleAr:c.title_ar,description:c.description,target:c.target,progress:Math.min(c.target,progress),bonus:c.bonus,mode:c.mode,endsAt:new Date(end.getTime()-4*3600000).toISOString(),claimed:!!one("SELECT claimed FROM user_challenges WHERE user_id=? AND challenge_id=? AND week=?",userId,c.id,start)?.claimed};
  });
}
export function community(userId:number) {
  const verified=tripList(userId).filter(t=>t.status==="verified");
  const total=verified.reduce((s,t)=>s+t.saved,0);
  const leaders=all(`SELECT u.id,u.name,SUM(t.saved) saved FROM trips t JOIN users u ON u.id=t.user_id
    WHERE t.status='verified' GROUP BY u.id ORDER BY saved DESC LIMIT 10`);
  const make=(rows:{name:string;saved:number;id?:number}[])=>rows.map((r,i)=>({name:r.name,saved:round(r.saved),rank:i+1,isYou:r.id===userId}));
  return {
    individual:make(leaders.map(r=>({id:r.id,name:r.id>=6?`Green commuter ${r.id-5}`:r.name,saved:r.saved}))),
    workplace:make([{name:"Emirates Future Labs",saved:8240},{name:"Creek Creative",saved:6814},{name:"Marina Tech",saved:5430}]),
    neighbourhood:make([{name:"Dubai Marina",saved:12840},{name:"JLT",saved:11220},{name:"Business Bay",saved:9810},{name:"Al Qusais",saved:8120}]),
    badges:all("SELECT * FROM badges").map(b=>({name:b.name,description:b.description,earned:b.id===1?verified.length>0:b.id===2?streak(userId)>=7:b.id===3?total>=100:!!one("SELECT id FROM redemptions WHERE user_id=? AND kind='donation'",userId)})),
  };
}

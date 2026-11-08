import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { places, transitLines } from "./locations";
import { plan } from "./planner";
import { dayGST } from "./carbon";

// A single local SQLite file, deliberately requested for this concept prototype.
// Keep it outside dist (which is rebuilt), and never commit demo/user data.
const dataDir = path.resolve(process.cwd(), process.cwd().endsWith("/artifacts/api-server") ? "../../data" : "data");
mkdirSync(dataDir, { recursive:true });
export const sql = new Database(path.join(dataDir, "masar-green.sqlite"));
sql.pragma("journal_mode = WAL");
sql.pragma("foreign_keys = ON");
// SQL rows are internal only; all API output is checked against generated schemas.
export type Row = Record<string, any>;
export const all = (query:string,...params:any[]):Row[] => sql.prepare(query).all(...params) as Row[];
export const one = (query:string,...params:any[]):Row|undefined => sql.prepare(query).get(...params) as Row|undefined;
export const run = (query:string,...params:any[]) => sql.prepare(query).run(...params);

sql.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'commuter',
 language TEXT NOT NULL DEFAULT 'en', location_consent INTEGER NOT NULL DEFAULT 0,
 tracking_consent INTEGER NOT NULL DEFAULT 0, notifications INTEGER NOT NULL DEFAULT 1,
 dark_mode INTEGER NOT NULL DEFAULT 0, onboarded INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cards (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
 number TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, balance REAL NOT NULL DEFAULT 25
);
CREATE TABLE IF NOT EXISTS trips (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
 from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, origin TEXT NOT NULL, destination TEXT NOT NULL,
 mode TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT,
 distance REAL NOT NULL, minutes REAL NOT NULL, co2 REAL NOT NULL, saved REAL NOT NULL,
 credits INTEGER NOT NULL DEFAULT 0, verification_score INTEGER NOT NULL DEFAULT 0,
 reason TEXT, price REAL NOT NULL, route_id TEXT NOT NULL, gst_day TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS trip_legs (
 id INTEGER PRIMARY KEY, trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
 position INTEGER NOT NULL, data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS green_ledger (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), trip_id INTEGER,
 type TEXT NOT NULL, credits INTEGER NOT NULL, description TEXT NOT NULL,
 created_at TEXT NOT NULL, expires_at TEXT, remaining INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS partners (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
 description TEXT NOT NULL, minimum_aed REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS redemptions (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
 kind TEXT NOT NULL, amount REAL NOT NULL, credits INTEGER NOT NULL,
 code TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, partner TEXT NOT NULL, status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS challenges (
 id INTEGER PRIMARY KEY, title TEXT NOT NULL, title_ar TEXT NOT NULL,
 description TEXT NOT NULL, target INTEGER NOT NULL, bonus INTEGER NOT NULL, mode TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_challenges (
 user_id INTEGER NOT NULL REFERENCES users(id), challenge_id INTEGER NOT NULL REFERENCES challenges(id),
 week TEXT NOT NULL, claimed INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(user_id,challenge_id,week)
);
CREATE TABLE IF NOT EXISTS badges (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS employers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, headcount INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS employer_members (
 user_id INTEGER PRIMARY KEY REFERENCES users(id), employer_id INTEGER NOT NULL REFERENCES employers(id),
 team TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stations (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS vehicles_live (
 id INTEGER PRIMARY KEY, route_id INTEGER NOT NULL REFERENCES routes(id), offset REAL NOT NULL, data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
 key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_ms INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crowd_samples (
 gst_day TEXT NOT NULL, line TEXT NOT NULL, hour INTEGER NOT NULL, occupancy INTEGER NOT NULL,
 PRIMARY KEY(gst_day,line,hour)
);
CREATE INDEX IF NOT EXISTS trips_user_day ON trips(user_id,gst_day);
CREATE INDEX IF NOT EXISTS ledger_user ON green_ledger(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS trip_earned_once ON green_ledger(trip_id) WHERE trip_id IS NOT NULL AND type='earned';
CREATE UNIQUE INDEX IF NOT EXISTS one_active_trip ON trips(user_id) WHERE status='active';
`);

export function insertTrip(userId:number, option:ReturnType<typeof plan>[number], startedAt:string, status="active", score=0) {
  const from=places.find(p=>p.id===option.fromId)!, to=places.find(p=>p.id===option.toId)!;
  const credits=status==="verified"?option.credits:0;
  const endedAt=status==="active"?null:new Date(new Date(startedAt).getTime()+option.minutes*60000).toISOString();
  const result=run(`INSERT INTO trips (user_id,from_id,to_id,origin,destination,mode,status,started_at,ended_at,distance,minutes,co2,saved,credits,verification_score,price,route_id,gst_day)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,userId,option.fromId,option.toId,from.name,to.name,option.legs.find(l=>l.mode!=="walking")?.mode??"walking",status,startedAt,endedAt,option.distance,option.minutes,option.co2,option.saved,credits,score,option.price,option.id,dayGST(new Date(startedAt)));
  const id=Number(result.lastInsertRowid);
  option.legs.forEach((leg,i)=>run("INSERT INTO trip_legs (trip_id,position,data) VALUES (?,?,?)",id,i,JSON.stringify(leg)));
  if(credits>0) earn(userId,credits,`${from.name} → ${to.name}`,id,endedAt!);
  return id;
}
export function earn(userId:number,credits:number,description:string,tripId:number|null=null,at=new Date().toISOString()) {
  const expiry=new Date(at); expiry.setUTCFullYear(expiry.getUTCFullYear()+1);
  run("INSERT INTO green_ledger (user_id,trip_id,type,credits,description,created_at,expires_at,remaining) VALUES (?,?,?,?,?,?,?,?)",userId,tripId,"earned",credits,description,at,expiry.toISOString(),credits);
}

if (!one("SELECT id FROM users LIMIT 1")) {
  sql.transaction(()=>{
    const accounts=[
      {id:1,name:"Amina Hassan",role:"commuter",card:"12345678",pin:"1111",balance:42.5,onboarded:1},
      {id:2,name:"New commuter",role:"commuter",card:"87654321",pin:"2222",balance:25,onboarded:0},
      {id:3,name:"Omar Al Mansoori",role:"commuter",card:"11223344",pin:"3333",balance:185,onboarded:1},
      {id:4,name:"Noor · Employer admin",role:"employer",card:"55667788",pin:"4444",balance:50,onboarded:1},
      {id:5,name:"Dubai · City analyst",role:"city",card:"99887766",pin:"5555",balance:50,onboarded:1},
    ];
    for(const a of accounts){
      run("INSERT INTO users (id,name,role,onboarded,location_consent,tracking_consent) VALUES (?,?,?,?,?,?)",a.id,a.name,a.role,a.onboarded,a.onboarded,a.onboarded);
      run("INSERT INTO cards (user_id,number,pin_hash,balance) VALUES (?,?,?,?)",a.id,a.card,bcrypt.hashSync(a.pin,10),a.balance);
    }
    run("INSERT INTO employers VALUES (1,'Emirates Future Labs',24)");
    for(let i=0;i<18;i++){
      const id=i+6,team=["Product & Design","Engineering","Operations"][Math.floor(i/6)]!;
      run("INSERT INTO users (id,name,onboarded,tracking_consent,location_consent) VALUES (?,?,1,1,1)",id,`Demo colleague ${i+1}`);
      run("INSERT INTO employer_members VALUES (?,1,?)",id,team);
    }
    run("INSERT INTO employer_members VALUES (1,1,'Product & Design')");
    run("INSERT INTO employer_members VALUES (3,1,'Engineering')");
    const now=new Date();
    // 60 days of deterministic history. The intentionally empty new account has none.
    for(const userId of [1,3,...Array.from({length:18},(_,i)=>i+6)]){
      for(let day=59;day>=0;day--){
        const date=new Date(now.getTime()-day*86400000);
        if(date.getUTCDay()===0 && userId!==3 && day!==0) continue;
        for(let journey=0;journey<(userId===3?3:2);journey++){
          date.setUTCHours(journey===0?4:journey===1?14:17,10+(userId%15),0,0);
          if(date.getTime()>now.getTime()) continue;
          const origin=journey%2===0?2:1,destination=journey%2===0?1:2;
          const variants=plan(origin,destination);
          const option=variants.find(v=>v.id===(day%7===0?"bus":day%11===0?"tram":"metro"))!;
          const pending=(day+userId)%29===0;
          insertTrip(userId,option,date.toISOString(),pending?"pending review":"verified",pending?62:94+(day%5));
        }
      }
    }
    // Earlier historical earnings give the heavy user a genuinely useful demo wallet.
    earn(3,6500,"Verified carbon savings · earlier commutes",null,new Date(now.getTime()-100*86400000).toISOString());
    earn(1,180,"Verified carbon savings · earlier commutes",null,new Date(now.getTime()-350*86400000).toISOString());
    for(const p of [
      ["Green Basket","supermarket","Fresh groceries, lighter footprint. Simulated partner.",5],
      ["Daily Grind","coffee","A better commute deserves a good coffee. Simulated partner.",5],
      ["Loop Mobility","bike","Bike and e-scooter minutes. Simulated partner.",5],
      ["Yalla Ride","ride","Shared-ride credit for the last mile. Simulated partner.",10],
      ["Wellcare Pharmacy","pharmacy","Everyday wellbeing essentials. Simulated partner.",5],
    ]) run("INSERT INTO partners (name,category,description,minimum_aed) VALUES (?,?,?,?)",...p);
    for(const c of [
      ["Metro momentum","رحلات المترو","Complete 5 verified metro trips this week.",5,100,"metro"],
      ["Car-free Friday","جمعة بلا سيارات","Complete a verified public transport trip on Friday.",1,150,"friday"],
      ["A greener week","أسبوع أخضر","Save 10 kg CO₂ on verified journeys this week.",10,200,"carbon"],
      ["Try two wheels","جرّب الدراجات","Complete 2 verified bike or e-scooter journeys.",2,80,"bike"],
    ]) run("INSERT INTO challenges (title,title_ar,description,target,bonus,mode) VALUES (?,?,?,?,?,?)",...c);
    for(const b of [
      ["First Trip","Complete your first verified journey."],
      ["7-day Streak","Travel sustainably for seven consecutive days."],
      ["100 kg Saver","Save 100 kg of CO₂."],
      ["Tree Planter","Donate Green Credits to a planting project."],
    ])run("INSERT INTO badges (name,description) VALUES (?,?)",...b);
    places.forEach(p=>run("INSERT INTO stations VALUES (?,?)",p.id,JSON.stringify(p)));
    transitLines.forEach(line=>{
      run("INSERT INTO routes VALUES (?,?)",line.id,JSON.stringify(line));
      for(let i=0;i<4;i++)run("INSERT INTO vehicles_live (route_id,offset,data) VALUES (?,?,?)",line.id,i/4,"{}");
    });
  })();
}

// Seed a small, traceable set of historical wallet states once, without
// re-inserting records after a user deletes their personal history.
if(!one("SELECT key FROM app_meta WHERE key='wallet_examples'")){
  sql.transaction(()=>{
    const createdAt=new Date(Date.now()-20*86400000).toISOString();
    const expiresAt=new Date(Date.now()+70*86400000).toISOString();
    const cost=500;
    let left=cost;
    for(const entry of all("SELECT id,remaining FROM green_ledger WHERE user_id=1 AND remaining>0 ORDER BY expires_at,id")){
      const amount=Math.min(left,entry.remaining);
      run("UPDATE green_ledger SET remaining=remaining-? WHERE id=?",amount,entry.id);
      left-=amount;if(!left)break;
    }
    if(left===0){
      run("INSERT INTO green_ledger (user_id,type,credits,description,created_at) VALUES (1,'redeemed',-500,'Daily Grind · simulated AED 5.00',?)",createdAt);
      run("INSERT INTO redemptions (user_id,kind,amount,credits,code,expires_at,partner,status) VALUES (1,'voucher',5,500,'MG-DEMO-COFFEE',?,'Daily Grind','active')",expiresAt);
    }
    earn(1,80,"Historical verified savings · expired example",null,new Date(Date.now()-400*86400000).toISOString());
    const oldWeek=new Date(Date.now()-14*86400000).toISOString().slice(0,10);
    run("INSERT INTO user_challenges VALUES (1,1,?,1)",oldWeek);
    run("INSERT INTO app_meta VALUES ('wallet_examples','seeded')");
  })();
}
// Anonymised, simulated vehicle occupancy observations, not passenger locations.
sql.transaction(()=>{
  for(let day=0;day<60;day++){
    const gst=dayGST(new Date(Date.now()-day*86400000));
    for(const [i,line] of ["Red Line","Green Line","Dubai Tram","Bus C14","Creek Water Taxi"].entries()){
      for(const hour of [8,9,17,18])run("INSERT OR IGNORE INTO crowd_samples VALUES (?,?,?,?)",gst,line,hour,Math.min(98,42+i*5+(hour===8||hour===18?22:5)+(day%13)));
    }
  }
})();

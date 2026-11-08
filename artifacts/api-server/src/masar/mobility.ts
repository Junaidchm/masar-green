import { Router } from "express";
import { createHash } from "node:crypto";
import {
  GetDashboardResponse, GetLocationsResponse, PlanTripBody, PlanTripResponse,
  GetTripsResponse, StartTripBody, StartTripResponse, EndTripParams, EndTripBody, EndTripResponse,
  GetLiveMapResponse, GetCarbonConfigResponse,
} from "@workspace/api-zod";
import { authRequired, readUser } from "./auth";
import { all, one, run, sql, insertTrip, earn } from "./store";
import { places, transitLines } from "./locations";
import { plan } from "./planner";
import { dashboard, tripList, trip, publicUser } from "./data";
import { carbonConfig, dayGST, round } from "./carbon";

export const mobilityRouter=Router();
sql.exec("CREATE TABLE IF NOT EXISTS trip_checks (user_id INTEGER NOT NULL, fingerprint TEXT NOT NULL, completed_at INTEGER NOT NULL)");
mobilityRouter.get("/dashboard",(req,res)=>res.json(GetDashboardResponse.parse(dashboard(readUser(req)))));
mobilityRouter.get("/locations",(_req,res)=>res.json(GetLocationsResponse.parse(places)));
mobilityRouter.post("/plan",(req,res)=>{
  const input=PlanTripBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Choose your departure and destination."});return;}
  res.json(PlanTripResponse.parse(plan(input.data.fromId,input.data.toId,input.data.accessible,input.data.sort)));
});
mobilityRouter.get("/trips",(req,res)=>res.json(GetTripsResponse.parse(tripList(readUser(req)))));
mobilityRouter.post("/trips/start",authRequired,(req,res)=>{
  const input=StartTripBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Select a valid route before starting."});return;}
  const userId=res.locals.userId;
  if(!publicUser(userId).trackingConsent){res.status(403).json({error:"Enable trip-tracking consent in Profile before starting a simulated tracked trip."});return;}
  const option=plan(input.data.fromId,input.data.toId).find(p=>p.id===input.data.routeId);
  if(!option){res.status(400).json({error:"This route is unavailable. Please plan again."});return;}
  if(one("SELECT id FROM trips WHERE user_id=? AND status='active'",userId)){res.status(409).json({error:"End your active trip before starting another."});return;}
  const id=sql.transaction(()=>insertTrip(userId,option,new Date().toISOString()))();
  res.json(StartTripResponse.parse(trip(one("SELECT * FROM trips WHERE id=?",id)!)));
});
mobilityRouter.post("/trips/:id/end",authRequired,(req,res)=>{
  const params=EndTripParams.safeParse(req.params),input=EndTripBody.safeParse(req.body);
  if(!params.success||!input.success){res.status(400).json({error:"Invalid trip completion request."});return;}
  const userId=res.locals.userId;
  const row=one("SELECT * FROM trips WHERE id=? AND user_id=?",params.data.id,userId);
  if(!row){res.status(404).json({error:"Trip not found."});return;}
  if(row.status!=="active"){res.status(409).json({error:"This trip has already ended."});return;}
  const body=input.data, now=new Date().toISOString(), reasons:string[]=[];
  let score=40; // A mock tap-in exists because the server recorded the trip start.
  if(body.tapOut)score+=40;else reasons.push("Missing simulated tap-out.");
  const elapsed=Math.max(.01,(Date.now()-new Date(row.started_at).getTime())/60000);
  const speed=row.distance/(elapsed/60);
  // Accelerated demo is explicit, never represented as real GPS/NOL verification.
  const gpsMatch=body.gpsDistance!==undefined && body.gpsDistance>=row.distance*.6 && body.gpsDistance<=row.distance*1.6;
  if(body.simulate || (speed<160 && gpsMatch))score+=15;
  else reasons.push(speed>=160?"Impossible travel speed.":"GPS route plausibility unavailable.");
  if(!body.simulate && speed>=160)score=Math.min(score,60);
  if(body.gpsDistance!==undefined&&!gpsMatch){score=Math.min(score,60);reasons.push("GPS distance does not match the planned route.");}
  const fingerprint=createHash("sha256").update(`${userId}:${row.from_id}:${row.to_id}:${row.route_id}:${dayGST()}`).digest("hex");
  if(one("SELECT user_id FROM trip_checks WHERE user_id=? AND fingerprint=? AND completed_at>?",userId,fingerprint,Date.now()-2*3600000)){score=0;reasons.push("Duplicate route within two hours.");}
  const verified=score>=carbonConfig.verificationThreshold;
  const creditsEarnedToday=one("SELECT COALESCE(SUM(credits),0) n FROM green_ledger WHERE user_id=? AND type='earned' AND trip_id IS NOT NULL AND date(created_at,'+4 hours')=?",userId,dayGST())!.n;
  const credits=verified?Math.max(0,Math.min(Math.floor(row.saved*carbonConfig.creditsPerKg),carbonConfig.dailyCap-creditsEarnedToday)):0;
  if(verified&&credits<Math.floor(row.saved*carbonConfig.creditsPerKg))reasons.push("Daily 500-credit earning cap applied.");
  if(body.simulate)reasons.push("Accelerated concept simulation; not real NOL or GPS verification.");
  sql.transaction(()=>{
    run("UPDATE trips SET status=?,ended_at=?,credits=?,verification_score=?,reason=? WHERE id=? AND status='active'",verified?"verified":"pending review",now,credits,score,reasons.join(" ")||null,row.id);
    run("INSERT INTO trip_checks VALUES (?,?,?)",userId,fingerprint,Date.now());
    if(credits>0)earn(userId,credits,`${row.origin} → ${row.destination}`,row.id,now);
  })();
  res.json(EndTripResponse.parse(trip(one("SELECT * FROM trips WHERE id=?",row.id)!)));
});
mobilityRouter.delete("/trips",authRequired,(_req,res)=>{
  sql.transaction(()=>{
    // Financial audit entries and non-reversible abuse fingerprints are retained;
    // only journey records / precise route history are removed.
    run("UPDATE green_ledger SET description='Journey reward · trip history deleted' WHERE user_id=? AND trip_id IS NOT NULL",res.locals.userId);
    run("DELETE FROM trips WHERE user_id=?",res.locals.userId);
  })();
  res.json({message:"Trip history deleted. Wallet accounting records remain, without journey details."});
});
function updateVehicles(){
  const tick=Math.floor(Date.now()/5000);
  sql.transaction(()=>{
    for(const vehicle of all("SELECT * FROM vehicles_live")){
      const line=transitLines.find(l=>l.id===vehicle.route_id)!;
      const progress=((tick%240)/240+vehicle.offset)%1;
      const index=progress*(line.coordinates.length-1),i=Math.floor(index),f=index-i;
      const a=line.coordinates[i]!,b=line.coordinates[Math.min(i+1,line.coordinates.length-1)]!;
      const place=places.find(p=>Math.abs(p.lat-b[0]!)<.0001&&Math.abs(p.lng-b[1]!)<.0001);
      const data={id:vehicle.id,mode:line.mode,line:line.name,lat:a[0]!+(b[0]!-a[0]!)*f,lng:a[1]!+(b[1]!-a[1]!)*f,crowd:["Low","Medium","High"][(vehicle.id+Math.floor(tick/12))%3],eta:Math.max(1,Math.round((1-f)*5)),nextStop:place?.name??line.name};
      run("UPDATE vehicles_live SET data=? WHERE id=?",JSON.stringify(data),vehicle.id);
    }
  })();
}
updateVehicles();
setInterval(updateVehicles,5000).unref();
mobilityRouter.get("/map",(_req,res)=>{
  res.json(GetLiveMapResponse.parse({updatedAt:new Date(Math.floor(Date.now()/5000)*5000).toISOString(),vehicles:all("SELECT data FROM vehicles_live").map(v=>JSON.parse(v.data)),stations:places,lines:transitLines}));
});
mobilityRouter.get("/carbon",(_req,res)=>{
  res.json(GetCarbonConfigResponse.parse({...carbonConfig,factors:Object.entries(carbonConfig.factors).map(([mode,factor])=>({mode,factor})),explanation:"Baseline = distance × 0.17 kg CO₂/km for a solo petrol car. Actual = sum of each leg's distance × its mode factor. Saved = max(0, baseline − actual). Credits = floor(saved × 10), capped at 500 credits per GST day; 100 credits = AED 1 in simulated rewards. Only trips scoring at least 75/100 earn rewards. Trees equivalent uses 21.77 kg CO₂ per tree per year as an illustrative comparison, not an offset or planting claim. All factors are illustrative, not audited local measurements."}));
});

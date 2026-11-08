import { Router } from "express";
import { GetReportQueryParams, GetReportResponse } from "@workspace/api-zod";
import { authRequired } from "./auth";
import { all, one } from "./store";
import { publicUser } from "./data";
import { dayGST, round } from "./carbon";
import { places } from "./locations";

export const reportsRouter=Router();
reportsRouter.get("/reports",authRequired,(req,res)=>{
  const input=GetReportQueryParams.safeParse(req.query);
  if(!input.success){res.status(400).json({error:"Choose an employer or city report."});return;}
  const {kind}=input.data;
  const user=publicUser(res.locals.userId);
  if(user.role!==kind){res.status(403).json({error:"This report requires the matching employer admin or city analyst demo account."});return;}
  const from=input.data.from??dayGST(new Date(Date.now()-29*86400000)),to=input.data.to??dayGST();
  const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!validDate(from)||!validDate(to)||from>to){res.status(400).json({error:"Choose a valid date range, with start before end."});return;}
  const employerId=1; // This concept has one company, scoped to the seeded employer role.
  const scoped=kind==="employer"?" AND t.user_id IN (SELECT user_id FROM employer_members WHERE employer_id=?)":"";
  const params=kind==="employer"?[from,to,employerId]:[from,to];
  const totals=one(`SELECT COALESCE(SUM(t.saved),0) saved,COUNT(*) trips,COUNT(DISTINCT t.user_id) participants
    FROM trips t WHERE status='verified' AND gst_day BETWEEN ? AND ?${scoped}`,...params)!;
  const headcount=one("SELECT headcount FROM employers WHERE id=?",employerId)!.headcount;
  const groups=kind==="employer"?all(`SELECT m.team name,SUM(t.saved) value FROM trips t JOIN employer_members m ON m.user_id=t.user_id
    WHERE t.status='verified' AND t.gst_day BETWEEN ? AND ? AND m.employer_id=?
    GROUP BY m.team HAVING COUNT(DISTINCT t.user_id)>=5 ORDER BY value DESC`,from,to,employerId)
    :all(`SELECT mode name,SUM(saved) value FROM trips WHERE status='verified' AND gst_day BETWEEN ? AND ?
      GROUP BY mode HAVING COUNT(DISTINCT user_id)>=5 ORDER BY value DESC`,from,to);
  const heatmap=kind==="city"?all(`SELECT place_id,COUNT(*) count FROM
    (SELECT from_id place_id,user_id FROM trips WHERE status='verified' AND gst_day BETWEEN ? AND ?
     UNION ALL SELECT to_id place_id,user_id FROM trips WHERE status='verified' AND gst_day BETWEEN ? AND ?)
    GROUP BY place_id HAVING COUNT(DISTINCT user_id)>=5`,from,to,from,to).flatMap(r=>{
      const p=places.find(p=>p.id===r.place_id);return p?[{lat:round(p.lat,2),lng:round(p.lng,2),count:r.count,name:`${p.name} · origins & destinations`}]:[];
    }):[];
  const crowding=all(`SELECT line,hour,AVG(occupancy) occupancy FROM crowd_samples
    WHERE gst_day BETWEEN ? AND ? GROUP BY line,hour ORDER BY occupancy DESC LIMIT 8`,from,to)
    .map(r=>({name:`${r.line} · ${String(r.hour).padStart(2,"0")}:00 GST`,value:round(r.occupancy)}));
  const spanDays=Math.round((new Date(to).getTime()-new Date(from).getTime())/86400000)+1;
  const previousTo=dayGST(new Date(new Date(`${from}T00:00:00Z`).getTime()-86400000));
  const previousFrom=dayGST(new Date(new Date(`${from}T00:00:00Z`).getTime()-spanDays*86400000));
  const previousParams=kind==="employer"?[previousFrom,previousTo,employerId]:[previousFrom,previousTo];
  const previous=one(`SELECT COUNT(*) trips FROM trips t WHERE status='verified' AND gst_day BETWEEN ? AND ?${scoped}`,...previousParams)!.trips;
  // Cells smaller than five people are suppressed, including whole-report totals.
  const suppress=totals.participants<5;
  res.json(GetReportResponse.parse({
    kind,title:kind==="employer"?"Emirates Future Labs · commute impact":"Dubai · mobility insights",
    from,to,totalSaved:suppress?0:round(totals.saved),trips:suppress?0:totals.trips,participants:suppress?0:totals.participants,
    participation:suppress?0:round(totals.participants/(kind==="employer"?headcount:20)*100),
    carsRemoved:suppress?0:Math.floor(totals.saved/(.17*25*spanDays)),
    ridershipChange:suppress?0:previous?round((totals.trips-previous)/previous*100):0,
    groups:groups.map(g=>({name:g.name,value:round(g.value)})),crowding,heatmap,
  }));
});

import { places, km } from "./locations";
import { carbonFor, round } from "./carbon";

export function plan(fromId: number, toId: number, accessible = false, sort = "Greenest") {
  const from = places.find(p => p.id === fromId), to = places.find(p => p.id === toId);
  if (!from || !to || from.id === to.id) throw Object.assign(new Error("Choose two different Dubai locations."), {status:400});
  const direct = Math.max(0.4, km(from,to));
  const variants = [
    {id:"metro", modes:["walking","metro","walking"], weights:[.025,.95,.025], line:from.line.includes("Green") && to.line.includes("Green")?"Green Line":"Red Line", price:direct>15?7.5:5, speed:38, tags:[], crowd:"Medium", access:true},
    {id:"bus", modes:["walking","bus","walking"], weights:[.04,.92,.04], line:"Bus C14 → F13", price:3, speed:24, tags:["Cheapest"], crowd:"Low", access:true},
    {id:"tram", modes:["walking","metro","tram","walking"], weights:[.02,.70,.26,.02], line:"Red Line → Dubai Tram", price:7.5, speed:32, tags:[], crowd:"Low", access:true},
    {id:"water", modes:["walking","bus","water_taxi","walking"], weights:[.03,.53,.41,.03], line:"Bus C14 → Creek Water Taxi", price:12, speed:23, tags:[], crowd:"Low", access:false},
    {id:"taxi", modes:["taxi"], weights:[1], line:"Private taxi · simulated", price:round(12+direct*2.2), speed:52, tags:["Fastest"], crowd:"Low", access:true},
    {id:"bike", modes:["walking","bike","walking"], weights:[.02,.96,.02], line:"Bike / e-scooter", price:round(2+direct*.45), speed:16, tags:["Greenest","Least Crowded"], crowd:"Low", access:false},
  ];
  const options = variants.filter(v => !accessible || v.access).map((v) => {
    const distance = round(direct * (v.id==="taxi"?1.18:1.3));
    let offset = 0;
    const legs = v.modes.map((mode,i) => {
      const weight = v.weights[i]!;
      const start=[from.lat+(to.lat-from.lat)*offset,from.lng+(to.lng-from.lng)*offset];
      offset+=weight;
      const end=[from.lat+(to.lat-from.lat)*offset,from.lng+(to.lng-from.lng)*offset];
      const legDistance=round(distance*weight);
      const minutes=Math.max(1,Math.round(legDistance/(mode==="walking"?4.8:mode==="tram"?22:mode==="water_taxi"?18:v.speed)*60));
      const line=mode==="walking"?"Walk":mode==="tram"?"Dubai Tram":mode==="water_taxi"?"Creek Water Taxi":v.line.split(" → ")[0]!;
      const origin = i===0?from.name:`${from.name.split(" / ")[0]} interchange`;
      const destination=i===v.modes.length-1?to.name:`${to.name.split(" / ")[0]} ${mode==="walking"?"station":"interchange"}`;
      return {mode,line,from:origin,to:destination,minutes,distance:legDistance,coordinates:[start,[(start[0]!+end[0]!)/2+.002,(start[1]!+end[1]!)/2-.001],end],instruction:mode==="walking"?`Walk ${minutes} min to ${destination}`:`Take ${line} toward ${destination}${accessible?" · step-free access":""}`};
    });
    const carbon = carbonFor(legs,distance);
    return {id:v.id,fromId,toId,title:v.line,price:v.price,minutes:legs.reduce((s,l)=>s+l.minutes,0)+(v.id==="taxi"?0:4),distance,...carbon,crowd:v.crowd,tags:v.tags,walkingMinutes:legs.filter(l=>l.mode==="walking").reduce((s,l)=>s+l.minutes,0),transfers:Math.max(0,legs.filter(l=>l.mode!=="walking").length-1),accessible:v.access,legs};
  });
  if(accessible){
    const greenest=[...options].sort((a,b)=>a.co2-b.co2)[0];
    if(greenest)greenest.tags.push("Greenest");
    const quiet=[...options].sort((a,b)=>Number(b.crowd==="Low")-Number(a.crowd==="Low")||a.minutes-b.minutes)[0];
    if(quiet)quiet.tags.push("Least Crowded");
  }
  if (sort==="Cheapest") options.sort((a,b)=>a.price-b.price);
  else if(sort==="Fastest") options.sort((a,b)=>a.minutes-b.minutes);
  else if(sort==="Least Crowded") options.sort((a,b)=> Number(b.crowd==="Low")-Number(a.crowd==="Low") || a.minutes-b.minutes);
  else options.sort((a,b)=>a.co2-b.co2);
  return options;
}

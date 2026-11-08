import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  GetWalletResponse, RedeemCreditsBody, RedeemCreditsResponse,
  GetChallengesResponse, ClaimChallengeParams, GetLeaderboardResponse,
  ExportMyDataResponse,
} from "@workspace/api-zod";
import { authRequired, readUser } from "./auth";
import { sql, all, one, run, earn } from "./store";
import { wallet, challenges, community, weekStart, publicUser, tripList } from "./data";
import { carbonConfig } from "./carbon";

export const rewardsRouter=Router();
rewardsRouter.get("/wallet",(req,res)=>res.json(GetWalletResponse.parse(wallet(readUser(req)))));
rewardsRouter.post("/wallet/redeem",authRequired,(req,res)=>{
  const input=RedeemCreditsBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Choose a redemption and enter a valid AED amount between 1 and 500."});return;}
  const {kind,amount,partnerId}=input.data,userId=res.locals.userId;
  if(Math.abs(Math.round(amount*100)-amount*100)>1e-8){res.status(400).json({error:"Amounts can have at most two decimal places."});return;}
  const credits=Math.round(amount*carbonConfig.creditsPerAed),code=`MG-${randomUUID().slice(0,8).toUpperCase()}`;
  const expiresAt=new Date(Date.now()+90*86400000).toISOString();
  if(kind==="bank"){
    if(amount<50){res.status(400).json({error:"Bank withdrawal minimum is AED 50.00."});return;}
    res.json(RedeemCreditsResponse.parse({id:0,kind,amount,credits:0,code:"COMING-SOON",expiresAt,partner:"Bank withdrawal · no funds moved",status:"coming soon"}));return;
  }
  const partner=partnerId?one("SELECT * FROM partners WHERE id=?",partnerId):null;
  if(kind==="voucher"&&!partner){res.status(400).json({error:"Select a partner for your voucher."});return;}
  const minimum=kind==="voucher"?partner!.minimum_aed:kind==="nol"?5:1;
  if(amount<minimum){res.status(400).json({error:`Minimum redemption is AED ${minimum.toFixed(2)}.`});return;}
  const partnerName=kind==="nol"?"NOL mock top-up":kind==="donation"?(partnerId===2?"Solar Community Project":"Ghaf Tree Planting"):partner!.name;
  const response=sql.transaction(()=>{
    const w=wallet(userId);
    if(credits>w.credits)throw Object.assign(new Error("Not enough Green Credits for this redemption."),{status:400});
    let left=credits;
    for(const entry of all("SELECT id,remaining FROM green_ledger WHERE user_id=? AND remaining>0 ORDER BY expires_at,id",userId)){
      const used=Math.min(left,entry.remaining);run("UPDATE green_ledger SET remaining=remaining-? WHERE id=?",used,entry.id);left-=used;if(left===0)break;
    }
    if(left!==0)throw new Error("Wallet accounting mismatch; please retry later.");
    run("INSERT INTO green_ledger (user_id,type,credits,description,created_at) VALUES (?,'redeemed',?,?,?)",userId,-credits,`${partnerName} · simulated AED ${amount.toFixed(2)}`,new Date().toISOString());
    const result=run("INSERT INTO redemptions (user_id,kind,amount,credits,code,expires_at,partner,status) VALUES (?,?,?,?,?,?,?,'active')",userId,kind,amount,credits,code,expiresAt,partnerName);
    if(kind==="nol")run("UPDATE cards SET balance=balance+? WHERE user_id=?",amount,userId);
    return {id:Number(result.lastInsertRowid),kind,amount,credits,code,expiresAt,partner:partnerName,status:"active"};
  })();
  res.json(RedeemCreditsResponse.parse(response));
});
rewardsRouter.get("/challenges",(req,res)=>res.json(GetChallengesResponse.parse(challenges(readUser(req)))));
rewardsRouter.post("/challenges/:id/claim",authRequired,(req,res)=>{
  const params=ClaimChallengeParams.safeParse(req.params);
  if(!params.success){res.status(400).json({error:"Invalid challenge."});return;}
  const userId=res.locals.userId,challenge=challenges(userId).find(c=>c.id===params.data.id);
  if(!challenge){res.status(404).json({error:"Challenge not found."});return;}
  if(challenge.claimed||challenge.progress<challenge.target){res.status(400).json({error:challenge.claimed?"Bonus already claimed.":"Complete the challenge before claiming your bonus."});return;}
  sql.transaction(()=>{
    run("INSERT INTO user_challenges (user_id,challenge_id,week,claimed) VALUES (?,?,?,1)",userId,challenge.id,weekStart());
    earn(userId,challenge.bonus,`${challenge.title} · weekly bonus`);
  })();
  res.json({message:`${challenge.bonus} bonus Green Credits added to your wallet.`});
});
rewardsRouter.get("/leaderboard",(req,res)=>res.json(GetLeaderboardResponse.parse(community(readUser(req)))));
rewardsRouter.get("/privacy/export",authRequired,(_req,res)=>{
  const id=res.locals.userId;
  res.setHeader("Content-Disposition",'attachment; filename="masar-green-my-data.json"');
  res.json(ExportMyDataResponse.parse({user:publicUser(id),trips:tripList(id),wallet:wallet(id)}));
});

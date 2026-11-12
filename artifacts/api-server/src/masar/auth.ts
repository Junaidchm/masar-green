import { Router, type Request, type RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID, createHash } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { LoginBody, LoginResponse, GetMeResponse, UpdateProfileBody, UpdateProfileResponse } from "@workspace/api-zod";
import { one, run, sql } from "./store";
import { publicUser } from "./data";
import { ensureFeedbackWorkspace } from "./feedback-workspace";
import { attachReferral, referralOwner } from "./referrals";

const secret=process.env.SESSION_SECRET;
if(!secret)throw new Error("SESSION_SECRET is required. Configure it in Replit Secrets.");
const signingSecret:string=secret;
const cookieName="masar_session";
export function sessionId(req:Request) {
  try {
    const token=req.cookies?.[cookieName];
    if(typeof token!=="string")return null;
    const decoded=jwt.verify(token,signingSecret,{algorithms:["HS256"],issuer:"masar-green"}) as jwt.JwtPayload;
    const record=one("SELECT user_id FROM sessions WHERE id=? AND expires_at>?",decoded.jti,Date.now());
    return record?record.user_id as number:null;
  }catch{return null;}
}
export const authRequired:RequestHandler=(req,res,next)=>{
  const id=sessionId(req);
  if(!id){res.status(401).json({error:"Sign in with a demo NOL card to continue."});return;}
  res.locals.userId=id;next();
};
export const readUser=(req:Request)=>sessionId(req)??1;
export const authRouter=Router();
const loginLimiter=rateLimit({windowMs:15*60000,limit:25,standardHeaders:"draft-7",legacyHeaders:false,message:{error:"Too many sign-in attempts. Please wait 15 minutes."}});
authRouter.get("/auth/me",(req,res)=>{
  const id=sessionId(req);
  const user=id?publicUser(id):null;
  if(id)ensureFeedbackWorkspace(req,res);
  res.json(GetMeResponse.parse({user,needsOnboarding:user?!user.onboarded:false}));
});
authRouter.post("/auth/login",loginLimiter,async(req,res)=>{
  const input=LoginBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:req.body?.referralCode!==undefined?"rf.invalid":"Enter an 8–10 digit card number and a 4-digit PIN."});return;}
  const {cardNumber,pin,referralCode}=input.data;
  const key=createHash("sha256").update(cardNumber).digest("hex");
  const attempts=one("SELECT * FROM login_attempts WHERE key=?",key);
  if(attempts&&attempts.until_ms>Date.now()&&attempts.attempts>=8){res.status(429).json({error:"This demo card is temporarily locked. Try again in 15 minutes."});return;}
  let card=one("SELECT * FROM cards WHERE number=?",cardNumber);
  if(card&&!await bcrypt.compare(pin,card.pin_hash)){
    const count=attempts&&attempts.until_ms>Date.now()?attempts.attempts+1:1;
    run("INSERT INTO login_attempts (key,attempts,until_ms) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,until_ms=excluded.until_ms",key,count,Date.now()+15*60000);
    res.status(401).json({error:"The card number or PIN is incorrect."});return;
  }
  if(referralCode && card){res.status(409).json({error:"rf.existing"});return;}
  if(referralCode) referralOwner(referralCode);
  if(!card){
    const pinHash=await bcrypt.hash(pin,10);
    // This only creates a prototype card. No real-world NOL card is verified.
    sql.transaction(()=>{
      card=one("SELECT * FROM cards WHERE number=?",cardNumber);
      if(card) {
        if(referralCode) throw Object.assign(new Error("rf.existing"),{status:409});
        return;
      }
      const id=Number(run("INSERT INTO users (name) VALUES ('New commuter')").lastInsertRowid);
      run("INSERT INTO cards (user_id,number,pin_hash,balance) VALUES (?,?,?,25)",id,cardNumber,pinHash);
      if(referralCode) attachReferral(id,referralCode);
      card=one("SELECT * FROM cards WHERE user_id=?",id);
    })();
    if(!await bcrypt.compare(pin,card!.pin_hash)){res.status(401).json({error:"The card number or PIN is incorrect."});return;}
  }
  run("DELETE FROM login_attempts WHERE key=?",key);
  const old=sessionId(req);
  if(old){
    try{const previous=jwt.verify(req.cookies[cookieName],signingSecret) as jwt.JwtPayload;run("DELETE FROM sessions WHERE id=?",previous.jti);}catch{}
  }
  const jti=randomUUID(),expires=Date.now()+7*86400000;
  run("INSERT INTO sessions VALUES (?,?,?)",jti,card!.user_id,expires);
  const token=jwt.sign({},signingSecret,{algorithm:"HS256",subject:String(card!.user_id),jwtid:jti,issuer:"masar-green",expiresIn:"7d"});
  // Secure cookies are mandatory in production. Development over plain HTTP
  // (localhost) needs a non-Secure cookie; Replit development is still HTTPS.
  res.cookie(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:7*86400000,path:"/"});
  ensureFeedbackWorkspace(req,res);
  const user=publicUser(card!.user_id);
  res.json(LoginResponse.parse({user,needsOnboarding:!user.onboarded}));
});
authRouter.post("/auth/logout",(req,res)=>{
  try{
    const decoded=jwt.verify(req.cookies?.[cookieName],signingSecret) as jwt.JwtPayload;
    run("DELETE FROM sessions WHERE id=?",decoded.jti);
  }catch{}
  res.clearCookie(cookieName,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/"});
  res.json({message:"Signed out."});
});
authRouter.patch("/profile",authRequired,(req,res)=>{
  const input=UpdateProfileBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Please check your profile settings."});return;}
  const fields:Record<string,string>={name:"name",language:"language",locationConsent:"location_consent",trackingConsent:"tracking_consent",notifications:"notifications",darkMode:"dark_mode",onboarded:"onboarded"};
  for(const [key,value] of Object.entries(input.data)){
    if(value!==undefined)run(`UPDATE users SET ${fields[key]}=? WHERE id=?`,typeof value==="boolean"?Number(value):value,res.locals.userId);
  }
  res.json(UpdateProfileResponse.parse(publicUser(res.locals.userId)));
});

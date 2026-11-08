import express, { type Express, type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json({limit:"32kb"}));
app.use(express.urlencoded({ extended: true }));
app.use("/api", (req,res,next)=>{
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(!["GET","HEAD","OPTIONS"].includes(req.method) && req.get("sec-fetch-site")==="cross-site"){
    res.status(403).json({error:"Cross-site requests are not allowed."});return;
  }
  next();
});

app.use("/api", router);
app.use("/api",(_req,res)=>res.status(404).json({error:"API endpoint not found."}));
const errorHandler:ErrorRequestHandler=(error,req,res,_next)=>{
  const status=typeof error.status==="number"?error.status:500;
  if(status>=500)req.log.error({err:error},"API request failed");
  res.status(status).json({error:status<500?error.message:"Something went wrong. Please try again."});
};
app.use(errorHandler);

export default app;

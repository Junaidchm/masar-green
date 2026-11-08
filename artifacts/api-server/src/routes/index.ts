import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "../masar/auth";
import { mobilityRouter } from "../masar/mobility";
import { rewardsRouter } from "../masar/rewards";
import { reportsRouter } from "../masar/reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter, mobilityRouter, rewardsRouter, reportsRouter);

export default router;

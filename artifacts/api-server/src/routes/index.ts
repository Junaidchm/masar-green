import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "../masar/auth";
import { mobilityRouter } from "../masar/mobility";
import { rewardsRouter } from "../masar/rewards";
import { reportsRouter } from "../masar/reports";
import { sponsorshipRouter } from "../masar/sponsorship";
import { alertsRouter } from "../masar/service-alerts";
import { feedbackRouter } from "../masar/feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter, mobilityRouter, rewardsRouter, reportsRouter);
router.use(sponsorshipRouter, alertsRouter, feedbackRouter);

export default router;

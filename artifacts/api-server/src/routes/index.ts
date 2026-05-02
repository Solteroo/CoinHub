import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import oauthRouter from "./oauth";
import meRouter from "./me";
import gamesRouter from "./games";
import leaderboardRouter from "./leaderboard";
import chatRouter from "./chat";
import socialRouter from "./social";
import newsRouter from "./news";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(oauthRouter);
router.use(meRouter);
router.use(gamesRouter);
router.use(leaderboardRouter);
router.use(chatRouter);
router.use(socialRouter);
router.use(newsRouter);
router.use(adminRouter);

export default router;

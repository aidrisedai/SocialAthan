import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import friendsRouter from "./friends";
import rsvpsRouter from "./rsvps";
import messagesRouter from "./messages";
import masjidsRouter from "./masjids";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(friendsRouter);
router.use(rsvpsRouter);
router.use(messagesRouter);
router.use(masjidsRouter);

export default router;

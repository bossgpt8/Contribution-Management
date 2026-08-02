import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import membersRouter from "./members";
import transactionsRouter from "./transactions";
import reportsRouter from "./reports";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(membersRouter);
router.use(transactionsRouter);
router.use(reportsRouter);

export default router;

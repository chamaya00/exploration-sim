import { Router } from 'express';
import explorersRouter from './explorers';
import trialRouter from './trial';
import usersRouter from './users';
import worldRouter from './world';
import itemsRouter from './items';

const router = Router();

router.use('/explorers', explorersRouter);
router.use('/trial', trialRouter);
router.use('/users', usersRouter);
router.use('/world', worldRouter);
router.use('/items', itemsRouter);

export default router;

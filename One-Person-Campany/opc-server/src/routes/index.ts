import { Router } from 'express';
import { authRouter } from './auth.js';
import { healthRouter } from './health.js';
import { projectsRouter } from './projects.js';
import { usersRouter } from './users.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/projects', projectsRouter);

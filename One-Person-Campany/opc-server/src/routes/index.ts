import { Router } from 'express';
import { authRouter } from './auth.js';
import { healthRouter } from './health.js';
import { projectsRouter } from './projects.js';
import { usersRouter } from './users.js';

// 引入我们刚新建的两个阶段 3 路由模块（注意保持 .js 后缀的风格）
import favoritesRouter from './favorites.js';
import applicationsRouter from './applications.js';

export const apiRouter = Router();

// ================= 原有路由 =================
apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/projects', projectsRouter);

// ================= 新增路由 =================
// 收藏模块
apiRouter.use('/favorites', favoritesRouter);

// 申请与审核模块（因为里面包含了 /projects/xxx 和 /applications/xxx，直接挂在根路径）
apiRouter.use('/', applicationsRouter);
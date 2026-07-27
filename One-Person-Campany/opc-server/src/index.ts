import 'dotenv/config';
import { createApp } from './app.js';
// 引入刚刚新建的任务路由
import tasksRouter from './tasks.js';

// ... 您其他的路由配置，比如 router.use('/projects', projectsRouter);

// 挂载任务模块
router.use('/tasks', tasksRouter);
const port = Number(process.env.PORT) || 8080;
const app = createApp();

app.listen(port, () => {
  console.log(`OPC server running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});

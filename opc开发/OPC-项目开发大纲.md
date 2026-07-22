# OPC 项目开发大纲（分阶段）

> 依据：原型图 `opc-concept-report-share/assets/prototypes`、  
> `OPC后端数据库设计.md`、`OPC-API接口清单.md`  
> 目标：第一版 MVP 跑通「发现 → 发布 → 申请 → 项目 → 消息 → 我的 → 问培风」主链路。

---

## 总览

| 阶段 | 名称 | 核心产出 | 预计（新手团队参考） |
|------|------|---------|---------------------|
| 0 | 准备与搭架子 | 能跑起来的空项目 + 数据库 | 3～5 天 |
| 1 | 登录与用户 | 注册登录 + 我的页基础 | 3～5 天 |
| 2 | 项目发布与发现 | 发布 / 发现 / 详情 | 5～7 天 |
| 3 | 收藏与申请 | 收藏 + 申请加入闭环 | 3～4 天 |
| 4 | 项目执行 | 项目 Tab + 任务待办 | 4～5 天 |
| 5 | 消息聊天 | 会话列表 + 聊天 | 4～5 天 |
| 6 | 问培风 AI | 简单 AI 问答 | 2～3 天 |
| 7 | 联调与收尾 | 可演示的完整 Demo | 3～5 天 |

> 时间仅供排期参考，可按实际进度调整。**每阶段结束都应能演示 something**，不要等全部做完再联调。

---

## 阶段 0：准备与搭架子

**目标：** 前后端项目能启动，数据库建好，团队对齐规范。

### 0.1 团队对齐（0.5 天）

- [ ] 确认技术栈（见下方「确定技术栈」，已选定）
- [ ] 确认分工：谁前端 / 谁后端 / 是否有人全栈
- [ ] 通读三份文档：数据库设计、API 清单、本大纲
- [ ] 对照原型图过一遍页面：`discover / publish / project / message / profile / detail / assistant`
- [ ] 约定：接口路径、响应格式、Git 分支策略（如 `main` + `dev` + 功能分支）

### 0.2 环境与仓库（1～2 天）

**后端**

- [x] 初始化后端项目（`One-Person-Campany/opc-server`，Express + TypeScript）
- [ ] 配置 MySQL 连接（复制 `opc-server/.env.example` → `.env` 并改 `DATABASE_URL`）
- [ ] 执行 `One-Person-Campany/sql/init_all.sql` 建库建表
- [x] 实现统一响应格式 `{ code, message, data }`
- [x] 实现全局异常处理、跨域 CORS
- [x] 健康检查接口：`GET /api/health` → `{ "status": "ok" }`

**前端**

- [x] 初始化前端项目（`One-Person-Campany/opc-web`，React + Vite + TypeScript）
- [x] 配置路由、底部 5 Tab 空壳：**发现 / 项目 / 发布 / 消息 / 我的**
- [x] 封装 HTTP 请求工具（baseURL、`Authorization` 头）
- [ ] 准备原型图资源目录，按页面命名组件（可从 `../opc-concept-report-share/assets/prototypes` 复制）

**协作**

- [x] 建立前后端联调方式（本地后端 `localhost:8080`，前端 Vite proxy `/api`）
- [ ] （可选）准备 Apifox / Postman 集合，导入 API 清单

### 0.3 本阶段交付物

- 后端启动成功，能访问 `/api/health`
- 前端启动成功，5 个 Tab 可切换（空页面即可）
- MySQL 中 11 张表已创建

### 确定技术栈（项目最终选型）

| 层 | 技术 | 说明 |
|----|------|------|
| **前端** | React 18 + Vite + TypeScript | 已有 React 经验 |
| **路由** | React Router | 5 Tab + 详情/聊天等页面 |
| **UI** | Ant Design Mobile | 贴近手机原型 |
| **请求** | Axios | 对接 API 清单 |
| **后端** | Node.js + Express + TypeScript | 已有 Node 经验 |
| **ORM** | Prisma | 映射 MySQL 表 |
| **鉴权** | JWT + bcrypt | 登录注册（阶段 1） |
| **数据库** | MySQL 8 | 建表脚本见代码目录 `sql/` |

**代码目录：** `One-Person-Campany/`（含 `opc-web`、`opc-server`、`sql`）

已初始化内容（阶段 0 部分完成）：

- 后端 `GET /api/health` 健康检查（本地已验证返回 `code: 0`）
- 前端 5 Tab 空壳 + 后端连接状态检测
- Prisma `schema.prisma` 与 11 张表对齐（`npm run prisma:generate` 已可执行）
- 前后端 `npm run build` 已通过

**不要阶段 0 换栈。**

---

## 阶段 1：登录与用户（我的页基础）

**目标：** 用户能注册、登录，看到基础「我的」页。  
**原型参考：** `profile.png`

### 1.1 后端

| 优先级 | 接口 | 表 |
|--------|------|-----|
| P0 | POST `/auth/register` | users |
| P0 | POST `/auth/login` | users |
| P0 | GET `/auth/me` | users, user_skills |
| P1 | PUT `/users/me` | users |
| P1 | GET/PUT `/users/me/skills` | user_skills |

- [ ] 密码加密存储（bcrypt 等）
- [ ] 登录成功返回 JWT token
- [ ] 鉴权中间件：除白名单外校验 token

### 1.2 前端

- [ ] 登录页、注册页（可先做简单表单，不必完全还原视觉）
- [ ] 登录态：存 token，请求自动带头
- [ ] 未登录跳转登录；已登录进主页
- [ ] **我的页**骨架：头像、昵称、bio、统计数字（参与项目/申请中可先 mock 或后端返回 0）
- [ ] 编辑资料页：改昵称、头像、bio
- [ ] 技能标签展示与编辑

### 1.3 联调验收

- [ ] 注册 → 登录 → 进入 App → 我的页显示正确昵称
- [ ] 刷新页面仍保持登录
- [ ] 修改资料后我的页更新

---

## 阶段 2：项目发布与发现

**目标：** 能发项目、在发现页看到、点进详情。  
**原型参考：** `discover.png`、`publish.png`、`detail.png`

### 2.1 后端

| 优先级 | 接口 | 表 |
|--------|------|-----|
| P0 | POST `/projects`（含草稿 isDraft） | projects, project_members |
| P0 | GET `/projects`（列表、搜索、分页） | projects |
| P0 | GET `/projects/{id}`（详情） | projects, project_members, users |
| P1 | PUT `/projects/{id}` | projects |
| P1 | GET `/projects/drafts` | projects |
| P2 | POST `/projects/ai-draft` | 调 AI 或 mock |

- [ ] 发布时：`is_draft=0`，`status=recruiting`，发布者写入 `project_members`
- [ ] 详情返回：owner、members、roles_json、phases_json 解析为 JSON
- [ ] 列表只返回已发布项目（`is_draft=0`）
- [ ] （建议）准备 5～10 条 seed 测试数据脚本

### 2.2 前端

- [ ] **发现页**：搜索框、项目卡片列表、标签展示
- [ ] **发布页**：输入想法、保存草稿、发布（AI 整理可先 mock 或后接）
- [ ] **草稿箱**入口（我的页或发布页）
- [ ] **项目详情页**：封面、简介、周期、人数、远程、截止日、招募角色、项目安排、底部「联系发布人」「申请加入」（申请按钮阶段 3 再接）
- [ ] 发现页点击卡片 → 详情页

### 2.3 联调验收

- [ ] 发布一个项目 → 发现页能搜到 → 详情信息完整
- [ ] 存草稿 → 草稿箱能看到 → 继续编辑 → 再发布
- [ ] 搜索关键词能过滤项目

---

## 阶段 3：收藏与申请

**目标：** 完成「看到项目 → 感兴趣 → 申请加入 → 发布者审核」闭环。  
**原型参考：** `detail.png`、我的页「项目申请」

### 3.1 后端

| 优先级 | 接口 | 表 |
|--------|------|-----|
| P0 | POST/DELETE/GET `/favorites` | user_favorites |
| P0 | POST `/projects/{id}/applications` | project_applications |
| P0 | GET `/applications/mine` | project_applications, projects |
| P0 | GET `/projects/{id}/applications` | project_applications |
| P0 | PATCH `/applications/{id}` | project_applications, project_members |

- [ ] 申请通过：写 `project_members`，`team_current + 1`
- [ ] 同一用户对同一项目重复申请要拦截
- [ ] `match_score` / `match_reason` 第一版可写死规则或返回 null

### 3.2 前端

- [ ] 发现页 / 详情页：收藏、取消收藏
- [ ] 详情页：选角色 + 留言 → 提交申请
- [ ] 我的 → **项目申请**：查看申请状态
- [ ] 发布者视角：某项目下申请列表 → 通过 / 拒绝
- [ ] 我的 → **收藏项目**列表

### 3.3 联调验收

- [ ] 用户 A 发布项目，用户 B 申请 → A 审核通过 → B 成为成员
- [ ] 收藏后在「我的-收藏」可见
- [ ] 详情页 `hasApplied` 状态正确

---

## 阶段 4：项目执行（项目 Tab + 任务）

**目标：** 参与者能在「项目」页管理进行中的项目和待办。  
**原型参考：** `project.png`

### 4.1 后端

| 优先级 | 接口 | 表 |
|--------|------|-----|
| P0 | GET `/projects/mine?status=` | projects, project_members |
| P0 | GET `/projects/published` | projects |
| P0 | GET `/projects/{id}/tasks` | project_tasks |
| P0 | GET `/tasks/mine` | project_tasks, projects |
| P0 | POST `/projects/{id}/tasks` | project_tasks |
| P0 | PATCH `/tasks/{id}` | project_tasks |
| P1 | PATCH `/projects/{id}`（改 progress、status） | projects |

- [ ] `projects/mine` 只返回当前用户参与的项目
- [ ] 任务列表支持按 `status=todo` 筛选
- [ ] 项目页顶部统计：项目数、待办数、临期数（可后端算或前端聚合）

### 4.2 前端

- [ ] **项目页** 4 个 Tab：进行中 / 待确认 / 已完成 / 已归档
- [ ] 项目卡片：进度条、当前任务、团队人数、截止日期
- [ ] **待处理**区块：跨项目待办，优先级颜色（高/中/低）
- [ ] 项目详情（进行中态）：可查看任务、改项目进度（若权限允许）
- [ ] 我的 → **已发布**项目列表

### 4.3 联调验收

- [ ] 成员登录后「项目-进行中」能看到已加入项目
- [ ] 创建任务 → 出现在待处理 → 标记完成
- [ ] 切换 Tab 状态过滤正确

---

## 阶段 5：消息聊天

**目标：** 项目成员能看会话列表、进聊天、发文字消息。  
**原型参考：** `message.png`、`nav-message.png`

### 5.1 后端

| 优先级 | 接口 | 表 |
|--------|------|-----|
| P0 | GET `/conversations` | conversations, conversation_users |
| P0 | GET `/conversations/{id}/messages` | messages |
| P0 | POST `/conversations/{id}/messages` | messages, conversations |
| P0 | POST `/conversations/{id}/read` | conversation_users |
| P1 | POST `/conversations`（联系发布人 / 建群） | conversations, conversation_users |

- [ ] 申请通过时可自动创建 `type=project` 会话并拉成员入群
- [ ] 发消息后更新 `last_message`、`last_message_at`
- [ ] 接收方 `unread_count + 1`；已读接口清零
- [ ] `ai_tag` 第一版可空，或简单关键词规则

### 5.2 前端

- [ ] **消息列表**：会话名、最后一条、时间、未读角标
- [ ] **聊天页**：消息气泡、发送框、滚动加载历史
- [ ] 进入聊天页调用已读接口
- [ ] 详情页「联系发布人」→ 进入或创建会话
- [ ] 顶部「待办 / 评论点赞 / 好友申请」第一版可只做 UI + 跳转占位（接口文档标注为后续）

### 5.3 联调验收

- [ ] 两用户在同一项目群互发消息，列表实时更新（可先轮询，不必上 WebSocket）
- [ ] 未读数正确，进入聊天后清零
- [ ] 消息按时间排序

---

## 阶段 6：问培风 AI

**目标：** 全局 AI 助手能对话，并能结合待办给建议。  
**原型参考：** `assistant.png`

### 6.1 后端

| 优先级 | 接口 | 表 |
|--------|------|-----|
| P0 | POST `/ai/chat` | ai_chats |
| P1 | GET `/ai/chat/history` | ai_chats |

**第一版 AI 实现策略（三选一，由简到难）：**

1. **Mock**：固定模板回复 + 查 `project_tasks` 拼「今天要处理什么」
2. **规则引擎**：识别关键词「待办 / 找项目 / 总结消息」走不同分支
3. **接大模型 API**：OpenAI / 通义 / 文心等，system prompt 注入用户待办摘要

- [ ] 保存 user / assistant 消息到 `ai_chats`
- [ ] 快捷问题：「今天要处理什么」→ 调 GET `/tasks/mine` 逻辑汇总

### 6.2 前端

- [ ] 悬浮入口「问 AI」（发现 / 消息 / 我的等页）
- [ ] **问培风页**：快捷按钮、对话列表、输入框
- [ ] 展示 AI 回复；若有 `suggestions` 可点击跳转对应页面

### 6.3 联调验收

- [ ] 问「今天要处理什么」能返回基于真实待办的列表
- [ ] 对话历史可加载
- [ ] 未接真 AI 时 Mock 也能完整演示

---

## 阶段 7：联调、打磨与演示

**目标：** 整体体验可演示，主流程无阻塞 bug。

### 7.1 全链路走查

按用户故事自测一遍：

```
注册 → 登录 → 发布项目 → 另一账号发现 → 收藏 → 申请
→ 发布者审核 → 项目页看到进行中 → 建任务 → 消息沟通
→ 问培风查待办 → 我的页资料/草稿/收藏/申请
```

- [ ] 每条路径记录 bug 清单
- [ ] 修复 P0 bug（崩溃、无法登录、数据不显示）

### 7.2 UI 对齐原型（按优先级）

| 优先级 | 页面 | 原型文件 |
|--------|------|---------|
| P0 | 发现、详情、项目、发布 | discover / detail / project / publish |
| P1 | 消息、我的 | message / profile |
| P2 | 问培风 | assistant |

- [ ] 底部导航与原型一致（中间发布按钮突出）
- [ ] 色彩、圆角、卡片布局尽量贴近原型（不必像素级）

### 7.3 工程化（可选）

- [ ] README：如何启动前后端、如何导数据库
- [ ] 测试数据脚本：2 个用户 + 3 个项目 + 若干消息
- [ ] （可选）Docker Compose：MySQL + 后端

### 7.4 本阶段交付物

- 可录屏演示的 MVP
- 已知问题列表 + 第二版 backlog

---

## 前后端并行建议

每个阶段内可并行：

| 角色 | 做法 |
|------|------|
| 后端 | 先实现本阶段 P0 接口 + 返回 mock 也可 |
| 前端 | 先用 mock 数据画页面，接口就绪后替换为真实 API |
| 联调 | **每阶段末尾固定 0.5～1 天联调**，不要堆到最后 |

**前端 mock 顺序：** 静态原型图 → 本地 JSON → 真实 API

---

## 第一版明确不做（避免 scope 膨胀）

对照 `OPC后端数据库设计.md` 第七节，以下 **不要** 在 MVP 做：

- 社区动态、点赞评论
- 好友系统
- 知识库、项目复盘、文件上传
- 复杂 AI 推荐算法、向量匹配
- WebSocket 实时推送（可用轮询代替）
- 浏览记录、系统通知表

---

## 页面 ↔ 原型 ↔ 阶段 对照

| 页面 | 原型文件 | 主要完成阶段 |
|------|---------|-------------|
| 发现 | discover.png | 阶段 2 |
| 搜索/筛选 | discover.png | 阶段 2 |
| 发布 | publish.png | 阶段 2 |
| 项目详情 | detail.png | 阶段 2～3 |
| 项目 Tab | project.png | 阶段 4 |
| 消息 | message.png | 阶段 5 |
| 我的 | profile.png | 阶段 1～3 |
| 问培风 | assistant.png | 阶段 6 |

---

## 仓库结构

```
OPC/                               # 文档与原型（规划层）
├── README.md
├── opc介绍/                       # 产品、概念、原型
├── opc开发/                       # 大纲、API 清单、数据库设计
│   ├── OPC-项目开发大纲.md
│   ├── OPC-API接口清单.md
│   └── OPC后端数据库设计.md
└── One-Person-Campany/            # 代码（实现层）★
    ├── README.md
    ├── sql/                       # 建表脚本（全仓库唯一维护点）
    ├── opc-web/                   # React 前端
    └── opc-server/                # Express 后端
```

> 建库只执行 `One-Person-Campany/sql/init_all.sql`；改表后同步更新 `opc-server/prisma/schema.prisma` 与 `opc开发/OPC后端数据库设计.md`。

---

## 里程碑检查清单（给负责人用）

| 里程碑 | 标志 | 目标日期（自填） |
|--------|------|-----------------|
| M0 | 环境 + 空壳 App | |
| M1 | 能登录，我的页可用 | |
| M2 | 能发项目、发现页能看 | |
| M3 | 能申请、能审核、能收藏 | |
| M4 | 项目 Tab + 任务可用 | |
| M5 | 能聊天 | |
| M6 | 问培风可演示 | |
| M7 | MVP Demo 完成 | |

---

*文档版本：v1.1 | 技术栈已定 + 代码目录 One-Person-Campany 已初始化*

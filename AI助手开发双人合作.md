# AI 助手开发双人合作（问培风）

> 目标：两人并行完成 **阶段 6「问培风」**，一人前端、一人后端，文件少冲突、接口契约清晰、能演示。  
> 依据：[`opc开发/OPC-项目开发大纲.md`](./opc开发/OPC-项目开发大纲.md) 阶段 6、[`opc开发/OPC-API接口清单.md`](./opc开发/OPC-API接口清单.md) §10、[`opc介绍`](./opc介绍/) 原型 `assistant.png`。  
> 前置：阶段 4（项目/任务）、阶段 5（消息）已合入 `develop`，可联调「今天要处理什么」。

---

## 1. 问培风是什么

产品概念里的 **全局 AI 助手**（见 `opc介绍` 概念汇报）：跨发现 / 项目 / 消息等页的悬浮入口，帮用户处理待办、找项目、总结未读等高频问题。

第一版 MVP 要求：

- 能发问题、看回复、拉历史  
- 快捷问「今天要处理什么」能结合真实待办（或合理 Mock）  
- **不强制接大模型**：Mock / 规则引擎即可完整演示  

---

## 2. 角色与分支

| 同学 | 职责 | 主责范围 |
|------|------|----------|
| **前端同学（建议甲）** | 问培风页面、入口、对接接口 | `opc-web` |
| **后端同学（建议乙）** | AI 接口、落库、回复生成策略 | `opc-server` |

把名字填在这里：

| 角色 | 姓名 | 备注 |
|------|------|------|
| 前端 | （填写） | |
| 后端 | （填写） | |

建议分支：

- 前端：`feature/6-ai-frontend`
- 后端：`feature/6-ai-backend`
- 都基于最新 `develop` 拉出；可演示后分别合回 `develop`（先合后端或约定 Mock 契约后再合前端）

---

## 3. 接口契约（先对齐再写代码）

统一响应：`{ code, message, data }`，成功 `code === 0`；需登录：`Authorization: Bearer <token>`。

### 3.1 `POST /ai/chat` — 提问

**请求：**

```json
{ "content": "今天要处理什么？" }
```

**响应 data 建议：**

```json
{
  "reply": "今天建议优先处理以下事项：\n1. …",
  "suggestions": [
    { "type": "task", "refId": 1, "title": "确认项目周期" }
  ],
  "userMessage": { "id": 1, "role": "user", "content": "…", "createdAt": "…" },
  "assistantMessage": { "id": 2, "role": "assistant", "content": "…", "createdAt": "…" }
}
```

说明：

- `reply` 必有；`suggestions` 第一版可空数组  
- 写入 `ai_chats`：一条 `role=user`，一条 `role=assistant`  
- Prisma 模型 **`AiChat` / 表 `ai_chats` 已在 schema 中**，一般无需再建表；若本地库缺表，后端同学跑一次 migrate / push  

### 3.2 `GET /ai/chat/history` — 历史

**Query：** `page`、`pageSize`（按时间倒序或正序，**前后端开干前定一种**，建议正序方便聊天 UI）。

**响应 data：** `{ list, total, page, pageSize }`，list 单项含 `id, role, content, createdAt`。

开干前在群里确认上述字段；有变更同步改 `opc开发/OPC-API接口清单.md`。

---

## 4. 后端同学任务清单

**目标：** 前端只调两个接口就能完成对话演示。

### 4.1 建议新建（后端独占）

| 文件 | 说明 |
|------|------|
| `opc-server/src/routes/ai.ts` | AI 路由 |
| `opc-server/src/services/aiChat.ts`（可选） | 生成回复、拼待办摘要 |
| `routes/index.ts` | **只加一行**挂载，如 `apiRouter.use('/ai', aiRouter)`（改前先 `pull`） |

### 4.2 实现优先级

| 优先级 | 项 | 说明 |
|--------|----|------|
| P0 | `POST /ai/chat` | 鉴权、校验 content、落库、返回 reply |
| P0 | Mock / 规则回复 | 识别「今天要处理什么」→ 查当前用户 `project_tasks`（可复用 `/tasks/mine` 逻辑）拼文案 |
| P1 | `GET /ai/chat/history` | 分页历史 |
| P2 | `suggestions` | 可点击跳转的结构化建议（可后补） |
| 可选 | 接大模型 | OpenAI / 通义等；system prompt 注入待办摘要；无 Key 时回退 Mock |

### 4.3 后端验收

- [ ] 登录后提问返回 `code===0` 且 `reply` 非空  
- [ ] 「今天要处理什么」能基于真实待办（有任务时）或明确空态文案  
- [ ] 历史接口能读到刚写入的 user/assistant 两条  
- [ ] 未登录 401  

---

## 5. 前端同学任务清单

**目标：** 有入口、有对话页，对接后端真实接口（后端未好时可先 Mock 响应形状）。

### 5.1 建议新建 / 改动（前端独占）

| 文件 | 说明 |
|------|------|
| `opc-web/src/api/ai.ts` | 封装 `chat`、`fetchHistory` |
| `opc-web/src/pages/AssistantPage.tsx`（或 `AiAssistantPage.tsx`） | 问培风主页面 |
| `App.tsx` | 加路由，如 `/assistant` |
| 入口组件（可选） | 悬浮「问 AI」按钮，挂在 `AppLayout` 或主要页面 |

参考原型：`opc介绍/opc-concept-report-share/assets/prototypes/assistant.png`。

### 5.2 页面能力

| 优先级 | 项 |
|--------|----|
| P0 | 对话列表（区分 user / assistant） |
| P0 | 输入框发送 → `POST /ai/chat` → 展示回复 |
| P0 | 进入页拉 `GET /ai/chat/history` |
| P1 | 快捷按钮：「今天要处理什么」「找项目」等（点一下填入或直接发送） |
| P1 | 全局悬浮入口（发现 / 消息 / 我的等，不必每页都做，Layout 一处即可） |
| P2 | 点击 `suggestions` 跳转任务 / 消息 / 申请页 |

### 5.3 前端验收

- [ ] 从悬浮入口能进入问培风页  
- [ ] 发送问题能看到回复；刷新后历史仍在  
- [ ] 快捷「今天要处理什么」走通  
- [ ] 加载中 / 失败有 Toast 或 Error 提示  

---

## 6. 文件所有权（减少冲突）

| 区域 | 负责人 |
|------|--------|
| `routes/ai.ts`、`services/aiChat.ts`、AI 相关 Prisma 使用 | 后端 |
| `api/ai.ts`、`AssistantPage.tsx`、问培风样式 | 前端 |
| `routes/index.ts`、`App.tsx`、`AppLayout.tsx` | **小改 + 先拉再推**；同一天改先语音对齐 |
| `routes/tasks.ts` / `api/tasks.ts` | 默认不改；后端「待办汇总」只读复用查询逻辑，不重构任务模块 |
| 消息 / 申请等已完成模块 | **冻结**，除非联调修 bug |

---

## 7. 推荐开发顺序（约 3～5 天）

| 天 | 后端 | 前端 |
|----|------|------|
| Day 1 | 定契约；`POST /ai/chat` + Mock 回复 + 落库 | `api/ai.ts` + 空页面 + 路由 |
| Day 2 | 「今天要处理什么」接任务查询；history 接口 | 对话 UI、发送、展示回复 |
| Day 3 | 补 suggestions / 空态文案；自测 | 快捷按钮、历史加载、悬浮入口 |
| Day 4 | 合入 `develop`，双人联调 | 合入 `develop`，按原型微调样式 |
| 可选 | 接真实大模型 API | suggestions 跳转 |

第一版允许：**后端先 Mock，前端先按契约联调**，再替换成规则或真模型。

---

## 8. 联调与合并

1. 后端先在 Apifox / curl 跑通两个接口，把示例响应贴群里  
2. 前端对接真实 `baseURL`，两人各用自己账号测历史隔离  
3. 合并顺序建议：**先合后端分支 → 再合前端分支**（或同一天先后 PR）  
4. 联调检查表：

```text
登录 → 点「问 AI」→ 发「你好」有回复
→ 快捷「今天要处理什么」→ 文案含待办或空态
→ 刷新页面 → 历史仍在
→ 另一账号历史互不串
```

---

## 9. 与阶段 7 的关系

问培风可演示后，再和甲乙一起做：

- 全链路 Demo（发现 → 申请 → 项目 → 消息 → **问培风**）  
- UI 贴原型（问培风页参考 `assistant.png`；其他页 icon / 导航对齐可并行）  

---

## 10. 相关文档

| 文档 | 用途 |
|------|------|
| [双人合作指南.md](./双人合作指南.md) | 阶段 4/5 总分工（本文是阶段 6 专篇） |
| [opc开发/OPC-项目开发大纲.md](./opc开发/OPC-项目开发大纲.md) | 阶段 6 验收 |
| [opc开发/OPC-API接口清单.md](./opc开发/OPC-API接口清单.md) | `/ai/chat` 契约 |
| [opc开发/OPC后端数据库设计.md](./opc开发/OPC后端数据库设计.md) | `ai_chats` |
| [opc介绍/opc-concept-report-share/](./opc介绍/opc-concept-report-share/) | 产品说明与 `assistant.png` |

---

## 11. 一页纸速查

```text
后端：POST/GET /ai/* + ai_chats 落库 + Mock/规则回复（可读 tasks）
前端：Assistant 页 + 悬浮入口 + api/ai.ts
契约：先对齐请求/响应，再写代码
策略：第一版 Mock 即可演示，大模型可选
分支：feature/6-ai-backend | feature/6-ai-frontend → develop
冻结：消息 / 申请主链路，只修联调 bug
```

---

*文档版本：v1.0 | 对应仓库阶段：4、5 已合 develop，启动阶段 6 问培风*

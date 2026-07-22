# OPC API 接口清单（简化版 v1.0）

> 对应文档：`OPC后端数据库设计.md`  
> 面向第一版 MVP，前后端按此约定开发即可。

---

## 1. 通用约定

### 1.1 基础信息

| 项 | 约定 |
|----|------|
| 基础路径 | `http://localhost:8080/api` |
| 数据格式 | JSON |
| 编码 | UTF-8 |
| 时间格式 | `2026-07-21T15:30:00`（ISO 8601） |

### 1.2 统一响应格式

**成功：**

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

**失败：**

```json
{
  "code": 40001,
  "message": "手机号已注册",
  "data": null
}
```

**分页列表：**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 1.3 登录鉴权

除「注册、登录、公开项目列表/详情」外，其余接口需在请求头携带：

```
Authorization: Bearer <token>
```

### 1.4 常用 HTTP 方法

| 方法 | 含义 | 示例 |
|------|------|------|
| GET | 查询 | 获取项目列表 |
| POST | 新建 | 发布项目、发送消息 |
| PUT | 全量更新 | 更新个人资料 |
| PATCH | 部分更新 | 修改项目进度 |
| DELETE | 删除 | 取消收藏 |

### 1.5 常用错误码

| code | 含义 |
|------|------|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 / token 失效 |
| 40301 | 无权限 |
| 40401 | 资源不存在 |
| 50001 | 服务器错误 |

---

## 2. 接口总览

| 模块 | 接口数 | 对应页面 |
|------|--------|---------|
| 认证 | 3 | 登录注册 |
| 用户 | 4 | 我的、编辑资料 |
| 项目 | 8 | 发现、发布、详情、项目 |
| 申请 | 4 | 申请加入、审核 |
| 任务 | 4 | 项目页待办 |
| 收藏 | 3 | 发现、我的 |
| 消息 | 5 | 消息、聊天 |
| AI | 2 | 问培风 |

**合计：33 个接口**（第一版）

---

## 3. 认证模块

### 3.1 注册

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/auth/register` |
| 说明 | 手机号注册 |
| 需要登录 | 否 |
| 涉及表 | `users` |

**请求体：**

```json
{
  "phone": "13800138000",
  "password": "123456",
  "nickname": "李同学"
}
```

**响应 data：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "李同学",
    "avatar": null,
    "bio": null
  }
}
```

---

### 3.2 登录

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/auth/login` |
| 说明 | 手机号 + 密码登录 |
| 需要登录 | 否 |
| 涉及表 | `users` |

**请求体：**

```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

**响应：** 同注册，返回 `token` + `user`

---

### 3.3 获取当前登录用户

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/auth/me` |
| 说明 | 校验 token，返回当前用户信息 |
| 需要登录 | 是 |
| 涉及表 | `users`, `user_skills` |

**响应 data：**

```json
{
  "id": 1,
  "phone": "13800138000",
  "nickname": "李同学",
  "avatar": "https://...",
  "bio": "产品设计 / 在校学生",
  "skills": ["产品设计", "AI工具"],
  "stats": {
    "projectsJoined": 3,
    "applicationsPending": 2
  }
}
```

---

## 4. 用户模块

### 4.1 更新个人资料

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/users/me` |
| 说明 | 修改昵称、头像、简介 |
| 需要登录 | 是 |
| 涉及表 | `users` |

**请求体：**

```json
{
  "nickname": "李同学",
  "avatar": "https://...",
  "bio": "产品设计 / AI工具 / 在校学生"
}
```

---

### 4.2 获取技能标签

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/users/me/skills` |
| 说明 | 我的页能力标签 |
| 需要登录 | 是 |
| 涉及表 | `user_skills` |

**响应 data：**

```json
["产品设计", "需求分析", "原型设计", "AI工具"]
```

---

### 4.3 更新技能标签

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/users/me/skills` |
| 说明 | 全量替换技能列表 |
| 需要登录 | 是 |
| 涉及表 | `user_skills` |

**请求体：**

```json
{
  "skills": ["产品设计", "需求分析", "AI工具"]
}
```

---

### 4.4 获取他人公开资料

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/users/{userId}` |
| 说明 | 查看其他用户（如项目发布人） |
| 需要登录 | 是 |
| 涉及表 | `users`, `user_skills` |

---

## 5. 项目模块

### 5.1 项目列表（发现页）

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects` |
| 说明 | 发现页：推荐 / 热门项目列表 |
| 需要登录 | 否（登录后可返回是否已收藏） |
| 涉及表 | `projects`, `user_favorites` |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（标题、标签） |
| tag | string | 否 | 标签筛选，如 `AI工具` |
| sort | string | 否 | `latest`最新 / `hot`热度，默认 latest |
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页条数，默认 10 |

**响应 data.list 单项示例：**

```json
{
  "id": 1,
  "title": "智能校园助手",
  "cover": "https://...",
  "tags": ["AI工具", "产品设计"],
  "status": "recruiting",
  "teamCurrent": 3,
  "teamMax": 5,
  "deadline": "2026-06-15",
  "viewCount": 1200,
  "heatScore": 1200,
  "matchScore": 92,
  "matchReason": "与你的产品设计经验匹配",
  "isFavorite": false
}
```

> `matchScore` / `matchReason` 第一版可写死或简单规则，未登录时不返回。

---

### 5.2 项目详情

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects/{projectId}` |
| 说明 | 详情页完整信息 |
| 需要登录 | 否 |
| 涉及表 | `projects`, `project_members`, `users` |

**响应 data 示例：**

```json
{
  "id": 1,
  "title": "智能校园助手",
  "description": "面向大学生的 AI 学习规划项目...",
  "cover": "https://...",
  "tags": ["AI工具", "产品设计"],
  "status": "recruiting",
  "workMode": "remote",
  "durationWeeks": 4,
  "deadline": "2026-06-15",
  "teamCurrent": 3,
  "teamMax": 5,
  "progress": 0,
  "weeklyHoursExpected": 4,
  "roles": [
    {"name": "产品经理", "count": 1, "filled": 0, "recommended": true},
    {"name": "前端开发", "count": 1, "filled": 0}
  ],
  "phases": [
    {"name": "需求调研", "status": "pending"},
    {"name": "原型设计", "status": "pending"}
  ],
  "aiSummary": "项目摘要...",
  "owner": {
    "id": 2,
    "nickname": "张老师",
    "avatar": "https://..."
  },
  "members": [
    {"userId": 2, "nickname": "张老师", "avatar": "...", "roleName": "发起人"}
  ],
  "isFavorite": false,
  "hasApplied": false
}
```

---

### 5.3 我参与的项目列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects/mine` |
| 说明 | 项目页 Tab：进行中 / 待确认 / 已完成 / 已归档 |
| 需要登录 | 是 |
| 涉及表 | `projects`, `project_members`, `project_tasks` |

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | `pending` / `ongoing` / `done` / `archived` |
| page | int | 页码 |
| pageSize | int | 每页条数 |

**响应 data.list 单项示例：**

```json
{
  "id": 1,
  "title": "智能校园助手",
  "cover": "https://...",
  "status": "ongoing",
  "progress": 60,
  "currentTask": "确认原型范围",
  "aiSuggestion": "今天确认需求",
  "aiWarning": "时间偏紧",
  "teamCount": 3,
  "deadline": "2026-06-15",
  "memberAvatars": ["https://...", "https://..."]
}
```

---

### 5.4 我发布的项目

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects/published` |
| 说明 | 我的 → 已发布 |
| 需要登录 | 是 |
| 涉及表 | `projects` |

**Query 参数：** `page`, `pageSize`

---

### 5.5 我的草稿列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects/drafts` |
| 说明 | 我的 → 草稿箱 |
| 需要登录 | 是 |
| 涉及表 | `projects`（`is_draft=1`） |

---

### 5.6 创建项目 / 保存草稿

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/projects` |
| 说明 | 发布页：保存草稿或新建项目 |
| 需要登录 | 是 |
| 涉及表 | `projects`, `project_members` |

**请求体：**

```json
{
  "title": "智能校园助手",
  "description": "做一个 AI 学习规划助手...",
  "rawInput": "做一个 AI 学习规划助手，帮助大学生...",
  "tags": "AI工具,产品设计",
  "workMode": "remote",
  "durationWeeks": 4,
  "deadline": "2026-06-15",
  "teamMax": 5,
  "rolesJson": "[{\"name\":\"产品经理\",\"count\":1,\"filled\":0}]",
  "phasesJson": "[{\"name\":\"需求调研\",\"status\":\"pending\"}]",
  "isDraft": true
}
```

**响应 data：** 返回完整 `projectId` 及项目对象

> 发布时：`isDraft=false`，后端设置 `status=recruiting`，并自动把发布者写入 `project_members`。

---

### 5.7 更新项目

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/projects/{projectId}` |
| 说明 | 编辑项目、更新草稿、修改进度/状态 |
| 需要登录 | 是（仅发布者或成员有权限） |
| 涉及表 | `projects` |

**请求体（按需传字段）：**

```json
{
  "title": "智能校园助手",
  "description": "...",
  "status": "ongoing",
  "progress": 60,
  "isDraft": false
}
```

---

### 5.8 AI 整理发布内容（可选）

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/projects/ai-draft` |
| 说明 | 发布页：根据用户输入生成标题、描述、角色等 |
| 需要登录 | 是 |
| 涉及表 | 无（调 AI 服务，结果由前端填入再 POST `/projects`） |

**请求体：**

```json
{
  "rawInput": "做一个 AI 学习规划助手，帮助大学生管理学期任务"
}
```

**响应 data：**

```json
{
  "title": "AI 学习规划助手",
  "description": "...",
  "direction": "AI 学习规划工具",
  "targetAudience": "大学生",
  "roles": [{"name": "产品经理", "count": 1}],
  "missingFields": ["项目周期", "招募角色"]
}
```

---

## 6. 申请模块

### 6.1 提交加入申请

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/projects/{projectId}/applications` |
| 说明 | 详情页「申请加入」 |
| 需要登录 | 是 |
| 涉及表 | `project_applications` |

**请求体：**

```json
{
  "roleName": "产品经理",
  "message": "我有产品设计经验，希望加入"
}
```

**响应 data：**

```json
{
  "applicationId": 10,
  "status": "pending",
  "matchScore": 92,
  "matchReason": "具备产品设计经验"
}
```

---

### 6.2 我的申请列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/applications/mine` |
| 说明 | 我的 → 项目申请 |
| 需要登录 | 是 |
| 涉及表 | `project_applications`, `projects` |

**Query 参数：** `status`（pending/approved/rejected）, `page`, `pageSize`

---

### 6.3 某项目收到的申请（发布者）

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects/{projectId}/applications` |
| 说明 | 发布者查看谁申请了 |
| 需要登录 | 是（仅项目发布者） |
| 涉及表 | `project_applications`, `users` |

---

### 6.4 审核申请

| 项 | 内容 |
|----|------|
| 方法 | `PATCH` |
| 路径 | `/applications/{applicationId}` |
| 说明 | 通过或拒绝申请 |
| 需要登录 | 是（仅发布者） |
| 涉及表 | `project_applications`, `project_members`, `conversations` |

**请求体：**

```json
{
  "status": "approved"
}
```

> `approved` 时后端：写入 `project_members`，`team_current + 1`，可选创建项目群。

---

## 7. 任务模块

### 7.1 项目任务列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/projects/{projectId}/tasks` |
| 说明 | 某项目下的任务 |
| 需要登录 | 是 |
| 涉及表 | `project_tasks` |

**Query 参数：** `status`（todo/done）

---

### 7.2 我的待办（跨项目）

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/tasks/mine` |
| 说明 | 项目页「待处理」、问培风「今天要处理什么」 |
| 需要登录 | 是 |
| 涉及表 | `project_tasks`, `projects` |

**Query 参数：** `status=todo`, `page`, `pageSize`

**响应 data.list 单项：**

```json
{
  "id": 1,
  "title": "确认「学习计划小助手」原型范围",
  "priority": "high",
  "dueDate": "2026-07-21",
  "dueLabel": "今天截止",
  "projectId": 2,
  "projectTitle": "学习计划小助手"
}
```

---

### 7.3 创建任务

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/projects/{projectId}/tasks` |
| 说明 | 项目内新建待办 |
| 需要登录 | 是 |
| 涉及表 | `project_tasks` |

**请求体：**

```json
{
  "title": "确认原型范围",
  "assigneeId": 3,
  "priority": "high",
  "dueDate": "2026-07-21"
}
```

---

### 7.4 更新任务状态

| 项 | 内容 |
|----|------|
| 方法 | `PATCH` |
| 路径 | `/tasks/{taskId}` |
| 说明 | 标记完成、改优先级等 |
| 需要登录 | 是 |
| 涉及表 | `project_tasks` |

**请求体：**

```json
{
  "status": "done"
}
```

---

## 8. 收藏模块

### 8.1 收藏项目

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/favorites/{projectId}` |
| 说明 | 发现页收藏 |
| 需要登录 | 是 |
| 涉及表 | `user_favorites` |

---

### 8.2 取消收藏

| 项 | 内容 |
|----|------|
| 方法 | `DELETE` |
| 路径 | `/favorites/{projectId}` |
| 说明 | 取消收藏 |
| 需要登录 | 是 |
| 涉及表 | `user_favorites` |

---

### 8.3 我的收藏列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/favorites` |
| 说明 | 我的 → 收藏项目 |
| 需要登录 | 是 |
| 涉及表 | `user_favorites`, `projects` |

---

## 9. 消息模块

### 9.1 会话列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/conversations` |
| 说明 | 消息首页列表 |
| 需要登录 | 是 |
| 涉及表 | `conversations`, `conversation_users` |

**响应 data.list 单项：**

```json
{
  "id": 1,
  "type": "project",
  "name": "学习计划小助手小组",
  "lastMessage": "明天下午确认原型范围可以吗？",
  "lastMessageAt": "2026-07-21T14:30:00",
  "unreadCount": 2,
  "aiTag": "需确认原型范围"
}
```

---

### 9.2 会话详情（消息记录）

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/conversations/{conversationId}/messages` |
| 说明 | 聊天窗口历史消息 |
| 需要登录 | 是 |
| 涉及表 | `messages`, `users` |

**Query 参数：** `page`, `pageSize`（按时间倒序）

**响应 data.list 单项：**

```json
{
  "id": 100,
  "senderId": 2,
  "senderNickname": "李明",
  "senderAvatar": "https://...",
  "content": "明天下午确认原型范围可以吗？",
  "aiTag": null,
  "createdAt": "2026-07-21T14:30:00"
}
```

---

### 9.3 发送消息

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/conversations/{conversationId}/messages` |
| 说明 | 发送文字消息 |
| 需要登录 | 是 |
| 涉及表 | `messages`, `conversations`, `conversation_users` |

**请求体：**

```json
{
  "content": "可以的，我明天下午有空"
}
```

---

### 9.4 标记会话已读

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/conversations/{conversationId}/read` |
| 说明 | 进入聊天页后清零未读数 |
| 需要登录 | 是 |
| 涉及表 | `conversation_users` |

---

### 9.5 联系发布人（创建私聊/项目会话）

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/conversations` |
| 说明 | 详情页「联系发布人」，无会话则创建 |
| 需要登录 | 是 |
| 涉及表 | `conversations`, `conversation_users` |

**请求体：**

```json
{
  "type": "private",
  "targetUserId": 2,
  "projectId": 1
}
```

**响应 data：** 返回 `conversationId`

---

## 10. AI 模块（问培风）

### 10.1 发送问题

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/ai/chat` |
| 说明 | 问培风：用户提问，AI 回复 |
| 需要登录 | 是 |
| 涉及表 | `ai_chats` |

**请求体：**

```json
{
  "content": "今天要处理什么？"
}
```

**响应 data：**

```json
{
  "reply": "今天建议优先处理以下 3 件事：\n1. 确认学习计划小助手的项目周期\n2. 回复李明的原型范围消息\n3. 查看王同学的加入申请",
  "suggestions": [
    {"type": "task", "refId": 1, "title": "确认项目周期"},
    {"type": "message", "refId": 5, "title": "回复李明"},
    {"type": "application", "refId": 8, "title": "王同学的申请"}
  ]
}
```

---

### 10.2 对话历史

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/ai/chat/history` |
| 说明 | 问培风历史记录 |
| 需要登录 | 是 |
| 涉及表 | `ai_chats` |

**Query 参数：** `page`, `pageSize`

---

## 11. 页面 ↔ 接口对照（前端开发速查）

| 页面 | 主要调用的接口 |
|------|---------------|
| 登录/注册 | POST `/auth/register`, POST `/auth/login` |
| 发现首页 | GET `/projects` |
| 搜索 | GET `/projects?keyword=xxx` |
| 项目详情 | GET `/projects/{id}`, POST `/projects/{id}/applications` |
| 发布页 | POST `/projects/ai-draft`, POST `/projects`, PUT `/projects/{id}` |
| 项目 Tab | GET `/projects/mine?status=ongoing` 等 |
| 项目待办 | GET `/tasks/mine`, PATCH `/tasks/{id}` |
| 消息列表 | GET `/conversations` |
| 聊天窗口 | GET `/conversations/{id}/messages`, POST `/conversations/{id}/messages` |
| 我的 | GET `/auth/me`, GET `/favorites`, GET `/projects/drafts` |
| 编辑资料 | PUT `/users/me`, PUT `/users/me/skills` |
| 项目申请 | GET `/applications/mine`, PATCH `/applications/{id}` |
| 问培风 | POST `/ai/chat`, GET `/ai/chat/history` |

---

## 12. 建议开发顺序

与数据库文档保持一致，按接口分批实现：

| 步骤 | 接口 | 前后端可联调 |
|------|------|-------------|
| 1 | 注册、登录、GET `/auth/me` | 登录流程 |
| 2 | PUT `/users/me`、技能接口 | 我的页 |
| 3 | POST/GET `/projects`、GET `/projects/{id}` | 发布 + 发现 + 详情 |
| 4 | 收藏三个接口 | 发现页收藏 |
| 5 | 申请四个接口 | 申请加入流程 |
| 6 | `/projects/mine`、任务四个接口 | 项目页 |
| 7 | 消息五个接口 | 消息页 |
| 8 | AI 两个接口 | 问培风 |

---

## 13. 以后扩展的接口（第一版不做）

| 接口 | 用途 |
|------|------|
| GET `/feed/posts` | 社区动态 |
| GET `/knowledge` | 知识库 |
| POST `/projects/{id}/reviews` | 项目复盘 |
| POST `/projects/{id}/files` | 文件上传 |
| GET `/notifications` | 系统通知 |
| POST `/friends/request` | 好友申请 |

---

*文档版本：v1.0 | 对应 OPC 简化版数据库 v2.0*

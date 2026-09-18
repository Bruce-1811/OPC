# One-Person-Campany（可运行代码）

本目录是 OPC 的**可运行代码**。产品说明见上级 [`../opc介绍/`](../opc介绍/)；部署与交接见 [`../opc交付/`](../opc交付/)。

---

## 子目录说明

| 目录 | 作用 |
|------|------|
| **`opc-web/`** | 前端（React + Vite）。开发默认端口 `5173`，`/api` 代理到后端 `8080`。 |
| **`opc-server/`** | 业务后端（Express）。默认端口 `8080`，负责鉴权、业务 API，并转发问培风到 AI 服务。 |
| **`opc-aiservices/`** | Python AI 服务（FastAPI）。默认端口 `8000`，调用大模型；密钥放本目录 `.env`。 |
| **`sql/`** | MySQL 建表脚本（仓库内权威副本）。改表请改这里，并同步 `opc-server/prisma`。 |

```
One-Person-Campany/
├── opc-web/
├── opc-server/
├── opc-aiservices/
└── sql/
```

---

## 本地启动（终端）

前提：已安装 Node.js、MySQL、Python3。在 `One-Person-Campany` 下操作。

### 1. 建库建表

```bash
mysql -u root -p < sql/init_all.sql
# 或使用业务用户：mysql -u opc -p opc < sql/init_all.sql
```

### 2. 启动 AI（可选，问培风需要）

```bash
cd opc-aiservices
python3 -m venv .venv
source .venv/bin/activate          # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. 启动后端

```bash
cd opc-server
cp .env.example .env               # Windows: copy .env.example .env
# 编辑 DATABASE_URL、JWT_SECRET、AI_SERVICE_URL=http://127.0.0.1:8000
npm install
npm run prisma:generate
npm run dev
```

检查：`curl http://127.0.0.1:8080/api/health`

### 4. 启动前端

```bash
cd opc-web
npm install
npm run dev
```

浏览器：`http://localhost:5173`

**建议顺序：** MySQL → AI(`8000`) → 后端(`8080`) → 前端(`5173`)

---

## 服务器常用指令（Ubuntu + PM2 + Nginx）

路径按实际部署修改（示例：`/root/LiZihao/OPC/One-Person-Campany`）。

### 查看状态

```bash
pm2 status
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8000/health
curl http://127.0.0.1/api/health
```

### 启动 / 重启后端

```bash
cd /root/LiZihao/OPC/One-Person-Campany/opc-server
npm run build
pm2 start dist/index.js --name opc-server --cwd /root/LiZihao/OPC/One-Person-Campany/opc-server
# 已存在：
pm2 restart opc-server
```

### 启动 / 重启 AI

```bash
pm2 start /root/LiZihao/OPC/One-Person-Campany/opc-aiservices/.venv/bin/uvicorn \
  --name opc-ai \
  --interpreter none \
  --cwd /root/LiZihao/OPC/One-Person-Campany/opc-aiservices \
  -- main:app --host 127.0.0.1 --port 8000
# 已存在：
pm2 restart opc-ai
```

### 更新前端静态资源

```bash
cd /root/LiZihao/OPC/One-Person-Campany/opc-web
npm run build
chmod -R 755 dist
systemctl reload nginx
```

### 其他

```bash
pm2 logs opc-server --lines 50
pm2 save
systemctl start mysql
```

完整云部署步骤见 [`../opc交付/04-网页部署流程（当前已部署完成）.md`](../opc交付/04-网页部署流程（当前已部署完成）.md)；接手说明见 [`../opc交付/06-接手开发运行手册.md`](../opc交付/06-接手开发运行手册.md)。

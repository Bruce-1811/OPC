# One-Person-Company（OPC）代码仓库

本目录为 OPC 项目的**可运行代码**；产品介绍见 [`../opc介绍/`](../opc介绍/)，工程文档见 [`../opc开发/`](../opc开发/)。

## 技术栈（已定）

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + TypeScript + React Router + Ant Design Mobile |
| 后端 | Node.js + Express + TypeScript + Prisma + JWT |
| 数据库 | MySQL 8 |

## 目录结构

```
One-Person-Campany/
├── sql/              # MySQL 建表脚本（仓库内唯一副本，改表请改这里并同步 Prisma）
├── opc-web/          # 前端
└── opc-server/       # 后端
```

## 快速开始

### 1. 建库建表

在项目根目录 `One-Person-Campany` 下（需已安装 MySQL）：

```bash
mysql -u root -p < sql/init_all.sql
```

### 2. 启动后端

```bash
cd opc-server
copy .env.example .env    # Windows；Mac/Linux 用 cp
# 编辑 .env 中的 DATABASE_URL 和 JWT_SECRET
npm install
npm run prisma:generate
npm run dev
```

访问：http://localhost:8080/api/health

### 3. 启动前端

```bash
cd opc-web
npm install
npm run dev
```

访问：http://localhost:5173（顶部会显示后端连接状态）

相关文档（上级目录）：

- [`../opc开发/OPC-项目开发大纲.md`](../opc开发/OPC-项目开发大纲.md)
- [`../opc开发/OPC-API接口清单.md`](../opc开发/OPC-API接口清单.md)
- [`../opc开发/OPC后端数据库设计.md`](../opc开发/OPC后端数据库设计.md)
- 产品与原型：[`../opc介绍/`](../opc介绍/)

# 智能动态题库平台 — 项目完整文档

> 版本：V1.0 · 最后更新：2026-06-24
> 在线地址：https://quiz-platform-21v2.vercel.app
> GitHub：https://github.com/chuanzixun-sketch/quiz-platform

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [数据库设计](#4-数据库设计)
5. [API 接口文档](#5-api-接口文档)
6. [认证系统](#6-认证系统)
7. [部署配置](#7-部署配置)
8. [开发指南](#8-开发指南)
9. [常见问题排查](#9-常见问题排查)

---

## 1. 项目概述

轻量级 SaaS 题库平台，核心理念：**上传题库 → 自动生成题库 → 在线刷题 → AI 辅助学习**。面向 10 人以内小团队使用。

### 核心功能

| 功能模块 | 说明 |
|---------|------|
| 用户认证 | 邮箱注册/登录，JWT Token |
| 题库管理 | 创建/编辑/删除题库，支持私密/共享/公开 |
| 题目管理 | 添加/编辑/删除题目（单选/多选/判断/填空/简答） |
| 刷题引擎 | 顺序/随机/限时三种模式，自动评分 |
| Excel/CSV 导入 | 批量导入题目 |
| 错题本 | 自动收录错题，标记已掌握 |
| 收藏夹 | 收藏重要题目 |
| 学习统计 | 学习趋势图、答题记录 |
| AI 辅助 | DeepSeek 集成：自动批改、题目讲解 |

---

## 2. 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **Next.js 14** (App Router) | 框架 |
| **React 18** | UI 库 |
| **TypeScript** | 类型安全 |
| **Zustand** | 状态管理（authStore + quizStore） |
| **Tailwind CSS** | 样式（通过 `globals.css` 自定义类） |
| **lucide-react** | 图标库 |
| **xlsx** | Excel/CSV 解析 |

### 后端

| 技术 | 用途 |
|------|------|
| **Next.js API Routes** | 服务端 API |
| **pg** (node-postgres) | PostgreSQL 连接池 |
| **bcryptjs** | 密码加密 |
| **jsonwebtoken** | JWT 认证令牌 |
| **PostgreSQL 15** | 数据库（阿里云 RDS） |

### 部署

| 平台 | 用途 |
|------|------|
| **阿里云 RDS** | PostgreSQL 数据库（华北2 北京） |
| **Vercel** | 前端 + API 托管（Hobby 免费版） |
| **GitHub** | 代码仓库 |

---

## 3. 项目结构

```
quiz-platform/
├── .env.local                    ← 环境变量（不上传 Git，仅本地）
├── .eslintrc.json                ← ESLint 配置
├── .gitignore                    ← Git 忽略规则
├── next.config.mjs               ← Next.js 配置
├── tailwind.config.ts            ← Tailwind 配置
├── tsconfig.json                 ← TypeScript 配置
├── package.json                  ← 依赖清单
├── supabase/
│   └── init.sql                  ← 数据库建表脚本（自建 PostgreSQL 版）
│
└── src/
    ├── types/
    │   └── index.ts              ← 所有 TS 类型定义（14 个接口）
    │
    ├── lib/
    │   ├── db.ts                 ← PostgreSQL 连接池
    │   ├── auth-server.ts        ← JWT + bcrypt 服务端工具
    │   ├── auth.tsx              ← 认证上下文（AuthProvider + useAuth）
    │   ├── api.ts                ← 前端 API 请求封装
    │   └── supabase.ts           ← 旧 Supabase 客户端（保留但不再使用）
    │
    ├── store/
    │   ├── authStore.ts          ← Zustand 认证状态
    │   └── quizStore.ts          ← Zustand 刷题状态（localStorage 持久化）
    │
    ├── components/
    │   └── Sidebar.tsx           ← 侧边导航栏
    │
    └── app/
        ├── layout.tsx            ← 根布局（AuthProvider + Sidebar）
        ├── page.tsx              ← 首页（自动重定向）
        ├── globals.css           ← 全局样式
        ├── (auth)/
        │   ├── login/page.tsx    ← 登录页
        │   └── register/page.tsx ← 注册页
        ├── dashboard/page.tsx    ← 仪表盘
        ├── libraries/
        │   ├── page.tsx          ← 题库列表
        │   └── [id]/
        │       ├── page.tsx      ← 题库详情
        │       ├── quiz/page.tsx ← 刷题引擎
        │       └── import/page.tsx ← Excel/CSV 导入
        ├── wrong/page.tsx        ← 错题本
        ├── favorites/page.tsx    ← 收藏夹
        ├── stats/page.tsx        ← 学习统计
        ├── settings/ai/page.tsx  ← AI 设置
        └── api/                  ← 服务端 API 路由
            ├── auth/
            │   ├── login/route.ts
            │   ├── register/route.ts
            │   └── me/route.ts
            ├── libraries/
            │   ├── route.ts
            │   └── [id]/
            │       ├── route.ts
            │       ├── questions/route.ts
            │       └── questions/[qid]/route.ts
            ├── questions/route.ts
            ├── attempts/route.ts
            ├── wrong-questions/route.ts
            ├── favorites/route.ts
            ├── study-sessions/route.ts
            ├── stats/route.ts
            ├── ai-settings/route.ts
            ├── ai/
            │   ├── explain/route.ts
            │   └── grade/route.ts
            └── import/upload/route.ts
```

---

## 4. 数据库设计

### 表清单（共 12 张表）

| 表名 | 用途 | 核心字段 |
|------|------|---------|
| `users` | 用户 | email, password_hash |
| `libraries` | 题库 | owner_id, name, visibility, question_count |
| `questions` | 题目 | library_id, question_content(JSONB), answer(JSONB), difficulty |
| `attempts` | 答题记录 | user_id, question_id, is_correct, user_answer |
| `wrong_questions` | 错题本 | user_id, question_id, wrong_count, mastered |
| `favorites` | 收藏 | user_id, question_id |
| `study_sessions` | 学习记录 | user_id, questions_answered, correct_count |
| `ai_settings` | AI 设置 | user_id, provider, api_key, model |
| `user_question_status` | 题目学习状态 | user_id, question_id, status, confidence |
| `user_stats` | 用户统计 | total_attempts, total_correct, current_streak |
| `categories` | 分类 | user_id, name, color |
| `tags` / `question_tags` | 标签 | name / question_id + tag_id |

### 完整建表 SQL

见 `supabase/init.sql`（512 行），包含：
- 所有表定义
- 唯一约束 + 外键约束
- 性能索引（GIN, B-tree）
- `updated_at` 自动更新触发器
- `question_count` 自动计数触发器
- `user_stats` 答题统计自动更新触发器
- 新用户自动创建记录触发器

### 数据库连接

```
主机: pgm-2zez6zxqm471sq0j9o.pg.rds.aliyuncs.com
端口: 5432
数据库: quiz_platform
用户: 17854037179
```

---

## 5. API 接口文档

### 认证 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/me` | 获取当前用户 | Bearer Token |

### 题库 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/libraries` | 获取题库列表 | 是 |
| GET | `/api/libraries?id=xxx` | 获取单个题库 | 是 |
| POST | `/api/libraries` | 创建题库 | 是 |
| PUT | `/api/libraries/[id]` | 更新题库 | 是 |
| DELETE | `/api/libraries/[id]` | 删除题库 | 是 |

### 题目 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/libraries/[id]/questions` | 获取题目列表 | 是 |
| POST | `/api/libraries/[id]/questions` | 创建题目 | 是 |
| PUT | `/api/libraries/[id]/questions/[qid]` | 更新题目 | 是 |
| DELETE | `/api/libraries/[id]/questions/[qid]` | 删除题目 | 是 |
| GET | `/api/questions?ids=a,b,c` | 批量查询题目 | 是 |

### 答题 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/attempts` | 批量提交作答记录 | 是 |
| POST | `/api/study-sessions` | 保存学习记录 | 是 |
| GET | `/api/study-sessions` | 获取学习记录 | 是 |
| GET | `/api/stats` | 获取统计概览 | 是 |

### 错题本 & 收藏 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/wrong-questions` | 获取错题列表 | 是 |
| POST | `/api/wrong-questions` | 添加错题 | 是 |
| PUT | `/api/wrong-questions` | 标记已掌握 | 是 |
| GET | `/api/favorites` | 获取收藏列表 | 是 |
| POST | `/api/favorites` | 添加收藏 | 是 |
| DELETE | `/api/favorites?id=xxx` | 取消收藏 | 是 |

### 设置 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/ai-settings` | 获取 AI 设置 | 是 |
| PUT | `/api/ai-settings` | 保存 AI 设置 | 是 |

### AI 功能 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/ai/explain` | AI 题目讲解 | 是 |
| POST | `/api/ai/grade` | AI 自动批改 | 是 |

---

## 6. 认证系统

### 架构

```
前端请求 → Authorization: Bearer <token>
       ↓
API Route → getUserIdFromRequest() 解析 JWT
       ↓
PostgreSQL 执行 SQL（WHERE user_id = $1）
```

### JWT 配置

- **算法**：HS256
- **密钥**：`JWT_SECRET` 环境变量（开发：`quiz-platform-jwt-secret-change-in-production`）
- **过期时间**：7 天
- **载荷**：`{ userId: string, email: string }`

### 密码加密

- **算法**：bcrypt（salt rounds: 10）
- **库**：bcryptjs

### Token 管理

- **存储**：localStorage（key: `quiz_token`）
- **附带头**：`Authorization: Bearer <token>`
- **清除**：退出登录时清除 localStorage

---

## 7. 部署配置

### 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@host:5432/quiz_platform` |
| `JWT_SECRET` | JWT 签名密钥 | `quiz-platform-jwt-secret-change-in-production` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxx` |

### 阿里云 RDS

| 配置 | 值 |
|------|-----|
| 地域 | 华北2（北京）可用区 H |
| 系列 | 基础系列 |
| 规格 | 常规实例 |
| 存储 | ESSD PL1 云盘 |
| 白名单 | `0.0.0.0/0`（开发用） |
| 外网地址 | `pgm-2zez6zxqm471sq0j9o.pg.rds.aliyuncs.com:5432` |

### Vercel

- **框架**：Next.js 14
- **Node.js 版本**：自动检测
- **构建命令**：`npm run build`（默认）
- **输出目录**：`.next`（默认）

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置 .env.local
DATABASE_URL=postgresql://user:pass@host:5432/quiz_platform
JWT_SECRET=quiz-platform-jwt-secret-change-in-production
DEEPSEEK_API_KEY=sk-xxx

# 3. 启动
npm run dev
# 访问 http://localhost:3000
```

---

## 8. 开发指南

### 新增页面

1. 在 `src/app/` 下创建目录（如 `src/app/new-feature/page.tsx`）
2. 如果页面向导，使用 `'use client'` 指令
3. 如果需要数据，通过 `useAuth()` 获取用户，用 `apiFetch()` 请求 API
4. 在 `Sidebar.tsx` 中 `navItems` 数组添加导航项

### 新增 API

1. 在 `src/app/api/` 下创建对应目录和 `route.ts`
2. 使用 `getUserIdFromRequest()` 获取当前用户 ID
3. 使用 `query()` 函数执行 SQL
4. 返回 `NextResponse.json()`

### 前端调用 API 模板

```typescript
import { apiFetch } from '@/lib/api';

// GET 请求
const { data, error } = await apiFetch<ResponseType>('/api/xxx');

// POST/PUT 请求
const { data, error } = await apiFetch<ResponseType>('/api/xxx', {
  method: 'POST',
  body: { key: 'value' },
});

// DELETE 请求
const { error } = await apiFetch('/api/xxx', { method: 'DELETE' });
```

### 开发注意事项

1. **禁止前端直连数据库**——所有数据操作必须通过 API Routes
2. **AI 调用必须在服务端**——DeepSeek API Key 不能暴露到浏览器
3. **JWT 密钥生产环境必须更换**——不要使用默认值
4. **新表需要加 RLS 等价物**——在 SQL 中通过 `user_id` 字段做行级过滤

---

## 9. 常见问题排查

### 编译失败 - ESLint 错误

在 `.eslintrc.json` 中已配置宽松规则。如果新增代码触发 ESLint，可以：

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

### 数据库连不上

- 检查 RDS 白名单是否包含 `0.0.0.0/0`
- 确认 DATABASE_URL 中的用户密码是否正确
- 确认数据库 `quiz_platform` 已创建

### Vercel 部署失败

- 检查 **Environment Variables** 是否完整（DATABASE_URL、JWT_SECRET、DEEPSEEK_API_KEY）
- 构建日志中找 `Failed to compile.` 后的错误信息
- 本地运行 `npm run build` 先验证本地能编译

### API 返回 401

- 检查 `apiFetch()` 是否正确携带了 `Authorization` header
- 确认 localStorage 中的 `quiz_token` 未过期
- 重新登录获取新 token

### 注册后提示 "Failed to fetch"

- 前端请求发到了 `localhost:3000` 而不是 Vercel 域名
- 确保 `src/lib/api.ts` 中使用相对路径（已修复）

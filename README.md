# 智能动态题库平台

> 轻量级 SaaS 题库平台 · V1.0
> 在线刷题 · 智能批改 · AI 辅助学习

| | |
|---|---|
| 🌐 在线地址 | https://quiz-platform-21v2.vercel.app |
| 📦 代码仓库 | https://github.com/chuanzixun-sketch/quiz-platform |
| 🗄️ 数据库 | 阿里云 RDS PostgreSQL（华北2 北京） |
| ⚡ 技术栈 | Next.js 14 + TypeScript + PostgreSQL + JWT |

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.local 填写）
# DATABASE_URL=postgresql://user:pass@host:5432/quiz_platform
# JWT_SECRET=your-secret-key
# DEEPSEEK_API_KEY=sk-xxx

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
# http://localhost:3000
```

---

## 项目文档

| 文件 | 说明 |
|------|------|
| 📄 `PROJECT_DOCS.md` | **完整项目文档**（架构、API、数据库、部署、开发指南） |
| 🗄️ `supabase/init.sql` | 数据库建表 SQL（12 张表 + 触发器 + 索引） |
| 📋 `_docs/产品需求.docx` | 产品需求文档（PRD） |
| 🗃️ `_docs/数据库设计.docx` | 数据库设计（18 张表设计） |
| 🎨 `_docs/ui设计方案.docx` | UI 工程规范 |
| ⚙️ `_docs/开发执行方案.docx` | 开发规范 |
| 🤖 `_docs/ai 提示词.docx` | AI 提示词设计 |

---

## 核心功能

- **📚 题库管理** — 创建/编辑/删除题库，支持私密/共享/公开
- **📝 题目管理** — 单选/多选/判断/填空/简答，支持难度标记
- **🎯 刷题引擎** — 顺序/随机/限时三种模式，自动评分
- **📥 Excel/CSV 导入** — 批量导入题目
- **📕 错题本** — 自动收录错题，标记已掌握
- **⭐ 收藏夹** — 收藏重要题目
- **📊 学习统计** — 学习趋势图、答题记录
- **🤖 AI 辅助** — DeepSeek 集成：自动批改、题目讲解

---

## 环境变量

| 变量 | 是否必填 | 说明 |
|------|---------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `JWT_SECRET` | ✅ | JWT 签名密钥 |
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |

---

## 技术架构

```
用户浏览器 ──→ Vercel (Next.js)
                  │
            API Routes (服务端)
                  │
                  ├── JWT 认证 (jsonwebtoken + bcryptjs)
                  │
                  └── PostgreSQL (阿里云 RDS)
```

## 数据库

12 张表，包含：
- `users` — 用户表（替代 Supabase auth.users）
- `libraries` — 题库表
- `questions` — 题目表（JSONB 存储）
- `attempts` — 答题记录
- `wrong_questions` — 错题本
- `favorites` — 收藏
- `study_sessions` — 学习记录
- `ai_settings` — AI 设置
- `user_question_status` — 题目进度
- `user_stats` — 用户统计
- `categories` / `tags` — 分类标签

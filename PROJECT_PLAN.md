# 📋 Nookmark Web - 完整项目方案文档

## 项目概述

### 产品定位
**Nookmark Web** 是一个现代化的**书签管理 SaaS 应用**，帮助用户高效管理和组织网页书签。

### 核心价值
- 🔐 **安全可靠**：云端存储，跨设备同步
- 🏷️ **智能标签**：灵活的标签系统，快速分类
- 🔍 **强大搜索**：全文搜索，多维度过滤
- 🎨 **现代化 UI**：简洁美观，响应式设计
- ⚡ **高性能**：快速加载，流畅体验

### 目标用户
- 重度浏览器用户
- 知识工作者
- 内容创作者
- 开发者

---

## 技术架构

### 技术栈

```
全栈框架
├── React Router v7 (全栈框架，包含前端路由 + 服务端 API)
├── React 19 (UI 层)
└── TypeScript (类型安全)

UI/样式
├── Tailwind CSS 4 (样式系统)
├── Shadcn UI (组件库)
└── Phosphor Icons (图标)

数据层
├── Neon PostgreSQL (数据库)
├── Drizzle ORM (类型安全 ORM)
└── Drizzle Kit (数据库迁移工具)

认证
└── Better Auth (认证系统)
    ├── Google OAuth
    └── 邮箱密码登录

开发工具
├── Vite 5 (构建工具)
├── pnpm (包管理)
├── ESLint + Prettier (代码规范)
└── TypeScript (类型检查)

部署
├── Vercel (前端 + SSR)
└── Neon (数据库)
```

### 架构特点

**全栈一体化**：
- 单一代码库（Monorepo 可选）
- 路由文件同时包含 UI 和 API 逻辑
- 类型安全的端到端通信

**性能优化**：
- 服务端渲染 (SSR)
- 自动代码分割
- 路由预加载
- 数据库索引优化

**开发体验**：
- 热模块替换 (HMR)
- 自动类型推导
- 声明式路由
- 表单自动处理

---

## 数据库设计

### ER 图（概念模型）

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │───┐
│ email       │   │
│ name        │   │
│ image       │   │
│ created_at  │   │
└─────────────┘   │
                  │
                  │ 1:N
                  │
                  ├─────────────────────┐
                  │                     │
                  ▼                     ▼
         ┌─────────────┐       ┌─────────────┐
         │  bookmarks  │       │    tags     │
         │─────────────│       │─────────────│
         │ id (PK)     │───┐   │ id (PK)     │───┐
         │ user_id(FK) │   │   │ user_id(FK) │   │
         │ url         │   │   │ name        │   │
         │ title       │   │   │ color       │   │
         │ description │   │   │ usage_count │   │
         │ favicon     │   │   │ created_at  │   │
         │ starred     │   │   └─────────────┘   │
         │ archived_at │   │                     │
         │ deleted_at  │   │                     │
         │ created_at  │   │                     │
         │ updated_at  │   │                     │
         └─────────────┘   │                     │
                          │                     │
                          │ M:N                 │
                          │                     │
                          ▼                     │
                 ┌──────────────────┐           │
                 │  bookmark_tags   │◄──────────┘
                 │──────────────────│
                 │ id (PK)          │
                 │ bookmark_id (FK) │
                 │ tag_id (FK)      │
                 │ created_at       │
                 └──────────────────┘
```

### 表结构定义

#### **users 表**（用户表）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  email_verified BOOLEAN DEFAULT false,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### **bookmarks 表**（书签表）
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  starred BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 复合唯一索引：同一用户不能重复添加相同 URL
  CONSTRAINT unique_user_url UNIQUE (user_id, url)
);

-- 性能索引
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_starred ON bookmarks(starred) WHERE starred = true;
CREATE INDEX idx_bookmarks_deleted ON bookmarks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookmarks_created ON bookmarks(created_at DESC);

-- 全文搜索索引（PostgreSQL）
CREATE INDEX idx_bookmarks_search ON bookmarks
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

#### **tags 表**（标签表）
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  -- 复合唯一索引：同一用户的标签名唯一
  CONSTRAINT unique_user_tag UNIQUE (user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

#### **bookmark_tags 表**（书签-标签关联表）
```sql
CREATE TABLE bookmark_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- 防止重复关联
  CONSTRAINT unique_bookmark_tag UNIQUE (bookmark_id, tag_id)
);

CREATE INDEX idx_bookmark_tags_bookmark ON bookmark_tags(bookmark_id);
CREATE INDEX idx_bookmark_tags_tag ON bookmark_tags(tag_id);
```

#### **sessions 表**（会话表 - Better Auth 自动管理）
```sql
-- Better Auth 会自动创建，这里仅作参考
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 数据字段说明

| 字段 | 类型 | 说明 | 索引 |
|------|------|------|------|
| `id` | UUID | 主键，自动生成 | PRIMARY |
| `user_id` | UUID | 外键，关联用户 | INDEX |
| `url` | TEXT | 书签 URL | - |
| `title` | TEXT | 书签标题 | FULLTEXT |
| `description` | TEXT | 书签描述（可选） | FULLTEXT |
| `favicon` | TEXT | 网站图标 URL | - |
| `starred` | BOOLEAN | 是否收藏 | INDEX |
| `archived_at` | TIMESTAMP | 归档时间（NULL = 未归档） | - |
| `deleted_at` | TIMESTAMP | 软删除时间（NULL = 未删除） | INDEX |
| `created_at` | TIMESTAMP | 创建时间 | INDEX DESC |
| `updated_at` | TIMESTAMP | 更新时间 | - |

### 业务规则

1. **URL 唯一性**：同一用户不能重复添加相同 URL（`UNIQUE (user_id, url)`）
2. **软删除**：删除书签时设置 `deleted_at`，可恢复
3. **级联删除**：删除用户时自动删除所有关联数据
4. **标签计数**：`usage_count` 字段缓存标签使用次数，提升查询性能
5. **数据隔离**：所有数据通过 `user_id` 隔离，保证多租户安全

---

## 项目结构

```
nookmark-web/
├── app/                              # 应用主目录
│   ├── routes/                       # 路由文件（UI + API）
│   │   ├── _index.tsx                   # 首页（营销页）
│   │   ├── login.tsx                    # 登录页
│   │   ├── register.tsx                 # 注册页
│   │   ├── dashboard/                   # 受保护的路由
│   │   │   ├── _layout.tsx                 # Dashboard 布局
│   │   │   ├── bookmarks.tsx               # 书签列表页
│   │   │   ├── bookmarks.$id.tsx           # 书签详情页
│   │   │   ├── tags.tsx                    # 标签管理页
│   │   │   ├── starred.tsx                 # 收藏页
│   │   │   ├── archived.tsx                # 归档页
│   │   │   ├── trash.tsx                   # 回收站页
│   │   │   └── settings.tsx                # 设置页
│   │   └── api/                         # API 路由
│   │       ├── auth.$.tsx                  # Better Auth 处理
│   │       └── bookmarks/                  # RESTful API（可选）
│   │           ├── index.tsx                  # GET /api/bookmarks
│   │           └── $id.tsx                    # GET/PUT/DELETE /api/bookmarks/:id
│   ├── components/                   # React 组件
│   │   ├── ui/                          # Shadcn UI 组件
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/                      # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── bookmark/                    # 书签相关组件
│   │   │   ├── BookmarkCard.tsx
│   │   │   ├── BookmarkList.tsx
│   │   │   ├── BookmarkForm.tsx
│   │   │   ├── AddBookmarkDialog.tsx
│   │   │   └── DeleteConfirm.tsx
│   │   ├── tag/                         # 标签相关组件
│   │   │   ├── TagInput.tsx
│   │   │   ├── TagBadge.tsx
│   │   │   └── TagCloud.tsx
│   │   └── common/                      # 通用组件
│   │       ├── SearchBar.tsx
│   │       ├── FilterBar.tsx
│   │       ├── Pagination.tsx
│   │       ├── EmptyState.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/                          # 工具库
│   │   ├── db/                          # 数据库
│   │   │   ├── index.ts                    # Drizzle 实例
│   │   │   ├── schema.ts                   # 数据表定义
│   │   │   └── queries.ts                  # 复用查询函数
│   │   ├── auth/                        # 认证
│   │   │   ├── auth.server.ts              # Better Auth 服务端
│   │   │   ├── auth.client.ts              # Better Auth 客户端
│   │   │   └── require-auth.ts             # 认证中间件
│   │   ├── services/                    # 业务逻辑服务
│   │   │   ├── bookmark.service.ts         # 书签服务
│   │   │   ├── tag.service.ts              # 标签服务
│   │   │   └── favicon.service.ts          # Favicon 获取
│   │   ├── utils/                       # 工具函数
│   │   │   ├── cn.ts                       # classNames 合并
│   │   │   ├── format.ts                   # 日期/字符串格式化
│   │   │   └── validation.ts               # 表单验证
│   │   └── constants.ts                 # 全局常量
│   ├── hooks/                        # React Hooks
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   └── use-clipboard.ts
│   ├── styles/                       # 样式文件
│   │   └── globals.css
│   ├── types/                        # TypeScript 类型
│   │   └── index.ts
│   ├── root.tsx                      # 根组件
│   └── entry.server.tsx              # 服务端入口
├── public/                           # 静态资源
│   ├── favicon.ico
│   └── images/
├── drizzle/                          # 数据库迁移文件（自动生成）
│   └── migrations/
├── .env                              # 环境变量
├── .env.example                      # 环境变量示例
├── drizzle.config.ts                 # Drizzle 配置
├── react-router.config.ts            # React Router 配置
├── vite.config.ts                    # Vite 配置
├── tailwind.config.ts                # Tailwind 配置
├── components.json                   # Shadcn UI 配置
├── tsconfig.json                     # TypeScript 配置
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

## 渐进式开发计划

### 开发策略

采用 **MVP → 核心功能 → 增强功能 → 高级功能** 的四阶段迭代模式。

---

## 🎯 阶段 0：项目初始化（Week 1）

### 目标
搭建项目基础架构，完成开发环境配置。

### 任务清单

#### 1. **项目创建**
```bash
# 创建 React Router 项目
npx create-react-router@latest nookmark-web
cd nookmark-web

# 安装依赖
pnpm install

# 安装核心依赖
pnpm add drizzle-orm @neondatabase/serverless better-auth zod
pnpm add -D drizzle-kit @types/node

# 安装 UI 依赖
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card dialog form

# 安装图标库
pnpm add @phosphor-icons/react
```

#### 2. **数据库设置**
- 注册 Neon 账号
- 创建数据库实例
- 配置 `.env` 文件

```env
# .env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/nookmark"
BETTER_AUTH_SECRET="your-random-secret-32-chars"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
APP_URL="http://localhost:5173"
```

#### 3. **基础配置**
- 配置 `drizzle.config.ts`
- 配置 `tailwind.config.ts`
- 配置 `tsconfig.json`
- 创建 `.env.example`

#### 4. **初始化数据库 Schema**
```typescript
// app/lib/db/schema.ts
export const users = pgTable("users", { ... });
export const sessions = pgTable("sessions", { ... });
```

```bash
# 生成迁移
pnpm drizzle-kit generate

# 应用迁移
pnpm drizzle-kit migrate
```

#### 5. **配置 Better Auth**
```typescript
// app/lib/auth/auth.server.ts
export const auth = betterAuth({
  database: drizzleAdapter(db),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

### 交付物
- ✅ 项目脚手架
- ✅ 数据库连接成功
- ✅ Tailwind CSS 生效
- ✅ Shadcn UI 组件可用
- ✅ Better Auth 配置完成

---

## 🚀 阶段 1：MVP 版本（Week 2-3）

### 目标
实现最小可用产品，核心流程跑通。

### 功能范围

#### ✅ 用户认证
- [ ] 用户注册（邮箱 + 密码）
- [ ] 用户登录
- [ ] 登出
- [ ] 受保护路由

#### ✅ 书签基础功能
- [ ] 添加书签（URL + 标题）
- [ ] 查看书签列表
- [ ] 删除书签（硬删除，暂不做软删除）

#### ✅ 基础 UI
- [ ] 登录/注册页面
- [ ] Dashboard 布局（Header + Sidebar）
- [ ] 书签列表页（简单卡片布局）
- [ ] 添加书签表单

### 数据库 Schema（MVP）

```typescript
// 只实现 users 和 bookmarks 表
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userUrlIdx: uniqueIndex("user_url_idx").on(table.userId, table.url),
}));
```

### 核心路由（MVP）

```typescript
// app/routes/login.tsx
export async function action({ request }) {
  // 处理登录
}

// app/routes/dashboard/bookmarks.tsx
export async function loader({ request }) {
  const session = await requireAuth(request);
  const bookmarks = await db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, session.user.id),
    orderBy: [desc(bookmarks.createdAt)],
  });
  return { bookmarks };
}

export async function action({ request }) {
  const formData = await request.formData();
  // 处理添加书签
}
```

### UI 组件（MVP）

```tsx
// app/components/bookmark/BookmarkCard.tsx
export function BookmarkCard({ bookmark }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{bookmark.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <a href={bookmark.url}>{bookmark.url}</a>
      </CardContent>
      <CardFooter>
        <Form method="post">
          <input type="hidden" name="id" value={bookmark.id} />
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="destructive">删除</Button>
        </Form>
      </CardFooter>
    </Card>
  );
}
```

### 验收标准
- ✅ 用户可以注册和登录
- ✅ 用户可以添加书签
- ✅ 用户可以查看自己的书签列表
- ✅ 用户可以删除书签
- ✅ 数据隔离（用户 A 看不到用户 B 的书签）

---

## 📦 阶段 2：核心功能（Week 4-5）

### 目标
完善核心书签管理功能，提升用户体验。

### 新增功能

#### ✅ 标签系统
- [ ] 添加书签时支持标签
- [ ] 标签自动补全
- [ ] 标签云展示
- [ ] 按标签过滤书签

#### ✅ 搜索功能
- [ ] 全文搜索（标题 + URL）
- [ ] 搜索防抖（300ms）
- [ ] 搜索结果高亮

#### ✅ 书签增强
- [ ] 编辑书签
- [ ] 添加描述字段
- [ ] 自动获取 Favicon
- [ ] 收藏（星标）功能

#### ✅ UI 优化
- [ ] 响应式布局
- [ ] 空状态提示
- [ ] 加载状态
- [ ] Toast 消息提示

### 数据库更新

```typescript
// 添加 tags 和 bookmark_tags 表
export const tags = pgTable("tags", { ... });
export const bookmarkTags = pgTable("bookmark_tags", { ... });

// 更新 bookmarks 表
export const bookmarks = pgTable("bookmarks", {
  // ... 原有字段
  description: text("description"),
  favicon: text("favicon"),
  starred: boolean("starred").default(false),
});
```

### 关键组件

```tsx
// app/components/tag/TagInput.tsx
export function TagInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);

  // 实时查询标签建议
  const debouncedQuery = useDebounce(value, 300);

  useEffect(() => {
    // 获取标签建议
  }, [debouncedQuery]);

  return (
    <div>
      <Input {...props} />
      {suggestions.length > 0 && (
        <TagSuggestions items={suggestions} />
      )}
    </div>
  );
}
```

### API 设计

```typescript
// 搜索书签
GET /dashboard/bookmarks?q=keyword&tags=react,typescript&starred=true

// 标签自动补全
GET /api/tags/suggestions?q=rea
→ ["react", "react-router", "reading-list"]

// 获取 Favicon
POST /api/bookmarks/favicon
{ url: "https://example.com" }
→ { favicon: "https://example.com/favicon.ico" }
```

### 验收标准
- ✅ 可以给书签添加标签
- ✅ 标签输入有自动补全
- ✅ 可以按标签过滤书签
- ✅ 搜索功能正常工作
- ✅ 书签卡片显示 Favicon
- ✅ 可以收藏书签

---

## 🎨 阶段 3：用户体验优化（Week 6-7）

### 目标
优化交互体验，增加实用功能。

### 新增功能

#### ✅ 软删除与回收站
- [ ] 删除书签进入回收站
- [ ] 回收站页面
- [ ] 从回收站恢复
- [ ] 永久删除

#### ✅ 归档功能
- [ ] 归档书签
- [ ] 归档页面
- [ ] 取消归档

#### ✅ 批量操作
- [ ] 批量选择模式
- [ ] 批量删除
- [ ] 批量归档
- [ ] 批量添加标签

#### ✅ 排序与过滤
- [ ] 按时间排序
- [ ] 按标题排序
- [ ] 只看收藏
- [ ] 只看无标签
- [ ] 视图切换（列表/网格）

#### ✅ 分页
- [ ] 分页组件
- [ ] 页面大小可配置（25/50/100）
- [ ] 加载更多（无限滚动，可选）

### UI 增强

```tsx
// app/components/bookmark/BookmarkCard.tsx（增强版）
import { Star } from "@phosphor-icons/react";

export function BookmarkCard({ bookmark, selectable, selected, onSelect }) {
  return (
    <Card className={cn(selected && "ring-2 ring-primary")}>
      {selectable && (
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      )}

      <CardHeader>
        {bookmark.favicon && <img src={bookmark.favicon} />}
        <CardTitle>{bookmark.title}</CardTitle>
        {bookmark.starred && <Star weight="fill" className="text-yellow-500" />}
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground">{bookmark.description}</p>
        <div className="flex gap-2">
          {bookmark.tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="ghost">编辑</Button>
        <Button variant="ghost">归档</Button>
        <DeleteConfirm onConfirm={() => deleteBookmark(bookmark.id)} />
      </CardFooter>
    </Card>
  );
}
```

### 验收标准
- ✅ 删除的书签进入回收站
- ✅ 可以从回收站恢复
- ✅ 支持归档/取消归档
- ✅ 批量操作正常工作
- ✅ 排序和过滤正常
- ✅ 分页功能完善

---

## 🌟 阶段 4：高级功能（Week 8+）

### 目标
增加差异化功能，提升竞争力。

### 功能列表

#### ✅ 导入/导出
- [ ] 导出为 HTML（Netscape Bookmark）
- [ ] 导出为 JSON
- [ ] 导入浏览器书签

#### ✅ Google OAuth 登录
- [ ] Google 登录按钮
- [ ] OAuth 回调处理
- [ ] 用户信息同步

#### ✅ 设置页面
- [ ] 个人资料编辑
- [ ] 密码修改
- [ ] 主题切换（Light/Dark/Auto）
- [ ] 显示偏好设置
- [ ] 账号删除

#### ✅ 暗黑模式
- [ ] 全局暗黑模式支持
- [ ] 主题持久化
- [ ] 跟随系统主题

#### ✅ 统计面板
- [ ] 书签总数
- [ ] 标签总数
- [ ] 最近添加的书签
- [ ] 最常用的标签

#### ✅ 性能优化
- [ ] 虚拟滚动（可选）
- [ ] 图片懒加载
- [ ] 路由预加载
- [ ] 数据库查询优化

### 验收标准
- ✅ 可以导入/导出书签
- ✅ Google 登录正常工作
- ✅ 暗黑模式切换流畅
- ✅ 设置页面功能完整
- ✅ 统计数据准确

---

## API 设计规范

### RESTful 路由约定

```
认证相关
POST   /api/auth/login          # 登录
POST   /api/auth/register       # 注册
POST   /api/auth/logout         # 登出
GET    /api/auth/session        # 获取会话

书签相关（通过 loader/action 实现）
GET    /dashboard/bookmarks                    # 列表（支持查询参数）
POST   /dashboard/bookmarks                    # 创建
GET    /dashboard/bookmarks/:id                # 详情
PUT    /dashboard/bookmarks/:id                # 更新
DELETE /dashboard/bookmarks/:id                # 删除
POST   /dashboard/bookmarks/:id/archive        # 归档
POST   /dashboard/bookmarks/:id/restore        # 恢复
POST   /dashboard/bookmarks/batch              # 批量操作

标签相关
GET    /dashboard/tags                         # 列表
POST   /dashboard/tags                         # 创建
PUT    /dashboard/tags/:id                     # 重命名
DELETE /dashboard/tags/:id                     # 删除
GET    /api/tags/suggestions?q=keyword         # 自动补全

工具 API
POST   /api/bookmarks/favicon                  # 获取 Favicon
POST   /api/bookmarks/import                   # 导入书签
GET    /api/bookmarks/export?format=html       # 导出书签
```

### 查询参数约定

```typescript
// GET /dashboard/bookmarks
interface BookmarkQuery {
  q?: string;              // 搜索关键词
  tags?: string;           // 标签过滤（逗号分隔）
  starred?: boolean;       // 只看收藏
  archived?: boolean;      // 查看归档
  deleted?: boolean;       // 查看已删除
  sortBy?: 'created' | 'updated' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;           // 页码（从 1 开始）
  pageSize?: number;       // 每页数量
}
```

### 响应格式约定

```typescript
// 成功响应
{
  data: [...],
  meta: {
    total: 100,
    page: 1,
    pageSize: 50,
    totalPages: 2
  }
}

// 错误响应
{
  error: {
    code: "VALIDATION_ERROR",
    message: "URL 格式不正确",
    field: "url"
  }
}
```

---

## UI/UX 设计要点

### 设计原则

1. **简洁优先**：避免过度设计，功能清晰
2. **快速响应**：即时反馈，流畅动画
3. **容错友好**：明确的错误提示，撤销操作
4. **键盘优先**：支持快捷键，提升效率

### 颜色系统

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0851D0',  // 主色（蓝色）
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',  // 危险色（红色）
          foreground: '#FFFFFF',
        },
      },
    },
  },
};
```

### 布局结构

```
┌─────────────────────────────────────────────────┐
│  Header (固定顶部)                               │
│  [Logo] [搜索框] [新建按钮] [用户菜单]           │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │  Main Content                        │
│ (固定)   │  (可滚动)                             │
│          │                                      │
│ - 全部   │  ┌────────────────────────┐          │
│ - 收藏   │  │  BookmarkCard          │          │
│ - 归档   │  └────────────────────────┘          │
│ - 回收站 │  ┌────────────────────────┐          │
│          │  │  BookmarkCard          │          │
│ 标签云   │  └────────────────────────┘          │
│ #react   │                                      │
│ #design  │  [分页组件]                           │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### 交互细节

| 操作 | 交互 | 反馈 |
|------|------|------|
| 添加书签 | 快捷键 `Ctrl+K` 打开对话框 | Toast 提示 "书签已添加" |
| 删除书签 | 点击删除 → 二次确认 | Toast + 撤销按钮（5s） |
| 搜索 | 输入防抖 300ms | 加载骨架屏 |
| 收藏 | 点击星标图标 | 星标动画 + 颜色变化 |
| 批量操作 | Shift+点击多选 | 顶部工具栏显示 |

---

## 开发工作流

### Git 分支策略

```
main (受保护)
  ├── develop (开发分支)
  │   ├── feature/auth
  │   ├── feature/bookmarks
  │   ├── feature/tags
  │   └── feature/search
  └── hotfix/xxx (紧急修复)
```

### 提交规范

```bash
# 提交格式
<type>(<scope>): <subject>

# 示例
feat(auth): add Google OAuth login
fix(bookmark): resolve duplicate URL issue
docs(readme): update setup instructions
style(ui): improve button spacing
refactor(db): optimize bookmark query
perf(search): add debounce to search input
```

### 开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/tags

# 2. 开发 + 提交
git add .
git commit -m "feat(tags): implement tag input component"

# 3. 推送并创建 PR
git push origin feature/tags

# 4. Code Review 后合并到 develop

# 5. develop 测试通过后合并到 main
```

### 日常命令

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 数据库迁移
pnpm db:generate   # 生成迁移
pnpm db:migrate    # 应用迁移
pnpm db:studio     # 打开 Drizzle Studio

# 构建
pnpm build

# 预览生产版本
pnpm preview
```

---

## 部署方案

### Vercel 部署（推荐）

**步骤：**
1. 推送代码到 GitHub
2. Vercel 导入项目
3. 配置环境变量
4. 自动部署

**环境变量（Vercel）：**
```env
DATABASE_URL=postgresql://xxx
BETTER_AUTH_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APP_URL=https://nookmark.vercel.app
```

**自动化：**
- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到其他分支 → 自动创建预览环境

### Neon 数据库

**配置：**
- 使用 Neon 的免费层（0.5GB 存储 + 100 小时计算）
- 启用连接池（Pooled Connection）
- 设置自动备份

**连接字符串：**
```
postgresql://username:password@ep-xxx.neon.tech/nookmark?sslmode=require
```

---

## 质量保证

### 代码规范

```bash
# 安装 Prettier + ESLint
pnpm add -D prettier eslint @typescript-eslint/parser

# .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 性能指标

| 指标 | 目标 |
|------|------|
| 首屏加载 (FCP) | < 1.5s |
| 页面可交互 (TTI) | < 3s |
| 最大内容绘制 (LCP) | < 2.5s |
| 累积布局偏移 (CLS) | < 0.1 |

### 测试策略（可选）

```bash
# 安装 Vitest
pnpm add -D vitest @testing-library/react

# 单元测试
pnpm test

# E2E 测试（可选）
pnpm add -D playwright
pnpm test:e2e
```

---

## 时间线估算

| 阶段 | 功能 | 工作量 | 完成标志 |
|------|------|--------|---------|
| 阶段 0 | 项目初始化 | 1 周 | 环境搭建完成，能访问空白页面 |
| 阶段 1 | MVP 版本 | 2 周 | 用户能注册、登录、添加书签 |
| 阶段 2 | 核心功能 | 2 周 | 标签系统、搜索、编辑功能完整 |
| 阶段 3 | 体验优化 | 2 周 | 软删除、归档、批量操作正常 |
| 阶段 4 | 高级功能 | 2+ 周 | 导入导出、OAuth、暗黑模式 |

**总计：约 9-10 周（2-2.5 个月）**

---

## 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| Better Auth 不熟悉 | 认证功能延期 | 提前阅读文档，准备降级方案（NextAuth） |
| Neon 免费额度不够 | 数据库限制 | 监控用量，准备付费计划 |
| React Router v7 新版本坑 | 开发受阻 | 查阅官方文档，社区求助 |
| 设计不确定 | UI 反复修改 | 先用 Shadcn 默认样式，后期优化 |
| 时间估算不准 | 项目延期 | 优先完成 MVP，其他功能迭代 |

---

## 成功标准

### MVP 阶段成功标准
- ✅ 用户可以注册和登录
- ✅ 用户可以添加、查看、删除书签
- ✅ 部署到生产环境（Vercel）
- ✅ 至少 1 名外部用户测试通过

### 项目成功标准
- ✅ 所有核心功能正常运行
- ✅ 性能指标达标（LCP < 2.5s）
- ✅ 移动端体验良好
- ✅ 暗黑模式支持
- ✅ 用户反馈积极

---

## 下一步行动

### 立即行动
1. **确认技术栈**：React Router v7 + Neon + Better Auth
2. **注册账号**：Neon、Google OAuth、Vercel
3. **创建项目**：初始化代码仓库
4. **搭建环境**：完成阶段 0 的任务

### 本周目标
- [ ] 完成项目初始化
- [ ] 数据库连接成功
- [ ] Better Auth 配置完成
- [ ] 登录页面能访问

---

## 附录

### 学习资源

**React Router v7：**
- 官方文档：https://reactrouter.com
- 教程：https://reactrouter.com/start/framework/installation

**Drizzle ORM：**
- 官方文档：https://orm.drizzle.team
- Neon 集成：https://orm.drizzle.team/docs/connect-neon

**Better Auth：**
- 官方文档：https://better-auth.com
- GitHub：https://github.com/better-auth/better-auth

**Shadcn UI：**
- 组件库：https://ui.shadcn.com
- 主题定制：https://ui.shadcn.com/themes

**Phosphor Icons：**
- 官方网站：https://phosphoricons.com
- React 库：https://github.com/phosphor-icons/react
- 安装：`pnpm add @phosphor-icons/react`

### 参考项目
- Linkding（灵感来源）：https://github.com/sissbruecker/linkding
- Hoarder（类似项目）：https://github.com/hoarder-app/hoarder

---

## 总结

这份文档提供了 **Nookmark Web** 的完整开发方案，从技术架构到渐进式实施计划，覆盖了：

✅ **清晰的技术栈**：React Router v7 + Neon + Drizzle + Better Auth
✅ **完整的数据库设计**：规范化、索引优化、业务规则
✅ **渐进式开发计划**：4 个阶段，MVP 优先
✅ **详细的功能清单**：每个阶段的任务和验收标准
✅ **实用的开发工作流**：Git 分支、提交规范、部署流程

**现在可以开始动手了！** 🚀

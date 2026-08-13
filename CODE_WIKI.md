# 无限画布 (Infinite Canvas) - Code Wiki

> **当前版本**: v0.12.1  
> **开源协议**: AGPL-3.0  
> **项目类型**: 面向图片创作的开源 AI 工作台

---

## 1. 项目概述

### 1.1 项目简介

无限画布是一款面向图片创作的开源工作台。它把**画布编排**、**AI 图片生成**、**参考图编辑**、**对话助手**、**提示词库**和**素材沉淀**放在同一个界面里，适合用来探索视觉方案并连续迭代图片结果。

### 1.2 核心功能

| 功能模块 | 描述 |
|---------|------|
| **无限画布** | 多画布项目、节点拖拽缩放、连线、小地图、撤销重做、导入导出 |
| **AI 创作** | 浏览器前台直连 OpenAI 兼容接口，支持文生图、图生图、参考图编辑、文本问答、音频和视频生成 |
| **画布助手** | 围绕选中节点和上游节点对话、生图，并把结果插回画布 |
| **本地 Agent** | 通过 Canvas Agent 连接 Codex / Claude Code，让 Agent 通过 MCP 操作当前画布 |
| **Codex App 插件** | 提供 Codex app 插件，自动注册 MCP 并拉起本地 Agent |
| **插件系统** | 支持通过 URL 动态安装/启用/更新/卸载远程节点插件，提供 TypeScript SDK |
| **自定义接口调用** | 可自定义生图/视频接口的调用方式，适配各类中转站与自建服务 |
| **提示词库** | 浏览器前端直连多个 GitHub 开源项目，并缓存到 IndexedDB |

---

## 2. 项目整体架构

### 2.1 架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                        浏览器前端 (web/)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Pages (页面) │  │  UI 组件库   │  │  全局 Store (Zustand)   │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                 │                       │              │
│         └─────────────────┴───────────┬───────────┘              │
│                                       │                          │
│                          ┌────────────▼────────────┐             │
│                          │   Canvas 画布引擎核心    │             │
│                          │  - 节点渲染/连线/缩放    │             │
│                          │  - 插件系统/节点注册     │             │
│                          └────────────┬────────────┘             │
│                                       │                          │
│                          ┌────────────▼────────────┐             │
│                          │   Services (API 层)      │             │
│                          │  - 直连 OpenAI 兼容接口  │             │
│                          │  - 本地存储(localforage) │             │
│                          │  - 提示词来源/图片存储   │             │
│                          └────────────┬────────────┘             │
└───────────────────────────────┬───────┴──────────────────────────┘
                                │ HTTP / SSE
┌───────────────────────────────▼──────────────────────────────────┐
│                  Canvas Agent 本地服务 (canvas-agent/)            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  HTTP 服务端口    │  │  MCP 协议服务     │  │ Codex CLI 桥接 │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└───────────────────────────────┬──────────────────────────────────┘
                                │ MCP
┌───────────────────────────────▼──────────────────────────────────┐
│                      Codex / Claude Code 终端                     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈分层

| 层级 | 技术选型 |
|------|---------|
| **前端框架** | React 19.2.5 + TypeScript 5 |
| **构建工具** | Vite 7 + @vitejs/plugin-react |
| **路由** | React Router 7 |
| **UI 组件库** | Ant Design 6 + @ant-design/pro-components 3 + Tailwind CSS 4 |
| **状态管理** | Zustand 5 (全局状态) |
| **服务端请求** | Axios + @tanstack/react-query 5 |
| **本地存储** | localforage (IndexedDB) + Zustand persist |
| **动画** | motion 12 |
| **图标** | lucide-react + @ant-design/icons |
| **代码编辑器** | @uiw/react-codemirror + codemirror languages |
| **Canvas Agent** | Express 5 + @modelcontextprotocol/sdk + @openai/codex + zod |
| **文档站点** | Next.js 16 + Fumadocs (MDX) |
| **插件构建** | 自定义 build.mjs + ESM 输出 |
| **容器化** | Docker + Nginx 静态托管 |

---

## 3. 目录结构说明

### 3.1 根目录结构

```
/workspace/
├── AGENTS.md                    # AI/自动化开发行为约束规范
├── CHANGELOG.md                 # 版本变更日志
├── VERSION                      # 当前版本号 (v0.12.1)
├── Dockerfile                   # 前端 Docker 构建镜像 (Nginx 静态托管)
├── docker-compose.yml           # Docker Compose 生产配置
├── docker-compose.local.yml     # Docker Compose 本地开发配置
├── nginx.conf                   # Nginx 配置
├── render.yaml                  # Render 平台部署配置
├── vercel.json                  # Vercel 部署配置
├── web/                         # ⭐ 前端主应用 (Vite + React)
├── canvas-agent/                # ⭐ Canvas Agent 本地服务
├── docs/                        # ⭐ 文档站点 (Next.js + Fumadocs)
├── plugins/                     # ⭐ 画布节点插件 & Codex App 插件
├── assets/                      # 静态资源 (如赞助商标识)
└── .github/workflows/           # GitHub CI/CD 工作流
```

### 3.2 web/ 前端主应用目录

```
web/
├── public/
│   ├── icons/                   # 模型品牌图标 (OpenAI, Gemini, DeepSeek 等)
│   ├── logo.svg                 # 项目 Logo
│   └── config.js                # 运行时注入配置
├── src/
│   ├── components/              # ⭐ 组件库
│   │   ├── agent/               # Agent 侧边栏组件 (11 个)
│   │   ├── canvas/              # ⭐ 画布组件 (40+ 个)
│   │   │   └── nodes/           #   内置节点渲染
│   │   ├── layout/              # 全局布局组件 (14 个)
│   │   ├── prompts/             # 提示词卡片/选择组件
│   │   ├── ui/                  # 通用 UI 小组件
│   │   ├── image-settings-panel.tsx
│   │   ├── video-settings-panel.tsx
│   │   ├── audio-settings-panel.tsx
│   │   └── model-picker.tsx
│   ├── pages/                   # ⭐ 路由页面
│   │   ├── home/                # 首页
│   │   ├── canvas/              # 画布列表 + 画布项目页
│   │   ├── image/               # 图片生图工作台
│   │   ├── video/               # 视频生成工作台
│   │   ├── assets/              # 我的素材库
│   │   ├── prompts/             # 提示词中心
│   │   ├── config/              # 配置页
│   │   └── not-found/           # 404 页
│   ├── stores/                  # ⭐ Zustand 全局状态
│   │   ├── canvas/              # 画布相关 store (3 个)
│   │   ├── use-agent-store.ts   # Agent 侧边栏状态
│   │   ├── use-asset-store.ts   # 素材库状态
│   │   ├── use-config-store.ts  # AI 配置/渠道配置
│   │   ├── use-theme-store.ts   # 主题状态
│   │   ├── use-user-store.ts
│   │   ├── use-prompt-source-store.ts
│   │   ├── use-canvas-side-panel-store.ts
│   │   └── use-workbench-agent-store.ts
│   ├── services/                # ⭐ 服务层 (API + 存储)
│   │   ├── api/                 # 外部 AI API 调用
│   │   │   ├── image.ts         #   图片生成
│   │   │   ├── video.ts         #   视频生成
│   │   │   ├── audio.ts         #   音频生成
│   │   │   ├── prompts.ts       #   提示词
│   │   │   ├── request.ts       #   请求工具函数
│   │   │   ├── model-plugin.ts
│   │   │   ├── prompt-source-presets.ts
│   │   │   └── prompt-source-runtime.ts
│   │   ├── image-storage.ts     # 图片 IndexedDB 存储
│   │   ├── file-storage.ts      # 通用文件存储 (视频/音频)
│   │   ├── config-file.ts       # 配置文件导入导出
│   │   ├── webdav-sync.ts       # WebDAV 同步
│   │   ├── app-sync.ts          # 应用同步
│   │   └── agent-chat-storage.ts
│   ├── lib/                     # ⭐ 工具函数库
│   │   ├── canvas/              # ⭐ 画布核心逻辑 (14 个模块)
│   │   ├── agent/               # Agent 站点级工具
│   │   ├── canvas-theme.ts      # 画布主题 tokens
│   │   ├── app-theme.ts         # Ant Design 主题配置
│   │   ├── localforage-storage.ts # localforage 封装
│   │   ├── release.ts           # 版本/变更日志解析
│   │   ├── analytics.ts         # 统计分析 (GA4/百度)
│   │   ├── zip.ts               # ZIP 导入导出
│   │   ├── image-utils.ts
│   │   ├── seedance-video.ts
│   │   └── utils.ts
│   ├── hooks/                   # 全局通用 Hooks
│   │   ├── use-copy-text.ts
│   │   ├── use-version-check.ts
│   │   └── use-prompt-source-scheduler.ts
│   ├── types/                   # TypeScript 类型定义
│   │   ├── canvas.ts            # 画布核心类型
│   │   ├── canvas-plugin.ts     # 插件契约类型
│   │   ├── canvas-export.ts
│   │   ├── image.ts
│   │   └── media.ts
│   ├── layouts/                 # 页面布局
│   │   └── user-layout.tsx      # 用户主布局 (顶栏 + 内容 + Agent 侧边栏)
│   ├── constant/                # 全局常量
│   │   ├── canvas.ts
│   │   ├── env.ts
│   │   ├── navigation-tools.ts
│   │   └── runtime-config.ts
│   ├── styles/
│   │   └── globals.css          # 全局 CSS (Tailwind 入口)
│   ├── main.tsx                 # 应用入口
│   └── router.tsx               # 路由配置
├── index.html
├── vite.config.ts               # Vite 配置 (含 localPluginsManifest 插件)
├── package.json
├── tsconfig.json
├── components.json              # shadcn 配置
├── Dockerfile                   # (与根目录相同用途)
└── docker-entrypoint.sh         # Docker 运行时配置注入脚本
```

### 3.3 canvas-agent/ 本地服务目录

```
canvas-agent/
├── src/
│   ├── agent/                   # Agent 适配器层
│   │   ├── claude.ts            # Claude Code 适配器 (暂保留)
│   │   ├── codex.ts             # Codex 主适配器
│   │   ├── codex-client.ts      # Codex CLI 客户端封装
│   │   ├── codex-history.ts     # Codex 历史记录
│   │   ├── codex-protocol.ts    # Codex 协议事件解析
│   │   └── types.ts
│   ├── canvas/                  # 画布操作核心
│   │   ├── operations.ts        # 画布操作定义 (add_node/update_node 等)
│   │   ├── schemas.ts           # zod 操作校验 schema
│   │   ├── session.ts           # 画布会话管理 (快照/撤销/重做)
│   │   ├── session.test.ts      # 会话单元测试
│   │   ├── tools.ts             # MCP 工具定义
│   │   └── types.ts
│   ├── server/
│   │   ├── http.ts              # HTTP + SSE 服务 (画布前端连接)
│   │   └── mcp.ts               # MCP 协议服务 (Codex 终端连接)
│   ├── utils/
│   │   ├── date.ts
│   │   ├── logger.ts            # winston 日志 (带日期文件输出)
│   │   └── value.ts
│   ├── config.ts                # 配置加载
│   ├── version-check.ts         # npm 版本检查
│   └── index.ts                 # 入口 (启动 http 或 mcp)
├── agent-instructions.md        # Agent 指令模板
├── codex-server.md
├── README.md
├── package.json                 # 发布: @basketikun/canvas-agent
└── tsconfig.json
```

### 3.4 plugins/ 插件目录

```
plugins/
├── canvas/                      # ⭐ 画布节点插件
│   ├── sdk/                     # 插件 SDK (TypeScript)
│   │   └── src/
│   │       ├── define-plugin.ts # definePlugin() 入口
│   │       ├── types.ts         # 公开契约类型 (与宿主同步)
│   │       ├── runtime.ts       # 运行时上下文
│   │       ├── jsx-runtime.ts   # JSX 运行时
│   │       └── index.ts
│   ├── registry/                # 官方插件注册表构建
│   ├── markdown/                # Markdown 节点插件
│   ├── html/                    # HTML 节点插件
│   ├── svg/                     # SVG 节点插件
│   ├── panorama/                # 3D 全景节点插件
│   ├── sticky-note/             # 便利贴节点插件
│   ├── template/                # 插件模板
│   └── README.md
└── infinite-canvas/             # ⭐ Codex App 插件
    ├── .codex-plugin/plugin.json
    ├── skills/                  # Codex Skills
    │   ├── canvas/SKILL.md
    │   └── open-canvas/SKILL.md
    ├── .mcp.json                # MCP 配置
    └── README.md
```

### 3.5 docs/ 文档站点目录

```
docs/
├── content/docs/                # MDX 文档内容
│   ├── overview/                # 概览: 快速开始/功能/部署
│   ├── canvas/                  # 画布: 节点手册/快捷键
│   ├── development/             # 开发: 数据结构/本地开发
│   ├── progress/                # 进度: todo/pending-test
│   ├── business/                # 商务: 协议/License
│   └── support/                 # 支持: 安全/赞助
├── src/
│   ├── app/                     # Next.js App Router
│   ├── components/              # 文档 UI 组件
│   └── lib/                     # 文档工具
├── source.config.ts             # Fumadocs 源配置
├── next.config.mjs
├── package.json
└── Dockerfile
```

---

## 4. 主要模块职责

### 4.1 前端路由体系

**文件**: [router.tsx](file:///workspace/web/src/router.tsx)

```
/                    → HomePage          首页
/image               → ImagePage         图片生图工作台
/video               → VideoPage         视频生成工作台
/assets              → AssetsPage        我的素材库
/prompts             → PromptsPage       提示词中心
/canvas              → CanvasPage        画布项目列表
/canvas/:id          → CanvasProjectPage 具体画布编辑页
/config              → ConfigPage        系统配置
*                    → NotFound          404
```

所有路由均包裹在 `UserLayout` 中，提供统一的顶栏导航和右侧 Agent 面板。

### 4.2 应用入口与 Provider 链

**文件**: [main.tsx](file:///workspace/web/src/main.tsx) → [app-providers.tsx](file:///workspace/web/src/components/layout/app-providers.tsx)

```
React.StrictMode
└── AppProviders
    ├── ConfigProvider (antd, zhCN, 暗/亮主题)
    │   └── ProConfigProvider
    │       └── App (antd 全局 message/modal/notification 上下文)
    │           └── QueryClientProvider (React Query, staleTime=30s)
    │               └── ClientRootInit (本地 store 水合/同步初始化)
    │                   └── RouterProvider (路由)
```

**关键函数**:
- `getAntThemeConfig(dark)` [app-theme.ts](file:///workspace/web/src/lib/app-theme.ts): 根据明暗主题生成 Ant Design 主题配置
- `ClientRootInit`: 执行 store rehydrate 后的初始化逻辑

### 4.3 全局状态管理 (Zustand Stores)

| Store 文件 | 存储 Key | 核心职责 | 持久化 |
|-----------|---------|---------|-------|
| [use-config-store.ts](file:///workspace/web/src/stores/use-config-store.ts) | `ai_config_store` | AI 接口配置(Base URL/Key/渠道/模型/提示词偏好/WebDAV) | localStorage |
| [use-theme-store.ts](file:///workspace/web/src/stores/use-theme-store.ts) | `theme_store` | 明/暗主题切换 | localStorage |
| [use-canvas-store.ts](file:///workspace/web/src/stores/canvas/use-canvas-store.ts) | `canvas_store` | 画布项目 CRUD、节点/连线/视口持久化 | localforage (防抖 400ms) |
| [use-canvas-ui-store.ts](file:///workspace/web/src/stores/canvas/use-canvas-ui-store.ts) | - | 画布 UI 临时状态 (选中节点/面板状态) | 否 |
| [use-plugin-store.ts](file:///workspace/web/src/stores/canvas/use-plugin-store.ts) | - | 画布插件安装/启用/版本管理 | localforage |
| [use-asset-store.ts](file:///workspace/web/src/stores/use-asset-store.ts) | `asset_store` | 素材库 (图片/视频/文本资产) | localforage |
| [use-agent-store.ts](file:///workspace/web/src/stores/use-agent-store.ts) | - | Agent 侧边栏状态 (连接/消息/日志/审批) | 否 (内存) |
| [use-workbench-agent-store.ts](file:///workspace/web/src/stores/use-workbench-agent-store.ts) | - | 工作台级 Agent 上下文 | 否 |
| [use-canvas-side-panel-store.ts](file:///workspace/web/src/stores/use-canvas-side-panel-store.ts) | - | 画布左侧面板宽度/展开状态 | localStorage |
| [use-prompt-source-store.ts](file:///workspace/web/src/stores/use-prompt-source-store.ts) | - | 提示词来源缓存/同步状态 | localforage |
| [use-user-store.ts](file:///workspace/web/src/stores/use-user-store.ts) | - | 用户偏好 | localStorage |

#### use-canvas-store 核心 API

```typescript
// 项目 CRUD
createProject(title?)            : string       // 新建画布, 返回项目ID
importProject(partial)           : string       // 导入画布
openProject(id)                  : CanvasProject|null
renameProject(id, title)         : void
deleteProjects(ids[])            : void
updateProject(id, patch)         : void         // 更新项目局部字段
```

#### use-config-store 核心类型

```typescript
ModelChannel = {                    // API 渠道
  id, name, baseUrl, apiKey,
  apiFormat: "openai"|"gemini"|"ark",
  models: ChannelModel[]            // 渠道下的模型列表
}
ChannelModel = {                    // 单模型
  name, capability: "image"|"video"|"text"|"audio",
  script?: string                   // 自定义调用脚本
}
```

### 4.4 画布核心引擎

#### 4.4.1 视口与变换

**文件**: [infinite-canvas.tsx](file:///workspace/web/src/components/canvas/infinite-canvas.tsx)

```typescript
type ViewportTransform = { x: number; y: number; k: number };
// x/y: 画布左上角在屏幕坐标系的像素偏移
// k: 缩放比例 (0.05 ~ 5)
```

**核心交互**:
- **滚轮缩放**: 以鼠标位置为中心缩放 (`handleWheel`)
- **拖拽平移**: 中键/空白左键拖动 (requestAnimationFrame 节流)
- **空格+拖拽**: 强制平移模式
- **缩放范围**: 0.05x ~ 5x

#### 4.4.2 节点系统

**核心类型**: [canvas.ts](file:///workspace/web/src/types/canvas.ts)

```typescript
enum CanvasNodeType {
  Image = "image", Text = "text", Config = "config",
  Video = "video", Audio = "audio", Group = "group"
}
// 插件节点类型: "<pluginId>:<name>" 字符串格式

CanvasNodeData = {
  id, type, title,
  position: { x, y }, width, height,
  metadata: {
    content, prompt, status, model, size, quality,
    storageKey, mimeType, bytes,               // 媒体资源引用
    references: string[],                      // 引用的上游节点ID
    groupId, isBatchRoot, batchChildIds,       // 分组/批量
    naturalWidth, naturalHeight, freeResize,   // 图片尺寸约束
    ...                                        // 插件可写入任意自定义字段
  }
}
```

**内置节点定义**: [builtin-nodes.tsx](file:///workspace/web/src/components/canvas/nodes/builtin-nodes.tsx)

#### 4.4.3 节点注册表 (Node Registry)

**文件**: [node-registry.ts](file:///workspace/web/src/lib/canvas/node-registry.ts)

```typescript
registerNodeDefinitions(defs[], pluginId?)   // 注册节点定义 (内置/插件)
unregisterPluginNodes(pluginId)              // 卸载某插件的全部节点
getNodeDefinition(type)                      // 获取节点定义
listNodeDefinitions()                        // 列出全部节点
getNodeSpec(type)                            // 获取节点默认尺寸/标题/元数据
```

- 注册表使用 `Map<string, CanvasNodeDefinition>` 内存存储
- 每次变更通过 `useNodeRegistryVersion` 驱动 UI 重渲染

#### 4.4.4 连线系统

```typescript
CanvasConnection = { id, fromNodeId, toNodeId }
```

- 连线渲染: [canvas-connections.tsx](file:///workspace/web/src/components/canvas/canvas-connections.tsx)
- 创建菜单: [canvas-create-menus.tsx](file:///workspace/web/src/components/canvas/canvas-create-menus.tsx)

#### 4.4.5 画布工具库 (lib/canvas/)

| 文件 | 职责 |
|------|------|
| [canvas-node-factory.ts](file:///workspace/web/src/lib/canvas/canvas-node-factory.ts) | 节点创建工厂 (createCanvasNode / 批量创建) |
| [canvas-node-geometry.ts](file:///workspace/web/src/lib/canvas/canvas-node-geometry.ts) | 节点几何计算 (包围盒/碰撞/对齐/吸附) |
| [canvas-node-size.ts](file:///workspace/web/src/lib/canvas/canvas-node-size.ts) | 节点尺寸约束 (按比例缩放/自由变形) |
| [canvas-image-data.ts](file:///workspace/web/src/lib/canvas/canvas-image-data.ts) | 图片数据处理 (DataURL/尺寸/压缩) |
| [canvas-generation-helpers.ts](file:///workspace/web/src/lib/canvas/canvas-generation-helpers.ts) | AI 生成辅助 (组装提示词/引用节点) |
| [canvas-resource-references.ts](file:///workspace/web/src/lib/canvas/canvas-resource-references.ts) | 节点资源引用追踪/清理 |
| [canvas-export.ts](file:///workspace/web/src/lib/canvas/canvas-export.ts) | 画布 ZIP 导出/导入 |
| [canvas-agent-ops.ts](file:///workspace/web/src/lib/canvas/canvas-agent-ops.ts) | Agent 操作指令 (ops) 执行与撤销 |
| [canvas-event-bus.ts](file:///workspace/web/src/lib/canvas/canvas-event-bus.ts) | 画布跨组件事件总线 |
| [plugin-loader.ts](file:///workspace/web/src/lib/canvas/plugin-loader.ts) | 远程插件加载 (动态 import URL) |
| [plugin-registry.ts](file:///workspace/web/src/lib/canvas/plugin-registry.ts) | 官方插件清单拉取/版本比较 |
| [plugin-runtime.ts](file:///workspace/web/src/lib/canvas/plugin-runtime.ts) | 插件运行时宿主上下文 |
| [plugin-node-context.ts](file:///workspace/web/src/lib/canvas/plugin-node-context.ts) | 插件节点 React 上下文注入 |

### 4.5 插件系统

#### 4.5.1 插件 SDK 契约

**公开类型**: [sdk/src/types.ts](file:///workspace/plugins/canvas/sdk/src/types.ts)

```typescript
// 插件入口: definePlugin()
export function definePlugin(manifest: PluginManifest): PluginDefinition

type PluginManifest = {
  id: string;                      // 插件唯一ID
  name: string;
  version: string;                 // 语义化版本
  description?: string;
  icon?: string;
  nodes: CanvasNodeDefinition[];   // 提供的节点定义
}

type CanvasNodeDefinition = {
  type: string;                    // "<pluginId>:<name>"
  title: string;
  defaultSize: { width, height };
  defaultMetadata?: CanvasNodeMetadata;
  icon?: ReactNode;
  interactionToggle?: boolean;     // 是否有「交互⇄移动」开关
  render: ComponentType<NodeRenderProps>;  // 节点渲染组件
}
```

#### 4.5.2 插件加载流程

```
用户输入插件 URL
    ↓
plugin-loader.ts fetch + 动态 import()
    ↓
识别 definePlugin() 导出的定义
    ↓
registerNodeDefinitions(nodes, pluginId)
    ↓
保存到 use-plugin-store (localforage)
    ↓
下一次启动时 use-plugin-host.tsx 自动恢复加载
```

#### 4.5.3 官方插件清单

- 清单 URL: 通过 `PLUGIN_REGISTRY_URL` 环境变量配置
- 构建: `plugins/canvas/registry/build.mjs` 产出插件注册表 JSON
- 语义化版本比较: `hasUpgrade(installed, remote)` 判断可升级

### 4.6 外部 AI API 服务层

**位置**: `web/src/services/api/`

**统一请求模式**:
- 浏览器前端 **直连** OpenAI 兼容接口 (无后端中转)
- 支持三种 API 调用格式: `openai` / `gemini` / `ark` (火山方舟)
- 每个渠道可配置多个模型, 支持**自定义调用脚本** (CodeMirror 编辑 JS)

| 模块 | 能力 |
|------|------|
| [image.ts](file:///workspace/web/src/services/api/image.ts) | 文生图 / 图生图 / 图像编辑 (mask/crop/inpaint) |
| [video.ts](file:///workspace/web/src/services/api/video.ts) | 文生视频 / 图生视频 (Seedance 协议支持) |
| [audio.ts](file:///workspace/web/src/services/api/audio.ts) | TTS 音频生成 |
| [prompts.ts](file:///workspace/web/src/services/api/prompts.ts) | 提示词 GitHub 源拉取 |
| [prompt-source-presets.ts](file:///workspace/web/src/services/api/prompt-source-presets.ts) | 内置提示词源预设 |
| [prompt-source-runtime.ts](file:///workspace/web/src/services/api/prompt-source-runtime.ts) | 提示词源缓存调度 |

### 4.7 本地存储体系

| 存储方案 | 适用场景 | 封装 |
|---------|---------|------|
| **localStorage** | 小型配置 (主题/面板宽度/简单偏好) | Zustand persist 默认 |
| **localforage** (IndexedDB) | 画布项目/素材库/插件/大 JSON | [localforage-storage.ts](file:///workspace/web/src/lib/localforage-storage.ts) + Zustand 自定义 storage |
| **IndexedDB Blob** | 图片/视频/音频二进制文件 | [image-storage.ts](file:///workspace/web/src/services/image-storage.ts), [file-storage.ts](file:///workspace/web/src/services/file-storage.ts) |

**防抖写入**: canvas store 采用 400ms 防抖 + 对象引用比较, 避免频繁写入 IndexedDB

### 4.8 Canvas Agent 服务架构

#### 4.8.1 服务模式

```
node dist/index.js         → HTTP + SSE 服务 (端口 17371, 画布前端连接)
node dist/index.js mcp     → MCP stdio 服务 (Codex 终端连接)
```

#### 4.8.2 HTTP 服务 (server/http.ts)

- 监听 `127.0.0.1:17371`
- 首次连接带 token 成功后, 记录 Origin 白名单 (写入 `~/.infinite-canvas/canvas-agent.json`)
- 接口:
  - `GET /events` → SSE 流式推送 Codex 事件
  - `POST /send` → 发送用户消息
  - `POST /stop` → 中断当前 turn
  - `POST /approve` / `POST /reject` → 工具调用审批
  - `GET /threads` → 线程列表

#### 4.8.3 MCP 服务 (server/mcp.ts)

MCP 工具清单:

| 工具 | 描述 |
|------|------|
| `canvas_get_state` | 获取当前画布完整状态 |
| `canvas_get_selection` | 获取选中节点状态 |
| `canvas_export_snapshot` | 导出现状快照 |
| `canvas_apply_ops` | 批量执行画布操作 |
| `canvas_create_text_node` | 创建文本节点 |
| `canvas_create_image_prompt_flow` | 创建图片生成流程 (配置→图片节点链路) |

#### 4.8.4 画布会话 (canvas/session.ts)

```typescript
CanvasSession {
  applyOps(ops)          // 执行操作并生成可撤销快照
  undoOps()              // 撤销上一批
  canUndo                // 是否可撤销
  getSnapshot()          // 获取当前状态快照
}
```

操作类型 (operations.ts, zod schema 校验):
- `add_node` / `update_node` / `remove_node`
- `add_connection` / `remove_connection`
- `update_project_meta` (背景/视口等)

#### 4.8.5 Codex 适配器 (agent/codex.ts)

- 使用 `@openai/codex` CLI: `codex app-server --stdio`
- 注入 infinite-canvas MCP 并自动放行 MCP 审批
- 事件流: `thread.started` → `turn.started` → `item.*` → `turn.completed`
- 增量合并短回复, 转发思考摘要和工具输出
- 图片附件: 前端 → Agent 临时文件 → Codex `localImage` 输入

### 4.9 Agent 侧边栏面板

**位置**: `web/src/components/agent/`

| 文件 | 职责 |
|------|------|
| [agent-panel.tsx](file:///workspace/web/src/components/agent/agent-panel.tsx) | 面板容器 (可拖拽调整宽度/动画) |
| [agent-panel-tabs.tsx](file:///workspace/web/src/components/agent/agent-panel-tabs.tsx) | 顶栏 Tab 切换 (对话/配置/历史/日志) |
| [agent-chat.tsx](file:///workspace/web/src/components/agent/agent-chat.tsx) | 对话列表主体 |
| [agent-chat-message.tsx](file:///workspace/web/src/components/agent/agent-chat-message.tsx) | 单条消息 (streamdown 流式 Markdown) |
| [agent-chat-composer.tsx](file:///workspace/web/src/components/agent/agent-chat-composer.tsx) | 输入框 (附件/审批模式/推理强度) |
| [agent-event-formatters.ts](file:///workspace/web/src/components/agent/agent-event-formatters.ts) | Codex 事件 → 中文过程时间线格式化 |
| [agent-history-view.tsx](file:///workspace/web/src/components/agent/agent-history-view.tsx) | 历史会话列表 (多选批量删除) |
| [agent-log-view.tsx](file:///workspace/web/src/components/agent/agent-log-view.tsx) | 结构化诊断日志 (筛选/展开/折叠重复) |
| [agent-scroll-to-bottom.tsx](file:///workspace/web/src/components/agent/agent-scroll-to-bottom.tsx) | 回到底部悬浮入口 (浏览时暂停跟随) |
| [agent-connect-view.tsx](file:///workspace/web/src/components/agent/agent-connect-view.tsx) | Agent 连接配置 (URL+Token) |
| [agent-api.ts](file:///workspace/web/src/components/agent/agent-api.ts) | HTTP/SSE 连接封装 |

---

## 5. 关键类与函数说明

### 5.1 画布操作 (applyOps)

**类型**: CanvasAgentOp (canvas-agent 与 web 共享同一份 zod schema)

```typescript
// 创建图片生成节点链路示例
const ops: CanvasAgentOp[] = [
  {
    type: "add_node",
    nodeType: "config",
    title: "生成配置",
    position: { x: 0, y: 0 },
    metadata: { size: "1024x1024", quality: "hd", count: 4 }
  },
  {
    type: "add_node",
    nodeType: "image",
    title: "图片生成",
    position: { x: 500, y: 0 },
    metadata: { prompt: "一只可爱的猫咪", status: "idle" }
  },
  {
    type: "add_connection",
    fromNodeId: "<config-node-id>",
    toNodeId: "<image-node-id>"
  }
];
```

### 5.2 画布导出/导入

**文件**: [canvas-export.ts](file:///workspace/web/src/lib/canvas/canvas-export.ts) + [zip.ts](file:///workspace/web/src/lib/zip.ts) (基于 fflate)

```typescript
// 导出: projects.json 描述 + 二进制资源文件
CanvasExportFile = {
  version: 1,
  exportedAt: string,
  projects: Array<{
    project: CanvasProject,
    files: Array<{ path, storageKey, mimeType }>
  }>
}
```

导出 ZIP 内结构:
```
<zip>/
├── projects.json
└── files/
    ├── images/<hash>
    └── media/<hash>
```

### 5.3 画布主题系统

**文件**: [canvas-theme.ts](file:///workspace/web/src/lib/canvas-theme.ts)

```typescript
canvasThemes = {
  light: { canvas: { background, dot, line, ... }, node: {...}, toolbar: {...} },
  dark:  { canvas: { background, dot, line, ... }, node: {...}, toolbar: {...} },
}
```

- 画布组件统一从 `useThemeStore` 获取主题后读取 `canvasThemes[theme]`
- **禁止硬编码颜色值**, 必须走 theme token 保证明/暗一致

### 5.4 自定义接口脚本

**编辑器组件**: [model-script-editor.tsx](file:///workspace/web/src/components/layout/model-script-editor.tsx)

每个 `ChannelModel` 支持自定义 `script` 字段 (JavaScript 函数), 运行时上下文:

```javascript
// 可用 API:
async function customCall({
  baseUrl, apiKey, model, prompt,
  size, quality, count, background,
  referenceImages, maskImage,
  seconds, vquality, ...otherParams,
  fetch        // 原生 fetch
}) {
  // return { images: [{ dataUrl, mimeType, bytes, width, height }] }
  // 或 return { videos: [...] } / { audios: [...] } / { text: string }
}
```

### 5.5 运行时版本与变更日志注入

**Vite 插件**: [vite.config.ts](file:///workspace/web/vite.config.ts)

```typescript
define: {
  __APP_VERSION__: JSON.stringify(readFileSync("../VERSION")),
  __APP_RELEASES__: JSON.stringify(parseChangelog(readFileSync("../CHANGELOG.md"))),
}
```

- `parseChangelog()`: [release.ts](file:///workspace/web/src/lib/release.ts) 将 CHANGELOG.md 解析为 `ReleaseInfo[]`
- 顶栏版本弹窗: [version-release-modal.tsx](file:///workspace/web/src/components/layout/version-release-modal.tsx) 读取注入的常量

---

## 6. 依赖关系图

### 6.1 前端核心依赖依赖链

```
react-router (router.tsx)
    ↓ 路由 → 页面
pages/* (index.tsx)
    ↓ 使用
components/* (UI)
    ↓ 消费状态
stores/* (Zustand)  ←── persist → localforage / localStorage
    ↓ 触发动作
lib/canvas/* (业务逻辑)  +  lib/app-theme.ts (主题)
    ↓ 调用外部
services/api/* (Axios → OpenAI 兼容接口)
services/image-storage.ts (IndexedDB)
```

### 6.2 画布组件内部依赖

```
CanvasProjectPage (project.tsx)
    ├── InfiniteCanvas (视口/缩放/平移)
    │   └── CanvasGrid (背景网格)
    ├── CanvasTopBar (顶栏工具)
    ├── CanvasToolbar (工具栏)
    ├── CanvasSidePanel (左侧: 节点列表/资产)
    ├── CanvasNode[] (节点渲染)
    │   ├── Builtin Renderers (builtin-nodes.tsx)
    │   └── Plugin Renderers (plugin-runtime.ts)
    ├── CanvasConnections (SVG 连线层)
    ├── CanvasMiniMap (小地图)
    ├── CanvasContextMenu (右键菜单)
    ├── CanvasHoverToolbar (悬停工具栏)
    └── ZoomControls (缩放控制)
```

### 6.3 插件宿主依赖方向

```
┌──────────────────────────── 宿主 web/ ────────────────────────────┐
│  use-plugin-store → plugin-loader → fetch(远程URL) → import()     │
│                              ↓                                    │
│                     registerNodeDefinitions()                     │
│                              ↓                                    │
│  CanvasNode → getNodeDefinition → plugin-node-context (React ctx) │
│                              ↓                                    │
│  SDK types.ts ←─── 类型契约镜像 ───→ 插件 types.ts                │
└───────────────────────────────────────────────────────────────────┘
                              ↑
                     插件 SDK (definePlugin)
```

### 6.4 Canvas Agent 与前端协议

```
web/src/components/agent/agent-api.ts
    ↓ (HTTP POST /send, GET /events SSE)
canvas-agent/src/server/http.ts
    ↓ (事件分发)
canvas-agent/src/agent/codex.ts
    ↓ (stdio)
codex app-server → @modelcontextprotocol/sdk → infinite-canvas MCP
    ↓ (MCP tools)
canvas-agent/src/canvas/session.ts → applyOps → web 侧 AgentCanvasContext.applyOps
    ↓ (SSE 推送 canvas_state_changed)
web 侧 use-canvas-store.updateProject → 画布实时刷新
```

---

## 7. 项目运行方式

### 7.1 本地开发 (前端主应用)

```bash
# 1. 克隆仓库
git clone git@github.com:basketikun/infinite-canvas.git
cd infinite-canvas

# 2. 安装依赖 (推荐 bun, 也可用 npm/pnpm)
cd web
bun install    # 或 npm install

# 3. 启动开发服务器 (端口 3000)
bun run dev    # 或 npm run dev
# → http://localhost:3000
```

**脚本说明** ([web/package.json](file:///workspace/web/package.json)):

| 命令 | 描述 |
|------|------|
| `bun run dev` | Vite 开发服务器 `--host 0.0.0.0 --port 3000` |
| `bun run build` | Vite 生产构建 |
| `bun run typecheck` | `tsc --noEmit` 类型检查 |
| `bun run start` | Vite 预览构建产物 |
| `bun run format` | Prettier 格式化 |

### 7.2 Docker 运行

```bash
cd infinite-canvas
docker compose up -d
# → http://localhost:3000 (Nginx 静态托管)
```

**构建流程** ([Dockerfile](file:///workspace/Dockerfile)):
1. **Stage 1 (build)**: `oven/bun:1.3.13` → `bun install` → `bun run build`
2. **Stage 2 (runtime)**: `nginx:1.27-alpine` → 拷贝 `dist/` + `nginx.conf` → EXPOSE 3000

**运行时配置注入**: `docker-entrypoint.d/40-runtime-config.sh` 将环境变量注入到 `config.js`

### 7.3 Canvas Agent 本地服务

```bash
# 方式一: npx 直接运行 (推荐用户)
npx -y @basketikun/canvas-agent
# Debug 模式:
npx -y @basketikun/canvas-agent --debug

# 方式二: 仓库内开发运行
cd canvas-agent
npm install
npm run build
node dist/index.js          # HTTP 模式
node dist/index.js mcp      # MCP 模式 (Codex 终端)
```

启动后输出:
```
Local URL: http://127.0.0.1:17371
Connect token: <xxxxxx>
```
→ 在画布右上角 Agent 面板填入此 URL + Token 连接

### 7.4 Codex App 插件安装

```bash
cd /path/to/infinite-canvas
codex plugin marketplace add "$(pwd)"
codex plugin add infinite-canvas@infinite-canvas-local
```

或手动注册 MCP:
```bash
codex mcp add infinite-canvas -- npx -y @basketikun/canvas-agent mcp
```

### 7.5 文档站点开发

```bash
cd docs
bun install    # 或 npm install
bun run dev    # Next.js 开发模式
# 构建: bun run build
```

### 7.6 画布插件开发

```bash
# 复制模板
cp -r plugins/canvas/template plugins/canvas/my-plugin
cd plugins/canvas/my-plugin

# 开发 (src/index.tsx 使用 definePlugin)
npm install
npm run build    # 产出 dist/index.js (ESM)

# 本地调试: 在 web/.env 中设置
# VITE_DEV_PLUGINS=http://localhost:<your-dev-server>/dist/index.js
# 开发期每次启动前端都会重新拉取该 URL, 不落库不缓存
```

### 7.7 首次配置

打开后进入 **右上角配置按钮** 或 `/config` 页面:

1. **渠道配置 Tab**:
   - 填入 OpenAI 兼容 `Base URL` 和 `API Key`
   - 选择调用格式: `openai` / `gemini` / `ark`
   - 添加/编辑渠道下的模型 (指定 capability: image/video/text/audio)
   - 如需自定请求格式, 对单个模型设置 JS 调用脚本

2. **偏好设置 Tab**: 设置常用生图尺寸/质量/数量、音频参数、推理强度等

3. **提示词来源 Tab**: 启用/禁用/更新 GitHub 开源提示词库, 添加自定义 JSON 源

4. **WebDAV Tab**: 配置同步地址 (可选, 用于画布/素材跨设备同步)

---

## 8. 开发规范速览

来源: [AGENTS.md](file:///workspace/AGENTS.md)

### 8.1 核心原则
- 先读现有代码, 再动手修改, 优先沿用项目已有结构和写法
- 代码保持最少行数, 不过度抽象, 不兼容旧数据
- 通用能力用成熟库, 手写只在确有必要时

### 8.2 前端代码组织
- 路由页面 → `pages/`; 画布页面 → `pages/canvas/`
- 画布组件 → `components/canvas/`; 画布状态 → `stores/canvas/`; 画布工具 → `lib/canvas/`
- 外部 API 调用 → `services/api/` (浏览器直连, 无后端假设)
- 全局状态 → `stores/`; 全局副作用 → `hooks/`; 全局常量 → `constant/`
- 业务数据本地持久化默认用 `localforage`, `localStorage` 仅极简配置
- 状态/动作直接从 store 获取, 不为"纯组件"层层透传 props
- 组件优先函数组件 + hooks, 页面文案保持中文

### 8.3 画布 UI 规范
- 必须遵循当前画布主题, 用 `canvasThemes` / `useThemeStore` token
- **禁止硬编码**黑白/stone/slate 等颜色
- 顶部工具栏: 无边框无阴影无胶囊, 极简扁平, 仅轻微 hover
- 非图片节点缩略图**不要灰色底色**, 图标直接无背景
- 操作按钮默认透明背景 + `hover:bg-black/5 dark:hover:bg-white/10`
- 灰色 `activeBg` 仅用于**选中态高亮**, 不当普通装饰
- 图片节点尺寸尊重原始比例 (除非功能明确要求自由变形)

### 8.4 发版本流程
1. 整理 `CHANGELOG.md` 的 Unreleased → 新版本条目, 保留空 Unreleased
2. 更新 `VERSION` 文件 (语义化版本递增)
3. 提交未提交代码
4. 打 Git tag (如 `v0.12.1`)
5. GitHub Actions 自动发布 canvas-agent npm 包 (版本不存在时)

---

## 9. 版本演进记录 (摘要)

来源: [CHANGELOG.md](file:///workspace/CHANGELOG.md)

| 版本 | 日期 | 核心更新 |
|------|------|---------|
| **v0.12.1** | 2026-07-31 | Agent 支持按账号选 Codex 模型+推理强度; Debug 日志按日期保存; 流式回复性能优化 |
| **v0.12.0** | 2026-07-30 | Agent 三档权限+运行中审批; 可折叠任务进度时间线; 历史记录多选删除; 增量流式传输 |
| **v0.11.0** | 2026-07-28 | 文本生成推理强度; 参考区拖拽上传; 配置文件导入导出; 火山方舟协议渠道 |
| **v0.10.0** | 2026-07-25 | BananaPromptQuicker 提示词源; Agent 统一状态查询; 提示词跨来源搜索 |
| **v0.9.0** | 2026-07-17 | 资产 Tab 上传; 左侧面板可拖拽宽度; 画布 ZIP 导出; 批量导出; GA4/百度统计 |
| **v0.8.0** | 2026-07-15 | **画布节点插件系统** + SDK; 官方插件注册表; Markdown/SVG/HTML/3D全景/便利贴插件; 自定义接口脚本 |
| **v0.7.0** | 2026-07-14 | Agent 侧边栏全站常驻; `site_navigate` 工具; 组节点; 双击空白创建节点; Codex MCP 统一链路 |
| **v0.6.0** | 2026-07-09 | Codex App 插件; 独立配置页; 图片切图拖拽调整; Docker 镜像切换 Nginx 静态托管 |

---

## 10. 关键文件索引

| 功能域 | 入口文件 |
|--------|---------|
| 应用启动入口 | [web/src/main.tsx](file:///workspace/web/src/main.tsx) |
| 路由配置 | [web/src/router.tsx](file:///workspace/web/src/router.tsx) |
| 用户主布局 | [web/src/layouts/user-layout.tsx](file:///workspace/web/src/layouts/user-layout.tsx) |
| 全局 Provider | [web/src/components/layout/app-providers.tsx](file:///workspace/web/src/components/layout/app-providers.tsx) |
| 画布项目页 | [web/src/pages/canvas/project.tsx](file:///workspace/web/src/pages/canvas/project.tsx) |
| 画布列表页 | [web/src/pages/canvas/index.tsx](file:///workspace/web/src/pages/canvas/index.tsx) |
| 无限画布视口 | [web/src/components/canvas/infinite-canvas.tsx](file:///workspace/web/src/components/canvas/infinite-canvas.tsx) |
| 画布核心类型 | [web/src/types/canvas.ts](file:///workspace/web/src/types/canvas.ts) |
| 画布项目 Store | [web/src/stores/canvas/use-canvas-store.ts](file:///workspace/web/src/stores/canvas/use-canvas-store.ts) |
| 节点注册表 | [web/src/lib/canvas/node-registry.ts](file:///workspace/web/src/lib/canvas/node-registry.ts) |
| 画布操作 (applyOps) | [web/src/lib/canvas/canvas-agent-ops.ts](file:///workspace/web/src/lib/canvas/canvas-agent-ops.ts) |
| AI 配置 Store | [web/src/stores/use-config-store.ts](file:///workspace/web/src/stores/use-config-store.ts) |
| Agent Store | [web/src/stores/use-agent-store.ts](file:///workspace/web/src/stores/use-agent-store.ts) |
| Agent 面板容器 | [web/src/components/agent/agent-panel.tsx](file:///workspace/web/src/components/agent/agent-panel.tsx) |
| 图片 API 调用 | [web/src/services/api/image.ts](file:///workspace/web/src/services/api/image.ts) |
| 画布主题 | [web/src/lib/canvas-theme.ts](file:///workspace/web/src/lib/canvas-theme.ts) |
| 插件 SDK 类型契约 | [plugins/canvas/sdk/src/types.ts](file:///workspace/plugins/canvas/sdk/src/types.ts) |
| 插件 SDK 入口 | [plugins/canvas/sdk/src/define-plugin.ts](file:///workspace/plugins/canvas/sdk/src/define-plugin.ts) |
| Canvas Agent HTTP 服务 | [canvas-agent/src/server/http.ts](file:///workspace/canvas-agent/src/server/http.ts) |
| Canvas Agent MCP 服务 | [canvas-agent/src/server/mcp.ts](file:///workspace/canvas-agent/src/server/mcp.ts) |
| Canvas Agent 画布会话 | [canvas-agent/src/canvas/session.ts](file:///workspace/canvas-agent/src/canvas/session.ts) |
| Canvas Agent Codex 适配器 | [canvas-agent/src/agent/codex.ts](file:///workspace/canvas-agent/src/agent/codex.ts) |
| AI 开发约束规范 | [AGENTS.md](file:///workspace/AGENTS.md) |
| 版本变更日志 | [CHANGELOG.md](file:///workspace/CHANGELOG.md) |

---

*Wiki 文档生成时间: 2026-08-13, 基于代码仓库当前状态自动分析生成*

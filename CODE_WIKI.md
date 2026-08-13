# 无限画布 (Infinite Canvas) Code Wiki

> 项目版本：v0.12.1 | 最后更新：2026-08-13

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [目录结构详解](#3-目录结构详解)
4. [前端核心模块（web/）](#4-前端核心模块web)
   - 4.1 [应用入口与路由](#41-应用入口与路由)
   - 4.2 [全局 Provider 与主题系统](#42-全局-provider-与主题系统)
   - 4.3 [状态管理（Stores）](#43-状态管理stores)
   - 4.4 [页面（Pages）](#44-页面pages)
   - 4.5 [组件系统（Components）](#45-组件系统components)
5. [画布系统详解](#5-画布系统详解)
   - 5.1 [画布数据结构](#51-画布数据结构)
   - 5.2 [画布状态管理](#52-画布状态管理)
   - 5.3 [节点注册表与插件系统](#53-节点注册表与插件系统)
   - 5.4 [画布渲染与交互](#54-画布渲染与交互)
   - 5.5 [画布工具函数库](#55-画布工具函数库)
6. [服务层与 API 调用](#6-服务层与-api-调用)
   - 6.1 [AI 图像生成 API](#61-ai-图像生成-api)
   - 6.2 [AI 视频生成 API](#62-ai-视频生成-api)
   - 6.3 [AI 音频生成 API](#63-ai-音频生成-api)
   - 6.4 [提示词来源服务](#64-提示词来源服务)
   - 6.5 [本地存储服务](#65-本地存储服务)
7. [Canvas Agent 系统](#7-canvas-agent-系统)
   - 7.1 [架构概述](#71-架构概述)
   - 7.2 [HTTP 服务模式](#72-http-服务模式)
   - 7.3 [MCP 服务模式](#73-mcp-服务模式)
   - 7.4 [核心模块](#74-核心模块)
8. [插件系统](#8-插件系统)
   - 8.1 [插件 SDK](#81-插件-sdk)
   - 8.2 [内置画布插件](#82-内置画布插件)
   - 8.3 [插件运行时](#83-插件运行时)
9. [文档站点（docs/）](#9-文档站点docs)
10. [配置与部署](#10-配置与部署)
    - 10.1 [本地开发](#101-本地开发)
    - 10.2 [Docker 部署](#102-docker-部署)
    - 10.3 [Vite 构建配置](#103-vite-构建配置)
11. [依赖关系总览](#11-依赖关系总览)
12. [版本管理与发布流程](#12-版本管理与发布流程)
13. [开发规范](#13-开发规范)

---

## 1. 项目概述

**无限画布 (Infinite Canvas)** 是一款面向图片创作的开源工作台，将画布编排、AI 多模态生成、对话助手、提示词库和素材管理整合在同一界面中。

### 核心能力

| 能力 | 说明 |
|------|------|
| **无限画布** | 多项目、节点拖拽缩放、节点连线、小地图、撤销重做、导入导出 |
| **AI 创作** | 浏览器直连 OpenAI 兼容接口，支持文生图、图生图、参考图编辑、文本问答、音频和视频生成 |
| **画布助手** | 围绕选中节点和上游节点对话、生图，结果自动插回画布 |
| **本地 Agent** | 通过 Canvas Agent 连接 Codex / Claude Code，Agent 可通过 MCP 操作画布 |
| **Codex App 插件** | 提供 Codex app 插件，自动注册 MCP 并拉起本地 Agent |
| **插件系统** | 支持 URL 动态安装/启用/更新/卸载远程节点插件，提供 TypeScript SDK |
| **自定义接口调用** | 可自定义生图/视频接口调用方式，适配各类中转站与自建服务 |
| **提示词库** | 前端直连多个 GitHub 开源提示词项目，缓存到 IndexedDB |

### 技术栈

- **前端框架**: React 19 + TypeScript 5
- **构建工具**: Vite 7
- **路由**: React Router 7
- **UI 组件**: Ant Design 6 + Ant Design Pro Components 3 + Tailwind CSS 4
- **状态管理**: Zustand 5（支持 IndexedDB 持久化）
- **数据请求**: Axios + TanStack React Query 5
- **本地存储**: localforage（IndexedDB）
- **动画**: Motion 12
- **Agent**: Codex CLI + MCP（Model Context Protocol）
- **文档站点**: Next.js 16 + Fumadocs
- **部署**: Docker + Nginx

### 开源协议

GNU Affero General Public License v3.0 (AGPL-3.0)

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    前端 SPA (web/)                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐    │    │
│  │  │  首页    │  │ 配置页   │  │     画布页          │    │    │
│  │  │(工作台)  │  │          │  │  ┌───────────────┐  │    │    │
│  │  └────┬─────┘  └────┬─────┘  │  │ 画布渲染引擎  │  │    │    │
│  │       │             │        │  │ 节点/连线/... │  │    │    │
│  │  ┌────▼─────┐  ┌───▼──────┐ │  └───────┬───────┘  │    │    │
│  │  │ 生图工作台│  │提示词中心│ │          │          │    │    │
│  │  └────┬─────┘  └────┬─────┘ │  ┌───────▼───────┐  │    │    │
│  │       │             │        │  │ Zustand Stores│  │    │    │
│  │  ┌────▼─────────────▼─────┐  │  │ (localforage) │  │    │    │
│  │  │   Services / API 层    │  │  └───────┬───────┘  │    │    │
│  │  │  (浏览器直连外部AI)    │  │          │          │    │    │
│  │  └────────────┬───────────┘  │  ┌───────▼───────┐  │    │    │
│  │               │              │  │  Agent 面板   │  │    │    │
│  └───────────────┼──────────────┘  └───────┬───────┘  │    │    │
│                  │                          │          │    │    │
│                  │ HTTP/WebSocket           │ HTTP     │    │    │
└──────────────────┼──────────────────────────┼──────────┘    │     │
                   │                          │               │
┌──────────────────▼─────────┐  ┌─────────────▼────────────┐  │
│    OpenAI 兼容接口         │  │  Canvas Agent (本机运行)  │  │
│    (图像/视频/文本/音频)   │  │  ┌─────────────────────┐  │  │
└────────────────────────────┘  │  │ Codex / Claude CLI  │  │  │
                                │  └─────────┬───────────┘  │  │
                                │            │ MCP          │  │
                                │  ┌─────────▼───────────┐  │  │
                                │  │ 画布操作工具集      │  │  │
                                │  └─────────────────────┘  │  │
                                └────────────────────────────┘  │
┌───────────────────────────────────────────────────────────────┐
│  插件生态 (plugins/)                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │  HTML    │ │ Markdown │ │  SVG     │ │ Sticky Note ... │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### 架构特点

1. **纯前端优先**: AI 请求由浏览器前台直连，不依赖项目后端
2. **本地优先存储**: 画布、素材、配置默认保存在浏览器 IndexedDB
3. **可选同步**: 支持 WebDAV 跨设备同步
4. **可扩展插件**: 通过 SDK 开发自定义画布节点，运行时动态加载
5. **可选本地 Agent**: 用户本机启动 Canvas Agent，连接 Codex/Claude CLI 实现自动化画布操作

---

## 3. 目录结构详解

```
/workspace/
├── web/                          # 主前端 SPA（核心业务）
│   ├── src/
│   │   ├── components/           # 组件（按业务域分目录）
│   │   │   ├── agent/            # Agent 对话相关组件
│   │   │   ├── canvas/           # 画布相关组件
│   │   │   │   └── nodes/        # 内置节点定义
│   │   │   ├── layout/           # 布局与全局壳子组件
│   │   │   ├── prompts/          # 提示词卡片/选择组件
│   │   │   └── ui/               # 通用 UI 组件
│   │   ├── constant/             # 全局常量
│   │   ├── hooks/                # 全局复用 hooks
│   │   ├── layouts/              # 页面布局
│   │   ├── lib/                  # 工具函数库
│   │   │   ├── canvas/           # 画布专用工具函数
│   │   │   └── agent/            # Agent 工具函数
│   │   ├── pages/                # 路由页面
│   │   │   ├── assets/           # 我的素材
│   │   │   ├── canvas/           # 画布页 + 画布项目页
│   │   │   ├── config/           # 配置页
│   │   │   ├── home/             # 首页（工作台入口）
│   │   │   ├── image/            # 生图工作台
│   │   │   ├── prompts/          # 提示词中心
│   │   │   └── video/            # 视频工作台
│   │   ├── services/             # 服务层（外部请求 + 本地存储）
│   │   │   └── api/              # 外部 API 封装
│   │   ├── stores/               # Zustand 全局状态
│   │   │   └── canvas/           # 画布专用 stores
│   │   ├── styles/               # 全局 CSS
│   │   ├── types/                # TypeScript 类型定义
│   │   ├── main.tsx              # 应用入口
│   │   └── router.tsx            # 路由配置
│   ├── public/                   # 静态资源
│   └── package.json
│
├── canvas-agent/                 # 本地 Canvas Agent 服务（Node.js）
│   ├── src/
│   │   ├── agent/                # Codex/Claude 适配器
│   │   ├── canvas/               # 画布操作与会话
│   │   ├── server/               # HTTP + MCP 服务
│   │   └── utils/                # 工具函数
│   └── package.json
│
├── plugins/                      # 插件生态
│   ├── canvas/                   # 画布节点插件
│   │   ├── sdk/                  # TypeScript Plugin SDK
│   │   ├── html/                 # HTML 节点插件
│   │   ├── markdown/             # Markdown 节点插件
│   │   ├── panorama/             # 全景图插件
│   │   ├── sticky-note/          # 便利贴插件
│   │   ├── svg/                  # SVG 节点插件
│   │   └── registry/             # 插件清单
│   └── infinite-canvas/          # Codex App 插件（MCP 注册）
│
├── docs/                         # 文档站点（Next.js + Fumadocs）
│   ├── content/docs/             # MDX 文档内容
│   │   ├── overview/             # 总览（快速开始/功能介绍/部署）
│   │   ├── canvas/               # 画布操作手册
│   │   ├── development/          # 开发文档
│   │   ├── business/             # 商务/协议
│   │   ├── progress/             # 进度（TODO/待测试）
│   │   └── support/              # 赞助/安全
│   └── src/                      # Next.js 应用代码
│
├── .github/workflows/            # GitHub Actions CI
├── assets/                       # 根级静态资源
├── AGENTS.md                     # AI 自动化开发规范
├── CHANGELOG.md                  # 版本变更日志
├── Dockerfile                    # 前端镜像构建
├── docker-compose.yml            # Docker Compose 配置
├── nginx.conf                    # Nginx 配置
├── README.md
├── SECURITY.md
├── VERSION                       # 当前版本号
└── render.yaml                   # Render 一键部署配置
```

---

## 4. 前端核心模块（web/）

### 4.1 应用入口与路由

#### 入口文件: [main.tsx](file:///workspace/web/src/main.tsx)

```typescript
// 关键初始化步骤：
1. 初始化统计分析 (initAnalytics)
2. 设置全局字体族
3. 挂载 AppProviders（主题、国际化、QueryClient）
4. 挂载 RouterProvider
```

引入的全局样式：
- `antd/dist/reset.css` - Ant Design 重置样式
- `streamdown/styles.css` - Markdown 流式渲染样式
- `./styles/globals.css` - 项目全局 CSS（Tailwind + 基础变量）

#### 路由配置: [router.tsx](file:///workspace/web/src/router.tsx)

使用 React Router v7 的 `createBrowserRouter`：

| 路径 | 页面组件 | 说明 |
|------|---------|------|
| `/` | [HomePage](file:///workspace/web/src/pages/home/index.tsx) | 首页工作台入口 |
| `/image` | [ImagePage](file:///workspace/web/src/pages/image/index.tsx) | 生图工作台 |
| `/video` | [VideoPage](file:///workspace/web/src/pages/video/index.tsx) | 视频工作台 |
| `/assets` | [AssetsPage](file:///workspace/web/src/pages/assets/index.tsx) | 我的素材库 |
| `/prompts` | [PromptsPage](file:///workspace/web/src/pages/prompts/index.tsx) | 提示词中心 |
| `/canvas` | [CanvasPage](file:///workspace/web/src/pages/canvas/index.tsx) | 画布项目列表 |
| `/canvas/:id` | [CanvasProjectPage](file:///workspace/web/src/pages/canvas/project.tsx) | **核心：画布项目编辑页** |
| `/config` | [ConfigPage](file:///workspace/web/src/pages/config/index.tsx) | 配置页 |
| `*` | [NotFound](file:///workspace/web/src/pages/not-found/index.tsx) | 404 页面 |

所有业务路由嵌套在 `UserLayout` + `AnalyticsTracker` 之下，提供统一导航栏和统计追踪。

---

### 4.2 全局 Provider 与主题系统

#### AppProviders: [app-providers.tsx](file:///workspace/web/src/components/layout/app-providers.tsx)

Provider 嵌套层次：

```
ConfigProvider (antd 中文 + 主题token)
  └── ProConfigProvider (antd pro 深色模式)
       └── App (antd App 顶层方法)
            └── QueryClientProvider (TanStack React Query)
                 └── ClientRootInit (初始化本地存储、插件加载、版本检查)
                      └── children
```

QueryClient 默认配置：
- staleTime: 30 秒
- retry: 不重试
- refetchOnWindowFocus: 关闭

#### 主题 Store: [use-theme-store.ts](file:///workspace/web/src/stores/use-theme-store.ts)

```typescript
type ThemeName = "light" | "dark";
// 默认 dark，持久化到 localStorage: "infinite-canvas:theme_store"
```

#### Ant Design 主题配置: [app-theme.ts](file:///workspace/web/src/lib/app-theme.ts)

`getAntThemeConfig(dark)` 返回适配深浅模式的完整 Ant Design `theme` 配置对象。

#### 画布专用主题: [canvas-theme.ts](file:///workspace/web/src/lib/canvas-theme.ts)

```typescript
export const canvasThemes = {
  light: { canvas, node, toolbar },
  dark:  { canvas, node, toolbar },
}
```

画布 UI 不使用 Ant Design token，而是直接读 canvasThemes，保证画布视觉风格独立一致。

---

### 4.3 状态管理（Stores）

所有 store 均使用 **Zustand + persist 中间件**，业务数据默认通过 `localforageStorage` 持久化到 **IndexedDB**。

| Store 文件 | 持久化 Key | 职责 |
|-----------|-----------|------|
| [use-canvas-store.ts](file:///workspace/web/src/stores/canvas/use-canvas-store.ts) | `infinite-canvas:canvas_store` | **画布项目 CRUD**：项目列表、节点/连线/对话、视口、背景；防抖 400ms 写入 IndexedDB |
| [use-canvas-ui-store.ts](file:///workspace/web/src/stores/canvas/use-canvas-ui-store.ts) | - | **画布 UI 临时状态**：选中节点、视口变换、连接拖拽、框选、右键菜单（不持久化） |
| [use-plugin-store.ts](file:///workspace/web/src/stores/canvas/use-plugin-store.ts) | `infinite-canvas:plugin_store` | **已安装插件**：清单、启用状态、版本记录 |
| [use-config-store.ts](file:///workspace/web/src/stores/use-config-store.ts) | `infinite-canvas:ai_config_store` | **AI 配置**：Base URL / API Key / 渠道 / 模型 / 推理强度 / 质量尺寸等；包含 WebDAV 配置 |
| [use-theme-store.ts](file:///workspace/web/src/stores/use-theme-store.ts) | `infinite-canvas:theme_store` | 浅/深主题切换 |
| [use-asset-store.ts](file:///workspace/web/src/stores/use-asset-store.ts) | `infinite-canvas:asset_store` | "我的素材"资产库（图片/视频） |
| [use-agent-store.ts](file:///workspace/web/src/stores/use-agent-store.ts) | `infinite-canvas:agent_store` | Agent 连接状态、token、对话历史 |
| [use-workbench-agent-store.ts](file:///workspace/web/src/stores/use-workbench-agent-store.ts) | - | 生图/视频工作台专用 Agent 状态 |
| [use-prompt-source-store.ts](file:///workspace/web/src/stores/use-prompt-source-store.ts) | `infinite-canvas:prompt_source_store` | 提示词来源配置、缓存状态、上次同步时间 |
| [use-canvas-side-panel-store.ts](file:///workspace/web/src/stores/use-canvas-side-panel-store.ts) | - | 画布左侧面板（画布元素/资产）开关与宽度 |
| [use-user-store.ts](file:///workspace/web/src/stores/use-user-store.ts) | `infinite-canvas:user_store` | 用户偏好 |

#### use-config-store 核心类型

```typescript
type AiConfig = {
  channelMode: "remote" | "local";
  channels: ModelChannel[];       // 多渠道支持
  baseUrl, apiKey, apiFormat;     // 兼容单渠道模式
  model, imageModel, videoModel, textModel, audioModel;  // 各模态默认模型
  reasoningEffort: "auto"|"low"|"medium"|"high"|"xhigh";
  quality, size, count, ...       // 生成参数默认值
}

type ModelChannel = {
  id, name, baseUrl, apiKey, apiFormat;
  models: ChannelModel[];         // { name, capability: "image"|"video"|"text"|"audio", script? }
}
```

- **渠道-模型分隔符**: `::`（如 `default::gpt-image-2`）
- **模型能力推断**: `guessCapability(name)` 根据模型名关键字自动识别
- **自定义脚本**: 每个 `ChannelModel` 可配自定义 JS `script`，灵活适配非标准接口

---

### 4.4 页面（Pages）

#### 首页: [home/index.tsx](file:///workspace/web/src/pages/home/index.tsx)
工作台入口，展示各功能模块导航卡片。

#### 生图工作台: [image/index.tsx](file:///workspace/web/src/pages/image/index.tsx)
独立于画布的文生图/图生图操作界面，含：
- 提示词输入 + 参考图上传
- 模型/尺寸/质量/数量选择
- 生成结果预览与批量操作
- 调用 `services/api/image.ts` 的 `requestGeneration`

#### 视频工作台: [video/index.tsx](file:///workspace/web/src/pages/video/index.tsx)
视频生成界面，参数含时长、质量、是否生成音频、水印。

#### 提示词中心: [prompts/index.tsx](file:///workspace/web/src/pages/prompts/index.tsx)
- 双栏布局：左侧来源筛选，右侧内容卡片
- 从 GitHub 开源仓库同步 JSON 格式提示词，缓存到 IndexedDB
- 支持跨来源搜索（防抖）
- 详情弹窗 `components/prompt-detail-dialog.tsx`

#### 我的素材: [assets/index.tsx](file:///workspace/web/src/pages/assets/index.tsx)
- 本地图片/视频资产卡片列表
- 支持上传、删除、批量导出
- `asset-transfer.ts` 处理资产迁移逻辑

#### 画布项目列表: [canvas/index.tsx](file:///workspace/web/src/pages/canvas/index.tsx)
- 画布项目卡片网格（`canvas-project-card.tsx`）
- 创建、重命名、删除、导入项目

#### 画布项目编辑页（核心）: [canvas/project.tsx](file:///workspace/web/src/pages/canvas/project.tsx)
> 这是整个项目最复杂的单文件，约 1000+ 行。

**职责聚合**：
1. 画布视口与无限画布渲染（`InfiniteCanvas`）
2. 节点管理：创建、拖拽、缩放、旋转、裁剪、切分、放大
3. 连线管理：创建、删除、路径渲染（贝塞尔曲线）
4. 节点间数据依赖：连接决定生成输入来源
5. AI 生成编排：基于节点+连线组装 prompt，调用 image/video/audio API
6. 画布右键菜单、悬停工具栏、图片编辑弹窗
7. 侧边面板（元素列表+资产库）宽度拖拽
8. 小地图渲染
9. 与本地 Agent 桥接（`use-agent-bridge.ts`）
10. 插件宿主运行时（`use-plugin-host.tsx`）
11. 画布导入导出（zip 压缩包）
12. 键盘快捷键处理

---

### 4.5 组件系统（Components）

#### Agent 组件（components/agent/）

| 文件 | 职责 |
|------|------|
| [agent-panel.tsx](file:///workspace/web/src/components/agent/agent-panel.tsx) | Agent 面板顶层容器：标题行 + Tab 切换（对话/历史/日志） |
| [agent-chat.tsx](file:///workspace/web/src/components/agent/agent-chat.tsx) | 对话视图：消息列表 + 输入框 + 回到底部 |
| [agent-chat-message.tsx](file:///workspace/web/src/components/agent/agent-chat-message.tsx) | 单条消息渲染：Markdown、图片缩略图、思考摘要折叠、工具操作时间线 |
| [agent-chat-composer.tsx](file:///workspace/web/src/components/agent/agent-chat-composer.tsx) | 输入框：文本输入 + `@` 引用资源 + 图片附件上传 + 推理强度选择 |
| [agent-connect-view.tsx](file:///workspace/web/src/components/agent/agent-connect-view.tsx) | Agent 未连接时的连接表单（地址+token） |
| [agent-history-view.tsx](file:///workspace/web/src/components/agent/agent-history-view.tsx) | 历史对话列表：多选删除、点击进入会话 |
| [agent-log-view.tsx](file:///workspace/web/src/components/agent/agent-log-view.tsx) | 排查日志：结构化滚动列表、筛选、展开详情、折叠重复事件 |
| [agent-event-formatters.ts](file:///workspace/web/src/components/agent/agent-event-formatters.ts) | Agent 流式事件格式化成中文过程时间线 |
| [local-agent-panel.tsx](file:///workspace/web/src/components/agent/local-agent-panel.tsx) | 画布 Agent 面板入口：判断连接状态后路由到连接页或对话页 |

#### 画布组件（components/canvas/）

| 文件 | 职责 |
|------|------|
| [infinite-canvas.tsx](file:///workspace/web/src/components/canvas/infinite-canvas.tsx) | **画布视口容器**：处理平移/缩放/双击/悬停，提供 world↔screen 坐标变换 |
| [canvas-node.tsx](file:///workspace/web/src/components/canvas/canvas-node.tsx) | **单个节点渲染器**：根据 type 分发到内置渲染器或插件 Content 组件；处理选中态/拖拽/缩放手柄 |
| [canvas-connections.tsx](file:///workspace/web/src/components/canvas/canvas-connections.tsx) | SVG 连线：`ConnectionPath`（静态）+ `ActiveConnectionPath`（拖拽创建中） |
| [canvas-toolbar.tsx](file:///workspace/web/src/components/canvas/canvas-toolbar.tsx) | 画布顶部工具栏：撤销/重做/视图/背景模式切换（扁平无底色风格） |
| [canvas-top-bar.tsx](file:///workspace/web/src/components/canvas/canvas-top-bar.tsx) | 画布页面顶栏：项目标题 + 面板开关 + Agent 入口 + 菜单 |
| [canvas-side-panel.tsx](file:///workspace/web/src/components/canvas/canvas-side-panel.tsx) | 左侧面板：Tab 切换（画布元素/资产），支持拖拽宽度、展开收起动画 |
| [canvas-mini-map.tsx](file:///workspace/web/src/components/canvas/canvas-mini-map.tsx) | 右下角小地图：根据 `canvasThemes` 配色渲染节点色块缩略 |
| [canvas-node-prompt-panel.tsx](file:///workspace/web/src/components/canvas/canvas-node-prompt-panel.tsx) | 节点下方 prompt 编辑面板：输入 + `@` 资源引用 + 生成按钮 |
| [canvas-node-hover-toolbar.tsx](file:///workspace/web/src/components/canvas/canvas-node-hover-toolbar.tsx) | 节点悬停工具栏：裁剪/切分/放大/旋转/遮罩/导出/删除 |
| [canvas-config-composer.tsx](file:///workspace/web/src/components/canvas/canvas-config-composer.tsx) | Config 节点下游节点的提示词组装浮层 |
| [canvas-config-node-panel.tsx](file:///workspace/web/src/components/canvas/canvas-config-node-panel.tsx) | Config 节点自身参数面板：生成模式/模型/推理强度/尺寸 |
| [canvas-context-menu.tsx](file:///workspace/web/src/components/canvas/canvas-context-menu.tsx) | 右键菜单（节点或连线） |
| [canvas-create-menus.tsx](file:///workspace/web/src/components/canvas/canvas-create-menus.tsx) | 新建节点菜单 + 从连线端点新建节点菜单（读节点注册表动态展示） |
| [canvas-*-dialog.tsx](file:///workspace/web/src/components/canvas/) | 各类节点编辑弹窗：裁剪/切分/放大/旋转/遮罩/删除项目/角度/插件管理 |
| [canvas-image-toolbar-tools.tsx](file:///workspace/web/src/components/canvas/canvas-image-toolbar-tools.tsx) | 图片节点专用工具栏工具集合 |
| [canvas-plugin-manager-modal.tsx](file:///workspace/web/src/components/canvas/canvas-plugin-manager-modal.tsx) | 插件管理弹窗：安装/启用/更新/卸载远程插件 |
| [canvas-prompt-library.tsx](file:///workspace/web/src/components/canvas/canvas-prompt-library.tsx) | 画布内置提示词库面板 |
| [canvas-prompt-chip-input.tsx](file:///workspace/web/src/components/canvas/canvas-prompt-chip-input.tsx) | 提示词芯片输入组件 |
| [canvas-resource-mention-textarea.tsx](file:///workspace/web/src/components/canvas/canvas-resource-mention-textarea.tsx) | 支持 `@` 资源引用的 Textarea（内联缩略图预览） |
| [canvas-size-picker.tsx](file:///workspace/web/src/components/canvas/canvas-size-picker.tsx) | 画布尺寸比例选择器 |
| [canvas-zoom-controls.tsx](file:///workspace/web/src/components/canvas/canvas-zoom-controls.tsx) | 缩放控制：缩小/放大/重置/滑块 |
| [asset-picker-modal.tsx](file:///workspace/web/src/components/canvas/asset-picker-modal.tsx) | 资产选择弹窗（从素材库选取） |
| [canvas-project-card.tsx](file:///workspace/web/src/components/canvas/canvas-project-card.tsx) | 画布项目列表卡片 |
| [nodes/builtin-nodes.tsx](file:///workspace/web/src/components/canvas/nodes/builtin-nodes.tsx) | **内置节点定义注册**：Text/Image/Video/Audio/Config/Group |

#### 布局组件（components/layout/）

| 文件 | 职责 |
|------|------|
| [app-providers.tsx](file:///workspace/web/src/components/layout/app-providers.tsx) | 全局 Provider 组合（见 4.2） |
| [client-root-init.tsx](file:///workspace/web/src/components/layout/client-root-init.tsx) | 应用启动初始化：检查版本更新、加载已安装插件、同步 WebDAV（若配置） |
| [app-top-nav.tsx](file:///workspace/web/src/components/layout/app-top-nav.tsx) | 顶部导航栏：logo + 路由菜单 + 配置按钮 + 主题切换 + 用户操作 |
| [user-layout.tsx](file:///workspace/web/src/layouts/user-layout.tsx) | 用户布局：导航栏 + 内容区 |
| [app-config-modal.tsx](file:///workspace/web/src/components/layout/app-config-modal.tsx) | 配置弹窗容器（4 个 Tab：渠道/偏好/提示词来源/WebDAV） |
| [model-script-editor.tsx](file:///workspace/web/src/components/layout/model-script-editor.tsx) | 模型自定义脚本编辑器（CodeMirror） |
| [channel-editor-drawer.tsx](file:///workspace/web/src/components/layout/channel-editor-drawer.tsx) | AI 渠道编辑器抽屉 |
| [model-select-modal.tsx](file:///workspace/web/src/components/layout/model-select-modal.tsx) | 模型选择弹窗 |
| [prompt-source-editor-drawer.tsx](file:///workspace/web/src/components/layout/prompt-source-editor-drawer.tsx) | 提示词来源编辑器抽屉 |
| [config-prompt-sources.tsx](file:///workspace/web/src/components/layout/config-prompt-sources.tsx) | 提示词来源卡片列表（数量/状态/上次同步） |
| [version-release-modal.tsx](file:///workspace/web/src/components/layout/version-release-modal.tsx) | 版本更新说明弹窗 |
| [mobile-nav-drawer.tsx](file:///workspace/web/src/components/layout/mobile-nav-drawer.tsx) | 移动端导航抽屉 |
| [analytics-tracker.tsx](file:///workspace/web/src/components/layout/analytics-tracker.tsx) | 路由切换统计上报（GA4/百度统计） |

---

## 5. 画布系统详解

### 5.1 画布数据结构

#### 类型定义: [types/canvas.ts](file:///workspace/web/src/types/canvas.ts)

```typescript
// 画布项目（最顶层容器）
type CanvasProject = {
  id: string;                    // nanoid
  title: string;
  createdAt, updatedAt: string;  // ISO 日期
  nodes: CanvasNodeData[];
  connections: CanvasConnection[];
  chatSessions: CanvasAssistantSession[];
  activeChatId: string | null;
  backgroundMode: "dots" | "lines" | "blank";
  showImageInfo: boolean;
  viewport: ViewportTransform;   // { x, y, k }
}

// 节点
type CanvasNodeData = {
  id: string;
  type: CanvasNodeTypeId;        // 内置: CanvasNodeType 枚举; 插件: "<pluginId>:<name>"
  title: string;
  position: Position;            // { x, y } 画布世界坐标
  width, height: number;         // 节点尺寸
  metadata?: CanvasNodeMetadata; // 见下
}

// 节点元数据（核心业务字段）
type CanvasNodeMetadata = {
  content?: string;              // 图片/视频: dataUrl 或 storageKey; 文本: 文本内容
  prompt?: string;               // 生成提示词
  composerContent?: string;      // Config 组装后的完整 prompt
  status: "idle" | "success" | "loading" | "error";
  errorDetails?: string;
  fontSize?: number;             // 文本节点字号
  
  // 生成参数（节点级，覆盖全局默认）
  generationMode?: "text" | "image" | "video" | "audio";
  generationType?: "generation" | "edit";  // 图生图类型
  model?: string;                // 渠道::模型名
  reasoningEffort?: ReasoningEffort;
  size?: string;                 // "1:1", "16:9" 等
  quality?: string;              // "low"|"medium"|"high" 等
  background?: string;           // 透明背景开关等
  count?: number;                // 本次生成数量
  
  // 视频专用
  seconds?, vquality?, generateAudio?, watermark?;
  
  // 音频专用
  audioVoice?, audioFormat?, audioSpeed?, audioInstructions?;
  
  // 资源引用（@ 引用的上游节点 ID）
  references?: string[];
  
  // 图片/视频几何信息
  naturalWidth?, naturalHeight?;
  freeResize?: boolean;          // 图片节点是否允许不保持比例
  
  // 批量生成
  isBatchRoot?: boolean;
  batchRootId?: string;
  batchChildIds?: string[];
  batchUsesReferenceImages?: boolean;
  primaryImageId?: string;
  imageBatchExpanded?: boolean;
  
  // 存储
  storageKey?: string;           // localforage key（用于大文件）
  mimeType?: string;
  bytes?: number;
  durationMs?: number;           // 音频/视频时长
  
  groupId?: string;              // 所属组节点 ID
  interactive?: boolean;         // 插件节点: 交互模式 vs 移动模式
}

// 节点间连线
type CanvasConnection = {
  id: string;
  fromNodeId: string;  // 源节点（输出）
  toNodeId: string;    // 目标节点（输入）
}

// 内置节点类型枚举
enum CanvasNodeType {
  Image = "image",
  Text = "text",
  Config = "config",
  Video = "video",
  Audio = "audio",
  Group = "group",
}
```

#### 画布节点默认规格: [constant/canvas.ts](file:///workspace/web/src/constant/canvas.ts)

| 类型 | 默认宽 | 默认高 | 标题 |
|------|--------|--------|------|
| Image | 340 | 240 | 图片 |
| Text | 340 | 240 | 文本 |
| Config | 340 | 240 | 生成配置 |
| Video | 420 | 236 | 视频 |
| Audio | 340 | 120 | 音频 |
| Group | 760 | 480 | 组 |

---

### 5.2 画布状态管理

#### 项目 Store: [use-canvas-store.ts](file:///workspace/web/src/stores/canvas/use-canvas-store.ts)

```typescript
type CanvasStore = {
  hydrated: boolean;             // IndexedDB 恢复完成标志
  projects: CanvasProject[];
  
  createProject(title?): string;           // 返回新项目 id
  importProject(partial): string;          // 导入（重新生成 id）
  openProject(id): CanvasProject | null;
  renameProject(id, title): void;
  deleteProjects(ids[]): void;
  replaceProjects(projects): void;         // 全量替换（用于导入/同步）
  updateProject(id, patch): void;          // 局部更新 nodes/connections/chatSessions/...
}
```

**持久化机制**：
- 自定义 `PersistStorage` 包装 `localforageStorage`
- `setItem` 防抖 **400ms**：短时间连续编辑只写一次磁盘
- `partialize` 只序列化 `projects` 字段，`hydrated` 不持久化
- onRehydrateStorage 完成后标记 `hydrated: true`

#### 画布 UI Store: use-canvas-ui-store.ts

内存态，不持久化，管理：
- `selectedNodeIds: Set<string>` - 当前选中节点
- `viewport: ViewportTransform` - 实时视口（编辑中不写入项目）
- `hoveredNodeId`, `editingNodeId`
- 连接拖拽中状态：`pendingConnection`
- 框选状态：`selectionBox`
- 右键菜单状态：`contextMenu`
- 撤销/重做栈（operations）

---

### 5.3 节点注册表与插件系统

#### 节点注册表: [node-registry.ts](file:///workspace/web/src/lib/canvas/node-registry.ts)

```typescript
// 全局 Map<type, CanvasNodeDefinition>
const definitions = new Map<string, CanvasNodeDefinition>();
const ownerByType = new Map<string, string>();  // type -> pluginId ("builtin" 表示内置)

// 注册表版本号，驱动 UI 重渲染
export const useNodeRegistryVersion = create(() => ({ version: 0 }));

// 核心 API
export function registerNodeDefinitions(defs, pluginId = "builtin"): void;
export function unregisterPluginNodes(pluginId): void;        // 卸载某插件所有节点
export function getNodeDefinition(type): CanvasNodeDefinition | undefined;
export function getNodePluginId(type): string;
export function listNodeDefinitions(): CanvasNodeDefinition[];
export function getNodeSpec(type): { width, height, title, metadata };  // createCanvasNode 专用
```

#### 内置节点注册: [builtin-nodes.tsx](file:///workspace/web/src/components/canvas/nodes/builtin-nodes.tsx)

在模块加载时（画布项目页 import）执行一次 `registerBuiltinNodes()`。

每个内置节点定义包含：
- `type` / `title` / `icon`（lucide-react 图标）
- `defaultSize` / `defaultMetadata`（来自 NODE_SPECS）
- `minimapColor`：小地图色块颜色
- `keepAspectRatio(node)`：是否保持原始比例（图片默认 true，除非 freeResize）
- `hasSourceHandle`：Config 节点无输出连接点
- `resource(node)`：提取节点资源（供 Agent 读取/导出）

---

### 5.4 画布渲染与交互

#### 无限画布视口: [infinite-canvas.tsx](file:///workspace/web/src/components/canvas/infinite-canvas.tsx)

**核心交互**：
- 空白处鼠标拖拽：平移视口（修改 viewport.x/y）
- 滚轮：缩放视口（修改 viewport.k，以光标为锚点）
- 双击空白：根据节点注册表弹出创建菜单
- 框选：按住 Shift + 拖拽 或 在空白空白处划出矩形
- 背景：按 `backgroundMode` 渲染 dots / lines / blank

**坐标系统**：
- Screen 坐标：屏幕像素
- World 坐标：画布世界坐标（节点 position 使用）
- 通过 `viewport` 矩阵换算（平移 x/y + 缩放 k）

#### 节点渲染: [canvas-node.tsx](file:///workspace/web/src/components/canvas/canvas-node.tsx)

渲染分派逻辑：
1. 读取 `getNodeDefinition(node.type)`
2. 若定义包含 `Content` 组件（插件节点），渲染之
3. 否则走内置渲染器（按 CanvasNodeType 分发）
   - Image: `<img>` 填充 + 遮罩层 + loading/error 状态
   - Video: `<video controls>`
   - Audio: `<audio controls>`
   - Text: 可编辑 `<textarea>` 或预览
   - Config: 参数摘要卡片
   - Group: 半透明边框容器，包含节点视觉分组

节点自身交互：
- 选中态：加粗边框 + 8 向缩放手柄
- 拖拽移动：节点体 mousedown
- 保持比例：图片/视频节点缩放手柄对角方向等比缩放
- 悬停：显示悬停工具栏（编辑/删除操作）

#### 连线渲染: [canvas-connections.tsx](file:///workspace/web/src/components/canvas/canvas-connections.tsx)

- 所有连线使用 SVG 层，位于节点之上但交互之下
- 使用三次贝塞尔曲线（Cubic Bezier）连接节点中心锚点
- 激活连线（拖拽创建中）实时跟随鼠标
- 连接目标高亮：拖到节点附近时显示吸附锚点
- 连线支持右键删除

---

### 5.5 画布工具函数库

路径: `web/src/lib/canvas/`

| 文件 | 职责 |
|------|------|
| [canvas-node-factory.ts](file:///workspace/web/src/lib/canvas/canvas-node-factory.ts) | 节点工厂：`createCanvasNode()` 创建空节点；`applyNodeConfigPatch()` 应用 Config 节点参数；`imageMetadata/videoMetadata/audioMetadata()` 组装生成参数 |
| [canvas-node-geometry.ts](file:///workspace/web/src/lib/canvas/canvas-node-geometry.ts) | 几何计算：节点重叠检测、组归属、连接锚点、批量子节点可见性判断、拖拽吸附到组 |
| [canvas-node-size.ts](file:///workspace/web/src/lib/canvas/canvas-node-size.ts) | 尺寸计算：`fitNodeSize()` 按原始比例适配画布；`nodeSizeFromRatio()` 根据比例字符串计算宽高 |
| [canvas-image-data.ts](file:///workspace/web/src/lib/canvas/canvas-image-data.ts) | 图片处理：`cropDataUrl()` 裁剪、`splitDataUrl()` 网格切分、`upscaleDataUrl()` 放大（前端 canvas 实现） |
| [canvas-generation-helpers.ts](file:///workspace/web/src/lib/canvas/canvas-generation-helpers.ts) | **生成编排核心**：沿连接递归查找上游引用、组装参考图数组、解析引用占位符、取消标记恢复、生成数量计算、生成配置构建 |
| [canvas-node-generation.ts](file:///workspace/web/src/components/canvas/canvas-node-generation.ts) | 生成输入/输出：`buildNodeGenerationInputs()` 构建 API 请求 payload；`buildNodeResponseMessages()` 处理流式结果；`hydrateNodeGenerationContext()` 从存储恢复 dataUrl |
| [canvas-export.ts](file:///workspace/web/src/lib/canvas/canvas-export.ts) | 画布导入导出：`exportCanvasProjects()` 打包节点数据+资源为 zip；导入时反向解压恢复 |
| [canvas-agent-ops.ts](file:///workspace/web/src/lib/canvas/canvas-agent-ops.ts) | Agent 操作画布的操作集合（与 Agent bridge 协议一致） |
| [canvas-event-bus.ts](file:///workspace/web/src/lib/canvas/canvas-event-bus.ts) | 画布内事件总线（跨组件通信） |
| [canvas-resource-references.ts](file:///workspace/web/src/lib/canvas/canvas-resource-references.ts) | `@` 资源引用的解析与提示词组装 |
| [plugin-loader.ts](file:///workspace/web/src/lib/canvas/plugin-loader.ts) | 远程插件 ESM 动态加载、沙箱隔离、React 单例注入 |
| [plugin-runtime.ts](file:///workspace/web/src/lib/canvas/plugin-runtime.ts) | 插件运行时 API：`CanvasNodeContext` 注入、主题订阅、节点数据变更回调 |
| [plugin-node-context.ts](file:///workspace/web/src/lib/canvas/plugin-node-context.ts) | 插件节点运行时上下文实现 |
| [plugin-registry.ts](file:///workspace/web/src/lib/canvas/plugin-registry.ts) | 官方插件清单拉取（JSON）、语义化版本比较、升级检测 |

---

## 6. 服务层与 API 调用

### 6.1 AI 图像生成 API

文件: [services/api/image.ts](file:///workspace/web/src/services/api/image.ts)

```typescript
// 三大核心函数
export async function requestGeneration(params)     // 文生图
export async function requestEdit(params)           // 图生图 + 参考图编辑
export async function requestImageQuestion(params)  // 图像问答（多模态对话）
```

**协议适配层**：根据 `apiFormat` 自动适配：
- **openai**：标准 OpenAI Images / Chat Completions 格式
- **gemini**：Google Gemini REST + Stream 格式（支持 2K/4K 质量档位、比例校验）
- **ark**：火山方舟 OpenAI 兼容格式

**自定义脚本管道**：
若渠道模型配置了 `script`，则不直接发 HTTP，而是：
1. 读取用户自定义 JS（CodeMirror 编辑后存 IndexedDB）
2. 在沙箱 Function 中执行，暴露 `fetch`/`axios`/`baseUrl`/`apiKey`/`body`
3. 返回最终 HTTP 请求配置 `{ url, headers, body }` 或直接返回结果

这让用户能灵活对接任何非标准中转站。

**尺寸处理逻辑**（OpenAI 格式）：
- 将 `size: "16:9"` + `quality: "medium"` 换算成真实像素（如 2048×1152）
- 约束：最小边 1024、总像素 655360~8294400、最大边 3840、比例 ≤3、16 像素对齐

### 6.2 AI 视频生成 API

文件: [services/api/video.ts](file:///workspace/web/src/services/api/video.ts)

```typescript
export async function requestVideoGeneration(params)
export async function storeGeneratedVideo(dataUrl, metadata)  // 存到 localforage
```

支持 Seedance、Kling、Wan、Hailuo、Sora 等模型关键字自动识别协议。

### 6.3 AI 音频生成 API

文件: [services/api/audio.ts](file:///workspace/web/src/services/api/audio.ts)

```typescript
export async function requestAudioGeneration(params)
export async function storeGeneratedAudio(dataUrl, metadata)
```

默认模型：`gpt-4o-mini-tts`，参数包含 voice、format、speed、instructions。

### 6.4 提示词来源服务

| 文件 | 职责 |
|------|------|
| [prompt-source-presets.ts](file:///workspace/web/src/services/api/prompt-source-presets.ts) | 内置预设来源（BananaPromptQuicker + 通用 JSON） |
| [prompt-source-runtime.ts](file:///workspace/web/src/services/api/prompt-source-runtime.ts) | 运行时拉取、缓存到 IndexedDB、增量更新、失败回滚 |
| [prompts.ts](file:///workspace/web/src/services/api/prompts.ts) | 统一提示词查询 API（跨来源聚合搜索） |

### 6.5 本地存储服务

| 文件 | 职责 |
|------|------|
| [image-storage.ts](file:///workspace/web/src/services/image-storage.ts) | 图片 dataUrl ↔ localforage storageKey 互转（大图片不存 JSON，防膨胀） |
| [file-storage.ts](file:///workspace/web/src/services/file-storage.ts) | 通用文件存储（视频/音频 blob），支持上传读取到 dataUrl |
| [config-file.ts](file:///workspace/web/src/services/config-file.ts) | 配置文件导入导出（JSON 格式） |
| [webdav-sync.ts](file:///workspace/web/src/services/webdav-sync.ts) | WebDAV 同步：项目数据+资源打包上传/下载还原 |
| [agent-chat-storage.ts](file:///workspace/web/src/services/agent-chat-storage.ts) | Agent 对话历史归档 |
| [app-sync.ts](file:///workspace/web/src/services/app-sync.ts) | 全局同步编排 |

---

## 7. Canvas Agent 系统

### 7.1 架构概述

`canvas-agent/` 是独立的 **Node.js 包**，同时支持两种运行模式：

```
┌─────────────────────────────────────────┐
│           Canvas Agent 进程             │
│                                         │
│  ┌──────────────┐   ┌──────────────┐   │
│  │  HTTP Server │   │  MCP Server  │   │
│  │  (默认模式)  │   │  (codex mcp) │   │
│  │ :17371       │   │  stdio       │   │
│  └──────┬───────┘   └──────┬───────┘   │
│         │                  │           │
│  ┌──────▼──────────────────▼───────┐   │
│  │       Canvas Session 层         │   │
│  │  (画布会话 + 操作 + 工具)       │   │
│  └──────────────┬─────────────────┘   │
│                 │                     │
│  ┌──────────────▼─────────────────┐   │
│  │  Codex CLI (app-server stdio)  │   │
│  │  (--allowedTools mcp 放行)     │   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

入口: [canvas-agent/src/index.ts](file:///workspace/canvas-agent/src/index.ts)
```typescript
process.argv[2] === "mcp" ? startMcpServer() : startHttpServer();
```

启动命令：
| 命令 | 模式 | 用途 |
|------|------|------|
| `npx -y @basketikun/canvas-agent` | HTTP (默认) | 浏览器画布侧边栏连接 |
| `npx -y @basketikun/canvas-agent mcp` | MCP (stdio) | Codex/Claude 终端注册为 MCP 工具 |
| `canvas-agent --debug` | HTTP + 调试日志 | 排查连接/工具调用问题 |

### 7.2 HTTP 服务模式

文件: [canvas-agent/src/server/http.ts](file:///workspace/canvas-agent/src/server/http.ts)

- **监听**: `127.0.0.1:17371`（仅本机）
- **安全**: 首次连接成功后记录 Origin，后续其他 Origin 拒绝（除非删 `~/.infinite-canvas/canvas-agent.json`）
- **Token**: 启动时随机生成 connect token，浏览器首次握手必须携带
- **通信协议**: SSE（Server-Sent Events）推送 Codex 流式事件 + HTTP POST 接收用户消息
- **图片附件**: 前端上传图片 → Agent 临时写本机 → 作为 `localImage` 传给 Codex app-server
- **请求体限制**: 30MB

### 7.3 MCP 服务模式

文件: [canvas-agent/src/server/mcp.ts](file:///workspace/canvas-agent/src/server/mcp.ts)

使用官方 `@modelcontextprotocol/sdk` 通过 stdio 通信。

注册的 MCP 工具（`zod` 描述入参）：

| 工具 | 说明 |
|------|------|
| `canvas_get_state` | 获取画布全量快照（节点+连线+视口） |
| `canvas_get_selection` | 获取当前选中节点及依赖链 |
| `canvas_export_snapshot` | 导出画布为 zip 压缩包到本地路径 |
| `canvas_apply_ops` | 原子化应用操作数组：`add_node` / `update_node` / `delete_node` / `add_connection` / `delete_connection` / `set_viewport` / `generate_from_node` |
| `canvas_create_text_node` | 快捷创建文本节点 |
| `canvas_create_image_prompt_flow` | 快捷创建「文本 prompt → 图片生成」节点链 |

### 7.4 核心模块

| 路径 | 职责 |
|------|------|
| `agent/codex.ts` | Codex CLI 适配器：`codex app-server --stdio` 启动、事件转发、线程管理、增量回复合并 |
| `agent/claude.ts` | Claude Code CLI 适配器（预留，当前前端未开放） |
| `agent/codex-client.ts` | app-server SSE 客户端封装 |
| `agent/codex-protocol.ts` | Codex 事件类型定义 |
| `agent/codex-history.ts` | 线程历史持久化与恢复 |
| `agent/types.ts` | Agent 层通用类型 |
| `canvas/session.ts` | 画布会话：浏览器画布连接配对、操作队列、请求路由 |
| `canvas/tools.ts` | 画布工具实现（MCP 工具与 HTTP 共用同一套） |
| `canvas/schemas.ts` | `zod` schema：操作/节点/连接的入参校验 |
| `canvas/operations.ts` | 操作定义（op 类型 union） |
| `canvas/types.ts` | 画布层类型 |
| `utils/logger.ts` | winston 日志：终端彩色 + 文件 JSON（token/dataUrl 自动脱敏） |
| `utils/date.ts` | 日期格式化 |
| `utils/value.ts` | 通用值处理 |

---

## 8. 插件系统

### 8.1 插件 SDK

路径: [plugins/canvas/sdk/](file:///workspace/plugins/canvas/sdk/README.md)

提供能力：
- **完整类型**：`CanvasPlugin` / `CanvasNodeDefinition` / `CanvasNodeContentProps` 等
- `definePlugin(pluginObj)`：类型补全
- **automatic JSX**：`jsxImportSource` 指向 SDK，TSX 自动转发宿主 React
- **类型化 hooks**：`useState/useEffect/useMemo/useRef` 等运行时转发宿主 React 单例
- `buildPlugin(import.meta.url)`：统一 esbuild 构建（插件 build.mjs 一行搞定）

**设计约束**：
- **React 单例**：JSX/hooks 惰性读取 `globalThis.InfiniteCanvasRuntime.React`，全程 external
- **重依赖**：three/marked 等从 `https://esm.sh/` 动态 `await import()`，esbuild 不打包
- **类型真源**：`sdk/src/types.ts` 是宿主 `web/src/types/canvas-plugin.ts` 的镜像

### 8.2 内置画布插件

| 插件目录 | 节点类型 | 功能 |
|---------|---------|------|
| [html/](file:///workspace/plugins/canvas/html/src/index.tsx) | `canvas-plugin-html:node` | 嵌入式 HTML 渲染（iframe 沙箱） |
| [markdown/](file:///workspace/plugins/canvas/markdown/src/index.tsx) | `canvas-plugin-markdown:node` | Markdown 文档渲染（streamdown） |
| [svg/](file:///workspace/plugins/canvas/svg/src/index.tsx) | `canvas-plugin-svg:node` | SVG 矢量图节点 |
| [sticky-note/](file:///workspace/plugins/canvas/sticky-note/src/index.tsx) | `canvas-plugin-sticky-note:node` | 彩色便利贴（便签） |
| [panorama/](file:///workspace/plugins/canvas/panorama/src/index.tsx) | `canvas-plugin-panorama:node` | 360° 全景图查看器 |
| [template/](file:///workspace/plugins/canvas/template/src/index.tsx) | - | 新插件模板（可复制起步） |
| [registry/](file:///workspace/plugins/canvas/registry) | - | 官方插件清单 JSON 生成 |

### 8.3 插件运行时

宿主加载流程（web 端）：

```
1. 插件管理器获取 URL → plugin-loader.ts 动态 import() ESM
2. 加载前注入 globalThis.InfiniteCanvasRuntime = { React, hooks, theme, storeApi... }
3. ESM 执行 → definePlugin() 返回 CanvasPlugin 对象
4. 遍历 plugin.nodes → registerNodeDefinitions(nodes, pluginId)
5. use-plugin-host.tsx 渲染时读取插件 Content 组件并注入 CanvasNodeContext
6. 卸载插件时 unregisterPluginNodes(pluginId)
```

关键文件：
- [plugin-loader.ts](file:///workspace/web/src/lib/canvas/plugin-loader.ts) - ESM 加载 + React 注入
- [plugin-runtime.ts](file:///workspace/web/src/lib/canvas/plugin-runtime.ts) - 运行时 API 提供
- [plugin-node-context.ts](file:///workspace/web/src/lib/canvas/plugin-node-context.ts) - 节点上下文实现

---

## 9. 文档站点（docs/）

基于 **Next.js 16 + Fumadocs + MDX**。

### 文档内容结构

路径: `docs/content/docs/`

| 目录 | 说明 |
|------|------|
| `overview/` | 总览：quick-start（快速开始）、features（功能介绍）、docker、render、third-party-prompt-repositories |
| `canvas/` | 画布手册：canvas-node-manual（节点操作）、canvas-shortcuts（快捷键） |
| `development/` | 开发文档：local-development、canvas-data-structure、local-codex-canvas（原理说明） |
| `business/` | 商务：license、cla、business |
| `progress/` | 进度：todo、pending-test、local-agent-integration-plan（规划） |
| `support/` | 支持：security、sponsor |

文档索引: [docs/index.md](file:///workspace/docs/index.md)

### 构建与部署

- `npm run dev` - 本地开发
- `npm run build` - 构建静态站点
- Dockerfile 独立镜像，GitHub Actions 有 `docs-docker-image.yml` 流程
- 文档站也可独立部署到 Vercel（见 `docs/vercel.json`）

---

## 10. 配置与部署

### 10.1 本地开发

```bash
# 前端 SPA（主要开发入口）
cd web
bun install          # 或 npm install / pnpm install
bun run dev          # Vite dev server: http://localhost:3000

# 文档站点（可选）
cd docs
npm install
npm run dev

# Canvas Agent（可选，用于 Agent 功能调试）
cd canvas-agent
npm install
npm run build
npm run dev          # HTTP 模式
# 或
node dist/index.js mcp  # MCP 模式
```

### 10.2 Docker 部署

#### Docker Compose: [docker-compose.yml](file:///workspace/docker-compose.yml)

```yaml
services:
  app:
    image: ghcr.io/basketikun/infinite-canvas:latest
    ports: ["3000:3000"]
    restart: unless-stopped
    environment:
      # 可选统计
      ANALYTICS_GA4_ID: "G-XXXXXXXXXX"
      ANALYTICS_BAIDU_ID: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Dockerfile 构建流程: [Dockerfile](file:///workspace/Dockerfile)

```
Stage 1 (web-build, oven/bun:1.3.13):
  - 安装 web 依赖（bun install，带 cache mount）
  - 拷贝 VERSION + CHANGELOG.md
  - bun run build → web/dist

Stage 2 (nginx:1.27-alpine):
  - 拷贝 dist → /usr/share/nginx/html
  - 拷贝 nginx.conf（SPA fallback + gzip + cache）
  - 拷贝 docker-entrypoint.sh（运行时注入环境变量到 config.js）
  - EXPOSE 3000
```

#### Nginx 配置: [nginx.conf](file:///workspace/nginx.conf)
- SPA history fallback（try_files $uri /index.html）
- 静态资源 gzip 压缩
- /assets 长缓存
- /config.js 不缓存（运行时注入）

#### 运行时配置注入
`web/docker-entrypoint.sh` 在容器启动时：
1. 读取 `ANALYTICS_GA4_ID`、`ANALYTICS_BAIDU_ID` 等环境变量
2. 覆盖写入 `/usr/share/nginx/html/config.js`
3. 前端 `public/config.js` 启动时读取

### 10.3 Vite 构建配置

文件: [web/vite.config.ts](file:///workspace/web/vite.config.ts)

| 配置项 | 说明 |
|-------|------|
| `base` | 默认 `/`，可通过 `VITE_BASE` 环境变量覆盖（子路径部署） |
| `alias.@` | 指向 `web/src` |
| `__APP_VERSION__` | 编译时注入，读根目录 `VERSION` 文件 |
| `__APP_RELEASES__` | 编译时注入，解析 `CHANGELOG.md` 为结构化版本列表 |
| `localPluginsManifest()` | 自定义 Vite 插件：dev 实时读 `public/plugins/*.js`，build 时产出静态 `plugins/index.json` 清单 |

---

## 11. 依赖关系总览

### 前端核心依赖（web/package.json）

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | 19.2.5 | UI 框架 |
| react-router | 7.12.0 | 路由（含 data router） |
| antd | 6.4.2 | UI 组件库 |
| @ant-design/pro-components | 3.0.0-beta.3 | Pro 级高级组件 |
| @ant-design/icons | 6.1.1 | Ant Design 图标 |
| zustand | 5.0.12 | 轻量状态管理 |
| localforage | 1.10.0 | IndexedDB 持久化 |
| @tanstack/react-query | 5.100.9 | 服务端状态/缓存 |
| axios | 1.16.0 | HTTP 客户端 |
| nanoid | 5.1.11 | 唯一 ID 生成 |
| tailwindcss | 4 | 原子化 CSS |
| motion | 12.38.0 | 动画库（原 framer-motion） |
| lucide-react | 1.16.0 | 轻量 SVG 图标 |
| dayjs | 1.11.20 | 日期处理 |
| fflate | 0.8.3 | 高性能 zip 压缩（画布导出） |
| file-saver | 2.0.5 | 浏览器文件下载 |
| copy-to-clipboard | 4.0.2 | 复制文本 |
| streamdown | 2.5.0 | 流式 Markdown 渲染 |
| @uiw/react-codemirror | 4.25.9 | 代码编辑器（自定义脚本） |
| @codemirror/lang-javascript | 6.2.5 | JS 语法 |
| @codemirror/lang-json | 6.0.2 | JSON 语法 |
| class-variance-authority + clsx + tailwind-merge | - | shadcn 样式工具链 |
| radix-ui | 1.4.3 | 无样式 UI 原语 |
| shadcn | 4.7.0 | shadcn CLI |

### Canvas Agent 依赖（canvas-agent/package.json）

| 依赖 | 版本 | 用途 |
|------|------|------|
| @modelcontextprotocol/sdk | 1.12.1 | MCP 官方 SDK |
| @openai/codex | 0.146.0 | Codex CLI + app-server 客户端 |
| express | 5.1.0 | HTTP 服务 |
| winston | 3.19.0 | 日志库 |
| zod | 3.25.0 | 参数校验 schema |
| strip-ansi | 7.2.0 | 移除终端颜色 |

### 文档站依赖（docs/package.json）

| 依赖 | 版本 | 用途 |
|------|------|------|
| next | 16.2.6 | Next.js App Router |
| fumadocs-core / fumadocs-mdx / fumadocs-ui | 16.9.3 | MDX 文档框架 |
| @orama/orama | 3.1.18 | 全文搜索（Orama 引擎） |

---

## 12. 版本管理与发布流程

### 版本文件

- 根目录 `VERSION`：当前前端版本号（Vite 构建时注入 `__APP_VERSION__`）
- `CHANGELOG.md`：版本变更日志（带 `Unreleased` 头部）
- canvas-agent 自维护 `canvas-agent/package.json` 中的版本号，与主版本独立

### CHANGELOG 格式

```markdown
## Unreleased
+ [新增] 功能说明
+ [调整] 功能说明
+ [修复] Bug 修复
+ [优化] 性能/体验优化

## v0.12.1 - 2026-07-31
+ ...
```

前缀分类：`[新增]` / `[调整]` / `[修复]` / `[优化]`

### 发版流程（AGENTS.md 规定）

1. 把 `CHANGELOG.md` 的 `Unreleased` 变更整理成新版本记录，保留空 `Unreleased` 标题
2. 提升版本号，更新根目录 `VERSION`
3. `git commit` 所有未提交代码
4. 打 tag，如 `v0.0.5`
5. 推送到远端，触发 GitHub Actions（Docker 镜像 + npm 包发布）

### GitHub Actions

| Workflow 文件 | 职责 |
|--------------|------|
| `.github/workflows/docker-image.yml` | 构建并推送前端 Docker 镜像到 GHCR |
| `.github/workflows/docs-docker-image.yml` | 构建并推送文档站 Docker 镜像 |
| `.github/workflows/github-pages.yml` | 部署文档站到 GitHub Pages |
| `.github/workflows/publish-plugins.yml` | 发布 Canvas Agent npm 包（版本号不存在时） |

---

## 13. 开发规范

来源: [AGENTS.md](file:///workspace/AGENTS.md)

### 基本原则

- **先读再改**：先读现有代码，沿用项目已有结构和写法
- **最少代码**：能简单实现就不要引入复杂抽象
- **用成熟库**：日期/压缩/加密/协议等优先用稳定库，不手写底层
- **不兼容旧数据**：本地存储结构直接按新设计改，不写迁移兜底
- **不做语法检查/构建**：写完代码不用检查，用户自行处理
- **不修改无关文件**：不顺手重构，不回滚已有用户改动

### 前端架构规范

1. **技术栈固定**：Vite + React + React Router + TypeScript + Ant Design + Tailwind + Zustand
2. **API 层**：外部服务请求统放 `web/src/services/api/`，浏览器直连，不假设后端
3. **状态层**：全局/跨页面状态放 `web/src/stores/`；已放 store 的状态不要层层透传 props
4. **全局内容**：全局组件/常量/配置哪里需要哪里直接取，不要当 props 传
5. **UI 副作用**：复制文本/下载/确认弹窗等抽成 `web/src/hooks/` 下的全局 hook，不放 store
6. **页面组织**：路由页 → `web/src/pages/`；布局 → `web/src/layouts/`；路由 → `web/src/router.tsx`
7. **画布分层**：
   - 页面: `web/src/pages/canvas/`
   - 组件: `web/src/components/canvas/`
   - Store: `web/src/stores/canvas/`
   - 工具函数: `web/src/lib/canvas/`
8. **单页主组件**：页面里只有一个主业务组件时直接写在入口 `index.tsx`，不拆 Manager
9. **不写透传组件**：不要 `return <X>{children}</X>` 这种空壳
10. **私有 hook**：页面私有 hook 放对应页面目录；只有真正复用的放外层 `hooks/`
11. **组件优先函数式 + hooks**：不新增大型状态管理方案
12. **图标**：优先 `lucide-react`，其次 Ant Design 图标
13. **文案中文**：页面 UI 文案保持中文
14. **样式自管**：组件私有样式优先 Tailwind className 或少量内联 style；全局 CSS 只放基础变量和第三方覆盖
15. **本地持久化**：业务数据默认 `localforage`；`localStorage` 只用于极小配置

### 画布 UI 规范

1. 必须遵循画布主题（`canvasThemes` / `useThemeStore` / `ConfigProvider token`），不硬编码黑白 stone/slate
2. 顶栏工具栏：**极简扁平** — 无边框、无阴影、无胶囊背景、融入整体、只有轻微 hover
3. 左侧面板缩略图容器：非图片类型（文本/配置/视频/音频等）**不要灰色底色**，图标直接无背景
4. 画布内操作按钮（添加/导出/选择等）：**扁平无底色** — 透明背景 + `hover:bg-black/5 dark:hover:bg-white/10`
5. `theme.toolbar.activeBg` 灰色只允许用于「选中态」高亮，不做普通装饰
6. 图片节点：尊重原始比例，除非功能明确要求自由变形

### 文档规范

- README：简洁，只放介绍+核心功能+快速开始+文档入口
- `docs/index.md`：AI 使用的文档索引
- 详细功能：`docs/content/docs/overview/features.mdx`
- 待办：`docs/content/docs/progress/todo.mdx`
- 待测试：`docs/content/docs/progress/pending-test.mdx`
- 重大改动后：CHANGELOG.md `Unreleased` 追加一条（按前缀分类）
- TODO 完成后：先移到 pending-test，不要直接写进 features；用户确认后才更新 features
- 文档不写过期日期

### 关键路径速查表

| 想做什么 | 改哪个目录/文件 |
|---------|----------------|
| 改首页 | `web/src/pages/home/` |
| 改画布节点渲染 | `web/src/components/canvas/canvas-node.tsx` + `lib/canvas/` 工具 |
| 加新的内置节点类型 | `types/canvas.ts` 加枚举 → `constant/canvas.ts` 加规格 → `components/canvas/nodes/builtin-nodes.tsx` 注册 → canvas-node.tsx 加渲染分支 |
| 改 AI 请求协议 | `services/api/image.ts` / `video.ts` / `audio.ts` |
| 加模型渠道默认值 | `stores/use-config-store.ts` 的 `defaultConfig.channels` |
| 改画布主题颜色 | `lib/canvas-theme.ts` |
| 改 Ant Design 主题 token | `lib/app-theme.ts` |
| Agent 通信协议 | `canvas-agent/src/server/http.ts` + 对应前端 `stores/use-agent-store.ts` |
| MCP 加新工具 | `canvas-agent/src/canvas/tools.ts` + schemas.ts 加 zod schema |
| 开发新节点插件 | 复制 `plugins/canvas/template/`，SDK 说明见 `plugins/canvas/sdk/README.md` |
| 加页面 | `pages/X/index.tsx` → `router.tsx` 注册路由 → `layouts/user-layout.tsx` 加导航 |

---

*文档生成时间：2026-08-13 | 基于代码库 commit 快照*

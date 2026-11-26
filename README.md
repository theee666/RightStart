# RightStart

面向应届毕业生与职场新人的多页面工具网站。使用 Next.js App Router、TypeScript、Tailwind CSS、Lucide 和 React Markdown；AI 请求由服务端转发至已有 Dify Chatflow，不修改工作流。

## 本地运行

需要 Node.js 22 LTS 或更新版本。在项目根目录运行：

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:3000 。当前 Windows 工作目录已准备独立 Node.js 运行环境；如果系统没有 Node，可以运行 `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1`。便携运行环境位于被忽略的 `.work/`，不会上传。

`.env.local` 已创建，请只在这个文件内填写真实密钥，不要发送到聊天或写进代码：

```dotenv
DIFY_API_KEY=在本机手动填写
DIFY_API_URL=https://api.dify.ai/v1
SITE_ACCESS_CODE=
SESSION_SECRET=至少32字符的随机值
```

本机的 `SESSION_SECRET` 已自动生成。修改环境变量后重启服务器。新克隆项目请从 `.env.example` 复制 `.env.local`，并生成自己的会话密钥。可以用 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` 在本机生成会话密钥；这不是 Dify API Key。

## 页面与实际能力

| 页面 | 路径 | 实现 |
| --- | --- | --- |
| 首页 / 工具箱 | `/`、`/tools` | 工具导航、快捷提问、指南与 FAQ |
| Offer 核对 | `/tools/offer` | 信息整理、选择核对项、HR 问题清单、复制与打印 PDF |
| 劳动合同检查 | `/tools/contract` | 合同方向核对与脱敏片段留存；不判断效力 |
| 五险一金 | `/tools/insurance` | 用户自填基数与费率；个人、单位及公积金逐项计算 |
| 面试提问 | `/tools/interview` | 行业/岗位/阶段描述、分类话术、复制与本地确认标记 |
| 入职清单 | `/tools/checklist` | 四阶段 16 项、完成进度、本地保存、重置 |
| 深圳政策 | `/tools/subsidy` | 表单、地区/领域资料检索、上下文转入真实 AI |
| 知识中心 | `/knowledge` | 72 份原始项目资料、分类搜索、地区筛选、详情及官方来源 |
| AI 助手 | `/assistant` | 多轮、SSE 流式、Markdown/表格、复制、新建、停止接收及错误提示 |
| 项目与隐私 | `/about`、`/privacy` | 介绍、数据流向和使用边界 |

**能力边界：** 已检查 `RightStart_Main_Chatflow_V4_2.ifpkg`。应用类型 `advanced-chat`，Start 节点 `variables: []`，上传关闭，支持深圳人才、住房和毕业生落户。没有凭空增加变量；学历等表单事实封装在自然语言 `query` 中，发送 `inputs: {}`。会话内变量由既有工作流提取和管理。

Offer 与合同不属于现有工作流范围，所以本版本提供明确标注的确定性核对工具，不伪装成 AI 分析，不对脱敏片段执行语义解读，不编造风险等级。文件上传关闭，不提供无法被工作流处理的上传入口。更完整的 AI 合同分析需要后续独立授权扩展后端能力。

## Dify 接入与测试

- `POST /api/chat` → `https://api.dify.ai/v1/chat-messages`，`response_mode: streaming`。
- `GET /api/parameters` 在验证会话后读取应用参数，不返回凭据。
- `GET/POST /api/session` 检查服务状态并创建签名匿名会话。`user` 来自服务端 HttpOnly Cookie，浏览器不能指定任意 Dify 用户。
- 客户端继续传递后端返回的 `conversation_id`；Dify 的同用户访问约束用于会话隔离。
- 处理 `message`、`agent_message`、`message_replace`、`message_end`、错误及工作流失败；跨网络块的 UTF-8 和 SSE 帧有专门测试。
- 请求来自同源、校验长度及字段、每用户 12 次/分钟、每 IP 40 次/分钟；验证访问码每 IP 10 次/分钟。
- 限流是进程内、尽力而为的基础防护。Serverless 多实例下不保证全局计数；扩大公开访问前应替换为共享存储限流或配置 Vercel WAF。公开课堂演示建议设置 `SITE_ACCESS_CODE`。
- API Key 仅在服务端环境变量中，未使用任何 `NEXT_PUBLIC_*` 密钥。
- 默认不保存表单/合同；只有勾选项写入 localStorage。Dify 及模型服务可能保留运行日志，已在界面说明。

填写密钥后运行：

```sh
npm run test:dify
```

这会读取真实 `/info`、`/parameters`，核对类型与输入配置，发起两轮无个人信息的真实流式问答，验证 conversation_id 延续及正常结束。消耗真实 Dify/模型额度，Dify 可能保留测试运行记录。脚本不输出密钥或完整回复，结果存于忽略目录 `.work/dify-test-result.json`。测试只是集成验证，不代表所有政策回答已逐条核验。

## 校验

聊天返回修复：服务端先解析 Dify SSE，再通过事件白名单转发正文与必要会话 ID；不转发节点输入、输出、提示词或运行元数据。增量过滤器会暂存跨块的 `<think>` 等标记，删除推理区段；中断时未闭合的推理内容直接丢弃。前端 Markdown 显示与复制共用清理函数，不启用原始 HTML。仅明确标注为 Markdown 文档的外层代码围栏会被展开，普通代码块保留。

网站当前不读取 Dify 历史消息，也不持久保存聊天文本。刷新或新建会话清空当前页面；如果将来接入历史查询，须继续使用同一清理函数，不能直接展示原始 `answer`。

2026-11-26 修复验收：11 项核心测试、15 组浏览器检查及生产构建通过。修复后的页面通过服务端真实调用 Dify 两轮，验证 HTTP 200、`conversation_id` 延续、流式结束、正文显示、复制与手机布局，线上传回的数据未出现推理标签或内部工作流事件。工作流包保持不变。

额外的聊天回归脚本为 `scripts/verify-chat.py`，依赖 Python Playwright 与本机 Chrome。它先使用明确的测试数据检验 Markdown、HTML 安全和复制，再发起两轮真实 Dify 请求（消耗真实额度）；测试数据只用于自动测试，不存在于产品回复逻辑中。

```sh
npm run typecheck
npm test
npm run build
```

核心测试覆盖逐项分币舍入、非法基数/费率、公积金独立基数、SSE 拆帧与错误传播。浏览器验收脚本见 `scripts/browser-qa.py`，需要 Python Playwright 与本机 Chrome，运行时保持开发服务器开启。它检查桌面、平板、手机路由和主要交互，不提供伪造 AI 回复。

## 政策资料

`src/data/knowledge.json` 从项目提供的 `DIFY_TXT` 导入。只收录包含政府来源的 72 份 TXT，排除 INDEX、无政府来源的线索。原始资料快照标记为 2026-11-21，**不是本站实时核验日期**。文章保留原始片段，历史及线索文档额外标注。城市政策费率、上下限和补贴资格不硬编码为默认真值。

重新导入：`python scripts/import-knowledge.py`，然后重新构建。原始 DOCX、PDF、IFPKG、DIFY_TXT 默认留在本地并由 `.gitignore` 排除；可发布的公开资料副本与网站代码已独立保存在 `src/`。

## 部署到 Vercel

按任务约定，待用户验收确认后再创建独立 GitHub 仓库并部署。本地开发不自动发布。

1. 使用本目录作为仓库根目录；确认 `.env.local`、`.work/`、原始资料均被忽略。禁止 `git add -f` 添加密钥。
2. 将源代码、`package.json`、锁文件、配置、README、测试及 `src/data` 提交到独立仓库。
3. Vercel 导入仓库，框架 Next.js，安装 `npm ci`，构建 `npm run build`，Node 22。
4. 在 Vercel 服务端环境变量中设置 `DIFY_API_KEY`、`DIFY_API_URL`、至少 32 字符的 `SESSION_SECRET`；课堂访问保护使用 `SITE_ACCESS_CODE`。不要把 `.env.local` 上传到仓库。
5. `/api/chat` 已设置 `maxDuration = 300`；实际运行时限须结合 Vercel 计划及 Fluid Compute 配置核实。首次政策检索可能较慢。
6. 部署后测试手机、桌面、访问码、两轮 AI、计算器和知识库来源，再交付正式网址。

官方参考：[Dify Chatflow](https://docs.dify.ai/en/api-reference/guides/chatflow)、[发送消息](https://docs.dify.ai/en/api-reference/chat-messages/send-chat-message)、[应用参数](https://docs.dify.ai/en/api-reference/applications/get-app-parameters)、[Vercel 函数时限](https://vercel.com/docs/functions/configuring-functions/duration)。参考站分析与页面映射见 [docs/implementation.md](docs/implementation.md)。

## 本次验收记录

2026-11-26：生产构建、TypeScript、5 项核心测试、15 组浏览器验收通过。13 个主要页面检查了 1440 / 768 / 390 / 360px，无横向溢出和浏览器运行错误。真实 Dify 双轮会话与浏览器→服务端→Dify 的流式问答已验证。浏览器产物扫描未发现 API Key 或会话签名密钥。原始工作流未修改。

浏览器验收脚本为 `scripts/browser-qa.py`，需 Python Playwright 和本机 Chrome，可设置 `RIGHTSTART_BASE_URL` 指向待测服务器。它测试页面、表单、复制、计算、持久化、筛选、会话入口和接口基础防护，不使用模拟 AI 回复。

详情：[验收记录](docs/validation.json) · [桌面首页](docs/previews/home-desktop.png) · [手机首页](docs/previews/home-mobile.png)。GitHub 仓库和 Vercel 部署尚未执行，按要求等待页面确认。

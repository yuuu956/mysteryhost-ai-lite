# Local Development Guide

本文件用于说明如何在本地运行 MysteryHost AI Lite 的真实 AI 版本。

由于 GitHub Pages 是静态部署环境，只能部署前端页面，不能运行本地 Express 后端服务。因此，如果要体验 DeepSeek API 驱动的真实 AI 主持人问答和 AI 推理复盘，需要在本地同时启动前端和后端。

---

## 1. 环境要求

运行本项目需要：

* Node.js
* npm
* DeepSeek API Key
* PowerShell 或其他终端工具

---

## 2. 克隆项目

```bash
git clone https://github.com/yuuu956/mysteryhost-ai-lite.git
cd mysteryhost-ai-lite
```

如果项目已经在本地，则直接进入项目目录：

```powershell
cd E:\workspace\cursor\AIProjects\mysteryhost-ai-lite
```

---

## 3. 安装依赖

```powershell
npm.cmd install
```

说明：

PowerShell 中推荐使用 `npm.cmd`，避免因为 Windows 脚本执行策略导致 `npm.ps1` 无法运行。

---

## 4. 配置环境变量

在项目根目录新建 `.env` 文件：

```text
.env
```

写入以下内容：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=3001
```

注意：

* `.env` 文件只保存在本地
* 不要提交 `.env` 到 GitHub
* 不要把真实 API Key 写入 `.env.example`
* `.env.example` 只作为配置示例文件

---

## 5. 启动后端服务

打开第一个 PowerShell 终端，进入项目目录：

```powershell
cd E:\workspace\cursor\AIProjects\mysteryhost-ai-lite
```

启动后端：

```powershell
npm.cmd run server
```

成功后会看到：

```text
MysteryHost AI Lite backend is running on http://localhost:3001
```

后端服务包含以下接口：

| 接口                           | 作用                      |
| ---------------------------- | ----------------------- |
| `GET /api/health`            | 检查后端是否正常运行              |
| `POST /api/host-chat`        | 调用 DeepSeek 生成 AI 主持人回复 |
| `POST /api/review-reasoning` | 调用 DeepSeek 生成 AI 推理复盘  |

---

## 6. 测试后端健康接口

打开第二个 PowerShell 终端，执行：

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

正常返回：

```text
ok   message
--   -------
True MysteryHost AI Lite backend is running.
```

---

## 7. 启动前端服务

继续在第二个 PowerShell 终端中进入项目目录：

```powershell
cd E:\workspace\cursor\AIProjects\mysteryhost-ai-lite
```

启动前端：

```powershell
npm.cmd run dev
```

成功后会看到：

```text
Local: http://localhost:5173/
```

在浏览器打开：

```text
http://localhost:5173/
```

---

## 8. 本地真实 AI 体验流程

本地运行时需要同时保持两个终端运行：

```text
终端 1：npm.cmd run server
终端 2：npm.cmd run dev
```

然后在页面中测试：

### 8.1 AI 主持人问答

在主持人问答模块输入：

```text
沈念有什么问题？
```

系统流程：

```text
前端输入问题
→ 调用 /api/host-chat
→ 后端调用 DeepSeek API
→ 后端进行防剧透检测
→ 返回 AI 主持人回复
→ 前端展示回复
```

### 8.2 AI 推理复盘

在推理复盘模块输入：

```text
我认为凶手是沈念。她因为财务报销和举报邮件的问题想阻止许言，并利用监控中断和签到记录制造不在场证明。现场的消防通道纤维和墨水痕迹说明她伪造了现场。
```

系统流程：

```text
前端提交推理
→ 调用 /api/review-reasoning
→ 后端调用 DeepSeek API
→ 后端解析结构化 JSON
→ 后端校验模型复盘质量
→ 必要时使用本地规则复盘兜底
→ 前端展示评分、命中点、遗漏点和最终真相
```

---

## 9. 生产构建检查

运行：

```powershell
npm.cmd run build
```

成功后会看到：

```text
✓ built in ...
```

说明前端可以正常打包。

---

## 10. 常见问题

### 10.1 PowerShell 提示无法运行 npm.ps1

如果执行：

```powershell
npm run dev
```

出现脚本执行策略错误，可以改用：

```powershell
npm.cmd run dev
```

后端同理：

```powershell
npm.cmd run server
```

---

### 10.2 后端提示 DEEPSEEK_API_KEY is not configured

说明 `.env` 文件没有正确配置。

检查项目根目录是否存在：

```text
.env
```

并确认里面包含：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=3001
```

修改 `.env` 后，需要重启后端服务。

---

### 10.3 GitHub Pages 上不能使用真实 AI

这是正常现象。

GitHub Pages 是静态前端部署环境，不运行 Express 后端，也不能安全保存 API Key。

因此：

* GitHub Pages 用于展示页面和作品集
* 本地运行用于体验真实 DeepSeek AI 版本

---

### 10.4 API 调用失败时页面是否还能使用？

可以。

本项目设计了 fallback 兜底机制：

* 主持人问答 API 失败时，前端回退到本地规则回答
* 推理复盘 API 失败时，前端回退到本地规则复盘
* 后端复盘质量异常时，也会自动使用规则复盘兜底

这样可以避免 AI 接口异常导致产品完全不可用。

---

## 11. 当前版本说明

当前版本：

```text
v0.3.0 - AI Review and Spoiler Safety
```

已支持：

* DeepSeek AI 主持人问答
* 主持人回答防剧透检测
* DeepSeek AI 推理复盘
* 复盘 JSON 解析
* 模型复盘质量校验
* 本地规则复盘 fallback
* 前端 API 调用失败 fallback

---

## 12. 本地运行命令总结

```powershell
# 安装依赖
npm.cmd install

# 启动后端
npm.cmd run server

# 启动前端
npm.cmd run dev

# 构建检查
npm.cmd run build
```

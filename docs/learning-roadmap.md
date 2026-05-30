# AI Product Manager Learning Roadmap

本文件用于记录我在构建 MysteryHost AI Lite 项目过程中的 AI 产品经理学习路线。

本项目采用项目驱动学习方式，不是单独学习 AI 概念，而是将每个 AI 产品知识点都落到一个具体功能中。

## 1. Learning Strategy

学习路径如下：

```text
AI 概念学习
→ 产品经理视角理解
→ MysteryHost AI Lite 功能设计
→ Demo 实现
→ GitHub 文档沉淀
→ 面试项目表达
```

## 2. Learning Modules

### Module 1: AI Product Manager Basics

学习 AI 产品经理和传统产品经理的区别。

重点内容：

* AI 产品的核心特征
* AI 产品经理的职责
* AI 能力边界
* 用户场景与 AI 能力匹配
* AI 产品中的风险意识

项目落地：

* 明确 MysteryHost AI Lite 的产品定位
* 定义目标用户和核心场景
* 确定 MVP 功能范围

---

### Module 2: LLM Basics

学习大语言模型的基础概念。

重点内容：

* LLM 是什么
* Token
* Context Window
* Temperature
* Hallucination
* 模型输入与输出
* 模型能力边界

项目落地：

* 使用 LLM 生成案件背景
* 使用 LLM 生成角色设定
* 使用 LLM 生成线索与复盘内容

---

### Module 3: Prompt Engineering

学习如何通过 Prompt 控制 AI 输出。

重点内容：

* Role Instruction
* Task Description
* Context Injection
* Output Format
* Constraint Design
* Few-shot Examples

项目落地：

* 设计剧本生成 Prompt
* 设计主持人问答 Prompt
* 设计推理复盘 Prompt
* 控制 AI 不提前剧透

---

### Module 4: Structured Output

学习如何让 AI 输出可被产品界面使用的结构化内容。

重点内容：

* JSON 输出
* 卡片式信息展示
* 表格化结果
* 输出校验
* 前端渲染结构化数据

项目落地：

* 角色卡
* 线索卡
* 推理复盘卡
* 主持人回答卡

---

### Module 5: Memory and State Management

学习 AI 产品中的上下文记忆和状态管理。

重点内容：

* Short-term Memory
* Session State
* User Action History
* Current Game State
* Released Clues
* Question History

项目落地：

* 记录当前游戏回合
* 记录已释放线索
* 记录玩家提问
* 控制主持人只能基于当前信息回答

---

### Module 6: Agent Workflow and Tool Use

学习 Agent 和工具调用的基本思想。

重点内容：

* Agent Workflow
* Function Calling
* Tool Use
* Task Decomposition
* Human Confirmation
* Workflow Control

项目落地：

* 模拟主持人 Agent
* 模拟释放线索工具
* 模拟查看角色工具
* 模拟推理复盘工具

---

### Module 7: AI Evaluation and Risk Control

学习如何评估和控制 AI 产品风险。

重点内容：

* Hallucination Control
* Spoiler Prevention
* Consistency Checking
* User Satisfaction
* Response Quality
* Safety Boundary

项目落地：

* 防止 AI 提前泄露真相
* 防止 AI 编造不存在的线索
* 检查剧本和线索是否一致
* 评估主持人回答质量
* 评估推理复盘是否有帮助

## 3. Final Outputs

项目完成后，GitHub 仓库应包含：

* 可运行的文字版 AI 剧本杀主持人 Demo
* README 项目说明
* AI 产品经理学习路线
* 产品需求文档
* 用户流程文档
* AI 架构设计文档
* Prompt 设计文档
* 状态管理设计文档
* AI 评测与风险控制文档
* 学习笔记

## 4. Project Value

MysteryHost AI Lite 不只是一个文本生成工具，而是一个用于学习 AI 产品经理能力的完整项目。

它重点展示：

* 如何定义 AI 产品场景
* 如何将 AI 能力拆解为产品功能
* 如何设计 AI 交互流程
* 如何控制 AI 输出风险
* 如何将学习过程沉淀为 GitHub 作品集

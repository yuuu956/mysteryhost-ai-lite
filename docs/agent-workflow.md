# Agent Workflow Design: MysteryHost AI Lite

本文件记录 MysteryHost AI Lite 的 Agent Workflow 设计。

当前 MVP 版本暂未接入真实 LLM Agent，而是通过本地状态、函数和规则逻辑模拟 AI 主持人的核心工作流。后续版本可以基于本设计升级为真正的 Agent-style AI 产品。

## 1. Agent Design Goal

MysteryHost AI Lite 的目标不是做一个普通聊天机器人，而是做一个能够管理推理游戏流程的 AI 主持人。

AI 主持人需要完成：

* 管理游戏阶段
* 展示案件背景
* 分配角色信息
* 分轮释放线索
* 回答玩家问题
* 防止提前剧透
* 分析玩家推理
* 输出复盘结果

因此，AI 主持人更适合被设计成一个 Agent，而不是普通 Chatbot。

## 2. Chatbot vs Agent

| Dimension | Chatbot      | Agent              |
| --------- | ------------ | ------------------ |
| 核心行为      | 回答问题         | 推进任务流程             |
| 输入依据      | 用户当前问题       | 用户问题 + 当前状态 + 可用工具 |
| 输出形式      | 文本回答         | 动作决策 + 工具结果 + 文本反馈 |
| 适合场景      | FAQ、闲聊、咨询    | 多步骤任务、流程管理、自动化     |
| 本项目对应     | 玩家问一句，AI 答一句 | AI 主持人根据游戏阶段控制流程   |

MysteryHost AI Lite 需要的是 Agent-style 工作流，因为它不是单轮问答，而是一个分阶段推理流程。

## 3. Agent Role

AI 主持人的角色定义：

> 你是一个文字版剧本杀游戏的 AI 主持人，负责控制游戏节奏、释放线索、回答玩家问题、避免提前剧透，并在玩家提交最终推理后进行复盘。

AI 主持人不应该：

* 提前说出凶手
* 编造不存在的线索
* 跳过游戏阶段
* 直接替玩家完成推理
* 破坏既定剧本设定

## 4. Agent Workflow Overview

完整工作流如下：

```text
Start Game
→ Load Case Data
→ Show Story
→ Show Characters
→ Release Round 1 Clues
→ Player Ask Question
→ Check Game State
→ Decide Response Type
→ Answer Question or Refuse Spoiler
→ Release Next Round Clues
→ Player Submit Reasoning
→ Review Reasoning
→ Show Final Truth
```

## 5. Current MVP Workflow

当前 MVP 中的工作流由 React 状态和本地函数实现。

### 5.1 Load Case Data

系统从本地文件读取结构化案件数据：

```text
src/data/mysteryCase.js
```

包含：

* mysteryCase
* characters
* clues
* truth

### 5.2 Show Story

页面展示案件背景：

* 案件标题
* 主题
* 玩家人数
* 难度
* 死者信息
* 案发地点
* 核心谜题

### 5.3 Show Characters

页面展示角色卡：

* 角色名
* 身份
* 公开信息
* 隐藏秘密
* 与死者关系
* 可疑点

### 5.4 Release Clues

系统根据 currentRound 控制线索释放：

```js
const releasedClues = clues.filter((clue) => clue.round <= currentRound)
```

点击按钮后：

```js
setCurrentRound(currentRound + 1)
```

### 5.5 Answer Player Question

玩家输入问题后，系统根据关键词和当前回合生成主持人回复。

当前是规则模拟版：

* 问死者 → 返回死者相关信息
* 问现场 → 返回现场线索提示
* 问林舟 → 返回林舟嫌疑分析
* 问沈念 → 返回沈念嫌疑分析
* 问真相/凶手 → 拒绝直接剧透

### 5.6 Review Reasoning

玩家提交推理后，系统根据关键词判断：

* 是否指出凶手
* 是否提到作案动机
* 是否分析时间线
* 是否使用现场证据
* 是否遗漏关键点

最终输出：

* score
* level
* matchedEvidence
* missedPoints
* truthSummary

## 6. Tool Design

后续版本可以将当前函数抽象成工具。

### 6.1 releaseClue Tool

用途：

释放下一轮线索。

输入：

```json
{
  "currentRound": 1,
  "maxRound": 3
}
```

输出：

```json
{
  "nextRound": 2,
  "releasedClues": [
    {
      "round": 2,
      "title": "人物关系线索",
      "items": []
    }
  ]
}
```

权限限制：

* 只能在 currentRound < maxRound 时调用
* 不能跳过回合
* 不能一次性释放全部线索

### 6.2 answerQuestion Tool

用途：

根据当前状态回答玩家问题。

输入：

```json
{
  "caseBackground": {},
  "currentRound": 2,
  "releasedClues": [],
  "playerQuestion": "沈念有什么问题？"
}
```

输出：

```json
{
  "reply": "沈念是案发前最后见过死者的人之一..."
}
```

权限限制：

* 不能访问完整 truth
* 不能使用未释放线索
* 不能编造新线索
* 对真相类问题需要拒答或引导

### 6.3 checkSpoilerRisk Tool

用途：

检查主持人回答是否包含剧透风险。

输入：

```json
{
  "reply": "主持人回答文本",
  "truth": {
    "murderer": "沈念"
  },
  "unreleasedClues": []
}
```

输出：

```json
{
  "hasSpoilerRisk": true,
  "riskType": "mentions_murderer",
  "suggestion": "请删除凶手姓名，并改为推理引导。"
}
```

### 6.4 reviewReasoning Tool

用途：

分析玩家最终推理。

输入：

```json
{
  "playerReasoning": "我认为凶手是沈念...",
  "truth": {},
  "keyEvidence": []
}
```

输出：

```json
{
  "score": 85,
  "level": "接近真相",
  "hitPoints": [],
  "missedPoints": [],
  "summary": "玩家整体推理接近真相。"
}
```

权限限制：

* 只在复盘阶段调用
* 可以访问 truth
* 可以揭示最终真相

## 7. Agent Decision Logic

后续 Agent Controller 可以根据用户行为决定调用哪个工具。

示例：

```js
function decideAgentAction(userInput, gameState) {
  if (userInput.type === 'release_clue') {
    return 'releaseClue'
  }

  if (userInput.type === 'ask_question') {
    return 'answerQuestion'
  }

  if (userInput.type === 'submit_reasoning') {
    return 'reviewReasoning'
  }

  return 'clarify'
}
```

## 8. Agent Permissions

不同阶段的 Agent 权限不同。

| Stage        | Allowed Data           | Forbidden Data         | Allowed Tools                    |
| ------------ | ---------------------- | ---------------------- | -------------------------------- |
| Game Start   | case, characters       | truth                  | loadCase                         |
| Clue Phase   | releasedClues          | unreleasedClues, truth | releaseClue, answerQuestion      |
| Q&A Phase    | case, releasedClues    | truth                  | answerQuestion, checkSpoilerRisk |
| Review Phase | case, all clues, truth | none                   | reviewReasoning                  |

核心原则：

> 主持人问答阶段不能访问完整真相，复盘阶段才可以访问 truth。

## 9. Agent Risk Control

### 9.1 Spoiler Risk

风险：

Agent 在不该透露真相时透露了凶手或关键反转。

控制方式：

* 分阶段限制可访问数据
* Host Q&A 不传入 truth
* 增加 checkSpoilerRisk 工具
* 对真相类问题使用拒答策略

### 9.2 Wrong Tool Call

风险：

Agent 在错误阶段调用复盘工具。

控制方式：

* 使用 gameState 限制工具调用
* 在工具调用前做状态检查
* 高风险动作需要用户主动触发

### 9.3 Hallucination Risk

风险：

Agent 编造新线索或新角色。

控制方式：

* 所有回答基于结构化案件数据
* Prompt 明确禁止编造
* 输出后检查是否包含未定义实体

### 9.4 Flow Control Risk

风险：

Agent 跳过游戏阶段，导致体验混乱。

控制方式：

* UI 按钮控制关键流程
* Agent 不能自动越过回合
* 线索释放只能按顺序执行

## 10. Future Architecture

后续版本可以采用以下结构：

```text
User Action
→ Agent Controller
→ Game State Reader
→ Tool Selector
→ Tool Executor
→ Output Validator
→ UI Renderer
```

对应文件可以设计为：

```text
src/
├── agents/
│   └── hostAgent.js
├── tools/
│   ├── releaseClue.js
│   ├── answerQuestion.js
│   ├── reviewReasoning.js
│   └── checkSpoilerRisk.js
├── state/
│   └── gameState.js
└── prompts/
    ├── host-prompt.md
    ├── review-prompt.md
    └── script-generation-prompt.md
```

## 11. Summary

MysteryHost AI Lite 的 Agent 设计重点不是让 AI 完全自主行动，而是让 AI 在明确状态、工具和权限边界内承担主持人职责。

本项目的 Agent Workflow 可以总结为：

> AI 主持人根据当前游戏状态，判断用户意图，选择合适工具，生成符合规则的回应，并通过状态管理和权限控制避免剧透、幻觉和流程失控。

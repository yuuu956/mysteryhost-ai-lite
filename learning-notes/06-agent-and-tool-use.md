# 06 Agent and Tool Use

本笔记用于记录我对 Agent Workflow 和 Tool Use 的理解，并结合 MysteryHost AI Lite 项目分析 AI 主持人如何从“聊天机器人”升级为“能推进任务流程的 AI Agent”。

## 1. 什么是 Agent？

在 AI 产品中，Agent 可以理解为一个能够根据目标、上下文和工具，自主完成一系列步骤的 AI 系统。

普通 Chatbot 通常是：

```text
用户问一句
→ AI 回答一句
```

Agent 更像是：

```text
理解用户目标
→ 判断当前状态
→ 决定下一步动作
→ 调用工具或读取数据
→ 根据结果继续决策
→ 输出最终结果
```

从产品经理视角看，Agent 的重点不是“AI 更聪明”，而是：

> AI 不只生成回答，还能按照业务流程推进任务。

## 2. Agent 和普通聊天机器人的区别

| 维度    | 普通 Chatbot | Agent          |
| ----- | ---------- | -------------- |
| 交互方式  | 问答为主       | 任务流程为主         |
| 行为模式  | 被动回答       | 可根据目标执行步骤      |
| 上下文使用 | 当前问题和历史对话  | 当前状态、任务目标、工具结果 |
| 工具能力  | 通常不调用工具    | 可以调用外部工具或函数    |
| 产品价值  | 信息回答       | 任务完成           |
| 风险重点  | 回答是否准确     | 动作是否正确、是否越权    |

在 MysteryHost AI Lite 中，普通 Chatbot 只会回答玩家问题。

但 AI 主持人 Agent 应该能：

* 判断当前游戏阶段
* 决定是否释放线索
* 判断玩家问题是否会导致剧透
* 调用线索释放工具
* 调用推理复盘工具
* 根据玩家表现给出反馈

## 3. 什么是 Tool Use？

Tool Use 指 AI 在需要时调用外部工具、函数、API 或数据库，而不是只依靠模型本身生成回答。

例如：

```text
AI 判断用户想查天气
→ 调用 weather API
→ 获取天气结果
→ 组织成自然语言回复用户
```

在产品中，Tool Use 可以让 AI 具备：

* 查询数据能力
* 执行动作能力
* 更新状态能力
* 调用业务系统能力
* 生成结构化结果能力

## 4. Function Calling 和 Tool Use 的关系

Function Calling 可以理解为 Tool Use 的一种实现方式。

模型本身并不真正执行函数，而是判断应该调用哪个函数，并输出函数名和参数。

然后由系统执行函数，再把结果返回给模型。

典型流程：

```text
用户提出需求
→ 模型判断需要调用工具
→ 模型输出 tool name 和 arguments
→ 系统执行工具
→ 工具返回结果
→ 模型基于结果生成最终回复
```

## 5. MysteryHost AI Lite 中可以模拟的工具

当前 MVP 还没有真实 Function Calling，但已经有很多可以抽象成工具的本地函数。

### 5.1 releaseClue

用途：

释放下一轮线索。

输入：

```json
{
  "currentRound": 1
}
```

输出：

```json
{
  "nextRound": 2,
  "releasedClues": []
}
```

当前代码中的对应逻辑：

```js
const handleNextRound = () => {
  if (currentRound < clues.length) {
    setCurrentRound(currentRound + 1)
  }
}
```

### 5.2 answerQuestion

用途：

根据当前回合、已释放线索和玩家问题生成主持人回答。

输入：

```json
{
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

当前代码中的对应逻辑：

```js
const handleAskHost = () => {
  // 根据玩家问题和当前回合生成主持人回复
}
```

### 5.3 reviewReasoning

用途：

根据玩家最终推理和案件真相生成复盘结果。

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
  "missedPoints": []
}
```

当前代码中的对应逻辑：

```js
const handleReviewReasoning = () => {
  // 根据关键词和关键证据计算复盘结果
}
```

## 6. AI 主持人 Agent 的工作流设计

后续可以将 MysteryHost AI Lite 的主持人设计成一个 Agent。

### 6.1 游戏开始阶段

```text
用户选择主题、人数、难度
→ Agent 调用 generateScript
→ 生成案件背景、角色卡、线索、真相
→ 初始化 gameState
```

### 6.2 游戏进行阶段

```text
玩家查看角色和线索
→ 玩家提问
→ Agent 判断问题类型
→ 如果是普通调查问题，调用 answerQuestion
→ 如果涉及真相，触发防剧透策略
→ 如果玩家请求下一轮，调用 releaseClue
```

### 6.3 游戏复盘阶段

```text
玩家提交最终推理
→ Agent 调用 reviewReasoning
→ 输出评分、命中点、遗漏点和最终真相
```

## 7. Agent Workflow 图

```text
Start Game
→ Load Case Data
→ Show Story
→ Show Characters
→ Release Round 1 Clues
→ Player Ask Question
→ Check Game State
→ Decide Response Type
→ Answer or Refuse Spoiler
→ Release More Clues
→ Player Submit Reasoning
→ Review Reasoning
→ Show Final Truth
```

## 8. Agent 的产品价值

在 MysteryHost AI Lite 中，Agent 思维的价值是：

1. 让 AI 不只是回答问题，而是管理游戏流程。
2. 让 AI 根据当前状态决定是否能透露信息。
3. 让 AI 可以调用不同工具完成不同任务。
4. 让项目从普通 Demo 升级为 AI 产品系统。
5. 让后续扩展多剧本、多玩家、多角色权限更容易。

## 9. Agent 的风险

Agent 产品比普通聊天机器人风险更高。

### 9.1 错误调用工具

例如 AI 在 Round 1 就调用复盘工具，提前揭示真相。

控制方式：

* 设置明确的状态判断
* 工具调用前检查 currentRound
* 高风险动作需要用户确认

### 9.2 权限越界

例如主持人在问答阶段访问了 truth。

控制方式：

* 主持人问答工具不传入 truth
* 复盘工具才允许访问 truth
* 不同工具有不同数据权限

### 9.3 流程失控

例如 AI 跳过线索释放直接进入结局。

控制方式：

* 用 gameState 限制流程
* 使用按钮和 UI 控制关键节点
* Agent 只能建议，不能自动越过关键流程

### 9.4 幻觉和编造

例如 AI 编造新角色或新线索。

控制方式：

* 工具输出基于结构化数据
* Prompt 明确禁止编造
* 对输出进行校验

## 10. AI 产品经理需要关注的 Agent 问题

设计 Agent 产品时，AI 产品经理需要思考：

1. Agent 的目标是什么？
2. Agent 有哪些可用工具？
3. 每个工具的输入和输出是什么？
4. 哪些工具是低风险？
5. 哪些工具是高风险？
6. Agent 是否需要用户确认？
7. Agent 能访问哪些数据？
8. Agent 不能访问哪些数据？
9. Agent 出错时如何回滚？
10. 如何评估 Agent 是否完成任务？

## 11. MysteryHost AI Lite 后续升级方向

### 11.1 工具函数模块化

将现有逻辑拆成独立工具函数：

```text
releaseClue()
answerHostQuestion()
reviewReasoning()
checkSpoilerRisk()
buildHostPrompt()
```

### 11.2 增加 Agent Controller

创建一个控制器，根据用户动作和当前状态决定下一步。

示例：

```js
const agentController = {
  action: 'answer_question',
  currentRound: 2,
  allowedTools: ['answerQuestion', 'checkSpoilerRisk']
}
```

### 11.3 增加防剧透检查工具

在主持人回答前检查是否包含凶手、真相或未释放线索。

### 11.4 增加 LLM Tool Use

后续接入真实 LLM 后，让模型判断是否调用：

* releaseClue
* answerQuestion
* reviewReasoning
* checkConsistency

## 12. 阶段性总结

Agent 和 Tool Use 是 AI 产品从“能聊天”走向“能完成任务”的关键。

在 MysteryHost AI Lite 中，Agent 的核心不是让 AI 自由发挥，而是让 AI 在明确的游戏规则、状态约束和工具边界下，完成主持人工作流。

AI 产品经理需要理解：

> Agent 产品设计的重点不是“让 AI 做更多”，而是明确 AI 可以做什么、什么时候做、用什么工具做、做到什么程度，以及如何防止它越界。

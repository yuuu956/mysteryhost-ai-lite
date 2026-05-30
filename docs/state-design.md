# State Design: MysteryHost AI Lite

本文件记录 MysteryHost AI Lite 的状态管理设计。

状态管理是本项目的重要基础，因为 AI 剧本杀主持人不是一次性问答工具，而是一个需要控制游戏阶段、线索释放、玩家提问和最终复盘的连续交互系统。

## 1. Why State Management Matters

在 MysteryHost AI Lite 中，AI 主持人需要知道当前游戏进行到哪一步。

如果没有状态管理，系统可能会出现以下问题：

* 玩家一开始就看到全部线索
* AI 主持人提前透露最终真相
* 主持人回答使用了尚未释放的线索
* 玩家提问历史无法保留
* 推理复盘无法判断玩家是否完成游戏流程
* 页面刷新或交互后流程混乱

因此，状态管理的核心目标是：

> 控制游戏进度，限制 AI 信息范围，保证玩家按照合理节奏完成推理体验。

## 2. Current MVP State

当前 MVP 使用 React `useState` 管理页面状态。

### 2.1 currentRound

```js
const [currentRound, setCurrentRound] = useState(1)
```

作用：

* 记录当前游戏回合
* 控制线索释放进度
* 判断是否可以继续释放下一轮线索
* 限制主持人回答的信息范围

当前规则：

```js
const releasedClues = clues.filter((clue) => clue.round <= currentRound)
```

即：只有 `round <= currentRound` 的线索才会展示给玩家。

---

### 2.2 question

```js
const [question, setQuestion] = useState('')
```

作用：

* 保存玩家当前输入的问题
* 点击“提问”后触发主持人回答
* 回答完成后清空输入框

---

### 2.3 hostMessages

```js
const [hostMessages, setHostMessages] = useState([
  {
    role: 'host',
    content: '欢迎进入《雨夜图书馆》。我是本局 AI 主持人...'
  }
])
```

作用：

* 保存玩家和主持人的对话历史
* 形成连续聊天体验
* 让玩家可以回看之前的问题和回答

消息结构：

```js
{
  role: 'host' | 'player',
  content: '消息内容'
}
```

---

### 2.4 reasoning

```js
const [reasoning, setReasoning] = useState('')
```

作用：

* 保存玩家输入的最终推理
* 用于触发推理复盘逻辑

---

### 2.5 reviewResult

```js
const [reviewResult, setReviewResult] = useState(null)
```

作用：

* 保存推理评分
* 保存推理等级
* 保存命中情况
* 保存遗漏点
* 保存最终真相说明

当 `reviewResult` 为 `null` 时，不展示复盘结果。

当 `reviewResult` 有值时，页面展示复盘卡片。

## 3. Derived State

`releasedClues` 是由 `currentRound` 和 `clues` 计算出来的派生状态。

```js
const releasedClues = clues.filter((clue) => clue.round <= currentRound)
```

它不是独立保存的状态，而是根据当前回合实时计算。

这样做的好处是：

* 避免重复保存数据
* 避免状态不一致
* 逻辑更清晰
* 后续更容易传入 Prompt

## 4. State and Spoiler Control

状态管理直接服务于防剧透机制。

当前 MVP 的防剧透方式包括：

1. `currentRound` 控制线索释放。
2. `releasedClues` 只包含当前阶段可见线索。
3. 主持人问答默认不直接透露凶手。
4. 玩家询问“凶手”或“真相”时，主持人只给出引导。
5. 最终真相只在推理复盘后展示。

后续接入 LLM API 时，应继续遵守这个原则：

> Host Q&A Prompt 中不能传入完整 truth，只能传入当前可见信息。

## 5. Current Interaction Flow

当前 MVP 的状态流如下：

```text
页面加载
→ currentRound = 1
→ 显示 Round 1 线索
→ 玩家点击释放下一轮线索
→ currentRound + 1
→ releasedClues 自动更新
→ 玩家输入问题
→ question 更新
→ 点击提问
→ hostMessages 增加玩家问题和主持人回答
→ 玩家输入最终推理
→ reasoning 更新
→ 点击提交复盘
→ reviewResult 生成
→ 页面展示复盘结果和最终真相
```

## 6. Future GameState Design

当前 MVP 的状态是分散写在组件中的。后续可以升级为统一的 `gameState` 对象。

示例：

```js
const gameState = {
  caseId: 'rainy-library',
  currentRound: 1,
  maxRound: 3,
  releasedClueRounds: [1],
  askedQuestions: [],
  hasSubmittedReasoning: false,
  reviewCompleted: false,
  startedAt: '2026-05-30T00:00:00Z'
}
```

统一 `gameState` 的价值：

* 更适合传给 LLM
* 更适合保存游戏进度
* 更适合扩展多人模式
* 更适合接入 Agent Workflow
* 更适合做状态审计和调试

## 7. Future Memory Design

后续可以增加以下记忆能力。

### 7.1 Question History

记录玩家问过哪些问题。

用途：

* 分析玩家推理路径
* 在复盘中指出玩家关注过哪些方向
* 避免主持人重复回答

示例：

```js
askedQuestions: [
  {
    question: '沈念有什么问题？',
    round: 2,
    timestamp: '2026-05-30T10:00:00Z'
  }
]
```

### 7.2 Suspicion Tracking

记录玩家怀疑过哪些角色。

用途：

* 生成更个性化的复盘
* 判断玩家是否被误导
* 分析推理路径是否合理

示例：

```js
suspectedCharacters: ['林舟', '沈念']
```

### 7.3 Reasoning History

记录玩家多次推理版本。

用途：

* 比较玩家推理变化
* 分析玩家是否逐步接近真相
* 提供学习型复盘

示例：

```js
reasoningHistory: [
  {
    round: 2,
    content: '我怀疑林舟',
    score: 35
  },
  {
    round: 3,
    content: '我认为凶手是沈念',
    score: 85
  }
]
```

## 8. State Design for LLM Integration

后续接入 LLM API 时，需要从当前状态中构造 Prompt 上下文。

### 8.1 Host Q&A Context

主持人问答只应传入：

* 案件基础信息
* 当前回合
* 已释放线索
* 角色公开信息
* 玩家问题
* 防剧透规则

不应传入：

* 最终凶手
* 完整真相
* 尚未释放线索
* 不相关历史信息

### 8.2 Reasoning Review Context

推理复盘可以传入：

* 玩家最终推理
* 完整真相
* 关键证据
* 玩家提问历史
* 已释放全部线索

原因：

复盘阶段已经允许揭示真相。

## 9. State Design Risks

### 9.1 State Leakage

如果把 `truth` 传入主持人问答 Prompt，LLM 可能提前泄露真相。

解决方式：

* 主持人问答阶段不要传入 truth。
* 只在复盘阶段传入 truth。

### 9.2 State Inconsistency

如果 `currentRound` 和 `releasedClues` 不一致，可能导致页面展示和 AI 回答不一致。

解决方式：

* `releasedClues` 使用派生计算，不单独维护。
* 避免重复存储相同信息。

### 9.3 Long Conversation Drift

如果对话历史过长，LLM 可能忽略关键约束。

解决方式：

* 只传入必要历史。
* 对历史问题进行摘要。
* 保留系统规则和当前状态。

## 10. Summary

MysteryHost AI Lite 的状态管理目标是：

* 控制游戏流程
* 控制线索释放
* 保留玩家交互历史
* 限制 AI 可见信息
* 防止提前剧透
* 支持最终推理复盘
* 为后续 LLM 和 Agent 版本打基础

状态管理不是单纯的前端逻辑，而是 AI 产品安全性、连续性和可控性的核心组成部分。

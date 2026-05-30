# 05 Memory and State Management

本笔记用于记录我对 AI 产品中 Memory 和 State Management 的理解，并结合 MysteryHost AI Lite 项目分析状态管理如何帮助 AI 产品形成连续、可控的交互体验。

## 1. 什么是 Memory？

在 AI 产品中，Memory 指系统对上下文信息、用户行为、历史记录和任务进度的保存与使用能力。

从产品经理视角看，Memory 的作用是：

> 让 AI 不只是回答当前一句话，而是能理解用户正在处于什么任务阶段，并基于历史信息给出连续、合理的回应。

例如，一个普通聊天机器人只看到用户当前问题：

```text
林舟是不是凶手？
```

但一个有 Memory 的 AI 主持人应该知道：

* 当前是第几轮
* 哪些线索已经释放
* 玩家问过哪些问题
* 哪些角色信息已经展示
* 哪些真相还不能透露

这样 AI 才能避免提前剧透，也能保持游戏体验的连续性。

## 2. Memory 和 State 的区别

Memory 和 State 经常一起出现，但二者不完全相同。

| 概念     | 含义       | 示例                     |
| ------ | -------- | ---------------------- |
| Memory | 对历史信息的记录 | 玩家问过哪些问题、之前的对话内容       |
| State  | 当前系统所处状态 | 当前回合、是否已释放全部线索、是否已提交推理 |

简单理解：

```text
Memory 更偏历史记录
State 更偏当前进度
```

在 MysteryHost AI Lite 中：

* `hostMessages` 是一种 Memory
* `currentRound` 是一种 State
* `releasedClues` 是由 State 计算出的当前可见信息
* `reviewResult` 是玩家完成复盘后的状态结果

## 3. 为什么 AI 产品需要状态管理？

传统产品中，状态管理通常用于控制页面显示、按钮状态、表单输入等。

AI 产品中，状态管理更重要，因为 AI 的输出依赖上下文。

如果没有状态管理，AI 可能会出现：

1. 不知道当前进行到哪一轮。
2. 使用尚未释放的线索回答问题。
3. 忘记玩家之前问过什么。
4. 在不该复盘时提前揭示真相。
5. 对同一个问题前后回答矛盾。
6. 无法判断用户是否已经完成关键流程。

因此，AI 产品需要明确管理状态，让 AI 的行为和产品流程保持一致。

## 4. MysteryHost AI Lite 当前使用的状态

当前 MVP 中已经使用了几个基础状态。

### 4.1 currentRound

```js
const [currentRound, setCurrentRound] = useState(1)
```

作用：

* 记录当前游戏回合
* 控制线索释放进度
* 判断是否还能继续释放下一轮线索
* 限制主持人回答时的信息范围

### 4.2 releasedClues

```js
const releasedClues = clues.filter((clue) => clue.round <= currentRound)
```

作用：

* 根据当前回合计算已经释放的线索
* 只展示当前阶段允许玩家看到的信息
* 后续接入 LLM 时，可以作为 Prompt 上下文传入模型

### 4.3 question

```js
const [question, setQuestion] = useState('')
```

作用：

* 记录玩家当前输入的问题
* 用于触发主持人回答

### 4.4 hostMessages

```js
const [hostMessages, setHostMessages] = useState([])
```

作用：

* 记录主持人与玩家的对话历史
* 形成聊天式交互体验
* 让用户看到之前的提问和回答

### 4.5 reasoning

```js
const [reasoning, setReasoning] = useState('')
```

作用：

* 记录玩家提交的最终推理文本
* 用于生成复盘分析

### 4.6 reviewResult

```js
const [reviewResult, setReviewResult] = useState(null)
```

作用：

* 保存复盘评分、命中情况、遗漏点和最终真相
* 控制复盘结果区域是否显示

## 5. 状态如何影响 AI 主持人回答？

在 MysteryHost AI Lite 中，主持人不能只根据玩家问题回答，还必须结合当前状态。

例如：

```text
玩家问题：现在可以知道真相吗？
```

如果当前回合是 Round 1，主持人应该回答：

```text
现在还不能直接确认真相。部分关键信息尚未公开，请继续关注后续线索。
```

如果当前回合是 Round 3，并且玩家已经提交推理，系统才可以进入复盘阶段揭示最终真相。

这说明 AI 产品设计中，状态决定了 AI 的权限和行为边界。

## 6. Game State 的设计

后续可以将分散的状态整合成一个完整的 gameState 对象。

示例：

```js
const gameState = {
  caseId: 'rainy-library',
  currentRound: 1,
  maxRound: 3,
  releasedClueIds: [1],
  askedQuestions: [],
  hasSubmittedReasoning: false,
  reviewCompleted: false
}
```

这样做的好处是：

* 状态结构更清晰
* 更方便传给 LLM
* 更方便做存档
* 更方便后续扩展多人模式
* 更方便加入 Agent Workflow

## 7. Memory 在 AI 产品中的类型

AI 产品中的 Memory 可以分为几类。

### 7.1 Short-term Memory

短期记忆通常存在于一次会话中。

例如：

* 当前游戏回合
* 本轮已释放线索
* 当前聊天记录
* 玩家刚刚输入的问题

MysteryHost AI Lite 当前主要使用短期记忆。

### 7.2 Long-term Memory

长期记忆用于记录跨会话信息。

例如：

* 用户喜欢校园悬疑还是古风推理
* 用户常选择简单难度还是困难难度
* 用户历史推理表现
* 用户偏好的游戏风格

当前 MVP 暂不实现长期记忆，但后续可以作为升级方向。

### 7.3 Episodic Memory

事件记忆用于记录某个任务过程中的关键事件。

在本项目中可以包括：

* 玩家查看了哪些线索
* 玩家问过哪些问题
* 玩家是否怀疑过某个角色
* 玩家最终推理是否命中关键点

这种记忆可以帮助系统生成更个性化的复盘。

### 7.4 Semantic Memory

语义记忆用于保存稳定知识。

在本项目中可以包括：

* 剧本杀游戏规则
* 推理游戏常见线索类型
* 悬疑故事结构
* 角色动机设计方法

后续如果做 RAG，可以把这些内容作为知识库。

## 8. 状态管理和防剧透

防剧透是 MysteryHost AI Lite 中非常重要的产品问题。

状态管理可以帮助防剧透：

1. 使用 `currentRound` 控制已释放线索。
2. 主持人只基于 `releasedClues` 回答。
3. 真相 `truth` 不传入主持人问答 Prompt。
4. 只有在玩家提交最终推理后，才展示最终真相。
5. 对“凶手”“真相”等关键词触发拒答或引导。

这说明 AI 产品中的安全控制，不只靠 Prompt，也需要产品状态和代码逻辑共同实现。

## 9. 状态管理和用户体验

好的状态管理可以提升用户体验。

在本项目中体现为：

* 用户知道当前是 Round 几。
* 按钮会在全部线索释放后禁用。
* 已释放线索会持续展示。
* 聊天记录不会因为一次提问消失。
* 复盘结果会在提交推理后保留。
* 用户可以根据阶段逐步完成推理。

如果状态设计混乱，用户会不知道自己在哪里，也不知道下一步该做什么。

## 10. AI 产品经理需要关注的状态问题

设计 AI 产品时，AI 产品经理需要思考：

1. 当前任务有哪些阶段？
2. 每个阶段用户能看到什么？
3. 每个阶段 AI 能知道什么？
4. 哪些信息需要长期保存？
5. 哪些信息只在当前会话有效？
6. 用户行为是否需要被记录？
7. AI 回答是否依赖历史上下文？
8. 状态变化后，界面如何反馈？
9. 状态错误时，是否会导致风险？
10. 状态如何支持后续 Agent Workflow？

## 11. MysteryHost AI Lite 后续优化方向

后续可以从以下方向升级状态管理：

### 11.1 统一 gameState

将 currentRound、releasedClues、hostMessages、reasoning 和 reviewResult 整合成统一状态对象。

### 11.2 增加问题历史分析

记录玩家问过哪些角色和线索，从而在复盘中分析玩家推理路径。

### 11.3 增加角色权限

不同角色只能看到不同的隐藏信息，为后续多人版本做准备。

### 11.4 增加存档功能

允许用户保存当前游戏进度，刷新页面后继续游戏。

### 11.5 增加 LLM Context Builder

根据当前状态自动拼接 Prompt 上下文，而不是手动传入所有信息。

## 12. 阶段性总结

Memory 和 State Management 是 AI 产品从单轮问答走向连续交互的关键。

在 MysteryHost AI Lite 中，状态管理的价值是：

> 控制游戏进度、限制 AI 信息范围、避免提前剧透、保留玩家交互历史，并让整个推理流程形成连续体验。

AI 产品经理需要理解：很多 AI 风险不是只靠模型解决，而是需要通过产品流程、状态管理和工程逻辑共同控制。

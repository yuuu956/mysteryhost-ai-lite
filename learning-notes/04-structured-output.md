# 04 Structured Output

本笔记用于记录我对 Structured Output 的理解，并结合 MysteryHost AI Lite 项目分析结构化输出在 AI 产品中的作用。

## 1. 什么是 Structured Output？

Structured Output 指让 AI 按照固定结构输出内容，而不是随意输出一大段自然语言。

常见结构包括：

* JSON
* 表格
* 列表
* 卡片字段
* 标签分类
* 评分结果
* 多级对象

从 AI 产品经理视角看，Structured Output 的核心价值是：

> 把 AI 生成的内容变成产品界面可以直接使用的数据。

## 2. 为什么 AI 产品需要结构化输出？

如果 AI 只输出自然语言，用户虽然能读懂，但产品系统很难进一步处理。

例如，AI 输出：

```text
这个角色叫沈念，是学生会秘书长，她有一个秘密……
```

前端很难稳定地拆出：

* name
* identity
* publicInfo
* secret
* suspicion

但如果 AI 输出 JSON：

```json
{
  "name": "沈念",
  "identity": "学生会秘书长",
  "publicInfo": "负责会议记录和资料归档",
  "secret": "她知道许言正在调查报销问题",
  "suspicion": "她是案发前最后见过死者的人之一"
}
```

前端就可以直接渲染为角色卡。

## 3. 结构化输出的产品价值

Structured Output 可以提升 AI 产品的稳定性和可用性。

| 价值  | 说明                 |
| --- | ------------------ |
| 可渲染 | 前端可以根据字段展示卡片、表格和图表 |
| 可保存 | 数据可以存入数据库          |
| 可校验 | 可以检查字段是否缺失或格式错误    |
| 可评测 | 可以对不同字段分别评估质量      |
| 可复用 | 同一份输出可以用于多个页面模块    |
| 可控  | 减少模型自由发挥导致的不稳定     |

## 4. MysteryHost AI Lite 中的结构化输出

当前项目中已经使用了多种结构化数据。

### 4.1 案件背景结构

```js
{
  title: '雨夜图书馆',
  theme: '校园悬疑',
  playerCount: 4,
  difficulty: '普通',
  background: '案件背景',
  victim: {
    name: '许言',
    identity: '学生会财务部部长',
    age: 21,
    description: '死者描述'
  },
  location: '案发地点',
  coreMystery: '核心谜题'
}
```

这个结构用于渲染案件背景模块。

### 4.2 角色卡结构

```js
{
  id: 1,
  name: '林舟',
  avatar: '🧑🏻‍🎓',
  identity: '学生会副主席',
  publicInfo: '公开信息',
  secret: '隐藏秘密',
  relationship: '与死者关系',
  suspicion: '可疑点'
}
```

这个结构用于渲染角色卡模块。

### 4.3 线索结构

```js
{
  round: 1,
  title: '现场线索',
  type: 'scene',
  items: [
    '线索 1',
    '线索 2',
    '线索 3'
  ]
}
```

这个结构用于实现分轮线索释放。

### 4.4 真相结构

```js
{
  murderer: '沈念',
  motive: '作案动机',
  method: '作案方式',
  keyEvidence: [
    '关键证据 1',
    '关键证据 2'
  ]
}
```

这个结构用于推理复盘模块。

## 5. Structured Output 和前端 UI 的关系

在 MysteryHost AI Lite 中，结构化数据直接决定了页面展示方式。

| 数据结构         | UI 展示    |
| ------------ | -------- |
| mysteryCase  | 案件背景卡片   |
| characters   | 角色卡列表    |
| clues        | 线索释放卡片   |
| truth        | 推理复盘结果   |
| hostMessages | 主持人问答消息流 |
| reviewResult | 复盘评分和遗漏点 |

这说明 AI 产品中，模型输出不是孤立文本，而是要服务于产品界面和用户任务。

## 6. 后续接入 LLM 后的结构化输出要求

后续如果接入 LLM API，不能只让模型输出普通文本，而应该要求模型输出固定格式。

例如，剧本生成 Prompt 应要求输出：

```json
{
  "title": "案件标题",
  "theme": "主题",
  "characters": [],
  "clues": [],
  "truth": {}
}
```

推理复盘 Prompt 应要求输出：

```json
{
  "score": 80,
  "level": "接近真相",
  "hitPoints": [],
  "missedPoints": [],
  "summary": "复盘总结"
}
```

这样前端可以直接根据字段渲染内容。

## 7. 结构化输出的风险

Structured Output 虽然能提升稳定性，但仍然存在风险。

### 7.1 字段缺失

模型可能漏掉某些字段。

解决方式：

* 在 Prompt 中明确字段要求
* 提供 JSON 示例
* 前端增加默认值
* 后端增加校验逻辑

### 7.2 格式错误

模型可能输出不合法 JSON。

解决方式：

* 明确要求只输出 JSON
* 不允许输出 Markdown
* 使用 JSON parse 校验
* 出错时重新请求或提示用户

### 7.3 内容不一致

模型生成的角色、线索和真相可能互相矛盾。

解决方式：

* 增加一致性检查
* 检查凶手是否存在于角色列表中
* 检查关键证据是否在线索中出现
* 检查最终真相是否能被线索推导

### 7.4 结构正确但质量差

即使 JSON 格式正确，内容也可能无聊、不合理或无法推理。

解决方式：

* 增加质量评测
* 增加样例
* 限定剧本难度
* 增加人工编辑入口

## 8. AI 产品经理视角下的结构化输出

AI 产品经理设计 Structured Output 时，需要关注：

1. 这个输出最终要展示在哪里？
2. 前端需要哪些字段？
3. 哪些字段是必填？
4. 哪些字段可以为空？
5. 字段类型是什么？
6. 输出是否需要保存？
7. 是否需要被后续 Agent 或工具继续使用？
8. 如何判断输出是否合格？
9. 如果输出格式错误，产品如何兜底？
10. 用户能否理解结构化结果？

## 9. MysteryHost AI Lite 当前实现总结

当前 MVP 已经通过本地 mock 数据实现结构化输出思想：

* 案件背景被拆成 title、theme、background、victim、location 等字段
* 角色被拆成 name、identity、publicInfo、secret、relationship、suspicion 等字段
* 线索被拆成 round、title、type、items 等字段
* 复盘结果被拆成 score、level、missedPoints、truthSummary 等字段

这使得页面可以稳定渲染，并为后续接入 LLM 输出 JSON 打下基础。

## 10. 阶段性总结

Structured Output 是 AI 产品从“聊天工具”走向“可用系统”的关键。

它的本质是：

> 让 AI 输出从自然语言文本，转化为产品系统可以展示、保存、校验、复用和评测的数据结构。

在 MysteryHost AI Lite 中，结构化输出让案件、角色、线索和复盘结果都能以稳定卡片形式展示，也为后续 LLM API 接入提供了清晰的数据格式基础。

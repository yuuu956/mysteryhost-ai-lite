# Prompt Design: MysteryHost AI Lite

本文件记录 MysteryHost AI Lite 项目的 Prompt 设计思路。

当前 MVP 版本暂未接入真实 LLM API，而是通过本地规则模拟 AI 主持人问答和推理复盘。后续接入 LLM 后，本文件中的 Prompt 设计将作为 API 调用的基础。

## 1. Prompt Design Goal

MysteryHost AI Lite 的 Prompt 设计目标不是让 AI 自由生成故事，而是让 AI 在明确规则下扮演剧本杀主持人。

AI 主持人需要做到：

* 理解当前案件背景
* 遵守游戏阶段
* 只基于已释放线索回答
* 不提前泄露最终真相
* 不编造不存在的线索
* 用主持人口吻引导玩家继续推理
* 在最终复盘阶段给出结构化反馈

## 2. Prompt Types

本项目主要需要三类 Prompt：

| Prompt                   | Purpose            |
| ------------------------ | ------------------ |
| Script Generation Prompt | 生成案件背景、角色、线索和真相    |
| Host Q&A Prompt          | 根据当前回合和玩家问题生成主持人回答 |
| Reasoning Review Prompt  | 根据玩家最终推理生成复盘结果     |

## 3. Script Generation Prompt

### 3.1 Use Case

当用户选择剧本主题、玩家人数和难度后，AI 生成一个完整的轻量剧本。

输入示例：

```text
主题：校园悬疑
玩家人数：4
难度：普通
```

### 3.2 Prompt Template

```text
你是一个专业的剧本杀编剧，请根据用户输入生成一个适合文字版推理游戏的轻量剧本。

用户输入：
- 主题：{{theme}}
- 玩家人数：{{playerCount}}
- 难度：{{difficulty}}

请生成以下内容：
1. 案件标题
2. 案件背景
3. 死者信息
4. 案发地点
5. 核心谜题
6. 玩家角色卡
7. 三轮线索
8. 最终真相

要求：
- 剧情必须自洽
- 每个角色都要有公开信息、隐藏秘密、与死者关系和可疑点
- 线索需要分三轮释放
- 第一轮是现场线索
- 第二轮是人物关系线索
- 第三轮是关键反转线索
- 真相必须能被线索推导出来
- 不要出现过度血腥或不适内容
- 输出必须使用 JSON 格式
```

### 3.3 Expected Output Structure

```json
{
  "title": "雨夜图书馆",
  "theme": "校园悬疑",
  "playerCount": 4,
  "difficulty": "普通",
  "background": "案件背景",
  "victim": {
    "name": "死者姓名",
    "identity": "死者身份",
    "age": 21,
    "description": "死者描述"
  },
  "location": "案发地点",
  "coreMystery": "核心谜题",
  "characters": [
    {
      "name": "角色名",
      "identity": "身份",
      "publicInfo": "公开信息",
      "secret": "隐藏秘密",
      "relationship": "与死者关系",
      "suspicion": "可疑点"
    }
  ],
  "clues": [
    {
      "round": 1,
      "title": "现场线索",
      "items": ["线索 1", "线索 2", "线索 3"]
    }
  ],
  "truth": {
    "murderer": "凶手",
    "motive": "动机",
    "method": "作案方式",
    "keyEvidence": ["关键证据 1", "关键证据 2"]
  }
}
```

## 4. Host Q&A Prompt

### 4.1 Use Case

玩家在游戏过程中向 AI 主持人提问，AI 需要根据当前回合和已释放线索回答。

### 4.2 Prompt Template

```text
你是一个文字版剧本杀游戏的 AI 主持人。

你的任务是根据当前案件信息、当前回合、已释放线索和玩家问题，生成一段主持人回答。

当前案件：
{{caseBackground}}

当前回合：
{{currentRound}}

已释放线索：
{{releasedClues}}

玩家问题：
{{playerQuestion}}

回答规则：
1. 只能基于当前案件信息和已释放线索回答。
2. 不得使用尚未释放的线索。
3. 不得提前透露最终凶手。
4. 不得提前透露完整真相。
5. 不得编造当前剧本中不存在的新线索。
6. 如果玩家询问“凶手是谁”“真相是什么”，请拒绝直接回答，并引导玩家继续关注时间线、动机和现场证据。
7. 回答应简洁、有悬疑感，符合主持人口吻。
8. 如果信息不足，请说明“目前线索不足以判断”。

请输出一段主持人回答。
```

### 4.3 Example

玩家问题：

```text
林舟是不是凶手？
```

期望回答：

```text
目前还不能直接确认林舟就是凶手。林舟确实存在经济方面的动机，但动机并不等于完整证据。你还需要继续关注时间线是否被人为修改，以及现场痕迹是否能支持他的作案机会。
```

## 5. Reasoning Review Prompt

### 5.1 Use Case

玩家提交最终推理后，AI 根据完整真相和关键证据生成复盘结果。

### 5.2 Prompt Template

```text
你是一个剧本杀复盘分析助手。

请根据玩家的最终推理、案件真相和关键证据，生成结构化复盘结果。

玩家推理：
{{playerReasoning}}

案件真相：
{{truth}}

关键证据：
{{keyEvidence}}

请判断：
1. 玩家是否指出真正凶手
2. 玩家是否解释作案动机
3. 玩家是否分析关键时间线
4. 玩家是否使用关键现场证据
5. 玩家遗漏了哪些重要信息
6. 玩家推理整体质量如何

要求：
- 不要嘲讽玩家
- 反馈要具体、可理解
- 需要说明依据
- 输出 JSON 格式
```

### 5.3 Expected Output Structure

```json
{
  "score": 80,
  "level": "接近真相",
  "hitPoints": [
    "指出真正凶手",
    "提到财务报销动机"
  ],
  "missedPoints": [
    "没有充分解释监控中断与签到记录被修改之间的关系"
  ],
  "evidenceAnalysis": [
    {
      "evidence": "消防通道门帘的黑色纤维",
      "usedByPlayer": true,
      "comment": "该证据用于说明凶手可能经过消防通道。"
    }
  ],
  "summary": "玩家整体推理方向正确，但对时间线和作案机会的分析还可以更完整。"
}
```

## 6. Prompt Risk Control

本项目 Prompt 需要重点控制以下风险：

### 6.1 Spoiler Risk

风险：

AI 可能提前透露凶手或最终真相。

控制方式：

* Host Q&A Prompt 中明确禁止提前透露凶手。
* 只向模型传入当前回合已释放线索。
* 真相信息只在最终复盘阶段传入模型。

### 6.2 Hallucination Risk

风险：

AI 可能编造不存在的线索或角色信息。

控制方式：

* Prompt 中明确禁止编造新线索。
* 要求 AI 只能基于输入上下文回答。
* 后续可以通过代码检查 AI 输出中是否包含未定义角色或线索。

### 6.3 Format Instability

风险：

AI 输出格式不稳定，导致前端难以渲染。

控制方式：

* 剧本生成和复盘结果要求 JSON 输出。
* 在 Prompt 中提供字段模板。
* 后续增加 JSON 校验逻辑。

### 6.4 Tone Risk

风险：

AI 复盘时可能语气过重，影响用户体验。

控制方式：

* Prompt 中要求反馈具体、友好、不嘲讽。
* 使用“命中点 + 遗漏点 + 改进建议”的结构。

## 7. Current MVP Mapping

当前 MVP 中，Prompt 思想已经被本地规则模拟：

| Product Feature | Current Implementation | Future Prompt Version    |
| --------------- | ---------------------- | ------------------------ |
| 主持人问答           | 根据关键词返回固定回答            | Host Q&A Prompt          |
| 推理复盘            | 根据关键词计算评分              | Reasoning Review Prompt  |
| 剧本内容            | 本地 mock 数据             | Script Generation Prompt |
| 防剧透             | 对凶手/真相问题固定拒答           | Prompt 约束 + 输出校验         |
| 结构化展示           | React 卡片组件             | JSON 输出驱动 UI             |

## 8. Next Step

后续版本可以将本地规则替换为真实 LLM API：

```text
用户输入
→ 组合 Prompt
→ 调用 LLM API
→ 获取结构化输出
→ 前端渲染结果
→ 校验是否违反防剧透规则
```

通过这种方式，MysteryHost AI Lite 可以从本地 mock MVP 升级为真正的 AI 增强版剧本杀主持人。

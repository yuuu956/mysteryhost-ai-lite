# Risk Control: MysteryHost AI Lite

本文件记录 MysteryHost AI Lite 的风险控制设计。

MysteryHost AI Lite 是一个文字版 AI 剧本杀主持人 Demo。由于项目涉及 AI 生成内容、玩家提问、线索释放和最终复盘，因此需要重点控制剧透、幻觉、流程失控和用户体验风险。

## 1. Risk Control Goal

本项目的风险控制目标是：

> 让 AI 主持人在正确的游戏阶段，基于正确的信息，输出符合规则的内容，并避免提前剧透、编造线索或破坏推理体验。

AI 主持人应该做到：

* 不提前透露凶手
* 不提前透露完整真相
* 不使用尚未释放的线索
* 不编造不存在的角色或证据
* 不替玩家直接完成推理
* 在信息不足时进行引导或拒答
* 在复盘阶段给出清晰、友好的反馈

## 2. Main Risks

MysteryHost AI Lite 主要存在以下风险：

| Risk               | Description         |
| ------------------ | ------------------- |
| Spoiler Risk       | AI 提前泄露凶手、真相或关键反转   |
| Hallucination Risk | AI 编造不存在的线索、角色或剧情   |
| State Leakage      | AI 在问答阶段访问了完整真相     |
| Flow Control Risk  | AI 跳过线索释放流程，直接进入结局  |
| Format Risk        | AI 输出格式不稳定，前端无法渲染   |
| Tone Risk          | AI 回复语气过重、嘲讽玩家或破坏体验 |
| Evaluation Risk    | 复盘评分不合理，用户难以理解      |

## 3. Spoiler Risk Control

### 3.1 Risk Description

剧透是本项目最核心的风险。

如果 AI 主持人在玩家推理前提前说出凶手或完整真相，游戏体验会被直接破坏。

剧透行为包括：

* 直接说出凶手姓名
* 提前说明完整作案方式
* 使用尚未释放的关键线索
* 直接告诉玩家最终答案
* 在主持人问答阶段解释最终真相

### 3.2 Current MVP Control

当前 MVP 使用以下方式控制剧透：

1. 主持人问答使用本地规则逻辑。
2. 对“凶手”“真相”等关键词进行特殊处理。
3. 回答中不直接透露最终答案。
4. 通过 `currentRound` 判断当前线索释放阶段。
5. 如果 `currentRound < 3`，提示“部分关键信息尚未公开”。
6. 最终真相只在推理复盘后展示。

### 3.3 Future LLM Control

后续接入 LLM 后，应继续控制：

* Host Q&A Prompt 不传入 `truth`
* Host Q&A Prompt 只传入 `releasedClues`
* 对输出内容进行 spoiler check
* 如果回答包含 murderer，则拦截或改写
* 复盘阶段才允许传入完整 truth

## 4. Hallucination Risk Control

### 4.1 Risk Description

Hallucination 指 AI 生成了看似合理但实际不存在的信息。

在本项目中，幻觉可能表现为：

* 编造新角色
* 编造新线索
* 修改死者身份
* 修改案发地点
* 改写已设定真相
* 输出和当前剧本不一致的信息

### 4.2 Current MVP Control

当前 MVP 通过本地 mock 数据控制幻觉：

* 案件、角色、线索、真相都来自 `mysteryCase.js`
* 主持人问答基于固定规则
* 推理复盘基于固定关键词和 truth
* 页面只渲染结构化数据

### 4.3 Future LLM Control

后续接入 LLM 后，需要增加：

1. Prompt 中明确禁止编造新线索。
2. 让 AI 只能基于输入上下文回答。
3. 输出后检查角色名是否存在于角色列表。
4. 输出后检查线索是否存在于 clues。
5. 对不确定问题要求 AI 使用“目前线索不足以判断”。

## 5. State Leakage Control

### 5.1 Risk Description

State Leakage 指 AI 在不该访问某些信息时访问了这些信息。

在本项目中，最危险的是：

> 主持人问答阶段访问了完整 truth，导致提前剧透。

### 5.2 Control Strategy

不同阶段应有不同数据权限。

| Stage         | Allowed Data                    | Forbidden Data         |
| ------------- | ------------------------------- | ---------------------- |
| Story Display | mysteryCase, characters         | truth                  |
| Clue Phase    | releasedClues                   | unreleasedClues, truth |
| Host Q&A      | case, characters, releasedClues | truth                  |
| Review Phase  | case, all clues, truth          | none                   |

核心原则：

> Host Q&A 阶段不能传入 truth，Review 阶段才可以传入 truth。

## 6. Flow Control Risk

### 6.1 Risk Description

AI 剧本杀主持人需要遵守游戏流程。

流程失控可能包括：

* Round 1 就释放全部线索
* 玩家没有提交推理就展示最终真相
* 主持人跳过关键阶段
* 玩家无法判断下一步该做什么

### 6.2 Current MVP Control

当前 MVP 通过 UI 和状态控制流程：

* `currentRound` 控制线索阶段
* “释放下一轮线索”按钮按顺序推进
* 线索全部释放后按钮禁用
* 复盘只有玩家提交推理后才显示
* 最终真相只出现在复盘结果中

### 6.3 Future Control

后续可以增加：

* 游戏阶段状态 `gameStage`
* 明确区分 `intro`、`clue`、`qa`、`review`
* 高风险动作需要用户确认
* Agent 工具调用前检查当前状态

## 7. Format Risk Control

### 7.1 Risk Description

后续如果接入 LLM，模型可能输出格式不稳定。

例如：

* 没有输出合法 JSON
* 缺少必填字段
* 字段类型错误
* score 超出 0–100
* 角色卡字段不完整

### 7.2 Control Strategy

控制方式：

1. Prompt 中提供明确 JSON schema。
2. 要求模型只输出 JSON。
3. 前端或后端使用 JSON parse 校验。
4. 给字段设置默认值。
5. 格式错误时重新生成或提示用户。
6. 对重要字段进行类型检查。

## 8. Tone Risk Control

### 8.1 Risk Description

AI 主持人需要保持合适语气。

不合适的语气包括：

* 嘲讽玩家
* 过度否定玩家
* 用词过于严厉
* 回答过于机械
* 破坏悬疑氛围

### 8.2 Control Strategy

主持人语气应符合：

* 简洁
* 有悬疑感
* 友好
* 不嘲讽
* 不直接替玩家推理
* 给出适度引导

复盘语气应符合：

* 先指出命中点
* 再指出遗漏点
* 最后解释真相
* 避免“你完全错了”这类表达

## 9. Evaluation Risk Control

### 9.1 Risk Description

推理复盘评分如果不合理，会影响用户信任。

风险包括：

* 玩家提到凶手但系统没有识别
* 玩家推理很完整但得分过低
* 玩家随便猜对凶手却得分过高
* 系统只看关键词，不看证据链

### 9.2 Current MVP Control

当前 MVP 使用关键词规则计算得分：

* 提到凶手：加分
* 提到财务/举报/报销：加分
* 提到监控/签到/时间线：加分
* 提到消防通道/纤维/墨水：加分

这是一种轻量 MVP 方案，优点是稳定、可控，缺点是理解能力有限。

### 9.3 Future Control

后续接入 LLM 后，可以让复盘更自然，但仍需控制：

* score 必须在 0–100
* 必须输出 hitPoints
* 必须输出 missedPoints
* 必须解释评分依据
* 不能只因为猜中凶手就给满分

## 10. Risk Control Checklist

### 10.1 Host Q&A Checklist

* [ ] 是否没有提前透露凶手？
* [ ] 是否没有透露完整真相？
* [ ] 是否只使用已释放线索？
* [ ] 是否没有编造新线索？
* [ ] 是否回答了玩家问题？
* [ ] 是否符合主持人口吻？
* [ ] 是否在信息不足时正确引导？

### 10.2 Reasoning Review Checklist

* [ ] 是否只在复盘阶段展示真相？
* [ ] 是否识别凶手判断？
* [ ] 是否识别作案动机？
* [ ] 是否识别关键证据？
* [ ] 是否指出遗漏点？
* [ ] 是否给出解释性反馈？
* [ ] 是否避免嘲讽或过度否定？

### 10.3 Script Generation Checklist

* [ ] 凶手是否在角色列表中？
* [ ] 真相是否能被线索推导？
* [ ] 关键证据是否在线索中出现？
* [ ] 线索释放是否循序渐进？
* [ ] 是否避免过度血腥或不适内容？
* [ ] 是否避免内容互相矛盾？

## 11. Future Improvements

后续可以增加以下风险控制机制：

### 11.1 Spoiler Checker

检查主持人回答是否包含：

* 凶手姓名
* 最终真相关键词
* 未释放线索
* 作案方式

### 11.2 Entity Validator

检查 AI 输出中的人物、地点和证据是否存在于结构化数据中。

### 11.3 JSON Schema Validator

检查 LLM 输出是否符合前端需要的字段结构。

### 11.4 Consistency Checker

检查：

* 凶手是否是角色之一
* 关键证据是否在线索中
* 动机是否和角色秘密相关
* 作案方式是否和现场线索一致

### 11.5 Human Confirmation

对于高风险动作，例如展示最终真相，可以要求用户主动点击确认。

## 12. Summary

MysteryHost AI Lite 的风险控制重点是：

* 防剧透
* 防幻觉
* 防状态泄漏
* 防流程失控
* 控制输出格式
* 控制主持人语气
* 控制复盘评分合理性

本项目的核心原则是：

> AI 主持人不是自由聊天角色，而是一个受到游戏状态、线索权限、Prompt 约束和评测指标共同限制的功能型 AI 产品角色。


import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

function createDeepSeekClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    timeout: 60 * 1000,
    maxRetries: 2,
  })
}

function checkSpoilerRisk(reply, truth, releasedClues = []) {
  if (!reply || !truth) {
    return {
      hasSpoilerRisk: false,
      riskType: null,
    }
  }

  const murderer = truth.murderer || ''
  const method = truth.method || ''
  const keyEvidence = truth.keyEvidence || []
  const releasedClueText = JSON.stringify(releasedClues)

  if (murderer && reply.includes(murderer)) {
    return {
      hasSpoilerRisk: true,
      riskType: 'mentions_murderer',
    }
  }

  if (method && reply.includes(method.slice(0, 12))) {
    return {
      hasSpoilerRisk: true,
      riskType: 'mentions_method',
    }
  }

  const unreleasedEvidence = keyEvidence.filter(
    (evidence) => !releasedClueText.includes(evidence)
  )

  const leakedEvidence = unreleasedEvidence.find((evidence) =>
    reply.includes(evidence)
  )

  if (leakedEvidence) {
    return {
      hasSpoilerRisk: true,
      riskType: 'mentions_unreleased_evidence',
    }
  }

  return {
    hasSpoilerRisk: false,
    riskType: null,
  }
}

function getSafeHostReply(currentRound) {
  let reply =
    '目前线索还不足以直接判断真相。请继续关注时间线、人物动机和现场证据之间的矛盾。'

  if (currentRound < 3) {
    reply += ' 当前仍处于线索释放阶段，部分关键信息尚未公开。'
  }

  return reply
}

function createRuleBasedReview(playerReasoning, truth) {
  const reasoningText = String(playerReasoning || '').replace(/\s+/g, '')
  const keyEvidence = truth.keyEvidence || []
  const murderer = truth.murderer || ''

  const includesAny = (keywords) =>
    keywords.some((keyword) => reasoningText.includes(keyword))

  const mentionsMurderer = murderer && reasoningText.includes(murderer)

  const mentionsMotive = includesAny([
    '报销',
    '异常报销',
    '虚假报销',
    '举报',
    '举报邮件',
    '财务',
    '邮件',
    '阻止',
    '提交证据',
    '证据',
    '动机',
  ])

  const mentionsTimeline = includesAny([
    '监控',
    '监控中断',
    '签到',
    '签到记录',
    '修改签到',
    '时间',
    '时间线',
    '记录',
    '账号',
    '不在场',
    '不在场证明',
  ])

  const mentionsScene = includesAny([
    '消防',
    '消防通道',
    '通道',
    '纤维',
    '黑色纤维',
    '墨水',
    '墨水痕迹',
    '脚印',
    '现场',
    '伪造',
    '伪造现场',
  ])

  const evidenceUsedByPlayer = (evidence) => {
    const evidenceText = String(evidence || '')

    const keywords = [
      evidenceText,
      evidenceText.slice(0, 2),
      evidenceText.slice(0, 4),
      evidenceText.slice(0, 6),
    ]

    if (evidenceText.includes('举报') || evidenceText.includes('邮件')) {
      keywords.push('举报', '邮件', '草稿', '举报邮件')
    }

    if (evidenceText.includes('墨水') || evidenceText.includes('档案柜')) {
      keywords.push('墨水', '墨水痕迹', '档案柜')
    }

    if (evidenceText.includes('消防') || evidenceText.includes('纤维')) {
      keywords.push('消防', '消防通道', '通道', '纤维', '黑色纤维')
    }

    if (evidenceText.includes('签到') || evidenceText.includes('记录')) {
      keywords.push('签到', '签到记录', '记录', '修改', '账号')
    }

    return keywords
      .filter(Boolean)
      .some((keyword) => reasoningText.includes(keyword))
  }

  const matchedEvidence = keyEvidence.filter((evidence) =>
    evidenceUsedByPlayer(evidence)
  )

  const evidenceScore = Math.min(matchedEvidence.length * 12, 30)

  let rawScore =
    (mentionsMurderer ? 30 : 0) +
    (mentionsMotive ? 25 : 0) +
    (mentionsTimeline ? 20 : 0) +
    (mentionsScene ? 20 : 0) +
    evidenceScore

  if (mentionsMurderer && matchedEvidence.length >= 3) {
    rawScore = Math.max(rawScore, 85)
  }

  if (mentionsMurderer && matchedEvidence.length >= 4) {
    rawScore = Math.max(rawScore, 90)
  }

  const score = Math.min(rawScore, 100)

  let level = '推理仍不完整'

  if (score >= 90) {
    level = '完整命中真相'
  } else if (score >= 75) {
    level = '接近真相'
  } else if (score >= 55) {
    level = '方向基本正确'
  } else if (score >= 30) {
    level = '发现了部分关键点'
  }

  const hitPoints = []

  if (mentionsMurderer) {
    hitPoints.push(`指出真正凶手是${murderer}`)
  }

  if (mentionsMotive) {
    hitPoints.push('解释了财务报销、举报邮件或阻止提交证据相关动机')
  }

  if (mentionsTimeline) {
    hitPoints.push('分析了监控中断、签到记录、不在场证明或时间线问题')
  }

  if (mentionsScene) {
    hitPoints.push('使用了消防通道、纤维、墨水、脚印或伪造现场等现场证据')
  }

  if (matchedEvidence.length > 0) {
    hitPoints.push(`使用了 ${matchedEvidence.length} 条关键证据`)
  }

  const missedPoints = []

  if (!mentionsMurderer) {
    missedPoints.push('还没有明确指出真正凶手。')
  }

  if (!mentionsMotive) {
    missedPoints.push('还需要补充财务报销、举报邮件与作案动机之间的关系。')
  }

  if (!mentionsTimeline) {
    missedPoints.push('还需要分析监控中断、签到记录和不在场证明的问题。')
  }

  if (!mentionsScene) {
    missedPoints.push('还需要结合消防通道纤维、墨水痕迹等现场证据。')
  }

  console.log('Rule review keyword check:', {
    mentionsMurderer,
    mentionsMotive,
    mentionsTimeline,
    mentionsScene,
    matchedEvidenceCount: matchedEvidence.length,
    score,
  })

  return {
    score,
    level,
    hitPoints,
    missedPoints,
    evidenceAnalysis: keyEvidence.map((evidence) => {
      const usedByPlayer = evidenceUsedByPlayer(evidence)

      return {
        evidence,
        usedByPlayer,
        comment: usedByPlayer
          ? '玩家推理中已经提到或部分使用了该关键证据。'
          : '玩家推理中没有充分使用该关键证据。',
      }
    }),
    summary:
      score >= 75
        ? '玩家已经抓住了核心凶手、作案动机、时间线和关键现场证据，整体推理接近或命中真相。'
        : '玩家推理中包含部分有效信息，但证据链仍需要进一步补充。',
    truthSummary: `最终真相：凶手是${truth.murderer}。${truth.motive}${truth.method}`,
    fallbackUsed: true,
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'MysteryHost AI Lite backend is running.',
  })
})

app.post('/api/host-chat', async (req, res) => {
  try {
    const {
      caseBackground,
      currentRound,
      releasedClues,
      playerQuestion,
      truth,
    } = req.body

    if (!playerQuestion) {
      return res.status(400).json({
        error: 'playerQuestion is required',
      })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'DEEPSEEK_API_KEY is not configured',
      })
    }

    const deepseek = createDeepSeekClient()

    const systemPrompt = `
你是一个文字版剧本杀游戏的 AI 主持人。

你的任务是根据当前案件信息、当前回合、已释放线索和玩家问题，生成一段主持人回答。

你必须遵守以下规则：
1. 只能基于当前案件信息和已释放线索回答。
2. 不得使用尚未释放的线索。
3. 不得提前透露最终凶手。
4. 不得提前透露完整真相。
5. 不得编造当前剧本中不存在的新线索。
6. 如果玩家询问“凶手是谁”“真相是什么”，你不能直接回答。
7. 如果信息不足，请说明“目前线索不足以判断”。
8. 回答应简洁、有悬疑感，符合剧本杀主持人口吻。
9. 不要直接替玩家完成最终推理。
10. 请只输出一段主持人回答，不要输出分析过程。
`

    const userPrompt = `
当前案件：
${JSON.stringify(caseBackground, null, 2)}

当前回合：
${currentRound}

已释放线索：
${JSON.stringify(releasedClues, null, 2)}

玩家问题：
${playerQuestion}
`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    })

    const reply = response.choices?.[0]?.message?.content

    if (!reply) {
      return res.status(500).json({
        error: 'DeepSeek returned empty response',
      })
    }

    const spoilerCheck = checkSpoilerRisk(reply, truth, releasedClues)

    if (spoilerCheck.hasSpoilerRisk) {
      return res.json({
        reply: getSafeHostReply(currentRound),
        safety: {
          fallbackUsed: true,
          reason: spoilerCheck.riskType,
        },
      })
    }

    res.json({
      reply,
      safety: {
        fallbackUsed: false,
        reason: null,
      },
    })
  } catch (error) {
    console.error('Host chat error:', error)

    res.status(500).json({
      error: 'Failed to generate host response',
      detail: error.message,
    })
  }
})

app.post('/api/review-reasoning', async (req, res) => {
  try {
    const { playerReasoning, truth, clues } = req.body

    if (!playerReasoning) {
      return res.status(400).json({
        error: 'playerReasoning is required',
      })
    }

    if (!truth) {
      return res.status(400).json({
        error: 'truth is required',
      })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'DEEPSEEK_API_KEY is not configured',
      })
    }

    const deepseek = createDeepSeekClient()

    const systemPrompt = `
你是一个严谨的剧本杀推理复盘分析助手。

你的任务是根据玩家的最终推理、案件真相和全部线索，生成结构化复盘结果。

非常重要：
玩家推理字段 playerReasoning 一定包含玩家输入的推理文本。
只要 playerReasoning 不为空，就绝对不能判断为“未参与推理”。
如果玩家指出了真凶、动机、时间线或现场证据，必须识别并加分。

评分规则：
1. 如果玩家明确指出真正凶手，加 30 分。
2. 如果玩家解释作案动机，加 20 分。
3. 如果玩家提到财务、报销、举报、邮件等动机相关内容，加 15 到 20 分。
4. 如果玩家提到监控、签到记录、时间线、不在场证明，加 15 到 20 分。
5. 如果玩家提到现场证据，例如墨水、消防通道、纤维、脚印，加 15 到 20 分。
6. 如果玩家只是猜测，没有证据链，分数应较低。
7. 分数必须是 0 到 100 的整数。
8. 除非 playerReasoning 为空，否则 score 不得为 0。

你必须判断：
1. 玩家是否指出真正凶手。
2. 玩家是否解释作案动机。
3. 玩家是否分析关键时间线。
4. 玩家是否使用关键现场证据。
5. 玩家遗漏了哪些重要信息。
6. 玩家推理整体质量如何。

输出要求：
1. 复盘阶段可以揭示最终真相。
2. 不要嘲讽玩家。
3. 反馈要具体、清晰、可理解。
4. 需要说明判断依据。
5. 如果玩家推理方向错误，需要指出原因。
6. 如果玩家推理方向正确但证据链不完整，需要指出遗漏点。
7. 输出必须是严格 JSON。
8. 不要输出 Markdown。
9. 不要输出额外解释文字。
10. 不要使用“未参与推理”作为 level，除非 playerReasoning 为空。

输出 JSON 格式如下：
{
  "score": 80,
  "level": "接近真相",
  "hitPoints": ["指出真正凶手"],
  "missedPoints": ["没有充分解释时间线"],
  "evidenceAnalysis": [
    {
      "evidence": "关键证据",
      "usedByPlayer": true,
      "comment": "判断说明"
    }
  ],
  "summary": "整体复盘总结",
  "truthSummary": "最终真相说明"
}

level 可选值建议：
- "推理仍不完整"
- "发现了部分关键点"
- "方向基本正确"
- "接近真相"
- "完整命中真相"
`

    const userPrompt = `
玩家推理：
${playerReasoning}

案件真相：
${JSON.stringify(truth, null, 2)}

全部线索：
${JSON.stringify(clues, null, 2)}
`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.4,
    })

    const content = response.choices?.[0]?.message?.content

    if (!content) {
      return res.status(500).json({
        error: 'DeepSeek returned empty review response',
      })
    }

    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let review

    try {
      review = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Review JSON parse error:', parseError)
      return res.status(500).json({
        error: 'Failed to parse DeepSeek review JSON',
        raw: content,
      })
    }

    const ruleBasedReview = createRuleBasedReview(playerReasoning, truth)

    const modelScore = Number(review?.score ?? 0)
    const ruleScore = Number(ruleBasedReview.score ?? 0)

    const shouldUseFallbackReview =
      playerReasoning.trim() &&
      (
        !review ||
        modelScore === 0 ||
        review.level === '未参与推理' ||
        review.level?.includes('未参与') ||
        ruleScore - modelScore >= 25
      )

    console.log('Review fallback check:', {
      modelScore,
      ruleScore,
      shouldUseFallbackReview,
      modelLevel: review?.level,
    })

    const finalReview = shouldUseFallbackReview
      ? {
          ...ruleBasedReview,
          fallbackReason:
            ruleScore - modelScore >= 25
              ? 'model_score_too_low'
              : 'invalid_model_review',
        }
      : {
          ...review,
          fallbackUsed: false,
          fallbackReason: null,
        }

    res.json({
      review: finalReview,
    })
  } catch (error) {
    console.error('Reasoning review error:', error)

    res.status(500).json({
      error: 'Failed to generate reasoning review',
      detail: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`MysteryHost AI Lite backend is running on http://localhost:${PORT}`)
})

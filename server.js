
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { buildHostSystemPrompt, buildHostUserPrompt } from './server/prompts/hostPrompt.js'
import { buildReviewSystemPrompt, buildReviewUserPrompt } from './server/prompts/reviewPrompt.js'
import { buildScriptGenerationSystemPrompt, buildScriptGenerationUserPrompt } from './server/prompts/scriptPrompt.js'

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

    const systemPrompt = buildHostSystemPrompt()

    const userPrompt = buildHostUserPrompt({
      caseBackground,
      currentRound,
      releasedClues,
      playerQuestion,
    })

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

app.post('/api/generate-script', async (req, res) => {
  try {
    const {
      theme = '校园悬疑',
      playerCount = 4,
      difficulty = '普通',
    } = req.body

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error: 'DEEPSEEK_API_KEY is not configured',
      })
    }

    const deepseek = createDeepSeekClient()

    const systemPrompt = buildScriptGenerationSystemPrompt()

    const userPrompt = buildScriptGenerationUserPrompt({
      theme,
      playerCount,
      difficulty,
    })

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
      temperature: 0.8,
    })

    const content = response.choices?.[0]?.message?.content

    if (!content) {
      return res.status(500).json({
        error: 'DeepSeek returned empty script response',
      })
    }

    const cleanedContent = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    let script

    try {
      script = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('Script JSON parse error:', parseError)

      return res.status(500).json({
        error: 'Failed to parse DeepSeek script JSON',
        raw: content,
      })
    }

    script.theme = theme
    script.playerCount = Number(playerCount)
    script.difficulty = difficulty

    const characterNames = script.characters?.map((character) => character.name) || []
    const murderer = script.truth?.murderer

    if (!murderer || !characterNames.includes(murderer)) {
      return res.status(500).json({
        error: 'Generated script failed consistency check: murderer is not in characters',
        raw: script,
      })
    }

    res.json({
      script,
    })
  } catch (error) {
    console.error('Script generation error:', error)

    res.status(500).json({
      error: 'Failed to generate script',
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

    const systemPrompt = buildReviewSystemPrompt()

    const userPrompt = buildReviewUserPrompt({
      playerReasoning,
      truth,
      clues,
    })

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

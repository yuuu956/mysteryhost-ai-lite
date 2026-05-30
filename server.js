import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'MysteryHost AI Lite backend is running.',
  })
})

app.post('/api/host-chat', async (req, res) => {
  try {
    const { caseBackground, currentRound, releasedClues, playerQuestion } = req.body

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

    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      timeout: 60 * 1000,
      maxRetries: 2,
    })

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

    res.json({
      reply,
    })
  } catch (error) {
    console.error('Host chat error:', error)

    res.status(500).json({
      error: 'Failed to generate host response',
      detail: error.message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`MysteryHost AI Lite backend is running on http://localhost:${PORT}`)
})
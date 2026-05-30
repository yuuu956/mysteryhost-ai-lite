import { useState } from 'react'
import { mysteryCase, characters, clues, truth } from './data/mysteryCase'
import { askAIHost } from './api/hostApi'
import { reviewReasoningWithAI } from './api/reviewApi'
import './App.css'

function App() {
  const [currentRound, setCurrentRound] = useState(1)
  const [question, setQuestion] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [reviewResult, setReviewResult] = useState(null)
  const [hostMessages, setHostMessages] = useState([
    {
      role: 'host',
      content:
        '欢迎进入《雨夜图书馆》。我是本局 AI 主持人。你可以询问现场、角色、线索或时间线，但我不会提前透露最终真相。'
    }
  ])

  const releasedClues = clues.filter((clue) => clue.round <= currentRound)

  const handleNextRound = () => {
    if (currentRound < clues.length) {
      setCurrentRound(currentRound + 1)
    }
  }

  const handleAskHost = async () => {
    if (!question.trim()) return
  
    const playerQuestion = question.trim()
    setQuestion('')
  
    let hostReply =
      '这个问题目前还不能直接回答。请结合已经释放的线索继续推理，尤其注意时间线、人物动机和现场痕迹之间的矛盾。'
  
    try {
      hostReply = await askAIHost({
        caseBackground: mysteryCase,
        currentRound,
        releasedClues,
        playerQuestion,
      })
    } catch (error) {
      console.error('AI host failed, fallback to local rules:', error)
  
      if (playerQuestion.includes('死者') || playerQuestion.includes('许言')) {
        hostReply =
          '关于死者许言，目前可以确认：他正在调查学生会异常报销问题，并且案发前曾接触过关键财务文件。更多死亡细节需要结合后续线索判断。'
      }
  
      if (playerQuestion.includes('现场') || playerQuestion.includes('图书馆')) {
        hostReply =
          '案发现场位于旧图书馆三楼档案室外。门窗没有明显破坏痕迹，但地面脚印、钢笔墨水和消防通道附近的痕迹都值得重点关注。'
      }
  
      if (playerQuestion.includes('林舟')) {
        hostReply =
          '林舟有经济方面的动机，他和死者之间存在学生会经费问题。但目前的线索还不足以直接证明他就是凶手。'
      }
  
      if (playerQuestion.includes('沈念')) {
        hostReply =
          '沈念是案发前最后见过死者的人之一，并且掌握部分财务文件信息。她的证词需要和邮件草稿、档案记录一起分析。'
      }
  
      if (playerQuestion.includes('周遥')) {
        hostReply =
          '周遥具备干扰系统和修改记录的能力，但这并不等于他一定亲自作案。你需要判断他是主动参与，还是被他人利用。'
      }
  
      if (playerQuestion.includes('凶手') || playerQuestion.includes('真相')) {
        hostReply =
          '现在还不能直接确认凶手。作为主持人，我只能提醒你：不要只看表面动机，也要关注谁有机会修改时间线和转移嫌疑。'
      }
  
      if (currentRound < 3) {
        hostReply += ' 当前仍处于线索释放阶段，请注意：部分关键信息尚未公开。'
      }
    }
  
    setHostMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'player',
        content: playerQuestion,
      },
      {
        role: 'host',
        content: hostReply,
      },
    ])
  }

  const handleReviewReasoning = async () => {
    if (!reasoning.trim()) return

    const userReasoning = reasoning.trim()

    try {
      const aiReview = await reviewReasoningWithAI({
        playerReasoning: userReasoning,
        truth,
        clues,
      })

      setReviewResult({
        score: aiReview.score,
        level: aiReview.level,
        mentionsMurderer:
          aiReview.hitPoints?.some((point) => point.includes('凶手')) ||
          userReasoning.includes(truth.murderer),
        matchedEvidence:
          aiReview.evidenceAnalysis
            ?.filter((item) => item.usedByPlayer)
            .map((item) => item.evidence) || [],
        missedPoints: aiReview.missedPoints || [],
        truthSummary:
          aiReview.truthSummary ||
          `最终真相：凶手是${truth.murderer}。${truth.motive}${truth.method}`,
        summary: aiReview.summary,
        hitPoints: aiReview.hitPoints || [],
        evidenceAnalysis: aiReview.evidenceAnalysis || [],
        fallbackUsed: aiReview.fallbackUsed || false,
        fallbackReason: aiReview.fallbackReason || null,
      })

      return
    } catch (error) {
      console.error('AI review failed, fallback to local rules:', error)
    }

    const matchedEvidence = truth.keyEvidence.filter((evidence) =>
      userReasoning.includes(evidence.slice(0, 4))
    )

    const mentionsMurderer = userReasoning.includes(truth.murderer)
    const mentionsMotive =
      userReasoning.includes('报销') ||
      userReasoning.includes('举报') ||
      userReasoning.includes('财务')
    const mentionsTimeline =
      userReasoning.includes('时间') ||
      userReasoning.includes('签到') ||
      userReasoning.includes('监控')
    const mentionsScene =
      userReasoning.includes('消防通道') ||
      userReasoning.includes('纤维') ||
      userReasoning.includes('墨水')

    const score =
      (mentionsMurderer ? 30 : 0) +
      (mentionsMotive ? 20 : 0) +
      (mentionsTimeline ? 20 : 0) +
      (mentionsScene ? 20 : 0) +
      Math.min(matchedEvidence.length * 5, 10)

    let level = '推理仍不完整'
    if (score >= 80) {
      level = '接近真相'
    } else if (score >= 55) {
      level = '方向基本正确'
    } else if (score >= 30) {
      level = '发现了部分关键点'
    }

    const missedPoints = []

    if (!mentionsMurderer) {
      missedPoints.push('你还没有明确指出真正的凶手。')
    }

    if (!mentionsMotive) {
      missedPoints.push('你没有充分解释财务报销、举报邮件和作案动机之间的关系。')
    }

    if (!mentionsTimeline) {
      missedPoints.push('你还需要分析监控中断和签到记录被修改的问题。')
    }

    if (!mentionsScene) {
      missedPoints.push('你忽略了消防通道纤维、墨水痕迹等现场证据。')
    }

    setReviewResult({
      score,
      level,
      mentionsMurderer,
      matchedEvidence,
      missedPoints,
      truthSummary: `最终真相：凶手是${truth.murderer}。${truth.motive}${truth.method}`,
      fallbackUsed: true,
      fallbackReason: 'frontend_local_fallback',
    })
  }

  return (
    <div className="app">
      <header className="hero hero-split">
        <div className="hero-content">
          <p className="eyebrow">AI Product Manager Learning Project</p>
          <h1>MysteryHost AI Lite</h1>
          <p className="subtitle">
            一个文字版 AI 剧本杀主持人原型，支持案件展示、角色卡、线索释放、主持人问答和推理复盘。
          </p>

          <div className="hero-tags">
            <span>案件生成</span>
            <span>角色卡</span>
            <span>线索回合</span>
            <span>AI 主持人</span>
            <span>推理复盘</span>
          </div>

          <div className="hero-actions">
            <button className="primary-btn">开始生成剧本</button>
            <button className="secondary-btn">查看 Demo</button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="case-board">
            <div className="board-line line-1"></div>
            <div className="board-line line-2"></div>
            <div className="board-line line-3"></div>

            <div className="evidence-card portrait-card">
              <div className="portrait-avatar">?</div>
              <p>嫌疑人身份待确认</p>
            </div>

            <div className="evidence-card mansion-card">
              <div className="scene-image">旧图书馆</div>
              <p>案发现场</p>
            </div>

            <div className="evidence-card note-card">
              <p className="note-title">谁在撒谎？</p>
              <p className="note-sub">线索交叉矛盾</p>
            </div>

            <div className="evidence-card file-card">
              <p className="file-label">CAMPUS MYSTERY</p>
              <p className="file-sub">案件档案已开启</p>
            </div>

            <div className="pin pin-1"></div>
            <div className="pin pin-2"></div>
            <div className="pin pin-3"></div>
            <div className="pin pin-4"></div>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel story-panel">
          <div className="panel-header">
            <span>01</span>
            <h2>案件背景</h2>
          </div>

          <div className="case-content">
            <div className="case-meta">
              <span>{mysteryCase.theme}</span>
              <span>{mysteryCase.playerCount} 人局</span>
              <span>难度：{mysteryCase.difficulty}</span>
            </div>

            <h3>{mysteryCase.title}</h3>

            <p>{mysteryCase.background}</p>

            <div className="case-grid">
              <div>
                <strong>死者</strong>
                <p>
                  {mysteryCase.victim.name}，{mysteryCase.victim.identity}，
                  {mysteryCase.victim.age} 岁。
                </p>
              </div>

              <div>
                <strong>案发地点</strong>
                <p>{mysteryCase.location}</p>
              </div>

              <div>
                <strong>核心谜题</strong>
                <p>{mysteryCase.coreMystery}</p>
              </div>
            </div>
          </div>
        </section>        

        <section className="panel character-panel">
          <div className="panel-header">
            <span>02</span>
            <h2>角色卡</h2>
          </div>

          <div className="character-list">
            {characters.map((character) => (
              <article className="character-card" key={character.id}>
                <div className="character-top">
                  <div className="character-avatar">{character.avatar}</div>
                  <div>
                    <h3>{character.name}</h3>
                    <p>{character.identity}</p>
                  </div>
                </div>

                <div className="character-info">
                  <strong>公开信息</strong>
                  <p>{character.publicInfo}</p>
                </div>

                <div className="character-info secret-info">
                  <strong>隐藏秘密</strong>
                  <p>{character.secret}</p>
                </div>

                <div className="character-footer">
                  <span>{character.relationship}</span>
                  <span>{character.suspicion}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel clue-panel">
          <div className="panel-header">
            <span>03</span>
            <h2>线索释放</h2>
          </div>

          <div className="round-control">
            <div>
              <p>当前回合</p>
              <strong>Round {currentRound}</strong>
            </div>

            <button
              className="next-round-btn"
              onClick={handleNextRound}
              disabled={currentRound >= clues.length}
            >
              {currentRound >= clues.length ? '线索已全部释放' : '释放下一轮线索'}
            </button>
          </div>

          <div className="clue-list">
            {releasedClues.map((clue) => (
              <article className="clue-card" key={clue.round}>
                <div className="clue-title">
                  <span>Round {clue.round}</span>
                  <h3>{clue.title}</h3>
                </div>

                <ul>
                  {clue.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel chat-panel">
          <div className="panel-header">
            <span>04</span>
            <h2>主持人问答</h2>
          </div>

          <div className="chat-box">
            <div className="message-list">
              {hostMessages.map((message, index) => (
                <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  <span>{message.role === 'host' ? 'AI 主持人' : '玩家'}</span>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>

            <div className="question-input">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="例如：我可以调查图书馆现场吗？"
              />
              <button onClick={handleAskHost}>提问</button>
            </div>
          </div>
        </section>

        <section className="panel review-panel">
          <div className="panel-header">
            <span>05</span>
            <h2>推理复盘</h2>
          </div>

          <div className="review-box">
            <textarea
              value={reasoning}
              onChange={(event) => setReasoning(event.target.value)}
              placeholder="请输入你的最终推理，例如：我认为凶手是沈念，因为她掌握财务文件，并可能利用监控中断和签到记录制造不在场证明。"
            />

            <button className="review-btn" onClick={handleReviewReasoning}>
              提交推理并复盘
            </button>

            {reviewResult && (
              <div className="review-result">
                <div className="review-score">
                  <div>
                    <p>推理评分</p>
                    <strong>{reviewResult.score}</strong>
                  </div>
                  <span>{reviewResult.level}</span>
                </div>

                <div className="review-section">
                  <h3>命中情况</h3>
                  <ul>
                    <li>
                      {reviewResult.mentionsMurderer
                        ? '你成功指出了关键嫌疑人。'
                        : '你还没有准确指出关键嫌疑人。'}
                    </li>
                    <li>
                      已命中关键证据：{reviewResult.matchedEvidence.length || 0} 条
                    </li>
                  </ul>
                </div>

                <div className="review-section">
                  <h3>遗漏点</h3>
                  {reviewResult.missedPoints.length > 0 ? (
                    <ul>
                      {reviewResult.missedPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>你的推理已经覆盖主要关键点。</p>
                  )}
                </div>

                <div className="review-section truth-section">
                  <h3>最终真相</h3>
                  <p>{reviewResult.truthSummary}</p>
                </div>
              </div>
            )}
          </div>
        </section>


      </main>
    </div>
  )
}

export default App
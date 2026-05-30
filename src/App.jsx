import './App.css'

function App() {
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
          <p className="placeholder">
            这里将展示案件背景、死者信息、案发地点和核心谜题。
          </p>
        </section>

        <section className="panel character-panel">
          <div className="panel-header">
            <span>02</span>
            <h2>角色卡</h2>
          </div>
          <p className="placeholder">
            这里将展示玩家角色、公开信息、隐藏秘密和可疑点。
          </p>
        </section>

        <section className="panel clue-panel">
          <div className="panel-header">
            <span>03</span>
            <h2>线索释放</h2>
          </div>
          <p className="placeholder">
            这里将按回合释放现场线索、人物关系线索和关键反转线索。
          </p>
        </section>

        <section className="panel chat-panel">
          <div className="panel-header">
            <span>04</span>
            <h2>主持人问答</h2>
          </div>
          <p className="placeholder">
            玩家可以向 AI 主持人提问，主持人需要基于当前游戏阶段回答，不能提前剧透。
          </p>
        </section>

        <section className="panel review-panel">
          <div className="panel-header">
            <span>05</span>
            <h2>推理复盘</h2>
          </div>
          <p className="placeholder">
            玩家提交最终推理后，系统会分析推理是否完整，并指出遗漏线索。
          </p>
        </section>
      </main>
    </div>
  )
}

export default App
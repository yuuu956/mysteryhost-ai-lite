const API_BASE_URL = 'http://localhost:3001'

export async function askAIHost({ caseBackground, currentRound, releasedClues, playerQuestion }) {
  const response = await fetch(`${API_BASE_URL}/api/host-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      caseBackground,
      currentRound,
      releasedClues,
      playerQuestion,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to ask AI host')
  }

  return data.reply
}
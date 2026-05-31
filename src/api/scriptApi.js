const API_BASE_URL = 'http://localhost:3001'

export async function generateScriptWithAI({
  theme,
  playerCount,
  difficulty,
}) {
  const response = await fetch(`${API_BASE_URL}/api/generate-script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      theme,
      playerCount,
      difficulty,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate script')
  }

  return data.script
}

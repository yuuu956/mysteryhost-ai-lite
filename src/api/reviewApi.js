const API_BASE_URL = 'http://localhost:3001'

export async function reviewReasoningWithAI({ playerReasoning, truth, clues }) {
  const response = await fetch(`${API_BASE_URL}/api/review-reasoning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerReasoning,
      truth,
      clues,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to review reasoning')
  }

  return data.review
}
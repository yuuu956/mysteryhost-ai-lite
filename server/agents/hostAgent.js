export function decideHostAction({ userAction, currentRound, maxRound = 3 }) {
  if (!userAction) {
    return {
      action: 'clarify',
      reason: 'missing_user_action',
      allowed: false,
    }
  }

  if (userAction === 'ask_question') {
    return {
      action: 'answer_question',
      reason: 'player_asked_question',
      allowed: true,
      requiredTool: 'host_chat',
    }
  }

  if (userAction === 'submit_reasoning') {
    return {
      action: 'review_reasoning',
      reason: 'player_submitted_final_reasoning',
      allowed: true,
      requiredTool: 'review_reasoning',
    }
  }

  if (userAction === 'release_clue') {
    if (currentRound >= maxRound) {
      return {
        action: 'no_more_clues',
        reason: 'all_clues_released',
        allowed: false,
      }
    }

    return {
      action: 'release_next_clue',
      reason: 'player_requested_next_round',
      allowed: true,
      requiredTool: 'release_clue',
    }
  }

  if (userAction === 'generate_script') {
    return {
      action: 'generate_script',
      reason: 'player_requested_new_script',
      allowed: true,
      requiredTool: 'script_generation',
    }
  }

  return {
    action: 'clarify',
    reason: 'unknown_user_action',
    allowed: false,
  }
}

export function getAllowedDataForStage(stage) {
  const permissions = {
    story: {
      allowedData: ['mysteryCase', 'characters'],
      forbiddenData: ['truth'],
      allowedTools: ['load_case'],
    },
    clue: {
      allowedData: ['mysteryCase', 'characters', 'releasedClues'],
      forbiddenData: ['truth', 'unreleasedClues'],
      allowedTools: ['release_clue', 'host_chat'],
    },
    qa: {
      allowedData: ['mysteryCase', 'characters', 'releasedClues', 'currentRound'],
      forbiddenData: ['truth', 'unreleasedClues'],
      allowedTools: ['host_chat', 'spoiler_check'],
    },
    review: {
      allowedData: ['mysteryCase', 'characters', 'clues', 'truth', 'playerReasoning'],
      forbiddenData: [],
      allowedTools: ['review_reasoning'],
    },
    script_generation: {
      allowedData: ['theme', 'playerCount', 'difficulty'],
      forbiddenData: [],
      allowedTools: ['script_generation', 'consistency_check'],
    },
  }

  return (
    permissions[stage] || {
      allowedData: [],
      forbiddenData: [],
      allowedTools: [],
    }
  )
}

export function buildAgentTrace({ actionDecision, stage, safetyResult }) {
  return {
    agentName: 'MysteryHostAgent',
    stage,
    action: actionDecision?.action,
    allowed: actionDecision?.allowed,
    reason: actionDecision?.reason,
    requiredTool: actionDecision?.requiredTool || null,
    safety: safetyResult || null,
    timestamp: new Date().toISOString(),
  }
}

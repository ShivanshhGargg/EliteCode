export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const formatTime = (ms) => {
  if (!ms) return 'N/A'
  return `${ms}ms`
}

export const formatSuccessRate = (rate) => {
  if (rate == null) return '0%'
  return `${(rate * 100).toFixed(1)}%`
}

export const truncate = (text, length = 100) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

export const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'EASY': return 'text-neon-green'
    case 'MEDIUM': return 'text-neon-orange'
    case 'HARD': return 'text-neon-red'
    default: return 'text-txt-muted'
  }
}

export const getDifficultyBg = (difficulty) => {
  switch (difficulty) {
    case 'EASY': return 'bg-neon-green/10 border-neon-green/20 text-neon-green'
    case 'MEDIUM': return 'bg-neon-orange/10 border-neon-orange/20 text-neon-orange'
    case 'HARD': return 'bg-neon-red/10 border-neon-red/20 text-neon-red'
    default: return 'bg-white/5 border-white/10 text-txt-muted'
  }
}

export const getResultColor = (result) => {
  switch (result) {
    case 'ACCEPTED': return 'text-neon-green'
    case 'WRONG_ANSWER': return 'text-neon-red'
    case 'RUNTIME_ERROR': return 'text-neon-orange'
    case 'TIME_LIMIT_EXCEEDED': return 'text-neon-yellow'
    case 'PENDING':
    case 'RUNNING': return 'text-cyan'
    default: return 'text-txt-muted'
  }
}

export const getModeDescription = (mode) => {
  const descriptions = {
    STANDARD: 'Balanced assistant guidance with clear explanations and execution support',
    INTERVIEW: 'Sharper, question-first coaching that behaves like a technical interviewer',
    LEARNING: 'Progressive tutoring with step-by-step hints and concept breakdowns',
  }
  return descriptions[mode] || descriptions.STANDARD
}

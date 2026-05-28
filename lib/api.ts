const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export interface VoiceSession {
  session_id: string
  personality_id: string | null
  personality_name: string
  greeting: string
}

export async function createVoiceSession(
  candidateName: string
): Promise<VoiceSession> {
  const params = new URLSearchParams()
  if (candidateName) {
    params.set("candidate_name", candidateName)
  }
  params.set("mode", "sde_i")
  const res = await fetch(`${API_BASE_URL}/voice/session?${params}`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to create voice session")
  const raw = await res.json()
  return raw.data || raw
}

export async function* streamChatMessage(prompt: string, sessionId = "", context = ""): AsyncGenerator<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context, session_id: sessionId }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error("Failed to stream message")
    if (!res.body) throw new Error("No response body")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield decoder.decode(value, { stream: true })
      }
    } finally {
      reader.releaseLock()
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function endSession(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/end`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to end session")
  return res.json()
}

export async function speakWithElevenLabs(text: string): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/voice/tts?${new URLSearchParams({ text })}`,
    { method: "POST" }
  )
  if (!res.ok) throw new Error("Failed to generate TTS")
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)

  return new Promise<void>((resolve) => {
    const audio = new Audio(url)
    audio.onended = () => { URL.revokeObjectURL(url); resolve() }
    audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
    audio.play().catch(() => { URL.revokeObjectURL(url); resolve() })
  })
}

export interface ExecutionResult {
  success: boolean
  output: string
  error: string
  runtime_ms: number
  memory_kb: number
}

export async function executeCode(
  language: string,
  code: string,
  stdin = ""
): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE_URL}/execution/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code, stdin }),
  })
  if (!res.ok) throw new Error("Failed to execute code")
  const raw = await res.json()
  return raw.data || raw
}

export interface EvaluationResult {
  session_id: string
  personality_id: string | null
  personality_name: string
  hire_probability: number
  score_breakdown: {
    confidence: number
    response_quality: number
    hesitation_frequency: number
    communication_clarity: number
    technical_accuracy: number
  }
  communication_analysis: string
  confidence_score: number
  behavioral_observations: { category: string; observation: string }[]
  strengths: string[]
  weaknesses: string[]
  areas_for_improvement: string[]
  overall_summary: string
  exchange_count: number
  total_duration_seconds: number
  evaluated_at: string
}

export async function generateEvaluation(sessionId: string): Promise<EvaluationResult> {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/evaluate/`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to generate evaluation")
  return res.json()
}

export async function getEvaluation(sessionId: string): Promise<EvaluationResult> {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/evaluate/`)
  if (!res.ok) throw new Error("Failed to get evaluation")
  return res.json()
}

export async function skipRound(sessionId: string): Promise<{ current_round: string; message: string; ai_prompt: string }> {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/skip-round`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to skip round")
  return res.json()
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Personality {
  id: string
  name: string
  description: string
  traits: { name: string; description: string }[]
  greeting: string
  interview_style: string
  emotional_baseline: {
    initial_patience: number
    initial_respect: number
    initial_mood: "negative" | "neutral" | "positive"
    patience_decay_rate: number
    respect_growth_rate: number
  }
}

export interface Session {
  id: string
  personality_id: string
  personality_name: string
  status: "created" | "active" | "ended" | "evaluated"
  created_at: string
  updated_at: string
  exchange_count: number
  current_emotional_state: {
    patience: number
    respect: number
    mood: string
  }
  transcript?: { role: string; content: string; timestamp: string }[]
}

export interface VoiceSession {
  session_id: string
  personality_id: string
  personality_name: string
  greeting: string
}

export async function fetchPersonalities(): Promise<Personality[]> {
  const res = await fetch(`${API_BASE_URL}/personalities/`)
  if (!res.ok) throw new Error("Failed to fetch personalities")
  const data = await res.json()
  return data.personalities
}

export async function createVoiceSession(
  personalityId: string,
  candidateName: string
): Promise<VoiceSession> {
  const params = new URLSearchParams({ personality_id: personalityId })
  if (candidateName) {
    params.set("candidate_name", candidateName)
  }
  const res = await fetch(`${API_BASE_URL}/voice/session?${params}`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to create voice session")
  const raw = await res.json()
  return raw.data || raw
}

export async function* streamChatMessage(prompt: string, context = ""): AsyncGenerator<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context }),
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

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`)
  if (!res.ok) throw new Error("Failed to get session")
  return res.json()
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

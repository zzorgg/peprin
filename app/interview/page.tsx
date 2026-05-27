"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Mic,
  Loader2,
  Sparkles,
  ArrowRight,
  Volume2,
  PhoneOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Orb, type AgentState } from "@/components/ui/orb"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import { Response } from "@/components/ui/response"
import {
  fetchPersonalities,
  createVoiceSession,
  streamChatMessage,
  endSession,
  speakWithElevenLabs,
  type Personality,
  type VoiceSession,
} from "@/lib/api"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

type EngineStatus = "idle" | "starting" | "greeting" | "ready_to_speak" | "waiting" | "thinking" | "responding" | "error"

function mapToOrbState(status: EngineStatus): AgentState {
  switch (status) {
    case "thinking":
    case "starting":
      return "thinking"
    case "waiting":
      return "listening"
    case "responding":
      return "talking"
    default:
      return null
  }
}

export default function InterviewPage() {
  const router = useRouter()
  const [step, setStep] = useState<"name" | "personality" | "interview">("name")
  const [name, setName] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [personalities, setPersonalities] = useState<Personality[]>([])
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("idle")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interimText, setInterimText] = useState("")

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef<VoiceSession | null>(null)
  const isActiveRef = useRef(false)
  const engineStatusRef = useRef<EngineStatus>("idle")
  const restartCountRef = useRef(0)

  const updateStatus = useCallback((s: EngineStatus) => {
    engineStatusRef.current = s
    setEngineStatus(s)
  }, [])

  const cleanupAll = useCallback(() => {
    isActiveRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const killMic = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanupAll()
  }, [cleanupAll])

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text?.trim()) return
    console.log("[speak] TTS:", text.slice(0, 80) + "...")

    try {
      await speakWithElevenLabs(text)
      console.log("[speak] ElevenLabs done")
      return
    } catch (e) {
      console.log("[speak] ElevenLabs failed, trying browser TTS:", e)
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.log("[speak] No TTS available")
      return
    }

    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel()

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.95
        utterance.pitch = 1.0
        utterance.volume = 1.0

        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          const voice = voices.find((v) => v.lang.startsWith("en-")) || voices[0]
          if (voice) utterance.voice = voice
        }

        const timeoutId = setTimeout(() => {
          window.speechSynthesis.cancel()
          resolve()
        }, Math.max(text.length * 80, 5000))

        let done = false
        utterance.onend = () => {
          if (!done) { done = true; clearTimeout(timeoutId); console.log("[speak] Browser done"); resolve() }
        }
        utterance.onerror = () => {
          if (!done) { done = true; clearTimeout(timeoutId); console.log("[speak] Browser TTS failed"); resolve() }
        }
        window.speechSynthesis.speak(utterance)
      }, 100)
    })
  }, [])

  const startRecognitionRef = useRef<() => void>(() => {})

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!sessionRef.current || !text) return

      killMic()
      updateStatus("thinking")

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      }
      setMessages((prev) => [...prev, userMessage])
      console.log("[chat] Sending to backend:", text.slice(0, 80))

      try {
        const assistantMessageId = (Date.now() + 1).toString()
        let fullResponse = ""

        const gen = streamChatMessage(text)
        for await (const token of gen) {
          fullResponse += token
          setMessages((prev) => {
            const existing = prev.find((m) => m.id === assistantMessageId)
            if (existing) {
              return prev.map((m) =>
                m.id === assistantMessageId ? { ...m, content: fullResponse } : m
              )
            }
            return [...prev, { id: assistantMessageId, role: "assistant", content: fullResponse }]
          })
        }

        console.log("[chat] Got response:", fullResponse.slice(0, 80))

        if (!isActiveRef.current) {
          updateStatus("idle")
          return
        }

        updateStatus("responding")
        await speakText(fullResponse)

        if (!isActiveRef.current) {
          updateStatus("idle")
          return
        }

        updateStatus("ready_to_speak")
      } catch (err) {
        console.error("[chat] Failed:", err)
        setError("Failed to get response. Check if backend is running.")
        updateStatus("idle")
      }
    },
    [speakText, updateStatus, killMic]
  )

  const handleUserSpeechRef = useRef(handleUserSpeech)
  useEffect(() => {
    handleUserSpeechRef.current = handleUserSpeech
  }, [handleUserSpeech])

  const startRecognition = useCallback(() => {
    if (engineStatusRef.current !== "waiting") {
      console.log("[recognition] Blocked: not in waiting state, current=", engineStatusRef.current)
      return
    }

    console.log("[recognition] Starting...")

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      console.log("[recognition] Not supported")
      setError("Speech recognition not supported. Please use Chrome or Edge.")
      updateStatus("idle")
      return
    }

    killMic()

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

    let finalTranscript = ""

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isActiveRef.current) return

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += " " + result[0].transcript
        } else {
          setInterimText(result[0].transcript)
        }
      }
    }

    recognition.onerror = (event: Event) => {
      const err = event as SpeechRecognitionErrorEvent
      console.log("[recognition] Error:", err.error)
      if (err.error === "not-allowed" || err.error === "service-not-allowed") {
        setError("Microphone denied. Please allow mic access and reload.")
        updateStatus("idle")
      }
    }

    recognition.onend = () => {
      console.log("[recognition] Ended, final:", finalTranscript.trim().slice(0, 50))

      if (!isActiveRef.current) return
      if (engineStatusRef.current !== "waiting") return

      const spoken = finalTranscript.trim()
      if (spoken) {
        setInterimText("")
        setError(null)
        handleUserSpeechRef.current(spoken)
      } else if (restartCountRef.current < 3) {
        console.log("[recognition] No speech, restart attempt", restartCountRef.current + 1)
        restartCountRef.current++
        try {
          recognitionRef.current = null
          const newRec = new SpeechRecognitionClass()
          newRec.continuous = false
          newRec.interimResults = true
          newRec.lang = "en-US"
          newRec.maxAlternatives = 1
          newRec.onresult = recognition.onresult
          newRec.onerror = recognition.onerror
          newRec.onend = recognition.onend
          recognitionRef.current = newRec
          newRec.start()
        } catch {
          console.log("[recognition] Restart failed")
          updateStatus("idle")
        }
      } else {
        console.log("[recognition] Max restarts reached, going idle")
        updateStatus("idle")
      }
    }

    recognitionRef.current = recognition
    restartCountRef.current = 0
    try {
      recognition.start()
      console.log("[recognition] Started, waiting for speech...")
    } catch (e) {
      console.log("[recognition] Start failed:", e)
      updateStatus("idle")
    }
  }, [updateStatus, killMic])

  useEffect(() => {
    startRecognitionRef.current = startRecognition
  }, [startRecognition])

  const requestMicAndListen = useCallback(async () => {
    if (engineStatusRef.current !== "ready_to_speak" && engineStatusRef.current !== "idle") {
      return
    }

    setError(null)
    updateStatus("starting")
    console.log("[interview] Requesting mic...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      mediaStreamRef.current = stream
      isActiveRef.current = true
      console.log("[interview] Mic granted")
    } catch (err) {
      console.error("[interview] Mic denied:", err)
      setError("Microphone access is required for voice interview.")
      updateStatus("ready_to_speak")
      return
    }

    await new Promise((r) => setTimeout(r, 300))
    if (!isActiveRef.current) return

    updateStatus("waiting")
    startRecognitionRef.current()
  }, [updateStatus])

  const beginInterview = useCallback(async () => {
    if (engineStatusRef.current !== "idle" && engineStatusRef.current !== "error") {
      console.log("[interview] Already active, ignoring click")
      return
    }

    setError(null)
    updateStatus("starting")
    isActiveRef.current = true

    const s = sessionRef.current
    console.log("[interview] Session:", s)
    if (!s?.greeting) {
      console.log("[interview] Session or greeting missing", s)
      setError("Session not found. Please go back and try again.")
      updateStatus("idle")
      isActiveRef.current = false
      return
    }

    updateStatus("greeting")
    console.log("[interview] Speaking greeting:", s.greeting.slice(0, 80))
    await speakText(s.greeting)
    console.log("[interview] Greeting finished")

    if (!isActiveRef.current) {
      updateStatus("idle")
      return
    }

    updateStatus("ready_to_speak")
  }, [speakText, updateStatus])

  const handleEndCall = useCallback(async () => {
    cleanupAll()
    if (sessionRef.current?.session_id) {
      try { await endSession(sessionRef.current.session_id) } catch {}
    }
    router.push("/")
  }, [cleanupAll, router])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (step === "name" && nameInput.trim()) {
          setName(nameInput.trim())
          setStep("personality")
        }
      }
    },
    [step, nameInput]
  )

  useEffect(() => {
    if (step === "personality") {
      setIsLoading(true)
      fetchPersonalities()
        .then((data) => {
          setPersonalities(data)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error("Failed to fetch personalities:", err)
          setError("Failed to load interviewers.")
          setIsLoading(false)
        })
    }
  }, [step])

  const handleSelectPersonality = useCallback(
    async (personality: Personality) => {
      setSelectedPersonality(personality)
      setIsLoading(true)
      setError(null)

      try {
        const voiceSession = await createVoiceSession(personality.id, name)
        sessionRef.current = voiceSession

        setMessages([
          {
            id: "greeting",
            role: "assistant",
            content: voiceSession.greeting,
          },
        ])

        setIsLoading(false)
        setStep("interview")
      } catch (err) {
        console.error("Failed to start session:", err)
        setError("Failed to start interview. Is the backend running?")
        setIsLoading(false)
      }
    },
    [name]
  )

  if (step === "name") {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-12"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <Orb className="h-32 w-32 mx-auto relative" agentState="listening" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight mb-6"
            >
              Welcome to Peprin
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-muted-foreground mb-12"
            >
              Let&apos;s start with your name
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-xl mx-auto"
            >
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => {
                    e.target.setSelectionRange(0, 0)
                  }}
                  placeholder="Type your name..."
                  className="w-full text-3xl sm:text-4xl md:text-5xl bg-transparent border-b-2 border-border/50 focus:border-primary outline-none py-4 text-foreground placeholder:text-muted-foreground/50 transition-colors"
                  autoFocus
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-12"
              >
                <Button
                  size="lg"
                  onClick={() => {
                    if (nameInput.trim()) {
                      setName(nameInput.trim())
                      setStep("personality")
                    }
                  }}
                  disabled={!nameInput.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-full"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground text-sm"
        >
          Press Enter to continue
        </motion.div>
      </div>
    )
  }

  if (step === "personality") {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

        <button
          onClick={() => setStep("name")}
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl w-full"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4"
            >
              <Orb className="h-20 w-20 mx-auto" agentState="listening" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
            >
              Choose your interviewer, {name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground mb-12"
            >
              Each interviewer has a unique style and personality
            </motion.p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-destructive py-8">{error}</div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {personalities.map((personality, index) => (
                  <motion.button
                    key={personality.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => handleSelectPersonality(personality)}
                    className="group text-left p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                        {personality.name}
                      </h3>
                      <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {personality.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {personality.traits.slice(0, 2).map((trait) => (
                        <span
                          key={trait.name}
                          className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground"
                        >
                          {trait.name}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Exit</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<Orb className="size-16" agentState="listening" />}
                  title={`Welcome, ${name}!`}
                  description="Your voice interview is about to begin..."
                />
              ) : (
                <>
                  {messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        <Response>{message.content}</Response>
                      </MessageContent>
                      {message.role === "assistant" && (
                        <div className="ring-border size-10 overflow-hidden rounded-full ring-1 shrink-0">
                          <Orb className="h-full w-full" agentState={null} />
                        </div>
                      )}
                    </Message>
                  ))}
                  {interimText && (
                    <div className="px-4 py-2 text-sm text-muted-foreground italic">
                      &ldquo;{interimText}&rdquo;
                    </div>
                  )}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <div className="border-t border-border/50 p-6">
          <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
            {error && (
              <div className="w-full text-sm text-destructive text-center bg-destructive/10 rounded-lg p-3">
                {error}
              </div>
            )}

            {engineStatus === "error" && (
              <div className="w-full text-sm text-amber-500 text-center bg-amber-500/10 rounded-lg p-3">
                {error || "Something went wrong. Try refreshing the page."}
              </div>
            )}

            {engineStatus === "idle" ? (
              <Button
                onClick={beginInterview}
                size="lg"
                className="rounded-full px-12 py-8 gap-3"
              >
                <Mic className="h-6 w-6" />
                <span className="text-lg">Begin Interview</span>
              </Button>
            ) : engineStatus === "starting" ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Starting...</p>
              </div>
            ) : engineStatus === "greeting" ? (
              <div className="flex flex-col items-center gap-3">
                <Volume2 className="h-6 w-6 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">Interviewer is greeting you...</p>
              </div>
            ) : engineStatus === "ready_to_speak" ? (
              <Button
                onClick={requestMicAndListen}
                size="lg"
                className="rounded-full px-12 py-8 gap-3"
              >
                <Mic className="h-6 w-6" />
                <span className="text-lg">Start Speaking</span>
              </Button>
            ) : engineStatus === "waiting" ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
                  </span>
                  <span className="text-sm text-muted-foreground">Listening... speak now</span>
                </div>
                {interimText && (
                  <p className="text-sm text-muted-foreground italic max-w-md text-center">
                    &ldquo;{interimText}&rdquo;
                  </p>
                )}
              </div>
            ) : engineStatus === "thinking" ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing your response...</p>
              </div>
            ) : engineStatus === "responding" ? (
              <div className="flex flex-col items-center gap-3">
                <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">AI is speaking...</span>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={handleEndCall}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <PhoneOff className="h-4 w-4" />
              End Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Mic,
  Loader2,
  ArrowRight,
  Volume2,
  PhoneOff,
  Code2,
} from "lucide-react"
import Editor from "@monaco-editor/react"

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
  createVoiceSession,
  streamChatMessage,
  endSession,
  speakWithElevenLabs,
  type VoiceSession,
} from "@/lib/api"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

type EngineStatus = "idle" | "starting" | "greeting" | "ready_to_speak" | "waiting" | "thinking" | "responding" | "error"
type InterviewRound = "introduction" | "cs_fundamentals" | "system_design" | "coding"

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

function getCurrentRound(assistantMessageCount: number): InterviewRound {
  if (assistantMessageCount <= 1) return "introduction"
  if (assistantMessageCount <= 5) return "cs_fundamentals"
  if (assistantMessageCount <= 7) return "system_design"
  return "coding"
}

export default function InterviewPage() {
  const router = useRouter()
  const [step, setStep] = useState<"name" | "interview">("name")
  const [name, setName] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("idle")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interimText, setInterimText] = useState("")
  const [code, setCode] = useState("# Write your code here\n")
  const [language, setLanguage] = useState("python")

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef<VoiceSession | null>(null)
  const isActiveRef = useRef(false)
  const engineStatusRef = useRef<EngineStatus>("idle")
  const restartCountRef = useRef(0)

  const assistantMessageCount = useMemo(
    () => messages.filter((m) => m.role === "assistant").length,
    [messages]
  )

  const currentRound = useMemo(
    () => getCurrentRound(assistantMessageCount),
    [assistantMessageCount]
  )

  const showCodeEditor = currentRound === "coding"

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
          setStep("interview")
        }
      }
    },
    [step, nameInput]
  )

  const handleStartInterview = useCallback(
    async () => {
      if (!nameInput.trim()) return

      setName(nameInput.trim())
      setIsLoading(true)
      setError(null)

      try {
        const voiceSession = await createVoiceSession(nameInput.trim())
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
    []
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
                  onClick={handleStartInterview}
                  disabled={!nameInput.trim() || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Interview
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
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
          Press Enter to start
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Exit</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Round: {currentRound.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          {showCodeEditor && (
            <>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
              </select>
              <Code2 className="h-5 w-5 text-muted-foreground" />
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex flex-col ${showCodeEditor ? "flex-1 border-r border-border/50" : "flex-1"}`}>
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

        {showCodeEditor && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-[500px] flex flex-col bg-[#1e1e1e]"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
              <span className="text-sm text-gray-300 font-mono">solution.{language === "python" ? "py" : language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "java" ? "java" : "cpp"}</span>
              <span className="text-xs text-gray-500">{language}</span>
            </div>
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: true,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                fontLigatures: true,
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}

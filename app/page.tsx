"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "@phosphor-icons/react"
import { AnimatedCards } from "@/components/animated-cards"
import { Orb } from "@/components/ui/orb"
import { Waveform } from "@/components/ui/waveform"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { ScrubBarContainer, ScrubBarTrack, ScrubBarProgress, ScrubBarThumb } from "@/components/ui/scrub-bar"
import { BarVisualizer } from "@/components/ui/bar-visualizer"
import { ScrollRevealText } from "@/components/scroll-reveal-text"

const companyLogos = [
  { name: "ElevenLabs", src: "/elevenlabs.svg" },
  { name: "Next.js", src: "/nextjs.svg" },
  { name: "Cerebras", src: "/cerebras.svg" },
  { name: "DigitalOcean", src: "/digitalocean.svg" },
  { name: "Vercel", src: "/vercel.svg" },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState("typescript")

  const codeExamples = {
    typescript: [
      { line: '<span class="text-purple-400">import</span> { Peprin } <span class="text-purple-400">from</span> <span class="text-green-400">"@peprin/sdk"</span>' },
      { line: '<span class="text-purple-400">import</span> { VoiceSession } <span class="text-purple-400">from</span> <span class="text-green-400">"@peprin/voice"</span>' },
      { line: "" },
      { line: '<span class="text-purple-400">const</span> client = <span class="text-purple-400">new</span> <span class="text-blue-400">Peprin</span>({ apiKey: process.env.PEPRIN_API_KEY })' },
      { line: "  .<span class="text-blue-400">session</span>({" },
      { line: '    personality: <span class="text-green-400">"senior-engineer"</span>,' },
      { line: '    topic: <span class="text-green-400">"system-design"</span>,' },
      { line: '    difficulty: <span class="text-green-400">"intermediate"</span>,' },
      { line: "  })" },
      { line: "" },
      { line: '<span class="text-purple-400">const</span> session = <span class="text-purple-400">await</span> client.<span class="text-blue-400">start</span>()' },
      { line: 'session.<span class="text-blue-400">on</span>(<span class="text-green-400">"response"</span>, (answer) <span class="text-purple-400">=&gt;</span> {' },
      { line: "  console.<span class="text-blue-400">log</span>(answer.feedback)" },
      { line: "})" },
    ],
    cpp: [
      { line: '<span class="text-purple-400">#include</span> <span class="text-green-400">&lt;peprin/sdk.h&gt;</span>' },
      { line: '<span class="text-purple-400">#include</span> <span class="text-green-400">&lt;peprin/voice.h&gt;</span>' },
      { line: "" },
      { line: '<span class="text-purple-400">using namespace</span> peprin;' },
      { line: "" },
      { line: '<span class="text-purple-400">int</span> <span class="text-blue-400">main</span>() {' },
      { line: '  Peprin client(<span class="text-green-400">"your-api-key"</span>);' },
      { line: "  <span class="text-purple-400">auto</span> session = client.<span class="text-blue-400">session</span>({" },
      { line: '    .personality = <span class="text-green-400">"senior-engineer"</span>,' },
      { line: '    .topic = <span class="text-green-400">"system-design"</span>,' },
      { line: '    .difficulty = <span class="text-green-400">"intermediate"</span>' },
      { line: "  }).<span class="text-blue-400">start</span>();" },
      { line: "" },
      { line: "  session.<span class="text-blue-400">on_response</span>([](<span class="text-purple-400">const</span> Answer& answer) {" },
      { line: "    std::cout <span class="text-purple-400">&lt;&lt;</span> answer.feedback;" },
      { line: "  });" },
      { line: "}" },
    ],
    java: [
      { line: '<span class="text-purple-400">import</span> com.peprin.sdk.Peprin;' },
      { line: '<span class="text-purple-400">import</span> com.peprin.voice.VoiceSession;' },
      { line: "" },
      { line: '<span class="text-purple-400">public class</span> <span class="text-blue-400">Interview</span> {' },
      { line: '  <span class="text-purple-400">public static void</span> <span class="text-blue-400">main</span>(String[] args) {' },
      { line: '    Peprin client = <span class="text-purple-400">new</span> Peprin(' },
      { line: '      System.<span class="text-blue-400">getenv</span>(<span class="text-green-400">"PEPRIN_API_KEY"</span>)' },
      { line: "    );" },
      { line: "" },
      { line: "    VoiceSession session = client.<span class="text-blue-400">session</span>()" },
      { line: '      .<span class="text-blue-400">personality</span>(<span class="text-green-400">"senior-engineer"</span>)' },
      { line: '      .<span class="text-blue-400">topic</span>(<span class="text-green-400">"system-design"</span>)' },
      { line: '      .<span class="text-blue-400">difficulty</span>(<span class="text-green-400">"intermediate"</span>)' },
      { line: "      .<span class="text-blue-400">start</span>();" },
      { line: "" },
      { line: "    session.<span class="text-blue-400">onResponse</span>(answer <span class="text-purple-400">-&gt;</span>" },
      { line: "      System.out.<span class="text-blue-400">println</span>(answer.getFeedback())" },
      { line: "    );" },
      { line: "  }" },
      { line: "}" },
    ],
    python: [
      { line: '<span class="text-purple-400">from</span> peprin <span class="text-purple-400">import</span> Peprin' },
      { line: '<span class="text-purple-400">from</span> peprin.voice <span class="text-purple-400">import</span> VoiceSession' },
      { line: "" },
      { line: 'client = Peplin(api_key=<span class="text-green-400">os.environ</span>[<span class="text-green-400">"PEPRIN_API_KEY"</span>])' },
      { line: "" },
      { line: "session = client.<span class="text-blue-400">session</span>(" },
      { line: '  personality=<span class="text-green-400">"senior-engineer"</span>,' },
      { line: '  topic=<span class="text-green-400">"system-design"</span>,' },
      { line: '  difficulty=<span class="text-green-400">"intermediate"</span>' },
      { line: ").<span class="text-blue-400">start</span>()" },
      { line: "" },
      { line: '<span class="text-purple-400">def</span> <span class="text-blue-400">on_response</span>(answer):' },
      { line: "  <span class="text-blue-400">print</span>(answer.feedback)" },
      { line: "" },
      { line: "session.<span class="text-blue-400">on</span>(<span class="text-green-400">"response"</span>, on_response)" },
    ],
  }

  const tabs = [
    { id: "typescript", label: "TypeScript" },
    { id: "cpp", label: "C++" },
    { id: "java", label: "Java" },
    { id: "python", label: "Python" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-0">
            <span className="text-lg font-medium">pepr</span>
            <span className="text-lg font-medium text-primary">i</span>
            <span className="text-lg font-medium">n</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/interview">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-medium tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Ace Your
          <br />
          Next Interview
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          AI-powered interview simulation for developers. Practice with realistic AI interviewers, get instant feedback, and land your dream job.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/interview">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
              Start Practicing
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="secondary" className="px-6">
            How It Works
          </Button>
        </div>

        {/* Matrix Animations */}
        <div className="mt-20">
          <AnimatedCards />
        </div>

        {/* Company Logos */}
        <div className="mt-16">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {companyLogos.map((company) => (
              <img key={company.name} src={company.src} alt={company.name} className="h-8 w-auto text-white" />
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
              See it in
              <br />
              action
            </h2>
          </div>
          <p className="text-lg text-muted-foreground lg:text-xl">
            Real-time voice conversations with AI interviewers that adapt to your responses. Experience interviews that feel just like the real thing.
          </p>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted/50">
            {/* Replace this div with your video element */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Product demo video goes here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16">
          <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">
            Everything you need to
            <br />
            interview with confidence.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* AI Interviewers */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="text-lg font-medium mb-2">AI Interviewers</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Choose from multiple interviewer personalities. Each has a unique style, tone, and questioning approach.
            </p>
            <div className="flex items-center justify-center h-32">
              <Orb />
            </div>
          </div>

          {/* Voice Conversations */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="text-lg font-medium mb-2">Voice Conversations</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Speak naturally and get real-time responses. No typing needed, just like a real interview.
            </p>
            <div className="flex items-center justify-center h-32">
              <Waveform />
            </div>
          </div>

          {/* Technical Questions */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="text-lg font-medium mb-2">Technical Questions</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Coding challenges, system design, algorithms, and behavioral questions tailored to your level.
            </p>
            <div className="flex items-center justify-center h-32">
              <Orb />
            </div>
          </div>

          {/* Instant Feedback */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="text-lg font-medium mb-2">Instant Feedback</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Get detailed feedback on your answers, communication skills, and areas for improvement after each session.
            </p>
            <div className="flex items-center justify-center h-32">
              <ShimmeringText text="Feedback" />
            </div>
          </div>

          {/* Multiple Rounds */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="text-lg font-medium mb-2">Multiple Rounds</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Practice screening calls, technical rounds, system design, and behavioral interviews in sequence.
            </p>
            <div className="flex items-center justify-center h-32 w-full px-4">
              <ScrubBarContainer duration={100} value={45}>
                <ScrubBarTrack>
                  <ScrubBarProgress />
                  <ScrubBarThumb />
                </ScrubBarTrack>
              </ScrubBarContainer>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Track your progress over time. See how your confidence and accuracy improve with each practice session.
            </p>
            <div className="flex items-center justify-center h-32">
              <BarVisualizer />
            </div>
          </div>
        </div>
      </section>

      {/* Built for AI Section */}
      <section className="mx-auto max-w-6xl px-6 py-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-medium tracking-tight leading-tight">
              Interviews that feel
              <br />
              completely real.
            </h2>
            <div className="mt-6 w-8 h-px bg-border/50" />
            <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
              Powered by advanced AI with unique interviewer personalities, real-time voice conversations, and adaptive questioning that responds to your answers just like a human would.
            </p>
          </div>

          {/* Right Code Window */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm transition-colors ${
                    activeTab === tab.id
                      ? "font-medium border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">Start an interview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose your interviewer, pick a topic, and start speaking. Peprin handles the rest with real-time voice AI.
              </p>
              <Button size="sm" variant="secondary" className="mb-6">
                Try it now
              </Button>

              {/* Code Block */}
              <div className="rounded-lg bg-muted/30 border border-border/30 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                {codeExamples[activeTab as keyof typeof codeExamples].map((line, i) => (
                  <div key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: line.line || "&nbsp;" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Reveal Text Section */}
      <section className="mx-auto max-w-5xl px-6 py-32">
        <div className="flex gap-10">
          <div className="hidden sm:block w-px bg-border/30 self-stretch mt-2" />
          <div className="space-y-2">
            <ScrollRevealText text="Realistic AI interviewers. Voice-powered" className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight" />
            <ScrollRevealText text="conversations. Instant feedback on your" className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight" />
            <ScrollRevealText text="answers and communication skills." className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight" />
            <ScrollRevealText text="Peprin is the practice platform for a new" className="text-lg sm:text-xl mt-8 leading-relaxed" paragraph />
            <ScrollRevealText text="generation of developers." className="text-lg sm:text-xl leading-relaxed" paragraph />
          </div>
        </div>
      </section>
    </div>
  )
}

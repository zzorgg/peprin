"use client"

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
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Company</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</button>
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
              <button className="px-4 py-2.5 text-sm font-medium bg-card border-b-2 border-primary text-foreground">interview.ts</button>
              <button className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">feedback.ts</button>
              <button className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">analytics.ts</button>
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
                <div className="text-muted-foreground">
                  <span className="text-purple-400">import</span> {"{ Peprin }"} <span className="text-purple-400">from</span> <span className="text-green-400">@peprin/sdk</span>
                </div>
                <div className="text-muted-foreground">
                  <span className="text-purple-400">import</span> {"{ VoiceSession }"} <span className="text-purple-400">from</span> <span className="text-green-400">@peprin/voice</span>
                </div>
                <div className="mt-3 text-muted-foreground">
                  <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-blue-400">Peprin</span>({"{ apiKey: process.env.PEPRIN_API_KEY }"})
                </div>
                <div className="text-muted-foreground ml-4">
                  .<span className="text-blue-400">session</span>({"{"}
                </div>
                <div className="text-muted-foreground ml-8">
                  personality: <span className="text-green-400">"senior-engineer"</span>,
                </div>
                <div className="text-muted-foreground ml-8">
                  topic: <span className="text-green-400">"system-design"</span>,
                </div>
                <div className="text-muted-foreground ml-8">
                  difficulty: <span className="text-green-400">"intermediate"</span>,
                </div>
                <div className="text-muted-foreground ml-4">
                  {"})"}</div>
                <div className="mt-3 text-muted-foreground">
                  <span className="text-purple-400">const</span> session = <span className="text-purple-400">await</span> client.<span className="text-blue-400">start</span>()
                </div>
                <div className="text-muted-foreground ml-4">
                  session.<span className="text-blue-400">on</span>(<span className="text-green-400">"response"</span>, (answer) {"=>"} {"{"}
                </div>
                <div className="text-muted-foreground ml-8">
                  console.<span className="text-blue-400">log</span>(answer.feedback)
                </div>
                <div className="text-muted-foreground ml-4">
                  {"})"}</div>
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

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
            {/* Logo Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-0">
                <span className="text-lg font-medium">pepr</span>
                <span className="text-lg font-medium text-primary">i</span>
                <span className="text-lg font-medium">n</span>
              </div>
            </div>

            {/* Peprin Column */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Peprin</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">home</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">interviews</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">pricing</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">changelog</a></li>
              </ul>
            </div>

            {/* Tools Column */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Features</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Voice Interviews</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Personalities</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Technical Questions</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Instant Feedback</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Performance Analytics</a></li>
              </ul>
            </div>

            {/* Community Column */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Community</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">twitter</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">discord</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">slack</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">reddit</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">youtube</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">docs</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">roadmap</a></li>
              </ul>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 mt-8">Compare</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Peprin vs Pramp</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Peprin vs Interviewing.io</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">privacy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">terms</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">dpa</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">subprocessors</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">© 2026</span>
              <a href="mailto:hello@peprin.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">hello@peprin.com</a>
            </div>
            <span className="text-6xl sm:text-8xl font-bold text-foreground/5 tracking-tight select-none">Peprin</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

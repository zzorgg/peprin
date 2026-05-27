"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  MessageSquare,
  Target,
  Zap,
  Brain,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { generateEvaluation, getEvaluation, type EvaluationResult } from "@/lib/api"

function getRecommendation(score: number): { label: string; color: string; description: string } {
  if (score >= 80) return { label: "Strong Hire", color: "text-green-500", description: "Exceptional performance across all rounds" }
  if (score >= 65) return { label: "Hire", color: "text-emerald-500", description: "Solid performance with minor gaps" }
  if (score >= 45) return { label: "Lean No Hire", color: "text-amber-500", description: "Some strengths but notable weaknesses" }
  return { label: "No Hire", color: "text-red-500", description: "Significant gaps in core competencies" }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500"
  if (score >= 65) return "text-emerald-500"
  if (score >= 45) return "text-amber-500"
  return "text-red-500"
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadEvaluation = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID provided")
      setIsLoading(false)
      return
    }

    try {
      const result = await getEvaluation(sessionId)
      setEvaluation(result)
      setIsLoading(false)
    } catch {
      setIsGenerating(true)
      try {
        const result = await generateEvaluation(sessionId)
        setEvaluation(result)
        setIsGenerating(false)
        setIsLoading(false)
      } catch {
        setError("Failed to generate evaluation")
        setIsGenerating(false)
        setIsLoading(false)
      }
    }
  }, [sessionId])

  useEffect(() => {
    loadEvaluation()
  }, [loadEvaluation])

  if (isLoading || isGenerating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-medium mb-2">
            {isGenerating ? "Generating your evaluation..." : "Loading results..."}
          </h2>
          <p className="text-muted-foreground">
            {isGenerating ? "Analyzing your interview performance" : "Please wait"}
          </p>
        </motion.div>
      </div>
    )
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-medium mb-2">Unable to load results</h2>
          <p className="text-muted-foreground mb-8">{error || "Something went wrong"}</p>
          <Button onClick={() => router.push("/")} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  const recommendation = getRecommendation(evaluation.hire_probability)
  const scoreBreakdown = evaluation.score_breakdown

  const metrics = [
    { label: "Confidence", value: scoreBreakdown.confidence, icon: Zap },
    { label: "Response Quality", value: scoreBreakdown.response_quality, icon: MessageSquare },
    { label: "Hesitation Control", value: scoreBreakdown.hesitation_frequency, icon: Target },
    { label: "Communication Clarity", value: scoreBreakdown.communication_clarity, icon: Brain },
    { label: "Technical Accuracy", value: scoreBreakdown.technical_accuracy, icon: Award },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-medium tracking-tight mb-2">Interview Results</h1>
          <p className="text-muted-foreground">
            {evaluation.exchange_count} exchanges over {formatDuration(evaluation.total_duration_seconds)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-card border border-border/50 rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col items-center">
            <div className={`text-7xl font-bold mb-4 ${getScoreColor(evaluation.hire_probability)}`}>
              {Math.round(evaluation.hire_probability)}
            </div>
            <div className={`text-2xl font-medium mb-2 ${recommendation.color}`}>
              {recommendation.label}
            </div>
            <p className="text-muted-foreground text-center">{recommendation.description}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-card border border-border/50 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-xl font-medium mb-6">Score Breakdown</h2>
          <div className="space-y-5">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColor(metric.value)}`}>
                    {Math.round(metric.value)}%
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid gap-6 md:grid-cols-2 mb-8"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-medium">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1">+</span>
                  {strength}
                </li>
              ))}
              {evaluation.strengths.length === 0 && (
                <li className="text-sm text-muted-foreground">No specific strengths identified</li>
              )}
            </ul>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {evaluation.areas_for_improvement.map((area, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-1">~</span>
                  {area}
                </li>
              ))}
              {evaluation.areas_for_improvement.length === 0 && (
                <li className="text-sm text-muted-foreground">No specific areas identified</li>
              )}
            </ul>
          </div>
        </motion.div>

        {evaluation.weaknesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="bg-card border border-border/50 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-medium">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {evaluation.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-500 mt-1">-</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-medium mb-4">Communication Analysis</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {evaluation.communication_analysis}
          </p>
        </motion.div>

        {evaluation.behavioral_observations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="bg-card border border-border/50 rounded-2xl p-6 mb-8"
          >
            <h3 className="text-lg font-medium mb-4">Behavioral Observations</h3>
            <div className="space-y-4">
              {evaluation.behavioral_observations.map((obs, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground shrink-0 mt-0.5">
                    {obs.category}
                  </span>
                  <p className="text-sm text-muted-foreground">{obs.observation}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-medium mb-4">Overall Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {evaluation.overall_summary}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-4"
        >
          <Button onClick={() => router.push("/")} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/interview")}
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}

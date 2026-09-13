import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Zap } from 'lucide-react'
import api from '@/lib/api'

interface Limits {
  postsToday: number
  postsLimit: number
  aiCallsToday: number
  aiCallsLimit: number
}

export function QuotaTracker() {
  const [limits, setLimits] = useState<Limits | null>(null)

  useEffect(() => {
    api.get('/user/limits').then((res) => setLimits(res.data)).catch(() => {})
  }, [])

  if (!limits) return null

  const postPct = Math.min(100, Math.round((limits.postsToday / limits.postsLimit) * 100))
  const aiPct = Math.min(100, Math.round((limits.aiCallsToday / limits.aiCallsLimit) * 100))

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Daily Quota</span>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Posts</span>
            <span className="text-muted-foreground">{limits.postsToday}/{limits.postsLimit}</span>
          </div>
          <Progress value={postPct} className="h-1.5" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>AI Calls</span>
            <span className="text-muted-foreground">{limits.aiCallsToday}/{limits.aiCallsLimit}</span>
          </div>
          <Progress value={aiPct} className="h-1.5" />
        </div>
      </div>
    </div>
  )
}

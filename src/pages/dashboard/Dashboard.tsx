import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Send,
  Clock,
  TrendingUp,
  PenLine,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ArrowUpRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  scheduledPosts: number
  queuedPosts: number
}

interface Post {
  _id: string
  content: string
  status: string
  platforms: string[]
  postType?: string
  createdAt: string
  scheduledFor?: string
  publishedAt?: string
  lastError?: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline'; icon: React.ElementType; tone: string }> = {
  published: { label: 'Published', variant: 'success', icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  scheduled: { label: 'Scheduled', variant: 'warning', icon: Clock, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  queued: { label: 'Queued', variant: 'outline', icon: AlertCircle, tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  approved: { label: 'Approved', variant: 'outline', icon: CheckCircle, tone: 'text-sky-700 bg-sky-50 border-sky-200' },
  pending: { label: 'Pending', variant: 'warning', icon: Clock, tone: 'text-orange-700 bg-orange-50 border-orange-200' },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle, tone: 'text-rose-700 bg-rose-50 border-rose-200' },
  draft: { label: 'Draft', variant: 'secondary' as any, icon: FileText, tone: 'text-slate-600 bg-slate-50 border-slate-200' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)

  const fetchData = async () => {
    try {
      const [analyticsRes, postsRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/posts?limit=100'),
      ])
      const a = analyticsRes.data
      setStats({
        totalPosts: a.totals?.totalPosts ?? 0,
        publishedPosts: a.totals?.published ?? 0,
        scheduledPosts: a.totals?.scheduled ?? 0,
        queuedPosts: a.totals?.queued ?? 0,
      })
      const regularPosts: Post[] = Array.isArray(postsRes.data?.posts) ? postsRes.data.posts : []
      const scheduledPosts: Post[] = Array.isArray(postsRes.data?.scheduledPosts) ? postsRes.data.scheduledPosts : []
      const merged = new Map<string, Post>()
        ;[...regularPosts, ...scheduledPosts].forEach((post) => merged.set(post._id, post))
      setPosts(Array.from(merged.values()).sort((a, b) => {
        const dateFor = (post: Post) => post.publishedAt || post.scheduledFor || post.createdAt
        return new Date(dateFor(b)).getTime() - new Date(dateFor(a)).getTime()
      }).slice(0, 5))
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const triggerAI = async () => {
    setTriggering(true)
    try {
      await api.post('/ai/batch')
      toast.success('AI content generation triggered!')
      setTimeout(fetchData, 2000)
    } catch {
      toast.error('Failed to trigger AI generation')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_34%),linear-gradient(180deg,_#f8fbff_0%,_hsl(var(--background))_38%)] p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Your command center</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-3 max-w-xl text-slate-600">Here's what's happening with your social media.</p>
        </div>
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[24px] border-blue-100/80" />
        <div className="absolute bottom-5 right-8 hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Workspace ready</div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Posts', value: stats?.totalPosts, icon: FileText, color: 'text-blue-500' },
          { label: 'Published', value: stats?.publishedPosts, icon: Send, color: 'text-green-500' },
          { label: 'Scheduled', value: stats?.scheduledPosts, icon: Clock, color: 'text-yellow-500' },
          { label: 'Queued', value: stats?.queuedPosts, icon: TrendingUp, color: 'text-purple-500' },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</CardTitle>
              <div className={`rounded-lg bg-slate-50 p-2 ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold tracking-tight text-slate-950">{stat.value ?? 0}</div>
              )}
            </CardContent>
            <div className={`h-1 ${stat.color.replace('text-', 'bg-')}`} />
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold text-slate-900">Move your next idea forward</p><p className="text-sm text-muted-foreground">Create something new or let your AI workflow take the first pass.</p></div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="shadow-sm">
            <Link to="/dashboard/composer">
              <PenLine className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
          <Button variant="outline" onClick={triggerAI} disabled={triggering}>
            {triggering
              ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              : <Zap className="mr-2 h-4 w-4" />
            }
            {triggering ? 'Generating...' : 'Trigger AI Batch'}
          </Button>
        </div>
      </div>

      {/* Recent posts */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-end justify-between border-b bg-slate-50/70">
          <div><CardTitle className="text-xl">Recent Posts</CardTitle><CardDescription className="mt-1">Your five latest posts across every platform and status</CardDescription></div>
          <Link to="/dashboard/queue" className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex">View queue <ArrowUpRight className="h-4 w-4" /></Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No posts yet.</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/dashboard/composer">Create your first post</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {posts.map((post) => {
                const cfg = statusConfig[post.status] || statusConfig.draft
                const Icon = cfg.icon
                return (
                  <div key={post._id} className="flex items-start gap-3 py-4 first:pt-1 last:pb-1">
                    <div className={`mt-0.5 rounded-lg border p-2 ${cfg.tone}`}><Icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-medium leading-6 text-slate-800">{post.content}</p><span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.publishedAt || post.scheduledFor || post.createdAt), { addSuffix: true })}</span></div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={cfg.variant as any} className={`text-xs ${cfg.tone}`}>{cfg.label}</Badge>
                        {post.postType ? <Badge variant="outline" className="text-xs capitalize">{post.postType}</Badge> : null}
                        {post.platforms?.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>
                        ))}
                      </div>
                      {post.lastError ? <p className="mt-2 rounded-md border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">Issue: {post.lastError}</p> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

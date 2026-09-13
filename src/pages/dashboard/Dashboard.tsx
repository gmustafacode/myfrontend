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
  createdAt: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  published: { label: 'Published', variant: 'success', icon: CheckCircle },
  scheduled: { label: 'Scheduled', variant: 'warning', icon: Clock },
  queued: { label: 'Queued', variant: 'outline', icon: AlertCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  draft: { label: 'Draft', variant: 'secondary' as any, icon: FileText },
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
        api.get('/posts?limit=5'),
      ])
      const a = analyticsRes.data
      setStats({
        totalPosts: a.totals?.totalPosts ?? 0,
        publishedPosts: a.totals?.published ?? 0,
        scheduledPosts: a.totals?.scheduled ?? 0,
        queuedPosts: a.totals?.queued ?? 0,
      })
      setPosts(postsRes.data.posts || postsRes.data || [])
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Here's what's happening with your social media.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Posts', value: stats?.totalPosts, icon: FileText, color: 'text-blue-500' },
          { label: 'Published', value: stats?.publishedPosts, icon: Send, color: 'text-green-500' },
          { label: 'Scheduled', value: stats?.scheduledPosts, icon: Clock, color: 'text-yellow-500' },
          { label: 'Queued', value: stats?.queuedPosts, icon: TrendingUp, color: 'text-purple-500' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
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

      {/* Recent posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest content across all platforms</CardDescription>
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
            <div className="space-y-3">
              {posts.map((post) => {
                const cfg = statusConfig[post.status] || statusConfig.draft
                const Icon = cfg.icon
                return (
                  <div key={post._id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={cfg.variant as any} className="text-xs">{cfg.label}</Badge>
                        {post.platforms?.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>
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

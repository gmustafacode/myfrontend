import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Send,
  FileText,
  Trash2,
  ExternalLink,
  Linkedin,
  Facebook,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  FileUp,
  Sparkles,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface Post {
  _id: string
  content: string
  status: string
  platforms: string[]
  platform?: string
  postType?: string
  mediaUrls?: string[]
  platformPostId?: string
  title?: string
  linkUrl?: string
  createdAt: string
  scheduledFor?: string
  publishedAt?: string
  lastError?: string
}

const statusConfig: Record<string, { label: string; color: string; badgeClass: string; icon: React.ElementType }> = {
  published: { label: 'Published', color: 'text-green-600', badgeClass: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  scheduled: { label: 'Scheduled', color: 'text-yellow-600', badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  queued: { label: 'Queued', color: 'text-purple-600', badgeClass: 'bg-purple-100 text-purple-700 border-purple-200', icon: AlertCircle },
  failed: { label: 'Failed', color: 'text-red-600', badgeClass: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  draft: { label: 'Draft', color: 'text-gray-500', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  approved: { label: 'Approved', color: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
}

const formatConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  text: { label: 'Text', icon: FileText, color: 'text-gray-600' },
  image: { label: 'Image', icon: ImageIcon, color: 'text-blue-600' },
  article: { label: 'Article/Link', icon: LinkIcon, color: 'text-emerald-600' },
  document: { label: 'Document/PDF', icon: FileUp, color: 'text-purple-600' },
  video: { label: 'Video', icon: Video, color: 'text-pink-600' },
}

export default function Queue() {
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [postsRes, queueRes] = await Promise.all([
        api.get('/posts?limit=100'),
        api.get('/posts/queue'),
      ])

      const regularPosts: Post[] = Array.isArray(postsRes.data?.posts) ? postsRes.data.posts : []
      const scheduledPosts: Post[] = Array.isArray(postsRes.data?.scheduledPosts) ? postsRes.data.scheduledPosts : []
      const queuePosts: Post[] = Array.isArray(queueRes.data) ? queueRes.data : []

      // Combine and deduplicate by _id
      const map = new Map<string, Post>()
      regularPosts.forEach((p: Post) => map.set(p._id, p))
      scheduledPosts.forEach((p: Post) => {
        if (!map.has(p._id)) {
          map.set(p._id, { ...p, status: p.status || 'scheduled' })
        }
      })
      queuePosts.forEach((p: Post) => {
        if (!map.has(p._id)) map.set(p._id, p)
      })

      setAllPosts(Array.from(map.values()))
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ─── Instant Publish ──────────────────────────────────────────────────
  const publishNow = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await api.post(`/posts/${id}/publish`)
      toast.success(res.data?.message || 'Published live successfully!', {
        description: res.data?.postId ? `Platform ID: ${res.data.postId}` : 'Post is now live',
        duration: 6000
      })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish post')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Retry Failed/Scheduled Post ──────────────────────────────────────
  const retryPost = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await api.post(`/posts/${id}/retry`)
      toast.success(res.data?.message || 'Post queued for retry')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry post')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Approve in Queue ──────────────────────────────────────────────────
  const approve = async (id: string) => {
    setActionLoading(id)
    try {
      await api.put(`/posts/queue/${id}/approve`)
      toast.success('Post approved')
      fetchData()
    } catch {
      toast.error('Failed to approve post')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Reject in Queue ───────────────────────────────────────────────────
  const reject = async (id: string) => {
    setActionLoading(id)
    try {
      await api.put(`/posts/queue/${id}/reject`)
      toast.success('Post rejected')
      fetchData()
    } catch {
      toast.error('Failed to reject post')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Delete Post ──────────────────────────────────────────────────────
  const deletePost = async (id: string) => {
    setActionLoading(id)
    try {
      await api.delete(`/posts/${id}`)
      toast.success('Post deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Filter posts ─────────────────────────────────────────────────────
  const filteredPosts = allPosts.filter((post) => {
    // Status tab filter
    if (activeTab === 'published' && post.status !== 'published') return false
    if (activeTab === 'queue' && post.status !== 'queued' && post.status !== 'pending' && post.status !== 'approved') return false
    if (activeTab === 'scheduled' && post.status !== 'scheduled') return false

    // Format filter
    if (formatFilter !== 'all') {
      const pType = (post.postType || 'text').toLowerCase()
      if (pType !== formatFilter) return false
    }

    return true
  })

  const publishedCount = allPosts.filter((p) => p.status === 'published').length
  const queueCount = allPosts.filter((p) => p.status === 'queued' || p.status === 'pending' || p.status === 'approved').length
  const scheduledCount = allPosts.filter((p) => p.status === 'scheduled').length

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Post Management</h1>
          <p className="text-muted-foreground">Manage and track all types of posts across LinkedIn and connected platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn('h-4 w-4', loading ? 'animate-spin' : '')} />
            Refresh
          </Button>
          <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Link to="/dashboard/composer">
              <Sparkles className="h-4 w-4" />
              Create Post
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Tabs & Filter Pills ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex">
            <TabsTrigger value="all">All Posts ({allPosts.length})</TabsTrigger>
            <TabsTrigger value="published" className="gap-1.5 flex items-center">
              <Send className="h-3.5 w-3.5" />
              Published ({publishedCount})
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1.5 flex items-center">
              <AlertCircle className="h-3.5 w-3.5" />
              Queue ({queueCount})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-1.5 flex items-center">
              <Clock className="h-3.5 w-3.5" />
              Scheduled ({scheduledCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Format Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground font-medium mr-1">Format:</span>
          {['all', 'text', 'image', 'article', 'document'].map((fmt) => {
            const active = formatFilter === fmt
            const cfg = formatConfig[fmt]
            return (
              <Button
                key={fmt}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormatFilter(fmt)}
                className={cn('h-7 text-xs px-2.5 rounded-full capitalize', active ? 'bg-primary text-primary-foreground' : '')}
              >
                {cfg?.icon && <cfg.icon className="h-3 w-3 mr-1" />}
                {fmt === 'all' ? 'All Formats' : cfg?.label || fmt}
              </Button>
            )
          })}
        </div>
      </div>

      {/* ── Posts List ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No posts found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {formatFilter !== 'all'
                ? `No ${formatFilter} posts match this view.`
                : 'Create your first post using the Content Composer.'}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/composer">Go to Composer</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const status = statusConfig[post.status] || statusConfig.draft
            const StatusIcon = status.icon
            const pType = (post.postType || 'text').toLowerCase()
            const fmt = formatConfig[pType] || formatConfig.text
            const FmtIcon = fmt.icon
            const isQueuedOrDraft = post.status === 'queued' || post.status === 'pending' || post.status === 'approved' || post.status === 'draft'

            return (
              <Card key={post._id} className="transition-shadow hover:shadow-sm">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Post Format Badge */}
                      <Badge variant="outline" className="gap-1 text-xs font-medium bg-muted/50">
                        <FmtIcon className={cn('h-3.5 w-3.5', fmt.color)} />
                        {fmt.label}
                      </Badge>

                      {/* Status Badge */}
                      <Badge className={cn('gap-1 text-xs font-medium', status.badgeClass)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>

                      {/* Platforms */}
                      <div className="flex items-center gap-1.5 text-xs">
                        {(post.platforms?.includes('facebook') || post.platform === 'facebook') && (
                          <span className="flex items-center gap-1 font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            <Facebook className="h-3 w-3" />
                            <span>Facebook</span>
                          </span>
                        )}
                        {(post.platforms?.includes('linkedin') || post.platform === 'linkedin' || (!post.platforms?.includes('facebook') && post.platform !== 'facebook')) && (
                          <span className="flex items-center gap-1 font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                            <Linkedin className="h-3 w-3" />
                            <span>LinkedIn</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {post.publishedAt
                        ? `Published ${formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}`
                        : post.scheduledFor
                          ? `Scheduled for ${new Date(post.scheduledFor).toLocaleDateString()} at ${new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : `Created ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`}
                    </span>
                  </div>

                  {/* Commentary / Content */}
                  <p className="text-sm whitespace-pre-line text-foreground/90 font-normal line-clamp-4">
                    {post.content}
                  </p>

                  {/* Attached Video Player Preview */}
                  {pType.includes('video') && post.mediaUrls?.[0] && (
                    <div className="rounded-lg overflow-hidden border max-w-md bg-black mt-2">
                      <video
                        src={post.mediaUrls[0]}
                        controls
                        className="w-full max-h-56 rounded-md object-contain"
                      />
                    </div>
                  )}

                  {/* Attached Image Preview */}
                  {pType.includes('image') && !pType.includes('video') && post.mediaUrls?.[0] && (
                    <div className="rounded-lg overflow-hidden border max-w-xs max-h-40 mt-2 bg-muted/20">
                      <img
                        src={post.mediaUrls[0]}
                        alt="Attached media"
                        className="w-full h-full object-cover max-h-40"
                      />
                    </div>
                  )}

                  {/* Rich Media / Link Preview if applicable */}
                  {post.linkUrl && (
                    <div className="rounded-md border bg-muted/30 p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="truncate">
                        <p className="font-medium text-foreground truncate">{post.title || post.linkUrl}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{post.linkUrl}</p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="h-7 shrink-0 text-blue-600">
                        <a href={post.linkUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Error banner if previous run failed */}
                  {post.lastError && (
                    <div className="p-2.5 rounded-md bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span className="truncate">{post.lastError}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryPost(post._id)}
                        disabled={actionLoading === post._id}
                        className="h-6 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-100 shrink-0"
                      >
                        {actionLoading === post._id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                        Retry
                      </Button>
                    </div>
                  )}

                  {/* Platform Post URN & Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <div className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                      {post.platformPostId && (
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                          {post.platformPostId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* View button for published posts */}
                      {post.status === 'published' && post.platformPostId && (
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50">
                          <a
                            href={
                              post.platforms?.includes('facebook') || post.platform === 'facebook'
                                ? `https://facebook.com/${post.platformPostId}`
                                : `https://www.linkedin.com/feed/update/${post.platformPostId}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {post.platforms?.includes('facebook') || post.platform === 'facebook' ? 'View on Facebook' : 'View on LinkedIn'}
                          </a>
                        </Button>
                      )}

                      {/* Instant Publish for Queued/Pending/Draft/Scheduled posts */}
                      {(isQueuedOrDraft || post.status === 'scheduled') && (
                        <Button
                          size="sm"
                          onClick={() => publishNow(post._id)}
                          disabled={actionLoading === post._id}
                          className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                          {actionLoading === post._id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Publish Now
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePost(post._id)}
                        disabled={actionLoading === post._id}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

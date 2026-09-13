import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Send,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
  Sparkles,
  Linkedin,
  Facebook,
  BarChart3,
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Share2,
  ExternalLink,
  Users,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Comparison {
  current: number
  prior: number
  pctChange: number
}

interface Totals {
  totalPosts: number
  published: number
  scheduled: number
  queued: number
  comparisons?: {
    totalPosts?: Comparison
    published?: Comparison
  }
  formatBreakdown?: Record<string, number>
}

interface ChartPoint {
  date: string
  posts: number
  published: number
}

interface FacebookPost {
  id: string
  message: string
  createdTime: string
  permalinkUrl: string
  imageUrl?: string | null
  type: string
  title?: string | null
  reactions: number
  comments: number
  shares: number
  engagement: number
}

interface FacebookData {
  connected: boolean
  hasPages?: boolean
  pageName?: string | null
  pageInfo?: {
    id: string
    name: string
    category?: string
    followersCount?: number
    picture?: string | null
  }
  summary?: {
    totalPublishedPosts: number
    totalReactions: number
    totalComments: number
    totalShares: number
    totalEngagement: number
    followers: number
  }
  posts?: FacebookPost[]
  message?: string
  metrics: any[]
}

type Period = 'today' | '7d' | '30d' | '90d'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
}

const FORMAT_COLORS: Record<string, string> = {
  text: '#3b82f6',
  image: '#8b5cf6',
  article: '#f59e0b',
  document: '#10b981',
  video: '#ef4444',
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('30d')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('overview')

  // Facebook
  const [fbData, setFbData] = useState<FacebookData | null>(null)
  const [fbLoading, setFbLoading] = useState(false)

  // AI Insights
  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)

  // PDF
  const [exporting, setExporting] = useState(false)

  const fetchOverview = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const res = await api.get(`/analytics/overview?period=${p}`)
      setTotals(res.data.totals)
      setChartData(res.data.chartData || [])
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFacebook = useCallback(async () => {
    setFbLoading(true)
    try {
      const res = await api.get('/analytics/facebook')
      setFbData(res.data)
    } catch {
      setFbData({ connected: false, metrics: [] })
    } finally {
      setFbLoading(false)
    }
  }, [])

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      const res = await api.get('/analytics/insights')
      setInsights(res.data.insights || [])
    } catch {
      toast.error('Failed to load AI insights')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview(period)
  }, [period, fetchOverview])

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'facebook' && !fbData) fetchFacebook()
    if (tab === 'insights' && insights.length === 0) fetchInsights()
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const res = await api.get(`/analytics/export/pdf?period=${period}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `socialsync-analytics-${period}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Analytics report downloaded')
    } catch {
      toast.error('Failed to export PDF report')
    } finally {
      setExporting(false)
    }
  }

  const renderChangeIndicator = (comp?: Comparison) => {
    if (!comp) return null
    const { pctChange } = comp
    const isPositive = pctChange > 0
    const isZero = pctChange === 0

    if (isZero) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">No change</Badge>

    return (
      <Badge
        variant="secondary"
        className={cn(
          'text-[10px] px-1.5 py-0 gap-0.5',
          isPositive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        )}
      >
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {isPositive ? '+' : ''}{pctChange}%
      </Badge>
    )
  }

  const formatBreakdownData = () => {
    if (!totals?.formatBreakdown) return []
    return Object.entries(totals.formatBreakdown)
      .filter(([, count]) => count > 0)
      .map(([format, count]) => ({
        name: format.charAt(0).toUpperCase() + format.slice(1),
        value: count,
        fill: FORMAT_COLORS[format] || '#94a3b8',
      }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Track your content performance and growth metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportPDF}
            disabled={exporting}
            className="gap-1.5 text-xs"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1.5">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange(p)}
            className={cn('text-xs h-8', period === p && 'bg-blue-600 hover:bg-blue-700')}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {/* Platform Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="gap-1.5 text-xs">
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="facebook" className="gap-1.5 text-xs">
            <Facebook className="h-3.5 w-3.5" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stat Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Total Posts',
                value: totals?.totalPosts,
                icon: FileText,
                color: 'text-blue-500',
                comp: totals?.comparisons?.totalPosts,
              },
              {
                label: 'Published',
                value: totals?.published,
                icon: Send,
                color: 'text-green-500',
                comp: totals?.comparisons?.published,
              },
              {
                label: 'Scheduled',
                value: totals?.scheduled,
                icon: Clock,
                color: 'text-yellow-500',
              },
              {
                label: 'Queued',
                value: totals?.queued,
                icon: TrendingUp,
                color: 'text-purple-500',
              },
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
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                      {stat.comp && renderChangeIndicator(stat.comp)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Post Activity Over Time</CardTitle>
              <CardDescription>Daily posts created vs published ({PERIOD_LABELS[period]})</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="posts" name="Created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPosts)" />
                    <Area type="monotone" dataKey="published" name="Published" stroke="#22c55e" fillOpacity={1} fill="url(#colorPub)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Format Breakdown Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Posts by Format</CardTitle>
              <CardDescription>Content type distribution for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={formatBreakdownData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Posts" radius={[4, 4, 0, 0]}>
                      {formatBreakdownData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LinkedIn Tab ──────────────────────────────────────────── */}
        <TabsContent value="linkedin" className="space-y-6 mt-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Posts', value: totals?.totalPosts, icon: FileText, color: 'text-blue-500' },
              { label: 'Published', value: totals?.published, icon: Send, color: 'text-green-500' },
              { label: 'Scheduled', value: totals?.scheduled, icon: Clock, color: 'text-yellow-500' },
              { label: 'Queued', value: totals?.queued, icon: TrendingUp, color: 'text-purple-500' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-16" /> : (
                    <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-blue-600" />
                LinkedIn Performance
              </CardTitle>
              <CardDescription>Post activity from your connected LinkedIn account</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0077b5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0077b5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="published" name="Published" stroke="#0077b5" fillOpacity={1} fill="url(#colorLinkedin)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Facebook Tab ──────────────────────────────────────────── */}
        <TabsContent value="facebook" className="space-y-6 mt-4">
          {fbLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !fbData || !fbData.connected ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Facebook className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold mb-2">Facebook Not Connected</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Connect your Facebook account from the Connect page to view Page Insights and engagement metrics.
                </p>
              </CardContent>
            </Card>
          ) : !fbData.hasPages ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500/60" />
                <h3 className="text-lg font-semibold mb-2">No Facebook Pages Found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {fbData.message || 'Create a Facebook Page and click "Sync Pages" on the Connect page to view Page Insights here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Facebook Summary Stats */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: 'Live Posts',
                    value: fbData.summary?.totalPublishedPosts ?? (fbData.posts?.length || 0),
                    icon: FileText,
                    color: 'text-blue-500',
                  },
                  {
                    label: 'Total Reactions',
                    value: fbData.summary?.totalReactions ?? 0,
                    icon: ThumbsUp,
                    color: 'text-indigo-500',
                  },
                  {
                    label: 'Total Comments',
                    value: fbData.summary?.totalComments ?? 0,
                    icon: MessageSquare,
                    color: 'text-green-500',
                  },
                  {
                    label: 'Total Engagement',
                    value: fbData.summary?.totalEngagement ?? 0,
                    icon: TrendingUp,
                    color: 'text-purple-500',
                  },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Live Post-by-Post Analytics */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Facebook className="h-5 w-5 text-blue-600" />
                        Live Post-by-Post Analytics
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Real-time engagement, reactions, and comments for every post on "{fbData.pageName}"
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="w-fit text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border-blue-200">
                      {fbData.posts?.length || 0} Posts Analyzed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {!fbData.posts || fbData.posts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Facebook className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No posts found on this Facebook Page yet.</p>
                      <p className="text-xs mt-1">Publish posts using Composer to track post performance here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fbData.posts.map((post) => (
                        <div
                          key={post.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex gap-3 items-start min-w-0 flex-1">
                            {post.imageUrl ? (
                              <img
                                src={post.imageUrl}
                                alt="Post graphic"
                                className="h-14 w-14 rounded-lg object-cover border shrink-0 bg-muted"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-lg border bg-blue-50/70 flex items-center justify-center shrink-0 text-blue-600">
                                <FileText className="h-6 w-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-sm font-medium line-clamp-2 text-foreground leading-snug">
                                {post.message || (post.title ? post.title : 'Post update')}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                <span>{new Date(post.createdTime).toLocaleString()}</span>
                                <span>•</span>
                                <span className="capitalize">{post.type}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            {/* Metric Pills */}
                            <div className="flex items-center gap-1.5 bg-muted/50 border rounded-lg px-2.5 py-1 text-xs">
                              <span className="flex items-center gap-1 text-blue-600 font-semibold" title="Reactions">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {post.reactions}
                              </span>
                              <span className="text-muted-foreground/40">|</span>
                              <span className="flex items-center gap-1 text-green-600 font-semibold" title="Comments">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {post.comments}
                              </span>
                              <span className="text-muted-foreground/40">|</span>
                              <span className="flex items-center gap-1 text-purple-600 font-semibold" title="Shares">
                                <Share2 className="h-3.5 w-3.5" />
                                {post.shares}
                              </span>
                            </div>

                            {post.permalinkUrl && (
                              <a
                                href={post.permalinkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Page-Level Insights with Explanation Banner */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Page-Level Reach & Video Views</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Historical page metrics from Meta Graph API
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      24-48h Daily Batch Window
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-[11px] text-muted-foreground bg-muted/40 border rounded-lg p-3 leading-relaxed">
                    Meta Graph API calculates daily page-level views on a 24 to 48-hour processing window for newly created pages. Live reactions, comments, and engagement for each post are displayed in the real-time breakdown above.
                  </div>

                  {fbData.metrics && fbData.metrics.length > 0 && (
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                      {fbData.metrics.map((metric: any, idx: number) => (
                        <Card key={idx} className="bg-muted/20 border-muted">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                              {(metric.title || metric.name || '').replace(/_/g, ' ')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold">
                              {metric.values?.[0]?.value ?? 0}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{metric.description || ''}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── AI Insights Tab ──────────────────────────────────────── */}
        <TabsContent value="insights" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    AI Content Intelligence
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Strategic insights generated by analyzing your posting patterns and engagement data
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchInsights}
                  disabled={insightsLoading}
                  className="gap-1.5 text-xs"
                >
                  {insightsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-sm font-medium">No insights generated yet</p>
                  <p className="text-xs mt-1">Click "Regenerate" to analyze your content and generate strategic insights</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, idx) => {
                    const parts = insight.split(':')
                    const title = parts.length > 1 ? parts[0].trim() : `Insight ${idx + 1}`
                    const body = parts.length > 1 ? parts.slice(1).join(':').trim() : insight

                    return (
                      <div
                        key={idx}
                        className="flex gap-3 items-start p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600 shrink-0 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

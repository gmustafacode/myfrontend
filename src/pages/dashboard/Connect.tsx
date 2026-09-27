import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music2,
  Link2,
  Link2Off,
  Loader2,
  CheckCircle,
  Globe,
  RefreshCw,
  AlertCircle,
  Mail,
  Layers,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

interface Account {
  _id: string
  platform: string
  platformUsername: string
  name?: string
  email?: string
  picture?: string
  isActive: boolean
  connectedAt: string
}

interface FacebookPage {
  id: string
  name: string
  category?: string
}

const platformConfig: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  ringColor: string
  description: string
}> = {
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    ringColor: 'ring-blue-500',
    description: 'Share professional content and grow your B2B network',
  },
  x: {
    label: 'X (Twitter)',
    icon: Twitter,
    color: 'text-gray-900',
    bgColor: 'bg-gray-50 border-gray-300',
    ringColor: 'ring-gray-700',
    description: 'Post threads and engage with your audience in real-time',
  },
  twitter: {
    label: 'X (Twitter)',
    icon: Twitter,
    color: 'text-gray-900',
    bgColor: 'bg-gray-50 border-gray-300',
    ringColor: 'ring-gray-700',
    description: 'Post threads and engage with your audience in real-time',
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-100',
    ringColor: 'ring-blue-400',
    description: 'Reach your Facebook page followers and communities',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 border-pink-100',
    ringColor: 'ring-pink-500',
    description: 'Share visual content with your Instagram audience',
  },
  tiktok: {
    label: 'TikTok',
    icon: Music2,
    color: 'text-slate-900',
    bgColor: 'bg-slate-50 border-slate-300',
    ringColor: 'ring-slate-900',
    description: 'Publish short-form video to your TikTok audience',
  },
}

const ALL_PLATFORMS = ['linkedin', 'x', 'facebook', 'instagram', 'tiktok']

export default function Connect() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([])
  const [syncingFbPages, setSyncingFbPages] = useState(false)
  const [manualPageInput, setManualPageInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  // ── Handle OAuth return params ────────────────────────────────────────
  useEffect(() => {
    const connected = searchParams.get('connected')
    const name = searchParams.get('name')
    const error = searchParams.get('error')

    if (connected) {
      const platformLabel = platformConfig[connected]?.label || connected
      toast.success(`${platformLabel} connected successfully!`, {
        description: name ? `Account: ${name}` : 'Your account has been linked.',
        duration: 5000,
      })
      // Remove params from URL without page reload
      setSearchParams({})
      // Refresh accounts
      fetchAccounts()
    }

    if (error) {
      toast.error('OAuth Error', {
        description: decodeURIComponent(error),
        duration: 6000,
      })
      setSearchParams({})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccounts = () => {
    setLoading(true)
    api.get('/social/accounts')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setAccounts(data)
        const hasFb = data.some((a: Account) => a.platform === 'facebook')
        if (hasFb) {
          fetchFacebookPages()
        }
      })
      .catch(() => toast.error('Failed to load connected accounts'))
      .finally(() => setLoading(false))
  }

  const fetchFacebookPages = () => {
    api.get('/social/facebook/pages')
      .then((res) => {
        setFacebookPages(res.data.pages || [])
      })
      .catch(() => { })
  }

  const syncPages = async (targetIdOrUrl?: string) => {
    setSyncingFbPages(true)
    try {
      const payload = targetIdOrUrl ? { pageUrl: targetIdOrUrl } : {}
      const res = await api.post('/social/facebook/sync-pages', payload)
      const pages = res.data.pages || []
      setFacebookPages(pages)
      if (pages.length > 0) {
        toast.success(`Found ${pages.length} Facebook Page(s)!`)
        setManualPageInput('')
        setShowManualInput(false)
      } else {
        toast.info('No Facebook Pages found. If your page is in Meta Business Suite, enter its Page ID or URL below.')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to sync Facebook pages')
    } finally {
      setSyncingFbPages(false)
    }
  }

  useEffect(() => { fetchAccounts() }, [])

  // Build connect URL — pass JWT as ?token= so backend can store against logged-in user
  const connect = (platform: string) => {
    const token = localStorage.getItem('token') || ''
    const baseUrl = 'https://social-sync-backend.vercel.app/api'
    const connectUrl = `${baseUrl}/social/${platform}/connect?token=${encodeURIComponent(token)}`
    window.location.href = connectUrl
  }

  const disconnect = async (id: string) => {
    setDisconnecting(id)
    try {
      await api.delete(`/social/accounts/${id}`)
      toast.success('Account disconnected')
      fetchAccounts()
    } catch {
      toast.error('Failed to disconnect account')
    } finally {
      setDisconnecting(null)
      setConfirmId(null)
    }
  }

  const connectedPlatforms = new Set(accounts.map((a) => a.platform))
  const confirmAccount = accounts.find((a) => a._id === confirmId)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Connect Platforms</h1>
          <p className="text-muted-foreground">Link your social media accounts to start publishing</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Platform grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ALL_PLATFORMS.map((platform) => {
            const cfg = platformConfig[platform]
            if (!cfg) return null
            const Icon = cfg.icon
            const account = accounts.find((a) => a.platform === platform)
            const connected = connectedPlatforms.has(platform)

            return (
              <Card
                key={platform}
                className={`border-2 transition-all duration-200 ${connected
                    ? `${cfg.bgColor} shadow-sm`
                    : 'hover:shadow-md hover:border-muted-foreground/30'
                  }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {connected && account?.picture ? (
                        <div className={`relative ring-2 ${cfg.ringColor} ring-offset-1 rounded-full`}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={account.picture} alt={account.platformUsername} />
                            <AvatarFallback>
                              <Icon className={`h-5 w-5 ${cfg.color}`} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className={`p-2.5 rounded-xl ${connected ? 'bg-white shadow-sm' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${connected ? cfg.color : 'text-muted-foreground'}`} />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{cfg.label}</CardTitle>
                        {connected && account && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {account.name || account.platformUsername}
                          </p>
                        )}
                      </div>
                    </div>
                    {connected ? (
                      <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-xs">{cfg.description}</CardDescription>

                  {connected && account?.email && (
                    <p className="text-xs text-muted-foreground bg-white/60 rounded px-2 py-1 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {account.email}
                    </p>
                  )}

                  {/* Facebook Connected Pages Section */}
                  {connected && platform === 'facebook' && (
                    <div className="pt-1 pb-1 space-y-2 border-t border-blue-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-blue-600" />
                          Pages ({facebookPages.length})
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                            onClick={() => setShowManualInput(!showManualInput)}
                          >
                            <Plus className="h-3 w-3 mr-0.5" />
                            {showManualInput ? 'Close' : 'Add by ID'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                            onClick={() => syncPages()}
                            disabled={syncingFbPages}
                          >
                            <RefreshCw className={`h-2.5 w-2.5 mr-1 ${syncingFbPages ? 'animate-spin' : ''}`} />
                            Sync Pages
                          </Button>
                        </div>
                      </div>

                      {showManualInput && (
                        <div className="flex gap-1.5 items-center pt-0.5">
                          <Input
                            placeholder="Enter Page ID or link (e.g. 1341429722380752)..."
                            value={manualPageInput}
                            onChange={(e) => setManualPageInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') syncPages(manualPageInput) }}
                            className="h-7 text-xs bg-white"
                          />
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                            disabled={syncingFbPages || !manualPageInput.trim()}
                            onClick={() => syncPages(manualPageInput)}
                          >
                            {syncingFbPages ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
                          </Button>
                        </div>
                      )}

                      {facebookPages.length > 0 ? (
                        <div className="space-y-1.5">
                          {facebookPages.map((pg) => (
                            <div key={pg.id} className="text-xs bg-white border border-blue-100 rounded-md p-2 flex items-center justify-between shadow-xs">
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-slate-900 truncate">{pg.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">ID: {pg.id} {pg.category ? `• ${pg.category}` : ''}</p>
                              </div>
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-green-100 text-green-700 border-green-200 shrink-0">
                                Active Page
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground bg-white/80 border border-blue-100 rounded p-2 space-y-1.5">
                          <p>No Facebook Pages found for this profile.</p>
                          <p className="text-[10px] text-muted-foreground/80">Meta requires a Facebook Page to publish content. If managed in Business Suite, click "Add by ID" above.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] w-full border-blue-200 text-blue-600"
                            onClick={() => syncPages()}
                            disabled={syncingFbPages}
                          >
                            <RefreshCw className={`h-2.5 w-2.5 mr-1 ${syncingFbPages ? 'animate-spin' : ''}`} />
                            Check for New Pages
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {connected ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-muted-foreground hover:text-foreground"
                        onClick={() => connect(platform)}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Reconnect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => setConfirmId(account!._id)}
                        disabled={disconnecting === account?._id}
                      >
                        {disconnecting === account?._id
                          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          : <Link2Off className="mr-1.5 h-3.5 w-3.5" />
                        }
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => connect(platform)}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Connect {cfg.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary bar — how many connected */}
      {!loading && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${accounts.length > 0
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
          }`}>
          {accounts.length > 0 ? (
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          )}
          <div>
            <p className={`font-medium text-sm ${accounts.length > 0 ? 'text-green-800' : 'text-amber-800'}`}>
              {accounts.length > 0
                ? `${accounts.length} platform${accounts.length > 1 ? 's' : ''} connected`
                : 'No platforms connected yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              {accounts.length > 0
                ? `Connected: ${accounts.map(a => platformConfig[a.platform]?.label || a.platform).join(', ')}`
                : 'Connect at least one platform to start publishing content.'}
            </p>
          </div>
        </div>
      )}

      {/* Confirm disconnect dialog */}
      <Dialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {platformConfig[confirmAccount?.platform || '']?.label || 'Account'}?</DialogTitle>
            <DialogDescription>
              {confirmAccount?.name && (
                <span className="block font-medium text-foreground mb-1">{confirmAccount.name}</span>
              )}
              This will remove the connection. Existing scheduled posts may fail to publish.
              You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => confirmId && disconnect(confirmId)}
              disabled={!!disconnecting}
            >
              {disconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2Off className="mr-2 h-4 w-4" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

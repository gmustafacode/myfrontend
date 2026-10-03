import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, AlertTriangle, Copy, Check, KeyRound, Link2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Prefs {
  autoApprove: boolean
  schedulingEnabled: boolean
  defaultPlatforms: string[]
  webhookUrl?: string
  n8nWebhookUrl?: string
}

interface MetaCredential {
  _id: string
  platform: 'facebook' | 'instagram'
  redirectUri: string
}

export default function Settings() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<Prefs>({
    autoApprove: false,
    schedulingEnabled: true,
    defaultPlatforms: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [metaCredentials, setMetaCredentials] = useState<MetaCredential[]>([])
  const [credentialPlatform, setCredentialPlatform] = useState<'facebook' | 'instagram' | null>(null)
  const [metaAppId, setMetaAppId] = useState('')
  const [metaAppSecret, setMetaAppSecret] = useState('')
  const [savingCredential, setSavingCredential] = useState(false)

  useEffect(() => {
    api.get('/preferences')
      .then((res) => setPrefs({ ...prefs, ...res.data }))
      .catch(() => toast.error('Failed to load preferences'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get('/social/meta/credentials')
      .then((res) => setMetaCredentials(res.data?.credentials || []))
      .catch(() => toast.error('Failed to load Meta app settings'))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/preferences', prefs)
      toast.success('Settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const copyWebhook = () => {
    const url = prefs.n8nWebhookUrl || prefs.webhookUrl || ''
    if (url) {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const connect = (platform: 'facebook' | 'instagram', metaCredentialId?: string) => {
    const token = localStorage.getItem('token') || ''
    const baseUrl = 'https://social-sync-backend.vercel.app/api'
    const credentialQuery = metaCredentialId ? `&metaCredentialId=${encodeURIComponent(metaCredentialId)}` : ''
    window.location.href = `${baseUrl}/social/${platform}/connect?token=${encodeURIComponent(token)}${credentialQuery}`
  }

  const openMetaCredentialDialog = (platform: 'facebook' | 'instagram') => {
    setCredentialPlatform(platform)
    setMetaAppId('')
    setMetaAppSecret('')
  }

  const saveAndConnectMetaApp = async () => {
    if (!credentialPlatform || !metaAppId.trim() || !metaAppSecret.trim()) return
    setSavingCredential(true)
    try {
      const response = await api.post('/social/meta/credentials', {
        platform: credentialPlatform,
        clientId: metaAppId,
        clientSecret: metaAppSecret,
      })
      const credential = response.data?.credential
      if (!credential?._id) throw new Error('Credential was not saved')
      setMetaCredentials((previous) => [
        ...previous.filter((item) => item.platform !== credentialPlatform),
        credential,
      ])
      connect(credentialPlatform, credential._id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not save Meta app credentials')
      setSavingCredential(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and automation preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={user?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Meta app credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Meta App Credentials</CardTitle>
          <CardDescription>
            Use your saved app when connecting Facebook or Instagram. Without a saved app, the platform connection uses SocialSync's main credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['facebook', 'instagram'] as const).map((platform) => {
            const savedCredential = metaCredentials.find((item) => item.platform === platform)
            const label = platform === 'facebook' ? 'Facebook' : 'Instagram'

            return (
              <div key={platform} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {savedCredential ? 'Your Meta app is saved for this platform.' : 'No personal app saved; main credentials will be used.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedCredential && (
                    <Button variant="secondary" size="sm" onClick={() => connect(platform, savedCredential._id)}>
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      Connect with saved Meta app
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openMetaCredentialDialog(platform)}>
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                    {savedCredential ? 'Replace my Meta app' : 'Add my Meta app'}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Automation */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Preferences</CardTitle>
          <CardDescription>Control how SocialSync automatically manages your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-approve AI content</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve AI-generated content for publishing without manual review
                  </p>
                </div>
                <Switch
                  checked={prefs.autoApprove}
                  onCheckedChange={(v) => setPrefs({ ...prefs, autoApprove: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable scheduling</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow posts to be automatically published at scheduled times
                  </p>
                </div>
                <Switch
                  checked={prefs.schedulingEnabled}
                  onCheckedChange={(v) => setPrefs({ ...prefs, schedulingEnabled: v })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* n8n Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>n8n Automation Webhook</CardTitle>
          <CardDescription>Use this URL to trigger SocialSync from your n8n workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <Skeleton className="h-10 w-full" /> : (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={prefs.n8nWebhookUrl || prefs.webhookUrl || 'Not configured'}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhook}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Custom Webhook URL</Label>
                <Input
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  value={prefs.webhookUrl || ''}
                  onChange={(e) => setPrefs({ ...prefs, webhookUrl: e.target.value })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex gap-3">
        <Button onClick={save} disabled={saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Dialog open={!!credentialPlatform} onOpenChange={(open) => !open && setCredentialPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use your Meta developer app</DialogTitle>
            <DialogDescription>
              Enter the {credentialPlatform === 'facebook' ? 'Facebook' : 'Instagram Login'} app credentials. Do not use a page ID or a client-side app ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={credentialPlatform === 'instagram' ? 'Instagram Login App ID' : 'Facebook App ID'}
              value={metaAppId}
              onChange={(event) => setMetaAppId(event.target.value)}
              autoComplete="off"
            />
            <Input
              type="password"
              placeholder="Meta App Secret"
              value={metaAppSecret}
              onChange={(event) => setMetaAppSecret(event.target.value)}
              autoComplete="new-password"
            />
            <p className="rounded-md bg-muted p-2 text-xs break-all">
              Callback: {metaCredentials.find((item) => item.platform === credentialPlatform)?.redirectUri || `https://social-sync-backend.vercel.app/api/social/${credentialPlatform}/callback`}
            </p>
            {credentialPlatform === 'instagram' && (
              <p className="text-xs text-muted-foreground">
                In Meta Developers, add the Instagram API with Instagram Login product and configure this exact callback under Instagram Login settings.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialPlatform(null)}>Cancel</Button>
            <Button onClick={saveAndConnectMetaApp} disabled={savingCredential || !metaAppId.trim() || !metaAppSecret.trim()}>
              {savingCredential && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions — proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => toast.error('Contact support to delete your account')}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

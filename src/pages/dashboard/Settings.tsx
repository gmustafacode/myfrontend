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
import { Loader2, Save, AlertTriangle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Prefs {
  autoApprove: boolean
  schedulingEnabled: boolean
  defaultPlatforms: string[]
  webhookUrl?: string
  n8nWebhookUrl?: string
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

  useEffect(() => {
    api.get('/preferences')
      .then((res) => setPrefs({ ...prefs, ...res.data }))
      .catch(() => toast.error('Failed to load preferences'))
      .finally(() => setLoading(false))
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

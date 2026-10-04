import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Facebook, Instagram, Linkedin, Loader2, Save, Sparkles, Search, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type Platform = 'linkedin' | 'facebook' | 'instagram'

interface SeoFields {
    displayName: string
    headline: string
    bio: string
    about: string
    keywords: string[]
    website: string
    altText: string
    callToAction: string
}

interface AccountSeoState {
    accountId: string
    platform: Platform
    name?: string
    username?: string
    picture?: string
    connected: boolean
    pages?: Array<{ id: string; name: string; category?: string }>
    seo: SeoFields
    capabilities: { localSeo: boolean; profileApiWrite: boolean }
}

const emptySeo: SeoFields = { displayName: '', headline: '', bio: '', about: '', keywords: [], website: '', altText: '', callToAction: '' }
const platformConfig: Record<Platform, { label: string; icon: typeof Linkedin; color: string; hint: string }> = {
    linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', hint: 'LinkedIn profile editing is restricted by the API. Your SEO package will be saved for posts and future publishing.' },
    facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-500', hint: 'Facebook Page name, About and website fields are synced through your Page access token.' },
    instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500', hint: 'Instagram does not allow profile SEO writes with the current API scope. Your SEO package will be saved locally for captions, hashtags and content optimization.' },
}

export default function AccountSeo() {
    const [accounts, setAccounts] = useState<AccountSeoState[]>([])
    const [selectedId, setSelectedId] = useState('')
    const [fields, setFields] = useState<SeoFields>(emptySeo)
    const [pageId, setPageId] = useState('')
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)
    const selected = accounts.find((account) => account.accountId === selectedId)

    const loadAccounts = async () => {
        setLoading(true)
        try {
            const response = await api.get('/social/seo')
            const nextAccounts = response.data?.accounts || []
            setAccounts(nextAccounts)
            if (nextAccounts.length > 0) selectAccount(nextAccounts[0], nextAccounts)
        } catch {
            toast.error('Could not load connected account SEO settings')
        } finally {
            setLoading(false)
        }
    }

    const selectAccount = (account: AccountSeoState, source = accounts) => {
        setSelectedId(account.accountId)
        setFields({ ...emptySeo, ...account.seo })
        setPageId(account.pages?.[0]?.id || '')
        if (!source.length) setAccounts([account])
    }

    useEffect(() => { loadAccounts() }, [])

    const updateField = (key: keyof SeoFields, value: string | string[]) => setFields((current) => ({ ...current, [key]: value }))

    const generate = async () => {
        if (!selected) return
        setGenerating(true)
        try {
            const response = await api.post('/social/seo/generate', { accountId: selected.accountId })
            setFields({ ...emptySeo, ...response.data.seo })
            toast.success('AI SEO package generated. Review it before saving.')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'AI SEO generation failed')
        } finally {
            setGenerating(false)
        }
    }

    const save = async () => {
        if (!selected) return
        setSaving(true)
        try {
            const response = await api.put(`/social/seo/${selected.accountId}`, { seo: fields, pageId: pageId || undefined })
            const updated = response.data.account as AccountSeoState
            setAccounts((current) => current.map((account) => account.accountId === updated.accountId ? updated : account))
            setFields({ ...emptySeo, ...updated.seo })
            if (response.data.platformSynced) {
                toast.success(response.data.syncMessage || 'SEO settings synced')
            } else {
                toast.warning(response.data.syncMessage || 'SEO package saved locally')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Could not save SEO settings')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-full bg-[linear-gradient(180deg,_#f8fbff_0%,_hsl(var(--background))_42%)] p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Account discoverability</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight">Account SEO</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Choose a connected platform, let AI prepare the SEO fields, then review and sync the supported profile fields.</p>
            </div>

            {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading connected accounts...</div> : accounts.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertCircle className="h-8 w-8 text-muted-foreground" /><p className="font-medium">No LinkedIn, Facebook or Instagram account is connected.</p><p className="text-sm text-muted-foreground">Connect a platform first, then return here to manage its SEO.</p></CardContent></Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold">Connected platforms</p>
                        {accounts.map((account) => {
                            const config = platformConfig[account.platform]
                            const Icon = config.icon
                            return <button key={account.accountId} type="button" onClick={() => selectAccount(account)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selectedId === account.accountId ? 'border-blue-500 bg-blue-50 shadow-sm' : 'bg-card hover:border-blue-200'}`}>
                                <Icon className={`h-5 w-5 ${config.color}`} />
                                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{config.label}</span><span className="block truncate text-xs text-muted-foreground">{account.username || account.name}</span></span>
                                <Badge variant="outline" className="text-[10px]">Connected</Badge>
                            </button>
                        })}
                    </div>

                    {selected && <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="border-b bg-white/70">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-blue-600" /> {platformConfig[selected.platform].label} SEO</CardTitle><CardDescription>{platformConfig[selected.platform].hint}</CardDescription></div><Button onClick={generate} disabled={generating} className="gap-2"><Sparkles className="h-4 w-4" />{generating ? 'Generating...' : 'AI do SEO'}</Button></div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            {selected.platform === 'facebook' && selected.pages && selected.pages.length > 0 && <div className="space-y-2"><Label>Facebook Page</Label><Select value={pageId} onValueChange={setPageId}><SelectTrigger><SelectValue placeholder="Select a Page" /></SelectTrigger><SelectContent>{selected.pages.map((page) => <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>)}</SelectContent></Select></div>}
                            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Display name</Label><Input value={fields.displayName} onChange={(event) => updateField('displayName', event.target.value)} /></div><div className="space-y-2"><Label>Headline</Label><Input value={fields.headline} onChange={(event) => updateField('headline', event.target.value)} placeholder="Professional headline" /></div></div>
                            <div className="space-y-2"><Label>Bio</Label><Textarea value={fields.bio} onChange={(event) => updateField('bio', event.target.value)} maxLength={150} placeholder="Short, searchable profile bio" /><p className="text-right text-xs text-muted-foreground">{fields.bio.length}/150</p></div>
                            <div className="space-y-2"><Label>About / Description</Label><Textarea value={fields.about} onChange={(event) => updateField('about', event.target.value)} maxLength={500} className="min-h-[110px]" placeholder="Explain what this account helps people discover" /></div>
                            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Keywords</Label><Input value={fields.keywords.join(', ')} onChange={(event) => updateField('keywords', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="AI, SaaS, architecture" /></div><div className="space-y-2"><Label>Website</Label><Input value={fields.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://example.com" /></div></div>
                            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Profile image alt text</Label><Textarea value={fields.altText} onChange={(event) => updateField('altText', event.target.value)} /></div><div className="space-y-2"><Label>Call to action</Label><Textarea value={fields.callToAction} onChange={(event) => updateField('callToAction', event.target.value)} /></div></div>
                            <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" /><span>{selected.capabilities.profileApiWrite ? 'Supported profile fields will be sent to the platform when you save.' : 'This platform does not allow general profile writes with the connected API scope; SEO is saved locally for content and post optimization.'}</span></div>
                            <div className="flex justify-end"><Button onClick={save} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save & sync SEO'}</Button></div>
                        </CardContent>
                    </Card>}
                </div>
            )}
        </div>
    )
}
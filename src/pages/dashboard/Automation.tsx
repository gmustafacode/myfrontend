import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Save, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'Manual' | 'Semi-Auto' | 'Full Auto'
type Trigger = { day: string; time: string }
type Account = { _id: string; platform: string; platformUsername: string; name?: string }

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const platforms = ['linkedin', 'facebook', 'instagram']
const tones = ['Professional', 'Educational', 'Friendly', 'Technical', 'Authoritative', 'Conversational', 'Storytelling']
const goals = ['Education', 'Engagement', 'Growth', 'Lead Generation', 'Brand Awareness', 'Traffic', 'Sales', 'Community Building']
const contentTypes = ['Text', 'Image + Text', 'Carousel', 'Educational', 'News/Trend', 'Tips', 'Tutorial', 'Case Study', 'Question']
const mediaOptions = [
    { value: 'text_only', label: 'Text only' },
    { value: 'prefer_image', label: 'Prefer image' },
    { value: 'require_image', label: 'Require image' },
    { value: 'ai_selected', label: 'AI-selected' },
]

function getTimeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

function splitList(value: string) {
    return value.split(',').map(item => item.trim()).filter(Boolean)
}

export default function Automation() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [form, setForm] = useState({
        automationLevel: 'Semi-Auto' as Mode,
        triggers: [{ day: 'Monday', time: '09:00' }] as Trigger[],
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        timezone: getTimeZone(),
        frequency: 'custom',
        preferredPlatforms: [] as string[],
        selectedAccountIds: [] as string[],
        industryNiche: '',
        brandName: '',
        audienceType: '',
        contentGoals: [] as string[],
        contentTone: 'Professional',
        preferredContentTypes: [] as string[],
        mediaPreference: 'ai_selected',
        topicPreferences: '',
        excludedTopics: '',
    })

    useEffect(() => {
        Promise.all([api.get('/preferences'), api.get('/social/accounts')])
            .then(([preferenceResponse, accountResponse]) => {
                const prefs = preferenceResponse.data.preferences || preferenceResponse.data
                const schedule = Array.isArray(prefs.postingSchedule) ? { triggers: prefs.postingSchedule } : (prefs.postingSchedule || {})
                setForm(current => ({
                    ...current,
                    automationLevel: prefs.automationLevel || current.automationLevel,
                    triggers: schedule.triggers?.length ? schedule.triggers : current.triggers,
                    startDate: schedule.startDate || prefs.scheduleStartDate || current.startDate,
                    endDate: schedule.endDate || prefs.scheduleEndDate || '',
                    frequency: schedule.frequency || prefs.postingFrequency || current.frequency,
                    timezone: prefs.timezone && (prefs.timezone !== 'UTC' || prefs.timezoneConfigured)
                        ? prefs.timezone
                        : current.timezone,
                    preferredPlatforms: prefs.preferredPlatforms || [],
                    selectedAccountIds: prefs.selectedAccountIds || [],
                    industryNiche: prefs.industryNiche || '',
                    brandName: prefs.brandName || '',
                    audienceType: prefs.audienceType || '',
                    contentGoals: Array.isArray(prefs.contentGoals) ? prefs.contentGoals : (prefs.contentGoals ? splitList(prefs.contentGoals) : []),
                    contentTone: prefs.contentTone || current.contentTone,
                    preferredContentTypes: prefs.preferredContentTypes || [],
                    mediaPreference: prefs.mediaPreference || current.mediaPreference,
                    topicPreferences: (prefs.topicPreferences || []).join(', '),
                    excludedTopics: (prefs.excludedTopics || []).join(', '),
                }))
                setAccounts(accountResponse.data || [])
            })
            .catch(() => toast.error('Failed to load automation settings'))
            .finally(() => setLoading(false))
    }, [])

    const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(current => ({ ...current, [key]: value }))
    const toggleInList = (key: 'preferredPlatforms' | 'selectedAccountIds' | 'contentGoals' | 'preferredContentTypes', value: string) => {
        const values = form[key]
        update(key, values.includes(value) ? values.filter(item => item !== value) : [...values, value])
    }
    const visibleAccounts = useMemo(() => accounts.filter(account => form.preferredPlatforms.includes(account.platform)), [accounts, form.preferredPlatforms])
    const postCount = form.triggers.length * new Set(form.triggers.map(trigger => trigger.day)).size

    const save = async () => {
        if (!form.triggers.length || !form.triggers.every(trigger => trigger.day && /^([01]\d|2[0-3]):[0-5]\d$/.test(trigger.time))) {
            toast.error('Add at least one valid day and time')
            return
        }
        if (form.endDate && form.endDate < form.startDate) {
            toast.error('End date cannot be before start date')
            return
        }
        if (form.automationLevel === 'Full Auto' && !form.preferredPlatforms.length) {
            toast.error('Full Auto needs at least one platform')
            return
        }
        setSaving(true)
        try {
            await api.put('/preferences', {
                automationLevel: form.automationLevel,
                postingSchedule: { triggers: form.triggers, startDate: form.startDate, endDate: form.endDate || null, frequency: form.frequency },
                scheduleStartDate: form.startDate,
                scheduleEndDate: form.endDate || null,
                postingFrequency: form.frequency,
                timezone: form.timezone,
                preferredPlatforms: form.preferredPlatforms,
                selectedAccountIds: form.selectedAccountIds,
                industryNiche: form.industryNiche,
                brandName: form.brandName,
                audienceType: form.audienceType,
                contentGoals: form.contentGoals,
                contentTone: form.contentTone,
                preferredContentTypes: form.preferredContentTypes,
                mediaPreference: form.mediaPreference,
                timezoneConfigured: true,
                topicPreferences: splitList(form.topicPreferences),
                excludedTopics: splitList(form.excludedTopics),
            })
            toast.success('Automation saved')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save automation')
        } finally { setSaving(false) }
    }

    if (loading) return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>

    return (
        <div className="max-w-5xl space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Automation control center</h1></div><p className="text-muted-foreground">Set the rules once. Fresh research and publishing will follow each trigger.</p></div>
                <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save automation'}</Button>
            </div>

            <Card><CardHeader><CardTitle>Automation mode</CardTitle><CardDescription>Choose how much control the AI has after generating content.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{(['Manual', 'Semi-Auto', 'Full Auto'] as Mode[]).map(mode => <button key={mode} type="button" onClick={() => update('automationLevel', mode)} className={`rounded-lg border p-4 text-left ${form.automationLevel === mode ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}><p className="font-medium">{mode}</p><p className="mt-1 text-sm text-muted-foreground">{mode === 'Manual' ? 'Generate assistance only.' : mode === 'Semi-Auto' ? 'Generate into the review queue.' : 'Generate, validate and publish automatically.'}</p></button>)}</CardContent></Card>

            <Card><CardHeader><CardTitle>Schedule</CardTitle><CardDescription>{postCount || 0} trigger slots configured in {form.timezone}.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex flex-wrap gap-2">{days.map(day => <label key={day} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Checkbox checked={form.triggers.some(trigger => trigger.day === day)} onCheckedChange={checked => { if (checked) update('triggers', [...form.triggers, { day, time: '09:00' }]); else update('triggers', form.triggers.filter(trigger => trigger.day !== day)) }} />{day.slice(0, 3)}</label>)}</div><div className="space-y-2"><Label>Posting times</Label>{form.triggers.map((trigger, index) => <div key={`${trigger.day}-${index}`} className="flex max-w-md gap-2"><select className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" value={trigger.day} onChange={event => update('triggers', form.triggers.map((item, i) => i === index ? { ...item, day: event.target.value } : item))}>{days.map(day => <option key={day}>{day}</option>)}</select><Input type="time" value={trigger.time} onChange={event => update('triggers', form.triggers.map((item, i) => i === index ? { ...item, time: event.target.value } : item))} /><Button type="button" variant="outline" size="icon" onClick={() => update('triggers', form.triggers.filter((_, i) => i !== index))} disabled={form.triggers.length === 1}><Trash2 className="h-4 w-4" /></Button></div>)}<Button type="button" variant="outline" onClick={() => update('triggers', [...form.triggers, { day: days.find(day => !form.triggers.some(trigger => trigger.day === day)) || 'Monday', time: '09:00' }])}><Plus className="mr-2 h-4 w-4" />Add trigger time</Button></div><div className="grid gap-4 md:grid-cols-4"><div><Label>Frequency</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.frequency} onChange={event => update('frequency', event.target.value)}><option value="once_daily">Once per day</option><option value="twice_daily">Twice per day</option><option value="multiple_daily">Multiple per day</option><option value="custom">Custom</option></select></div><div><Label>Start date</Label><Input className="mt-2" type="date" value={form.startDate} onChange={event => update('startDate', event.target.value)} /></div><div><Label>End date</Label><Input className="mt-2" type="date" value={form.endDate} onChange={event => update('endDate', event.target.value)} /></div><div><Label>Timezone</Label><Input className="mt-2" value={form.timezone} onChange={event => update('timezone', event.target.value)} placeholder="Asia/Karachi" /></div></div></CardContent></Card>

            <Card><CardHeader><CardTitle>Platforms and accounts</CardTitle><CardDescription>Only active selected accounts receive Full Auto posts.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-3">{platforms.map(platform => <label key={platform} className="flex items-center gap-2 rounded-md border px-3 py-2 capitalize"><Checkbox checked={form.preferredPlatforms.includes(platform)} onCheckedChange={() => toggleInList('preferredPlatforms', platform)} />{platform}</label>)}</div>{visibleAccounts.length > 0 && <div className="grid gap-2 md:grid-cols-2">{visibleAccounts.map(account => <label key={account._id} className="flex items-center gap-2 rounded-md border p-3 text-sm"><Checkbox checked={form.selectedAccountIds.includes(account._id)} onCheckedChange={() => toggleInList('selectedAccountIds', account._id)} /><span>{account.platformUsername}</span><Badge variant="secondary" className="ml-auto capitalize">{account.platform}</Badge></label>)}</div>}</CardContent></Card>

            <Card><CardHeader><CardTitle>AI content preferences</CardTitle><CardDescription>These preferences travel with every recurring generation.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div><Label>Industry or niche</Label><Input className="mt-2" value={form.industryNiche} onChange={event => update('industryNiche', event.target.value)} placeholder="Software development" /></div><div><Label>Brand name <span className="text-muted-foreground">(optional)</span></Label><Input className="mt-2" value={form.brandName} onChange={event => update('brandName', event.target.value)} /></div><div><Label>Target audience</Label><Input className="mt-2" value={form.audienceType} onChange={event => update('audienceType', event.target.value)} placeholder="Developers" /></div><div><Label>Tone</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.contentTone} onChange={event => update('contentTone', event.target.value)}>{tones.map(tone => <option key={tone}>{tone}</option>)}</select></div></div><div><Label>Content goals</Label><div className="mt-2 flex flex-wrap gap-2">{goals.map(goal => <label key={goal} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Checkbox checked={form.contentGoals.includes(goal)} onCheckedChange={() => toggleInList('contentGoals', goal)} />{goal}</label>)}</div></div><div><Label>Preferred content types</Label><div className="mt-2 flex flex-wrap gap-2">{contentTypes.map(type => <label key={type} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Checkbox checked={form.preferredContentTypes.includes(type)} onCheckedChange={() => toggleInList('preferredContentTypes', type)} />{type}</label>)}</div></div><div><Label>Media preference</Label><div className="mt-2 flex flex-wrap gap-2">{mediaOptions.map(option => <button type="button" key={option.value} onClick={() => update('mediaPreference', option.value)} className={`rounded-md border px-3 py-2 text-sm ${form.mediaPreference === option.value ? 'border-primary bg-primary/10' : ''}`}>{option.label}</button>)}</div></div><div className="grid gap-4 md:grid-cols-2"><div><Label>Topics to include</Label><Textarea className="mt-2" value={form.topicPreferences} onChange={event => update('topicPreferences', event.target.value)} placeholder="AI, React, Node.js" /></div><div><Label>Topics to avoid</Label><Textarea className="mt-2" value={form.excludedTopics} onChange={event => update('excludedTopics', event.target.value)} placeholder="Politics, competitor brands" /></div></div></CardContent></Card>
            <div className="flex justify-end"><Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />Save automation</Button></div>
        </div>
    )
}

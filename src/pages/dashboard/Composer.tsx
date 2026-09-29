import { useState, useEffect, useRef } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Sparkles,
  PenLine,
  Send,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Linkedin,
  Twitter,
  RefreshCw,
  Wand2,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  X,
  FileUp,
  Video,
  Zap,
  Scissors,
  Hash,
  Lightbulb,
  Compass,
  ArrowRight,
  Search,
  Globe,
  Music2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Account {
  _id: string
  platform: string
  platformUsername: string
  name?: string
  picture?: string
}

interface ModerationResult {
  safe: boolean
  flags: string[]
  score: number
}

type PostFormat = 'text' | 'image' | 'video' | 'article' | 'document'

const formatOptions = [
  { id: 'text', label: 'Text Thought Leadership', icon: FileText, desc: 'Provocative hooks & insights' },
  { id: 'image', label: 'Image + Caption', icon: ImageIcon, desc: 'Infographics & visuals' },
  { id: 'video', label: 'Video + Caption', icon: Video, desc: 'Engaging clips & walkthroughs' },
  { id: 'article', label: 'Article / Link', icon: LinkIcon, desc: 'Industry news & analysis' },
  { id: 'document', label: 'Document / PDF Slide Deck', icon: FileUp, desc: 'Multi-page carousels' },
]

const DEFAULT_NICHES = [
  'AI & Autonomous Agents',
  'Cloud Architecture & DevOps',
  'Software Engineering & System Design',
  'Startup Scaling & Venture',
  'Product Strategy & B2B SaaS',
]

const STEPS = [
  { label: 'Method', description: 'Creation mode' },
  { label: 'AI Thought Studio', description: 'Topic & strategy' },
  { label: 'Polish & Media', description: 'Refine & preview' },
  { label: 'Publish', description: 'Instant or schedule' },
]

export default function Composer() {
  const [step, setStep] = useState(0)

  // Step 0 – method
  const [method, setMethod] = useState<'ai' | 'manual'>('ai')

  // Step 1 – AI Thought Studio
  const [niche, setNiche] = useState('AI & Autonomous Agents')
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('Visionary Thought Leader')
  const [audience, setAudience] = useState('Founders, CTOs & Engineering Leaders')
  const [postGoal, setPostGoal] = useState('Provocative Insight & Framework')
  const [generating, setGenerating] = useState(false)
  const [generationPhase, setGenerationPhase] = useState('Crafting viral hook...')

  // Step 2 – Format & Content
  const [postFormat, setPostFormat] = useState<PostFormat>('text')
  const [content, setContent] = useState('')
  const [refiningAction, setRefiningAction] = useState<string | null>(null)

  // Media states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkDesc, setLinkDesc] = useState('')

  const [docFile, setDocFile] = useState<File | null>(null)
  const [docTitle, setDocTitle] = useState('')

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Media selector dialog
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [activeMediaTab, setActiveMediaTab] = useState<'device' | 'unsplash' | 'pexels'>('unsplash')
  const [mediaSearchQuery, setMediaSearchQuery] = useState('')
  const [searchingMedia, setSearchingMedia] = useState(false)
  const [unsplashResults, setUnsplashResults] = useState<Array<{ id: string; url: string; thumb: string; alt: string; author: string }>>([])
  const [pexelsResults, setPexelsResults] = useState<Array<{ id: number; url: string; thumb: string; alt: string; photographer: string }>>([])

  // Moderation
  const [moderating, setModerating] = useState(false)
  const [modResult, setModResult] = useState<ModerationResult | null>(null)

  // Step 3 – publish
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin'])
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'queue'>('now')
  const [scheduledFor, setScheduledFor] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    api.get('/social/accounts')
      .then((res) => {
        const accs = Array.isArray(res.data) ? res.data : []
        setAccounts(accs)
        if (accs.length > 0) {
          setSelectedPlatforms(accs.map((a: Account) => a.platform))
        }
      })
      .catch(() => { })
  }, [])

  // Auto-fetch topic suggestions when moving to step 1
  useEffect(() => {
    if (step === 1 && suggestedTopics.length === 0) {
      fetchTopicSuggestions()
    }
  }, [step])

  // ─── Fetch AI Topic Suggestions ───────────────────────────────────────
  const fetchTopicSuggestions = async (customNiche?: string) => {
    setLoadingTopics(true)
    try {
      const res = await api.post('/ai/suggest-topics', { niche: customNiche || niche })
      if (res.data?.topics && Array.isArray(res.data.topics)) {
        setSuggestedTopics(res.data.topics)
      }
    } catch {
      // Fallback topics
      setSuggestedTopics([
        'The shift from manual social posting to autonomous AI agents',
        'Why scaling cloud infrastructure before defining AI governance is costly chaos',
        '3 architecture patterns that modern engineering teams are adopting in 2026',
        'The hardest mental shifts going from Senior Developer to Tech Lead',
        'Why clean code without direct business alignment is hidden technical debt'
      ])
    } finally {
      setLoadingTopics(false)
    }
  }

  // ─── AI Generation ────────────────────────────────────────────────────
  const generateThoughtLeadership = async () => {
    if (!topic.trim()) { toast.error('Please select or enter a topic'); return }
    setGenerating(true)
    setGenerationPhase('Analyzing thought leadership angle...')

    const phaseTimer1 = setTimeout(() => setGenerationPhase('Crafting scroll-stopping hook...'), 800)
    const phaseTimer2 = setTimeout(() => setGenerationPhase('Structuring actionable framework & insights...'), 1600)

    try {
      const res = await api.post('/ai/generate', {
        topic: `${topic} (Goal: ${postGoal})`,
        tone,
        audience,
        postType: postFormat,
        platform: 'linkedin'
      })

      const generated = res.data.content || res.data.text || ''
      setContent(generated)
      toast.success('Thought leadership post generated successfully!')
      setStep(2)

      // Auto-run moderation check in background
      api.post('/ai/moderate', { content: generated })
        .then((mRes) => setModResult(mRes.data))
        .catch(() => { })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI Generation failed. Please try again.')
    } finally {
      clearTimeout(phaseTimer1)
      clearTimeout(phaseTimer2)
      setGenerating(false)
    }
  }

  // ─── AI Refinements (One-Click Polish) ─────────────────────────────────
  const refineContent = async (action: 'hook' | 'shorten' | 'expand' | 'hashtags') => {
    if (!content.trim()) return
    setRefiningAction(action)
    try {
      const res = await api.post('/ai/refine', { content, action })
      if (res.data?.content) {
        setContent(res.data.content)
        const actionLabels: Record<string, string> = {
          hook: 'Scroll-stopping hook updated!',
          shorten: 'Post condensed and made punchier!',
          expand: 'Deepened with actionable frameworks!',
          hashtags: 'Trending hashtags updated!'
        }
        toast.success(actionLabels[action] || 'Post refined!')
      }
    } catch {
      toast.error('Refinement failed')
    } finally {
      setRefiningAction(null)
    }
  }

  // ─── Image file handler ───────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPG, WEBP)')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setImageUrl('')
    }
  }

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        toast.error('Please select a PDF document')
        return
      }
      setDocFile(file)
      if (!docTitle) setDocTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file (MP4, WebM, MOV)')
        return
      }
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
      setVideoUrl('')
    }
  }

  // ─── Media Search (Unsplash / Pexels) ────────────────────────────────
  const searchMedia = async (tab: 'unsplash' | 'pexels', queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : mediaSearchQuery).trim()
    if (!q) return
    setSearchingMedia(true)
    try {
      if (tab === 'unsplash') {
        const res = await api.get(`/media/unsplash?query=${encodeURIComponent(q)}`)
        const photos = res.data?.photos || res.data?.results || []
        setUnsplashResults(photos.map((p: any) => ({
          id: p.id,
          url: p.fullUrl || p.urls?.regular || p.urls?.full || p.previewUrl,
          thumb: p.thumbUrl || p.urls?.thumb || p.urls?.small || p.previewUrl,
          alt: p.description || p.alt_description || q,
          author: p.author?.name || p.user?.name || 'Photographer'
        })))
      } else {
        const res = await api.get(`/media/pexels?query=${encodeURIComponent(q)}`)
        const photos = res.data?.photos || res.data?.results || []
        setPexelsResults(photos.map((p: any) => ({
          id: p.id,
          url: p.fullUrl || p.src?.large || p.src?.original || p.previewUrl,
          thumb: p.thumbUrl || p.src?.small || p.src?.medium || p.previewUrl,
          alt: p.description || p.alt || q,
          photographer: p.author?.name || p.photographer || 'Photographer'
        })))
      }
    } catch {
      toast.error('Media search failed. Please try again.')
    } finally {
      setSearchingMedia(false)
    }
  }

  const handleMediaTabChange = (tab: 'unsplash' | 'pexels') => {
    setActiveMediaTab(tab)
    if (mediaSearchQuery.trim()) {
      searchMedia(tab)
    }
  }

  const openStockLibrary = (tab: 'unsplash' | 'pexels' = 'unsplash') => {
    setMediaDialogOpen(true)
    setActiveMediaTab(tab)
    const initialQuery = mediaSearchQuery.trim() || topic.trim() || 'technology'
    if (!mediaSearchQuery.trim()) {
      setMediaSearchQuery(initialQuery)
    }
    searchMedia(tab, initialQuery)
  }

  const selectMediaImage = (url: string) => {
    setImageUrl(url)
    setImagePreview(url)
    setImageFile(null)
    setMediaDialogOpen(false)
    toast.success('Image selected successfully')
  }

  // ─── Manual Moderation ────────────────────────────────────────────────
  const moderate = async () => {
    if (!content.trim()) { toast.error('Content is empty'); return }
    setModerating(true)
    try {
      const res = await api.post('/ai/moderate', { content })
      setModResult(res.data)
      if (res.data.safe) toast.success('Content passed compliance check!')
      else toast.warning('Content has compliance flags — please review')
    } catch {
      toast.error('Moderation check failed')
    } finally {
      setModerating(false)
    }
  }

  // ─── Toggle platform ──────────────────────────────────────────────────
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  // ─── Direct Publish or Schedule ───────────────────────────────────────
  const publish = async () => {
    if (!content.trim()) { toast.error('Post commentary is empty'); return }
    if (selectedPlatforms.length === 0) { toast.error('Select at least one connected platform'); return }

    if (postFormat === 'article' && !linkUrl.trim()) {
      toast.error('Please provide an article/link URL'); return
    }
    if (postFormat === 'image' && !imageFile && !imageUrl.trim()) {
      toast.error('Please upload an image or provide an image URL'); return
    }
    if (postFormat === 'document' && !docFile) {
      toast.error('Please upload a PDF document'); return
    }
    if (postFormat === 'video' && !videoFile && !videoUrl.trim()) {
      toast.error('Please upload a video file or provide a video URL'); return
    }
    if (selectedPlatforms.includes('instagram') && !['image', 'video'].includes(postFormat)) {
      toast.error('Choose Image + Caption or Video + Caption to publish on Instagram')
      return
    }
    if (selectedPlatforms.includes('tiktok') && (postFormat !== 'video' || !videoFile)) {
      toast.error('TikTok requires a video file upload')
      return
    }
    if (publishMode === 'schedule' && !scheduledFor) {
      toast.error('Please pick a schedule date & time'); return
    }

    setPublishing(true)

    try {
      if (publishMode === 'now') {
        let publishedAny = false

        // 1. LinkedIn Publishing
        if (selectedPlatforms.includes('linkedin')) {
          try {
            if (postFormat === 'text') {
              const res = await api.post('/social/linkedin/post/text', { text: content })
              toast.success('Published live to LinkedIn!', {
                description: `Post URN: ${res.data.postId}`,
                duration: 6000
              })
              publishedAny = true
            } else if (postFormat === 'image') {
              if (imageFile) {
                const formData = new FormData()
                formData.append('text', content)
                formData.append('image', imageFile)
                const res = await api.post('/social/linkedin/post/image', formData)
                toast.success('Image post published live to LinkedIn!', {
                  description: `Post URN: ${res.data.postId}`,
                  duration: 6000
                })
                publishedAny = true
              } else {
                const res = await api.post('/social/linkedin/post/image', { text: content, imageUrl })
                toast.success('Image post published live to LinkedIn!', {
                  description: `Post URN: ${res.data.postId}`,
                  duration: 6000
                })
                publishedAny = true
              }
            } else if (postFormat === 'article') {
              const res = await api.post('/social/linkedin/post/article', {
                text: content,
                url: linkUrl,
                title: linkTitle || linkUrl,
                description: linkDesc
              })
              toast.success('Article post published live to LinkedIn!', {
                description: `Post URN: ${res.data.postId}`,
                duration: 6000
              })
              publishedAny = true
            } else if (postFormat === 'document') {
              const formData = new FormData()
              formData.append('text', content)
              formData.append('title', docTitle || 'Document')
              formData.append('document', docFile!)
              const res = await api.post('/social/linkedin/post/document', formData)
              toast.success('Document slide deck published live to LinkedIn!', {
                description: `Post URN: ${res.data.postId}`,
                duration: 6000
              })
              publishedAny = true
            } else if (postFormat === 'video') {
              if (videoFile) {
                const formData = new FormData()
                formData.append('text', content)
                formData.append('video', videoFile)
                formData.append('file', videoFile)
                const res = await api.post('/social/linkedin/post/video', formData)
                toast.success('Video post published live to LinkedIn!', {
                  description: `Post URN: ${res.data.postId}`,
                  duration: 6000
                })
                publishedAny = true
              } else if (videoUrl) {
                const res = await api.post('/social/linkedin/post/video', { text: content, videoUrl })
                toast.success('Video post published live to LinkedIn!', {
                  description: `Post URN: ${res.data.postId}`,
                  duration: 6000
                })
                publishedAny = true
              }
            }
          } catch (liErr: any) {
            toast.error(liErr.response?.data?.message || 'LinkedIn publishing failed')
          }
        }

        // 2. Facebook Publishing
        if (selectedPlatforms.includes('facebook')) {
          try {
            if (postFormat === 'text') {
              const res = await api.post('/social/facebook/post/text', { message: content })
              toast.success('Published live to Facebook!', {
                description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                duration: 6000
              })
              publishedAny = true
            } else if (postFormat === 'image') {
              if (imageFile) {
                const formData = new FormData()
                formData.append('caption', content)
                formData.append('image', imageFile)
                const res = await api.post('/social/facebook/post/image', formData)
                toast.success('Image post published live to Facebook!', {
                  description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                  duration: 6000
                })
                publishedAny = true
              } else {
                const res = await api.post('/social/facebook/post/image', { caption: content, imageUrl })
                toast.success('Image post published live to Facebook!', {
                  description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                  duration: 6000
                })
                publishedAny = true
              }
            } else if (postFormat === 'article') {
              const res = await api.post('/social/facebook/post/text', {
                message: content,
                link: linkUrl
              })
              toast.success('Article link published live to Facebook!', {
                description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                duration: 6000
              })
              publishedAny = true
            } else if (postFormat === 'document') {
              const res = await api.post('/social/facebook/post/text', {
                message: `${docTitle ? docTitle + '\n\n' : ''}${content}`
              })
              toast.success('Published update to Facebook!', {
                description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                duration: 6000
              })
              publishedAny = true
            } else if (postFormat === 'video') {
              if (videoFile) {
                const formData = new FormData()
                formData.append('text', content)
                formData.append('description', content)
                formData.append('video', videoFile)
                formData.append('file', videoFile)
                const res = await api.post('/social/facebook/post/video', formData)
                toast.success('Video post published live to Facebook!', {
                  description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                  duration: 6000
                })
                publishedAny = true
              } else if (videoUrl) {
                const res = await api.post('/social/facebook/post/video', {
                  text: content,
                  description: content,
                  videoUrl
                })
                toast.success('Video post published live to Facebook!', {
                  description: res.data?.postId ? `Post ID: ${res.data.postId}` : 'Published to Page',
                  duration: 6000
                })
                publishedAny = true
              }
            }
          } catch (fbErr: any) {
            toast.error(fbErr.response?.data?.message || 'Facebook publishing failed')
          }
        }

        // 3. Instagram Publishing (images and videos are published as feed media/Reels)
        if (selectedPlatforms.includes('instagram')) {
          try {
            let mediaUrl = postFormat === 'image' ? imageUrl : videoUrl
            if (!mediaUrl) {
              const file = postFormat === 'image' ? imageFile : videoFile
              if (file) {
                const formData = new FormData()
                formData.append('file', file)
                const uploadRes = await api.post('/media/upload', formData)
                mediaUrl = uploadRes.data?.url || ''
              }
            }
            if (!mediaUrl) throw new Error('Instagram requires a public media URL')
            const endpoint = postFormat === 'image' ? '/social/instagram/post/image' : '/social/instagram/post/reel'
            const payload = postFormat === 'image' ? { imageUrl: mediaUrl, caption: content } : { videoUrl: mediaUrl, caption: content, shareToFeed: true }
            const res = await api.post(endpoint, payload)
            toast.success(`${postFormat === 'image' ? 'Image' : 'Reel'} published live to Instagram!`, {
              description: res.data?.mediaId ? `Media ID: ${res.data.mediaId}` : 'Published to Instagram',
              duration: 6000
            })
            publishedAny = true
          } catch (igErr: any) {
            toast.error(igErr.response?.data?.message || igErr.message || 'Instagram publishing failed')
          }
        }

        // 4. TikTok requires a video file for the Content Posting API upload flow.
        if (selectedPlatforms.includes('tiktok')) {
          try {
            if (postFormat !== 'video' || !videoFile) {
              throw new Error('TikTok requires a video file upload')
            }
            const formData = new FormData()
            formData.append('video', videoFile)
            formData.append('title', content)
            const res = await api.post('/social/tiktok/post/video', formData)
            toast.success('Video sent to TikTok!', {
              description: res.data?.publishId ? `Publish ID: ${res.data.publishId}` : 'TikTok is processing the video',
              duration: 6000
            })
            publishedAny = true
          } catch (ttErr: any) {
            toast.error(ttErr.response?.data?.message || ttErr.message || 'TikTok publishing failed')
          }
        }

        if (!publishedAny) {
          let finalMediaUrl = imageUrl || (imageFile ? imageFile.name : undefined)
          if (postFormat === 'video') {
            finalMediaUrl = videoUrl
            if (videoFile && !finalMediaUrl) {
              const formData = new FormData()
              formData.append('file', videoFile)
              formData.append('video', videoFile)
              const uploadRes = await api.post('/media/upload', formData)
              finalMediaUrl = uploadRes.data?.url
            }
          } else if (postFormat === 'image' && imageFile && !imageUrl) {
            try {
              const formData = new FormData()
              formData.append('file', imageFile)
              formData.append('image', imageFile)
              const uploadRes = await api.post('/media/upload', formData)
              finalMediaUrl = uploadRes.data?.url
            } catch {
              // fallback
            }
          }

          await api.post('/posts', {
            content,
            contentText: content,
            postType: postFormat.toUpperCase(),
            platforms: selectedPlatforms,
            status: 'queued',
            linkUrl: postFormat === 'article' ? linkUrl : undefined,
            title: postFormat === 'article' ? linkTitle : (postFormat === 'document' ? docTitle : undefined),
            mediaUrl: finalMediaUrl
          })
          toast.success('Post saved to queue!')
        }
      } else {
        let finalMediaUrl = imageUrl || (imageFile ? imageFile.name : undefined)
        if (postFormat === 'video') {
          finalMediaUrl = videoUrl
          if (videoFile && !finalMediaUrl) {
            toast.info('Uploading video to cloud storage...')
            const formData = new FormData()
            formData.append('file', videoFile)
            formData.append('video', videoFile)
            const uploadRes = await api.post('/media/upload', formData)
            finalMediaUrl = uploadRes.data?.url
          }
        } else if (postFormat === 'image' && imageFile && !imageUrl) {
          try {
            const formData = new FormData()
            formData.append('file', imageFile)
            const uploadRes = await api.post('/media/upload', formData)
            finalMediaUrl = uploadRes.data?.url
          } catch {
            // fallback
          }
        }

        await api.post('/posts', {
          content,
          contentText: content,
          postType: postFormat.toUpperCase(),
          platforms: selectedPlatforms,
          status: publishMode === 'schedule' ? 'scheduled' : 'queued',
          scheduledFor: publishMode === 'schedule' ? scheduledFor : undefined,
          linkUrl: postFormat === 'article' ? linkUrl : undefined,
          title: postFormat === 'article' ? linkTitle : (postFormat === 'document' ? docTitle : undefined),
          mediaUrl: finalMediaUrl
        })

        toast.success(publishMode === 'schedule' ? 'Post scheduled successfully!' : 'Post added to queue!')
      }

      // Reset
      setStep(0)
      setContent('')
      setTopic('')
      setImageFile(null)
      setImagePreview(null)
      setDocFile(null)
      setVideoFile(null)
      setVideoPreview(null)
      setVideoUrl('')
      setLinkUrl('')
      setLinkTitle('')
      setLinkDesc('')
      setModResult(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to publish post')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Content Composer</h1>
        <p className="text-muted-foreground">Craft high-impact thought leadership content using LLM intelligence</p>
      </div>

      {/* ── Steps Progress Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  i < step
                    ? 'bg-primary border-primary text-primary-foreground'
                    : i === step
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-muted text-muted-foreground'
                )}
              >
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-xs mt-1 hidden sm:block',
                i === step ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mt-[-10px]', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Method ──────────────────────────────────────────────── */}
      {step === 0 && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>How would you like to create content?</CardTitle>
            <CardDescription>Choose autonomous AI thought leadership or manual writing</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMethod('ai')}
              className={cn(
                'rounded-xl border-2 p-6 text-left transition-all hover:shadow-md relative overflow-hidden',
                method === 'ai' ? 'border-blue-600 bg-blue-50/40' : 'border-border hover:border-muted-foreground/40'
              )}
            >
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-3">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                AI-Assisted Thought Studio
                <Badge variant="default" className="text-[10px] bg-blue-600">Recommended</Badge>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate tailored thought leadership posts using high-performance LLM intelligence. Includes viral hooks, frameworks, and engagement questions.
              </p>
              {method === 'ai' && (
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <span>Selected</span>
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
              )}
            </button>

            <button
              onClick={() => setMethod('manual')}
              className={cn(
                'rounded-xl border-2 p-6 text-left transition-all hover:shadow-md relative',
                method === 'manual' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
              )}
            >
              <div className="p-3 bg-muted rounded-xl w-fit mb-3">
                <PenLine className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-1">Manual Composer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Draft your own posts from scratch with complete creative control over commentary, images, links, and PDF presentations.
              </p>
              {method === 'manual' && (
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
                  <span>Selected</span>
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 1: AI Thought Leadership Studio ────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Inspiration / Trending Topics Bar */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 via-background to-background">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">Trending Thought Leadership Ideas</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTopicSuggestions()}
                  disabled={loadingTopics}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', loadingTopics ? 'animate-spin' : '')} />
                  New Ideas
                </Button>
              </div>
              <CardDescription className="text-xs">
                Click any trending angle below to load it into your prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Niche Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs pb-1">
                <span className="text-muted-foreground font-medium mr-1">Industry:</span>
                {DEFAULT_NICHES.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNiche(n); fetchTopicSuggestions(n) }}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                      niche === n
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Generated Topic Pills */}
              {loadingTopics ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Generating trending viral angles with AI...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {suggestedTopics.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTopic(t)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between gap-2 group',
                        topic === t
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-medium'
                          : 'border-border/60 hover:border-blue-300 hover:bg-muted/40'
                      )}
                    >
                      <span className="line-clamp-2">{t}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                Strategic Post Parameters
              </CardTitle>
              <CardDescription>Tailor the tone, audience, and post format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="topic">Topic / Core Thesis *</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g. Why most teams fail at scaling autonomous AI agents, 3 counter-intuitive architecture decisions..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tone & Style</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visionary Thought Leader">Visionary Thought Leader</SelectItem>
                      <SelectItem value="Executive & Strategic">Executive & Strategic</SelectItem>
                      <SelectItem value="Technical & Architecture">Technical & Architecture</SelectItem>
                      <SelectItem value="Contrarian & Bold">Contrarian & Provocative</SelectItem>
                      <SelectItem value="Inspirational & Storytelling">Inspirational & Storytelling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Target Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Founders, CTOs & Engineering Leaders">Founders & CTOs</SelectItem>
                      <SelectItem value="Senior Software Engineers & Architects">Software Architects</SelectItem>
                      <SelectItem value="Product Managers & Designers">Product Leaders</SelectItem>
                      <SelectItem value="General Tech & SaaS Professionals">General Tech Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Post Format</Label>
                  <Select value={postFormat} onValueChange={(val: PostFormat) => setPostFormat(val)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Commentary</SelectItem>
                      <SelectItem value="image">Image + Caption</SelectItem>
                      <SelectItem value="video">Video + Caption</SelectItem>
                      <SelectItem value="article">Article / Link Preview</SelectItem>
                      <SelectItem value="document">PDF Carousel Deck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 2: Content Polish & Interactive Refinement ─────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Format Selector Pills */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Post Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {formatOptions.map((fmt) => {
                  const Icon = fmt.icon
                  const active = postFormat === fmt.id
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setPostFormat(fmt.id as PostFormat)}
                      className={cn(
                        'rounded-lg border-2 p-3 text-left transition-all',
                        active
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 mb-1.5', active ? 'text-blue-600' : 'text-muted-foreground')} />
                      <p className="font-semibold text-xs leading-tight">{fmt.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{fmt.desc}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Format Media Inputs */}
          {postFormat === 'image' && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  Attach Image Graphic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs">
                    <Upload className="h-4 w-4" />
                    {imageFile ? 'Change Image' : 'Upload Image File'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openStockLibrary('unsplash')}
                    className="gap-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Globe className="h-4 w-4" />
                    Browse Stock Photos
                  </Button>
                  {imageFile && (
                    <Badge variant="secondary" className="gap-1.5 items-center text-xs">
                      {imageFile.name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => { setImageFile(null); setImagePreview(null) }} />
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Or provide Image URL directly</Label>
                  <Input
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setImagePreview(e.target.value); setImageFile(null) }}
                    className="h-8 text-xs"
                  />
                </div>
                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden border max-w-sm max-h-48 mt-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); setImageUrl('') }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {postFormat === 'video' && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  Attach Video Clip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input type="file" ref={videoInputRef} onChange={handleVideoSelect} onClick={(e) => { (e.target as HTMLInputElement).value = '' }} accept="video/*" className="hidden" />
                <div className="flex flex-wrap gap-2 items-center">
                  <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} className="gap-2 text-xs">
                    <Upload className="h-4 w-4" />
                    {videoFile ? 'Change Video File' : 'Upload Video File'}
                  </Button>
                  {videoFile && (
                    <Badge variant="secondary" className="gap-1.5 items-center text-xs">
                      <Video className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[200px]">{videoFile.name}</span>
                      <span className="text-[10px] text-muted-foreground">({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => { setVideoFile(null); setVideoPreview(null) }} />
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Or provide Hosted Video URL directly</Label>
                  <Input
                    placeholder="https://res.cloudinary.com/... or https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={(e) => { setVideoUrl(e.target.value); setVideoPreview(e.target.value); setVideoFile(null) }}
                    className="h-8 text-xs"
                  />
                </div>

                {videoPreview && (
                  <div className="relative rounded-lg overflow-hidden border max-w-md mt-2 bg-black">
                    <video src={videoPreview} controls className="w-full max-h-56 rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={() => { setVideoFile(null); setVideoPreview(null); setVideoUrl('') }}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {postFormat === 'article' && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                  Article / Link Preview Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Destination URL *</Label>
                  <Input
                    placeholder="https://github.com/my-project or https://yourblog.com/article"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Preview Title (Optional)</Label>
                    <Input
                      placeholder="e.g. Scaling AI Workloads in Production"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preview Description (Optional)</Label>
                    <Input
                      placeholder="Brief card summary"
                      value={linkDesc}
                      onChange={(e) => setLinkDesc(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {postFormat === 'document' && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-blue-600" />
                  PDF Slide Deck / Carousel Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input type="file" ref={docInputRef} onChange={handleDocSelect} accept="application/pdf" className="hidden" />
                <div className="flex gap-2 items-center">
                  <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} className="gap-2 text-xs">
                    <Upload className="h-4 w-4" />
                    {docFile ? 'Replace PDF' : 'Upload PDF Document'}
                  </Button>
                  {docFile && (
                    <Badge variant="secondary" className="gap-1.5 items-center text-xs">
                      <FileUp className="h-3 w-3 shrink-0" /> {docFile.name} ({(docFile.size / 1024).toFixed(0)} KB)
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setDocFile(null)} />
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Document Title</Label>
                  <Input
                    placeholder="e.g. 5 Architectural Shifts in 2026"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Commentary & One-Click AI Refine Studio */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">2. Post Commentary & Copy</CardTitle>
                  <CardDescription className="text-xs">Review and use one-click AI refinements</CardDescription>
                </div>

                {/* AI Refinement Action Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refineContent('hook')}
                    disabled={!!refiningAction || !content.trim()}
                    className="h-7 text-[11px] gap-1 px-2 text-blue-700 bg-blue-50/60 border-blue-200 hover:bg-blue-100"
                  >
                    {refiningAction === 'hook' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 text-amber-500" />}
                    Punchier Hook
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refineContent('shorten')}
                    disabled={!!refiningAction || !content.trim()}
                    className="h-7 text-[11px] gap-1 px-2"
                  >
                    {refiningAction === 'shorten' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}
                    Trim & Shorten
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refineContent('expand')}
                    disabled={!!refiningAction || !content.trim()}
                    className="h-7 text-[11px] gap-1 px-2"
                  >
                    {refiningAction === 'expand' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                    Add Framework
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refineContent('hashtags')}
                    disabled={!!refiningAction || !content.trim()}
                    className="h-7 text-[11px] gap-1 px-2"
                  >
                    {refiningAction === 'hashtags' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hash className="h-3 w-3" />}
                    Hashtags
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Write or edit your thought leadership post..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[220px] font-sans text-sm leading-relaxed"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-3">
                  <span>{content.length} chars</span>
                  <span>•</span>
                  <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                  <span>•</span>
                  <span className={cn(
                    content.length >= 800 && content.length <= 2000 ? 'text-green-600 font-medium' : ''
                  )}>
                    {content.length >= 800 && content.length <= 2000 ? 'Optimal LinkedIn Length' : 'Estimated read: ~45s'}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={moderate}
                  disabled={moderating || !content.trim()}
                  className="h-7 text-xs"
                >
                  {moderating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  Check Compliance
                </Button>
              </div>

              {modResult && (
                <div className={cn(
                  'rounded-lg p-2.5 text-xs flex items-center gap-2',
                  modResult.safe ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                )}>
                  {modResult.safe ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{modResult.safe ? `Safety score: ${modResult.score}/100 • Passed compliance moderation.` : 'Potential compliance flags detected.'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 3: Distribution & Publishing ──────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Target Accounts</CardTitle>
              <CardDescription>Select connected accounts to publish this {postFormat} post to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts connected. Please go to Connect Platforms to link LinkedIn.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {accounts.map((acc) => {
                    const selected = selectedPlatforms.includes(acc.platform)
                    return (
                      <div
                        key={acc._id}
                        onClick={() => togglePlatform(acc.platform)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                          selected ? 'border-blue-600 bg-blue-50/40' : 'border-border hover:border-muted-foreground/30'
                        )}
                      >
                        <Checkbox checked={selected} onCheckedChange={() => togglePlatform(acc.platform)} />
                        {acc.platform === 'linkedin'
                          ? <Linkedin className="h-5 w-5 text-blue-600 shrink-0" />
                          : acc.platform === 'tiktok'
                            ? <Music2 className="h-5 w-5 text-slate-900 shrink-0" />
                            : <Twitter className="h-5 w-5 text-sky-500 shrink-0" />}
                        <div className="truncate">
                          <p className="font-semibold text-xs capitalize">{acc.platform}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{acc.name || acc.platformUsername}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publishing Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    publishMode === 'now' ? 'border-blue-600 bg-blue-50/50' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <Send className={cn('h-5 w-5 mb-1.5', publishMode === 'now' ? 'text-blue-600' : 'text-muted-foreground')} />
                  <p className="font-semibold text-xs">Publish Now</p>
                  <p className="text-[11px] text-muted-foreground">Live post immediately</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    publishMode === 'schedule' ? 'border-blue-600 bg-blue-50/50' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <Clock className={cn('h-5 w-5 mb-1.5', publishMode === 'schedule' ? 'text-blue-600' : 'text-muted-foreground')} />
                  <p className="font-semibold text-xs">Schedule</p>
                  <p className="text-[11px] text-muted-foreground">Pick date & time</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishMode('queue')}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    publishMode === 'queue' ? 'border-blue-600 bg-blue-50/50' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <FileText className={cn('h-5 w-5 mb-1.5', publishMode === 'queue' ? 'text-blue-600' : 'text-muted-foreground')} />
                  <p className="font-semibold text-xs">Save to Queue</p>
                  <p className="text-[11px] text-muted-foreground">Review or publish later</p>
                </button>
              </div>

              {publishMode === 'schedule' && (
                <div className="space-y-2 pt-2">
                  <Label>Scheduled Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Navigation Buttons ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 2 && method === 'manual') setStep(0)
            else setStep((s) => Math.max(0, s - 1))
          }}
          disabled={step === 0 || publishing || generating}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => {
              if (step === 0 && method === 'manual') setStep(2)
              else if (step === 0 && method === 'ai') setStep(1)
              else if (step === 1) generateThoughtLeadership()
              else if (step === 2) setStep(3)
            }}
            disabled={
              (step === 1 && (!topic.trim() || generating)) ||
              (step === 2 && !content.trim())
            }
            className={cn(
              step === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium shadow-sm' : ''
            )}
          >
            {step === 1 && generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{generationPhase}</span>
              </>
            ) : (
              <>
                {step === 1 ? (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Thought Leadership</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={publish}
            disabled={publishing || selectedPlatforms.length === 0}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing to LinkedIn...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {publishMode === 'now' ? 'Publish Now to LinkedIn' : publishMode === 'schedule' ? 'Schedule Post' : 'Save to Queue'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* ── Unsplash / Pexels Media Selector Dialog ───────────────────────── */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Stock Photo Library
            </DialogTitle>
            <DialogDescription>
              Search millions of free photos from Unsplash and Pexels
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeMediaTab} onValueChange={(v) => handleMediaTabChange(v as 'unsplash' | 'pexels')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unsplash" className="text-xs gap-1.5">Unsplash</TabsTrigger>
              <TabsTrigger value="pexels" className="text-xs gap-1.5">Pexels</TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Search photos (e.g. technology, workspace, AI)..."
                value={mediaSearchQuery}
                onChange={(e) => setMediaSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchMedia(activeMediaTab === 'unsplash' ? 'unsplash' : 'pexels') }}
                className="h-9 text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => searchMedia(activeMediaTab === 'unsplash' ? 'unsplash' : 'pexels')}
                disabled={searchingMedia || !mediaSearchQuery.trim()}
                className="gap-1.5 px-4"
              >
                {searchingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            {/* Unsplash Results */}
            <TabsContent value="unsplash" className="flex-1 overflow-y-auto mt-3">
              {unsplashResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Search Unsplash for free photos</p>
                  <p className="text-xs mt-1">Type a keyword and press Enter or click Search</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {unsplashResults.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => selectMediaImage(photo.url)}
                      className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                        <span className="text-white text-[10px] px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                          by {photo.author}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pexels Results */}
            <TabsContent value="pexels" className="flex-1 overflow-y-auto mt-3">
              {pexelsResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Search Pexels for free photos</p>
                  <p className="text-xs mt-1">Type a keyword and press Enter or click Search</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {pexelsResults.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => selectMediaImage(photo.url)}
                      className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                        <span className="text-white text-[10px] px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                          by {photo.photographer}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

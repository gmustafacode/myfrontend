import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, ShieldCheck, Database, Eye, BellRing, Sparkles } from 'lucide-react'

const sections = [
    {
        title: '1. What data we access',
        icon: Database,
        paragraphs: [
            'When you connect Facebook to SocialSync, we may access only the Facebook account information and permissions needed to help you manage and publish content on your behalf.',
            'This may include your page and profile information, page access tokens, media metadata, post content, schedules, analytics data, and basic account details that Facebook makes available through its API.',
        ],
    },
    {
        title: '2. Why we use it',
        icon: Sparkles,
        paragraphs: [
            'We use this access to create, review, schedule, publish, and analyze Facebook content across the connected accounts you choose in SocialSync.',
            'We do not use your Facebook data to build unrelated ad profiles, sell personal information, or target you outside the purpose of providing the SocialSync service you requested.',
        ],
    },
    {
        title: '3. Your privacy controls',
        icon: Eye,
        paragraphs: [
            'You control which Facebook pages or accounts are connected to SocialSync and can disconnect them at any time from the app settings or directly from your Facebook account settings.',
            'If you remove a connection, we stop using that account for future actions. Some permissions already granted to Facebook may remain active until you revoke them from Facebook itself.',
        ],
    },
    {
        title: '4. Data protection',
        icon: ShieldCheck,
        paragraphs: [
            'We protect access to your Facebook account data using industry-standard technical and organizational safeguards, including encryption in transit and restricted access controls.',
            'Access is limited to the minimum data needed to operate the service, and only authorized personnel who need it for support, maintenance, or security review can access it.',
        ],
    },
    {
        title: '5. Notifications and content',
        icon: BellRing,
        paragraphs: [
            'SocialSync may use Facebook content and performance data to generate drafts, summaries, scheduling recommendations, and analytics insights for your account.',
            'You remain responsible for the content you publish, the approvals you make, and the posting choices you confirm before a post is published on Facebook.',
        ],
    },
    {
        title: '6. Retention and deletion',
        icon: LockKeyhole,
        paragraphs: [
            'We retain Facebook-related data only for as long as required to provide the service, comply with legal obligations, and maintain platform functionality, analytics, or support records.',
            'If you request deletion or disconnect an account, we will remove access and delete data in line with our retention schedule, subject to any legal requirements requiring longer retention.',
        ],
    },
]

export default function FacebookPrivacy() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8 flex items-center justify-between gap-4">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                    <Link to="/login" className="flex items-center gap-2 font-semibold text-foreground">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                        </span>
                        SocialSync
                    </Link>
                </header>

                <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-gradient-to-r from-blue-500/10 via-background to-background px-6 py-10 sm:px-10">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                            <LockKeyhole className="h-6 w-6" />
                        </div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">Facebook account privacy</p>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Facebook Privacy Notice</h1>
                        <p className="mt-3 max-w-2xl text-muted-foreground">
                            How SocialSync handles the Facebook account data you connect to our platform.
                        </p>
                        <p className="mt-5 text-sm text-muted-foreground">Effective date: September 17, 2026</p>
                    </div>

                    <div className="px-6 py-8 sm:px-10 sm:py-10">
                        <p className="mb-8 text-base leading-7 text-muted-foreground">
                            SocialSync helps you plan, manage, and publish content on Facebook. This notice explains what Facebook data we access, why we need it, and how we protect it when you connect your account.
                        </p>

                        <div className="space-y-8">
                            {sections.map((section) => {
                                const Icon = section.icon

                                return (
                                    <section key={section.title} className="rounded-xl border bg-muted/20 p-5">
                                        <div className="mb-3 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                                        </div>
                                        <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                                            {section.paragraphs.map((paragraph) => (
                                                <p key={paragraph}>{paragraph}</p>
                                            ))}
                                        </div>
                                    </section>
                                )
                            })}
                        </div>

                        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
                            <h3 className="mb-2 text-base font-semibold">Important</h3>
                            <p>
                                By connecting Facebook, you confirm that you have permission to connect the selected account or page and that you are authorized to manage the content, permissions, and settings associated with it. You remain responsible for reviewing any scheduled content, media, and publication choices before they go live.
                            </p>
                        </div>
                    </div>
                </article>

                <footer className="py-6 text-center text-sm text-muted-foreground">
                    <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
                    <span className="mx-2">or</span>
                    <Link to="/login" className="font-medium text-primary hover:underline">sign in</Link>
                </footer>
            </div>
        </main>
    )
}

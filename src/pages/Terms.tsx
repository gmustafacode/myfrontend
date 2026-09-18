import { Link } from 'react-router-dom'
import { ArrowLeft, Bot, ShieldCheck } from 'lucide-react'

const sections = [
    {
        title: '1. Using SocialSync',
        paragraphs: [
            'SocialSync helps you plan, create, schedule, and publish content across connected social media accounts. You may use the service only if you can legally enter into this agreement and only for lawful purposes.',
            'You are responsible for keeping your account credentials secure and for all activity that happens through your account. Tell us promptly if you believe your account has been accessed without permission.',
        ],
    },
    {
        title: '2. Connected platforms',
        paragraphs: [
            'When you connect a social media account, you authorize SocialSync to access and use the permissions you grant through that platform. Each platform may apply its own terms, policies, limits, and availability requirements.',
            'You can disconnect an account at any time from SocialSync. Disconnecting may not revoke permissions already granted to the platform, so you should also manage access from the platform itself when necessary.',
        ],
    },
    {
        title: '3. Your content',
        paragraphs: [
            'You keep ownership of the content you submit. You grant SocialSync the limited permission needed to store, process, display, and publish that content at your direction so we can provide the service.',
            'You must have the rights and permissions needed for everything you upload or publish. You are responsible for checking posts, media, links, audiences, and scheduled times before publication.',
        ],
    },
    {
        title: '4. Acceptable use',
        paragraphs: [
            'You may not use SocialSync to break the law, impersonate another person, infringe intellectual property or privacy rights, distribute harmful code, abuse platform APIs, or send spam or deceptive content.',
            'We may limit or suspend access when activity threatens the service, other users, connected platforms, or our ability to comply with applicable requirements.',
        ],
    },
    {
        title: '5. Service availability',
        paragraphs: [
            'We work to keep SocialSync available and reliable, but the service may change, pause, or become unavailable for maintenance, security, provider outages, API changes, or circumstances beyond our control.',
            'SocialSync does not guarantee delivery, reach, engagement, or uninterrupted publication on any third-party platform. Scheduled content may fail or be delayed when a connected platform rejects a request or changes its API.',
        ],
    },
    {
        title: '6. Termination',
        paragraphs: [
            'You may stop using SocialSync at any time. We may suspend or terminate access if you breach these terms, misuse the service, or create risk for the service or other users.',
            'After termination, provisions that by their nature should continue, including ownership, acceptable use consequences, disclaimers, and limitations of liability, will remain effective.',
        ],
    },
    {
        title: '7. Disclaimers and liability',
        paragraphs: [
            'SocialSync is provided on an as-available basis. To the extent permitted by law, we disclaim warranties that the service will be error-free, uninterrupted, or suitable for every purpose.',
            'To the extent permitted by law, SocialSync will not be responsible for indirect, incidental, special, consequential, or lost-profit damages arising from your use of the service or third-party platforms.',
        ],
    },
    {
        title: '8. Changes and contact',
        paragraphs: [
            'We may update these terms as the service changes. The updated version will be posted on this page with a new effective date. Continuing to use SocialSync after an update means you accept the revised terms.',
            'Questions about these terms can be sent through the support contact provided by the SocialSync team.',
        ],
    },
]

export default function Terms() {
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
                            <Bot className="h-5 w-5 text-primary-foreground" />
                        </span>
                        SocialSync
                    </Link>
                </header>

                <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b bg-gradient-to-r from-primary/10 via-background to-background px-6 py-10 sm:px-10">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">SocialSync legal</p>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
                        <p className="mt-3 max-w-2xl text-muted-foreground">The rules and responsibilities that apply when you use SocialSync.</p>
                        <p className="mt-5 text-sm text-muted-foreground">Effective date: September 15, 2026</p>
                    </div>

                    <div className="px-6 py-8 sm:px-10 sm:py-10">
                        <p className="mb-8 text-base leading-7 text-muted-foreground">
                            By creating an account or using SocialSync, you agree to these Terms of Service. Please read them carefully. If you do not agree, do not use the service.
                        </p>

                        <div className="space-y-8">
                            {sections.map((section) => (
                                <section key={section.title}>
                                    <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                                    <div className="mt-2 space-y-3 text-sm leading-7 text-muted-foreground">
                                        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                                    </div>
                                </section>
                            ))}
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

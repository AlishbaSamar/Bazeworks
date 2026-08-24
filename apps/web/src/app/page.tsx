import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BrowserMockup } from "@/components/ui/BrowserMockup";
import {
  BoltIcon,
  ShieldCheckIcon,
  GlobeIcon,
  LayersIcon,
  DatabaseIcon,
  RocketIcon,
} from "@/components/icons/FeatureIcons";

const FEATURES = [
  {
    icon: <LayersIcon />,
    title: "Visual page editor",
    description: "Drag, drop, and arrange blocks on a real canvas — no code required to ship a page.",
  },
  {
    icon: <BoltIcon />,
    title: "Reusable components",
    description: "Text, headings, buttons, images, and layout primitives you can style per instance.",
  },
  {
    icon: <ShieldCheckIcon />,
    title: "Workspaces & roles",
    description: "Owner, Admin, Editor, and Viewer roles keep every client's site scoped and safe.",
  },
  {
    icon: <DatabaseIcon />,
    title: "Start from a template",
    description: "Clone a professionally structured page set instead of starting from a blank canvas.",
  },
  {
    icon: <GlobeIcon />,
    title: "Draft & live status",
    description: "Every site tracks its own state, so nothing goes public before you mean it to.",
  },
  {
    icon: <RocketIcon />,
    title: "Built to ship",
    description: "Preview, publish, and deploy are next on the roadmap — the foundation is ready today.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create a workspace",
    description: "Spin up a home for a client or team — websites, members, and roles live together.",
  },
  {
    n: "02",
    title: "Start a website",
    description: "Begin from a blank canvas or clone a template's page structure in one click.",
  },
  {
    n: "03",
    title: "Design in the editor",
    description: "Drag components onto the page and tune every field from the properties panel.",
  },
  {
    n: "04",
    title: "Save and hand off",
    description: "Changes save straight to the page. Invite teammates in as Editors or Viewers.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              B
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">Bazeworks</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#templates" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Templates
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center px-3 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground sm:inline-flex"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button className="h-9 w-auto px-4 text-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-dot-grid relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-105 w-205 -translate-x-1/2 rounded-full bg-foreground/4 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Now in early access
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground text-balance sm:text-5xl lg:text-[3.25rem]">
                Build, manage, and design websites faster
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Bazeworks gives your team a visual editor and workspace-based structure to design
                production-ready websites without touching code.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup">
                  <Button className="h-12 w-auto px-6 text-base">Start building — it&apos;s free</Button>
                </Link>
                <a href="#templates">
                  <Button variant="secondary" className="h-12 w-auto px-6 text-base">
                    Browse templates
                  </Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">No credit card required.</p>
            </div>

            <div>
              <BrowserMockup
                eyebrow="SaaS Starter"
                heading="Build faster with Bazeworks"
                body="The visual editor for modern teams. Drag, drop, and publish production-ready pages."
                cta="Get Started"
                nav={["Features", "Pricing", "About"]}
              />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
              Everything you need to ship a client-ready site
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-surface-sunken">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Workflow</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
                From idea to live website in one clear path
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.n} className="relative">
                  <span className="text-sm font-mono font-medium text-muted-foreground">{step.n}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                  {i < STEPS.length - 1 && (
                    <div className="absolute -right-4 top-2 hidden h-px w-8 bg-border-strong lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="templates" className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Templates</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
                Start with a template, then make it yours
              </h2>
            </div>
            <Link href="/signup" className="text-sm font-medium text-foreground hover:underline">
              Browse the gallery →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {["SaaS Starter", "Agency Pro", "Blog Minimal", "Portfolio Clean"].map((name) => (
              <div
                key={name}
                className="group overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-28 items-center justify-center bg-surface-sunken bg-dot-grid">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm ring-1 ring-border transition-transform duration-150 group-hover:scale-105">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                      <path strokeLinecap="round" d="M3.5 9.5h17M9.5 9.5V20.5" />
                    </svg>
                  </div>
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Ready-made page structure</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20 lg:pb-24">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center shadow-xl sm:px-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-150 -translate-x-1/2 rounded-full bg-white/5 blur-3xl"
            />
            <h2 className="relative text-3xl font-semibold tracking-tight text-primary-foreground text-balance sm:text-4xl">
              Build your next website with Bazeworks
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/70">
              Create a workspace and start designing in the visual editor in under a minute.
            </p>
            <div className="relative mt-8">
              <Link href="/signup">
                <Button variant="secondary" className="h-12 w-auto border-transparent bg-white px-6 text-base text-primary shadow-none hover:bg-white/90">
                  Create your first website
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              B
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">Bazeworks</span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Product</a>
            <a href="#templates" className="hover:text-foreground">Templates</a>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
        <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bazeworks. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

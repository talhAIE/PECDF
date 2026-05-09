import { Link } from 'react-router-dom'
import { BarChart2, ArrowUpRight } from 'lucide-react'

const IMG = {
  hero: '/images/landingpageimage.jpg',
  trade: '/images/export.jpg',
  facility: '/images/exportimage.jpg',
  workforce: '/images/exportimage2.jpg',
  operations: '/images/exportimage.png',
}

/** Editorial landing: one image per narrative beat — not a single “gallery block”. */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f5f2] text-slate-900 antialiased">
      {/* Paper-like base; single soft wash — no stacked rainbow glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-40%,rgba(15,23,42,0.04),transparent_55%)]" aria-hidden />

      {/* Nav — quiet, functional */}
      <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-[#f6f5f2]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="group flex items-baseline gap-3">
            <span className="font-display text-[1.05rem] font-semibold tracking-tight text-slate-900">PECDF</span>
            <span className="hidden font-normal text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 sm:inline">
              export intelligence
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#platform"
              className="hidden px-3 py-2 text-[0.8125rem] text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline md:inline"
            >
              Platform
            </a>
            <a
              href="#workflow"
              className="hidden px-3 py-2 text-[0.8125rem] text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline md:inline"
            >
              Workflow
            </a>
            <Link
              to="/login"
              className="px-3 py-2 text-[0.8125rem] font-medium text-slate-700 transition hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="ml-1 inline-flex items-center gap-1 border border-slate-900 bg-slate-900 px-4 py-2 text-[0.8125rem] font-medium text-white transition hover:bg-slate-800"
            >
              Register
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" strokeWidth={2.25} />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero: asymmetric; image anchors the eye without a “floating widget” ── */}
        <section className="border-b border-slate-900/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-12 lg:items-end lg:gap-6 lg:py-20 lg:pl-8 lg:pr-0">
            <div className="lg:col-span-5 lg:pb-4 lg:pr-6 xl:col-span-4">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-slate-500">
                Pakistan Export Demand Forecasting
              </p>
              <h1 className="mt-5 font-display text-[2.125rem] font-semibold leading-[1.12] tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-[2.75rem]">
                Demand signals you can brief a board on—not a pile of charts nobody owns.
              </h1>
              <p className="mt-6 max-w-[34ch] text-[0.9375rem] leading-[1.65] text-slate-600">
                PECDF ties machine-learning export projections to the macro drivers that move orders: exchange rates,
                oil, and overseas demand. Forecast center, scenarios, per-commodity exploration, AI Q&amp;A, and
                print-ready reports live in one place.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex border border-slate-900 bg-slate-900 px-6 py-3 text-[0.8125rem] font-medium text-white transition hover:bg-slate-800"
                >
                  Create an account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-5 py-3 text-[0.8125rem] font-medium text-slate-800 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-800"
                >
                  Sign in to workspace
                </Link>
              </div>
            </div>
            <div className="relative lg:col-span-7 lg:min-h-[min(78vh,560px)] xl:col-span-8">
              <figure className="relative h-[min(52vh,420px)] overflow-hidden bg-slate-900/5 lg:absolute lg:inset-0 lg:h-auto">
                <img
                  src={IMG.hero}
                  alt="Port logistics and export activity at scale"
                  className="h-full w-full object-cover object-[50%_45%]"
                  width={1200}
                  height={800}
                  loading="eager"
                />
                <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/70 to-transparent px-5 py-6 text-[0.6875rem] uppercase tracking-[0.2em] text-white/85 lg:px-8">
                  Trade &amp; throughput
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── Lead: typographic rhythm, no cards ── */}
        <section className="border-b border-slate-900/10 bg-[#faf9f7]">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center lg:px-8 lg:py-20">
            <p className="font-display text-[1.0625rem] font-medium leading-[1.55] text-slate-800">
              Most “analytics” products either show history or black-box AI. PECDF is built for recurring planning: you
              pick horizons and scope, see predicted export values in USD millions with charts, then stress those
              numbers against PKR, Brent, and US consumer confidence—before you commit capacity or credit.
            </p>
          </div>
        </section>

        {/* ── Image 2 + macro & model detail (split) ── */}
        <section id="platform" className="border-b border-slate-900/10">
          <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
            <figure className="order-2 min-h-[280px] lg:order-1 lg:min-h-[min(100vh,640px)]">
              <img
                src={IMG.trade}
                alt="Container terminal representing Pakistan export corridors"
                className="h-full w-full object-cover"
                width={900}
                height={1100}
                loading="lazy"
              />
              <figcaption className="sr-only">Shipping and corridor capacity</figcaption>
            </figure>
            <div className="order-1 flex flex-col justify-center px-5 py-14 lg:order-2 lg:px-12 lg:py-20 xl:px-16">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-slate-500">Assumptions</span>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.75rem]">
                Macro context is explicit—not an afterthought in a footnote.
              </h2>
              <p className="mt-5 text-[0.9375rem] leading-[1.65] text-slate-600">
                Every run is labeled with the macro inputs your outlook depends on: USD/PKR, Brent crude, and US consumer
                confidence. Those aren’t decoration; they feed scenario work so trade and finance teams share the same
                “what if” language.
              </p>
              <ul className="mt-8 space-y-4 border-l border-slate-900/15 pl-6 text-[0.875rem] leading-relaxed text-slate-700">
                <li>
                  <span className="font-medium text-slate-900">Modeling core:</span> gradient-boosted demand signals
                  trained on export-relevant series—presented without forcing MAPE/R² into executive copy unless you want
                  the technical tone.
                </li>
                <li>
                  <span className="font-medium text-slate-900">Horizons &amp; scope:</span> multi-month outlook windows
                  and configurable commodity scope—from focused HS codes to broader baskets for portfolio reads.
                </li>
                <li>
                  <span className="font-medium text-slate-900">Where it shows up:</span> dashboard summaries, forecast
                  center charts, commodity drill-downs, scenario deltas, analyst chat, and downloadable PDF reports.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Image 3 + platform modules (readable list, not symmetric icons) ── */}
        <section className="border-b border-slate-900/10 bg-[#faf9f7]">
          <div className="mx-auto grid max-w-7xl lg:grid-cols-5">
            <div className="flex flex-col justify-center px-5 py-14 lg:col-span-3 lg:px-12 lg:py-20 xl:px-16">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-slate-500">Inside the product</span>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.75rem]">
                Modules that match how export teams actually work.
              </h2>
              <dl className="mt-10 space-y-9">
                <div className="grid gap-2 border-b border-slate-900/10 pb-8">
                  <dt className="font-display text-[0.9375rem] font-semibold text-slate-900">Dashboard</dt>
                  <dd className="text-[0.875rem] leading-[1.65] text-slate-600">
                    Portfolio snapshot with clear opportunities (positive momentum) and a watch list for downside
                    pressure—so the first screen answers “where do I look first?”
                  </dd>
                </div>
                <div className="grid gap-2 border-b border-slate-900/10 pb-8">
                  <dt className="font-display text-[0.9375rem] font-semibold text-slate-900">Forecast center &amp; commodities</dt>
                  <dd className="text-[0.875rem] leading-[1.65] text-slate-600">
                    Horizon-specific forecasts with paths in USD millions; commodity explorer by HS code for historical
                    vs projected curves, seasonality (peak/trough months), and supporting stats.
                  </dd>
                </div>
                <div className="grid gap-2 border-b border-slate-900/10 pb-8">
                  <dt className="font-display text-[0.9375rem] font-semibold text-slate-900">Scenario simulator</dt>
                  <dd className="text-[0.875rem] leading-[1.65] text-slate-600">
                    Move PKR, oil, and confidence; see how the model responds—built for stress tests before you fix
                    prices or hedges.
                  </dd>
                </div>
                <div className="grid gap-2 pb-2">
                  <dt className="font-display text-[0.9375rem] font-semibold text-slate-900">AI analyst &amp; reports</dt>
                  <dd className="text-[0.875rem] leading-[1.65] text-slate-600">
                    Natural-language Q&amp;A on your session context, plus an outlook report generator with executive or
                    technical tone and clean PDF export for stakeholders who will never log in.
                  </dd>
                </div>
              </dl>
            </div>
            <figure className="lg:col-span-2 lg:min-h-[min(92vh,720px)]">
              <div className="sticky top-[4.25rem] h-[min(48vh,380px)] lg:h-[calc(100vh-4.25rem)] lg:max-h-[820px]">
                <img
                  src={IMG.facility}
                  alt="Manufacturing floor and export-linked production"
                  className="h-full w-full object-cover object-[50%_40%]"
                  width={700}
                  height={900}
                  loading="lazy"
                />
              </div>
            </figure>
          </div>
        </section>

        {/* ── Image 4 + quote / operating context ── */}
        <section className="border-b border-slate-900/10">
          <div className="mx-auto grid max-w-7xl md:grid-cols-12">
            <div className="relative px-5 py-14 md:col-span-5 md:flex md:flex-col md:justify-center md:px-8 md:py-16 lg:px-12">
              <blockquote className="font-display text-xl font-medium leading-snug text-slate-900 sm:text-2xl">
                The point isn’t prettier charts—it’s one consistent story from the macro strip to the PDF on someone
                else’s desk.
              </blockquote>
              <p className="mt-8 text-[0.8125rem] leading-relaxed text-slate-600">
                Seasonality and momentum sit alongside raw forecast levels so you can explain <em>why</em> a line is
                moving, not only <em>where</em> it lands. That&apos;s what separates a planning tool from a dashboard
                graveyard.
              </p>
            </div>
            <figure className="relative min-h-[260px] md:col-span-7 md:min-h-[400px]">
              <img
                src={IMG.workforce}
                alt="People and operations supporting Pakistan exports"
                className="absolute inset-0 h-full w-full object-cover object-[45%_35%]"
                width={1000}
                height={700}
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        {/* ── Image 5 + workflow checklist ── */}
        <section id="workflow" className="border-b border-slate-900/10 bg-[#faf9f7]">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:flex lg:items-start lg:gap-12 lg:px-8 lg:py-20 xl:gap-16">
            <figure className="mx-auto mb-10 max-w-md shrink-0 overflow-hidden border border-slate-900/10 bg-white lg:mb-0 lg:w-[38%]">
              <img
                src={IMG.operations}
                alt="Industrial and logistics detail for export operations"
                className="aspect-[4/5] w-full object-cover object-center"
                width={560}
                height={700}
                loading="lazy"
              />
            </figure>
            <div className="min-w-0 flex-1 lg:pt-2">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-slate-500">Workflow</span>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950">
                From login to a shareable outlook.
              </h2>
              <ol className="mt-10 space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Authenticate once',
                    body: 'Your workspace keeps sessions for analyst chat, saved context, and report history—no separate “tooling accounts” per feature.',
                  },
                  {
                    step: '02',
                    title: 'Orient on the dashboard',
                    body: 'Scan momentum and roster risk across commodities before you deep-dive a single HS code or run a scenario.',
                  },
                  {
                    step: '03',
                    title: 'Refine with data',
                    body: 'Adjust horizons, explore forecasts and seasonality, tweak macro inputs in the simulator, and ask the AI analyst pointed questions.',
                  },
                  {
                    step: '04',
                    title: 'Publish',
                    body: 'Generate an outlook report in the voice you need—then export PDF for email, attachments, or board packs.',
                  },
                ].map((row) => (
                  <li key={row.step} className="flex gap-5 border-b border-slate-900/10 pb-6 last:border-0">
                    <span className="shrink-0 pt-0.5 font-mono text-[0.75rem] tabular-fig text-slate-400">{row.step}</span>
                    <div>
                      <p className="font-medium text-slate-900">{row.title}</p>
                      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-slate-600">{row.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Closing CTA: restrained — no purple gradient billboard ── */}
        <section className="bg-slate-950 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:flex-row sm:items-center lg:px-8 lg:py-20">
            <div className="max-w-xl">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-white/50">Access</p>
              <p className="mt-3 font-display text-xl font-semibold leading-tight sm:text-2xl">
                Bring macro-aware export outlooks into planning—not slides you rebuild every week.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex border border-white bg-white px-6 py-3 text-[0.8125rem] font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="inline-flex border border-white/30 px-6 py-3 text-[0.8125rem] font-medium text-white transition hover:border-white/50 hover:bg-white/5"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/10 bg-[#f6f5f2]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 text-[0.8125rem] text-slate-600 lg:grid-cols-12 lg:px-8 lg:py-16">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center border border-slate-900/20 bg-white">
                <BarChart2 className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="font-display font-semibold">PECDF</span>
            </div>
            <p className="mt-4 max-w-xs leading-relaxed">
              Research and planning toolkit for Pakistan export demand—not a substitute for your own market judgment or
              compliance review.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:col-start-6 lg:grid-cols-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Product</p>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/register" className="underline-offset-4 hover:text-slate-900 hover:underline">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="underline-offset-4 hover:text-slate-900 hover:underline">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">On this page</p>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#platform" className="underline-offset-4 hover:text-slate-900 hover:underline">
                    Platform detail
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="underline-offset-4 hover:text-slate-900 hover:underline">
                    Workflow
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-900/10 px-5 py-6 text-center text-[0.75rem] text-slate-500 lg:px-8">
          © {new Date().getFullYear()} PECDF — Pakistan Export Demand Forecasting
        </div>
      </footer>
    </div>
  )
}

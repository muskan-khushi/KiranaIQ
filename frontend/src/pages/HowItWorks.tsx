import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, MapPin, ShieldCheck, Zap, Landmark,
  ChevronRight, ArrowRight, CheckCircle2, Clock,
  TrendingUp, BarChart2, Layers, Database, Cpu, Globe
} from 'lucide-react';

// ─── Stage data ───────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 'vision',
    num: '01',
    icon: Eye,
    name: 'Vision Intelligence',
    tagline: 'Reads the store like a trained analyst',
    color: '#7C3AED',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    pill: 'bg-purple-100 text-purple-700',
    description:
      'Each photo is sent in parallel to Groq\'s Llama 3.2 Vision model — the same infrastructure that processes millions of images per second. The model returns structured JSON: shelf density (SDI), SKU diversity, product categories, refill signal, store size, and image quality. An ImagePreprocessor resizes and sharpens each photo first for better accuracy on dark or blurry field shots.',
    detail: [
      { label: 'Model', value: 'Groq Llama 3.2 Vision' },
      { label: 'Speed', value: '~3–5 images in parallel' },
      { label: 'Preprocessing', value: 'CLAHE + unsharp mask + resize to 1024px' },
      { label: 'Fallback', value: 'Neutral defaults if image quality is unusable' },
    ],
    outputs: ['Shelf Density Index (SDI)', 'SKU Diversity Score', 'Dominant Categories', 'Consistency Score', 'Refill Signal', 'Store Area Estimate'],
    fraud_note: null,
  },
  {
    id: 'geo',
    num: '02',
    icon: MapPin,
    name: 'Geo-Spatial Analysis',
    tagline: 'Understands the street the store sits on',
    color: '#0D9488',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    pill: 'bg-teal-100 text-teal-700',
    description:
      'Three Overpass API queries fire simultaneously against OpenStreetMap — completely free, no Google Maps key needed. Footfall is scored from weighted nearby POIs (bus stops score 12, markets 14, stations 15) with distance decay. Competition is a sigmoid of nearby grocery stores within 500m. Catchment estimates residential density and income proxy from building and landuse data. All results are cached in Redis for 6 hours.',
    detail: [
      { label: 'Data source', value: 'OpenStreetMap Overpass API' },
      { label: 'Radius', value: '500m footfall, 500m competition' },
      { label: 'Cache TTL', value: '6 hours in Redis' },
      { label: 'Fallback', value: 'Neutral scores if Overpass times out' },
    ],
    outputs: ['Footfall Score 0–100', 'Competition Index 0–1', 'Catchment Score', 'Income Proxy', 'Residential Density'],
    fraud_note: null,
  },
  {
    id: 'fraud',
    num: '03',
    icon: ShieldCheck,
    name: 'Fraud Detection',
    tagline: '5 automated tripwires catch the most common games',
    color: '#DC2626',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    pill: 'bg-red-100 text-red-700',
    description:
      'The cross-signal validator checks for patterns that only occur when someone is gaming the assessment — like a fully-stocked shelf in a location nobody visits. Each tripwire has a defined severity. Two or more high-severity flags trigger an automatic reject recommendation. A temporal analyzer also inspects walkthrough videos: if shelf density rises monotonically across frames, it likely means shelves were being stocked during filming.',
    detail: [
      { label: 'Tripwires', value: '5 cross-signal + 1 temporal' },
      { label: 'Auto-reject at', value: '2+ high-severity flags' },
      { label: 'Video analysis', value: 'Frame sampling via OpenCV + Groq' },
      { label: 'Recommendation', value: 'approve / needs_verification / reject' },
    ],
    outputs: ['Risk Flags', 'Severity Levels', 'Recommended Actions', 'Final Recommendation'],
    fraud_note: [
      { sev: 'high', name: 'Inventory vs footfall', desc: 'SDI > 0.75 but footfall < 35 — borrowed stock?' },
      { sev: 'high', name: 'Low image consistency', desc: 'High variance across photos — selective framing?' },
      { sev: 'medium', name: 'Missing coverage', desc: 'Interior, counter, and exterior all required' },
      { sev: 'medium', name: 'SKU income mismatch', desc: 'Premium items in a low-income catchment' },
      { sev: 'low', name: 'Competition + thin shelf', desc: 'Dense competition + low SDI = margin pressure' },
      { sev: 'high', name: 'Temporal restocking', desc: 'SDI rises across video frames' },
    ],
  },
  {
    id: 'fusion',
    num: '04',
    icon: Zap,
    name: 'Revenue Fusion',
    tagline: '3 independent paths, fused by data quality',
    color: '#B45309',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    pill: 'bg-amber-100 text-amber-700',
    description:
      'Three revenue estimates are computed using completely different inputs, then fused by data-quality weights. Path A (working capital cycle) uses inventory value × daily turnover. Path B (geo-demand) uses footfall score to anchor a benchmark range adjusted by shelf quality. Path C (size-based) uses revenue per sq ft — only active when the officer provides floor area. The uncertainty engine then adds confidence-adjusted bounds: base ±25%, narrowed by strong signals, widened by fraud flags.',
    detail: [
      { label: 'Path A weight', value: '55% — working capital cycle' },
      { label: 'Path B weight', value: '30% — geo-demand model' },
      { label: 'Path C weight', value: '15% — size-based (when area given)' },
      { label: 'Base spread', value: '±25%, clamped 15%–50%' },
    ],
    outputs: ['Daily Sales Range', 'Monthly Revenue Range', 'Net Income Range', 'Confidence Score', 'Feature Attribution'],
    fraud_note: null,
  },
  {
    id: 'loan',
    num: '05',
    icon: Landmark,
    name: 'Loan Sizing',
    tagline: 'FOIR-standard recommendation + peer benchmarking',
    color: '#1A7A4A',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    pill: 'bg-green-100 text-green-700',
    description:
      'Monthly net income × FOIR (0.45) gives EMI capacity. That EMI is converted to principal using the annuity factor at 18% p.a. for 18 months. Results are rounded to the nearest ₹5,000 — no false precision. Simultaneously, a MongoDB 2dsphere geo-query finds up to 10 completed assessments within 2km for percentile ranking by shelf density index.',
    detail: [
      { label: 'FOIR', value: '0.45 — kirana industry standard' },
      { label: 'Interest rate', value: '18% p.a.' },
      { label: 'Default tenure', value: '18 months' },
      { label: 'Rounding', value: 'Nearest ₹5,000' },
    ],
    outputs: ['Loan Range', 'Monthly EMI Range', 'Tenure', 'Peer Percentile', 'Final Recommendation'],
    fraud_note: null,
  },
];

const TIMELINE = [
  { time: '0s', label: 'Officer submits form', desc: 'Images, GPS, and metadata arrive. UUID assigned. Task enqueued in Celery via Redis broker.' },
  { time: '~2s', label: 'Vision stage', desc: 'Images preprocessed (resize, CLAHE, sharpen). All images sent to Groq Vision in parallel via async/await.' },
  { time: '~15s', label: 'Geo stage', desc: 'Three Overpass queries fire simultaneously — footfall, competition, catchment. Redis checked first.' },
  { time: '~28s', label: 'Fraud validation', desc: '5 tripwires evaluated in microseconds. Video temporal analysis runs if a walkthrough video was uploaded.' },
  { time: '~33s', label: 'Fusion + uncertainty', desc: '3-path estimate computed. Confidence interval narrows or widens based on signal quality.' },
  { time: '~38s', label: 'Loan sizing + peer query', desc: 'FOIR math + MongoDB geo query for nearby assessments. Result written to DB.' },
  { time: '~40s', label: 'Frontend displays result', desc: 'React Query polling detects "completed" status and renders the full dashboard.' },
];

const TECH_STACK = [
  { icon: Cpu, name: 'FastAPI + Celery', desc: 'Async Python backend, background task queue' },
  { icon: Database, name: 'MongoDB + Redis', desc: '2dsphere geo index, 6h result caching' },
  { icon: Globe, name: 'OpenStreetMap', desc: 'Overpass API — zero cost, no API key' },
  { icon: Layers, name: 'Groq Vision', desc: 'Llama 3.2 — fastest vision inference available' },
  { icon: BarChart2, name: 'React 18 + Vite', desc: 'TypeScript, Tailwind, Recharts, React Query' },
  { icon: TrendingUp, name: 'BCG Kirana Report', desc: 'All price bands calibrated to 2022 benchmarks' },
];

// ─── Animated counter hook ─────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ─── Stat card with animated counter ──────────────────────────────────────

function StatCard({ value, label, suffix = '', started }: { value: number; label: string; suffix?: string; started: boolean }) {
  const count = useCountUp(value, 1000, started);
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 text-center">
      <p className="font-display text-3xl font-bold text-primary metric-number">
        {count}{suffix}
      </p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────────

const SEV_STYLE: Record<string, string> = {
  high: 'bg-danger-light text-danger border border-danger/20',
  medium: 'bg-warning-light text-warning border border-warning/20',
  low: 'bg-surface-2 text-muted border border-border',
};

// ─── Main component ────────────────────────────────────────────────────────

export default function HowItWorks() {
  const [activeStage, setActiveStage] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const statsRef = useRef<HTMLDivElement>(null);
  const tlRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stage = STAGES[activeStage];

  // Intersection observer for stats
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // Stagger timeline items
  useEffect(() => {
    const observers = tlRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) setVisibleItems(prev => new Set([...prev, i]));
      }, { threshold: 0.2 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── Hero ── */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20 mb-4">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          Technical deep-dive
        </div>
        <h1 className="font-display text-4xl font-bold text-primary mb-4 leading-tight">
          How KiranaIQ works
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
          A field officer uploads 3–5 photos. In under 90 seconds, a five-stage AI pipeline
          produces a full credit report — no ITR, no GST, no balance sheets.
        </p>
      </div>

      {/* ── Stats ── */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        <StatCard value={90} label="Seconds to result" suffix="s" started={statsVisible} />
        <StatCard value={5} label="AI pipeline stages" started={statsVisible} />
        <StatCard value={5} label="Fraud tripwires" started={statsVisible} />
        <StatCard value={39} label="Unit tests passing" started={statsVisible} />
      </div>

      {/* ── Pipeline stage selector ── */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
          Click a stage to explore it
        </p>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === activeStage;
            return (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setActiveStage(i)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all border ${
                    isActive
                      ? `${s.bg} ${s.border} ${s.text}`
                      : 'border-transparent text-muted hover:bg-surface-2 hover:text-secondary'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white/60' : 'bg-surface-2'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap">{s.num} {s.name.split(' ')[0]}</span>
                </button>
                {i < STAGES.length - 1 && (
                  <ArrowRight size={14} className="text-border mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active stage detail panel ── */}
      <div
        key={stage.id}
        className={`rounded-2xl border ${stage.border} ${stage.bg} p-6 mb-10 transition-all`}
        style={{ animation: 'fadeIn 0.25s ease-out' }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-xl ${stage.text} bg-white/70 flex items-center justify-center flex-shrink-0`}>
            {<stage.icon size={22} />}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-primary">{stage.name}</h2>
            <p className={`text-sm font-medium ${stage.text} mt-0.5`}>{stage.tagline}</p>
          </div>
          <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-lg ${stage.pill}`}>
            Stage {stage.num}
          </span>
        </div>

        <p className="text-secondary text-sm leading-relaxed mb-5">{stage.description}</p>

        {/* Detail grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {stage.detail.map(d => (
            <div key={d.label} className="bg-white/60 rounded-xl p-3 border border-white/80">
              <p className="text-xs text-muted mb-1">{d.label}</p>
              <p className="text-xs font-semibold text-primary leading-snug">{d.value}</p>
            </div>
          ))}
        </div>

        {/* Fraud tripwires */}
        {stage.fraud_note && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {stage.fraud_note.map(f => (
              <div key={f.name} className="flex items-start gap-2.5 bg-white/60 rounded-xl p-3 border border-white/80">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${SEV_STYLE[f.sev]}`}>
                  {f.sev.toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-semibold text-primary">{f.name}</p>
                  <p className="text-xs text-muted mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Output tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-muted mr-1 self-center">Outputs →</span>
          {stage.outputs.map(o => (
            <span key={o} className={`text-xs px-2.5 py-1 rounded-full font-medium ${stage.pill}`}>
              {o}
            </span>
          ))}
        </div>
      </div>

      {/* ── Revenue estimation: 3 paths ── */}
      <section className="mb-14">
        <h2 className="font-display text-2xl font-bold text-primary mb-2">Why 3 paths to the same number?</h2>
        <p className="text-muted text-sm leading-relaxed mb-6 max-w-2xl">
          Each method has blind spots. Working capital alone fails for thin inventory. Geo alone misses niche markets.
          Size alone ignores product mix. Fusing all three — weighted by signal quality — is consistently more accurate than any single path.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { weight: '55%', name: 'Path A — Working capital', desc: 'Inventory value × category daily turnover rate, calibrated to Indian kirana price bands from BCG 2022.', active: true },
            { weight: '30%', name: 'Path B — Geo demand', desc: 'Footfall score anchors a benchmark revenue range, then adjusted up/down by shelf quality (SDI).', active: false },
            { weight: '15%', name: 'Path C — Size model', desc: 'Revenue per sq ft per day — only activates when the officer provides the floor area. Weights shift when unavailable.', active: false },
          ].map(p => (
            <div key={p.name} className={`rounded-2xl border p-5 ${p.active ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'}`}>
              <p className="font-display text-3xl font-bold text-accent mb-1 metric-number">{p.weight}</p>
              <p className="text-sm font-semibold text-primary mb-2">{p.name}</p>
              <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Confidence score explained ── */}
      <section className="mb-14 bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl font-bold text-primary mb-2">What does the confidence score actually mean?</h2>
        <p className="text-muted text-sm leading-relaxed mb-5">
          The confidence score is not a model probability. It's the inverse of the revenue range spread — a direct measure of how much the signals agree with each other.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Base spread', value: '±25%', note: 'Starting point for every assessment' },
            { label: 'Reduced by', value: '−5% each', note: 'High SDI, known size, 3+ images, high consistency, known years' },
            { label: 'Widened by', value: '+5% per flag', note: 'Each active risk flag adds uncertainty' },
            { label: 'Formula', value: '1 − spread − (flags × 0.025)', note: 'Clamped between 0.20 and 1.0' },
          ].map(c => (
            <div key={c.label} className="bg-surface-2 rounded-xl p-3 border border-border">
              <p className="text-xs text-muted mb-1">{c.label}</p>
              <p className="text-sm font-semibold text-primary font-mono leading-snug">{c.value}</p>
              <p className="text-xs text-muted mt-1 leading-snug">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Loan sizing formula ── */}
      <section className="mb-14">
        <h2 className="font-display text-2xl font-bold text-primary mb-2">Loan sizing formula</h2>
        <p className="text-muted text-sm leading-relaxed mb-5">
          All loan amounts follow the same NBFC-standard calculation. No arbitrary caps, no magic numbers.
        </p>
        <div className="bg-primary text-white rounded-2xl p-6 font-mono text-sm leading-loose">
          <p className="text-white/50 text-xs mb-3">// Computed in loan_sizer.py</p>
          <p><span className="text-accent">monthly_emi</span> = monthly_net_income × FOIR</p>
          <p className="text-white/40 text-xs ml-0 mt-0.5">// FOIR = 0.45 (kirana industry standard)</p>
          <br />
          <p><span className="text-accent">annuity_factor</span> = (1 − (1 + r)^−n) / r</p>
          <p className="text-white/40 text-xs mt-0.5">// r = 18% p.a. / 12 = 1.5% monthly, n = 18 months</p>
          <br />
          <p><span className="text-accent">max_loan</span> = monthly_emi × annuity_factor</p>
          <br />
          <p><span className="text-accent">rounded_loan</span> = round(max_loan / 5000) × 5000</p>
          <p className="text-white/40 text-xs mt-0.5">// Nearest ₹5,000 — no false precision</p>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="mb-14">
        <h2 className="font-display text-2xl font-bold text-primary mb-2">End-to-end timeline</h2>
        <p className="text-muted text-sm leading-relaxed mb-6">
          What actually happens between "Submit" and the result appearing on screen.
        </p>
        <div className="relative">
          <div className="absolute left-[52px] top-4 bottom-4 w-px bg-border" />
          <div className="space-y-0">
            {TIMELINE.map((t, i) => (
              <div
                key={i}
                ref={el => { tlRefs.current[i] = el; }}
                className={`flex gap-4 pb-6 transition-all duration-500 ${visibleItems.has(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-col items-center flex-shrink-0 w-[52px]">
                  <div className="bg-surface border border-border rounded-full px-2 py-0.5 text-xs font-mono text-muted whitespace-nowrap z-10">
                    {t.time}
                  </div>
                </div>
                <div className="flex-1 bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                    <p className="text-sm font-semibold text-primary">{t.label}</p>
                  </div>
                  <p className="text-xs text-muted leading-relaxed pl-5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="mb-14">
        <h2 className="font-display text-2xl font-bold text-primary mb-6">Built on</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TECH_STACK.map(t => (
            <div key={t.name} className="flex items-start gap-3 bg-surface border border-border rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                <t.icon size={16} className="text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{t.name}</p>
                <p className="text-xs text-muted mt-0.5 leading-snug">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust principles ── */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold text-primary mb-6">Design principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'No black box', body: 'Every rupee estimate comes with a feature attribution chart. Officers can explain the decision to the applicant in plain terms.' },
            { title: 'Uncertainty is honest', body: 'Confidence bands widen when signals are weak. We never pretend to be more certain than the data supports.' },
            { title: 'Calibrated to India', body: 'Price bands, turnover rates, FOIR, and margins are all calibrated to BCG\'s 2022 kirana research — not US or EU benchmarks.' },
          ].map(p => (
            <div key={p.title} className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-primary mb-2 text-sm">{p.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="bg-primary text-white rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-bold mb-2">See it in action</h2>
        <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto">
          Run a demo assessment on a Chandni Chowk store — no images or backend required.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/results?demo=1"
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-colors"
          >
            View demo results
            <ChevronRight size={16} />
          </Link>
          <Link
            to="/new-assessment"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Start real assessment
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

    </div>
  );
}
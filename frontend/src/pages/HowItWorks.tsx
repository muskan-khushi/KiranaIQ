import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, MapPin, ShieldCheck, Zap, Landmark,
  ChevronRight, CheckCircle2,
  TrendingUp, BarChart2, Layers, Database, Cpu, Globe,
  ArrowUpRight
} from 'lucide-react';

// ─── Stage data ───────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 'vision', num: '01', icon: Eye,
    name: 'Vision Intelligence',
    tagline: 'Reads the store like a trained analyst',
    accentColor: '#7C3AED',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
    textClass: 'text-violet-700',
    description: 'Each photo is sent in parallel to Groq\'s Llama 3.2 Vision model. The model returns structured JSON: shelf density (SDI), SKU diversity, product categories, refill signal, store size, and image quality. An ImagePreprocessor resizes and sharpens each photo first for better accuracy on dark or blurry field shots.',
    detail: [
      { label: 'Model', value: 'Groq Llama 3.2 Vision' },
      { label: 'Speed', value: '3–5 images in parallel' },
      { label: 'Preprocessing', value: 'CLAHE + unsharp mask + resize' },
      { label: 'Fallback', value: 'Neutral defaults on unusable images' },
    ],
    outputs: ['Shelf Density Index', 'SKU Diversity Score', 'Dominant Categories', 'Consistency Score', 'Refill Signal'],
    fraudNote: null,
  },
  {
    id: 'geo', num: '02', icon: MapPin,
    name: 'Geo-Spatial Analysis',
    tagline: 'Understands the street the store sits on',
    accentColor: '#0D9488',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    textClass: 'text-teal-700',
    description: 'Three Overpass API queries fire simultaneously against OpenStreetMap — completely free, no Google Maps key needed. Footfall is scored from weighted nearby POIs (bus stops score 12, markets 14, stations 15) with distance decay. Competition is a sigmoid of nearby grocery stores within 500m. All results are cached in Redis for 6 hours.',
    detail: [
      { label: 'Data source', value: 'OpenStreetMap Overpass API' },
      { label: 'Radius', value: '500m footfall, 500m competition' },
      { label: 'Cache TTL', value: '6 hours in Redis' },
      { label: 'Fallback', value: 'Neutral scores on timeout' },
    ],
    outputs: ['Footfall Score 0–100', 'Competition Index 0–1', 'Catchment Score', 'Income Proxy'],
    fraudNote: null,
  },
  {
    id: 'fraud', num: '03', icon: ShieldCheck,
    name: 'Fraud Detection',
    tagline: '5 automated tripwires catch gaming attempts',
    accentColor: '#DC2626',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-700',
    description: 'The cross-signal validator catches patterns that only occur when someone games the assessment — like a fully-stocked shelf in a location nobody visits. Each tripwire has a defined severity. Two or more high-severity flags trigger an automatic reject recommendation.',
    detail: [
      { label: 'Tripwires', value: '5 cross-signal + 1 temporal' },
      { label: 'Auto-reject', value: '2+ high-severity flags' },
      { label: 'Video analysis', value: 'Frame sampling via OpenCV' },
      { label: 'Output', value: 'approve / needs_verification / reject' },
    ],
    outputs: ['Risk Flags', 'Severity Levels', 'Recommended Actions', 'Final Recommendation'],
    fraudNote: [
      { sev: 'high',   name: 'Inventory vs footfall', desc: 'SDI > 0.75 but footfall < 35' },
      { sev: 'high',   name: 'Low image consistency', desc: 'High variance across photos' },
      { sev: 'medium', name: 'Missing coverage',       desc: 'Interior, counter, exterior all required' },
      { sev: 'medium', name: 'SKU income mismatch',    desc: 'Premium items in low-income area' },
      { sev: 'low',    name: 'Competition pressure',   desc: 'Dense competition + low SDI' },
      { sev: 'high',   name: 'Temporal restocking',    desc: 'SDI rises across video frames' },
    ],
  },
  {
    id: 'fusion', num: '04', icon: Zap,
    name: 'Revenue Fusion',
    tagline: '3 independent paths, fused by data quality',
    accentColor: '#B45309',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
    description: 'Three revenue estimates are computed using completely different inputs, then fused by data-quality weights. Path A uses inventory value × daily turnover. Path B uses footfall score to anchor a benchmark range. Path C uses revenue per sq ft when the officer provides floor area. The uncertainty engine adds confidence-adjusted bounds.',
    detail: [
      { label: 'Path A weight', value: '55% — working capital cycle' },
      { label: 'Path B weight', value: '30% — geo-demand model' },
      { label: 'Path C weight', value: '15% — size-based (when given)' },
      { label: 'Base spread',   value: '±25%, clamped 15%–50%' },
    ],
    outputs: ['Daily Sales Range', 'Monthly Revenue Range', 'Net Income Range', 'Confidence Score', 'Feature Attribution'],
    fraudNote: null,
  },
  {
    id: 'loan', num: '05', icon: Landmark,
    name: 'Loan Sizing',
    tagline: 'FOIR-standard recommendation + peer benchmarking',
    accentColor: '#14683D',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
    description: 'Monthly net income × FOIR (0.45) gives EMI capacity. That EMI is converted to principal using the annuity factor at 18% p.a. for 18 months. Results are rounded to the nearest ₹5,000 — no false precision. A MongoDB 2dsphere geo-query finds up to 10 completed assessments within 2km for percentile ranking.',
    detail: [
      { label: 'FOIR',     value: '0.45 — kirana industry standard' },
      { label: 'Rate',     value: '18% p.a.' },
      { label: 'Tenure',   value: '18 months default' },
      { label: 'Rounding', value: 'Nearest ₹5,000' },
    ],
    outputs: ['Loan Range', 'Monthly EMI Range', 'Tenure', 'Peer Percentile'],
    fraudNote: null,
  },
];

const SEV_COLORS: Record<string, string> = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
};

const TECH = [
  { icon: Cpu,      name: 'FastAPI + Celery',  desc: 'Async Python backend, background task queue' },
  { icon: Database, name: 'MongoDB + Redis',   desc: '2dsphere geo index, 6h result caching' },
  { icon: Globe,    name: 'OpenStreetMap',     desc: 'Overpass API — zero cost, no API key' },
  { icon: Layers,   name: 'Groq Vision',       desc: 'Llama 3.2 — fastest vision inference' },
  { icon: BarChart2,name: 'React 18 + Vite',   desc: 'TypeScript, Tailwind, Recharts, React Query' },
  { icon: TrendingUp,name: 'BCG Kirana 2022',  desc: 'All price bands calibrated to research' },
];

const TIMELINE = [
  { time: '0s',    label: 'Officer submits',   desc: 'Images, GPS, metadata arrive. UUID assigned. Task enqueued in Celery via Redis.' },
  { time: '~2s',   label: 'Vision stage',      desc: 'Images preprocessed (CLAHE, sharpen, resize). All sent to Groq Vision in parallel.' },
  { time: '~15s',  label: 'Geo analysis',      desc: 'Three Overpass queries fire simultaneously — footfall, competition, catchment.' },
  { time: '~28s',  label: 'Fraud validation',  desc: '5 tripwires evaluated. Video temporal analysis runs if walkthrough video uploaded.' },
  { time: '~33s',  label: 'Fusion engine',     desc: '3-path estimate computed. Confidence interval set by signal quality.' },
  { time: '~38s',  label: 'Loan sizing',       desc: 'FOIR math + MongoDB geo query. Result written to database.' },
  { time: '~40s',  label: 'Result appears',    desc: 'React Query polling detects "completed" and renders the full dashboard.' },
];

function useCountUp(target: number, duration = 1000, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return val;
}

function StatBubble({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const v = useCountUp(value, 900, active);
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-bold text-primary mb-1 metric-number">
        {v}<span className="text-accent">{suffix}</span>
      </div>
      <div className="text-xs text-muted font-medium uppercase tracking-widest">{label}</div>
    </div>
  );
}

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [visibleTl, setVisibleTl] = useState<Set<number>>(new Set());
  const statsRef = useRef<HTMLDivElement>(null);
  const tlRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const observers = tlRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) setVisibleTl(prev => new Set([...prev, i]));
      }, { threshold: 0.2 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const stage = STAGES[active];

  return (
    <div className="bg-background min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(var(--col-border-2) 1px, transparent 1px), linear-gradient(90deg, var(--col-border-2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E8570A 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-accent bg-accent-light px-3 py-1.5 rounded-full border border-orange-200 mb-6 uppercase tracking-widest">
            <span className="live-dot" />
            Technical deep-dive
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-primary mb-5 leading-[1.08] tracking-tight">
            How KiranaIQ<br />
            <span className="text-accent italic">actually works</span>
          </h1>

          <p className="text-muted text-lg max-w-xl leading-relaxed mb-10">
            A field officer uploads 3–5 photos. In under 90 seconds, a five-stage AI pipeline
            produces a full credit report — no ITR, no GST, no balance sheets.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/results?demo=1" className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-all shadow-glow-accent">
              View demo results <ArrowUpRight size={15} />
            </Link>
            <Link to="/new-assessment" className="flex items-center gap-2 px-5 py-3 bg-surface text-primary border border-border rounded-xl text-sm font-semibold hover:bg-surface-2 transition-all">
              Start assessment <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <StatBubble value={90}  suffix="s" label="Seconds to result"   active={statsVisible} />
            <StatBubble value={5}   suffix=""  label="Pipeline stages"      active={statsVisible} />
            <StatBubble value={5}   suffix=""  label="Fraud tripwires"      active={statsVisible} />
            <StatBubble value={39}  suffix=""  label="Unit tests passing"   active={statsVisible} />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* ── PIPELINE STAGES ───────────────────────────────────────── */}
        <section>
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Five-stage AI pipeline</p>
            <div className="accent-rule mb-6" />
          </div>

          {/* Stage selector tabs */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 mb-6">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all duration-150 flex-shrink-0 ${
                    isActive
                      ? `${s.bgClass} ${s.borderClass} ${s.textClass}`
                      : 'bg-surface border-border text-muted hover:bg-surface-2 hover:text-primary'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-white/60' : 'bg-surface-2'}`}>
                    {s.num}
                  </div>
                  <Icon size={14} />
                  <span className="hidden sm:inline">{s.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active stage card */}
          <div
            key={stage.id}
            className={`rounded-2xl border p-7 ${stage.bgClass} ${stage.borderClass} transition-all duration-200`}
            style={{ animation: 'scaleIn 0.22s ease-out' }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center">
                <stage.icon size={22} style={{ color: stage.accentColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold text-primary">{stage.name}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${stage.bgClass} ${stage.textClass} ${stage.borderClass}`}>
                    Stage {stage.num}
                  </span>
                </div>
                <p className={`text-sm font-medium mt-0.5 ${stage.textClass}`}>{stage.tagline}</p>
              </div>
            </div>

            <p className="text-sm text-secondary leading-relaxed mb-6">{stage.description}</p>

            {/* Detail grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {stage.detail.map(d => (
                <div key={d.label} className="bg-white/60 rounded-xl p-3 border border-white/80">
                  <p className="text-[10px] text-muted mb-1 font-medium uppercase tracking-wide">{d.label}</p>
                  <p className="text-[12px] font-semibold text-primary leading-snug">{d.value}</p>
                </div>
              ))}
            </div>

            {/* Fraud tripwires */}
            {stage.fraudNote && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                {stage.fraudNote.map(f => (
                  <div key={f.name} className="flex items-start gap-2.5 bg-white/60 rounded-xl p-3 border border-white/80">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${SEV_COLORS[f.sev]}`}>
                      {f.sev}
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold text-primary">{f.name}</p>
                      <p className="text-[11px] text-muted mt-0.5 leading-snug">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Output tags */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-semibold text-muted mr-1">Outputs →</span>
              {stage.outputs.map(o => (
                <span key={o} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border bg-white/60 ${stage.textClass} ${stage.borderClass}`}>
                  {o}
                </span>
              ))}
            </div>
          </div>

          {/* Pipeline flow arrows */}
          <div className="mt-6 flex items-center gap-0 overflow-x-auto">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setActive(i)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                    i === active
                      ? 'border-accent bg-accent text-white scale-110'
                      : i < active
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-border bg-surface text-muted'
                  }`}
                >
                  {i < active ? <CheckCircle2 size={14} /> : s.num}
                </button>
                {i < STAGES.length - 1 && (
                  <div className={`w-8 h-0.5 transition-colors ${i < active ? 'bg-green-300' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── THREE PATHS ───────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Revenue estimation</p>
          <div className="accent-rule mb-5" />
          <h2 className="font-display text-3xl font-bold text-primary mb-2">Why three paths to the same number?</h2>
          <p className="text-muted text-sm leading-relaxed mb-8 max-w-2xl">
            Each method has blind spots. Working capital alone fails for thin inventory. Geo alone misses niche markets.
            Size alone ignores product mix. Fusing all three — weighted by signal quality — is consistently more accurate than any single path.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { weight: '55%', name: 'Working Capital', path: 'A', desc: 'Inventory value × category daily turnover rate, calibrated to Indian kirana price bands (BCG 2022).', primary: true },
              { weight: '30%', name: 'Geo Demand',      path: 'B', desc: 'Footfall score anchors a benchmark revenue range, then adjusted up/down by shelf quality (SDI).', primary: false },
              { weight: '15%', name: 'Size Model',      path: 'C', desc: 'Revenue per sq ft per day — only activates when the officer provides floor area.', primary: false },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl border p-5 relative overflow-hidden ${p.primary ? 'border-accent/30 bg-accent-light' : 'border-border bg-surface'}`}>
                {p.primary && <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-3xl font-bold text-accent metric-number">{p.weight}</span>
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Path {p.path}</span>
                </div>
                <p className="text-sm font-semibold text-primary mb-2">{p.name}</p>
                <p className="text-[12px] text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONFIDENCE SCORE ──────────────────────────────────────── */}
        <section className="bg-surface border border-border rounded-2xl p-7">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Confidence Score</p>
          <div className="accent-rule mb-5" />
          <h2 className="font-display text-3xl font-bold text-primary mb-2">What does the score actually mean?</h2>
          <p className="text-muted text-sm leading-relaxed mb-6 max-w-2xl">
            Not a model probability. It's the inverse of the revenue range spread — a direct measure of how much the signals agree with each other.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Base spread', value: '±25%',              note: 'Starting point for every assessment' },
              { label: 'Reduced by',  value: '−5% each signal',   note: 'High SDI, known size, 3+ images, consistency' },
              { label: 'Widened by',  value: '+5% per flag',      note: 'Each active risk flag adds uncertainty' },
              { label: 'Formula',     value: '1 − spread − flags', note: 'Clamped between 0.20 and 1.0' },
            ].map(c => (
              <div key={c.label} className="bg-surface-2 rounded-xl p-4 border border-border">
                <p className="text-[10px] text-muted mb-1.5 font-medium uppercase tracking-wide">{c.label}</p>
                <p className="text-sm font-bold text-primary font-mono leading-snug">{c.value}</p>
                <p className="text-[11px] text-muted mt-1.5 leading-snug">{c.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── LOAN FORMULA ──────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Loan sizing</p>
          <div className="accent-rule mb-5" />
          <h2 className="font-display text-3xl font-bold text-primary mb-2">One formula. No magic numbers.</h2>
          <p className="text-muted text-sm leading-relaxed mb-6 max-w-xl">
            All loan amounts follow the same NBFC-standard calculation. Transparent, auditable, calibrated to Indian micro-lending.
          </p>
          <div className="bg-primary text-white rounded-2xl p-6 font-mono text-sm leading-loose overflow-x-auto">
            <p className="text-white/40 text-[11px] mb-3 not-italic">{'//'} Computed in loan_sizer.py</p>
            <p><span className="text-orange-300">monthly_emi</span> = monthly_net_income × FOIR</p>
            <p className="text-white/40 text-[11px] mt-0.5 mb-3">{'//'} FOIR = 0.45 (kirana industry standard)</p>
            <p><span className="text-orange-300">annuity_factor</span> = (1 − (1 + r)^−n) / r</p>
            <p className="text-white/40 text-[11px] mt-0.5 mb-3">{'//'} r = 18% p.a. / 12 = 1.5% monthly, n = 18 months</p>
            <p><span className="text-orange-300">max_loan</span> = monthly_emi × annuity_factor</p>
            <p><span className="text-orange-300">rounded_loan</span> = round(max_loan / 5000) × 5000</p>
            <p className="text-white/40 text-[11px] mt-0.5">{'//'} Nearest ₹5,000 — no false precision</p>
          </div>
        </section>

        {/* ── TIMELINE ──────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">End-to-end timeline</p>
          <div className="accent-rule mb-5" />
          <h2 className="font-display text-3xl font-bold text-primary mb-6">Submit to result in 40 seconds</h2>
          <div className="relative pl-16">
            {/* Vertical line */}
            <div className="absolute left-[26px] top-3 bottom-3 w-px bg-border" />
            <div className="space-y-2">
              {TIMELINE.map((t, i) => (
                <div
                  key={i}
                  ref={el => { tlRefs.current[i] = el; }}
                  className={`flex gap-4 transition-all duration-500 ${visibleTl.has(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {/* Time bubble */}
                  <div className="absolute left-0 w-[52px] flex justify-center">
                    <div className="bg-surface border border-border rounded-full px-2 py-0.5 text-[10px] font-mono text-muted whitespace-nowrap z-10 mt-3">
                      {t.time}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-surface border border-border rounded-xl p-4 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={12} className="text-success" />
                      </div>
                      <p className="text-sm font-semibold text-primary">{t.label}</p>
                    </div>
                    <p className="text-[12px] text-muted leading-relaxed pl-7">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TECH STACK ─────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Technology</p>
          <div className="accent-rule mb-5" />
          <h2 className="font-display text-3xl font-bold text-primary mb-6">Built on</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TECH.map(t => (
              <div key={t.name} className="flex items-start gap-3 bg-surface border border-border rounded-xl p-4 hover:border-border-2 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <t.icon size={15} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{t.name}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-snug">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRINCIPLES ─────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1">Design principles</p>
          <div className="accent-rule mb-5" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'No black box',      body: 'Every rupee estimate comes with a feature attribution chart. Officers can explain the decision to the applicant in plain terms.' },
              { title: 'Uncertainty is honest', body: 'Confidence bands widen when signals are weak. We never pretend to be more certain than the data supports.' },
              { title: 'Calibrated to India',   body: "Price bands, turnover rates, FOIR, and margins are all calibrated to BCG's 2022 kirana research — not US or EU benchmarks." },
            ].map(p => (
              <div key={p.title} className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-border-2 transition-colors">
                <div className="w-8 h-1 bg-accent rounded-full mb-4" />
                <h3 className="font-semibold text-primary mb-2 text-sm">{p.title}</h3>
                <p className="text-[12px] text-muted leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 text-center noise-overlay">
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #E8570A 0%, transparent 70%)' }} />
            <div className="relative">
              <h2 className="font-display text-4xl font-bold text-white mb-3">See it in action</h2>
              <p className="text-white/60 text-sm mb-8 max-w-sm mx-auto">
                Run a demo assessment on a Chandni Chowk store — no images or backend required.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  to="/results?demo=1"
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-dark transition-all shadow-glow-accent"
                >
                  View demo results <ArrowUpRight size={15} />
                </Link>
                <Link
                  to="/new-assessment"
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all"
                >
                  Start real assessment <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
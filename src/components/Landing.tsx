import { useEffect, useState } from 'react';
import Logo from './ui/Logo';
import {
  Sprout, CloudRain, Sun, Wind, Eye, Leaf, MapPin, Calendar,
  MessageSquare, Users, Bell, Shield, Lightbulb, ArrowRight, Check,
  History, HandHelping, CloudSun, FlaskConical, Sparkles, Menu, X,
  TrendingUp, Globe, ShieldCheck, Send, Camera,
} from './ui/Icons';

type View = 'landing' | 'login' | 'signup' | 'forgot' | 'app';

interface LandingProps {
  onNavigate: (view: View) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Crop intelligence', href: '#crop-intelligence' },
    { label: 'Community', href: '#community' },
    { label: 'Trust', href: '#trust' },
  ];

  return (
    <div className="min-h-screen bg-forest-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-forest-50/90 backdrop-blur-md border-b border-forest-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="text-sm text-forest-600 hover:text-forest-900 transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => onNavigate('login')} className="btn-ghost">Sign in</button>
              <button onClick={() => onNavigate('signup')} className="btn-primary">Get started</button>
            </div>
            <button className="md:hidden p-2 rounded-lg text-forest-700" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-forest-50 border-b border-forest-100 animate-fade-in-down">
            <div className="px-6 py-4 space-y-3">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="block text-sm text-forest-600 hover:text-forest-900" onClick={() => setMobileMenu(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => onNavigate('login')} className="btn-secondary flex-1">Sign in</button>
                <button onClick={() => onNavigate('signup')} className="btn-primary flex-1">Get started</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-forest opacity-40" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-forest-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sand-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-100 border border-forest-200 mb-6">
                <Sparkles size={14} className="text-forest-600" />
                <span className="text-2xs font-medium text-forest-700 uppercase tracking-wider">Agricultural Intelligence</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-forest-950 leading-[1.1] tracking-tightish mb-6 text-balance">
                Understand your fields. Make better decisions.
              </h1>
              <p className="text-lg text-forest-600 leading-relaxed mb-8 max-w-xl">
                Neraya brings crop intelligence, climate context, AI guidance, and farmer experiences together in one agricultural companion.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => onNavigate('signup')} className="btn-primary text-base px-6 py-3.5">
                  Explore Neraya
                  <ArrowRight size={18} />
                </button>
                <button onClick={() => onNavigate('signup')} className="btn-secondary text-base px-6 py-3.5">
                  Try Crop Intelligence
                </button>
              </div>
            </div>

            {/* Interactive visualization */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <HeroVisualization />
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="py-20 lg:py-28 bg-white border-y border-forest-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="section-label mb-4">The challenge</p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 leading-tight mb-6 text-balance">
            Something doesn't look right in your field. What do you do next?
          </h2>
          <p className="text-lg text-forest-600 leading-relaxed">
            A farmer notices a change in their crop. Maybe spots on the leaves, maybe stunted growth, maybe something that showed up after the last rain. The question is always the same: what is this, and what should I do about it? Most of the time, the answer is hard to find alone.
          </p>
        </div>
      </section>

      {/* How Neraya thinks */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label mb-4">How Neraya thinks</p>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-4">
              Evidence, context, reasoning, action.
            </h2>
            <p className="text-lg text-forest-600 max-w-2xl mx-auto">
              Neraya doesn't just look at an image and guess. It brings together everything it knows about your field to help you decide.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: <Eye size={24} />, label: 'Evidence', desc: 'Your crop image, your observations, what you are seeing on the ground.', color: 'forest' },
              { icon: <CloudSun size={24} />, label: 'Context', desc: 'Weather, field history, growth stage, and what has changed recently.', color: 'sky' },
              { icon: <FlaskConical size={24} />, label: 'Reasoning', desc: 'Neraya combines all of this to consider what might be happening and why.', color: 'earth' },
              { icon: <Lightbulb size={24} />, label: 'Action', desc: 'Clear options with honest reasoning, so you can choose what makes sense.', color: 'clay' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="card p-6 h-full">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${
                    step.color === 'forest' ? 'bg-forest-50 text-forest-600' :
                    step.color === 'sky' ? 'bg-sky-50 text-sky-600' :
                    step.color === 'earth' ? 'bg-earth-50 text-earth-600' :
                    'bg-clay-50 text-clay-600'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-2">Step {i + 1}</div>
                  <h3 className="font-serif text-lg font-medium text-forest-900 mb-2">{step.label}</h3>
                  <p className="text-sm text-forest-500 leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 items-center justify-center w-6 h-6 rounded-full bg-forest-50 border border-forest-200">
                    <ArrowRight size={12} className="text-forest-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crop Intelligence */}
      <section id="crop-intelligence" className="py-20 lg:py-28 bg-white border-y border-forest-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-4">Crop intelligence</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-6 text-balance">
                See what might be happening. Then decide what to do.
              </h2>
              <p className="text-lg text-forest-600 leading-relaxed mb-8">
                Take a photo of your crop, describe what you're noticing, and Neraya will look at it with you. You get a structured assessment, not just a guess, with what to check next and when to consider getting expert help.
              </p>
              <ul className="space-y-3">
                {[
                  'Possible issues with honest confidence levels',
                  'What to check next, in plain language',
                  'Environmental context from real weather data',
                  'Decision options with reasoning behind each one',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-100">
                      <Check size={12} className="text-forest-600" />
                    </div>
                    <span className="text-sm text-forest-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <AssessmentPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Climate Intelligence */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <ClimatePreview />
            </div>
            <div className="order-1 lg:order-2">
              <p className="section-label mb-4">Climate intelligence</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-6 text-balance">
                Weather isn't decoration. It changes what you should do.
              </h2>
              <p className="text-lg text-forest-600 leading-relaxed mb-8">
                Neraya uses real weather data to put your crop situation in context. Rain in the forecast? That might change whether spraying makes sense. High humidity? That could mean fungal risk. Every recommendation considers what the sky is doing.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <CloudRain size={20} />, label: 'Rainfall tracking' },
                  { icon: <Sun size={20} />, label: 'Heat stress alerts' },
                  { icon: <Wind size={20} />, label: 'Wind conditions' },
                  { icon: <CloudSun size={20} />, label: '5-day forecast' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-forest-50 border border-forest-100">
                    <span className="text-forest-500">{item.icon}</span>
                    <span className="text-sm text-forest-700 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Companion */}
      <section className="py-20 lg:py-28 bg-white border-y border-forest-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-4">AI farmer companion</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-6 text-balance">
                Talk to Neraya like a knowledgeable neighbor.
              </h2>
              <p className="text-lg text-forest-600 leading-relaxed mb-8">
                Say what you're worried about. Neraya listens, looks at the details with you, and helps you figure out what might be going on. It remembers your previous conversations and knows what's happening in your fields.
              </p>
              <div className="space-y-4">
                {[
                  { q: '"My tomato plants are getting worse after the rain."', a: '"That does sound worrying. Let\'s look at what you\'re seeing. Can you tell me when the spots first appeared?"' },
                  { q: '"Should I irrigate today?"', a: '"Rain is expected within the next 24 hours based on the forecast. It might be worth holding off and checking the soil moisture first."' },
                ].map((ex, i) => (
                  <div key={i} className="card p-4">
                    <p className="text-sm font-medium text-forest-800 mb-2">{ex.q}</p>
                    <p className="text-sm text-forest-500 leading-relaxed">{ex.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <ChatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Decision Support */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Decision support</p>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-4 text-balance">
              Not one answer. Options with reasoning.
            </h2>
            <p className="text-lg text-forest-600 max-w-2xl mx-auto">
              Neraya gives you clear options, each with the reasoning behind it, so you can choose what fits your situation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Eye size={20} />, title: 'Monitor', desc: 'Keep an eye on it and check again in a few days. Sometimes the best action is to watch and wait.', color: 'forest' },
              { icon: <Sprout size={20} />, title: 'Take action', desc: 'If conditions are right and you know what to do, start treatment now before it spreads.', color: 'earth' },
              { icon: <HandHelping size={20} />, title: 'Seek expert advice', desc: 'When the situation is serious or unclear, a local agricultural expert can confirm what\'s happening.', color: 'clay' },
            ].map((opt, i) => (
              <div key={i} className="card p-6 hover:shadow-soft-md transition-shadow">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${
                  opt.color === 'forest' ? 'bg-forest-50 text-forest-600' :
                  opt.color === 'earth' ? 'bg-earth-50 text-earth-600' :
                  'bg-clay-50 text-clay-600'
                }`}>
                  {opt.icon}
                </div>
                <h3 className="font-serif text-lg font-medium text-forest-900 mb-2">{opt.title}</h3>
                <p className="text-sm text-forest-500 leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="py-20 lg:py-28 bg-white border-y border-forest-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-4">Farmer community</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-6 text-balance">
                You're not the only one seeing this.
              </h2>
              <p className="text-lg text-forest-600 leading-relaxed mb-8">
                When other farmers report similar issues, Neraya can connect you to their experiences. Not as a diagnosis, but as a signal that you're not alone. Share what you're seeing, learn from others, and help each other.
              </p>
              <ul className="space-y-3">
                {[
                  'Crop-specific and regional discussions',
                  'Share observations and ask questions',
                  'See when others report similar symptoms',
                  'Mark helpful answers and report misinformation',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-100">
                      <Check size={12} className="text-forest-600" />
                    </div>
                    <span className="text-sm text-forest-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <CommunityPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Field History */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <TimelinePreview />
            </div>
            <div className="order-1 lg:order-2">
              <p className="section-label mb-4">Field history</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-6 text-balance">
                Your field has a story. Neraya remembers it.
              </h2>
              <p className="text-lg text-forest-600 leading-relaxed mb-8">
                Every assessment, every observation, every change over time. Neraya tracks the journey of each field so you can see what improved, what got worse, and what happened next. Compare your last scan with today to see exactly what changed.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Timeline view', 'Before vs now', 'Trend tracking', 'Growth stage history'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-lg bg-forest-50 border border-forest-100 text-sm text-forest-600 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section id="trust" className="py-20 lg:py-28 bg-white border-y border-forest-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Trust and safety</p>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-4 text-balance">
              Honest about what it knows and what it doesn't.
            </h2>
            <p className="text-lg text-forest-600 max-w-2xl mx-auto">
              Neraya never presents an AI assessment as a confirmed diagnosis. Community reports are experiences, not verified facts. You always know what is AI-assisted and what is confirmed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <ShieldCheck size={20} />, title: 'Clear uncertainty', desc: 'Every assessment shows its confidence level. Unknown means unknown.' },
              { icon: <Users size={20} />, title: 'Community moderation', desc: 'Report misinformation, dangerous advice, or spam. Every report is reviewed.' },
              { icon: <Shield size={20} />, title: 'Your data stays yours', desc: 'Your field information and images are private. Community location is anonymized.' },
            ].map((item, i) => (
              <div key={i} className="card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600 mb-4">
                  {item.icon}
                </div>
                <h3 className="font-serif text-base font-medium text-forest-900 mb-2">{item.title}</h3>
                <p className="text-sm text-forest-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future vision */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="section-label mb-4">Where Neraya is heading</p>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-forest-950 mb-6 text-balance">
            Built to grow with your farm.
          </h2>
          <p className="text-lg text-forest-600 leading-relaxed mb-12">
            Neraya is designed to connect with real weather services, agricultural knowledge sources, and AI models. The architecture is ready for multilingual conversations, voice interaction, and deeper community intelligence. Today it helps you understand and decide. Tomorrow it will do more.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Multilingual AI', 'Voice interaction', 'Knowledge sources', 'Community intelligence', 'Climate risk analysis', 'Expert escalation'].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-xl bg-forest-50 border border-forest-100 text-sm text-forest-700 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-forest-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-forest-700/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-forest-600/20 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6 text-balance">
            Let's take a closer look at your field.
          </h2>
          <p className="text-lg text-forest-200 leading-relaxed mb-10 max-w-xl mx-auto">
            Create a free account, add your fields, and start getting honest, context-aware guidance for your crops.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => onNavigate('signup')} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-forest-900 font-medium text-base hover:bg-forest-50 active:scale-[0.98] transition-all">
              Get started
              <ArrowRight size={18} />
            </button>
            <button onClick={() => onNavigate('login')} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-forest-700/50 text-white font-medium text-base border border-forest-600 hover:bg-forest-700 active:scale-[0.98] transition-all">
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-950 text-forest-300 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center rounded-xl bg-forest-700 text-white" style={{ width: 30, height: 30 }}>
                <Sprout size={18} />
              </div>
              <span className="font-serif text-lg font-semibold text-white">Neraya</span>
            </div>
            <p className="text-sm text-forest-400">
              Agricultural intelligence for farmers who want to understand their fields.
            </p>
            <div className="flex gap-6 text-sm">
              <span className="text-forest-400">Built with care for farmers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroVisualization() {
  const nodes = [
    { icon: <Sprout size={20} />, label: 'Crop', x: 15, y: 20 },
    { icon: <CloudSun size={20} />, label: 'Weather', x: 75, y: 15 },
    { icon: <MapPin size={20} />, label: 'Field', x: 80, y: 70 },
    { icon: <FlaskConical size={20} />, label: 'AI', x: 30, y: 75 },
    { icon: <Lightbulb size={20} />, label: 'Recommendation', x: 50, y: 45 },
  ];

  return (
    <div className="relative aspect-square max-w-md mx-auto">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-forest-50 to-sand-50 border border-forest-100 overflow-hidden">
        <div className="absolute inset-0 bg-grid-forest opacity-30" />
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4d7c5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a67f55" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {nodes.slice(0, 4).map((node, i) => (
            <line
              key={i}
              x1={node.x}
              y1={node.y}
              x2={50}
              y2={45}
              stroke="url(#lineGrad)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="animate-pulse-soft"
            />
          ))}
        </svg>
        {/* Nodes */}
        {nodes.map((node, i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center gap-1.5 animate-fade-in"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-soft-md ${
              node.label === 'Recommendation'
                ? 'bg-forest-700 text-white scale-110'
                : 'bg-white text-forest-700 border border-forest-100'
            }`}>
              {node.icon}
            </div>
            <span className="text-2xs font-medium text-forest-600 uppercase tracking-wider">{node.label}</span>
          </div>
        ))}
        {/* Center pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full bg-forest-200/20 animate-breathe" />
        </div>
      </div>
    </div>
  );
}

function AssessmentPreview() {
  return (
    <div className="card-elevated p-6 max-w-md mx-auto lg:ml-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
          <FlaskConical size={16} />
        </div>
        <span className="text-sm font-medium text-forest-700">Crop Assessment</span>
        <span className="ml-auto text-2xs font-medium text-forest-400 uppercase tracking-wider">AI-assisted</span>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">Possible issue</div>
          <p className="text-sm font-medium text-forest-900">Possible fungal leaf disease</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-forest-400">Confidence</span>
          <div className="flex-1 h-1.5 rounded-full bg-forest-100 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-earth-400" />
          </div>
          <span className="text-2xs font-medium text-earth-600">Moderate</span>
        </div>
        <div>
          <div className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1.5">What to check next</div>
          <ul className="space-y-1.5">
            {['Look at the underside of affected leaves', 'Check if spots are spreading to new plants', 'Note whether symptoms worsen after rain'].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-forest-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-3 border-t border-forest-100">
          <div className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1.5">Environmental context</div>
          <p className="text-sm text-forest-600 leading-relaxed">
            Recent rainfall and elevated humidity may create conditions favorable to some fungal problems.
          </p>
        </div>
      </div>
    </div>
  );
}

function ClimatePreview() {
  return (
    <div className="card-elevated p-6 max-w-md">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CloudSun size={20} className="text-sky-500" />
          <span className="text-sm font-medium text-forest-700">Field weather</span>
        </div>
        <span className="text-2xs text-forest-400">From live data</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: <Sun size={18} />, label: 'Temp', value: '28C' },
          { icon: <CloudRain size={18} />, label: 'Humidity', value: '78%' },
          { icon: <Wind size={18} />, label: 'Wind', value: '12 km/h' },
        ].map((item, i) => (
          <div key={i} className="rounded-xl bg-forest-50 border border-forest-100 p-3 text-center">
            <div className="flex justify-center text-forest-500 mb-1.5">{item.icon}</div>
            <div className="text-lg font-serif font-medium text-forest-900">{item.value}</div>
            <div className="text-2xs text-forest-400 uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="text-2xs font-semibold uppercase tracking-wider text-forest-400">5-day forecast</div>
        <div className="flex justify-between gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
            <div key={i} className="flex-1 text-center p-2 rounded-lg bg-forest-50 border border-forest-100">
              <div className="text-2xs text-forest-500 mb-1">{day}</div>
              <CloudRain size={14} className="mx-auto text-sky-400 mb-1" />
              <div className="text-xs font-medium text-forest-700">{26 + i}C</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-100">
        <p className="text-sm text-sky-700 leading-relaxed">
          Rain is expected within the next 24 hours. Irrigation may need to be reconsidered.
        </p>
      </div>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="card-elevated p-5 max-w-md">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-forest-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white">
          <Sprout size={16} />
        </div>
        <span className="text-sm font-medium text-forest-700">Neraya Assistant</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success-400" />
          <span className="text-2xs text-forest-400">Active</span>
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-forest-700 text-white px-3.5 py-2 text-sm">
            My tomato plants are getting worse after the rain.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-forest-50 text-forest-800 px-3.5 py-2 text-sm leading-relaxed">
            That does sound worrying. Let's look at what you're seeing. Can you tell me when the spots first appeared, and have you noticed them on other plants in the same field?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-forest-700 text-white px-3.5 py-2 text-sm">
            About three days ago. It's on several plants now.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-forest-50 text-forest-800 px-3.5 py-2 text-sm leading-relaxed">
            Okay. A few things could cause this, and the recent weather is one possibility. If you can share a photo of an affected leaf, I can take a closer look with you.
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-forest-50 border border-forest-100">
        <input className="flex-1 bg-transparent text-sm text-forest-700 placeholder:text-forest-400 focus:outline-none" placeholder="Ask Neraya..." disabled />
        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="space-y-3 max-w-md">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-earth-100 text-earth-600 text-xs font-medium">RS</div>
          <div>
            <div className="text-sm font-medium text-forest-800">Ravi S.</div>
            <div className="text-2xs text-forest-400">Tomato grower, Andhra Pradesh</div>
          </div>
        </div>
        <p className="text-sm text-forest-700 leading-relaxed mb-3">
          Has anyone else seen these brown spots after the recent rainfall? Started on the lower leaves and spreading upward.
        </p>
        <div className="flex items-center gap-3 text-2xs text-forest-400">
          <span className="flex items-center gap-1"><HandHelping size={12} /> 12 helpful</span>
          <span className="flex items-center gap-1"><MessageSquare size={12} /> 4 replies</span>
          <span className="px-2 py-0.5 rounded-full bg-forest-50 border border-forest-100">Tomato</span>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-medium">PK</div>
          <div>
            <div className="text-sm font-medium text-forest-800">Priya K.</div>
            <div className="text-2xs text-forest-400">Tomato grower, Karnataka</div>
          </div>
        </div>
        <p className="text-sm text-forest-700 leading-relaxed mb-3">
          I had the same thing last season. Turned out to be early blight. What helped me was removing the affected leaves and adjusting irrigation.
        </p>
        <div className="flex items-center gap-3 text-2xs text-forest-400">
          <span className="flex items-center gap-1"><HandHelping size={12} /> 8 helpful</span>
          <span className="px-2 py-0.5 rounded-full bg-success-50 border border-success-100 text-success-600">Helpful answer</span>
        </div>
      </div>
    </div>
  );
}

function TimelinePreview() {
  const events = [
    { date: 'Aug 02', label: 'Assessment recorded', desc: 'Possible fungal issue, low severity', color: 'warning', icon: <FlaskConical size={14} /> },
    { date: 'Aug 07', label: 'Symptoms increased', desc: 'Spreading to upper leaves', color: 'error', icon: <TrendingUp size={14} /> },
    { date: 'Aug 12', label: 'New image analyzed', desc: 'Treatment started, monitoring', color: 'info', icon: <Camera size={14} /> },
    { date: 'Aug 18', label: 'Assessment improved', desc: 'Spreading slowed, new growth healthy', color: 'success', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="card-elevated p-6 max-w-md">
      <div className="flex items-center gap-2 mb-5">
        <History size={18} className="text-forest-600" />
        <span className="text-sm font-medium text-forest-700">Field timeline</span>
        <span className="ml-auto text-2xs text-forest-400">Tomato Field A</span>
      </div>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
            {i < events.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-forest-100" />
            )}
            <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              event.color === 'warning' ? 'bg-warning-50 border-warning-200 text-warning-600' :
              event.color === 'error' ? 'bg-error-50 border-error-200 text-error-600' :
              event.color === 'info' ? 'bg-sky-50 border-sky-200 text-sky-600' :
              'bg-success-50 border-success-200 text-success-600'
            }`}>
              {event.icon}
            </div>
            <div className="pt-1">
              <div className="text-2xs font-medium text-forest-400 uppercase tracking-wider mb-0.5">{event.date}</div>
              <div className="text-sm font-medium text-forest-900">{event.label}</div>
              <div className="text-xs text-forest-500 mt-0.5">{event.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

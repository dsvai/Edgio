/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Target, 
  Zap, 
  Menu, 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
  ExternalLink,
  Lock,
  Calendar,
  Layers,
  Search,
  Sun,
  Moon,
  CreditCard,
  Wallet,
  Shield,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, ScatterController);

// --- Types ---
interface AnalysisCard {
  id: string;
  category: 'Política' | 'Economía' | 'Crypto' | 'Deportes';
  title: string;
  marketProb: number;
  ourProb: number;
  conviction: number;
  publishedAt: string;
  liquidity: string;
  daysRemaining: number;
}

interface TrackRecordEntry {
  event: string;
  date: string;
  ourEst: number;
  marketPrice: number;
  edge: number;
  resolution: string;
  outcome: string;
  correct: boolean;
}

interface AcademyArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  description: string;
  content: string;
  image: string;
}

interface Plan {
  id: 'free' | 'pro' | 'annual';
  name: string;
  price: string;
  period: string;
  features: string[];
}

// --- Components ---

const StatItem = ({ value, label, subtext, highlight = 'indigo' }: { value: string, label: string, subtext: string, highlight?: 'indigo' | 'emerald', key?: React.Key }) => {
  const [count, setCount] = useState(0);
  const target = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isPercent = value.endsWith('%');
  const isEdge = value.startsWith('+');

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [target]);

  const formattedValue = useMemo(() => {
    if (isNaN(target)) return value;
    const prefix = isEdge ? '+' : '';
    const suffix = isPercent ? '%' : '';
    return `${prefix}${count.toFixed(isPercent ? 0 : 2)}${suffix}`;
  }, [count, target, isEdge, isPercent, value]);

  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left animate-on-scroll">
      <span className={`font-mono text-4xl md:text-5xl font-semibold mb-2 ${highlight === 'emerald' ? 'text-brand-emerald' : 'text-brand-indigo'}`}>
        {formattedValue}
      </span>
      <span className="text-text-secondary text-sm font-medium uppercase tracking-wider">{label}</span>
      <span className="text-text-tertiary text-xs mt-1">{subtext}</span>
    </div>
  );
};

const AnalysisCardComp = ({ data, onPremiumClick }: { data: AnalysisCard, onPremiumClick: () => void, key?: React.Key }) => {
  const edge = data.ourProb - data.marketProb;
  const isPositiveEdge = edge > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, borderColor: 'rgba(99,102,241,0.4)' }}
      className="bg-bg-card border border-border-subtle rounded-xl p-5 transition-all duration-200 group"
    >
      <div className="flex justify-between items-center mb-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          data.category === 'Política' ? 'bg-brand-indigo/20 text-brand-indigo' :
          data.category === 'Economía' ? 'bg-brand-emerald/20 text-brand-emerald' :
          'bg-amber-500/20 text-amber-500'
        }`}>
          {data.category}
        </span>
        <span className="font-mono text-[10px] text-text-tertiary">
          {data.daysRemaining} DÍAS REST.
        </span>
      </div>

      <h3 className="text-text-primary font-semibold text-[0.95rem] line-clamp-2 h-12 mb-6 leading-snug">
        {data.title}
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle text-center">
          <span className="block text-[9px] text-text-tertiary uppercase mb-0.5">Mercado</span>
          <span className="font-mono text-lg font-semibold">{data.marketProb}%</span>
        </div>
        <div className={`bg-bg-base/50 p-2 rounded-lg border-l-2 text-center ${isPositiveEdge ? 'border-brand-emerald' : 'border-brand-danger'}`}>
          <span className="block text-[9px] text-text-tertiary uppercase mb-0.5">Nuestra Estim.</span>
          <span className={`font-mono text-lg font-semibold ${isPositiveEdge ? 'text-brand-emerald' : 'text-brand-danger'}`}>{data.ourProb}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
          <span className="font-medium">Convicción {data.conviction}/10</span>
          <span className={`font-bold ${isPositiveEdge ? 'text-brand-emerald' : 'text-brand-danger'}`}>
            {isPositiveEdge ? '+' : ''}{edge} EDGE
          </span>
        </div>
        <div className="h-1 bg-border-subtle rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-slate-600" 
            style={{ width: `${Math.min(data.marketProb, data.ourProb)}%` }} 
          />
          <div 
            className={`h-full ${isPositiveEdge ? 'bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-brand-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
            style={{ 
              width: `${Math.abs(edge)}%` 
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-text-tertiary pt-4 border-t border-border-subtle/30">
        <span>Publicado {new Date(data.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
        <span className="font-mono">Liq. {data.liquidity}</span>
      </div>

      <button 
        onClick={onPremiumClick}
        className="w-full mt-6 flex items-center justify-center gap-1 text-brand-indigo font-bold text-[11px] uppercase tracking-wider hover:underline transition-all"
      >
        Ver análisis completo <ChevronRight size={14} />
      </button>
    </motion.div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string, key?: React.Key }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border-subtle">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex justify-between items-center text-left hover:text-brand-indigo transition-colors"
      >
        <span className="font-medium text-text-primary pr-8">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="text-text-tertiary"
        >
          <Plus size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-text-secondary leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AcademyCard = ({ article, onRead }: { article: AcademyArticle, onRead: (article: AcademyArticle) => void, key?: React.Key }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden group hover:border-brand-indigo/40 transition-all"
    >
      <div className="h-48 bg-bg-base relative overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent opacity-60" />
        <div className="absolute top-4 left-4">
          <span className="bg-bg-base/80 backdrop-blur-md text-[10px] text-text-secondary font-bold px-2 py-1 rounded uppercase tracking-widest border border-border-subtle">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-text-tertiary text-[10px] mb-3">
          <Calendar size={12} />
          <span>Publicado hoy</span>
          <span className="mx-1">·</span>
          <Zap size={12} className="text-brand-indigo" />
          <span>{article.readTime} de lectura</span>
        </div>
        <h3 className="text-text-primary font-semibold text-lg mb-3 leading-tight group-hover:text-brand-indigo transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-text-secondary text-sm mb-6 line-clamp-2 leading-relaxed">
          {article.description}
        </p>
        <button 
          onClick={() => onRead(article)}
          className="flex items-center gap-2 text-text-primary text-xs font-bold uppercase tracking-widest hover:gap-3 transition-all"
        >
          Leer artículo <ArrowRight size={14} className="text-brand-indigo" />
        </button>
      </div>
    </motion.div>
  );
};

const ArticlePage = ({ article, onBack }: { article: AcademyArticle, onBack: () => void }) => {
  return (
    <div className="min-h-screen pt-12 pb-24 bg-bg-base">
      <div className="max-w-4xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary mb-12 transition-colors font-medium"
        >
          <ArrowRight size={16} className="rotate-180" /> Volver a la Academia
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-brand-indigo/10 text-brand-indigo text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {article.category}
            </span>
            <span className="text-text-tertiary text-xs flex items-center gap-1">
              <Clock size={12} /> {article.readTime} de lectura
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">{article.title}</h1>
          
          <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-12">
            <img 
              src={article.image} 
              alt={article.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </header>

        <article className="prose prose-invert max-w-none">
          <div className="space-y-6 text-text-secondary leading-relaxed text-lg">
            {article.content.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>

        <div className="mt-20 pt-12 border-t border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-indigo flex items-center justify-center text-white font-bold">ED</div>
            <div>
              <p className="text-text-primary font-bold">Equipo Edgio</p>
              <p className="text-text-tertiary text-xs">Research & Intelligence</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full text-text-tertiary transition-colors"><Mail size={20} /></button>
            <button className="p-2 hover:bg-white/5 rounded-full text-text-tertiary transition-colors"><ExternalLink size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = ({ plan, onBack }: { plan: Plan, onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 max-w-5xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-text-tertiary hover:text-text-primary mb-12 transition-colors font-medium"
      >
        <ArrowRight size={16} className="rotate-180" /> Volver a planes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-4 mb-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step >= 1 ? 'bg-brand-indigo border-brand-indigo text-white' : 'border-border-subtle text-text-tertiary'}`}>1</div>
            <div className="h-[2px] w-12 bg-border-subtle" />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step >= 2 ? 'bg-brand-indigo border-brand-indigo text-white' : 'border-border-subtle text-text-tertiary'}`}>2</div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-3xl font-semibold mb-2">Información de cuenta</h2>
                <p className="text-text-secondary mb-8">Introduce tus datos para empezar tu suscripción.</p>

                <form onSubmit={handleNext} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">Email de acceso</label>
                    <input 
                      required
                      type="email"
                      placeholder="ejemplo@email.com"
                      className="w-full bg-bg-card border border-border-subtle rounded-xl px-5 py-3.5 outline-none focus:border-brand-indigo transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-brand-indigo hover:brightness-110 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-indigo/20 transition-all flex items-center justify-center gap-2"
                  >
                    Siguiente paso <ChevronRight size={18} />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-3xl font-semibold mb-2">Método de pago</h2>
                <p className="text-text-secondary mb-8">Pago 100% seguro procesado por Stripe.</p>

                <div className="space-y-6">
                  <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-xl p-4 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-brand-indigo" size={20} />
                      <span className="text-sm font-medium">Encriptación SSL de 256 bits</span>
                    </div>
                    <div className="flex gap-2">
                       <div className="w-8 h-5 bg-white/10 rounded" />
                       <div className="w-8 h-5 bg-white/10 rounded" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">Nombre en la tarjeta</label>
                      <input 
                        type="text"
                        className="w-full bg-bg-card border border-border-subtle rounded-xl px-5 py-3.5 outline-none focus:border-brand-indigo transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">Número de tarjeta</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          className="w-full bg-bg-card border border-border-subtle rounded-xl px-5 py-3.5 outline-none focus:border-brand-indigo transition-all pr-12"
                        />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">Expiración</label>
                        <input 
                          type="text"
                          placeholder="MM/YY"
                          className="w-full bg-bg-card border border-border-subtle rounded-xl px-5 py-3.5 outline-none focus:border-brand-indigo transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-tertiary mb-2">CVC</label>
                        <input 
                          type="text"
                          placeholder="123"
                          className="w-full bg-bg-card border border-border-subtle rounded-xl px-5 py-3.5 outline-none focus:border-brand-indigo transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button className="w-full bg-brand-indigo hover:brightness-110 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-indigo/20 transition-all flex items-center justify-center gap-2 mt-8">
                    Finalizar pago: {plan.price}{plan.period && <span className="text-white/60 font-normal">/{plan.period}</span>}
                  </button>
                  <p className="text-center text-[11px] text-text-tertiary mt-4">
                    Al confirmar, aceptas nuestros términos de servicio y política de privacidad.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Plan Summary */}
        <div className="lg:col-span-2">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 sticky top-28">
            <h3 className="text-lg font-bold mb-6 pb-6 border-b border-border-subtle">Resumen del pedido</h3>
            
            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-text-primary block">Plan {plan.name}</span>
                  <span className="text-text-tertiary text-xs uppercase tracking-widest">Acceso Completo</span>
                </div>
                <span className="font-mono font-bold text-lg">{plan.price}</span>
              </div>

              <div className="space-y-3">
                {plan.features.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex gap-2 text-xs text-text-secondary">
                    <CheckCircle2 size={14} className="text-brand-emerald shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border-subtle">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Subtotal</span>
                <span className="text-text-primary">{plan.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Impuestos</span>
                <span className="text-text-primary">0,00€</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4">
                <span>Total</span>
                <span className="text-brand-indigo">{plan.price}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-xs text-text-tertiary bg-white/5 p-4 rounded-xl">
                <Clock size={16} />
                <span>Activación instantánea tras el pago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'invalid' | 'submitting' | 'success'>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'checkout' | 'article'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<AcademyArticle | null>(null);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const analysisCards: AnalysisCard[] = [
    {
      id: '1',
      category: 'Política',
      title: '¿Ganará la candidata de la oposición la segunda vuelta en Brasil?',
      marketProb: 42,
      ourProb: 53,
      conviction: 8,
      publishedAt: '2024-04-20',
      liquidity: '$124.5k',
      daysRemaining: 14
    },
    {
      id: '2',
      category: 'Economía',
      title: '¿Recortará el BCE tipos antes de la reunión de junio?',
      marketProb: 61,
      ourProb: 65,
      conviction: 6,
      publishedAt: '2024-04-18',
      liquidity: '$2.1M',
      daysRemaining: 42
    },
    {
      id: '3',
      category: 'Crypto',
      title: '¿Alcanzará Ethereum un nuevo máximo histórico antes de julio?',
      marketProb: 34,
      ourProb: 22,
      conviction: 7,
      publishedAt: '2024-04-21',
      liquidity: '$890k',
      daysRemaining: 68
    }
  ];

  const trackRecord: TrackRecordEntry[] = [
    { event: 'Aprobación ETF Bitcoin', date: '08 ene', ourEst: 92, marketPrice: 78, edge: 14, resolution: '10 ene', outcome: 'Aprobado', correct: true },
    { event: 'Elecciones Primarias NH', date: '21 ene', ourEst: 84, marketPrice: 88, edge: -4, resolution: '23 ene', outcome: 'Ganador X', correct: true },
    { event: 'Mantenimiento Tipos FED', date: '29 ene', ourEst: 98, marketPrice: 94, edge: 4, resolution: '31 ene', outcome: 'Mantuvieron', correct: true },
    { event: 'Fusión empresa Tech-X', date: '12 feb', ourEst: 35, marketPrice: 22, edge: 13, resolution: '20 feb', outcome: 'Cancelada', correct: true },
    { event: 'Lanzamiento SpaceX Starship', date: '05 mar', ourEst: 65, marketPrice: 72, edge: -7, resolution: '14 mar', outcome: 'Éxito parcial', correct: false },
    { event: 'Oscars: Mejor Película', date: '08 mar', ourEst: 91, marketPrice: 85, edge: 6, resolution: '10 mar', outcome: 'Correcto', correct: true },
    { event: 'Inflación marzo < 3.4%', date: '05 abr', ourEst: 42, marketPrice: 58, edge: -16, resolution: '12 abr', outcome: '3.5%', correct: false },
    { event: 'Elecciones Parlamento UE', date: '12 abr', ourEst: 55, marketPrice: 62, edge: -7, resolution: '15 abr', outcome: 'Resultado Y', correct: false }
  ];

  const academyArticles: AcademyArticle[] = [
    {
      id: '1',
      title: 'Bayesianismo para Humanos: Cómo actualizar tus creencias',
      category: 'Fundamentos',
      readTime: '5 min',
      description: 'Aprende a procesar nueva información sin caer en el sesgo de confirmación usando el Teorema de Bayes.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop',
      content: `El cerebro humano no está naturalmente diseñado para la estadística. Tendemos a sobrevalorar la información reciente y a ignorar la probabilidad base. Aquí es donde entra Thomas Bayes.\n\nLa inferencia bayesiana es una herramienta para actualizar la probabilidad de una hipótesis a medida que hay más evidencia o información disponible. En lugar de ver las probabilidades como frecuencias fijas, el bayesiano las ve como "niveles de creencia".\n\n¿Cómo aplicarlo en mercados de predicción? Empieza con un "prior" (probabilidad base). Si ocurre un evento nuevo, no cambies tu opinión al 100%. Pregúntate: ¿Cuál es la probabilidad de que este evento ocurra si mi hipótesis inicial es cierta vs. si es falsa? Esa pequeña diferencia es la que te permite ajustar tu estimación de forma matemática y fría.`
    },
    {
      id: '2',
      title: 'Superforecasting 101: Hábitos de los mejores predictores',
      category: 'Estrategia',
      readTime: '8 min',
      description: 'Philip Tetlock identificó qué separa a los expertos de los simples opinólogos. Aquí están sus leyes.',
      image: 'https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=1200&auto=format&fit=crop',
      content: `En su estudio de décadas, Philip Tetlock descubrió que hay un grupo de personas que superan consistentemente a los algoritmos y a los expertos de inteligencia. No son genios, tienen procesos.\n\nEl hábito número uno es la descomposición: romper problemas grandes en preguntas Fermi más pequeñas. ¿Ganará el candidato X? Se convierte en: ¿Cuál es la aprobación histórica con este desempleo? ¿Qué estados son clave?\n\nSegundo hábito: la actualización granular. Los superpredictores ajustan sus probabilidades en incrementos pequeños (del 45% al 47%) en lugar de saltos bruscos. Están abiertos a "estar menos equivocados" cada día.`
    },
    {
      id: '3',
      title: 'Criterio de Kelly: Cómo dimensionar tus posiciones',
      category: 'Banking',
      readTime: '6 min',
      description: 'La gestión monetaria es tan importante como la predicción. Maximiza tu crecimiento con esta fórmula.',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1200&auto=format&fit=crop',
      content: `Puedes tener la razón 9 de cada 10 veces y aún así ir a la quiebra si no sabes gestionar tu capital. El Criterio de Kelly es la fórmula matemática para el tamaño óptimo de las posiciones.\n\nLa fórmula básica es: f* = (bp - q) / b. Donde f* es la fracción de tu capital, p es la probabilidad de éxito, b son las cuotas y q es la probabilidad de fracaso.\n\nEn Edgio, usamos el "Half-Kelly". Es una versión más conservadora que reduce la volatilidad de tu cuenta pero mantiene una ventaja matemática a largo plazo. Nunca pongas más del 5% de tu capital en una sola pregunta, por muy seguro que estés.`
    },
    {
      id: '4',
      title: 'Diferenciando Ruido e Información en Polymarket',
      category: 'Análisis',
      readTime: '10 min',
      description: 'Por qué la volatilidad de precios no siempre significa cambio de tendencia en las probabilidades reales.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      content: `Los mercados de predicción son volátiles. Un tweet, un rumor o una orden de compra grande pueden cambiar el precio en segundos. Pero, ¿cambia eso la realidad del evento?\n\nEl ruido surge de traders emocionales o de "fat fingers". La información real surge de datos verificables: encuestas, informes financieros o resoluciones judiciales.\n\nAprender a no reaccionar al ruido es la diferencia entre un trader de retail y un analista institucional. Si el precio cae al 30% pero tus modelos siguen dando un 60%, no es momento de dudar, es momento de comprar el descuento.`
    }
  ];

  const filteredCards = useMemo(() => {
    return analysisCards.filter(card => {
      const matchesCategory = activeFilter === 'Todos' || card.category === activeFilter;
      
      const cardDate = new Date(card.publishedAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const matchesDate = (!start || cardDate >= start) && (!end || cardDate <= end);
      
      return matchesCategory && matchesDate;
    });
  }, [activeFilter, startDate, endDate, analysisCards]);

  const calibrateData: any = {
    datasets: [
      {
        label: 'Track Record PI',
        data: [
          { x: 10, y: 12 }, { x: 20, y: 18 }, { x: 30, y: 32 }, { x: 40, y: 44 },
          { x: 50, y: 48 }, { x: 60, y: 62 }, { x: 70, y: 68 }, { x: 80, y: 84 },
          { x: 90, y: 92 }
        ],
        backgroundColor: '#6366F1',
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Calibración Perfecta',
        data: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        type: 'line',
        borderColor: '#475569',
        borderDash: [5, 5],
        borderWidth: 1,
        fill: false,
        pointRadius: 0
      }
    ]
  };

  const calibrateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: '#1E1E2E' },
        ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono' } },
        title: { display: true, text: 'Probabilidad Estimada (%)', color: '#475569' }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: '#1E1E2E' },
        ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono' } },
        title: { display: true, text: 'Frecuencia Real (%)', color: '#475569' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111118',
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        borderColor: '#1E1E2E',
        borderWidth: 1,
        padding: 12,
        displayColors: false
      }
    }
  };

  const validateEmail = (e: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(e);
  };

  const handleSubscribePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadArticle = (article: AcademyArticle) => {
    setSelectedArticle(article);
    setView('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('light-mode');
  };

  // --- Animation Intersection Observer ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const navItems = [
    { name: 'Inicio', id: 'inicio' },
    { name: 'Análisis', id: 'analisis' },
    { name: 'Track Record', id: 'track-record' },
    { name: 'Guía', id: 'guia' },
    { name: 'Metodología', id: 'metodologia' },
    { name: 'Academia', id: 'academia' },
    { name: 'Suscripción', id: 'suscripcion' }
  ];

  return (
    <div className={`min-h-screen bg-bg-base transition-colors duration-500`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-brand-indigo text-white px-6 py-3 rounded-xl shadow-2xl font-semibold flex items-center gap-2"
          >
            <ShieldCheck size={20} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Progress */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-brand-indigo z-[110] origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="sticky top-0 z-[100] backdrop-blur-xl bg-bg-base/85 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="w-8 h-8 rounded-lg bg-brand-indigo flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              ◆
            </span>
            <span className="font-semibold text-lg tracking-tight hidden sm:inline-block">
              Edgio
            </span>
            <span className="font-semibold text-lg tracking-tight sm:hidden">EDG</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, idx) => (
              <a 
                key={item.name} 
                href={`#${item.id}`} 
                className={`${idx === 0 ? 'text-brand-indigo' : 'text-text-secondary hover:text-text-primary'} text-sm font-medium transition-colors`}
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-text-tertiary hover:text-brand-indigo transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => showToast('Módulo de acceso en desarrollo')}
              className="hidden sm:inline-block text-sm font-medium text-text-secondary hover:text-text-primary px-4 py-2 rounded-md transition-colors"
            >
              Acceder
            </button>
            <button 
              onClick={() => {
                if (view !== 'landing') {
                  setView('landing');
                } else {
                  document.getElementById('suscripcion')?.scrollIntoView();
                }
              }}
              className="bg-brand-indigo hover:brightness-110 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
            >
              Suscribirse
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-text-primary"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-bg-card z-[160] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="font-semibold text-brand-indigo">◆ EDG</span>
                <button onClick={() => setIsMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                {navItems.map(item => (
                  <a 
                    key={item.name} 
                    href={`#${item.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-text-secondary active:text-brand-indigo"
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Section 1: Hero */}
              <section id="inicio" className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-6 grid-pattern overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
      <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-2xl p-6 md:p-8 mb-12">
        <div className="inline-flex items-center gap-2 px-2 py-1 bg-brand-indigo/10 border border-brand-indigo/30 rounded-full text-brand-indigo text-[10px] font-bold uppercase tracking-wider mb-6">
          → Nuevo análisis publicado: Elecciones Generales en Uruguay
        </div>
        <h1 className="text-text-primary text-[2.5rem] md:text-[4rem] font-semibold leading-[1.05] mb-8 tracking-tight">
          Detectamos ineficiencias en los mercados de predicción.
        </h1>
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Análisis cuantitativo de mercados sin hype. Sistema basado en superforecasting e inteligencia bayesiana para identificar dónde el mercado está equivocado.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => document.getElementById('analisis')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-brand-indigo hover:brightness-110 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-indigo/20 text-lg"
          >
            Ver análisis activos
          </button>
          <button 
            onClick={() => document.getElementById('metodologia')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto border border-border-subtle hover:bg-white/5 font-semibold px-8 py-4 rounded-xl transition-all text-lg"
          >
            ¿Cómo funciona?
          </button>
        </div>
      </div>

            {/* Hero Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-20 max-w-[580px] mx-auto bg-bg-card border border-border-subtle rounded-2xl p-8 shadow-2xl relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-indigo/20 to-brand-emerald/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-emerald rounded-full animate-pulse" />
                    <span className="text-text-tertiary text-xs font-semibold uppercase tracking-widest">Análisis en vivo · Activo</span>
                  </div>
                  <BarChart3 size={16} className="text-brand-indigo" />
                </div>
                
                <h4 className="text-left text-xl font-medium mb-8">¿Ganará el Partido Nacional las próximas elecciones en Uruguay?</h4>
                
                <div className="grid grid-cols-2 gap-8 mb-8 text-left">
                  <div>
                    <span className="text-text-tertiary text-[10px] uppercase block mb-1">Mercado</span>
                    <span className="font-mono text-3xl font-semibold text-text-secondary">62%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-tertiary text-[10px] uppercase block mb-1">Nuestra Estimación</span>
                    <span className="font-mono text-3xl font-semibold text-brand-emerald">71%</span>
                  </div>
                </div>

                <div className="relative h-2 bg-border-subtle rounded-full mb-4 overflow-hidden">
                  <div className="absolute h-full bg-brand-indigo/40" style={{ width: '62%' }} />
                  <div className="absolute h-full bg-brand-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ left: '62%', width: '9%' }} />
                </div>

                <div className="flex justify-between items-center mb-8">
                  <div className="bg-brand-emerald/10 text-brand-emerald px-2 py-1 rounded text-xs font-bold font-mono">
                    +9 PUNTOS EDGE
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target size={14} className="text-brand-indigo" />
                    <span className="text-text-secondary text-xs">Convicción: 7/10</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-text-tertiary border-t border-border-subtle/50 pt-4">
                  <span>Liq: $47.200</span>
                  <span>Res: 23 días</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Credibility Metrics */}
        <section className="bg-bg-card/50 border-y border-border-subtle py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-16 animate-on-scroll">Track record público. Sin filtrar.</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-0">
              <div className="md:border-r border-border-subtle">
                <StatItem value="73%" label="Tasa de acierto" subtext="últimas 60 predicciones" highlight="emerald" />
              </div>
              <div className="md:border-r border-border-subtle md:pl-8">
                <StatItem value="0.18" label="Brier Score" subtext="vs 0.24 del mercado base" />
              </div>
              <div className="md:border-r border-border-subtle md:pl-8">
                <StatItem value="+8.3" label="Edge Promedio" subtext="en decisiones de alta convicción" highlight="emerald" />
              </div>
              <div className="md:pl-8">
                <StatItem value="94" label="Predicciones" subtext="documentadas públicamente" />
              </div>
            </div>
            <p className="mt-16 text-text-tertiary text-[11px] font-medium uppercase tracking-widest animate-on-scroll">
              Actualizado cada domingo. <button onClick={() => document.getElementById('metodologia')?.scrollIntoView({ behavior: 'smooth' })} className="text-brand-indigo hover:underline">Metodología de cálculo documentada →</button>
            </p>
          </div>
        </section>

        {/* Section 3: Active Analysis */}
        <section id="analisis" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-semibold">Análisis publicados</h2>
                <span className="bg-brand-indigo/10 text-brand-indigo text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">3 Activos</span>
              </div>
              <p className="text-text-secondary max-w-xl">
                Detección sistemática de sesgos en mercados globales. Actualizado en tiempo real según nuevos flujos de información.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {['Todos', 'Política', 'Economía', 'Crypto', 'Deportes'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeFilter === filter 
                        ? 'bg-brand-indigo text-white' 
                        : 'bg-bg-card border border-border-subtle text-text-secondary hover:border-text-tertiary'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 bg-bg-card border border-border-subtle p-2 rounded-xl self-start">
                <Calendar size={14} className="text-text-tertiary ml-2" />
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs text-text-secondary outline-none focus:text-brand-indigo transition-colors"
                  />
                  <span className="text-text-tertiary text-[10px]">a</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs text-text-secondary outline-none focus:text-brand-indigo transition-colors"
                  />
                </div>
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-1 hover:bg-white/10 rounded-full text-text-tertiary transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCards.map(card => (
                <AnalysisCardComp 
                  key={card.id} 
                  data={card} 
                  onPremiumClick={() => handleSubscribePlan({ 
                    id: 'pro', 
                    name: 'Analista', 
                    price: '19€', 
                    period: 'mes', 
                    features: ['Grupo Telegram privado exclusivo', '4-5 análisis semanales completos', 'Intervalos de confianza detallados', 'Alertas de movimientos anómalos', 'Prompts de análisis avanzado', 'Track record con métricas en vivo', 'Sesión de calibración mensual', 'Soporte directo prioritario'] 
                  })}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-16 text-center animate-on-scroll">
            <button 
              onClick={() => document.getElementById('suscripcion')?.scrollIntoView({ behavior: 'smooth' })}
              className="border border-border-subtle hover:bg-white/5 font-semibold px-8 py-3 rounded-xl transition-all"
            >
              Ver todos los análisis →
            </button>
          </div>
        </section>

        {/* Section 4: Methodology */}
        <section id="metodologia" className="py-32 px-6 bg-bg-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 animate-on-scroll">
              <h2 className="text-3xl font-semibold mb-4">El sistema. No el resultado.</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                No buscamos tener razón siempre. Buscamos que nuestras probabilidades sean más precisas que las del mercado a largo plazo.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
              <div className="animate-on-scroll">
                <span className="text-brand-indigo font-mono text-sm block mb-4">Framework EDGE</span>
                <h3 className="text-2xl font-semibold mb-6">Estimamos probabilidades reales, no opiniones</h3>
                <p className="text-text-secondary mb-8 leading-relaxed">
                  Utilizamos un riguroso proceso de actualización bayesiana. Empezamos con tasas base históricas y ajustamos sistemáticamente ante nueva información, evitando el sesgo de recencia que suele dominar el mercado.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: '◆', title: 'Base rate histórica', text: 'Análisis de frecuencia de eventos similares.' },
                    { icon: '◆', title: 'Actualización bayesiana', text: 'Peso proporcional de la información nueva.' },
                    { icon: '◆', title: 'Detección de sesgo', text: 'Identificación de lo que el precio está ignorando.' },
                    { icon: '◆', title: 'Edge calculation', text: 'Diferencia estadística neta entre el sistema y el mercado.' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-brand-indigo font-bold mt-1">{item.icon}</span>
                      <div>
                        <span className="font-semibold block">{item.title}</span>
                        <span className="text-text-tertiary text-sm">{item.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="animate-on-scroll">
                <div className="bg-bg-base border border-brand-indigo/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Zap size={120} />
                  </div>
                  <div className="font-mono text-sm space-y-6">
                    <div className="flex justify-between items-center text-brand-indigo">
                      <span>Formula::Edge</span>
                      <ShieldCheck size={16} />
                    </div>
                    
                    <div className="text-2xl font-semibold text-text-primary py-4 border-y border-border-subtle">
                      Edge = P_estimada − P_mercado
                    </div>

                    <div className="space-y-4 pt-4">
                      <span className="text-text-tertiary uppercase text-xs tracking-widest block mb-2">Criterios de ejecución:</span>
                      {[
                        '|Edge| > 8 puntos',
                        'Liquidez > $5.000',
                        'Resolución > 7 días',
                        'Convicción >= 6/10'
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-text-secondary">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 animate-on-scroll h-[400px]">
                <Scatter data={calibrateData} options={calibrateOptions} />
              </div>
              <div className="order-1 lg:order-2 animate-on-scroll">
                 <span className="text-brand-indigo font-mono text-sm block mb-4">Métrica Maestra</span>
                <h3 className="text-2xl font-semibold mb-6">Calibración y Brier Score</h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  La transparencia es nuestro producto. Un buen analista no es el que siempre acierta, sino el que está bien calibrado: si decimos que algo ocurrirá el 70% de las veces, debe ocurrir exactamente 7 de cada 10 veces.
                </p>
                <div className="bg-bg-card border border-border-subtle p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <span className="font-semibold block">Superávit de Calibración</span>
                      <span className="text-text-tertiary text-sm">Nuestro Brier Score está sistemáticamente por debajo del mercado.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Detailed Track Record */}
        <section id="track-record" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 animate-on-scroll">
              <div>
                <h2 className="text-3xl font-semibold mb-4">Track record completo. Sin filtrar.</h2>
                <p className="text-text-secondary">
                  Todos los análisis publicados, independientemente del resultado final.
                </p>
              </div>
              <button className="flex items-center gap-2 text-text-tertiary hover:text-brand-indigo text-xs font-semibold uppercase tracking-widest transition-colors">
                Descargar CSV completo <ExternalLink size={14} />
              </button>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden animate-on-scroll shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-border-subtle/50 text-text-tertiary uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Evento</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4 text-center">Estimación</th>
                      <th className="px-6 py-4 text-center">Mercado</th>
                      <th className="px-6 py-4 text-center">Edge</th>
                      <th className="px-6 py-4">Resolución</th>
                      <th className="px-6 py-4 text-center">¿Acertamos?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/30">
                    {trackRecord.map((row, i) => (
                      <tr key={i} className="hover:bg-brand-indigo/[0.03] transition-colors group">
                        <td className="px-6 py-4 text-text-primary font-sans font-medium">{row.event}</td>
                        <td className="px-6 py-4 text-text-tertiary">{row.date}</td>
                        <td className="px-6 py-4 text-center text-text-secondary">{row.ourEst}%</td>
                        <td className="px-6 py-4 text-center text-text-secondary">{row.marketPrice}%</td>
                        <td className={`px-6 py-4 text-center font-bold ${row.edge > 0 ? 'text-brand-emerald' : 'text-brand-danger'}`}>
                          {row.edge > 0 ? '+' : ''}{row.edge}
                        </td>
                        <td className="px-6 py-4 text-text-tertiary italic">{row.resolution}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.correct ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-danger/10 text-brand-danger'}`}>
                            {row.correct ? '✓ SÍ' : '✗ NO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-on-scroll">
              <div className="bg-bg-card/50 border border-border-subtle p-4 rounded-lg flex justify-between items-center group hover:border-brand-indigo/30 transition-colors">
                <span className="text-text-tertiary text-[10px] uppercase font-semibold">Brier Score</span>
                <span className="font-mono font-bold text-text-primary">0.18 <span className="text-text-tertiary font-normal">vs 0.24</span></span>
              </div>
              <div className="bg-bg-card/50 border border-border-subtle p-4 rounded-lg flex justify-between items-center group hover:border-brand-indigo/30 transition-colors">
                <span className="text-text-tertiary text-[10px] uppercase font-semibold">Accuracy Direccional</span>
                <span className="font-mono font-bold text-brand-emerald">73%</span>
              </div>
              <div className="bg-bg-card/50 border border-border-subtle p-4 rounded-lg flex justify-between items-center group hover:border-brand-indigo/30 transition-colors">
                <span className="text-text-tertiary text-[10px] uppercase font-semibold">Edge Avg Aciertos</span>
                <span className="font-mono font-bold text-brand-indigo">+11.2 pts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Academy */}
        <section id="academia" className="py-32 px-6 bg-bg-base relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6 animate-on-scroll">
              <div>
                <span className="text-brand-indigo font-mono text-sm block mb-4 uppercase tracking-[0.2em]">Cursos y Formación</span>
                <h2 className="text-4xl font-semibold mb-4 leading-tight">Academia de Probabilidad</h2>
                <p className="text-text-secondary max-w-xl">
                  Artículos educativos para dominar el arte del forecasting y la gestión sistemática de ineficiencias de mercado.
                </p>
              </div>
              <button 
                onClick={() => document.getElementById('academia')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-brand-indigo font-bold text-sm hover:underline transition-all"
              >
                Explorar todos los cursos →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-on-scroll">
              {academyArticles.map(article => (
                <AcademyCard key={article.id} article={article} onRead={handleReadArticle} />
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Operating Guide (Polymarket) */}
        <section id="guia" className="py-32 px-6 bg-bg-card/50 border-y border-border-subtle">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 animate-on-scroll">
              <h2 className="text-3xl font-semibold mb-4">Cómo operar en Polymarket</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                No somos Polymarket, pero somos tu brújula para navegarlo. Aquí tienes lo esencial para pasar del análisis a la ejecución.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Acceso y Wallet",
                  desc: "Polymarket utiliza la red Polygon. Puedes entrar con Google (a través de Privy) sin necesidad de configurar una billetera compleja previamente.",
                  items: ["Login rápido con Google", "Generación de Smart Wallet", "Sin necesidad de frases semilla"]
                },
                {
                  step: "02",
                  title: "Depósito de Fondos",
                  desc: "La moneda base es USDC. Debes fondear tu cuenta para poder operar. Polymarket facilita este proceso mediante rampas de pago.",
                  items: ["Compra directa con tarjeta (MoonPay/Robinhood)", "Transferencia desde Exchange (Binance/Coinbase)", "Importante: Red Polygon únicamente"]
                },
                {
                  step: "03",
                  title: "Mecánica de Trading",
                  desc: "Cada mercado es una pregunta binaria. Compras acciones de 'Sí' o 'No'. Los precios oscilan entre 0.01$ y 1.00$.",
                  items: ["Precio = Probabilidad de mercado", "Venta en cualquier momento", "Sin comisiones de ejecución (Gasless)"]
                },
                {
                  step: "04",
                  title: "Resolución de Mercados",
                  desc: "Los mercados se resuelven mediante oráculos (UMA Optimistic Oracle) una vez que el evento ocurre de forma verificable.",
                  items: ["Pago 1.00$ por acción acertada", "Pago 0.00$ por acción fallida", "Arbitraje transparente"]
                },
                {
                  step: "05",
                  title: "Verificación (KYC)",
                  desc: "Para usuarios que fondean con tarjeta o montos elevados, se requiere una verificación básica de identidad por cumplimiento normativo.",
                  items: ["Documento de identidad", "Verificación facial rápida", "Nivel de seguridad institucional"]
                },
                {
                  step: "06",
                  title: "Retirada de Capital",
                  desc: "Puedes retirar tus ganancias en cualquier momento de vuelta a tu billetera externa o mediante intercambiadores directos.",
                  items: ["Retiros instantáneos en USDC", "Intercambio a moneda local (Off-ramp)", "Transparencia total en On-chain"]
                }
              ].map((item, i) => (
                <div key={i} className="animate-on-scroll group">
                  <div className="flex items-start gap-6">
                    <span className="text-5xl font-mono font-bold text-brand-indigo/10 group-hover:text-brand-indigo/30 transition-colors leading-none">
                      {item.step}
                    </span>
                    <div className="pt-2">
                      <h3 className="text-xl font-semibold mb-3 text-text-primary">{item.title}</h3>
                      <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                        {item.desc}
                      </p>
                      <ul className="space-y-3">
                        {item.items.map((point, j) => (
                          <li key={j} className="flex items-center gap-2 text-[11px] text-text-tertiary font-medium uppercase tracking-tight">
                            <div className="w-1 h-1 bg-brand-emerald rounded-full" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-24 p-8 bg-brand-indigo/5 border border-brand-indigo/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 animate-on-scroll">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-indigo flex items-center justify-center text-white shadow-xl shadow-brand-indigo/20">
                  <ExternalLink size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-semibold">¿Listo para aplicar nuestra ventaja?</h4>
                  <p className="text-text-secondary text-sm">Visita la plataforma oficial para configurar tu cuenta.</p>
                </div>
              </div>
              <a 
                href="https://polymarket.com" 
                target="_blank" 
                rel="no-referrer"
                className="bg-brand-indigo hover:brightness-110 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2"
              >
                Abrir Polymarket <ChevronRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* Section 6: Pricing / Suscripción */}
        <section id="suscripcion" className="py-32 px-6 bg-[#0D0D16]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 animate-on-scroll">
              <h2 className="text-3xl font-semibold mb-4">Accede al sistema completo</h2>
              <p className="text-text-secondary max-w-xl mx-auto">
                Sin permanencias. El precio sube conforme el track record se consolida. Aprovecha el valor de lanzamiento.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free */}
              <div className="bg-bg-card border border-border-subtle p-8 rounded-2xl flex flex-col animate-on-scroll">
                <h4 className="text-xl font-semibold mb-2">Lector</h4>
                <div className="mb-6">
                  <span className="text-3xl font-bold">Gratis</span>
                </div>
                <p className="text-text-secondary text-sm mb-8">Para entender el sistema antes de comprometerte.</p>
                <div className="space-y-4 mb-10 flex-grow">
                  {[
                    'Canal Telegram público',
                    '1 análisis semanal gratuito',
                    'Resumen semanal de mercados',
                    'Metodología base pública',
                    'Track record histórico público'
                  ].map(f => (
                    <div key={f} className="flex gap-3 items-center text-sm">
                      <CheckCircle2 size={16} className="text-text-tertiary shrink-0" />
                      <span className="text-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleSubscribePlan({ 
                    id: 'free', 
                    name: 'Lector', 
                    price: 'Gratis', 
                    period: '', 
                    features: ['Canal Telegram público', '1 análisis semanal gratuito', 'Resumen semanal de mercados', 'Metodología base pública', 'Track record histórico público'] 
                  })}
                  className="w-full py-3 border border-border-subtle rounded-xl font-semibold hover:bg-white/5 transition-colors"
                >
                  Empezar gratis
                </button>
              </div>

              {/* Pro */}
              <div className="bg-bg-card border-2 border-brand-indigo p-8 rounded-2xl flex flex-col relative shadow-[0_0_40px_rgba(99,102,241,0.15)] animate-on-scroll">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-indigo text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Más popular
                </div>
                <h4 className="text-xl font-semibold mb-2">Analista</h4>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-text-primary">19€</span>
                  <span className="text-text-tertiary line-through text-lg">29€</span>
                  <span className="text-text-tertiary text-sm">/ mes</span>
                </div>
                <p className="text-text-secondary text-sm mb-8">El sistema completo para adelantarse a los movimientos del mercado.</p>
                <div className="space-y-4 mb-10 flex-grow">
                   <div className="flex gap-3 items-center text-sm font-semibold text-brand-indigo italic">
                    <Zap size={16} className="shrink-0" />
                    <span>Todo lo de Lector y además:</span>
                  </div>
                  {[
                    'Grupo Telegram privado exclusivo',
                    '4-5 análisis semanales completos',
                    'Intervalos de confianza detallados',
                    'Alertas de movimientos anómalos',
                    'Prompts de análisis avanzado',
                    'Track record con métricas en vivo',
                    'Sesión de calibración mensual',
                    'Soporte directo prioritario'
                  ].map(f => (
                    <div key={f} className="flex gap-3 items-center text-sm">
                      <CheckCircle2 size={16} className="text-brand-indigo shrink-0" />
                      <span className="text-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleSubscribePlan({ 
                    id: 'pro', 
                    name: 'Analista', 
                    price: '19€', 
                    period: 'mes', 
                    features: ['Grupo Telegram privado exclusivo', '4-5 análisis semanales completos', 'Intervalos de confianza detallados', 'Alertas de movimientos anómalos', 'Prompts de análisis avanzado', 'Track record con métricas en vivo', 'Sesión de calibración mensual', 'Soporte directo prioritario'] 
                  })}
                  className="w-full py-4 bg-brand-indigo text-white rounded-xl font-bold hover:brightness-110 shadow-lg shadow-brand-indigo/20 transition-all"
                >
                  Suscribirse ahora →
                </button>
              </div>

              {/* Annual */}
              <div className="bg-bg-card border border-brand-emerald p-8 rounded-2xl flex flex-col animate-on-scroll">
                <h4 className="text-xl font-semibold mb-2">Sistema</h4>
                <div className="mb-6 flex flex-col">
                  <span className="text-3xl font-bold text-text-primary">159€ <span className="text-xl font-normal text-text-tertiary">/ año</span></span>
                  <span className="text-brand-emerald text-[11px] font-bold mt-1 uppercase tracking-wider">Ahorras 69€</span>
                </div>
                <p className="text-text-secondary text-sm mb-8">Para quien entiende que la ventaja se construye con el tiempo.</p>
                <div className="space-y-4 mb-10 flex-grow">
                   <div className="flex gap-3 items-center text-sm font-semibold text-brand-emerald italic">
                    <Activity size={16} className="shrink-0" />
                    <span>Todo lo Pro y además:</span>
                  </div>
                  {[
                    'Curso de metodología completo (QA)',
                    'Acceso al historial de 24 meses',
                    'Prioridad en nuevas funciones',
                    'Exportación de datos premium',
                    'Consultoría trimestral personalizada'
                  ].map(f => (
                    <div key={f} className="flex gap-3 items-center text-sm">
                      <CheckCircle2 size={16} className="text-brand-emerald shrink-0" />
                      <span className="text-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleSubscribePlan({ 
                    id: 'annual', 
                    name: 'Sistema', 
                    price: '159€', 
                    period: 'año', 
                    features: ['Curso de metodología completo (QA)', 'Acceso al historial de 24 meses', 'Prioridad en nuevas funciones', 'Exportación de datos premium', 'Consultoría trimestral personalizada'] 
                  })}
                  className="w-full py-3 border border-brand-emerald text-brand-emerald rounded-xl font-semibold hover:bg-brand-emerald/5 transition-colors"
                >
                  Acceso anual →
                </button>
              </div>
            </div>

            <div className="mt-32 max-w-3xl mx-auto animate-on-scroll">
              <h3 className="text-2xl font-semibold text-center mb-12">Preguntas frecuentes</h3>
              <div className="space-y-1">
                {[
                  { q: '¿Esto son apuestas o consejos de inversión?', a: 'No. Somos un servicio de análisis y educación probabilística. No recomendamos operar en ningún mercado específico. Nuestra meta es proporcionar probabilidades precisas y metodología sistemática.' },
                  { q: '¿Qué pasa si el mercado no está disponible en mi país?', a: 'Ofrecemos análisis globalmente. El valor real está en aprender a identificar ineficiencias y aplicar el sistema, independientemente de tu capacidad de ejecución inmediata.' },
                  { q: '¿Cómo se calcula el track record?', a: 'Documentamos todas las estimaciones públicamente antes de que ocurra el evento. Utilizamos el Brier Score para medir objetivamente nuestra desviación sobre la verdad observada.' },
                  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. No existen periodos de permanencia. Puedes gestionar tu suscripción directamente desde tu panel de control, sin preguntas.' },
                  { q: '¿Publican todos los análisis, incluyendo los errores?', a: 'Absolutamente. La transparencia total es nuestro núcleo. Publicamos cada análisis y su resolución, especialmente las veces que el mercado tuvo razón y nosotros no.' }
                ].map((item, i) => (
                  <FAQItem key={i} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Newsletter */}
        <section className="py-24 px-6 bg-bg-card">
          <div className="max-w-4xl mx-auto text-center animate-on-scroll">
            <h2 className="text-3xl font-semibold mb-4">Recibe el análisis semanal gratuito</h2>
            <p className="text-text-secondary mb-10 text-lg">
              Cada lunes, un análisis completo de un mercado activo. Descubre el edge antes que nadie. Sin spam.
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="max-w-md mx-auto relative">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg-base border border-border-subtle rounded-xl px-5 py-3.5 outline-none focus:border-brand-indigo transition-all placeholder:text-text-tertiary text-text-primary"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-8 py-3.5 rounded-xl font-bold transition-all shrink-0 bg-brand-indigo hover:brightness-110 text-white shadow-lg shadow-brand-indigo/20"
                >
                  Suscribirse
                </button>
              </div>
            </form>
            
            <p className="mt-8 text-text-tertiary text-xs">
              Únete a <span className="text-text-secondary font-bold">+340 lectores</span> · Baja cuando quieras · Sin spam
            </p>
          </div>
        </section>
      </motion.div>
    ) : view === 'checkout' ? (
      <motion.div
        key="checkout"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
      >
        {selectedPlan && (
          <CheckoutPage 
            plan={selectedPlan} 
            onBack={() => setView('landing')} 
          />
        )}
      </motion.div>
    ) : view === 'article' ? (
      <motion.div
        key="article"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        {selectedArticle && (
          <ArticlePage 
            article={selectedArticle} 
            onBack={() => setView('landing')} 
          />
        )}
      </motion.div>
    ) : null}
  </AnimatePresence>
</main>

      <footer className="bg-[#07070C] pt-24 pb-12 px-6 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 text-sm">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-brand-indigo font-bold text-xl">◆ EDG</span>
                <span className="font-semibold text-lg">Edgio</span>
              </div>
              <p className="text-text-secondary leading-relaxed mb-8 max-w-xs">
                En un mundo de opiniones, nosotros ofrecemos probabilidades reales.
              </p>
              <span className="text-text-tertiary block">© 2024 Edgio</span>
            </div>

            <div>
              <h5 className="text-text-primary font-bold uppercase tracking-widest text-[11px] mb-6">Producto</h5>
              <ul className="space-y-4 text-text-secondary">
                {[
                  { name: 'Análisis', id: 'analisis' },
                  { name: 'Track Record', id: 'track-record' },
                  { name: 'Metodología', id: 'metodologia' },
                  { name: 'Guía Operativa', id: 'guia' }
                ].map(l => (
                  <li key={l.name}><a href={`#${l.id}`} className="hover:text-brand-indigo transition-colors">{l.name}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-text-primary font-bold uppercase tracking-widest text-[11px] mb-6">Legal</h5>
              <ul className="space-y-4 text-text-secondary">
                {['Aviso Legal', 'Privacidad', 'Cookies', 'Términos'].map(l => (
                  <li key={l}><button onClick={() => showToast('Sección legal próximamente disponible')} className="hover:text-brand-indigo transition-colors text-left">{l}</button></li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-text-primary font-bold uppercase tracking-widest text-[11px] mb-6">Comunidad</h5>
              <ul className="space-y-4 text-text-secondary">
                {[
                  { name: 'Twitter / X', url: 'https://twitter.com' },
                  { name: 'LinkedIn', url: 'https://linkedin.com' },
                  { name: 'Substack', url: 'https://substack.com' },
                  { name: 'Discord', url: 'https://discord.com' }
                ].map(l => (
                  <li key={l.name}><a href={l.url} target="_blank" rel="no-referrer" className="hover:text-brand-indigo transition-colors">{l.name}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border-subtle pt-8 text-center">
            <p className="text-text-tertiary text-[10px] leading-relaxed max-w-3xl mx-auto uppercase tracking-wider">
              Edgio no ofrece asesoramiento financiero ni de inversión. Los mercados de predicción implican riesgo real. Opera con responsabilidad y basándote en tu propia diligencia debida.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

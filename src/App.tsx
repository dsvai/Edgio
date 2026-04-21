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
  Clock,
  History,
  Settings,
  User,
  LogOut,
  Upload,
  Image as ImageIcon,
  Loader2,
  Send,
  Download,
  ChevronDown,
  Filter as FilterIcon,
  Check,
  X as XIcon
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController,
  LineController,
  CategoryScale
} from 'chart.js';
import { Scatter, Line } from 'react-chartjs-2';
import { 
  auth, 
  googleProvider, 
  syncUserProfile, 
  UserProfile, 
  db, 
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from './lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, ScatterController, LineController, CategoryScale);

import ReactMarkdown from 'react-markdown';

import { trackRecordData } from './data/trackRecordData';

// --- Types ---
interface Analysis {
  id: string;
  title: string;
  category: string;
  eventDate: any;
  pMarket: number;
  pReal: number;
  edge: number;
  content: string;
  summary: string;
  status: 'active' | 'resolved';
  resolution?: string;
  isCorrect?: boolean;
  isPremium?: boolean;
  imageUrl?: string;
  createdAt: any;
  polymarketId?: string; // ID for live sync
}

interface TrackRecordEntry {
  id?: string;
  event: string;
  date: string;
  ourEst: number;
  marketPrice: number;
  edge: number;
  resolution: string;
  resolutionTimestamp?: any;
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

const TrackRecordSection = () => {
  const [filter, setFilter] = useState('Todos');
  const [successFilter, setSuccessFilter] = useState<null | boolean>(null); // null: todos, true: aciertos, false: errores
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_VISIBLE_COUNT = 8;

  const filteredData = useMemo(() => {
    let data = [...trackRecordData];
    if (filter !== 'Todos') {
      data = data.filter(item => item.categoria === filter);
    }
    if (successFilter !== null) {
      data = data.filter(item => item.acierto === successFilter);
    }
    if (sortConfig) {
      data.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [filter, successFilter, sortConfig]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) return { accuracy: '0%', brier: '0.00', avgEdge: '+0.0 pts', total: 0 };
    
    const aciertos = filteredData.filter(d => d.acierto).length;
    const accuracy = ((aciertos / total) * 100).toFixed(0) + '%';
    
    const brierSum = filteredData.reduce((acc, curr) => {
      const outcome = curr.acierto ? (curr.resultado === 'SÍ' ? 1 : 0) : (curr.resultado === 'SÍ' ? 0 : 1);
      // Wait, Brier Score is (forecast - outcome)^2. 
      // If SÍ happens, outcome is 1. If NO happens, outcome is 0.
      // So if result is SÍ, and outcome is 1. If result is NO, outcome is 0.
      // acierto=true means our forecast was on the right side.
      // Forecast is estimacion / 100.
      const realOutcome = curr.resultado === 'SÍ' ? 1 : 0;
      return acc + Math.pow((curr.estimacion / 100) - realOutcome, 2);
    }, 0);
    const brier = (brierSum / total).toFixed(2);
    
    const correctData = filteredData.filter(d => d.acierto);
    const avgEdgeValue = correctData.length > 0 
      ? correctData.reduce((acc, curr) => acc + Math.abs(curr.edge), 0) / correctData.length
      : 0;
    const avgEdge = `+${avgEdgeValue.toFixed(1)} pts`;
    
    return { accuracy, brier, avgEdge, total };
  }, [filteredData]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const displayedData = showAll ? filteredData : filteredData.slice(0, INITIAL_VISIBLE_COUNT);

  const downloadCSV = () => {
    const headers = ["ID", "Evento", "Categoria", "Fecha Analisis", "Dias Antes", "Estimacion", "Precio Mercado", "Edge", "Resolucion", "Resultado", "Acierto", "Conviccion", "Liquidez", "Notas"];
    const csvRows = trackRecordData.map(d => [
      d.id,
      `"${d.evento}"`,
      d.categoria,
      d.fechaAnalisis,
      d.diasAntes,
      d.estimacion,
      d.precioMercado,
      d.edge,
      d.resolucion,
      d.resultado,
      d.acierto,
      d.conviccion,
      d.liquidez,
      `"${d.notas}"`
    ].join(","));
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "edgio_track_record.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="track-record" className="py-16 md:py-32 px-6 bg-bg-base">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 md:mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 leading-tight">Track Record completo</h2>
              <p className="text-text-secondary text-lg">Todos los análisis publicados antes de la resolución. Sin editar. Sin eliminar.</p>
            </div>
            
            <div className="grid grid-cols-2 md:flex gap-6">
                  <div className="bg-bg-card border border-border-subtle p-6 rounded-2xl min-w-[140px] group hover:border-brand-indigo/50 transition-colors">
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest block mb-2">Tasa de acierto</span>
                <span className="text-4xl font-mono font-bold text-brand-emerald">{stats.accuracy}</span>
              </div>
              <div className="bg-bg-card border border-border-subtle p-6 rounded-2xl min-w-[140px] group hover:border-brand-indigo/50 transition-colors">
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest block mb-2">Brier Score</span>
                <span className="text-4xl font-mono font-bold text-brand-indigo">{stats.brier}</span>
              </div>
              <div className="bg-bg-card border border-border-subtle p-6 rounded-2xl min-w-[140px] group hover:border-brand-indigo/50 transition-colors">
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest block mb-2">Edge Promedio</span>
                <span className="text-4xl font-mono font-bold text-brand-emerald">{stats.avgEdge}</span>
              </div>
              <div className="bg-bg-card border border-border-subtle p-6 rounded-2xl min-w-[140px] group hover:border-brand-indigo/50 transition-colors">
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest block mb-1">Predicciones</span>
                <span className="text-4xl font-mono font-bold text-brand-indigo">{stats.total}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-y border-border-subtle">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mr-4 flex items-center gap-2">
                <FilterIcon size={14} /> Filtros:
              </span>
              {['Todos', 'Política', 'Macro', 'Crypto', 'Mercados', 'Tecnología'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filter === cat 
                      ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' 
                      : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border-subtle hover:border-text-tertiary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 bg-bg-card p-1 rounded-xl border border-border-subtle">
              <button
                onClick={() => setSuccessFilter(null)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${successFilter === null ? 'bg-bg-base text-text-primary shadow' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                TODOS
              </button>
              <button
                onClick={() => setSuccessFilter(true)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${successFilter === true ? 'bg-brand-emerald/10 text-brand-emerald shadow' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                ACIERTOS
              </button>
              <button
                onClick={() => setSuccessFilter(false)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${successFilter === false ? 'bg-brand-danger/10 text-brand-danger shadow' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                ERRORES
              </button>
            </div>
          </div>
        </div>

        {/* Transparencia Box */}
        <div className="mb-8 p-6 bg-brand-indigo/5 border border-brand-indigo/30 rounded-3xl animate-on-scroll">
          <div className="flex items-start gap-4">
            <div className="bg-brand-indigo/10 p-3 rounded-full text-brand-indigo shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <h4 className="text-text-primary font-bold mb-2">Nota de transparencia</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                Los registros marcados en rojo son análisis incorrectos. Los publicamos con la misma prominencia que los aciertos porque la transparencia total es el núcleo de nuestra propuesta de valor.
              </p>
            </div>
          </div>
        </div>

        {/* Table Desktop */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-border-subtle bg-bg-base shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-border-subtle text-[10px] uppercase font-bold tracking-widest text-text-tertiary">
                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('fechaAnalisis')}>
                  Fecha {sortConfig?.key === 'fechaAnalisis' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('estimacion')}>
                  Est / Mkt {sortConfig?.key === 'estimacion' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('edge')}>
                  Edge {sortConfig?.key === 'edge' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-6 py-4">Convicción</th>
                <th className="px-6 py-4">Resultado</th>
                <th className="px-6 py-4 text-right">Acierto</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className={`group cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-bg-base' : 'bg-bg-card'} hover:bg-brand-indigo/5 ${!item.acierto ? 'border-l-4 border-brand-danger' : 'border-l-4 border-transparent'}`}
                  >
                    <td className="px-6 py-6 text-xs font-mono text-text-tertiary whitespace-nowrap">{item.fechaAnalisis}</td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-medium text-text-primary line-clamp-2">{item.evento}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-2 py-1 bg-brand-indigo/5 border border-brand-indigo/10 rounded text-[10px] font-bold text-text-secondary">{item.categoria}</span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-mono font-bold text-text-primary">{item.estimacion}%</span>
                        <span className="text-[10px] font-mono text-text-tertiary">{item.precioMercado}% mkt</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="relative group/tooltip">
                        <span className={`text-sm font-mono font-bold ${item.edge > 0 ? 'text-brand-emerald' : 'text-brand-danger'}`}>
                          {item.edge > 0 ? `+${item.edge}` : item.edge}
                        </span>
                        {Math.abs(item.edge) < 8 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-card border border-border-subtle rounded text-[10px] whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                            Edge por debajo del umbral
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex gap-0.5">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < item.conviccion ? 'bg-brand-indigo shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'bg-text-tertiary/20'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${item.resultado === 'SÍ' ? 'text-brand-emerald bg-brand-emerald/10' : 'text-brand-danger bg-brand-danger/10'}`}>
                        {item.resultado === 'SÍ' ? <Check size={10} /> : <XIcon size={10} />} {item.resultado}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.acierto ? 'text-brand-emerald bg-brand-emerald/10' : 'text-brand-danger bg-brand-danger/10'}`}>
                        {item.acierto ? 'ACIERTO' : 'ERROR'}
                      </span>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <motion.tr 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-brand-indigo/5 border-l-4 border-brand-indigo"
                    >
                      <td colSpan={8} className="px-12 py-8">
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1">
                            <h5 className="text-[10px] font-bold text-brand-indigo uppercase tracking-[0.2em] mb-4">Notas Retrospectivas</h5>
                            <p className="text-text-secondary leading-relaxed italic">"{item.notas}"</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-mono tracking-widest text-text-tertiary">
                            <div>Resolución: <span className="text-text-primary">{item.resolucion}</span></div>
                            <div>Días antes: <span className="text-text-primary">{item.diasAntes}</span></div>
                            <div>Liquidez: <span className="text-text-primary">${item.liquidez.toLocaleString()}</span></div>
                            <div>Convicción: <span className="text-text-primary">{item.conviccion}/10</span></div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {displayedData.map(item => (
            <motion.div 
              key={item.id}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className={`bg-bg-card border border-border-subtle rounded-2xl p-5 ${!item.acierto ? 'border-l-4 border-brand-danger' : 'border-l-4 border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{item.categoria} · {item.fechaAnalisis}</span>
                  <p className="text-sm font-bold text-text-primary leading-tight">{item.evento}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${item.resultado === 'SÍ' ? 'text-brand-emerald bg-brand-emerald/10' : 'text-brand-danger bg-brand-danger/10'}`}>
                   {item.resultado}
                </span>
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Estimación</span>
                      <span className="text-lg font-mono font-bold text-text-primary">{item.estimacion}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Mercado</span>
                      <span className="text-lg font-mono font-bold text-text-tertiary">{item.precioMercado}%</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < item.conviccion ? 'bg-brand-indigo' : 'bg-text-tertiary/20'}`} />
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-text-tertiary uppercase font-bold">Edge</span>
                    <span className={`text-2xl font-mono font-bold ${item.edge > 0 ? 'text-brand-emerald' : 'text-brand-danger'}`}>
                      {item.edge > 0 ? `+${item.edge}` : item.edge}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${item.acierto ? 'text-brand-emerald bg-brand-emerald/10' : 'text-brand-danger bg-brand-danger/10'}`}>
                      {item.acierto ? 'ACIERTO' : 'ERROR'}
                    </span>
                  </div>
                </div>
              </div>

              {expandedId === item.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-border-subtle"
                >
                   <p className="text-xs text-text-secondary leading-relaxed italic mb-4">"{item.notas}"</p>
                   <div className="grid grid-cols-2 gap-4 text-[9px] uppercase font-mono tracking-widest text-text-tertiary">
                      <div>Res: <span className="text-text-primary">{item.resolucion}</span></div>
                      <div>Días: <span className="text-text-primary">{item.diasAntes}</span></div>
                   </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Show More Button */}
        {filteredData.length > INITIAL_VISIBLE_COUNT && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-8 py-4 bg-brand-indigo/10 border border-brand-indigo/30 hover:bg-brand-indigo/20 text-brand-indigo rounded-2xl font-bold transition-all group"
            >
              {showAll ? (
                <>Ver menos <ChevronDown size={20} className="rotate-180 transition-transform group-hover:-translate-y-0.5" /></>
              ) : (
                <>Cargar más operaciones (+{filteredData.length - INITIAL_VISIBLE_COUNT}) <ChevronDown size={20} className="transition-transform group-hover:translate-y-0.5" /></>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border-subtle pt-8">
          <div className="flex items-center gap-4">
             <button 
               onClick={downloadCSV}
               className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-border-subtle hover:bg-white/10 rounded-2xl text-text-primary font-bold text-sm transition-all shadow-lg active:scale-95"
             >
               <Download size={18} /> Descargar CSV completo
             </button>
             <p className="text-xs text-text-tertiary">Metodología de cálculo documentada → <button className="text-brand-indigo hover:underline">Ver guía</button></p>
          </div>
          <p className="text-[10px] text-text-tertiary uppercase tracking-widest text-center md:text-right">
            Análisis publicados con fecha anterior a resolución. Sin modificaciones posteriores.
          </p>
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ value, label, subtext, highlight = 'indigo' }: { value: string, label: string, subtext: string, highlight?: 'indigo' | 'emerald', key?: React.Key }) => {
  const [count, setCount] = useState(0);
  const target = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isPercent = value.endsWith('%');
  const isEdge = value.startsWith('+');

  useEffect(() => {
    if (isNaN(target)) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 1200;
    const increment = target / (duration / 16);
    
    if (target === 0) {
      setCount(0);
      return;
    }
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

const AnalysisCardComp = ({ data, onClick, currentUser }: { data: any, onClick: () => void, currentUser: UserProfile | null, key?: React.Key }) => {
  const edge = (data.ourProb || data.pReal) - (data.marketProb || data.pMarket);
  const isPositiveEdge = edge > 0;
  const isPremium = data.isPremium === true;
  const adminEmail = 'dani.sanchez.vila@gmail.com';
  const isLocked = isPremium && 
                   (!currentUser || (currentUser.subscriptionStatus !== 'pro' && currentUser.subscriptionStatus !== 'annual')) &&
                   currentUser?.email !== adminEmail;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, borderColor: 'rgba(99,102,241,0.4)' }}
      className="bg-bg-card border border-border-subtle rounded-xl p-5 transition-all duration-200 group relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            data.category === 'Política' ? 'bg-brand-indigo/20 text-brand-indigo' :
            data.category === 'Economía' ? 'bg-brand-emerald/20 text-brand-emerald' :
            'bg-amber-500/20 text-amber-500'
          }`}>
            {data.category}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isPremium ? 'bg-brand-indigo text-white' : 'bg-brand-emerald/10 text-brand-emerald'
          }`}>
            {isPremium ? 'Premium' : 'Gratuito'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-text-tertiary">
          {data.daysRemaining || 7} DÍAS REST.
        </span>
      </div>

      <h3 className="text-text-primary font-semibold text-[0.95rem] line-clamp-2 h-12 mb-6 leading-snug">
        {data.title}
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-bg-base/50 p-2 rounded-lg border border-border-subtle text-center text-text-primary">
          <span className="block text-[9px] text-text-tertiary uppercase mb-0.5">Mercado</span>
          <span className="font-mono text-lg font-semibold">{data.marketProb || data.pMarket}%</span>
        </div>
        <div className={`bg-bg-base/50 p-2 rounded-lg border-l-2 text-center ${isPositiveEdge ? 'border-brand-emerald' : 'border-brand-danger'}`}>
          <span className="block text-[9px] text-text-tertiary uppercase mb-0.5">Nuestra Estim.</span>
          <span className={`font-mono text-lg font-semibold ${isPositiveEdge ? 'text-brand-emerald' : 'text-brand-danger'}`}>{data.ourProb || data.pReal}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
          <span className="font-medium">Convicción {data.conviction || 7}/10</span>
          <span className={`font-bold ${isPositiveEdge ? 'text-brand-emerald' : 'text-brand-danger'}`}>
            {isPositiveEdge ? '+' : ''}{edge} EDGE
          </span>
        </div>
        <div className="h-1 bg-border-subtle rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-slate-600" 
            style={{ width: `${Math.min(data.marketProb || data.pMarket, data.ourProb || data.pReal)}%` }} 
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
        <span>Publicado {data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Hoy'}</span>
        <span className="font-mono">Liq. {data.liquidity || '$240k'}</span>
      </div>

      <button 
        onClick={onClick}
        className="w-full mt-6 flex items-center justify-center gap-1 text-brand-indigo font-bold text-[11px] uppercase tracking-wider hover:underline transition-all"
      >
        {isLocked ? <Lock size={12} className="mr-1" /> : null}
        {isLocked ? 'Desbloquear Análisis' : 'Ver análisis'} <ChevronRight size={14} />
      </button>

      {isLocked && (
        <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-t from-bg-card via-bg-card/90 to-transparent pointer-events-none flex items-end justify-center p-8">
          <div className="text-center">
            <Lock size={24} className="mx-auto text-brand-indigo/40 mb-2" />
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Contenido exclusivo</p>
          </div>
        </div>
      )}
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

const ArticlePage = ({ article, onBack, theme }: { article: AcademyArticle, onBack: () => void, theme: string }) => {
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

        <article className={`prose ${theme === 'dark' ? 'prose-invert' : 'prose-slate'} max-w-none`}>
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

const PolymarketFeed = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/polymarket/trending');
        const data = await res.json();
        setMarkets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Feed error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  if (loading) return (
    <div className="py-12 flex justify-center">
      <div className="w-6 h-6 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Mercados en Tendencia (CLOB Sync)</h4>
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-brand-emerald animate-pulse" />
          <span className="text-[10px] text-brand-emerald font-bold uppercase tracking-tighter">Live Orderbook</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {markets.slice(0, 5).map((m: any) => (
          <div key={m.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-brand-indigo/40 transition-all duration-300">
            {/* Market Info */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-sm font-semibold leading-tight group-hover:text-white transition-colors">{m.question}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 bg-white/5 text-text-tertiary rounded uppercase border border-white/5 font-bold">{m.category}</span>
                {m.tags && m.tags.slice(0, 1).map((tag: any) => (
                  <span key={tag.id} className="text-[9px] px-2 py-0.5 bg-brand-indigo/10 text-brand-indigo rounded uppercase font-bold">
                    {tag.name}
                  </span>
                ))}
                {m.series && (
                  <span className="text-[9px] px-2 py-0.5 bg-white/5 text-text-tertiary rounded uppercase italic">
                    Part of {m.series.title}
                  </span>
                )}
              </div>
            </div>

            {/* Trading Data (CLOB) */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
              <div className="text-left">
                <p className="text-[9px] text-text-tertiary uppercase mb-1">Midpoint</p>
                <p className="font-mono text-xs font-bold text-white">
                  {m.clob?.midpoint ? `${(parseFloat(m.clob.midpoint) * 100).toFixed(1)}%` : `${(m.lastTradePrice * 100).toFixed(1)}%`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-text-tertiary uppercase mb-1">Spread</p>
                <p className="font-mono text-xs font-bold text-brand-indigo">
                  {m.clob?.spread ? (m.clob.spread * 100).toFixed(2) : '0.00'}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-text-tertiary uppercase mb-1">Volume</p>
                <p className="font-mono text-xs font-bold text-text-secondary">
                  ${(m.volume / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
            
            {/* Token ID indicator (small) */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 opacity-30">
                <div className="w-1.5 h-1.5 bg-brand-indigo rounded-full" />
                <span className="text-[8px] font-mono tracking-tighter uppercase truncate max-w-[150px]">
                  ID: {m.tokenUsed?.tokenId || 'N/A'}
                </span>
              </div>
              <ArrowRight size={10} className="text-text-tertiary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalysisPage = ({ onBack, theme }: { onBack: () => void, theme: string }) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'analysis'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Analysis[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Analysis);
      });
      setAnalyses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Análisis Estratégicos</h1>
            <p className="text-text-secondary text-lg">Predicciones calibradas y detección de edge en tiempo real.</p>
          </div>
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-text-tertiary hover:text-brand-indigo transition-all font-mono text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl"
          >
            <ArrowRight size={14} className="rotate-180" /> Volver
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
            <p className="text-text-tertiary font-mono text-[10px] tracking-widest uppercase">Procesando Inteligencia...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {analyses.length === 0 ? (
                <div className="text-center py-24 bg-bg-card border-2 border-dashed border-border-subtle rounded-3xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={24} className="text-text-tertiary opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Sin análisis activos</h3>
                  <p className="text-text-tertiary text-sm max-w-xs mx-auto">Vuelve en unas horas.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {analyses.map((analysis) => (
                    <motion.div 
                      key={analysis.id}
                      layout
                      className={`bg-bg-card border border-border-subtle rounded-3xl overflow-hidden transition-all duration-500 ease-in-out ${expandedId === analysis.id ? 'ring-1 ring-brand-indigo shadow-2xl shadow-brand-indigo/10' : 'hover:border-brand-indigo/30'}`}
                    >
                      <div 
                        className="p-8 cursor-pointer flex items-center justify-between gap-6"
                        onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="px-3 py-1 bg-brand-indigo/10 text-brand-indigo rounded-lg text-[10px] font-bold uppercase tracking-widest">{analysis.category}</span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${analysis.status === 'active' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-text-tertiary/10 text-text-tertiary'}`}>
                              {analysis.status === 'active' ? '● En Proceso' : 'Resuelto'}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold truncate pr-4">{analysis.title}</h3>
                        </div>
                        
                        <div className="flex items-center gap-12 text-right">
                          <div className="hidden sm:block">
                            <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-1.5">Edge</p>
                            <p className={`text-2xl font-mono font-bold leading-none ${analysis.edge > 0 ? 'text-brand-emerald' : 'text-brand-danger'}`}>
                              {analysis.edge > 0 ? '+' : ''}{analysis.edge}
                            </p>
                          </div>
                          <div className={`p-3 rounded-2xl bg-white/5 transition-all duration-500 ${expandedId === analysis.id ? 'rotate-180 bg-brand-indigo/10 text-brand-indigo' : 'text-text-tertiary'}`}>
                            {expandedId === analysis.id ? <Minus size={20} /> : <Plus size={20} />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === analysis.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border-subtle"
                          >
                            <div className="p-8 md:p-12 bg-bg-base/30">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                                <div>
                                  <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-2 font-bold">P. Mercado</p>
                                  <p className="text-2xl font-mono font-bold">{analysis.pMarket}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-2 font-bold">P. Edgio</p>
                                  <p className="text-2xl font-mono font-bold text-brand-indigo">{analysis.pReal}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-2 font-bold">Variación</p>
                                  <p className="text-2xl font-mono font-bold">±{Math.abs(analysis.pReal - analysis.pMarket) / 2}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-text-tertiary uppercase tracking-widest mb-2 font-bold">Estado</p>
                                  <p className="text-2xl font-mono font-bold flex items-center gap-2 uppercase">
                                    {analysis.status === 'active' ? <Clock size={20} className="text-brand-indigo" /> : <ShieldCheck size={20} className="text-brand-emerald" />}
                                    {analysis.status}
                                  </p>
                                </div>
                              </div>

                              <div className={`prose ${theme === 'dark' ? 'prose-invert' : 'prose-slate'} max-w-none prose-p:text-text-secondary prose-p:leading-relaxed prose-headings:text-text-primary prose-strong:text-text-primary border-t border-border-subtle pt-12`}>
                                <ReactMarkdown>{analysis.content}</ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Feed */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 sticky top-32">
                <PolymarketFeed />
                
                <div className="mt-8 pt-8 border-t border-border-subtle">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-4">Fuentes Vinculadas</h4>
                  <div className="space-y-4">
                    {[
                      { name: 'Gamma API', status: 'Online', url: 'gamma-api.polymarket.com' },
                      { name: 'Data API', status: 'Online', url: 'data-api.polymarket.com' },
                      { name: 'CLOB API', status: 'Active', url: 'clob.polymarket.com' }
                    ].map(api => (
                      <div key={api.name} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">{api.name}</p>
                          <p className="text-[10px] text-text-tertiary truncate max-w-[120px]">{api.url}</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-[9px] font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded">
                          <div className="w-1 h-1 bg-brand-emerald rounded-full" /> {api.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserDashboard = ({ user, onBack, showToast }: { user: UserProfile, onBack: () => void, showToast: (m: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'actividad' | 'config'>('resumen');

  const stats = [
    { label: 'Puntos Edgio', value: user.points, icon: <Shield className="text-brand-indigo" size={24} />, subtext: 'Karma de predicción', color: 'indigo' },
    { label: 'Reputación', value: 'B+', icon: <BarChart3 className="text-brand-indigo" size={24} />, subtext: 'Calibración histórica', color: 'indigo' },
    { label: 'Estado', value: user.subscriptionStatus.toUpperCase(), icon: <Activity className="text-brand-indigo" size={24} />, subtext: 'Nivel de acceso', color: 'indigo' }
  ];

  const activities = [
    { type: 'deposito', label: 'Bono de Bienvenida', amount: '+100 pts', date: 'Hoy', status: 'Completo' },
    { type: 'analisis', label: 'Acceso Análisis: Uruguay 2024', amount: '-0€', date: 'Ayer', status: 'Gratis' },
  ];

  return (
    <div className="min-h-screen pt-8 pb-24 max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors font-medium text-sm"
        >
          <ArrowRight size={16} className="rotate-180" /> Volver al Inicio
        </button>
        <div className="flex items-center gap-2 text-text-tertiary text-xs bg-white/5 px-3 py-1.5 rounded-full">
          <Clock size={14} /> Actualizado ahora
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-2">
          <div className="p-6 bg-bg-card border border-border-subtle rounded-2xl mb-6">
            <div className="w-16 h-16 rounded-2xl border-2 border-brand-indigo/30 p-1 mb-4">
              <img src={user.photoURL || 'https://picsum.photos/seed/user/200/200'} alt="Avatar" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
            </div>
            <h2 className="text-xl font-bold truncate">{user.displayName}</h2>
            <p className="text-text-tertiary text-sm truncate mb-4">{user.email}</p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-indigo/10 text-brand-indigo rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <Zap size={12} fill="currentColor" /> {user.subscriptionStatus} account
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'resumen', label: 'Resumen General', icon: <Layers size={18} /> },
              { id: 'actividad', label: 'Historial', icon: <History size={18} /> },
              { id: 'config', label: 'Configuración', icon: <Settings size={18} /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-text-secondary hover:bg-white/5'}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'resumen' && (
              <motion.div
                key="resumen"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-bg-card border border-border-subtle p-6 rounded-2xl group hover:border-brand-indigo/30 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2.5 rounded-xl bg-brand-${stat.color}/10 text-brand-${stat.color}`}>
                          {stat.icon}
                        </div>
                        <ChevronRight size={16} className="text-text-tertiary group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-text-tertiary text-xs font-medium uppercase tracking-widest">{stat.label}</span>
                        <h4 className="text-2xl font-bold font-mono">{stat.value}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-text-tertiary">{stat.subtext}</p>
                          {stat.label === 'Puntos Edgio' && (
                            <button 
                              onClick={async () => {
                                const userRef = doc(db, 'users', user.uid);
                                await updateDoc(userRef, { points: user.points + 50 });
                                showToast('+50 puntos añadidos por actividad');
                              }}
                              className="text-[10px] font-bold text-brand-indigo hover:brightness-125 transition-all"
                            >
                              +50 pts
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><Target size={18} className="text-brand-indigo" /> Tus Mercados</h3>
                      <button className="text-[10px] uppercase font-bold text-brand-indigo hover:underline">Ver todos</button>
                    </div>
                    <div className="p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp size={24} className="text-text-tertiary" />
                      </div>
                      <p className="text-text-secondary text-sm">Aún no has participado en ningún mercado de predicción.</p>
                      <button 
                        onClick={onBack}
                        className="text-xs font-bold px-4 py-2 bg-brand-indigo/10 text-brand-indigo rounded-lg hover:bg-brand-indigo/20 transition-colors"
                      >
                        Explorar Análisis
                      </button>
                    </div>
                  </div>

                  <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold mb-2 flex items-center gap-2"><Zap size={18} className="text-brand-indigo" /> Mejora tu Edge</h3>
                      <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                        Desbloquea análisis avanzados y exportación de datos con el plan Sistema.
                      </p>
                    </div>
                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-subtle mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-text-tertiary">Progreso de Puntos</span>
                        <span className="text-xs font-mono">100 / 1000</span>
                      </div>
                      <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-brand-indigo w-[10%]" />
                      </div>
                    </div>
                    <button 
                      onClick={() => { onBack(); setTimeout(() => document.getElementById('suscripcion')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                      className="w-full py-3 bg-brand-indigo text-white font-bold rounded-xl text-sm shadow-lg shadow-brand-indigo/20"
                    >
                      Ver Planes Pro
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'actividad' && (
              <motion.div
                key="actividad"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-border-subtle">
                  <h3 className="font-bold">Historial de Transacciones</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">Concepto</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">Fecha</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">Importe/Puntos</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {activities.map((act, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-text-primary">{act.label}</td>
                          <td className="px-6 py-4 text-xs text-text-tertiary">{act.date}</td>
                          <td className={`px-6 py-4 text-sm font-mono font-bold ${act.amount.startsWith('+') ? 'text-brand-emerald' : 'text-brand-indigo'}`}>{act.amount}</td>
                          <td className="px-6 py-4 text-right leading-none">
                            <span className="inline-block px-2 py-1 bg-brand-emerald/10 text-brand-emerald rounded text-[10px] font-bold uppercase">{act.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 space-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-6">Ajustes de Perfil</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Nombre Público</label>
                          <input disabled value={user.displayName} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm opacity-50" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Login vinculado</label>
                        <div className="flex items-center gap-3 bg-bg-base border border-border-subtle p-4 rounded-xl">
                          <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-5 h-5" alt="Google" />
                          <span className="text-sm">{user.email}</span>
                          <span className="ml-auto text-[10px] font-bold text-brand-emerald uppercase">Conectado</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-border-subtle">
                    <h3 className="text-xl font-bold mb-6">Seguridad</h3>
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-red-500">¿Cerrar todas las sesiones?</p>
                        <p className="text-[10px] text-text-tertiary">Desvinculará este dispositivo de Edgio permanentemente.</p>
                      </div>
                      <button className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all">Cerrar Sesión</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const CheckoutPage = ({ plan, onBack, user, onLogin, showToast }: { plan: Plan, onBack: () => void, user: UserProfile | null, onLogin: () => void, showToast: (m: string) => void }) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleCheckout = async () => {
    if (!user) {
      onLogin();
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, plan: plan.id })
      });

      const data = await res.json();

      console.log("Checkout response:", data);

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe URL missing");
        showToast("Error: No se pudo generar el enlace de pago.");
        setIsProcessing(false);
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
      showToast(`Error: ${e.message}`);
      setIsProcessing(false);
    }
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
                    <p className="text-sm text-text-secondary">Haz clic en el botón de abajo para ser redirigido a la pasarela segura de Stripe y completar tu suscripción.</p>
                  </div>

                  <button 
                    disabled={isProcessing}
                    onClick={handleCheckout}
                    className="w-full bg-brand-indigo hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-indigo/20 transition-all flex items-center justify-center gap-2 mt-8"
                  >
                    {isProcessing ? 'Redirigiendo a Stripe...' : `Ir al pago seguro: ${plan.price}`}
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

const AnalysisDetailPage = ({ analysis, currentUser, onBack, onSubscribe, theme }: { 
  analysis: Analysis, 
  currentUser: UserProfile | null,
  onBack: () => void,
  onSubscribe: () => void,
  theme: string
}) => {
  const adminEmail = 'dani.sanchez.vila@gmail.com';
  const isLocked = analysis.isPremium && 
                   (!currentUser || (currentUser.subscriptionStatus !== 'pro' && currentUser.subscriptionStatus !== 'annual')) &&
                   currentUser?.email !== adminEmail;

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto min-h-screen">
      <button onClick={onBack} className="flex items-center gap-2 text-text-tertiary hover:text-brand-indigo transition-colors mb-8 font-semibold text-sm">
        <ArrowRight size={18} className="rotate-180" /> Volver a análisis
      </button>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-brand-indigo/10 text-brand-indigo rounded-full text-xs font-bold uppercase tracking-widest">{analysis.category}</span>
          <span className="text-text-tertiary text-xs font-mono">{analysis.createdAt?.seconds ? new Date(analysis.createdAt.seconds * 1000).toLocaleDateString() : 'Hoy'}</span>
          {analysis.isPremium && <span className="flex items-center gap-1 text-amber-500 font-bold text-[10px] uppercase tracking-widest ml-auto"><Lock size={10} /> Exclusivo Pro</span>}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">{analysis.title}</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-bg-card border border-border-subtle p-4 rounded-2xl">
            <span className="text-[10px] text-text-tertiary uppercase block mb-1">Mercado</span>
            <span className="text-2xl font-mono font-bold">{analysis.pMarket}%</span>
          </div>
          <div className="bg-bg-card border border-border-subtle p-4 rounded-2xl">
            <span className="text-[10px] text-text-tertiary uppercase block mb-1">Real</span>
            <span className="text-2xl font-mono font-bold text-brand-emerald">{analysis.pReal}%</span>
          </div>
          <div className="bg-bg-card border border-border-subtle p-4 rounded-2xl">
            <span className="text-[10px] text-text-tertiary uppercase block mb-1">Edge</span>
            <span className="text-2xl font-mono font-bold text-brand-indigo">+{analysis.pReal - analysis.pMarket}</span>
          </div>
          <div className="bg-bg-card border border-border-subtle p-4 rounded-2xl">
            <span className="text-[10px] text-text-tertiary uppercase block mb-1">Estado</span>
            <span className="text-2xl font-bold uppercase text-[10px] flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${analysis.status === 'active' ? 'bg-brand-emerald animate-pulse' : 'bg-text-tertiary'}`} />
              {analysis.status === 'active' ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className={`prose ${theme === 'dark' ? 'prose-invert' : 'prose-slate'} max-w-none prose-headings:text-brand-indigo prose-a:text-brand-emerald ${isLocked ? 'blur-xl select-none pointer-events-none' : ''}`}>
          <ReactMarkdown>{analysis.content || analysis.summary}</ReactMarkdown>
        </div>

        {isLocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pt-20">
            <div className="bg-bg-card/80 backdrop-blur-md border border-brand-indigo/30 p-12 rounded-3xl text-center max-w-md shadow-2xl">
              <div className="w-16 h-16 bg-brand-indigo/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} className="text-brand-indigo" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Análisis Reservado para Miembros Pro</h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                Este análisis detallado incluye el desglose bayesiano completo, fuentes primarias y actualizaciones en tiempo real.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={onSubscribe}
                  className="w-full bg-brand-indigo hover:brightness-110 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-indigo/20 transition-all flex items-center justify-center gap-2"
                >
                  Mejorar a Pro <Zap size={18} fill="currentColor" />
                </button>
                <div className="text-text-tertiary text-[10px] uppercase tracking-widest font-bold">
                  Acceso instantáneo desde 19€/mes
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel = ({ 
  analyses, 
  onBack, 
  logoText, setLogoText, 
  logoIcon, setLogoIcon,
  logoUrl, setLogoUrl,
  faviconUrl, setFaviconUrl,
  currentUser,
  showToast
}: { 
  analyses: Analysis[], 
  onBack: () => void,
  logoText: string,
  setLogoText: (t: string) => void,
  logoIcon: string,
  setLogoIcon: (i: string) => void,
  logoUrl: string | null,
  setLogoUrl: (u: string | null) => void,
  faviconUrl: string | null,
  setFaviconUrl: (u: string | null) => void,
  currentUser: UserProfile | null,
  showToast: (m: string) => void
}) => {
  const [activeTab, setActiveTab] = useState<'analyses' | 'settings' | 'track-record'>('analyses');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<Partial<Analysis> | null>(null);
  const [editingTrack, setEditingTrack] = useState<Partial<TrackRecordEntry> | null>(null);
  const [trackData, setTrackData] = useState<TrackRecordEntry[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'trackRecord'), orderBy('resolutionTimestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTrackData(snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as TrackRecordEntry[]);
    });
    return () => unsub();
  }, []);

  const handleTestSubscription = async (status: 'free' | 'pro' | 'annual') => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        subscriptionStatus: status,
        updatedAt: serverTimestamp()
      });
      showToast(`Estado cambiado a ${status.toUpperCase()} (Modo Test)`);
    } catch (e) {
      console.error(e);
      showToast('Error al cambiar el estado');
    }
  };

  const handleSaveTrack = async () => {
    if (!editingTrack?.event) return;
    try {
      const data: any = {
        ...editingTrack,
        resolutionTimestamp: editingTrack.resolutionTimestamp || serverTimestamp(),
        edge: (editingTrack.ourEst || 0) - (editingTrack.marketPrice || 0)
      };
      
      const docId = editingTrack.id;
      if (docId) {
        delete data.id;
        await setDoc(doc(db, 'trackRecord', docId), data);
      } else {
        const { addDoc } = await import('firebase/firestore');
        await addDoc(collection(db, 'trackRecord'), data);
      }
      setEditingTrack(null);
      showToast('Evento guardado');
    } catch (e) {
      console.error(e);
      showToast('Error al guardar');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingFavicon(true);

    try {
      const storageRef = ref(storage, `branding/${type}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const brandingRef = doc(db, 'config', 'branding');
      await setDoc(brandingRef, { [type === 'logo' ? 'logoUrl' : 'faviconUrl']: url }, { merge: true });
      
      if (type === 'logo') setLogoUrl(url);
      else setFaviconUrl(url);
      showToast(`${type === 'logo' ? 'Logo' : 'Favicon'} actualizado`);
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast('Error al subir');
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingFavicon(false);
    }
  };

  const saveTextBranding = async () => {
    try {
      const brandingRef = doc(db, 'config', 'branding');
      await setDoc(brandingRef, { logoText, logoIcon }, { merge: true });
      showToast('Branding guardado');
    } catch (e) {
      console.error(e);
      showToast('Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que quieres borrar este análisis?')) {
      try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'analysis', id));
        showToast('Análisis borrado');
      } catch (e) {
        console.error(e);
        showToast('Error al borrar');
      }
    }
  };

  const handleSaveAnalysis = async () => {
    if (!editingAnalysis?.title) return;
    try {
      const { setDoc, addDoc, collection } = await import('firebase/firestore');
      const data = {
        ...editingAnalysis,
        createdAt: editingAnalysis.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (editingAnalysis.id) {
        await setDoc(doc(db, 'analysis', editingAnalysis.id), data);
      } else {
        await addDoc(collection(db, 'analysis'), data);
      }
      setEditingAnalysis(null);
      showToast('Análisis guardado');
    } catch (e) {
      console.error(e);
      showToast('Error al guardar');
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-text-tertiary transition-colors">
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <h2 className="text-3xl font-bold">Panel de Control</h2>
        </div>
        <div className="flex bg-bg-card border border-border-subtle rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('analyses')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'analyses' ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Análisis
          </button>
          <button 
            onClick={() => setActiveTab('track-record')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'track-record' ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Track Record
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Marca
          </button>
        </div>
      </div>

      {activeTab === 'analyses' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Section: Analyses List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Gestionar Análisis</h3>
              <button 
                onClick={() => setEditingAnalysis({ title: '', category: 'Política', status: 'active', pMarket: 50, pReal: 50, edge: 0, content: '', summary: '' })}
                className="flex items-center gap-2 bg-brand-indigo text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-indigo/20"
              >
                <Plus size={18} /> Nuevo Análisis
              </button>
            </div>
            
            <div className="space-y-4">
              {analyses.map(a => (
                <div key={a.id} className="bg-bg-card border border-border-subtle rounded-2xl p-6 flex items-center justify-between group hover:border-brand-indigo/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary bg-white/5 px-2 py-0.5 rounded">{a.category}</span>
                      <span className={`w-2 h-2 rounded-full ${a.status === 'active' ? 'bg-brand-emerald' : 'bg-text-tertiary'}`} />
                    </div>
                    <h4 className="font-semibold text-text-primary mb-1">{a.title}</h4>
                    <p className="text-xs text-text-tertiary">{new Date(a.createdAt?.seconds * 1000).toLocaleDateString()} · Edge: {a.edge} pts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingAnalysis(a)} className="p-2 text-text-tertiary hover:text-brand-indigo hover:bg-brand-indigo/10 rounded-lg transition-colors">
                      <Settings size={18} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 text-text-tertiary hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-28 h-fit">
            {editingAnalysis ? (
              <div className="bg-bg-card border border-brand-indigo/30 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-lg font-bold mb-6">{editingAnalysis.id ? 'Editar Análisis' : 'Nuevo Análisis'}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-10 h-6 rounded-full transition-all relative ${editingAnalysis.isPremium ? 'bg-brand-indigo' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingAnalysis.isPremium ? 'left-5' : 'left-1'}`} />
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={editingAnalysis.isPremium}
                          onChange={e => setEditingAnalysis({...editingAnalysis, isPremium: e.target.checked})}
                        />
                        <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Análisis Premium</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Título</label>
                    <input 
                      type="text" 
                      value={editingAnalysis.title}
                      onChange={e => setEditingAnalysis({...editingAnalysis, title: e.target.value})}
                      className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none transition-all"
                      placeholder="¿Qué pasará con...?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Categoría</label>
                      <select 
                        value={editingAnalysis.category}
                        onChange={e => setEditingAnalysis({...editingAnalysis, category: e.target.value})}
                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none transition-all appearance-none"
                      >
                        {['Política', 'Economía', 'Crypto', 'Deportes'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Estado</label>
                      <select 
                        value={editingAnalysis.status}
                        onChange={e => setEditingAnalysis({...editingAnalysis, status: e.target.value as 'active' | 'resolved'})}
                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none transition-all appearance-none"
                      >
                        <option value="active">Activo</option>
                        <option value="resolved">Resuelto</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Mkt (%)</label>
                      <input 
                        type="number" 
                        value={editingAnalysis.pMarket}
                        onChange={e => setEditingAnalysis({...editingAnalysis, pMarket: Number(e.target.value)})}
                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Real (%)</label>
                      <input 
                        type="number" 
                        value={editingAnalysis.pReal}
                        onChange={e => setEditingAnalysis({...editingAnalysis, pReal: Number(e.target.value)})}
                        className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Edge</label>
                      <div className="w-full bg-white/5 border border-white/5 text-brand-emerald font-bold rounded-xl px-4 py-3 text-sm font-mono flex items-center justify-center">
                        {(editingAnalysis.pReal || 0) - (editingAnalysis.pMarket || 0)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Contenido (Markdown)</label>
                    <textarea 
                      rows={6}
                      value={editingAnalysis.content}
                      onChange={e => setEditingAnalysis({...editingAnalysis, content: e.target.value})}
                      className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setEditingAnalysis(null)}
                      className="flex-1 border border-border-subtle text-text-tertiary font-bold py-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveAnalysis}
                      className="flex-1 bg-brand-indigo text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-indigo/20 hover:brightness-110 transition-all"
                    >
                      {editingAnalysis.id ? 'Actualizar' : 'Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Plus size={48} className="text-text-tertiary mb-4 opacity-20" />
                <p className="text-text-tertiary text-sm">Selecciona un análisis o crea uno nuevo para empezar.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'track-record' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Gestionar Track Record</h3>
              <button 
                onClick={() => setEditingTrack({ event: '', date: '', ourEst: 50, marketPrice: 50, resolution: '', outcome: '', correct: true })}
                className="flex items-center gap-2 bg-brand-emerald text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-emerald/20"
              >
                <Plus size={18} /> Añadir Evento
              </button>
            </div>
            
            <div className="space-y-4">
              {trackData.map(t => (
                <div key={t.id} className="bg-bg-card border border-border-subtle rounded-2xl p-6 flex items-center justify-between group hover:border-brand-emerald/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${t.correct ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-danger/10 text-brand-danger'}`}>
                        {t.correct ? 'Acertado' : 'Fallado'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-text-primary mb-1">{t.event}</h4>
                    <p className="text-xs text-text-tertiary">{t.date} · Edge: {t.edge > 0 ? '+' : ''}{t.edge} pts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingTrack(t)} className="p-2 text-text-tertiary hover:text-brand-emerald hover:bg-brand-emerald/10 rounded-lg transition-colors">
                      <Settings size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-28 h-fit">
            {editingTrack ? (
              <div className="bg-bg-card border border-brand-emerald/30 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-lg font-bold mb-6">{editingTrack.id ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Nombre del Evento</label>
                    <input type="text" value={editingTrack.event} onChange={e => setEditingTrack({...editingTrack, event: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 outline-none" placeholder="Ej: Elecciones USA" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Mes/Día (Label)</label>
                      <input type="text" value={editingTrack.date} onChange={e => setEditingTrack({...editingTrack, date: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 outline-none" placeholder="Ej: 04 nov" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Acertamos</label>
                      <select value={editingTrack.correct ? 'true' : 'false'} onChange={e => setEditingTrack({...editingTrack, correct: e.target.value === 'true'})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 outline-none">
                        <option value="true">SÍ</option>
                        <option value="false">NO</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Nuestra Est (%)</label>
                      <input type="number" value={editingTrack.ourEst} onChange={e => setEditingTrack({...editingTrack, ourEst: Number(e.target.value)})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Mkt Price (%)</label>
                      <input type="number" value={editingTrack.marketPrice} onChange={e => setEditingTrack({...editingTrack, marketPrice: Number(e.target.value)})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1 block">Resultado Real</label>
                    <input type="text" value={editingTrack.outcome} onChange={e => setEditingTrack({...editingTrack, outcome: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 outline-none" placeholder="Ej: Ganador X" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setEditingTrack(null)} className="flex-1 border border-border-subtle text-text-tertiary font-bold py-3 rounded-xl">Cancelar</button>
                    <button onClick={handleSaveTrack} className="flex-1 bg-brand-emerald text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-emerald/20">Guardar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Activity size={48} className="text-text-tertiary mb-4 opacity-20" />
                <p className="text-text-tertiary text-sm">Gestiona el historial de aciertos para el track record público.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-12">
          {/* Settings Tab content */}
          <div className="p-8 bg-brand-indigo/5 border border-brand-indigo/20 rounded-3xl mb-12">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="text-brand-indigo" /> Modo Desarrollador (Pagos)
            </h3>
            <p className="text-sm text-text-tertiary mb-6">
              Usa estos botones para cambiar tu estado de suscripción y probar cómo se comportan los análisis premium sin pasar por la pasarela de Stripe.
            </p>
            <div className="flex gap-4">
              <button onClick={() => handleTestSubscription('free')} className="flex-1 py-3 bg-bg-card border border-border-subtle text-text-secondary rounded-xl text-xs font-bold hover:bg-white/5">VOLVER A FREE</button>
              <button onClick={() => handleTestSubscription('pro')} className="flex-1 py-3 bg-brand-indigo text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-indigo/20">SER PRO</button>
              <button onClick={() => handleTestSubscription('annual')} className="flex-1 py-3 bg-brand-emerald text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-emerald/20">SER ELITE</button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-8">Personalización de Marca</h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-3 block">Texto del Logotipo</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={logoText}
                      onChange={e => setLogoText(e.target.value)}
                      className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none"
                    />
                    <button 
                      onClick={saveTextBranding}
                      className="bg-white/5 border border-border-subtle text-text-primary px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-xs font-bold"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-3 block">Icono (Fallback)</label>
                  <input 
                    type="text" 
                    value={logoIcon}
                    onChange={e => setLogoIcon(e.target.value)}
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm focus:border-brand-indigo outline-none"
                    maxLength={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-3 block">Imagen del Logotipo</label>
                  <div className="relative group overflow-hidden bg-bg-card border-2 border-dashed border-border-subtle rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-brand-indigo group">
                    {logoUrl ? (
                      <div className="relative">
                        <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-4" />
                        <button 
                          onClick={async () => {
                            const brandingRef = doc(db, 'config', 'branding');
                            await setDoc(brandingRef, { logoUrl: null }, { merge: true });
                            setLogoUrl(null);
                          }}
                          className="absolute -top-2 -right-2 bg-brand-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <ImageIcon size={32} className="text-text-tertiary mb-4 opacity-50" />
                    )}
                    
                    <label className="cursor-pointer">
                      <span className="bg-brand-indigo text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        {isUploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {logoUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-3 block">Favicon (32x32px)</label>
                  <div className="relative group overflow-hidden bg-bg-card border-2 border-dashed border-border-subtle rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-brand-indigo">
                    {faviconUrl ? (
                      <div className="relative">
                        <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain mb-4" />
                        <button 
                          onClick={async () => {
                            const brandingRef = doc(db, 'config', 'branding');
                            await setDoc(brandingRef, { faviconUrl: null }, { merge: true });
                            setFaviconUrl(null);
                          }}
                          className="absolute -top-2 -right-2 bg-brand-danger text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <Activity size={32} className="text-text-tertiary mb-4 opacity-50" />
                    )}
                    
                    <label className="cursor-pointer">
                      <span className="bg-brand-indigo text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        {isUploadingFavicon ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {faviconUrl ? 'Cambiar Favicon' : 'Subir Favicon'}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'favicon')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-brand-indigo/5 border border-brand-indigo/20 rounded-2xl flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-indigo flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : logoIcon}
                </div>
                <div>
                  <p className="font-bold text-xl text-text-primary">{logoText}</p>
                  <p className="text-[10px] text-text-tertiary tracking-widest uppercase mb-2">Vista Previa del Logotipo</p>
                  <div className="flex items-center gap-2 text-[10px] text-text-tertiary font-mono">
                    <History size={12} />
                    Sincronización con la nube activa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'invalid' | 'submitting' | 'success'>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toast, setToast] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'checkout' | 'article' | 'dashboard' | 'analysis' | 'admin' | 'analysis-detail'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<AcademyArticle | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [trackRecord, setTrackRecord] = useState<TrackRecordEntry[]>([]);
  const [logoText, setLogoText] = useState('Edgio');
  const [logoIcon, setLogoIcon] = useState('◆');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await syncUserProfile(result.user);
        setCurrentUser(profile);
        setShowAuthModal(false);
        showToast('Sesión iniciada con Google');
      }
    } catch (error) {
      console.error(error);
      showToast('Error al iniciar sesión con Google');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      let result;
      if (authMode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        result = await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }

      const profile = await syncUserProfile(result.user);
      setCurrentUser(profile);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      showToast(authMode === 'signup' ? 'Cuenta creada con éxito' : 'Sesión iniciada');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Credenciales incorrectas.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('La contraseña debe tener al menos 6 caracteres.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('El inicio de sesión con email no está habilitado en Firebase. Contacta con el administrador.');
      } else {
        setAuthError('Ocurrió un error. Inténtalo de nuevo.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    showToast('Sesión cerrada');
    setView('landing');
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous profile listener if exists
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setCurrentUser(profile);
          
          unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
            if (doc.exists()) {
              setCurrentUser(doc.data() as UserProfile);
            }
          });
        } catch (error) {
          console.error("Error syncing profile:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  useEffect(() => {
    const qAnalyses = query(collection(db, 'analysis'), orderBy('createdAt', 'desc'));
    const unsubAnalyses = onSnapshot(qAnalyses, (snap) => {
      setAnalyses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Analysis[]);
    });

    const qTrack = query(collection(db, 'trackRecord'), orderBy('resolutionTimestamp', 'desc'));
    const unsubTrack = onSnapshot(qTrack, (snap) => {
      setTrackRecord(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as TrackRecordEntry[]);
    });

    const unsubBranding = onSnapshot(doc(db, 'config', 'branding'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.logoText) setLogoText(data.logoText);
        if (data.logoIcon) setLogoIcon(data.logoIcon);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.faviconUrl) setFaviconUrl(data.faviconUrl);
      }
    });

    return () => {
      unsubAnalyses();
      unsubTrack();
      unsubBranding();
    };
  }, []);

  useEffect(() => {
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [faviconUrl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      showToast('¡Pago completado con éxito! Bienvenido a la comunidad PRO.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('payment') === 'cancel') {
      showToast('El pago ha sido cancelado.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const brierScore = useMemo(() => {
    if (trackRecord.length === 0) return '0.18';
    const sum = trackRecord.reduce((acc, curr) => {
      const outcome = curr.correct ? 1 : 0;
      const prob = curr.ourEst / 100;
      return acc + Math.pow(prob - outcome, 2);
    }, 0);
    return (sum / trackRecord.length).toFixed(2);
  }, [trackRecord]);

  const accuracy = useMemo(() => {
    if (trackRecord.length === 0) return 73;
    const correctCount = trackRecord.filter(t => t.correct).length;
    return Math.round((correctCount / trackRecord.length) * 100);
  }, [trackRecord]);

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
    return analyses.filter(card => {
      const matchesCategory = activeFilter === 'Todos' || card.category === activeFilter;
      return matchesCategory;
    });
  }, [activeFilter, analyses]);

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
        grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        ticks: { color: theme === 'dark' ? '#94A3B8' : '#64748B', font: { family: 'JetBrains Mono' } },
        title: { display: true, text: 'Probabilidad Estimada (%)', color: theme === 'dark' ? '#64748B' : '#94A3B8' }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        ticks: { color: theme === 'dark' ? '#94A3B8' : '#64748B', font: { family: 'JetBrains Mono' } },
        title: { display: true, text: 'Frecuencia Real (%)', color: theme === 'dark' ? '#64748B' : '#94A3B8' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#111118' : '#FFFFFF',
        titleColor: theme === 'dark' ? '#F1F5F9' : '#0F172A',
        bodyColor: theme === 'dark' ? '#94A3B8' : '#334155',
        borderColor: theme === 'dark' ? '#1E1E2E' : '#E2E8F0',
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
    if (plan.id === 'free') {
      if (!currentUser) {
        setAuthMode('signup');
        setShowAuthModal(true);
      } else {
        showToast("Ya eres miembro de Edgio (Plan Lector)");
      }
      return;
    }
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
  }, [view]);

  const navItems = [
    { name: 'Análisis', id: 'analisis' },
    { name: 'Track Record', id: 'track-record' },
    { name: 'Guía', id: 'guia' },
    { name: 'Metodología', id: 'metodologia' },
    { name: 'Suscripción', id: 'suscripcion' },
    { name: 'Telegram', id: 'telegram', url: 'https://t.me/edgio_predictions' }
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <motion.img 
              key={theme}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              src={logoUrl || (theme === 'dark' ? "/logo-dark.svg" : "/logo-light.svg")} 
              alt="Edgio" 
              className="h-8 md:h-10 w-auto object-contain transition-all"
              referrerPolicy="no-referrer"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item, idx) => (
              <button 
                key={item.name} 
                onClick={() => {
                  if (item.url) window.open(item.url, '_blank', 'noreferrer');
                  else if (item.id === 'analisis') setView('analysis');
                  else {
                    setView('landing');
                    setTimeout(() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }
                }}
                className={`${idx === 0 ? 'text-brand-indigo' : 'text-text-secondary hover:text-text-primary'} text-sm font-medium transition-colors flex items-center gap-1.5`}
              >
                {item.name}
                {item.url && <Send size={12} className="rotate-45" />}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="hidden md:flex p-2 text-text-tertiary hover:text-brand-indigo transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="hidden md:block">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-brand-indigo font-bold text-xs uppercase tracking-widest">{currentUser.subscriptionStatus}</span>
                    <div className="flex items-center gap-2 text-text-primary text-xs font-mono">
                      <span className="flex items-center gap-1"><Shield size={12} className="text-brand-indigo" /> {currentUser.points} pts</span>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="w-10 h-10 rounded-full border border-brand-indigo/30 overflow-hidden hover:scale-105 transition-transform">
                      <img src={currentUser.photoURL || 'https://picsum.photos/seed/user/100/100'} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                    <div className="absolute top-full right-0 mt-2 w-48 bg-bg-card border border-border-subtle rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[200] p-2">
                      <div className="px-3 py-2 border-b border-border-subtle mb-2">
                        <p className="text-text-primary font-semibold truncate text-sm">{currentUser.displayName}</p>
                        <p className="text-text-tertiary text-[10px] truncate">{currentUser.email}</p>
                      </div>
                      <button onClick={() => setView('dashboard')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-white/5 rounded-lg transition-colors">
                        <Target size={14} /> Mi Panel
                      </button>
                      {currentUser.email === 'dani.sanchez.vila@gmail.com' && (
                        <button onClick={() => setView('admin')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-emerald hover:bg-brand-emerald/10 rounded-lg transition-colors">
                          <Settings size={14} /> Administración
                        </button>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-indigo hover:bg-brand-indigo/10 rounded-lg transition-colors">
                        <LogOut size={14} /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="text-sm font-bold text-brand-indigo px-4 py-2 rounded-xl border border-brand-indigo/20 hover:bg-brand-indigo/5 transition-all"
                  >
                    Crear cuenta
                  </button>
                  <button 
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="text-sm font-bold bg-brand-indigo text-white px-5 py-2 rounded-xl shadow-lg shadow-brand-indigo/20 hover:brightness-110 transition-all"
                  >
                    Acceder
                  </button>
                </div>
              )}
            </div>

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
                <motion.img 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={theme === 'dark' ? "/logo-dark.svg" : "/logo-light.svg"} 
                  alt="Edgio" 
                  className="h-8 w-auto object-contain"
                />
                <button onClick={() => setIsMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              {currentUser ? (
                <div className="mb-10 p-5 bg-bg-base/30 border border-border-subtle rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full border-2 border-brand-indigo/30 overflow-hidden shadow-lg shadow-brand-indigo/10">
                      <img src={currentUser.photoURL || ''} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-bold truncate text-base leading-tight">{currentUser.displayName}</p>
                      <p className="text-brand-indigo text-[10px] uppercase font-bold tracking-widest mt-1">{currentUser.subscriptionStatus} Account</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-bg-card p-2 rounded-xl text-center border border-border-subtle">
                      <span className="text-[9px] text-text-tertiary uppercase block">Puntos</span>
                      <span className="text-xs font-bold text-text-primary">{currentUser.points}</span>
                    </div>
                    <div className="bg-bg-card p-2 rounded-xl text-center border border-border-subtle">
                      <span className="text-[9px] text-text-tertiary uppercase block">Reputación</span>
                      <span className="text-xs font-bold text-brand-emerald">B+</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-10 text-center p-6 bg-brand-indigo/5 border border-brand-indigo/10 rounded-2xl">
                  <div className="w-12 h-12 bg-brand-indigo/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={24} className="text-brand-indigo" />
                  </div>
                  <h3 className="text-text-primary font-bold mb-2">Bienvenido a Edgio</h3>
                  <p className="text-text-secondary text-xs mb-6">Accede para ver análisis detallados y track record.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); setIsMenuOpen(false); }} 
                      className="w-full py-4 bg-brand-indigo text-white rounded-xl font-bold text-sm shadow-xl shadow-brand-indigo/20 flex items-center justify-center gap-2"
                    >
                      <User size={16} /> Crear mi cuenta
                    </button>
                    <button 
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); setIsMenuOpen(false); }} 
                      className="w-full py-4 bg-bg-base border border-border-subtle text-text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Lock size={16} /> Iniciar sesión
                    </button>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-1 mb-12">
                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-4 ml-2">Navegación</p>
                {navItems.map(item => (
                  <button 
                    key={item.name} 
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (item.url) window.open(item.url, '_blank', 'noreferrer');
                      else if (item.id === 'analisis') setView('analysis');
                      else {
                        setView('landing');
                        setTimeout(() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }), 50);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-text-secondary hover:text-brand-indigo hover:bg-brand-indigo/5 rounded-xl transition-all flex items-center justify-between group"
                  >
                    {item.name}
                    {item.url ? <ExternalLink size={14} className="opacity-40" /> : <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                ))}
              </nav>

              <div className="mt-auto space-y-3">
                {currentUser && (
                  <>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 ml-2">Cuenta</p>
                    <button 
                      onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-text-primary font-medium text-sm transition-colors"
                    >
                      <Target size={18} className="text-brand-indigo" /> Mi Panel de Usuario
                    </button>
                    {currentUser.email === 'dani.sanchez.vila@gmail.com' && (
                       <button 
                         onClick={() => { setView('admin'); setIsMenuOpen(false); }} 
                         className="w-full flex items-center gap-3 px-4 py-3 bg-brand-emerald/5 hover:bg-brand-emerald/10 rounded-xl text-brand-emerald font-medium text-sm transition-colors"
                       >
                         <Settings size={18} /> Administración
                       </button>
                    )}
                    <button 
                      onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-3 text-brand-danger hover:bg-brand-danger/5 rounded-xl font-medium text-sm transition-colors"
                    >
                      <LogOut size={18} /> Cerrar Sesión
                    </button>
                  </>
                )}
              </div>
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
              <section id="inicio" className="relative pt-12 pb-16 md:pt-32 md:pb-48 px-6 grid-pattern overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
      <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-2xl p-6 md:p-8 mb-12">
        <div className="inline-flex items-center gap-2 px-2 py-1 bg-brand-indigo/10 border border-brand-indigo/30 rounded-full text-brand-indigo text-[10px] font-bold uppercase tracking-wider mb-6">
          → {analyses.length > 0 ? `Nuevo análisis publicado: ${analyses[0].title}` : 'Seguimiento de mercados real en curso'}
        </div>
        <h1 className="text-text-primary text-[2.5rem] md:text-[4rem] font-semibold leading-[1.05] mb-8 tracking-tight">
          Detectamos ineficiencias en los mercados de predicción.
        </h1>
        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Análisis cuantitativo de mercados sin hype. Sistema basado en superforecasting e inteligencia bayesiana para identificar dónde el mercado está equivocado.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => {
              const el = document.getElementById('analisis');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto bg-brand-indigo hover:brightness-110 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-indigo/20 text-lg"
          >
            Ver análisis activos
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('metodologia');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
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
              className="mt-12 md:mt-20 max-w-[580px] mx-auto bg-bg-card border border-border-subtle rounded-2xl p-8 shadow-2xl relative group"
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

        {/* Section 2: Credibility Metrics (Legacy) */}
        {/* We keep this as a summary anchor, but the full section is below */}
        <section className="bg-bg-card/50 border-y border-border-subtle py-12 md:py-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-semibold mb-8 md:mb-16 animate-on-scroll">Edge medible. Transparencia radical.</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
              <div className="md:border-r border-border-subtle">
                <StatItem value="82%" label="Tasa de acierto" subtext="basado en 15 mercados clave" highlight="emerald" />
              </div>
              <div className="md:border-r border-border-subtle md:pl-8">
                <StatItem value="0.14" label="Brier Score" subtext="promedio histórico" />
              </div>
              <div className="md:border-r border-border-subtle md:pl-8">
                <StatItem value="+10.4" label="Edge Promedio" subtext="en aciertos confirmados" highlight="emerald" />
              </div>
              <div className="md:pl-8">
                <StatItem value="15" label="Predicciones" subtext="verificables hoy" />
              </div>
            </div>
          </div>
        </section>

        <TrackRecordSection />

        {/* Section 3: Active Analysis */}
        <section id="analisis" className="py-16 md:py-32 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-semibold">Análisis publicados</h2>
                <span className="bg-brand-indigo/10 text-brand-indigo text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">{analyses.filter(a => a.status === 'active').length} Activos</span>
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCards.map(card => (
                <AnalysisCardComp 
                  key={card.id} 
                  data={card} 
                  currentUser={currentUser}
                  onClick={() => {
                    setSelectedAnalysis(card);
                    setView('analysis-detail');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
        <section id="metodologia" className="py-16 md:py-32 px-6 bg-bg-card border-y border-border-subtle">
          <div className="max-w-4xl mx-auto">
            <div className="mb-24 animate-on-scroll">
              <span className="text-brand-indigo font-mono text-sm block mb-4 uppercase tracking-[0.2em]">Framework Científico</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">El sistema completo: cómo funciona la fórmula de edge</h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-12">
                Todo el sistema se basa en una idea simple pero que casi nadie ejecuta con rigor: el precio de un mercado de predicción es solo una <span className="text-text-primary font-medium">opinión colectiva</span>, y las opiniones colectivas cometen errores sistemáticos y predecibles. Cuando detectas uno de esos errores antes de que el mercado lo corrija, tienes <span className="text-brand-indigo font-bold italic">edge</span>.
              </p>

              <div className="bg-bg-card border border-brand-indigo/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={160} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-brand-indigo font-mono text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Zap size={14} fill="currentColor" /> La fórmula central
                  </h3>
                  <div className="text-3xl md:text-5xl font-bold text-text-primary mb-8 font-mono tracking-tighter">
                    Edge = P_real − P_mercado
                  </div>
                  <div className="space-y-6 text-text-secondary leading-relaxed">
                    <p>Donde <span className="text-text-primary font-mono text-sm bg-white/5 px-2 py-0.5 rounded">P_mercado</span> es el precio actual en Polymarket (por ejemplo, 58%) y <span className="text-text-primary font-mono text-sm bg-white/5 px-2 py-0.5 rounded">P_real</span> es tu estimación de la probabilidad verdadera del evento (por ejemplo, 70%).</p>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-sm italic mb-2">En este caso:</p>
                      <p className="text-xl font-bold text-brand-emerald">Edge = 70% − 58% = +12 puntos</p>
                    </div>
                    <p>Un edge <span className="text-brand-emerald font-bold">positivo</span> significa que el mercado está infravalorando el evento. Un edge <span className="text-brand-indigo font-bold">negativo</span> significa que el mercado lo está sobrevalorando.</p>
                    <p className="text-sm bg-brand-indigo/10 text-brand-indigo p-4 rounded-xl font-medium border-l-4 border-brand-indigo">
                      La decisión de actuar solo se toma si el edge supera los <span className="font-bold underline">8 puntos</span> en valor absoluto. Por debajo de eso, la incertidumbre puede tragarse la diferencia.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-32">
              <div>
                <h3 className="text-2xl font-bold mb-12 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-brand-indigo flex items-center justify-center text-white text-lg">◆</span>
                  Cómo se construye P_real: el proceso bayesiano
                </h3>
                <div className="grid grid-cols-1 gap-12">
                  {[
                    {
                      step: "01",
                      title: "Base rate: la pregunta que nadie hace",
                      desc: "Antes de cualquier opinión, te preguntas: ¿con qué frecuencia ocurren eventos similares históricamente?",
                      example: "Si el mercado pregunta si un presidente renunciará, analizamos cuántos presidentes en situaciones similares renunciaron realmente en los últimos 50 años. Si es 15%, esa es tu base rate. Es el ancla."
                    },
                    {
                      step: "02",
                      title: "Actualización bayesiana: pesar la información nueva",
                      desc: "Cada pieza de información solo puede ajustar tu base rate en una magnitud que puedes justificar explícitamente.",
                      example: "Diferente a una opinión normal, obligas a ser explícito: 'Dado el evento X, la probabilidad sube Z puntos'. Se evita empezar por la conclusión."
                    },
                    {
                      step: "03",
                      title: "Detección del sesgo de mercado",
                      desc: "El precio de Polymarket no es neutral; tiene sesgos comunes que detectamos para predecir errores.",
                      example: "Availability bias (sobreestima lo dramático), Recency bias (exceso de peso a lo reciente) y Narrative bias (historias convincentes vs realidad estadística)."
                    },
                    {
                      step: "04",
                      title: "Construcción del intervalo de confianza",
                      desc: "Tu estimación final no es un número, sino un rango: [P_mínima, P_central, P_máxima].",
                      example: "Si el rango es estrecho (ej. 8 puntos), el análisis es sólido. Si el rango es amplio (ej. 30 puntos), es incertidumbre disfrazada de oportunidad. Solo actuamos con intervalos estrechos."
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="relative pl-12 group">
                      <div className="absolute left-0 top-0 text-brand-indigo/30 font-mono font-bold text-4xl -translate-x-1/2 group-hover:text-brand-indigo transition-colors">{item.step}</div>
                      <div className="border-l border-border-subtle pl-12 pb-2">
                        <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                        <p className="text-text-secondary mb-6 leading-relaxed">{item.desc}</p>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-sm italic text-text-tertiary">
                          <span className="text-brand-indigo font-bold not-italic">Ejemplo: </span>{item.example}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-12">Las reglas de decisión</h3>
                <div className="bg-bg-card border border-border-subtle rounded-3xl overflow-hidden shadow-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-border-subtle">
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">Filtro</th>
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">Umbral</th>
                        <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-text-tertiary">Por qué</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      <tr>
                        <td className="px-8 py-6 font-bold text-brand-indigo">Magnitud del Edge</td>
                        <td className="px-8 py-6 font-mono font-bold text-text-primary">{">"} 8 puntos</td>
                        <td className="px-8 py-6 text-sm text-text-secondary">Evita que el error de estimación coma la ventaja.</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6 font-bold text-brand-indigo">Liquidez del Mercado</td>
                        <td className="px-8 py-6 font-mono font-bold text-text-primary">{">"} $5.000</td>
                        <td className="px-8 py-6 text-sm text-text-secondary">Evita manipulación y spreads altos en mercados pequeños.</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6 font-bold text-brand-indigo">Tiempo Resolución</td>
                        <td className="px-8 py-6 font-mono font-bold text-text-primary">{">"} 7 días</td>
                        <td className="px-8 py-6 text-sm text-text-secondary">Con menos tiempo, el precio ya descuenta casi todo.</td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6 font-bold text-brand-indigo">Nivel de Convicción</td>
                        <td className="px-8 py-6 font-mono font-bold text-text-primary">≥ 6/10</td>
                        <td className="px-8 py-6 text-sm text-text-secondary">Justificación sólida audible para publicar.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">Métrica de calibración: Brier Score</h3>
                  <p className="text-text-secondary leading-relaxed">
                    El sistema se mide con el <span className="text-text-primary font-bold">Brier Score</span>, la única métrica que importa para validar si somos mejores que el mercado.
                  </p>
                  <div className="bg-bg-card border border-border-subtle p-6 rounded-2xl font-mono text-center">
                    <p className="text-xs text-text-tertiary mb-3 uppercase tracking-widest">Fórmula de validación</p>
                    <p className="text-2xl font-bold text-text-primary">BS = (1/N) × Σ (P_estimada − Resultado)²</p>
                  </div>
                  <p className="text-sm text-text-tertiary leading-relaxed">
                    Un score de 0.0 es perfección. 0.25 es azar. Cualquier valor <span className="text-brand-emerald font-bold">por debajo de 0.20</span> en eventos complejos indica una ventaja demostrable sobre Polymarket.
                  </p>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl self-start">
                  <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                    <AlertCircle size={20} /> El error fatal
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    El error más peligroso es hacer los pasos en orden incorrecto: leer noticias primero, formar una opinión y luego buscar la base rate. Eso es <span className="font-bold underline">construir justificaciones</span>, no estimar probabilidades.
                  </p>
                  <div className="flex flex-col gap-2 font-mono text-[10px] items-center text-text-tertiary">
                    <span>ORDEN CORRECTO:</span>
                    <div className="flex items-center gap-2 text-red-500 font-bold">
                       BASE RATE ➔ DATOS ➔ SESGOS ➔ DECISIÓN
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Operating Guide (Polymarket) */}
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

            <div className="mt-12 md:mt-24 p-8 bg-brand-indigo/5 border border-brand-indigo/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 animate-on-scroll">
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
        <section id="suscripcion" className="py-16 md:py-32 px-6 bg-bg-base/30 border-y border-border-subtle">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-20 animate-on-scroll">
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
                  <span className="text-3xl font-bold">0€</span>
                </div>
                <p className="text-text-secondary text-sm mb-8">Para entender el sistema y verificar nuestro track record antes de saltar al mercado.</p>
                <div className="space-y-4 mb-10 flex-grow">
                  {[
                    '1 análisis semanal gratuito',
                    'Acceso al Track Record completo',
                    'Newsletter dominical de mercados',
                    'Fórmulas de edge públicas',
                    'Canal Telegram público'
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
                    price: '0€', 
                    period: '', 
                    features: ['1 análisis semanal gratuito', 'Acceso al Track Record completo', 'Newsletter dominical de mercados', 'Fórmulas de edge públicas', 'Canal Telegram público'] 
                  })}
                  className="w-full py-3 border border-border-subtle rounded-xl font-semibold hover:bg-white/5 transition-colors"
                >
                  Empezar gratis
                </button>
              </div>

              {/* Pro */}
              <div className="bg-bg-card border-2 border-brand-indigo p-8 rounded-2xl flex flex-col relative shadow-[0_0_40px_rgba(99,102,241,0.15)] animate-on-scroll">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-indigo text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Mejor Valor
                </div>
                <h4 className="text-xl font-semibold mb-2">Analista Pro</h4>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-text-primary">49€</span>
                  <span className="text-text-tertiary line-through text-lg">79€</span>
                  <span className="text-text-tertiary text-sm">/ mes</span>
                </div>
                <p className="text-text-secondary text-sm mb-8">Información privilegiada para quienes operan con convicción y buscan el máximo ROI.</p>
                <div className="space-y-4 mb-10 flex-grow">
                   <div className="flex gap-3 items-center text-sm font-semibold text-brand-indigo italic">
                    <Zap size={16} className="shrink-0" />
                    <span>Todo lo de Lector y además:</span>
                  </div>
                  {[
                    'Acceso total: 4-5 análisis/semana',
                    'Alertas inmediatas en Telegram',
                    'Intervalos de confianza detallados',
                    'Alertas de "Smart Money" anómalo',
                    'Acceso a la API de señales (Beta)',
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
                    name: 'Analista Pro', 
                    price: '49€', 
                    period: 'mes', 
                    features: ['Acceso total: 4-5 análisis/semana', 'Alertas inmediatas en Telegram', 'Intervalos de confianza detallados', 'Alertas de "Smart Money" anómalo', 'Acceso a la API de señales (Beta)', 'Sesión de calibración mensual', 'Soporte directo prioritario'] 
                  })}
                  className="w-full py-4 bg-brand-indigo text-white rounded-xl font-bold hover:brightness-110 shadow-lg shadow-brand-indigo/20 transition-all"
                >
                  Suscribirse ahora →
                </button>
              </div>

              {/* Annual */}
              <div className="bg-bg-card border border-brand-emerald p-8 rounded-2xl flex flex-col animate-on-scroll">
                <h4 className="text-xl font-semibold mb-2">Elite Anual</h4>
                <div className="mb-6 flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-text-primary">399€</span>
                    <span className="text-xl font-normal text-text-tertiary">/ año</span>
                  </div>
                  <span className="text-brand-emerald text-[11px] font-bold mt-1 uppercase tracking-wider">Ahorras 189€ al año</span>
                </div>
                <p className="text-text-secondary text-sm mb-8">Para instituciones y ballenas que entienden que el edge se construye a largo plazo.</p>
                <div className="space-y-4 mb-10 flex-grow">
                   <div className="flex gap-3 items-center text-sm font-semibold text-brand-emerald italic">
                    <Activity size={16} className="shrink-0" />
                    <span>Todo lo Pro y además:</span>
                  </div>
                  {[
                    'Prioridad en alertas "Flash"',
                    'Canal Elite VIP (Q&A directo)',
                    'Informes de mercado mensuales',
                    'Consultoría técnica por trimestre',
                    'Exportación de datos brutos (RAW)'
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
                    name: 'Elite Anual', 
                    price: '399€', 
                    period: 'año', 
                    features: ['Prioridad en alertas "Flash"', 'Canal Elite VIP (Q&A directo)', 'Informes de mercado mensuales', 'Consultoría técnica por trimestre', 'Exportación de datos brutos (RAW)'] 
                  })}
                  className="w-full py-3 border border-brand-emerald text-brand-emerald rounded-xl font-semibold hover:bg-brand-emerald/5 transition-colors"
                >
                  Obtener ventaja anual →
                </button>
              </div>
            </div>

            <div className="mt-16 md:mt-32 max-w-3xl mx-auto animate-on-scroll">
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
        <section className="py-16 md:py-24 px-6 bg-bg-card">
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
            user={currentUser}
            onLogin={() => { setAuthMode('login'); setShowAuthModal(true); }}
            showToast={showToast}
            onBack={() => setView('landing')} 
          />
        )}
      </motion.div>
    ) : view === 'analysis' ? (
      <motion.div
        key="analysis"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
      >
        <AnalysisPage onBack={() => setView('landing')} theme={theme} />
      </motion.div>
    ) : view === 'dashboard' ? (
      <motion.div
        key="dashboard"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
      >
        {currentUser && (
          <UserDashboard 
            user={currentUser} 
            onBack={() => setView('landing')} 
            showToast={showToast}
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
            theme={theme}
          />
        )}
      </motion.div>
    ) : view === 'admin' && currentUser?.email === 'dani.sanchez.vila@gmail.com' ? (
      <motion.div
        key="admin"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AdminPanel 
          analyses={analyses} 
          onBack={() => setView('landing')}
          logoText={logoText}
          setLogoText={setLogoText}
          logoIcon={logoIcon}
          setLogoIcon={setLogoIcon}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          faviconUrl={faviconUrl}
          setFaviconUrl={setFaviconUrl}
          currentUser={currentUser}
          showToast={showToast}
        />
      </motion.div>
    ) : view === 'analysis-detail' ? (
      <motion.div
        key="analysis-detail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {selectedAnalysis && (
          <AnalysisDetailPage 
            analysis={selectedAnalysis} 
            currentUser={currentUser} 
            onBack={() => setView('landing')}
            onSubscribe={() => {
              const el = document.getElementById('suscripcion');
              if (el) {
                setView('landing');
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
              }
            }}
            theme={theme}
          />
        )}
      </motion.div>
    ) : null}
  </AnimatePresence>
</main>

      {view !== 'dashboard' && (
        <footer className="bg-bg-card pt-16 pb-12 md:pt-24 md:pb-12 px-6 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-10 md:mb-20 text-sm">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <motion.img 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                  src={logoUrl || (theme === 'dark' ? "/logo-dark.svg" : "/logo-light.svg")} 
                  alt="Edgio" 
                  className="h-8 md:h-10 w-auto object-contain cursor-pointer"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-text-secondary leading-relaxed mb-8 max-w-xs">
                En un mundo de opiniones, nosotros ofrecemos probabilidades reales.
              </p>
              <span className="text-text-tertiary block">© 2024 {logoText}</span>
            </div>

            <div>
              <h5 className="text-text-primary font-bold uppercase tracking-widest text-[11px] mb-6">Producto</h5>
              <ul className="space-y-4 text-text-secondary">
                {[
                  { name: 'Análisis', id: 'analysis' },
                  { name: 'Track Record', id: 'track-record' },
                  { name: 'Metodología', id: 'metodologia' },
                  { name: 'Guía Operativa', id: 'guia' }
                ].map(l => (
                  <li key={l.name}>
                    <button 
                      onClick={() => {
                        if (l.id === 'analysis') setView('analysis');
                        else {
                          setView('landing');
                          setTimeout(() => document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }), 50);
                        }
                      }} 
                      className="hover:text-brand-indigo transition-colors"
                    >
                      {l.name}
                    </button>
                  </li>
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
                  { name: 'Telegram', url: 'https://t.me/edgio_predictions', icon: <Send size={14} className="rotate-45" /> },
                  { name: 'Twitter / X', url: 'https://twitter.com' },
                  { name: 'LinkedIn', url: 'https://linkedin.com' },
                  { name: 'Substack', url: 'https://substack.com' }
                ].map(l => (
                  <li key={l.name}>
                    <a href={l.url} target="_blank" rel="no-referrer" className="hover:text-brand-indigo transition-colors flex items-center gap-2">
                      {l.icon}
                      {l.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border-subtle pt-8 text-center">
            <p className="text-text-tertiary text-[10px] leading-relaxed max-w-3xl mx-auto uppercase tracking-wider">
              {logoText} no ofrece asesoramiento financiero ni de inversión. Los mercados de predicción implican riesgo real. Opera con responsabilidad y basándote en tu propia diligencia debida.
            </p>
          </div>
        </div>
      </footer>
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-bg-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-brand-indigo/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Lock size={32} className="text-brand-indigo" />
                </motion.div>
                <h2 className="text-2xl font-bold text-text-primary">
                  {authMode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                </h2>
                <p className="text-text-secondary text-sm mt-2">
                  {authMode === 'login' ? 'Entra para ver tus análisis guardados.' : 'Únete a la élite de los mercados de predicción.'}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] text-text-tertiary uppercase font-bold tracking-widest mb-2 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                    <input 
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-bg-base border border-border-subtle rounded-xl py-4 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 transition-all font-mono text-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-text-tertiary uppercase font-bold tracking-widest mb-2 ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                    <input 
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-bg-base border border-border-subtle rounded-xl py-4 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 transition-all font-mono text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-brand-danger text-xs font-medium">
                    <AlertCircle size={14} />
                    {authError}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-brand-indigo text-white rounded-xl font-bold shadow-xl shadow-brand-indigo/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authLoading ? <Loader2 size={18} className="animate-spin" /> : (authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-bg-card px-3 text-text-tertiary font-bold tracking-widest">o</span></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-4 bg-bg-card border border-border-subtle text-text-primary rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-bg-base transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
                Continuar con Google
              </button>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-sm font-medium text-text-tertiary hover:text-brand-indigo transition-colors"
                >
                  {authMode === 'login' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

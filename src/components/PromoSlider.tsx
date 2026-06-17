import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, Percent, Megaphone, HelpCircle, X, Check, ArrowRight } from 'lucide-react';
import { Promotion } from '../types';

interface PromoSliderProps {
  onSelectFilter?: (linkUrl: string) => void;
}

export default function PromoSlider({ onSelectFilter }: PromoSliderProps) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  
  // simulated inquiry form
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/promos?activeOnly=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPromos(data.filter(p => p.active));
        }
      })
      .catch(err => console.error('Failed to load active promos:', err))
      .finally(() => setLoading(false));
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promos]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + promos.length) % promos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % promos.length);
  };

  const handlePromoInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      // automatically hide success screen after 3 seconds
      setTimeout(() => setIsSubmitted(false), 4000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="w-full h-44 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse">
        <div className="text-center font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-indigo-500" />
          Synchronizing Premium Real Estate Banners...
        </div>
      </div>
    );
  }

  if (promos.length === 0) {
    return null; // Return nothing if no active promotions
  }

  const currentPromo = promos[currentIndex];

  const getPromoIcon = (type: string) => {
    switch (type) {
      case 'OFFER':
        return <Percent className="w-4 h-4 text-rose-500" />;
      case 'ADVERTISEMENT':
        return <Megaphone className="w-4 h-4 text-emerald-500" />;
      case 'FEATURED':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getPromoTagColor = (type: string) => {
    switch (type) {
      case 'OFFER':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'ADVERTISEMENT':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'FEATURED':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Slider Hero area */}
      <div 
        onClick={() => setSelectedPromo(currentPromo)}
        id="home_promo_slider"
        className="relative h-64 md:h-72 w-full rounded-3xl overflow-hidden shadow-xl border border-slate-100 dark:border-white/10 cursor-pointer group bg-slate-950 text-white"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPromo.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Dark Overlay */}
            <img 
              src={currentPromo.imageUrl} 
              alt={currentPromo.title} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[8000ms] ease-out select-none"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-indigo-950/40" />

            {/* Content area */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8 z-10 w-full md:max-w-xl">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-xl ${getPromoTagColor(currentPromo.type)} flex items-center justify-center`}>
                    {getPromoIcon(currentPromo.type)}
                  </div>
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-white/95">
                    {currentPromo.type}
                  </span>
                  {currentPromo.badge && (
                    <span className="text-[8px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs uppercase shadow-sm">
                      🔥 {currentPromo.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-black font-sans leading-tight text-white tracking-tight line-clamp-2 md:line-clamp-3">
                  {currentPromo.title}
                </h2>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans line-clamp-3 max-w-lg">
                  {currentPromo.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPromo(currentPromo);
                  }}
                  className="text-[10px] font-mono uppercase bg-white/15 hover:bg-white/25 px-4.5 py-2.5 rounded-xl text-white transition-all flex items-center gap-1 cursor-pointer border border-white/5 font-bold"
                >
                  Details & Claim Offers
                  <ArrowRight className="w-3 h-3 text-indigo-300" />
                </button>
                {currentPromo.linkUrl && currentPromo.linkUrl !== '#' && currentPromo.linkUrl !== '/' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectFilter) {
                        onSelectFilter(currentPromo.linkUrl!);
                      }
                    }}
                    className="text-[10px] font-mono uppercase bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 px-4.5 py-2.5 rounded-xl text-white font-black transition-all flex items-center gap-1 shadow-lg shadow-indigo-600/30 cursor-pointer border border-indigo-500/25"
                  >
                    🎯 Search Matches
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators / Navigation Bullets */}
        {promos.length > 1 && (
          <div className="absolute bottom-6 right-6 flex items-center gap-1 px-2.5 py-1.5 bg-slate-950/60 backdrop-blur-md rounded-xl z-20 border border-white/5">
            {promos.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-indigo-500 w-3.5' : 'bg-white/45 hover:bg-white/70'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Manual Arrow Controls */}
        {promos.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between z-20 pointer-events-none">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 px-1.5 bg-slate-950/50 hover:bg-slate-950/80 backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all text-white rounded-xl pointer-events-auto cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 px-1.5 bg-slate-950/50 hover:bg-slate-950/80 backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all text-white rounded-xl pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal detailed View */}
      <AnimatePresence>
        {selectedPromo && (
          <div 
            id="promo_lightbox_modal"
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPromo(null);
                  setIsSubmitted(false);
                }}
                className="absolute top-4 right-4 p-2 bg-slate-950/60 dark:bg-slate-950/85 hover:bg-slate-950 text-white rounded-full z-40 transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left Side: Campaign Banner Image */}
                <div className="relative h-48 md:h-full min-h-[220px]">
                  <img 
                    src={selectedPromo.imageUrl} 
                    alt={selectedPromo.title} 
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                    <span className="text-[10px] font-mono uppercase bg-indigo-600 px-2.5 py-1 rounded-md text-white/95 font-bold">
                      {selectedPromo.type}
                    </span>
                    <h3 className="text-sm font-sans font-black mt-2 tracking-tight leading-tight">
                      ApnaGhar Premium Campaign
                    </h3>
                  </div>
                </div>

                {/* Right Side: Campaign details & Inquiry Capture */}
                <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded-md ${getPromoTagColor(selectedPromo.type)}`}>
                        {getPromoIcon(selectedPromo.type)}
                      </div>
                      <span className="text-[9px] font-mono tracking-widest uppercase font-black text-slate-400">Campaign Details</span>
                    </div>

                    <h2 className="text-lg md:text-xl font-sans font-black text-slate-900 dark:text-white tracking-tight lead-tight">
                      {selectedPromo.title}
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedPromo.description}
                    </p>

                    {selectedPromo.linkUrl && selectedPromo.linkUrl !== '#' && selectedPromo.linkUrl !== '/' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectFilter) {
                            onSelectFilter(selectedPromo.linkUrl!);
                          }
                          setSelectedPromo(null);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] font-black uppercase rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5 mt-2.5"
                      >
                        🎯 Apply Campaign Filters & Browse Matching Properties
                      </button>
                    )}
                  </div>

                  {/* Simulated Lead Interest Signup */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border dark:border-white/5">
                    {isSubmitted ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-4 space-y-2 text-emerald-500"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h4 className="text-xs font-black uppercase font-mono tracking-wide">Inquiry Registered!</h4>
                        <p className="text-[10px] text-slate-400">Our Premium relationship officer will contact you within 2 hours.</p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handlePromoInquiry} className="space-y-2.5">
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-800 dark:text-white flex items-center gap-1">
                            CLAIM OFFERS & LEARN MORE
                          </h4>
                          <span className="text-[9px] text-slate-400 block pb-1">Register prompt details to receive brochures & terms immediately</span>
                        </div>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            required
                            placeholder="Your Full Name"
                            value={inquiryName}
                            onChange={e => setInquiryName(e.target.value)}
                            className="w-full p-2 text-[11px] border border-slate-200 dark:border-white/10 dark:bg-slate-900 rounded-xl"
                          />
                          <input
                            type="email"
                            required
                            placeholder="Email Address"
                            value={inquiryEmail}
                            onChange={e => setInquiryEmail(e.target.value)}
                            className="w-full p-2 text-[11px] border border-slate-200 dark:border-white/10 dark:bg-slate-900 rounded-xl"
                          />
                          <input
                            type="tel"
                            placeholder="Contact Phone (Optional)"
                            value={inquiryPhone}
                            onChange={e => setInquiryPhone(e.target.value)}
                            className="w-full p-2 text-[11px] border border-slate-200 dark:border-white/10 dark:bg-slate-900 rounded-xl"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-850 text-white font-mono text-[9px] font-black uppercase rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1"
                        >
                          {submitting ? 'Authenticating Offer...' : 'Activate Special Benefits Now!'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

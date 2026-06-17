import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Building, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { Property } from '../types';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  favorites: string[];
  onSelectProperty: (property: Property) => void;
  onFavoriteToggle: (id: string) => void;
  onClearFilters?: () => void;
}

export default function FavoritesDrawer({
  isOpen,
  onClose,
  properties,
  favorites,
  onSelectProperty,
  onFavoriteToggle,
  onClearFilters
}: FavoritesDrawerProps) {
  const favoriteItems = properties.filter(p => favorites.includes(p.id));

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-all"
            id="fav-drawer-overlay"
          />

          {/* Drawer container panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 180 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 md:w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col focus:outline-none"
            id="fav-drawer-panel"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-2">
                <div className="bg-pink-500/10 p-2 rounded-xl border border-pink-500/20">
                  <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase font-mono text-white tracking-wider flex items-center gap-2">
                    My Favorites
                    <span className="text-[10px] bg-pink-500 text-white font-mono px-2 py-0.5 rounded-full font-black">
                      {favoriteItems.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/50">Manage your bookmarked properties</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white border border-transparent hover:border-white/10 transition-all cursor-pointer active:scale-95"
                title="Close drawer"
                id="close-fav-drawer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {favoriteItems.length === 0 ? (
                /* INFORMATIVE EMPTY STATE */
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/10 rounded-full blur-xl filter animate-pulse"></div>
                    <div className="relative bg-slate-950 p-6 rounded-3xl border border-pink-500/20 flex items-center justify-center">
                      <Heart className="h-10 w-10 text-pink-500/40" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">No Saved Favorites</h4>
                    <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
                      Your bookmark board is vacant. Save premium apartments, retail stores, or villas to track them quickly.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onClearFilters) onClearFilters();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-sans text-xs font-bold rounded-xl shadow-lg shadow-pink-500/15 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer border border-pink-400/20"
                  >
                    <span>Discover Properties</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* ITERATIVE SAVED ITEMS LIST */
                <div className="space-y-3.5">
                  {favoriteItems.map((p) => (
                    <div
                      key={p.id}
                      className="group p-3 bg-slate-950/50 hover:bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/20 flex gap-3 text-left transition-all duration-300 shadow-md relative"
                    >
                      {/* Image Preview thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-white/5 relative">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'}
                          alt={p.title || 'Property'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase bg-slate-900/90 text-blue-400 border border-white/10">
                          {p.purpose || 'SELL'}
                        </span>
                      </div>

                      {/* Info details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-pink-400 transition-colors">
                            {p.title || 'Property'}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {p.location?.area || ''}, {p.location?.city || ''}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[11px] font-black text-pink-400 font-mono">
                            {formatINR(p.price)}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* View property action CTA */}
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProperty(p);
                                onClose();
                              }}
                              className="text-[9px] font-bold font-sans bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer"
                            >
                              Details
                            </button>

                            {/* Remove action button */}
                            <button
                              type="button"
                              onClick={() => onFavoriteToggle(p.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all cursor-pointer"
                              title="Delete bookmark"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Panel footer summary action */}
            {favoriteItems.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-slate-950/20 text-center space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Bookmarks</span>
                  <span className="font-mono font-bold text-white">{favoriteItems.length} items</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1.5">
                  <span className="text-slate-400">Average valuation</span>
                  <span className="font-mono font-bold text-pink-400 text-sm">
                    {formatINR(favoriteItems.reduce((acc, p) => acc + p.price, 0) / favoriteItems.length)}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

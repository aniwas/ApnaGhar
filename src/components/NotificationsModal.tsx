import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, BellOff, Sparkles, AlertTriangle, CheckCircle, ArrowRight, Calendar, Mail, Check, MessageSquare } from 'lucide-react';

interface Notification {
  id: string;
  email: string;
  subject: string;
  body: string;
  createdAt?: string;
  read?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onOpenAlertSetup?: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onOpenAlertSetup
}: NotificationsModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getNotifIconType = (subject: string, body: string) => {
    const s = subject.toLowerCase();
    const b = body.toLowerCase();
    
    if (s.includes('approved') || s.includes('success')) {
      return {
        icon: CheckCircle,
        bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        markerColor: 'bg-emerald-500'
      };
    }
    if (s.includes('rejected') || s.includes('failed') || s.includes('unauthorized') || s.includes('security')) {
      return {
        icon: AlertTriangle,
        bgColor: 'bg-red-500/10 border-red-500/20 text-red-400',
        markerColor: 'bg-red-500'
      };
    }
    if (s.includes('alert') || s.includes('match') || s.includes('new listing')) {
      return {
        icon: Sparkles,
        bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        markerColor: 'bg-blue-500'
      };
    }
    if (s.includes('booking') || b.includes('booking') || b.includes('visit') || b.includes('tour')) {
      return {
        icon: Calendar,
        bgColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        markerColor: 'bg-cyan-500'
      };
    }
    return {
      icon: MessageSquare,
      bgColor: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
      markerColor: 'bg-blue-500'
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 transition-all"
            id="notif-modal-backdrop"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col focus:outline-none"
              id="notif-modal-content"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 bg-slate-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                    <Bell className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase font-mono text-white tracking-widest flex items-center gap-2">
                      User Notifications
                      <span className="text-[10px] bg-blue-500 text-white font-mono px-2 py-0.5 rounded-full font-black animate-pulse">
                        {notifications.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-white/50">Activity updates, matches, and logs</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white border border-transparent hover:border-white/10 transition-all cursor-pointer active:scale-95"
                  title="Close panel"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable Body list */}
              <div className="p-5 overflow-y-auto max-h-[440px] space-y-3 custom-scrollbar">
                {notifications.length === 0 ? (
                  /* INFORMATIVE EMPTY STATE */
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-2xl filter animate-pulse"></div>
                      <div className="relative bg-slate-950 p-6 rounded-3xl border border-blue-500/10 flex items-center justify-center">
                        <BellOff className="h-10 w-10 text-blue-400/30" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">No New Alerts</h4>
                      <p className="text-xs text-slate-400 max-w-[320px] leading-relaxed">
                        You have not triggered any notifications or alert criteria yet. Create a search subscription to receive listings!
                      </p>
                    </div>

                    {onOpenAlertSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAlertSetup();
                          onClose();
                        }}
                        className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/15 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer border border-blue-400/20"
                      >
                        <span>Configure Search Alert</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isExpanded = expandedId === n.id;
                    const { icon: Icon, bgColor, markerColor } = getNotifIconType(n.subject, n.body);
                    const timestamp = n.createdAt 
                      ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Recent Alert';

                    return (
                      <div
                        key={n.id}
                        onClick={() => setExpandedId(isExpanded ? null : n.id)}
                        className={`p-3 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden pl-11 select-none ${isExpanded ? 'border-blue-500/30 shadow-md bg-slate-950/80' : 'border-white/5'}`}
                      >
                        {/* Side color stripe marker */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${markerColor}`} />

                        {/* Top-left floating Icon */}
                        <div className={`absolute top-3 left-3 p-1.5 rounded-lg border ${bgColor}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        {/* Content lines */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 font-mono">
                            <span>{n.email}</span>
                            <span>{timestamp}</span>
                          </div>

                          <h4 className="text-xs font-bold text-white leading-tight">{n.subject}</h4>
                          
                          {/* Expanded / collapsed body string */}
                          <p className={`text-[10px] text-slate-300 font-sans leading-relaxed pt-1 whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {n.body}
                          </p>

                          {/* Dynamic Expand indication */}
                          <div className="flex justify-end pt-1">
                            <span className="text-[8px] font-mono tracking-wider uppercase text-blue-500/80 hover:text-blue-400 font-bold">
                              {isExpanded ? 'Click to collapse' : 'Click to read full details'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal footer summary information */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-slate-950/40 flex items-center justify-between text-[10px] text-white/50 px-5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    <span>Monitoring ApnaGhar registry indices</span>
                  </div>
                  <button 
                    onClick={() => setExpandedId(null)}
                    className="hover:text-white font-mono uppercase text-[9px] tracking-widest font-extrabold focus:outline-none cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

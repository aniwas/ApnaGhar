import React from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, BedDouble, Bath, Maximize, CircleSlash, Flame, ArrowRight, 
  Star, ShieldCheck, ChevronLeft, ChevronRight, Eye, X, Send, Check, 
  Loader2, Bell, BellOff, History, Clock, DollarSign, Edit
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Property } from '../types';
import InteractiveMap from './InteractiveMap';

interface PropertyCardProps {
  key?: string;
  property: Property;
  onSelect: (property: Property) => void;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  isCompared?: boolean;
  onCompareToggle?: (id: string) => void;
  comparedCount?: number;
  currentUserEmail?: string;
  currentUserRole?: string;
  onPropertyUpdate?: () => void;
}

export default function PropertyCard({ 
  property, 
  onSelect, 
  onFavoriteToggle, 
  isFavorite = false,
  isCompared = false,
  onCompareToggle,
  comparedCount = 0,
  currentUserEmail = '',
  currentUserRole = '',
  onPropertyUpdate
}: PropertyCardProps) {
  // Format Indian currency style
  const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);

  // Quick View states
  const [showQuickView, setShowQuickView] = React.useState(false);
  const [showMapOverlay, setShowMapOverlay] = React.useState(false);
  const [quickViewImgIndex, setQuickViewImgIndex] = React.useState(0);
  const [contactName, setContactName] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState(
    `Hello ${property.ownerName},\n\nI am interested in your listing: "${property.title}". Please send structural specs and direct support walk-through details. \n\nBest regards,`
  );
  const [isSending, setIsSending] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);

  // Price Change Notification states
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [subCount, setSubCount] = React.useState(0);
  const [showNotifyPopover, setShowNotifyPopover] = React.useState(false);
  const [notifyEmail, setNotifyEmail] = React.useState(currentUserEmail || '');
  const [isSubmittingNotify, setIsSubmittingNotify] = React.useState(false);
  const [notifyMessage, setNotifyMessage] = React.useState('');

  // Edit Price Inline states (for Admins or Owners)
  const [isEditingPrice, setIsEditingPrice] = React.useState(false);
  const [newPriceValue, setNewPriceValue] = React.useState(property.price.toString());
  const [isSavingPrice, setIsSavingPrice] = React.useState(false);

  // Sync notifyEmail state if currentUserEmail changes
  React.useEffect(() => {
    if (currentUserEmail) {
      setNotifyEmail(currentUserEmail);
    }
  }, [currentUserEmail]);

  // Load subscriptions to see if already registered
  React.useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch(`/api/properties/${property.id}/price-alerts`);
        if (res.ok) {
          const list = await res.json();
          setSubCount(list.length);
          if (currentUserEmail) {
            const hasSub = list.some((item: any) => item.email.toLowerCase() === currentUserEmail.toLowerCase());
            setIsSubscribed(hasSub);
          }
        }
      } catch (err) {
        console.warn('Error loading price subscriptions:', err);
      }
    };
    fetchSubscriptions();
  }, [property.id, currentUserEmail]);

  // Handle subscription submission
  const handleSubscribePrice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes('@')) {
      setNotifyMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmittingNotify(true);
    setNotifyMessage('');
    try {
      const res = await fetch(`/api/properties/${property.id}/price-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail })
      });
      if (res.ok) {
        setIsSubscribed(true);
        setSubCount(prev => prev + 1);
        setNotifyMessage('🔔 Successfully subscribed to price drop updates!');
        confetti({
          particleCount: 85,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        });
        setTimeout(() => {
          setShowNotifyPopover(false);
          setNotifyMessage('');
        }, 2200);
      } else {
        const err = await res.json();
        setNotifyMessage(err.error || 'Failed to subscribe.');
      }
    } catch (err) {
      setNotifyMessage('Server connection error. Please try again.');
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  // Handle unsubscribe
  const handleUnsubscribePrice = async () => {
    if (!currentUserEmail) return;
    setIsSubmittingNotify(true);
    setNotifyMessage('');
    try {
      const res = await fetch(`/api/properties/${property.id}/price-alerts?email=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIsSubscribed(false);
        setSubCount(prev => Math.max(0, prev - 1));
        setNotifyMessage('Successfully unsubscribed.');
        setTimeout(() => {
          setShowNotifyPopover(false);
          setNotifyMessage('');
        }, 1500);
      } else {
        const err = await res.json();
        setNotifyMessage(err.error || 'Failed to unsubscribe.');
      }
    } catch (err) {
      setNotifyMessage('Error unsubscribing.');
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  // Handle Price Edit submission for Admins/Owners
  const handlePriceUpdateSubmit = async () => {
    const val = Number(newPriceValue);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid numerical price value.');
      return;
    }

    setIsSavingPrice(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: val })
      });
      if (res.ok) {
        setIsEditingPrice(false);
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.7 }
        });
        if (onPropertyUpdate) {
          onPropertyUpdate();
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save price.');
      }
    } catch (err) {
      alert('Error saving price.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
  };

  const handleNextImage = () => {
    if (!property.images || property.images.length <= 1) return;
    setCurrentImgIndex((prev) => (prev + 1) % property.images.length);
  };

  const handlePrevImage = () => {
    if (!property.images || property.images.length <= 1) return;
    setCurrentImgIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const formatINR = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getPurposeString = (purpose: string) => {
    switch (purpose) {
      case 'SELL': return 'For Sale';
      case 'RENT': return 'Rent / Mo';
      case 'LEASE': return 'Lease / Mo';
      default: return purpose;
    }
  };

  const handleCloseQuickView = () => {
    setShowQuickView(false);
    setSendSuccess(false);
    setContactName('');
    setContactEmail('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group backdrop-blur-md bg-white/5 shadow-2xl border border-white/10 h-full rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 flex flex-col text-white"
    >
      
      {/* Property Image Cover with next/image optimizations & Mini Carousel */}
      <div 
        className="relative h-52 overflow-hidden bg-slate-900 group/carousel cursor-pointer"
        onClick={() => onSelect(property)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images Sliding or Fading */}
        {property.images && property.images.length > 0 ? (
          <div className="relative w-full h-full">
            {property.images.map((imgUrl, idx) => (
              <motion.img
                key={idx}
                src={imgUrl}
                alt={`${property.title} - Image ${idx + 1}`}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                initial={{ opacity: 0 }}
                animate={{ opacity: idx === currentImgIndex ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-300"
                style={{ zIndex: idx === currentImgIndex ? 1 : 0 }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-white/40">
            No image available
          </div>
        )}

        {/* Purpose Badge Overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10 flex-wrap max-w-[70%]">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0b0e14]/80 text-white backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
            {getPurposeString(property.purpose)}
          </span>
          {property.featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
              <Flame className="h-3 w-3 animate-pulse" />
              Featured
            </span>
          )}
          {(property.status === 'APPROVED' || property.status === 'SOLD' || property.status === 'RENTED') && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600/90 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md border border-emerald-500/20 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>

        {/* Favorite Icon Option */}
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(property.id);
            }}
            className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/70 hover:text-red-400 rounded-lg shadow-md hover:scale-110 active:scale-90 transition-all border border-white/10 cursor-pointer z-10"
          >
            <svg 
              className={`h-4.5 w-4.5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white/50'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Chevron Navigation Controls - Only showing if more than 1 image exists & on container hover */}
        {property.images && property.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 focus:opacity-100 cursor-pointer z-10 hover:scale-105 active:scale-95"
              aria-label="Previous Image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 focus:opacity-100 cursor-pointer z-10 hover:scale-105 active:scale-95"
              aria-label="Next Image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Carousel Indicator Dots at the bottom */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1 z-10 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/5">
            {property.images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentImgIndex ? 'w-3 bg-blue-500' : 'w-1.5 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Category Badge on Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[9px] font-bold tracking-wider bg-blue-600/90 text-white px-2 py-0.5 rounded-md font-mono uppercase shadow-sm border border-white/5 font-bold">
            {property.category} • {property.type}
          </span>
        </div>
      </div>

      {/* Property Details Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Price & Rating Row */}
          <div className="flex items-center justify-between mb-2">
            <div>
              {isEditingPrice ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="number"
                    value={newPriceValue}
                    onChange={(e) => setNewPriceValue(e.target.value)}
                    className="w-24 bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none font-mono"
                    autoFocus
                  />
                  <button 
                    onClick={handlePriceUpdateSubmit}
                    disabled={isSavingPrice}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                  >
                    {isSavingPrice ? '...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setIsEditingPrice(false)}
                    className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xl font-extrabold text-white leading-none">
                    {formatINR(property.price)}
                  </span>
                  {property.purpose !== 'SELL' && (
                    <span className="text-[10px] text-white/50 font-semibold font-mono">/ mo</span>
                  )}
                  {(currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRole === 'AGENT') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingPrice(true);
                      }}
                      className="p-1 text-white/40 hover:text-blue-400 rounded hover:bg-white/5 transition cursor-pointer"
                      title="Edit property listing price"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {property.averageRating !== undefined && property.averageRating !== null && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] text-amber-400 font-bold shadow-md">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{property.averageRating}</span>
                {property.reviewsCount !== undefined && property.reviewsCount > 0 && (
                  <span className="text-white/40 font-normal">({property.reviewsCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Property Title */}
          <h3 className="text-sm font-bold text-white/90 line-clamp-1 group-hover:text-blue-400 transition-colors">
            {property.title}
          </h3>

          {/* Address & Show on Map Button */}
          <div className="flex items-center justify-between gap-1.5 text-white/50 text-xs mt-1.5 mb-4 font-sans">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <span className="line-clamp-1">{property.location?.area || ''}, {property.location?.city || ''}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMapOverlay(true);
              }}
              className="text-[10px] text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-0.5 rounded-lg font-black tracking-wide uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
              title="Show exact property address location on map radar"
            >
              Show Map
            </button>
          </div>

          {/* Price Alert Subscription Widget Row */}
          <div className="relative mb-3 flex items-center justify-between gap-2 border-t border-b border-white/5 py-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 text-[10px] text-white/60 font-medium font-sans">
              <Bell className={`h-3 w-3 ${isSubscribed ? 'animate-bounce text-emerald-400' : 'text-white/40'}`} />
              {isSubscribed ? (
                <span className="text-emerald-400 font-semibold">Subscribed to drops!</span>
              ) : (
                <span>Track price changes</span>
              )}
              {subCount > 0 && (
                <span className="text-[9px] text-white/30 font-mono">({subCount})</span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifyPopover(!showNotifyPopover);
              }}
              className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                isSubscribed 
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' 
                  : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20'
              }`}
            >
              {isSubscribed ? 'Mute Alerts' : 'Notify Me'}
            </button>

            {/* Price notifications details Popover form */}
            {showNotifyPopover && (
              <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-30 animate-in fade-in slide-in-from-top-1 text-xs">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-white tracking-tight text-[11px] flex items-center gap-1 font-sans">
                    <Bell className="h-3.5 w-3.5 text-indigo-400" />
                    Price Change Tracker
                  </span>
                  <button 
                    onClick={() => {
                      setShowNotifyPopover(false);
                      setNotifyMessage('');
                    }}
                    className="text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {isSubscribed ? (
                  <div>
                    <p className="text-[10px] text-white/60 mb-2 leading-relaxed font-sans">
                      You are subscribed to receive sitemail notifications at <span className="text-indigo-400 font-mono font-bold">{currentUserEmail || 'your email'}</span> if the landlord updates the price.
                    </p>
                    {notifyMessage && <p className="text-[10px] text-indigo-400 mb-2 font-sans font-bold">{notifyMessage}</p>}
                    <button
                      type="button"
                      onClick={handleUnsubscribePrice}
                      disabled={isSubmittingNotify}
                      className="w-full text-[10px] bg-red-600 hover:bg-red-500 text-white font-black py-1 px-2 rounded tracking-wider uppercase disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingNotify ? 'Muting...' : 'Cancel Subscription'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribePrice}>
                     <p className="text-[10px] text-white/60 mb-2 leading-relaxed font-sans">
                       Get a real-time system email alert as soon as this listing's price drops or changes.
                     </p>
                     <div className="flex items-center gap-1">
                       <input
                         type="email"
                         placeholder="Enter email address"
                         value={notifyEmail}
                         onChange={(e) => setNotifyEmail(e.target.value)}
                         className="flex-1 text-[10px] bg-slate-900 border border-white/10 rounded px-2 py-1 text-white focus:border-blue-500 focus:outline-none font-mono"
                         required
                       />
                       <button
                         type="submit"
                         disabled={isSubmittingNotify}
                         className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-2.5 py-1 rounded select-none disabled:opacity-50 cursor-pointer"
                       >
                         {isSubmittingNotify ? '...' : 'Track'}
                       </button>
                     </div>
                     {notifyMessage && (
                       <p className={`text-[10px] mt-1.5 font-bold font-sans ${notifyMessage.includes('Successfully') ? 'text-emerald-400' : 'text-amber-400'}`}>
                         {notifyMessage}
                       </p>
                     )}
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Key Specs Row */}
          <div className="grid grid-cols-3 gap-2 py-3 px-2 rounded-xl bg-white/5 border border-white/5 mb-4 text-white/70">
            {property.details?.bedrooms !== undefined && property.details?.bedrooms > 0 ? (
              <div className="flex flex-col items-center justify-center font-sans block">
                <div className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs font-bold text-white">{property.details?.bedrooms}</span>
                </div>
                <span className="text-[9px] text-white/50 font-medium">BHK</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center font-sans block">
                <div className="flex items-center gap-1">
                   <CircleSlash className="h-3.5 w-3.5 text-white/20" />
                  <span className="text-xs font-bold text-white/40">-</span>
                </div>
                <span className="text-[9px] text-white/50 font-medium font-mono">Beds</span>
              </div>
            )}

            {property.details?.bathrooms !== undefined && property.details?.bathrooms > 0 ? (
              <div className="flex flex-col items-center justify-center font-sans block">
                <div className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs font-bold text-white">{property.details?.bathrooms}</span>
                </div>
                <span className="text-[9px] text-white/50 font-medium">Baths</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center font-sans block">
                <div className="flex items-center gap-1">
                  <CircleSlash className="h-3.5 w-3.5 text-white/20" />
                  <span className="text-xs font-bold text-white/40">-</span>
                </div>
                <span className="text-[9px] text-white/50 font-medium">Baths</span>
              </div>
            )}

            <div className="flex flex-col items-center justify-center font-sans">
              <div className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5 text-white/40" />
                <span className="text-xs font-bold text-white">{property.details?.area || 'N/A'}</span>
              </div>
              <span className="text-[9px] text-white/50 font-medium">Sq. Ft.</span>
            </div>
          </div>

          {/* Recent Listing Updates widget section */}
          <div className="bg-white/5 border border-white/15 rounded-xl p-3 mb-4 text-xs font-sans" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white/45 mb-1.5 pb-1 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                Recent Listing Updates
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-wider border ${
                property.status === 'PENDING'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  : property.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : property.status === 'REJECTED'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/25'
              }`}>
                {property.status || 'Active'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-white/60">Last modified:</span>
                <span className="font-extrabold text-blue-300 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                  {formatRelativeTime(property.updatedAt || property.createdAt)}
                </span>
              </div>
              
              {property.auditHistory && property.auditHistory.length > 0 ? (
                <>
                  <div className="flex justify-between items-center text-[10px] text-white/55">
                    <span>Audited by:</span>
                    <span className="font-semibold text-white/85">{property.auditHistory[0].changedBy}</span>
                  </div>
                  <div className="text-[10px] text-white/45 italic leading-tight bg-black/30 p-1.5 rounded mt-1 border-l-2 border-blue-500/50">
                    "{property.auditHistory[0].notes || `Property status corrected to ${property.auditHistory[0].toStatus}`}"
                  </div>
                  
                  {/* Collapsible change history log */}
                  {property.auditHistory.length > 1 && (
                    <div className="mt-2 pt-1 border-t border-white/5">
                      <details className="group/details">
                        <summary className="text-[9px] font-bold text-blue-400 uppercase tracking-wider hover:text-white cursor-pointer select-none list-none flex items-center justify-between">
                          <span>📋 Audit timeline history ({property.auditHistory.length})</span>
                          <span className="transition-transform group-open/details:rotate-180">▼</span>
                        </summary>
                        <div className="mt-1.5 space-y-1 max-h-20 overflow-y-auto pr-1">
                          {property.auditHistory.slice(1).map((log, i) => (
                            <div key={log.id || i} className="text-[9px] text-white/40 border-b border-white/5 pb-1 last:border-0 flex justify-between items-center gap-2 font-mono">
                              <span>
                                {log.fromStatus} → {log.toStatus}
                              </span>
                              <span>
                                {formatRelativeTime(log.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between items-center text-[10px] text-white/55">
                  <span>Owner/Publisher:</span>
                  <span className="font-semibold text-white/80">{property.ownerName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card CTA Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto select-none gap-1">
          {onCompareToggle ? (
            <div className="relative group/compare flex items-center">
              <label className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-white/50 hover:text-blue-400 cursor-pointer font-bold uppercase tracking-wider font-mono bg-white/5 rounded-lg border border-white/5">
                <input 
                  type="checkbox"
                  checked={isCompared}
                  onChange={(e) => {
                    e.stopPropagation();
                    onCompareToggle(property.id);
                  }}
                  className="accent-blue-500 rounded cursor-pointer h-3 w-3"
                />
                <span className="hidden xs:inline">Compare</span>
              </label>

              {/* Tooltip on Hover */}
              <div className="absolute bottom-full left-0 mb-2.5 hidden group-hover/compare:flex flex-col w-56 p-3 bg-slate-950 border border-white/10 rounded-xl shadow-2xl text-[10px] font-sans text-white/90 leading-relaxed pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="font-extrabold text-blue-400 text-[11px] mb-0.5 tracking-tight flex items-center gap-1.5">
                  <span className="text-xs select-none">📊</span>
                  <span>Comparison Limit Info</span>
                </div>
                <p className="text-white/60">Compare up to 3 individual listings side-by-side to review spec values.</p>
                <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[9px] flex justify-between items-center text-white/40">
                  <span>Currently selected:</span>
                  <span className={`font-black text-xs px-1.5 py-0.5 rounded ${comparedCount >= 3 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>{comparedCount}/3</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-white/40 font-medium font-sans">
              Visited {property.views || 0} times
            </div>
          )}

          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Quickly preview listing details & contact agent"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Quick View</span>
            </button>

            <button 
              onClick={() => onSelect(property)}
              className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            >
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {showQuickView && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-[#06080c]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-4xl bg-[#0b0e14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-white relative flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/40 border-b border-white/5 flex justify-between items-center sm:px-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg text-xs font-mono font-bold uppercase tracking-wider">
                  ⚠️ QUICK VIEW
                </span>
                <span className="text-[10px] font-mono text-slate-400">ID: {property.id}</span>
              </div>
              <button
                type="button"
                onClick={handleCloseQuickView}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/10 text-white/75 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Images & Core Price/Location */}
                <div className="space-y-4">
                  {/* Compact image carousel */}
                  <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden bg-slate-950 group/qv-carousel border border-white/5">
                    {property.images && property.images.length > 0 ? (
                      <div className="relative w-full h-full">
                        {property.images.map((img, idx) => (
                          <motion.img
                            key={idx}
                            src={img}
                            alt={`${property.title} preview`}
                            referrerPolicy="no-referrer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: idx === quickViewImgIndex ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ zIndex: idx === quickViewImgIndex ? 1 : 0 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/40 font-bold">
                        No Preview Available
                      </div>
                    )}

                    {property.images && property.images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setQuickViewImgIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 hover:bg-black/85 border border-white/10 text-white transition-opacity duration-200 cursor-pointer z-10"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickViewImgIndex((prev) => (prev + 1) % property.images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/60 hover:bg-black/85 border border-white/10 text-white transition-opacity duration-200 cursor-pointer z-10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <div className="absolute bottom-3 right-3 flex gap-1 z-10 bg-black/45 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/5">
                          {property.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setQuickViewImgIndex(idx)}
                              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                idx === quickViewImgIndex ? 'w-3 bg-blue-500' : 'w-1.5 bg-white/50 hover:bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Pricing and basic address info */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2.5">
                      <h3 className="text-xl font-black text-white">{property.title}</h3>
                      <div className="text-right text-lg font-black text-blue-400 whitespace-nowrap font-sans">
                        {formatINR(property.price)}
                        {property.purpose !== 'SELL' && (
                          <span className="text-[10px] text-white/50 font-semibold font-mono">/ mo</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1 font-sans">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span>{property.location?.address || ''}, {property.location?.area || ''}, {property.location?.city || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Specs Grid & Contact Fast Forms */}
                <div className="space-y-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block mb-2.5">Critical Core Specs</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
                        <BedDouble className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-[10px] text-white/40">Bedrooms / Configuration</p>
                          <p className="text-xs font-bold">{property.details?.bedrooms || '-'} BHK</p>
                        </div>
                      </div>

                      <div className="py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
                        <Bath className="h-4 w-4 text-emerald-400" />
                        <div>
                          <p className="text-[10px] text-white/40">Bathrooms</p>
                          <p className="text-xs font-bold">{property.details?.bathrooms || '-'} Baths</p>
                        </div>
                      </div>

                      <div className="py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
                        <Maximize className="h-4 w-4 text-indigo-400" />
                        <div>
                          <p className="text-[10px] text-white/40">Carpet Area</p>
                          <p className="text-xs font-bold">{property.details?.area || '-'} Sq. Ft.</p>
                        </div>
                      </div>

                      <div className="py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
                        <Star className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="text-[10px] text-white/40">Furnishing</p>
                          <p className="text-xs font-bold">{property.details?.furnishingStatus?.replace('_', ' ') || 'Not Specified'}</p>
                        </div>
                      </div>

                      <div className="py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-red-400" />
                        <div>
                          <p className="text-[10px] text-white/40">Facing direction</p>
                          <p className="text-xs font-bold">{property.details?.facingDirection || 'East'}</p>
                        </div>
                      </div>

                      <div className="py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-teal-400" />
                        <div>
                          <p className="text-[10px] text-white/40">Possession</p>
                          <p className="text-xs font-bold">{property.details?.possessionStatus || 'Ready To Move'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Amenities Sub-grid */}
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block mb-2 font-bold">Amenities Available</span>
                      <div className="flex flex-wrap gap-1.5 font-sans">
                        {property.amenities?.parking && <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">🚘 Parking</span>}
                        {property.amenities?.gym && <span className="bg-blue-500/15 border border-blue-500/20 text-blue-400 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">💪 Gym</span>}
                        {property.amenities?.swimmingPool && <span className="bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">🏊 Pool</span>}
                        {property.amenities?.lift && <span className="bg-purple-500/15 border border-purple-500/20 text-purple-400 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">🛗 Lift</span>}
                        {property.amenities?.security24x7 && <span className="bg-teal-500/15 border border-teal-500/20 text-teal-400 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">🛡️ 24x7 Security</span>}
                        {property.amenities?.powerBackup && <span className="bg-amber-500/15 border border-amber-500/20 text-amber-500 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">⚡ Power Backup</span>}
                        {property.amenities?.internet && <span className="bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-md text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">🌐 Wi-Fi</span>}
                      </div>
                    </div>
                  </div>

                  {/* Compact Agent Inquiry form */}
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6.5 w-6.5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white font-sans">
                          {property.ownerName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold leading-none text-white">{property.ownerName}</p>
                          <p className="text-[8.5px] text-white/50 leading-none mt-0.5 uppercase font-mono">{property.ownerType}</p>
                        </div>
                      </div>
                      <span className="text-[8.5px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded px-1.5 py-0.5 uppercase font-mono font-bold tracking-tight animate-pulse">online</span>
                    </div>

                    {sendSuccess ? (
                      <div className="py-4 text-center space-y-2 animate-in zoom-in-95 duration-200">
                        <p className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 font-sans">
                          <Check className="h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" />
                          Inquiry Sent to {property.ownerName}!
                        </p>
                        <p className="text-[10px] text-white/60 leading-normal max-w-xs mx-auto font-sans">
                          Your message has been logged and forwarded securely. They'll reply shortly.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSendSuccess(false)}
                          className="text-[9px] font-mono font-bold text-indigo-400 hover:text-white uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1 rounded-md cursor-pointer"
                        >
                          Send another
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setIsSending(true);
                          setTimeout(() => {
                            setIsSending(false);
                            setSendSuccess(true);
                            confetti({
                              particleCount: 45,
                              spread: 55,
                              origin: { y: 0.8 }
                            });
                          }, 1000);
                        }}
                        className="space-y-1.5"
                      >
                        <div className="grid grid-cols-2 gap-1.5">
                          <input 
                            type="text"
                            required
                            placeholder="Name"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-[10.5px] text-white/95 focus:outline-none focus:border-indigo-500 font-sans"
                          />
                          <input 
                            type="email"
                            required
                            placeholder="Email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-[10.5px] text-white/95 focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                        <textarea
                          rows={2}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/90 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                        />
                        <button
                          type="submit"
                          disabled={isSending}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              <span>Contact Agent & Send Inquiry</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/40 border-t border-white/5 flex justify-end gap-2.5 font-sans">
              <button
                type="button"
                onClick={handleCloseQuickView}
                className="px-4 py-2 border border-white/15 text-slate-400 hover:text-white rounded-lg text-xs hover:bg-white/5 transition-all cursor-pointer font-bold font-mono uppercase tracking-wider"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuickView(false);
                  onSelect(property);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-lg shadow-indigo-600/30"
              >
                View Full Listing Page
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </motion.div>
        </div>,
        document.body
      )}

      {showMapOverlay && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-[#06080c]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowMapOverlay(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0b0e14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-white relative flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/40 border-b border-white/5 flex justify-between items-center sm:px-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {property.title} - Location Map
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMapOverlay(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/10 text-white/75 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Interactive Map */}
            <div className="p-4 bg-slate-950">
              <InteractiveMap property={property} allProperties={[property]} />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0b0e14] border-t border-white/5 flex justify-between items-center sm:px-6 text-xs text-slate-400">
              <span className="font-mono text-[9px] uppercase text-slate-400">📍 LAT: {(property.location?.latitude ?? 19.076).toFixed(4)}N / LNG: {(property.location?.longitude ?? 72.877).toFixed(4)}E</span>
              <button
                type="button"
                onClick={() => setShowMapOverlay(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Close Map
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

    </motion.div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="backdrop-blur-md bg-white/5 shadow-2xl border border-white/10 h-full rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 animate-pulse text-white/20 select-none">
      {/* Property Image Cover Placeholder */}
      <div className="relative h-52 bg-white/10 w-full flex items-center justify-center overflow-hidden">
        <div className="absolute top-3 left-3 bg-white/10 h-6 w-20 rounded-lg"></div>
        <div className="absolute top-3 right-3 bg-white/10 h-8 w-8 rounded-lg"></div>
        <div className="absolute bottom-3 left-3 bg-white/10 h-4 w-32 rounded-lg"></div>
      </div>

      {/* Property Details Content Placeholder */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Price & Rating Row */}
          <div className="flex items-center justify-between">
            <div className="bg-white/10 h-6 w-28 rounded-lg"></div>
            <div className="bg-white/10 h-4 w-12 rounded-lg"></div>
          </div>

          {/* Property Title */}
          <div className="bg-white/10 h-5 w-full rounded-lg"></div>

          {/* Address */}
          <div className="bg-white/5 h-3 w-3/4 rounded-lg"></div>

          {/* Key Specs Row */}
          <div className="grid grid-cols-3 gap-2 py-3 px-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex flex-col items-center gap-1.5">
              <div className="bg-white/10 h-4.5 w-8 rounded"></div>
              <div className="bg-white/5 h-2.5 w-10 rounded"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="bg-white/10 h-4.5 w-8 rounded"></div>
              <div className="bg-white/5 h-2.5 w-10 rounded"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="bg-white/10 h-4.5 w-12 rounded"></div>
              <div className="bg-white/5 h-2.5 w-10 rounded"></div>
            </div>
          </div>
        </div>

        {/* Card CTA Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="bg-white/5 h-6 w-20 rounded-lg"></div>
          <div className="bg-white/10 h-6 w-24 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

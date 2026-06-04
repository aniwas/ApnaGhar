import React, { useState } from 'react';
import { Share2, Copy, Check, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { Property } from '../types';
import { useTranslation } from '../context/TranslationContext';

interface SocialShareProps {
  property: Property;
}

export default function SocialShare({ property }: SocialShareProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Construct property share link
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?property=${property.id}`
    : `https://apnaghar.com/property/${property.id}`;
    
  const shareTitle = `Premium Property on ApnaGhar: ${property.title}`;
  const shareText = `Check out this beautiful ${property.type} located in ${property.location.area}, ${property.location.city} on ApnaGhar. Price: ₹ ${(property.price / 100000).toFixed(1)} Lakhs.`;

  const trackSocialShare = async () => {
    try {
      await fetch(`/api/properties/${property.id}/share`, { method: 'POST' });
    } catch (err) {
      console.warn('Could not record social share event: ', err);
    }
  };

  const handleWebShare = async () => {
    trackSocialShare();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.warn('Web Share was cancelled or failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    trackSocialShare();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' - ' + shareText + ' ' + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  return (
    <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-xl space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-xs font-extrabold text-white font-sans uppercase tracking-wider">{t('share_property')}</h3>
        </div>
        {navigator.share && (
          <button
            type="button"
            onClick={handleWebShare}
            className="text-[9px] bg-blue-500/20 text-blue-300 font-mono font-black uppercase px-2.5 py-1 rounded inline-flex items-center gap-1 hover:bg-blue-500/30 transition-all cursor-pointer"
          >
            📱 Quick System Share
          </button>
        )}
      </div>

      <p className="text-[10px] text-white/50 leading-relaxed font-sans mt-1">
        {t('social_share_desc')}
      </p>

      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* WhatsApp Button */}
        <a
          href={shareLinks.whatsapp}
          onClick={trackSocialShare}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 hover:border-emerald-500/30 transition-all text-center gap-1 group active:scale-95"
        >
          <MessageCircle className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-mono font-extrabold uppercase font-mono">WhatsApp</span>
        </a>

        {/* Twitter Button */}
        <a
          href={shareLinks.twitter}
          onClick={trackSocialShare}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/10 hover:border-sky-500/30 transition-all text-center gap-1 group active:scale-95"
        >
          <Twitter className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-mono font-extrabold uppercase font-mono">Twitter</span>
        </a>

        {/* LinkedIn Button */}
        <a
          href={shareLinks.linkedin}
          onClick={trackSocialShare}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/10 hover:border-blue-500/30 transition-all text-center gap-1 group active:scale-95"
        >
          <Linkedin className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-mono font-extrabold uppercase font-mono">LinkedIn</span>
        </a>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all text-center gap-1 group active:scale-95 border cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-850 hover:bg-slate-800 border-white/5 hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400 animate-bounce" />
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-tight">{t('link_copied')}</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-tight">{t('copy_link')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

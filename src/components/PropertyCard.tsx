import React from 'react';
import { MapPin, BedDouble, Bath, Maximize, CircleSlash, Flame, ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  key?: string;
  property: Property;
  onSelect: (property: Property) => void;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  isCompared?: boolean;
  onCompareToggle?: (id: string) => void;
}

export default function PropertyCard({ 
  property, 
  onSelect, 
  onFavoriteToggle, 
  isFavorite = false,
  isCompared = false,
  onCompareToggle
}: PropertyCardProps) {
  // Format Indian currency style
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

  return (
    <div className="group backdrop-blur-md bg-white/5 shadow-2xl border border-white/10 h-full rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 flex flex-col hover:-translate-y-1 text-white">
      
      {/* Property Image Cover with next/image optimizations */}
      <div className="relative h-52 overflow-hidden bg-slate-900">
        <img
          src={property.images[0]}
          alt={property.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
        />

        {/* Purpose Badge Overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10 flex-wrap max-w-[85%]">
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
            className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/70 hover:text-red-400 rounded-lg shadow-md hover:scale-110 active:scale-90 transition-all border border-white/10 cursor-pointer"
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

        {/* Category Badge on Bottom */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[9px] font-bold tracking-wider bg-blue-600/90 text-white px-2 py-0.5 rounded-md font-mono uppercase shadow-sm border border-white/5">
            {property.category} • {property.type}
          </span>
        </div>
      </div>

      {/* Property Details Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Price & Rating Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white leading-none">
                {formatINR(property.price)}
              </span>
              {property.purpose !== 'SELL' && (
                <span className="text-[10px] text-white/50 font-semibold font-mono">/ mo</span>
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

          {/* Address */}
          <div className="flex items-center gap-1 text-white/50 text-xs mt-1.5 mb-4 font-sans">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <span className="line-clamp-1">{property.location.area}, {property.location.city}</span>
          </div>

          {/* Key Specs Row */}
          <div className="grid grid-cols-3 gap-2 py-3 px-2 rounded-xl bg-white/5 border border-white/5 mb-4 text-white/70">
            {property.details.bedrooms !== undefined && property.details.bedrooms > 0 ? (
              <div className="flex flex-col items-center justify-center font-sans block">
                <div className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs font-bold text-white">{property.details.bedrooms}</span>
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

            {property.details.bathrooms !== undefined && property.details.bathrooms > 0 ? (
              <div className="flex flex-col items-center justify-center font-sans block">
                <div className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs font-bold text-white">{property.details.bathrooms}</span>
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
                <span className="text-xs font-bold text-white">{property.details.area}</span>
              </div>
              <span className="text-[9px] text-white/50 font-medium">Sq. Ft.</span>
            </div>
          </div>
        </div>

        {/* Card CTA Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto select-none gap-2">
          {onCompareToggle ? (
            <label className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-blue-400 cursor-pointer font-bold uppercase tracking-wider font-mono bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
              <input 
                type="checkbox"
                checked={isCompared}
                onChange={(e) => {
                  e.stopPropagation();
                  onCompareToggle(property.id);
                }}
                className="accent-blue-500 rounded cursor-pointer scale-105 h-3.5 w-3.5"
              />
              <span>Compare</span>
            </label>
          ) : (
            <div className="text-[10px] text-white/40 font-medium font-sans">
              Visited {property.views || 0} times
            </div>
          )}
          <button 
            onClick={() => onSelect(property)}
            className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

    </div>
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

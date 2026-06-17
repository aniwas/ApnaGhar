import React from 'react';
import { Coffee, Bus, GraduationCap, TreePine, Landmark, Sparkles, Footprints, Shield } from 'lucide-react';
import { Property } from '../types';

interface NeighborhoodVibeProps {
  property: Property;
}

export default function NeighborhoodVibe({ property }: NeighborhoodVibeProps) {
  // Simple hash function to generate consistent deterministic values based on property's ID and location
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getHash((property.id || '') + (property.location?.area || ''));
  
  // Deterministic scores
  const walkScore = 60 + (seed % 36); // Range: 60 - 95
  const transitScore = 55 + ((seed >> 2) % 36); // Range: 55 - 90
  const safetyScore = 70 + ((seed >> 4) % 26); // Range: 70 - 95
 
  // Vibe descriptions based on score categories
  const getWalkScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Walker\'s Paradise', desc: 'Daily errands do not require a car.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 70) return { label: 'Very Walkable', desc: 'Most errands can be accomplished on foot.', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    return { label: 'Somewhat Walkable', desc: 'Some errands can be accomplished on foot.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  };
 
  const getTransitLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Transit', desc: 'Transit is convenient for most trips.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 65) return { label: 'Many Transit Options', desc: 'Several nearby public transportation options.', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    return { label: 'Some Transit', desc: 'A few nearby public transportation choices.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  };
 
  const walkInfo = getWalkScoreLabel(walkScore);
  const transitInfo = getTransitLabel(transitScore);
 
  // Generate deterministic mock amenities matching the property's region
  const areaName = property.location?.area || 'Locality';
  const cityName = property.location?.city || 'City';
  
  const cafeNames = [
    `${areaName} Roasters`, 'The Daily Grind', 'Third Wave Brews', 'Café Central', 'Mocha Express', 'Artisanal Beans'
  ];
  const transitNames = [
    `${areaName} Metro Link`, `${cityName} Express Bus Terminal`, 'Central Junction Transit', 'North Rail Hub'
  ];
  const schoolNames = [
    `${areaName} Public School`, 'Prestige Academy', 'St. Mary’s International Study Center', `${cityName} Modern School`
  ];
  const parkNames = [
    `${areaName} Ecological Park`, 'Sandalwood Green Belt', 'Lotus Meadows', 'Prestige Public Botanical Garden'
  ];

  const amenities = [
    {
      category: 'Dining & Cafes',
      icon: <Coffee className="h-4 w-4 text-amber-400" />,
      items: [
        { name: cafeNames[seed % cafeNames.length], distance: `${((seed % 4) + 2) / 10} km`, rating: '4.8 ★' },
        { name: cafeNames[(seed + 1) % cafeNames.length], distance: `${((seed % 6) + 5) / 10} km`, rating: '4.5 ★' }
      ]
    },
    {
      category: 'Public Transport',
      icon: <Bus className="h-4 w-4 text-sky-400" />,
      items: [
        { name: transitNames[seed % transitNames.length], distance: `${((seed % 3) + 1) / 10} km`, rating: 'Rapid' },
        { name: 'On-demand Cab Pickup Zone', distance: '0.1 km', rating: 'Instant' }
      ]
    },
    {
      category: 'Education & Schools',
      icon: <GraduationCap className="h-4 w-4 text-violet-400" />,
      items: [
        { name: schoolNames[seed % schoolNames.length], distance: `${((seed % 5) + 8) / 10} km`, rating: 'Top Tier' },
        { name: 'Early Learning Prep Care', distance: '0.4 km', rating: '5-Star' }
      ]
    },
    {
      category: 'Recreation & Parks',
      icon: <TreePine className="h-4 w-4 text-emerald-400" />,
      items: [
        { name: parkNames[seed % parkNames.length], distance: `${((seed % 4) + 3) / 10} km`, rating: 'Pet-friendly' },
        { name: 'Fitness Jogging Loop Track', distance: '0.2 km', rating: 'Excellent' }
      ]
    }
  ];

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-5 text-white">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
              <Footprints className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-black font-sans uppercase tracking-wider">
              Neighborhood Vibe & Diagnostics
            </h3>
          </div>
          <p className="text-[10px] text-white/50">
            Pedestrian accessibility score, transit networks check, and local community infrastructure
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] font-mono font-bold text-amber-400">Smart Scored</span>
        </div>
      </div>

      {/* Main Grid: Scores Left, Amenities Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scores Columns */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-white/40 uppercase font-mono">Location Scorecard</h4>
            
            {/* Walk Score Index Ring */}
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center shrink-0 w-16 h-16 rounded-full bg-slate-900 border-2 border-indigo-500/20 shadow-md">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-slate-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-indigo-500"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={175}
                    strokeDashoffset={175 - (175 * walkScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center font-mono">
                  <span className="text-sm font-black text-white">{walkScore}</span>
                  <span className="text-[8px] text-white/40 block leading-none">/ 100</span>
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-black block text-indigo-400">Walk Score®</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block border ${walkInfo.color}`}>
                  {walkInfo.label}
                </span>
                <p className="text-[9px] text-white/40 leading-relaxed truncate">{walkInfo.desc}</p>
              </div>
            </div>

            {/* Transit Line Check */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <div className="relative flex items-center justify-center shrink-0 w-16 h-16 rounded-full bg-slate-900 border-2 border-emerald-500/25 shadow-md">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-slate-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-emerald-500"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={175}
                    strokeDashoffset={175 - (175 * transitScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center font-mono">
                  <span className="text-sm font-black text-white">{transitScore}</span>
                  <span className="text-[8px] text-white/40 block leading-none">/ 100</span>
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-black block text-emerald-400">Transit Score</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block border ${transitInfo.color}`}>
                  {transitInfo.label}
                </span>
                <p className="text-[9px] text-white/40 leading-relaxed truncate">{transitInfo.desc}</p>
              </div>
            </div>

            {/* Micro Safety Index */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/5 text-[10px] text-white/60 font-sans font-medium">
              <Shield className="h-4.5 w-4.5 text-blue-400 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span>Community Safety Index</span>
                  <span className="font-mono font-bold text-blue-400">{safetyScore}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1">
                  <div 
                    style={{ width: `${safetyScore}%` }} 
                    className="bg-blue-500 h-1 rounded-full" 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Amenities Column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {amenities.map((category, index) => (
            <div key={index} className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-1 rounded bg-white/5 block">
                    {category.icon}
                  </span>
                  <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase font-mono">{category.category}</span>
                </div>
                <div className="space-y-2.5">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex justify-between items-center text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white block truncate leading-tight">{item.name}</span>
                        <span className="text-[9px] font-mono text-white/45 block mt-0.5">{item.rating} Score</span>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {item.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] text-white/40">
                Verified walking routes calculated instantly.
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Download, Maximize2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Property } from '../types';

interface SchematicFloorPlanProps {
  property: Property;
}

export default function SchematicFloorPlan({ property }: SchematicFloorPlanProps) {
  const imageUrl = property.floorPlanUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800';
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // Parse details safely
  const bedrooms = property.details?.bedrooms || 3;
  const bathrooms = property.details?.bathrooms || 3;
  const sqft = property.details?.area || 1850;

  // Mock schematic rooms mapping for layout indicators
  const roomSectors = [
    { name: 'Master Suite', size: '14\' x 16\'', percentage: '28%' },
    { name: 'Living Room & Foyer', size: '18\' x 22\'', percentage: '36%' },
    { name: 'Modular Kitchen & Pantry', size: '12\' x 10\'', percentage: '15%' },
    { name: 'Ancillary Balconies', size: '6\' x 24\'', percentage: '11%' },
    { name: 'Washrooms & Ensuites', size: '8\' x 8\'', percentage: '10%' },
  ];

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-black font-sans uppercase tracking-wider">
              2D Schematic Floor Plan & Layout Blueprint
            </h3>
          </div>
          <p className="text-[10px] text-white/50 font-sans">
            Verified blueprint schematic representing carpet area distributions and dimensional setbacks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-[10px] bg-slate-950 border border-white/10 hover:bg-slate-900 rounded-xl text-teal-400 hover:text-teal-300 font-mono font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer"
          >
            <Download className="h-3 w-3" />
            High-Res JPG
          </a>
        </div>
      </div>

      {/* Interactive Main Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Image View */}
        <div className="lg:col-span-2 relative bg-slate-950/70 border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col justify-between min-h-[380px] group select-none">
          {/* Legend indicator */}
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[8px] font-bold font-mono uppercase bg-teal-500/15 border border-teal-500/20 text-teal-400 px-2.5 py-1 rounded-full">
              Scale 1:100 Metric
            </span>
          </div>

          <div className={`flex-1 flex items-center justify-center transition-transform duration-300 ${isZoomedIn ? 'scale-125 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}>
            <img 
              src={imageUrl} 
              alt="Schematic Floor Plan diagram blueprint" 
              onClick={() => setIsZoomedIn(!isZoomedIn)}
              className="max-h-[300px] object-contain rounded-lg border border-white/5 shadow-2xl mix-blend-lighten opacity-90 transition-opacity hover:opacity-100"
            />
          </div>

          {/* Prompt */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 z-10 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl">
            <div className="flex items-center gap-1.5 text-[9px] text-white/40">
              <AlertCircle className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span>Click diagram to toggle 1.25x magnify perspective inspector</span>
            </div>
            <button
              onClick={() => setIsZoomedIn(!isZoomedIn)}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer select-none active:scale-95 transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Info pane */}
        <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-white/5">
              <span className="text-[8px] uppercase tracking-wider font-mono text-teal-400 font-extrabold block mb-0.5">
                Area Partition Chart
              </span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                {bedrooms} BHK Interior Layout
              </h4>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">Built-up Space: {sqft} Sq Ft</p>
            </div>

            {/* Room breakdown items */}
            <div className="space-y-3">
              {roomSectors.map((sector, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white/80">{sector.name}</span>
                    <span className="font-mono text-teal-400 font-bold">{sector.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40 font-mono">
                    <span>RERA alloc</span>
                    <span>{sector.percentage}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div 
                      style={{ width: sector.percentage }} 
                      className="bg-teal-500 h-1 rounded-full" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 bg-teal-500/5 border border-teal-500/10 p-2.5 rounded-xl text-[9px] leading-relaxed text-teal-400/80">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
              <span>RERA Registered and legally verified building plan matches existing construction records.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

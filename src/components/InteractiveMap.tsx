import React, { useState } from 'react';
import { MapPin, School, Landmark, Bus, Navigation, Flame, RefreshCw } from 'lucide-react';
import { Property } from '../types';

interface InteractiveMapProps {
  property?: Property;
  allProperties?: Property[];
  onSelectProperty?: (property: Property) => void;
}

export default function InteractiveMap({ property, allProperties = [], onSelectProperty }: InteractiveMapProps) {
  const [selectedRadar, setSelectedRadar] = useState<'all' | 'schools' | 'hospitals' | 'transport'>('all');
  const [mapZoom, setMapZoom] = useState<number>(14);

  // Determine center point
  const mapCenter = property 
    ? { name: property.title, area: property.location.area, city: property.location.city, lat: property.location.latitude, lng: property.location.longitude }
    : { name: 'Mumbai Corporate Hub', area: 'Worli', city: 'Mumbai', lat: 18.9986, lng: 72.8152 };

  // Simulated nearby assets based on Lat/Lng hashes to make them realistic
  const radarPoints = [
    { id: 'rad-1', name: 'St. Mary International School', type: 'schools', distance: '0.4 km', lat: mapCenter.lat + 0.003, lng: mapCenter.lng - 0.004, icon: School },
    { id: 'rad-2', name: 'Metro Healthcare Hospital', type: 'hospitals', distance: '1.1 km', lat: mapCenter.lat - 0.005, lng: mapCenter.lng + 0.003, icon: Landmark },
    { id: 'rad-3', name: 'Western Express Junction Metro Station', type: 'transport', distance: '0.8 km', lat: mapCenter.lat + 0.002, lng: mapCenter.lng + 0.006, icon: Bus },
    { id: 'rad-4', name: 'Golden Plaza Retail Mall', type: 'transport', distance: '1.5 km', lat: mapCenter.lat - 0.008, lng: mapCenter.lng - 0.002, icon: Navigation },
    { id: 'rad-5', name: 'Podar Elite Play School', type: 'schools', distance: '0.9 km', lat: mapCenter.lat - 0.003, lng: mapCenter.lng - 0.005, icon: School },
    { id: 'rad-6', name: 'City Dental & Trauma Care', type: 'hospitals', distance: '0.6 km', lat: mapCenter.lat + 0.006, lng: mapCenter.lng + 0.001, icon: Landmark }
  ];

  const filteredRadar = selectedRadar === 'all' 
    ? radarPoints 
    : radarPoints.filter(p => p.type === selectedRadar);

  return (
    <div className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900">
      
      {/* MAP SVG BACKDROP WITH SCENIC URBAN RADAR MOCKUP */}
      <div className="absolute inset-0 bg-slate-950 opacity-90 overflow-hidden">
        
        {/* Draw fake grid lines to simulate clean architectural blueprint maps */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Luminous circular concentric wave borders representing location radar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-emerald-500/10 rounded-full animate-ping [animation-duration:8s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-cyan-500/10 rounded-full animate-ping [animation-duration:12s]"></div>
        
        {/* SVG stylized street lines */}
        <svg className="absolute inset-0 w-full h-full text-slate-800/40" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="0" y1="120" x2="2000" y2="280" strokeWidth="4" />
          <line x1="150" y1="0" x2="350" y2="2000" strokeWidth="4" />
          <line x1="0" y1="450" x2="2000" y2="400" strokeWidth="3" strokeDasharray="5 5" />
          <path d="M 50,0 Q 150,150 400,300 T 1000,400" stroke="rgba(14, 116, 144, 0.4)" strokeWidth="6" />
          <circle cx="150" cy="120" r="140" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
        </svg>

        {/* --- MAP PIN: PROPERTY ROOT CENTER --- */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-12 w-12 rounded-full bg-amber-500/30 animate-pulse"></span>
            <div className="bg-gradient-to-tr from-amber-500 to-orange-600 text-white p-3 rounded-full shadow-2xl shadow-orange-500/50 border border-white/30 cursor-pointer">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
            {mapCenter.name} ({mapCenter.area})
          </div>
        </div>

        {/* --- OTHER PROPERTIES ON THE RADAR (for guest views) --- */}
        {allProperties.filter(p => p.id !== property?.id).slice(0, 4).map((p, idx) => {
          const fakeX = 50 + (idx * 25) + (p.price % 30);
          const fakeY = 40 + (idx * 18) + (p.views % 40);

          return (
            <div 
              key={p.id}
              onClick={() => onSelectProperty?.(p)}
              className="absolute group cursor-pointer z-10 transition-transform hover:scale-110"
              style={{ top: `${fakeY}%`, left: `${fakeX}%` }}
            >
              <div className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-full shadow-lg border border-white/20">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 scale-0 group-hover:scale-100 transition-all bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[10px] font-semibold text-white whitespace-nowrap shadow-2xl">
                {p.title} - <span className="text-emerald-300">₹{(p.price >= 10000000 ? `${(p.price/10000000).toFixed(1)} Cr` : `${(p.price/100000).toFixed(1)} L`)}</span>
              </div>
            </div>
          );
        })}

        {/* --- LOCAL RADAR POINTS OF INTEREST (POI) --- */}
        {filteredRadar.map((poi, idx) => {
          const offsetIdx = (idx * 1.5) % 4;
          const fakeX = 50 + ((poi.lat - mapCenter.lat) * 25000);
          const fakeY = 50 - ((poi.lng - mapCenter.lng) * 25000);

          const PoiIcon = poi.icon;

          return (
            <div 
              key={poi.id}
              className="absolute flex flex-col items-center group z-15"
              style={{ 
                top: `calc(50% + ${Math.max(-140, Math.min(140, fakeY))}px)`, 
                left: `calc(50% + ${Math.max(-180, Math.min(180, fakeX))}px)` 
              }}
            >
              <div className="bg-slate-850 text-cyan-400 backdrop-blur-sm p-1.5 rounded-full border border-cyan-500/40 shadow-md group-hover:text-white group-hover:bg-cyan-500 group-hover:shadow-cyan-400/40 transition-all duration-300">
                <PoiIcon className="h-3.5 w-3.5" />
              </div>
              <div className="absolute -bottom-8 bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10 text-[9px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {poi.name} ({poi.distance})
              </div>
            </div>
          );
        })}
      </div>

      {/* --- FLOATING CONTROLS: GLASS MORPHISM HUD --- */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <h3 className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-bold text-white border border-white/10 shadow-lg flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
          APNAGHAR RADAR MAP
        </h3>
      </div>

      {/* Map filters toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-xl">
        <button
          onClick={() => setSelectedRadar('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${selectedRadar === 'all' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedRadar('schools')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${selectedRadar === 'schools' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
        >
          <School className="h-3 w-3" /> <span className="hidden sm:inline">Schools</span>
        </button>
        <button
          onClick={() => setSelectedRadar('hospitals')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${selectedRadar === 'hospitals' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
        >
          <Landmark className="h-3 w-3" /> <span className="hidden sm:inline">Hospitals</span>
        </button>
        <button
          onClick={() => setSelectedRadar('transport')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${selectedRadar === 'transport' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
        >
          <Bus className="h-3 w-3" /> <span className="hidden sm:inline">Transport</span>
        </button>
      </div>

      {/* Static coordinates readout simulating expert CAD layouts */}
      <div className="absolute top-4 right-4 z-30 font-mono text-[9px] text-slate-500 bg-slate-950/75 px-2 py-1 rounded-lg border border-white/5 pointer-events-none">
        LAT: {mapCenter.lat.toFixed(4)}N / LNG: {mapCenter.lng.toFixed(4)}E
      </div>
    </div>
  );
}

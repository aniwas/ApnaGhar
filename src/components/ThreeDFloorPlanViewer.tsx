import React, { useState } from 'react';
import { Compass, RotateCw, Maximize2, Minimize2, ZoomIn, ZoomOut, Layers, Eye, Sparkles, Layout, Box } from 'lucide-react';
import { Property, PropertyCategory } from '../types';

interface ThreeDFloorPlanViewerProps {
  property: Property;
}

interface RoomHotspot {
  id: string;
  name: string;
  dimensions: string;
  area: number;
  flooring: string;
  features: string[];
  x: number; // percentage from left
  y: number; // percentage from top
  w: number; // percentage width
  h: number; // percentage height
  color: string;
}

export default function ThreeDFloorPlanViewer({ property }: ThreeDFloorPlanViewerProps) {
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [rotation, setRotation] = useState<number>(45); // degrees
  const [tilt, setTilt] = useState<number>(55); // degrees
  const [zoom, setZoom] = useState<number>(1.0);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'G' | '1' | 'T'>('G');
  
  // High-quality backup blueprint in case property lacks floorPlanUrl
  const fallbackFloorPlan = 'https://images.unsplash.com/photo-1545464693-f1798a373343?auto=format&fit=crop&q=80&w=1200';
  const activeFloorPlanUrl = property.floorPlanUrl || fallbackFloorPlan;

  // Generate localized, contextual spaces based on the property category
  const getRoomHotspots = (): RoomHotspot[] => {
    switch (property.category) {
      case 'COMMERCIAL':
        return [
          {
            id: 'comm-reception',
            name: 'Grand Executive Reception & Lobby',
            dimensions: "18' x 16'",
            area: 288,
            flooring: 'Italian Statuario Marble',
            features: ['Double-height glass entrance', 'Granite reception terminal', 'Guest waiting lounge'],
            x: 5, y: 5, w: 25, h: 30,
            color: 'from-blue-500/20 to-cyan-500/10'
          },
          {
            id: 'comm-workspace',
            name: 'Co-Working Main Desk Bay',
            dimensions: "36' x 24'",
            area: 864,
            flooring: 'Acoustic Soundproof Carpet Tiles',
            features: ['36 plug-and-play ports', 'Integrated power tracks', 'Ergonomic partitions'],
            x: 35, y: 5, w: 60, h: 45,
            color: 'from-indigo-500/20 to-purple-500/10'
          },
          {
            id: 'comm-director',
            name: 'Director Corporate Suite',
            dimensions: "16' x 14'",
            area: 224,
            flooring: 'Veneered Hardwood Timber',
            features: ['Private ensuite shower wash', 'Fume-tinted glass partition', 'Secretarial vestibule'],
            x: 5, y: 40, w: 25, h: 35,
            color: 'from-amber-500/20 to-rose-500/10'
          },
          {
            id: 'comm-conference',
            name: 'Smart Conference Boardroom',
            dimensions: "22' x 15'",
            area: 330,
            flooring: 'Acoustic Carpet Lining',
            features: ['4K laser projection matrix', '16-seater mahogany table', 'Ceiling mic arrays'],
            x: 35, y: 55, w: 35, h: 40,
            color: 'from-violet-500/20 to-fuchsia-500/10'
          },
          {
            id: 'comm-cafeteria',
            name: 'Eco Wet Pantry & Meal Station',
            dimensions: "20' x 12'",
            area: 240,
            flooring: 'Anti-skid Epoxy Resin',
            features: ['Double refrigerator cabinets', 'Coffee terminals', 'RO water system'],
            x: 75, y: 55, w: 20, h: 40,
            color: 'from-emerald-500/20 to-teal-500/10'
          }
        ];

      case 'LAND':
        return [
          {
            id: 'land-plot-a',
            name: 'Building Plot Segment A',
            dimensions: "120' x 80'",
            area: 9600,
            flooring: 'Compacted Red Earth Base',
            features: ['Levelled foundation level', 'Direct major-highway link', 'Clear legal setbacks'],
            x: 5, y: 5, w: 40, h: 50,
            color: 'from-yellow-600/15 to-amber-600/10'
          },
          {
            id: 'land-front',
            name: 'Prestige Boulevard Access Link',
            dimensions: "160' x 25'",
            area: 4000,
            flooring: '8-Lane Concrete Arterial',
            features: ['High transit visibility', 'Storm drain concrete pipe', 'Underground power ducts'],
            x: 5, y: 60, w: 90, h: 35,
            color: 'from-zinc-500/20 to-slate-500/10'
          },
          {
            id: 'land-utility',
            name: 'Energy Grid & Substation Block',
            dimensions: "40' x 40'",
            area: 1600,
            flooring: 'High-fire prevention gravel',
            features: ['Independent green power core', '250 KVA heavy backup transformer', 'Rented security room'],
            x: 50, y: 5, w: 45, h: 50,
            color: 'from-red-600/15 to-orange-500/10'
          }
        ];

      case 'RESIDENTIAL':
      default:
        return [
          {
            id: 'room-living',
            name: 'Premium Living Room & Lounge',
            dimensions: "22' x 16'",
            area: 352,
            flooring: 'Greek White Thassos Marble',
            features: ['Full-height french balcony windows', 'Teak wood louvers feature wall', 'Automated ambient dimmers'],
            x: 5, y: 5, w: 40, h: 45,
            color: 'from-blue-500/20 to-cyan-500/10'
          },
          {
            id: 'room-kitchen',
            name: 'Chef Modular Kitchen & dining',
            dimensions: "14' x 12'",
            area: 168,
            flooring: 'Anti-skid Speckled Quartz',
            features: ['Soft-close Blum cabinets', 'Piped PNG gas fitting', 'Granite top cooking island'],
            x: 50, y: 5, w: 45, h: 30,
            color: 'from-amber-500/20 to-orange-500/10'
          },
          {
            id: 'room-master',
            name: 'Grand Owner master Suite',
            dimensions: "18' x 14'",
            area: 252,
            flooring: 'Premium Engineered Walnut Plank',
            features: ['Ensuite five-fixture marble bath', 'Walk-in custom wardrobe', 'North-East mountain views'],
            x: 5, y: 55, w: 45, h: 40,
            color: 'from-indigo-500/20 to-purple-500/10'
          },
          {
            id: 'room-kids',
            name: 'Junior Kids / Guest Bedroom',
            dimensions: "14' x 13'",
            area: 182,
            flooring: 'Vitrified Glazed Premium Tiles',
            features: ['Study alcove study desk', 'Inbuilt sliding wardrobe', 'Concealed smart AC trunking'],
            x: 55, y: 40, w: 40, h: 35,
            color: 'from-pink-500/20 to-fuchsia-500/10'
          },
          {
            id: 'room-balcony',
            name: 'Elevated Garden Deck Balcony',
            dimensions: "24' x 6'",
            area: 144,
            flooring: 'Weatherproof Wood Composite Decking',
            features: ['Toughened glass high railing', 'Drip irrigation vertical garden', 'Dual mood-lighting loops'],
            x: 55, y: 80, w: 40, h: 15,
            color: 'from-emerald-500/20 to-teal-500/10'
          }
        ];
    }
  };

  const spots = getRoomHotspots();
  const currentSelectedRoom = spots.find(s => s.id === activeRoom) || null;

  // Preset Controls
  const rotateLeft = () => setRotation(p => (p - 15 + 360) % 360);
  const rotateRight = () => setRotation(p => (p + 15) % 360);
  const tiltUp = () => setTilt(p => Math.min(75, p + 5));
  const tiltDown = () => setTilt(p => Math.max(20, p - 5));
  const adjustZoomIn = () => setZoom(p => Math.min(1.5, p + 0.1));
  const adjustZoomOut = () => setZoom(p => Math.max(0.7, p - 0.1));

  const inline3dStyle = mode === '3d' ? {
    transform: `perspective(1000px) rotateX(${tilt}deg) rotateZ(${rotation}deg) scale(${zoom})`,
    transformStyle: 'preserve-3d' as const,
  } : {
    transform: `scale(${zoom})`,
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2x space-y-5 text-white">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Compass className="h-4 w-4 animate-spin-slow" />
            </span>
            <h3 className="text-sm font-black font-sans text-white uppercase tracking-wider">
              Interactive 2.5D / 3D Floor Plan CAD Model
            </h3>
          </div>
          <p className="text-[10px] text-white/50">
            Real-time isometric perspective, room boundary overlays, and specs inspection
          </p>
        </div>

        {/* Level Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setSelectedLevel('G')}
              className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${selectedLevel === 'G' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
            >
              G. Floor
            </button>
            <button
              onClick={() => setSelectedLevel('1')}
              className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${selectedLevel === '1' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
            >
              1st Floor
            </button>
            <button
              onClick={() => setSelectedLevel('T')}
              className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${selectedLevel === 'T' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
            >
              Terrace
            </button>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setMode('3d')}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${mode === '3d' ? 'bg-blue-600 text-white shadow' : 'text-white/40 hover:text-white'}`}
              title="Isometric 3D Mode"
            >
              <Box className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMode('2d')}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${mode === '2d' ? 'bg-blue-600 text-white shadow' : 'text-white/40 hover:text-white'}`}
              title="Top-Down 2D Grid"
            >
              <Layout className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Structural Scene Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch min-h-[380px]">
        
        {/* Left 2 Columns: The 3D Interactive Stage Canvas */}
        <div className="lg:col-span-2 relative bg-slate-950/60 rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between p-4 min-h-[340px] select-none group">
          
          {/* Top Info Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400">
              {mode === '3d' ? `3D Isometric View (${rotation}° Rotary, ${tilt}° Tilt)` : '2D Architectural Vector'}
            </span>
            {mode === '3d' && (
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-lg text-[9px] font-mono font-black ${showWireframe ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-white/5 text-white/40 hover:text-white border border-transparent'}`}
              >
                <Layers className="h-3 w-3" />
                {showWireframe ? 'Glass Walls On' : 'Glass Walls Off'}
              </button>
            )}
          </div>

          {/* Perspective viewport rendering window */}
          <div className="flex-1 flex items-center justify-center py-8 overflow-hidden relative">
            
            {/* Ambient grid background and helper lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#2a334d_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
            
            {/* The Stage Wrapper with transition timings */}
            <div 
              style={inline3dStyle}
              className="relative w-80 h-64 bg-slate-900 border-2 border-white/10 rounded-xl transition-all duration-500 ease-out origin-center shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)]"
            >
              {/* Floor Plan base image canvas rendering. Ref: floorPlanUrl */}
              <img 
                src={activeFloorPlanUrl} 
                alt="Floor Plan blueprint context" 
                className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-40 mix-blend-screen pointer-events-none"
              />

              {/* Dynamic room meshes & Hotspots */}
              {spots.map((spot) => {
                const isActive = activeRoom === spot.id;
                
                return (
                  <div
                    key={spot.id}
                    onClick={() => setActiveRoom(isActive ? null : spot.id)}
                    style={{
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      width: `${spot.w}%`,
                      height: `${spot.h}%`,
                      transform: mode === '3d' && showWireframe && isActive ? 'translateZ(18px)' : 'translateZ(0)',
                      transformStyle: 'preserve-3d' as const,
                    }}
                    className={`absolute rounded-lg border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between p-1.5 ${
                      isActive 
                        ? 'bg-indigo-500/35 border-indigo-400 border-2 ring-2 ring-indigo-400/30' 
                        : 'bg-slate-800/20 border-white/10 hover:bg-slate-700/35 hover:border-white/30'
                    }`}
                  >
                    {/* Tiny Extruded Glass Walls simulation in 3D Mode */}
                    {mode === '3d' && showWireframe && (
                      <>
                        {/* West Panel wall */}
                        <div 
                          style={{
                            transform: 'rotateY(90deg) translateZ(0px) rotateX(180deg)',
                            transformOrigin: 'left center',
                          }} 
                          className={`absolute left-0 top-0 h-full w-[16px] border-l border-r pointer-events-none transition-all ${
                            isActive ? 'bg-indigo-300/10 border-indigo-500/30' : 'bg-white/5 border-white/5'
                          }`}
                        />
                        {/* North Panel wall */}
                        <div 
                          style={{
                            transform: 'rotateX(-90deg) translateZ(0px)',
                            transformOrigin: 'center top',
                          }} 
                          className={`absolute left-0 top-0 w-full h-[16px] border-b border-t pointer-events-none transition-all ${
                            isActive ? 'bg-indigo-300/10 border-indigo-500/30' : 'bg-white/5 border-white/5'
                          }`}
                        />
                      </>
                    )}

                    {/* Room title & area metrics */}
                    <div className="flex justify-between items-start pointer-events-none">
                      <span className={`text-[8px] font-black tracking-tighter uppercase leading-none truncate pr-1 ${isActive ? 'text-indigo-200' : 'text-white/70'}`}>
                        {spot.name.split(' ').slice(-2).join(' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pointer-events-none">
                      <span className="text-[7px] font-mono leading-none text-white/40 block">
                        {spot.dimensions}
                      </span>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lower HUD camera widgets */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 z-10 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl">
            {/* Hotspots Quick legend prompt */}
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-[9px] text-white/50">
                Click any room box above to inspect structures & details
              </span>
            </div>

            {/* Orbit / Rotation tools (only available in 3D mode) */}
            <div className="flex items-center gap-1">
              <button
                onClick={adjustZoomOut}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all text-xs"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={adjustZoomIn}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all text-xs"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              {mode === '3d' && (
                <>
                  <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                  <button
                    onClick={rotateLeft}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all text-xs flex items-center gap-0.5"
                    title="Rotate Camera Left"
                  >
                    <RotateCw className="h-3.5 w-3.5 -scale-x-100" />
                  </button>
                  <button
                    onClick={rotateRight}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all text-xs"
                    title="Rotate Camera Right"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={tiltDown}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all text-xs"
                    title="Lower Tilt Target"
                  >
                    <Minimize2 className="h-3.5 w-3.5 rotate-45" />
                  </button>
                  <button
                    onClick={tiltUp}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all text-xs"
                    title="Raise Tilt Target"
                  >
                    <Maximize2 className="h-3.5 w-3.5 rotate-45" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Room inspector and structural specifications Panel */}
        <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          {currentSelectedRoom ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Header card with distinct indicator */}
              <div className="pb-3 border-b border-white/5">
                <span className="text-[8px] uppercase tracking-wider font-mono text-indigo-400 font-extrabold block mb-0.5">
                  ROOM MODEL SEC-803
                </span>
                <h4 className="text-sm font-black text-white leading-tight">
                  {currentSelectedRoom.name}
                </h4>
              </div>

              {/* Dimensions specs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl">
                  <span className="text-[8px] text-white/40 block uppercase font-mono">Boundaries</span>
                  <span className="text-xs font-bold text-white block mt-0.5">{currentSelectedRoom.dimensions}</span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl">
                  <span className="text-[8px] text-white/40 block uppercase font-mono">Covered Size</span>
                  <span className="text-xs font-bold text-emerald-400 block mt-0.5">{currentSelectedRoom.area} Sq Ft</span>
                </div>
              </div>

              {/* Floor composition details */}
              <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl">
                <span className="text-[8px] text-white/40 block uppercase font-mono mb-0.5">Flooring Grade</span>
                <span className="text-xs text-white/80 font-semibold">{currentSelectedRoom.flooring}</span>
              </div>

              {/* Micro specs bullet items */}
              <div className="space-y-2">
                <span className="text-[8px] text-white/40 block uppercase font-mono">Key Architectural Specifications</span>
                <div className="space-y-1.5">
                  {currentSelectedRoom.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-white/70 leading-relaxed font-sans">
                      <span className="h-1 w-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic load simulation summary */}
              <div className="pt-3 border-t border-white/5 text-[9px] text-white/40 font-mono">
                * Dynamic compliance values configured automatically according to RERA ID regulations.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
              <div className="p-3 bg-slate-900 rounded-full border border-white/10 relative text-white/40 animate-pulse">
                <Layout className="h-5 w-5" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 absolute top-2 right-2 animate-ping" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white/80 uppercase">No active room selected</h4>
                <p className="text-[10px] text-white/40 leading-relaxed max-w-xs font-sans">
                  Use the left perspective interactive 3D model canvas to select individual modules and inspect specific rooms' detailed specs.
                </p>
              </div>
            </div>
          )}

          {/* Persistent global catalog details info banner */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-blue-400" />
              <span className="text-[9px] font-mono text-white/50">
                Verified RERA Blueprint
              </span>
            </div>
            <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase">
              ACTIVE SYSTEM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

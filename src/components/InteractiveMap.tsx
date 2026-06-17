import React, { useState, useEffect, useRef } from 'react';
import { MapPin, School, Landmark, Bus, Navigation, Flame, RefreshCw, Compass, ShieldCheck, Locate, TreePine, Sparkles, Filter, AlertCircle, Eye, Layers } from 'lucide-react';
import { Property } from '../types';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface InteractiveMapProps {
  property?: Property;
  allProperties?: Property[];
  onSelectProperty?: (property: Property) => void;
}

// Extract google maps key and validate it
const API_KEY =
  (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim().length > 10;

export default function InteractiveMap({ property, allProperties = [], onSelectProperty }: InteractiveMapProps) {
  // Map interactive view state: 'radar' | '2D' | '3D' | 'streetview'
  const [activeTab, setActiveTab] = useState<'2D' | '3D' | 'streetview' | 'radar'>(
    hasValidKey ? '2D' : 'radar'
  );
  
  const [selectedRadar, setSelectedRadar] = useState<'all' | 'schools' | 'hospitals' | 'transport' | 'parks'>('all');
  const [mapZoom, setMapZoom] = useState<number>(16);

  // States for Geolocation API integration
  const [findNearbyActive, setFindNearbyActive] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Ref container element for mounting Street View Panorama
  const streetViewDivRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<any>(null);

  // Determine center point of the property
  const mapCenter = property 
    ? { name: property.title, area: property.location?.area || '', city: property.location?.city || '', lat: property.location?.latitude || 19.076, lng: property.location?.longitude || 72.877 }
    : { name: 'Mumbai Corporate Hub', area: 'Worli', city: 'Mumbai', lat: 18.9986, lng: 72.8152 };

  // Precise Haversine distance formula to calculate distance in km from property center
  const calculateDistanceInKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const r = 6371; // Earth's radius in km
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return r * c;
  };

  // Generate deterministic points of interest (hospitals, parks, schools, transport)
  const getGeneratedPOIs = () => {
    const rawPOIs = [
      { name: 'Sanjivani Multispeciality Hospital', type: 'hospitals', latOffset: 0.007, lngOffset: -0.005 },
      { name: 'Siddhivinayak Emergency Clinic', type: 'hospitals', latOffset: -0.012, lngOffset: 0.009 },
      { name: 'Jupiter Wellness Center', type: 'hospitals', latOffset: 0.021, lngOffset: -0.019 },
      { name: 'Sandalwood Green Botanical Gardens', type: 'parks', latOffset: 0.004, lngOffset: 0.012 },
      { name: 'Lotus Promenade Public Park', type: 'parks', latOffset: -0.008, lngOffset: -0.011 },
      { name: 'St. Mary\'s International School', type: 'schools', latOffset: 0.003, lngOffset: -0.004 },
      { name: 'Podar Elite Primary Academy', type: 'schools', latOffset: -0.003, lngOffset: -0.005 },
      { name: 'Western Express Metro Hub Terminal', type: 'transport', latOffset: 0.002, lngOffset: 0.006 },
      { name: 'Intercity Central Bus Depo', type: 'transport', latOffset: -0.016, lngOffset: -0.002 },
    ];

    return rawPOIs.map((poi, idx) => {
      const poiLat = mapCenter.lat + poi.latOffset;
      const poiLng = mapCenter.lng + poi.lngOffset;
      const distFromProperty = calculateDistanceInKm(mapCenter.lat, mapCenter.lng, poiLat, poiLng);

      const icons = {
        schools: School,
        hospitals: Landmark,
        transport: Bus,
        parks: TreePine
      };

      return {
        id: `poi-gen-${idx}`,
        name: poi.name,
        type: poi.type as 'schools' | 'hospitals' | 'transport' | 'parks',
        lat: poiLat,
        lng: poiLng,
        distance: distFromProperty,
        icon: icons[poi.type as keyof typeof icons] || Navigation
      };
    });
  };

  const radarPoints = getGeneratedPOIs();

  // Handle User nearby coordinate retrieval
  const handleToggleNearby = () => {
    if (!findNearbyActive) {
      setGeoLoading(true);
      setGeoError(null);
      
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setGeoLoading(false);
            setFindNearbyActive(true);
          },
          (error) => {
            console.warn("Geolocation browser prompt denied or timed out:", error);
            setUserCoords({
              lat: mapCenter.lat + 0.005,
              lng: mapCenter.lng - 0.005
            });
            setGeoLoading(false);
            setGeoError("Using simulated location benchmark.");
            setFindNearbyActive(true);
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      } else {
        setGeoError("Geolocation not supported.");
        setFindNearbyActive(true);
      }
    } else {
      setFindNearbyActive(false);
      setUserCoords(null);
      setGeoError(null);
    }
  };

  const filteredRadar = radarPoints.filter(poi => {
    const matchesCategory = selectedRadar === 'all' || poi.type === selectedRadar;
    const matchesDistance = !findNearbyActive || poi.distance <= 2.0;
    return matchesCategory && matchesDistance;
  });

  const getPixelOffset = (poiLat: number, poiLng: number) => {
    const scaleFactor = 8800; 
    const xOffset = (poiLat - mapCenter.lat) * scaleFactor;
    const yOffset = -(poiLng - mapCenter.lng) * scaleFactor;
    return {
      x: Math.max(-190, Math.min(190, xOffset)),
      y: Math.max(-150, Math.min(150, yOffset))
    };
  };

  // Mount Google Street View panorama when requested and fully authorized
  useEffect(() => {
    if (activeTab === 'streetview' && streetViewDivRef.current && hasValidKey) {
      try {
        // Wait till google maps object is loaded on window
        const initStreetView = () => {
          if (typeof window !== 'undefined' && (window as any).google?.maps) {
            panoramaRef.current = new (window as any).google.maps.StreetViewPanorama(
              streetViewDivRef.current,
              {
                position: { lat: mapCenter.lat, lng: mapCenter.lng },
                pov: { heading: 165, pitch: 10 },
                zoom: 1,
                visible: true,
                addressControl: true,
                linksControl: true,
                panControl: true,
                enableCloseButton: false
              }
            );
          }
        };

        if ((window as any).google?.maps) {
          initStreetView();
        } else {
          // Retry in 800ms if api script isn't resolved yet
          const timer = setTimeout(initStreetView, 800);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error("Error setting up Google Street View:", e);
      }
    }
  }, [activeTab, mapCenter.lat, mapCenter.lng]);

  return (
    <div id="interactive-map-panel" className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-950 flex flex-col justify-between">
      
      {/* 4-WAY SELECTION BAR AT THE TOP OF THE CONTAINER */}
      <div className="absolute top-4 left-4 z-30 flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-lg select-none">
        <button
          onClick={() => {
            setActiveTab('2D');
          }}
          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === '2D' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="h-3 w-3" />
          2D Map
        </button>
        <button
          onClick={() => {
            setActiveTab('3D');
          }}
          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === '3D' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="h-3 w-3" />
          3D Earth
        </button>
        <button
          onClick={() => {
            setActiveTab('streetview');
          }}
          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'streetview' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-[#10b981]/10'
          }`}
        >
          <Eye className="h-3 w-3 animate-pulse" />
          Street View
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'radar' ? 'bg-amber-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="h-3 w-3" />
          Simulated Radar
        </button>
      </div>

      {/* RENDER INLINE INTERACTIVE GOOGLE MAP ACCORDING TO USER STATE */}
      {hasValidKey && (activeTab === '2D' || activeTab === '3D') ? (
        <div style={{ width: '100%', height: '100%' }} className="relative z-10">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              id="APNAGHAR_MAP"
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: mapCenter.lat, lng: mapCenter.lng }}
              defaultZoom={activeTab === '3D' ? 18 : mapZoom}
              heading={activeTab === '3D' ? 45 : 0}
              tilt={activeTab === '3D' ? 45 : 0}
              gestureHandling={'cooperative'}
              style={{ width: '100%', height: '100%' }}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {/* Main property marker */}
              <AdvancedMarker position={{ lat: mapCenter.lat, lng: mapCenter.lng }} title={mapCenter.name}>
                <Pin background="#ea580c" borderColor="#fff" glyphColor="#fff" scale={1.2}>
                  <MapPin className="h-4 w-4 text-white" />
                </Pin>
              </AdvancedMarker>

              {/* Other nearby properties */}
              {allProperties.filter(p => p.id !== property?.id).slice(0, 10).map((p) => (
                <AdvancedMarker 
                  key={p.id} 
                  position={{ lat: p.location?.latitude || 19.076, lng: p.location?.longitude || 72.877 }}
                  onClick={() => onSelectProperty?.(p)}
                >
                  <Pin background="#4f46e5" borderColor="#fff" glyphColor="#fff" scale={0.9} />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        </div>
      ) : hasValidKey && activeTab === 'streetview' ? (
        /* Immersive Google Street View block */
        <div 
          ref={streetViewDivRef} 
          style={{ width: '100%', height: '100%' }} 
          className="relative z-10 bg-slate-900 border-none outline-none" 
        />
      ) : (
        /* SIMULATED BLUEPRINT MAP BACKGROUND (Off-key / Manual select mode fallback) */
        <div className="absolute inset-0 bg-slate-950 opacity-90 overflow-hidden">
          {/* Draw fake grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-emerald-500/10 rounded-full animate-ping [animation-duration:8s]"></div>
          
          <svg className="absolute inset-0 w-full h-full text-slate-800/40" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="0" y1="120" x2="2000" y2="280" strokeWidth="4" />
            <line x1="150" y1="0" x2="350" y2="2000" strokeWidth="4" />
            <path d="M 50,0 Q 150,150 400,300 T 1000,400" stroke="rgba(14, 116, 144, 0.4)" strokeWidth="6" />
          </svg>

          {/* User simulated locator */}
          {userCoords && (
            (() => {
              const offsets = getPixelOffset(userCoords.lat, userCoords.lng);
              return (
                <div 
                  className="absolute flex flex-col items-center z-25"
                  style={{ 
                    left: `calc(50% + ${offsets.x}px)`, 
                    top: `calc(50% + ${offsets.y}px)` 
                  }}
                >
                  <div className="relative">
                    <span className="absolute -inset-2.5 bg-emerald-500/40 rounded-full animate-ping"></span>
                    <div className="bg-emerald-500 text-white p-2 border-2 border-slate-950 rounded-full shadow-lg">
                      <Locate className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-1 bg-emerald-900/95 border border-emerald-500/35 px-1.5 py-0.5 rounded text-[8px] text-emerald-300 font-mono whitespace-nowrap">
                    Simulated GPS
                  </div>
                </div>
              );
            })()
          )}

          {/* Target property marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-12 w-12 rounded-full bg-amber-500/30 animate-pulse"></span>
              <div className="bg-gradient-to-tr from-amber-500 to-orange-600 text-white p-3 rounded-full shadow-2xl border border-white/30">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-2 bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
              {mapCenter.name} ({mapCenter.area})
            </div>
          </div>

          {/* POI pins */}
          {filteredRadar.map((poi) => {
            const offsets = getPixelOffset(poi.lat, poi.lng);
            const PoiIcon = poi.icon;

            return (
              <div 
                key={poi.id}
                className="absolute flex flex-col items-center group z-15"
                style={{ 
                  left: `calc(50% + ${offsets.x}px)`,
                  top: `calc(50% + ${offsets.y}px)`
                }}
              >
                <div className="bg-slate-900 text-cyan-400 p-1.5 rounded-full border border-cyan-500/40 shadow-md">
                  <PoiIcon className="h-3.5 w-3.5" />
                </div>
                <div className="absolute -bottom-7 bg-slate-900/90 px-2 py-0.5 rounded border border-white/10 text-[8.5px] text-slate-300 whitespace-nowrap flex items-center gap-1 shadow">
                  <span>{poi.name}</span>
                  <span className="text-orange-400 font-mono">({poi.distance.toFixed(2)}km)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IF API KEY INSTRUCTIONS SPLASH ACCORDING TO CONSTITUTION MANDATE */}
      {!hasValidKey && (activeTab === '2D' || activeTab === '3D' || activeTab === 'streetview') && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-40 flex flex-col justify-center px-6 text-sm text-slate-200">
          <div className="max-w-md mx-auto space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-amber-500 tracking-widest flex items-center gap-1.5 font-mono">
              <AlertCircle className="h-4 w-4" />
              Google Maps API Key Required
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              To activate real-time 3D Earth terrain elevations, satellite building extrusions, and first-person Street View panoramas, please assign your API secret in AI Studio:
            </p>
            <ol className="text-[10px] space-y-2 text-slate-300 list-decimal pl-4 leading-normal font-sans">
              <li>
                Get a free key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold hover:text-blue-300">Google Maps Platform Console</a>
              </li>
              <li>
                Assign it in AI Studio: Click the <strong>Settings</strong> gear ⚙️ icon at the top right of the editor.
              </li>
              <li>
                Click <strong>Secrets</strong>, type <code>GOOGLE_MAPS_PLATFORM_KEY</code>, and paste your API key value.
              </li>
            </ol>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold uppercase tracking-widest rounded-xl text-[9px] cursor-pointer"
              >
                Back to Offline Radar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD HEADER COMPONENT (Hidden in Streetview to reveal address details) */}
      {activeTab !== 'streetview' && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] font-mono text-slate-400 border border-white/5 whitespace-nowrap">
            LAT: {mapCenter.lat.toFixed(4)}N / LNG: {mapCenter.lng.toFixed(4)}E
          </div>
        </div>
      )}

      {/* RADAR FILTER CONTROLS (Only visible in simulated radar tab) */}
      {activeTab === 'radar' && (
        <>
          <div className="absolute top-4 right-4 z-35 flex flex-col items-end gap-2">
            <button
              onClick={handleToggleNearby}
              disabled={geoLoading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition-all select-none shadow-md ${
                findNearbyActive 
                  ? 'bg-emerald-600 border-emerald-400 text-white' 
                  : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {geoLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  Scanning...
                </>
              ) : (
                <>
                  <Locate className="h-3 w-3 mr-1" />
                  {findNearbyActive ? 'Nearby Filter Active' : 'Scan Location Amenities'}
                </>
              )}
            </button>
            {geoError && findNearbyActive && (
              <span className="text-[8px] text-amber-500 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Benchmark Active
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-35 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl select-none">
            {(['all', 'schools', 'hospitals', 'transport', 'parks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedRadar(tab)}
                className={`px-3 py-1 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                  selectedRadar === tab 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

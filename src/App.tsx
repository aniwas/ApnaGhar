import React, { useState, useEffect } from 'react';
import { 
   Building, Search, ArrowRight, MapPin, Sparkles, Plus, 
   SlidersHorizontal, Check, RefreshCw, Key, HelpCircle, Briefcase, Users, Star, Flame, Award, Heart, Bell
} from 'lucide-react';
import { UserRole, Property, Booking, PropertyCategory, PropertyPurpose } from './types';
import { INDIAN_CITIES } from './data';
import Navbar from './components/Navbar';
import PropertyCard, { PropertyCardSkeleton } from './components/PropertyCard';
import PropertyDetailModal from './components/PropertyDetailModal';
import AddPropertyModal from './components/AddPropertyModal';
import AISmartBroker from './components/AISmartBroker';
import Dashboards from './components/Dashboards';
import ComparePropertiesModal from './components/ComparePropertiesModal';
import InteractiveMap from './components/InteractiveMap';
import AuthModal from './components/AuthModal';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.GUEST);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Authenticated workspace member session state
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: UserRole } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Track the last 5 listings visited
  const [recentlyViewed, setRecentlyViewed] = useState<Property[]>([]);

  // Search & Filter state
  const [searchVal, setSearchVal] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory | 'ALL'>('ALL');
  const [selectedPurpose, setSelectedPurpose] = useState<PropertyPurpose | 'ALL'>('ALL');
  const [selectedBeds, setSelectedBeds] = useState<string>('');
  const [maxPriceLimit, setMaxPriceLimit] = useState<string>('');

  // Modals / Drawer toggles
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isAIBrokerOpen, setIsAIBrokerOpen] = useState(false);

  // Compare properties state
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // View modes
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'map'>('grid');

  // Search alert subscriptions state
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Load user session & recently viewed items on startup
  useEffect(() => {
    // Check local storage for user credentials session
    const rawUser = localStorage.getItem('apnaghar_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        setCurrentUser(u);
        setCurrentRole(u.role);

        // Silent background authorization role sync
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u)
        })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Sync failed');
          })
          .then(synced => {
            if (synced && synced.role) {
              setCurrentUser(synced);
              setCurrentRole(synced.role);
              localStorage.setItem('apnaghar_user', JSON.stringify(synced));
            }
          })
          .catch(err => console.warn('Silent startup user synchronization failed:', err));
      } catch (err) {
        console.error(err);
      }
    }

    // Check custom recently viewed database list
    const rawViewed = localStorage.getItem('ap_recently_viewed');
    if (rawViewed) {
      try {
        setRecentlyViewed(JSON.parse(rawViewed));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Set SEO tags & titles dynamically on current search indexing action
  useEffect(() => {
    if (selectedProperty) {
      document.title = `${selectedProperty.title} | ${selectedProperty.location.city} | ApnaGhar`;
      
      // Update description metadata tag
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', `${selectedProperty.title} located at ${selectedProperty.location.area}, ${selectedProperty.location.city}. Featuring ${selectedProperty.details.area} sqft carpet area. View full pricing, amortised EMI details, and site visits.`);

      // Update Open Graph tag models
      const ogConfigs = [
        { key: 'og:title', val: `${selectedProperty.title} | ApnaGhar Housing` },
        { key: 'og:description', val: `${selectedProperty.description.substring(0, 140)}...` },
        { key: 'og:image', val: selectedProperty.images[0] }
      ];

      ogConfigs.forEach((tagItem) => {
        let tagEl = document.querySelector(`meta[property="${tagItem.key}"]`);
        if (!tagEl) {
          tagEl = document.createElement('meta');
          tagEl.setAttribute('property', tagItem.key);
          document.head.appendChild(tagEl);
        }
        tagEl.setAttribute('content', tagItem.val);
      });
    } else {
      document.title = "ApnaGhar - India's Premier Glassmorphic Housing Platform";

      let descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', "Browse ApnaGhar premium houses, luxury office suites, and flats instantly. Connect with certified brokers via modern AI matchmaking.");
      }
    }
  }, [selectedProperty]);

  // Click tracker for property select state
  const handleSelectProperty = (property: Property | null) => {
    setSelectedProperty(property);
    if (property) {
      setRecentlyViewed(prev => {
        const filtered = prev.filter(p => p.id !== property.id);
        const updated = [property, ...filtered].slice(0, 5);
        localStorage.setItem('ap_recently_viewed', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleAuthSuccess = async (user: { name: string; email: string; role: UserRole }) => {
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (response.ok) {
        const synced = await response.json();
        setCurrentUser(synced);
        setCurrentRole(synced.role);
        localStorage.setItem('apnaghar_user', JSON.stringify(synced));
      } else {
        setCurrentUser(user);
        setCurrentRole(user.role);
        localStorage.setItem('apnaghar_user', JSON.stringify(user));
      }
    } catch (e) {
      console.warn("API role sync failure, fallback to client-side login:", e);
      setCurrentUser(user);
      setCurrentRole(user.role);
      localStorage.setItem('apnaghar_user', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(UserRole.GUEST);
    localStorage.removeItem('apnaghar_user');
  };

  // Idle-detection hook: auto-logout after 30 minutes of inactivity
  useEffect(() => {
    // Only detect idle status if user is signed in
    if (currentRole === UserRole.GUEST || !currentUser) {
      return;
    }

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Track common user interactions
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start timer on component load / session activation
    resetTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser, currentRole]);

  // Load initial dataset from Express Server
  const loadData = async () => {
    setLoading(true);
    try {
      // Build filter URL
      let url = '/api/properties';
      const params: string[] = [];
      if (selectedCity) params.push(`city=${encodeURIComponent(selectedCity)}`);
      if (selectedCategory !== 'ALL') params.push(`category=${selectedCategory}`);
      if (selectedPurpose !== 'ALL') params.push(`purpose=${selectedPurpose}`);
      if (selectedBeds) params.push(`bedrooms=${selectedBeds}`);
      if (maxPriceLimit) params.push(`maxPrice=${maxPriceLimit}`);
      if (searchVal) params.push(`search=${encodeURIComponent(searchVal)}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const resProp = await fetch(url);
      if (resProp.ok) {
        const props = await resProp.json();
        setProperties(props);
      }

      // Load bookings slots
      const resBook = await fetch('/api/bookings');
      if (resBook.ok) {
        const books = await resBook.json();
        setBookings(books);
      }
    } catch (err) {
      console.warn('Backend offline or still building. Using offline fallback states.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCity, selectedCategory, selectedPurpose, selectedBeds, maxPriceLimit, searchVal]);

  // Debounced search logic: updates searchVal 450ms after typing halts
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchVal(searchInput);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Dynamic Suggestion lists matched against listed locations, cities, or property titles
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchInput.toLowerCase().trim();
    const accumMatches: string[] = [];
    properties.forEach((p) => {
      const areaMatch = p.location.area;
      const cityMatch = p.location.city;
      const titleMatch = p.title;

      if (areaMatch.toLowerCase().includes(query) && !accumMatches.includes(areaMatch)) {
        accumMatches.push(areaMatch);
      }
      if (cityMatch.toLowerCase().includes(query) && !accumMatches.includes(cityMatch)) {
        accumMatches.push(cityMatch);
      }
      if (titleMatch.toLowerCase().includes(query) && !accumMatches.includes(titleMatch)) {
        accumMatches.push(titleMatch);
      }
    });
    setSuggestions(accumMatches.slice(0, 6));
  }, [searchInput, properties]);

  // Favorite toggle helper
  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Compare properties toggle
  const handleCompareToggle = (id: string) => {
    setComparedPropertyIds(prev => {
      if (prev.includes(id)) {
        setCompareError(null);
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 3) {
          setCompareError("⚖️ Up to 3 properties can be compared simultaneously!");
          setTimeout(() => setCompareError(null), 4500);
          return prev;
        }
        setCompareError(null);
        return [...prev, id];
      }
    });
  };

  // Create customized search alert subscription
  const handleCreateSearchAlert = async () => {
    try {
      const resp = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'aniwas111@gmail.com',
          city: selectedCity || 'All Cities',
          maxPrice: maxPriceLimit ? Number(maxPriceLimit) : undefined,
          category: selectedCategory === 'ALL' ? undefined : selectedCategory
        })
      });
      if (resp.ok) {
        setAlertSuccessMsg(`🔔 Search alert configured for ${selectedCity || 'All Cities'}! We will notify you of matches.`);
        setTimeout(() => setAlertSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Listings addition callback
  const handleAddPropertySubmit = async (payload: any) => {
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          ownerId: currentRole === UserRole.AGENT ? 'agent-demo' : 'owner-demo',
          ownerName: currentRole === UserRole.AGENT ? 'Rajesh Malhotra (Malhotra Estates)' : 'Nisha Sharma',
          ownerType: currentRole === UserRole.AGENT ? 'AGENT' : 'OWNER'
        })
      });

      if (res.ok) {
        await loadData();
        // Trigger high-performance success celebration confetti
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Property approval status edit
  const handleUpdatePropertyStatus = async (id: string, status: any, moderationNotes?: string) => {
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, moderationNotes })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Booking status update
  const handleUpdateBookingStatus = async (id: string, status: any) => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete matching property
  const handleDeletePropertySubmit = async (id: string) => {
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all filters action
  const handleResetFilters = () => {
    setSearchVal('');
    setSelectedCity('');
    setSelectedCategory('ALL');
    setSelectedPurpose('ALL');
    setSelectedBeds('');
    setMaxPriceLimit('');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white pb-12">
      
      {/* Decorative backdrop blurring blobs (Glassmorphism layout art) */}
      <div className="absolute top-24 left-[-10%] w-[380px] h-[380px] bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full filter blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-[15%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Navigation Headers */}
      <Navbar 
        currentRole={currentRole} 
        onChangeRole={(role) => {
          setCurrentRole(role);
          // If role changed to Dashboard types, reset filters
          handleResetFilters();
        }}
        openAIRecommendedBubble={() => setIsAIBrokerOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        favoritesCount={favorites.length}
      />

      {/* Primary layout focus */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        
        {/* VIEW DETERMINATION LAYER */}
        {currentRole === UserRole.GUEST ? (
          
          // ============================================
          // GUEST MAIN DISCOVERY LANDING VIEW
          // ============================================
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* HERO GLASSMORPHISM SEARCH CARD */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 px-6 py-12 sm:p-16 text-center text-white">
              
              {/* Graphic cover background */}
              <div className="absolute inset-0 bg-cover bg-center opacity-40 brightness-[0.3]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1024')" }}></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.25),transparent)] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>

              <div className="relative max-w-3xl mx-auto space-y-4 z-10">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-blue-400 font-extrabold uppercase bg-blue-500/15 border border-blue-500/30 px-3.5 py-1 rounded-full w-max mx-auto flex items-center gap-1.5 shadow-md">
                  <Sparkles className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
                  India's Premier Glassmorphic Housing Platform
                </span>
                
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none font-sans drop-shadow-sm text-balance">
                  Discover Your Next Dream <span className="text-blue-400">Home</span> with ApnaGhar
                </h2>
                
                <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
                  Browse verified listings, buy luxury penthouses, rent modern tech office suites, calculate mortgage amortization, or use our smart AI Broker recommendations instantly.
                </p>
              </div>

              {/* SEARCH ENGINE HUD PANEL */}
              <div className="relative max-w-4xl mx-auto -mt-6 p-4 sm:p-5 rounded-3xl backdrop-blur-xl bg-slate-900/90 border border-white/10 shadow-2xl flex flex-col gap-3">
                
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-4 gap-0 min-[480px]:gap-2.5 rounded-2xl min-[480px]:rounded-none overflow-hidden border border-white/5 min-[480px]:border-none shadow-md min-[480px]:shadow-none bg-slate-950/40 min-[480px]:bg-transparent p-0.5 min-[480px]:p-0">
                  
                  {/* Select City */}
                  <div className="bg-white/5 rounded-none min-[480px]:rounded-xl px-3.5 py-3 sm:py-2 border-b border-white/5 min-[480px]:border-none flex flex-col text-left transition-all hover:bg-white/10">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider font-mono">Location City</span>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-white focus:outline-none mt-1 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="">All Indian Cities</option>
                      {INDIAN_CITIES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Category */}
                  <div className="bg-white/5 rounded-none min-[480px]:rounded-xl px-3.5 py-3 sm:py-2 border-b border-white/5 min-[480px]:border-none flex flex-col text-left transition-all hover:bg-white/10">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider font-mono">Real Estate Type</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as any)}
                      className="bg-transparent border-none text-xs font-bold text-white focus:outline-none mt-1 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="RESIDENTIAL">Residential (Homes)</option>
                      <option value="COMMERCIAL">Commercial (Offices/Shops)</option>
                      <option value="LAND font-mono">Land Plots</option>
                    </select>
                  </div>

                  {/* Select Purpose */}
                  <div className="bg-white/5 rounded-none min-[480px]:rounded-xl px-3.5 py-3 sm:py-2 border-b border-white/5 min-[480px]:border-none flex flex-col text-left transition-all hover:bg-white/10">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider font-mono">List Purpose</span>
                    <select
                      value={selectedPurpose}
                      onChange={(e) => setSelectedPurpose(e.target.value as any)}
                      className="bg-transparent border-none text-xs font-bold text-white focus:outline-none mt-1 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="ALL">All Purposes</option>
                      <option value="SELL">Buying (SELL)</option>
                      <option value="RENT">Rent / Leasing</option>
                    </select>
                  </div>

                  {/* Input search keyword with debounced logic and auto-suggests */}
                  <div className="bg-white/5 rounded-none min-[480px]:rounded-xl px-3.5 py-3 sm:py-2 border-none flex flex-col text-left relative transition-all hover:bg-white/10">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider font-mono">Search Keyword</span>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => {
                          setSearchInput(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="e.g. Sea view, Villa..."
                        className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                      />
                      <Search className="h-4 w-4 text-blue-400 shrink-0" />
                    </div>

                    {/* Auto-suggest dropdown matches */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-[102%] left-0 right-0 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-white/5 max-h-48 overflow-y-auto">
                        {suggestions.map((item, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSearchInput(item);
                              setSearchVal(item);
                              setShowSuggestions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-white hover:bg-slate-800 transition-colors flex items-center justify-between font-sans shrink-0 cursor-pointer"
                          >
                            <span className="truncate pr-2">{item}</span>
                            <span className="text-[8px] font-mono font-bold bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded uppercase">suggest</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Additional advanced sub-filters row */}
                <div className="flex flex-wrap sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wide">Quick Limiters:</span>
                    
                    <select
                      value={selectedBeds}
                      onChange={(e) => setSelectedBeds(e.target.value)}
                      className="bg-slate-950/60 border border-white/10 text-[10.5px] font-semibold text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="">All Bedrooms (BHK)</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4 BHK</option>
                    </select>

                    <select
                      value={maxPriceLimit}
                      onChange={(e) => setMaxPriceLimit(e.target.value)}
                      className="bg-slate-950/60 border border-white/10 text-[10.5px] font-semibold text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="">Any Maximum Price</option>
                      <option value="100000">Below ₹1 LakhRent</option>
                      <option value="10000000">Below ₹1 CroreBuy</option>
                      <option value="60000000">Below ₹6 Crore</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetFilters}
                      className="text-[10px] font-bold uppercase font-mono tracking-wider text-slate-400 hover:text-blue-400 transition-colors bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-blue-500/10 cursor-pointer"
                    >
                      Clear Filters
                    </button>

                    <button
                      onClick={handleCreateSearchAlert}
                      className="text-[10px] font-bold uppercase font-mono tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 cursor-pointer flex items-center gap-1"
                    >
                      <Bell className="h-3 w-3" /> Save Search Alert
                    </button>
                  </div>
                </div>

                {alertSuccessMsg && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/35 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                    <Check className="h-4 w-4" strokeWidth={3} />
                    <span>{alertSuccessMsg}</span>
                  </div>
                )}

              </div>
            </div>

            {/* PLATFORM STATISTICS MARGIN TRACKER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 select-none">
              {[
                { count: '₹1450 Crore+', tag: 'Cumulative Sales', sub: 'Completed transaction values' },
                { count: '1,800+ Active', tag: 'Verified Listings', sub: 'Daily verified inventory additions' },
                { count: '99.8%', tag: 'Satisfaction Rating', sub: 'Top-tier reviews and responses' },
                { count: '48 Cities', tag: 'Pan-India Coverage', sub: 'In prime metropolitan layouts' }
              ].map((item, idx) => (
                <div key={idx} className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl text-white">
                  <span className="text-xl font-extrabold block text-white leading-none font-display">{item.count}</span>
                  <span className="text-xs font-bold text-blue-400 mt-2 block uppercase tracking-wider">{item.tag}</span>
                  <span className="text-[10px] text-white/50 mt-1 block leading-relaxed">{item.sub}</span>
                </div>
              ))}
            </div>

            {/* RECENTLY VIEWED HISTORICAL COMPONENT */}
            {recentlyViewed.length > 0 && (
              <div className="space-y-3.5 bg-slate-900/40 p-5 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">Recently Viewed Properties</h4>
                    <p className="text-[10px] text-white/40 mt-0.5 font-sans">Quickly return to property details you explored earlier during this session</p>
                  </div>
                  <button 
                    onClick={() => {
                      setRecentlyViewed([]);
                      localStorage.removeItem('ap_recently_viewed');
                    }}
                    className="text-[10px] uppercase font-mono font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Clear Search History
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {recentlyViewed.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleSelectProperty(p)}
                      className="min-w-[280px] sm:min-w-[320px] bg-slate-950/80 hover:bg-slate-950 p-3 rounded-2xl border border-white/10 hover:border-blue-500/20 transition-all cursor-pointer flex gap-3 snap-start relative group shadow-md"
                    >
                      <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{p.title}</h5>
                          <p className="text-[10px] text-white/50">{p.location.area}, {p.location.city}</p>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs font-extrabold text-blue-400">
                            {p.purpose === 'SELL' ? 'Buy' : 'Rent'} {p.price >= 10000000 ? `₹${(p.price / 10000000).toFixed(1)} Cr` : `₹${(p.price / 100000).toFixed(1)} Lakh`}
                          </span>
                          <span className="text-[9px] font-mono text-white/44">{p.details.bedrooms} BHK • {p.details.area} sqft</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN PORTFOLIO FILTERED GRID */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white font-sans tracking-tight">
                    Explore Premium Available Properties
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">Found {properties.length} live matching listings cataloged</p>
                </div>
                
                {/* View switcher & AI matchmaker */}
                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 p-1 rounded-xl border border-white/10 flex items-center">
                    <button
                      onClick={() => setActiveViewMode('grid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeViewMode === 'grid' ? 'bg-blue-500 text-white shadow' : 'text-white/60 hover:text-white'}`}
                    >
                      📋 Grid
                    </button>
                    <button
                      onClick={() => setActiveViewMode('map')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeViewMode === 'map' ? 'bg-blue-500 text-white shadow' : 'text-white/60 hover:text-white'}`}
                    >
                      🗺️ Map Pinboard
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAIBrokerOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-blue-500/30 bg-blue-950/40 font-bold hover:bg-blue-500/25 text-blue-400 text-xs flex items-center gap-1.5 transition-all shadow shadow-blue-500/10 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                    Intelligent AI Matchmaker
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-900 border border-white/10 shadow">
                  <p className="text-xs text-slate-400 italic">No properties matching your filtering criteria found inside our current inventory. Please tap "Clear Filters" on top to discover others!</p>
                </div>
              ) : activeViewMode === 'map' ? (
                <div className="rounded-3xl overflow-hidden border border-white/10 shadow bg-slate-900 p-2">
                  <div className="p-4 bg-slate-950/40 rounded-t-2xl border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">interactive map search results pins</span>
                    <span className="text-xs text-slate-400">Click any pin location or nearby point to check structural listings details</span>
                  </div>
                  <InteractiveMap 
                    allProperties={properties} 
                    onSelectProperty={(p) => handleSelectProperty(p)} 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {properties.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onSelect={(prop) => handleSelectProperty(prop)}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorite={favorites.includes(p.id)}
                      isCompared={comparedPropertyIds.includes(p.id)}
                      onCompareToggle={handleCompareToggle}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

        ) : (
          
          // ============================================
          // PERSONALIZED DASHBOARD PANELS (OWNER, BUYER, TENANT, ADMIN, AGENT)
          // ============================================
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header notification inside dashboard workspace */}
            <div className="backdrop-blur-xl bg-slate-950 text-white rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-blue-400 font-bold uppercase bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                    Secure Dashboard Sandbox
                  </span>
                  <h2 className="text-lg font-black font-sans text-white mt-1.5">
                    Welcome Back, {currentUser ? currentUser.name : 'Aniwas111'}!
                  </h2>
                  <p className="text-[11px] text-white/60 leading-normal mt-0.5">
                    Managing ApnaGhar listings, lease records, schedule site-visits, and tracking real-time CRM leads dynamically as a qualified {currentRole.toLowerCase()}.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddPropertyOpen(true)}
                  className="px-4.5 py-2 hover:opacity-90 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1 shrink-0 border border-white/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Property Listing
                </button>
              </div>
            </div>

            {/* Standard Dashboards view selector */}
            <Dashboards
              role={currentRole}
              properties={properties}
              bookings={bookings}
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
              onUpdatePropertyStatus={handleUpdatePropertyStatus}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteProperty={handleDeletePropertySubmit}
              onSelectProperty={(p) => handleSelectProperty(p)}
              onOpenAddProperty={() => setIsAddPropertyOpen(true)}
            />

          </div>
        )}

      </main>

      {/* --- FLOATING AI ASSISTANT DISPATCHER TRIGGER (Bottom right layout) --- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        
        {/* Animated Speech tooltip helper */}
        {!isAIBrokerOpen && (
          <div className="bg-slate-950 border border-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-[11px] font-bold text-white shadow-xl max-w-56 leading-relaxed text-right animate-bounce">
            Analyze inventory instantly! ✨
            <button
              onClick={() => setIsAIBrokerOpen(true)}
              className="text-blue-400 font-extrabold flex items-center gap-0.5 justify-end mt-1 cursor-pointer"
            >
              Ask AI Broker <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={() => setIsAIBrokerOpen(!isAIBrokerOpen)}
          className="p-4 bg-slate-950 hover:bg-slate-900 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl border border-white/15 transition-all text-center flex items-center justify-center animate-pulse cursor-pointer shadow-blue-500/20"
        >
          <Sparkles className="h-6.5 w-6.5 text-blue-400" />
        </button>
      </div>

      {/* ============================================ */}
      {/* GLOBAL DISPLACEMENT COMPONENTS (OVERLAYS) */}
      {/* ============================================ */}

      {/* 1. Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => handleSelectProperty(null)}
          userId={currentUser ? currentUser.email : "buyer-demo"}
          userName={currentUser ? currentUser.name : "Anil Vasudevan"}
          onSelectProperty={(p) => {
            handleSelectProperty(p);
          }}
        />
      )}

      {/* 2. Add New Listing Form Entry Modal */}
      <AddPropertyModal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        onSubmit={handleAddPropertySubmit}
      />

      {/* 3. Sliding AI Broker Recommendation Chat Drawer */}
      <AISmartBroker
        isOpen={isAIBrokerOpen}
        onClose={() => setIsAIBrokerOpen(false)}
        onSelectProperty={(p) => {
          handleSelectProperty(p);
          setIsAIBrokerOpen(false);
        }}
        properties={properties}
      />

      {/* 4. Compare Properties Modal Symmetrical Alignment */}
      {isCompareModalOpen && (
        <ComparePropertiesModal
          propertyIds={comparedPropertyIds}
          allProperties={properties}
          onClose={() => setIsCompareModalOpen(false)}
          onRemove={(id) => setComparedPropertyIds(prev => prev.filter(x => x !== id))}
          onSelectProperty={(p) => handleSelectProperty(p)}
        />
      )}

      {/* 5. Custom Member Registration and Login AuthModal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Symmetrical Comparing floating sticky bar */}
      {comparedPropertyIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 border border-white/10 px-5 py-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center gap-3.5 text-white animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-sans">⚖️ Match & Compare:</span>
            <span className="bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded text-blue-400 text-[10px] font-mono font-black">
              {comparedPropertyIds.length} / 3 Items Selected
            </span>
            {compareError && (
              <span className="text-[10px] text-amber-400 font-sans font-bold">
                {compareError}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-black text-white transition-opacity cursor-pointer shadow"
            >
              Compare Symmetrical Matrix
            </button>
            <button
              onClick={() => setComparedPropertyIds([])}
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

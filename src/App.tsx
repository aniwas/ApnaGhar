import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
   Building, Search, ArrowRight, MapPin, Sparkles, Plus, 
   SlidersHorizontal, Check, RefreshCw, Key, HelpCircle, Briefcase, Users, Star, Flame, Award, Heart, Bell, X, Filter
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
import PromoSlider from './components/PromoSlider';
import InteractiveMap from './components/InteractiveMap';
import AuthModal from './components/AuthModal';
import FavoritesDrawer from './components/FavoritesDrawer';
import NotificationsModal from './components/NotificationsModal';
import confetti from 'canvas-confetti';
import RouteGuard from './components/RouteGuard';
import { safeStorage } from './services/safeStorage';

export default function App() {
  const [activeAdminPerspective, setActiveAdminPerspective] = useState<UserRole | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Authenticated workspace member session state
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: UserRole } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Strictly derived currentRole - ensures backend-validated role is synchronized at all times
  const currentRole = currentUser 
    ? (currentUser.role === UserRole.ADMIN && activeAdminPerspective ? activeAdminPerspective : currentUser.role)
    : UserRole.GUEST;

  // Public search matches: only APPROVED, SOLD, or RENTED properties can show up in public searches / home views.
  // Also include any properties that were added locally in this browser session (even if pending) so the owner can view and inspect them perfectly!
  const approvedProperties = properties.filter(p => {
    if (p.status === 'APPROVED' || p.status === 'SOLD' || p.status === 'RENTED') {
      return true;
    }
    try {
      const rawStored = safeStorage.getItem('apna_added_properties');
      if (rawStored) {
        const cached = JSON.parse(rawStored);
        if (Array.isArray(cached) && cached.some((cp: any) => cp.id === p.id)) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });

  // Inactivity timeout state parameters
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState(60);

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
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isAIBrokerOpen, setIsAIBrokerOpen] = useState(false);
  const [isFavoritesDrawerOpen, setIsFavoritesDrawerOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Compare properties state
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // View modes
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'map'>('grid');

  // Search alert subscriptions state
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // RoleGuard: Ensures role matches allowed non-admin roles unless from authorized admin email or domain
  const guardUserRole = (email: string, role: UserRole): UserRole => {
    const normalizedEmail = (email || '').toLowerCase();
    const isAdminAuthorized = normalizedEmail.endsWith('@apnaghar.com') || normalizedEmail === 'aniwas111@gmail.com';
    
    if (role === UserRole.ADMIN && !isAdminAuthorized) {
      console.warn(`RoleGuard: Tamper prevention. Denied admin access for ${email}. Deflected to BUYER role.`);
      return UserRole.BUYER;
    }
    return role;
  };

  // Load user session & recently viewed items on startup
  useEffect(() => {
    // Check local storage for user credentials session
    const rawUser = safeStorage.getItem('apnaghar_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        const guardedRole = guardUserRole(u.email, u.role);
        const guardedUser = { ...u, role: guardedRole };
        setCurrentUser(guardedUser);

        // Silent background authorization role sync
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guardedUser)
        })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Sync failed');
          })
          .then(synced => {
            if (synced && synced.role) {
              const serverGuardedRole = guardUserRole(synced.email, synced.role);
              const serverGuardedUser = { ...synced, role: serverGuardedRole };
              setCurrentUser(serverGuardedUser);
              safeStorage.setItem('apnaghar_user', JSON.stringify(serverGuardedUser));
            }
          })
          .catch(err => console.warn('Silent startup user synchronization failed:', err));
      } catch (err) {
        console.error(err);
      }
    }

    // Check custom recently viewed database list
    const rawViewed = safeStorage.getItem('ap_recently_viewed');
    if (rawViewed) {
      try {
        setRecentlyViewed(JSON.parse(rawViewed));
      } catch (err) {
        console.error(err);
      }
    }

    // Check custom favorites database list
    const rawFavs = safeStorage.getItem('ap_favorites');
    if (rawFavs) {
      try {
        setFavorites(JSON.parse(rawFavs));
      } catch (err) {
        console.error('Failed to parse favorites on startup:', err);
      }
    }
  }, []);

  // Sync favorites state changes to local storage for premium session persistence
  useEffect(() => {
    safeStorage.setItem('ap_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch notifications in real-time
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const queryParam = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : '';
        const res = await fetch(`/api/notifications${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data || []);
        }
      } catch (err) {
        console.warn('Failed to fetch notifications in global app state:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // 12s interval
    return () => clearInterval(interval);
  }, [currentUser]);

  // Set SEO tags & titles dynamically on current search indexing action
  useEffect(() => {
    if (selectedProperty) {
      const pTitle = selectedProperty.title || 'Property';
      const pCity = selectedProperty.location?.city || '';
      const pArea = selectedProperty.location?.area || '';
      const pAreaSqft = selectedProperty.details?.area || 'N/A';
      const pDesc = selectedProperty.description || '';
      const pImage = (selectedProperty.images && selectedProperty.images.length > 0) ? selectedProperty.images[0] : '';

      document.title = `${pTitle} | ${pCity} | ApnaGhar`;
      
      // Update description metadata tag
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', `${pTitle} located at ${pArea}, ${pCity}. Featuring ${pAreaSqft} sqft carpet area. View full pricing, amortised EMI details, and site visits.`);

      // Update Open Graph tag models
      const ogConfigs = [
        { key: 'og:title', val: `${pTitle} | ApnaGhar Housing` },
        { key: 'og:description', val: `${pDesc.substring(0, 140)}...` },
        { key: 'og:image', val: pImage }
      ];

      ogConfigs.forEach((tagItem) => {
        let tagEl = document.querySelector(`meta[property="${tagItem.key}"]`);
        if (!tagEl) {
          tagEl = document.createElement('meta');
          tagEl.setAttribute('property', tagItem.key);
          document.head.appendChild(tagEl);
        }
        tagEl.setAttribute('content', tagItem.val || '');
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
        safeStorage.setItem('ap_recently_viewed', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleAuthSuccess = async (user: { name: string; email: string; role: UserRole }) => {
    const clientGuardedRole = guardUserRole(user.email, user.role);
    const clientGuardedUser = { ...user, role: clientGuardedRole };

    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientGuardedUser)
      });
      if (response.ok) {
        const synced = await response.json();
        const serverGuardedRole = guardUserRole(synced.email, synced.role);
        const serverGuardedUser = { ...synced, role: serverGuardedRole };
        setCurrentUser(serverGuardedUser);
        safeStorage.setItem('apnaghar_user', JSON.stringify(serverGuardedUser));
      } else {
        setCurrentUser(clientGuardedUser);
        safeStorage.setItem('apnaghar_user', JSON.stringify(clientGuardedUser));
      }
    } catch (e) {
      console.warn("API role sync failure, fallback to client-side login:", e);
      setCurrentUser(clientGuardedUser);
      safeStorage.setItem('apnaghar_user', JSON.stringify(clientGuardedUser));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveAdminPerspective(null);
    safeStorage.removeItem('apnaghar_user');
  };

  const logSecurityWarning = (targetRole: UserRole, message: string) => {
    fetch('/api/logs/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser?.email || 'GUEST',
        role: currentUser?.role || 'GUEST',
        targetRole,
        message
      })
    }).catch(err => console.warn('Failed to dispatch security warning log:', err));
  };

  // Idle-detection hook: auto-logout after 30 minutes of inactivity
  useEffect(() => {
    // Only detect idle status if user is signed in
    if (currentRole === UserRole.GUEST || !currentUser) {
      return;
    }

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIME = 60 * 1000; // 60 seconds
    const INITIAL_ALARM_TIME = INACTIVITY_TIMEOUT - WARNING_TIME;

    let warnTimeoutId: any;
    let logoutTimeoutId: any;
    let countdownIntervalId: any;

    const startTimers = () => {
      if (warnTimeoutId) clearTimeout(warnTimeoutId);
      if (logoutTimeoutId) clearTimeout(logoutTimeoutId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);

      setShowIdleWarning(false);

      warnTimeoutId = setTimeout(() => {
        setShowIdleWarning(true);
        setIdleSecondsRemaining(60);

        let seconds = 60;
        countdownIntervalId = setInterval(() => {
          seconds -= 1;
          setIdleSecondsRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
      }, INITIAL_ALARM_TIME);

      logoutTimeoutId = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const resetTimer = () => {
      if (showIdleWarning) {
        return;
      }
      startTimers();
    };

    // Track common user interactions
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start timer on component load / session activation
    resetTimer();

    return () => {
      if (warnTimeoutId) clearTimeout(warnTimeoutId);
      if (logoutTimeoutId) clearTimeout(logoutTimeoutId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);
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

      // If the current role is authorized to moderate or manage listings, bypass default public status filters.
      if (currentRole === UserRole.ADMIN || currentRole === UserRole.AGENT || currentRole === UserRole.OWNER) {
        params.push('all=true');
      }

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      // 1. Fetch current listings from server
      const resProp = await fetch(url, {
        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentRole || ''
        }
      });
      
      let props = [];
      if (resProp.ok) {
        props = await resProp.json();
      }

      // 2. Perform background local cache reconciliation with server to recover from container wipe/restarts
      try {
        const rawStored = safeStorage.getItem('apna_added_properties');
        const cachedProps = rawStored ? JSON.parse(rawStored) : [];
        if (Array.isArray(cachedProps) && cachedProps.length > 0) {
          // Fetch ALL server properties (including pending ones) to compare accurately
          const allServerPropsRes = await fetch('/api/properties?all=true', {
            headers: {
              'x-user-email': currentUser?.email || '',
              'x-user-role': currentRole || ''
            }
          });
          if (allServerPropsRes.ok) {
            const allServerProps = await allServerPropsRes.json();
            const serverIds = new Set(allServerProps.map((p: any) => p.id));
            
            // Find any locally added properties that exist in localStorage but not on server
            const missingInServer = cachedProps.filter((cp: any) => !serverIds.has(cp.id));
            
            if (missingInServer.length > 0) {
              console.log(`[Backup Sync] Restoring ${missingInServer.length} missing user listings back to the Express database...`);
              for (const missingProp of missingInServer) {
                await fetch('/api/properties', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUser?.email || '',
                    'x-user-role': currentRole || ''
                  },
                  body: JSON.stringify({
                    ...missingProp,
                    userEmail: currentUser?.email || '',
                    userRole: currentRole || ''
                  })
                });
              }
              // Re-fetch the filtered list now that data is restored
              const refreshedResProp = await fetch(url, {
                headers: {
                  'x-user-email': currentUser?.email || '',
                  'x-user-role': currentRole || ''
                }
              });
              if (refreshedResProp.ok) {
                props = await refreshedResProp.json();
              }
            } else {
              // Sync status / info updates from server back to local cache
              let cacheChanged = false;
              const updatedCache = cachedProps.map((cp: any) => {
                const freshSer = allServerProps.find((sp: any) => sp.id === cp.id);
                if (freshSer && (freshSer.status !== cp.status || freshSer.title !== cp.title || freshSer.price !== cp.price)) {
                  cacheChanged = true;
                  return { ...cp, ...freshSer };
                }
                return cp;
              });
              if (cacheChanged) {
                safeStorage.setItem('apna_added_properties', JSON.stringify(updatedCache));
              }
            }
          }
        }
      } catch (cacheErr) {
        console.error("Local caching / reconciliation failed:", cacheErr);
      }

      // Merge user locally added properties from localStorage so they are available in state
      try {
        const rawStored = safeStorage.getItem('apna_added_properties');
        const cachedProps = rawStored ? JSON.parse(rawStored) : [];
        if (Array.isArray(cachedProps) && cachedProps.length > 0) {
          const propIds = new Set(props.map((p: any) => p.id));
          const uniqueUserProps = cachedProps.filter((cp: any) => !propIds.has(cp.id));
          props = [...uniqueUserProps, ...props];
        }
      } catch (e) {
        console.warn("Merging custom added properties failed:", e);
      }

      setProperties(props);

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
  }, [selectedCity, selectedCategory, selectedPurpose, selectedBeds, maxPriceLimit, searchVal, currentRole]);

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
      const areaMatch = p.location?.area || '';
      const cityMatch = p.location?.city || '';
      const titleMatch = p.title || '';

      if (areaMatch && areaMatch.toLowerCase().includes(query) && !accumMatches.includes(areaMatch)) {
        accumMatches.push(areaMatch);
      }
      if (cityMatch && cityMatch.toLowerCase().includes(query) && !accumMatches.includes(cityMatch)) {
        accumMatches.push(cityMatch);
      }
      if (titleMatch && titleMatch.toLowerCase().includes(query) && !accumMatches.includes(titleMatch)) {
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

  // Listings addition or update callback
  const handleAddPropertySubmit = async (payload: any) => {
    try {
      const isEditing = Boolean(propertyToEdit);
      const url = isEditing ? `/api/properties/${propertyToEdit!.id}` : '/api/properties';
      const method = isEditing ? 'PUT' : 'POST';
      
      const bodyPayload = isEditing ? {
        ...propertyToEdit,
        ...payload
      } : {
        ...payload,
        ownerId: currentRole === UserRole.AGENT ? 'agent-demo' : (currentRole === UserRole.ADMIN ? 'admin-system' : 'owner-demo'),
        ownerName: currentRole === UserRole.AGENT ? 'Rajesh Malhotra (Malhotra Estates)' : (currentRole === UserRole.ADMIN ? 'System Administrator' : 'Nisha Sharma'),
        ownerType: currentRole === UserRole.AGENT ? 'AGENT' : (currentRole === UserRole.ADMIN ? 'ADMIN' : 'OWNER')
      };

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentRole || ''
        },
        body: JSON.stringify({
          ...bodyPayload,
          userEmail: currentUser?.email || '',
          userRole: currentRole || ''
        })
      });

      if (res.ok) {
        const savedProp = await res.json().catch(() => null);
        if (savedProp && savedProp.id) {
          try {
            const rawStored = safeStorage.getItem('apna_added_properties');
            let stored = rawStored ? JSON.parse(rawStored) : [];
            if (!Array.isArray(stored)) stored = [];
            
            if (method === 'POST') {
              stored.unshift(savedProp);
            } else if (method === 'PUT') {
              stored = stored.map((p: any) => p.id === savedProp.id ? savedProp : p);
            }
            safeStorage.setItem('apna_added_properties', JSON.stringify(stored));
          } catch (e) {
            console.warn("Storage write failure:", e);
          }
        }

        await loadData();
        // Trigger high-performance success celebration confetti
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
        });
        setIsAddPropertyOpen(false);
        setPropertyToEdit(null);
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
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentRole || ''
        },
        body: JSON.stringify({ 
          status, 
          moderationNotes,
          userEmail: currentUser?.email || '',
          userRole: currentRole || ''
        })
      });
      if (res.ok) {
        const updatedProp = await res.json().catch(() => null);
        if (updatedProp && updatedProp.id) {
          try {
            const rawStored = safeStorage.getItem('apna_added_properties');
            if (rawStored) {
              let stored = JSON.parse(rawStored);
              if (Array.isArray(stored)) {
                stored = stored.map((p: any) => p.id === updatedProp.id ? updatedProp : p);
                safeStorage.setItem('apna_added_properties', JSON.stringify(stored));
              }
            }
          } catch (e) {
            console.warn("Storage status update failure:", e);
          }
        }
        await loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("Failed property status update:", errData);
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
        try {
          const rawStored = safeStorage.getItem('apna_added_properties');
          if (rawStored) {
            let stored = JSON.parse(rawStored);
            if (Array.isArray(stored)) {
              stored = stored.filter((p: any) => p.id !== id);
              safeStorage.setItem('apna_added_properties', JSON.stringify(stored));
            }
          }
        } catch (e) {
          console.warn("Storage delete failure:", e);
        }
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all filters action
  const handleResetFilters = () => {
    setSearchVal('');
    setSearchInput('');
    setSelectedCity('');
    setSelectedCategory('ALL');
    setSelectedPurpose('ALL');
    setSelectedBeds('');
    setMaxPriceLimit('');
  };

  // Redirect and apply promotional filter search values
  const handleSelectPromoFilter = (linkUrl: string) => {
    if (!linkUrl || linkUrl === '#' || linkUrl === '/') return;
    
    // Parse linkUrl which is e.g. "filter:city:Mumbai" or "filter:category:RESIDENTIAL" or "filter:purpose:RENT" or "filter:search:Villa"
    if (linkUrl.startsWith('filter:')) {
      const parts = linkUrl.split(':');
      if (parts.length >= 3) {
        const filterType = parts[1];
        const filterValue = parts.slice(2).join(':'); // handle colon in value just in case
        
        switch (filterType) {
          case 'city':
            setSelectedCity(filterValue);
            break;
          case 'category':
            setSelectedCategory(filterValue as any);
            break;
          case 'purpose':
            setSelectedPurpose(filterValue as any);
            break;
          case 'beds':
            setSelectedBeds(filterValue);
            break;
          case 'search':
            setSearchInput(filterValue);
            setSearchVal(filterValue);
            break;
          default:
            break;
        }

        // Scroll smoothly to filter panel
        setTimeout(() => {
          const el = document.getElementById('inline-listings-filters');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    }
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
          if (!currentUser) {
            if (role !== UserRole.GUEST) {
              logSecurityWarning(role, `Unauthenticated guest user attempted manual workspace view injection to target role: ${role}`);
              return;
            }
          } else if (currentUser.role !== UserRole.ADMIN) {
            if (role !== currentUser.role) {
              logSecurityWarning(role, `User ${currentUser.email} with verified role [${currentUser.role}] attempted privilege escalation to switch view to restricted target workspace: ${role}`);
              return;
            }
          } else {
            // Authorized admin active perspective switcher
            setActiveAdminPerspective(role);
          }
          handleResetFilters();
        }}
        openAIRecommendedBubble={() => setIsAIBrokerOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        favoritesCount={favorites.length}
        properties={properties}
        favorites={favorites}
        onSelectProperty={handleSelectProperty}
        onFavoriteToggle={handleFavoriteToggle}
        notifications={notifications}
        onOpenFavorites={() => setIsFavoritesDrawerOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Persistent / Expandable Favorites Side Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesDrawerOpen}
        onClose={() => setIsFavoritesDrawerOpen(false)}
        properties={properties}
        favorites={favorites}
        onSelectProperty={handleSelectProperty}
        onFavoriteToggle={handleFavoriteToggle}
        onClearFilters={handleResetFilters}
      />

      {/* comprehensive Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onOpenAlertSetup={() => {
          const mainSearchEl = document.getElementById('search-hud');
          if (mainSearchEl) {
            mainSearchEl.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Primary layout focus */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        
        {/* VIEW DETERMINATION LAYER */}
        {(currentRole === UserRole.GUEST || !currentUser) ? (
          
          // ============================================
          // GUEST MAIN DISCOVERY LANDING VIEW
          // ============================================
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* HEROSCAPE DYNAMIC LIGHTBOX PROMO SLIDER */}
            <PromoSlider onSelectFilter={handleSelectPromoFilter} />
            
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
                      safeStorage.removeItem('ap_recently_viewed');
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
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} alt={p.title || 'Property'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{p.title || 'Property'}</h5>
                          <p className="text-[10px] text-white/50">{p.location?.area || ''}, {p.location?.city || ''}</p>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs font-extrabold text-blue-400">
                            {p.purpose === 'SELL' ? 'Buy' : 'Rent'} {(p.price || 0) >= 10000000 ? `₹${((p.price || 0) / 10000000).toFixed(1)} Cr` : `₹${((p.price || 0) / 100000).toFixed(1)} Lakh`}
                          </span>
                          <span className="text-[9px] font-mono text-white/44">
                            {p.details?.bedrooms ? `${p.details.bedrooms} BHK • ` : ''}{p.details?.area ? `${p.details.area} sqft` : 'Standard area'}
                          </span>
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

              {/* INLINE INTELLIGENT FILTERS PANEL CARD */}
              <div id="inline-listings-filters" className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-md space-y-4">
                {/* Row 1: Search Keyword and Categorization Quick Pills */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Search Bar Input */}
                  <div className="lg:col-span-4 relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by title, features, or location area..."
                      className="w-full bg-slate-950/60 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          setSearchVal('');
                        }}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Real Estate Categories (Pills selector) */}
                  <div className="lg:col-span-5 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono mr-1">Category:</span>
                    {[
                      { key: 'ALL', label: 'All Housing' },
                      { key: 'RESIDENTIAL', label: 'Residential' },
                      { key: 'COMMERCIAL', label: 'Commercial' },
                      { key: 'LAND', label: 'Land Plots' }
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key as any)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                          selectedCategory === cat.key
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/10'
                            : 'bg-slate-950/40 border-white/5 text-white/60 hover:text-white hover:bg-slate-950/80'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* List Purpose (Rent vs Buy pills) */}
                  <div className="lg:col-span-3 flex flex-wrap gap-2 items-center lg:justify-end">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono mr-1">Deal:</span>
                    {[
                      { key: 'ALL', label: 'All' },
                      { key: 'SELL', label: 'Buy' },
                      { key: 'RENT', label: 'Rent' }
                    ].map((purp) => (
                      <button
                        key={purp.key}
                        type="button"
                        onClick={() => setSelectedPurpose(purp.key as any)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                          selectedPurpose === purp.key
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950/40 border-white/5 text-white/60 hover:text-white hover:bg-slate-950/80'
                        }`}
                      >
                        {purp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2: Selectors (City, Beds limit, Max Price) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3.5 border-t border-white/5">
                  {/* Select City option */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider font-mono">Location City</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/90 focus:outline-none focus:border-blue-500/50 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white transition-all"
                    >
                      <option value="">Select Indian City (All)</option>
                      {INDIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Bed size options */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider font-mono">Bedrooms Layout (BHK)</label>
                    <select
                      value={selectedBeds}
                      onChange={(e) => setSelectedBeds(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/90 focus:outline-none focus:border-blue-500/50 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white transition-all"
                    >
                      <option value="">All BHK Configurations</option>
                      <option value="2">2 BHK Premium Suites</option>
                      <option value="3">3 BHK Premium Suites</option>
                      <option value="4">4 BHK Premium Suites</option>
                    </select>
                  </div>

                  {/* Select Max Price options */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider font-mono">Maximum Price Cap</label>
                    <select
                      value={maxPriceLimit}
                      onChange={(e) => setMaxPriceLimit(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/90 focus:outline-none focus:border-blue-500/50 cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white transition-all"
                    >
                      <option value="">No Maximum Price (Any)</option>
                      <option value="100000">Below ₹1 Lakh (Rent max)</option>
                      <option value="10000000">Below ₹1 Crore (Buy limit)</option>
                      <option value="25000000">Below ₹2.5 Crore</option>
                      <option value="60000000">Below ₹6 Crore</option>
                    </select>
                  </div>
                </div>

                {/* Active Filter Badges Bar */}
                {(selectedCity || selectedCategory !== 'ALL' || selectedPurpose !== 'ALL' || selectedBeds || maxPriceLimit || searchVal) && (
                  <div className="flex flex-wrap items-center gap-2 pt-3.5 border-t border-white/5 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3 w-3 text-white/30" />
                      Active Limiters:
                    </span>

                    {selectedCity && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300">
                        <span>City: {selectedCity}</span>
                        <button type="button" onClick={() => setSelectedCity('')} className="hover:text-white text-blue-400 shrink-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {selectedCategory !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[10px] font-bold text-pink-300">
                        <span>Category: {selectedCategory}</span>
                        <button type="button" onClick={() => setSelectedCategory('ALL')} className="hover:text-white text-pink-400 shrink-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {selectedPurpose !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300">
                        <span>Deal: {selectedPurpose}</span>
                        <button type="button" onClick={() => setSelectedPurpose('ALL')} className="hover:text-white text-indigo-400 shrink-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {selectedBeds && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300">
                        <span>Beds: {selectedBeds} BHK</span>
                        <button type="button" onClick={() => setSelectedBeds('')} className="hover:text-white text-emerald-400 shrink-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {maxPriceLimit && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300">
                        <span>Max Price: ₹{parseInt(maxPriceLimit) >= 10000000 ? `${(parseInt(maxPriceLimit) / 10000000).toFixed(0)} Cr` : `${(parseInt(maxPriceLimit) / 100000).toFixed(0)} L`}</span>
                        <button type="button" onClick={() => setMaxPriceLimit('')} className="hover:text-white text-amber-400 shrink-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    {searchVal && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300">
                        <span>Keyword: "{searchVal}"</span>
                        <button type="button" onClick={() => { setSearchInput(''); setSearchVal(''); }} className="hover:text-white text-purple-400 shrink-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg ml-auto transition-colors cursor-pointer select-none"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              ) : approvedProperties.length === 0 ? (
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
                    allProperties={approvedProperties} 
                    onSelectProperty={(p) => handleSelectProperty(p)} 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {approvedProperties.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      onSelect={(prop) => handleSelectProperty(prop)}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorite={favorites.includes(p.id)}
                      isCompared={comparedPropertyIds.includes(p.id)}
                      onCompareToggle={handleCompareToggle}
                      comparedCount={comparedPropertyIds.length}
                      currentUserEmail={currentUser?.email || ''}
                      currentUserRole={currentUser?.role || ''}
                      onPropertyUpdate={loadData}
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
              role={currentUser?.role === UserRole.ADMIN ? currentRole : (currentUser?.role || UserRole.GUEST)}
              properties={properties}
              bookings={bookings}
              favorites={favorites}
              onFavoriteToggle={handleFavoriteToggle}
              onUpdatePropertyStatus={handleUpdatePropertyStatus}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteProperty={handleDeletePropertySubmit}
              onSelectProperty={(p) => handleSelectProperty(p)}
              onOpenAddProperty={() => {
                setPropertyToEdit(null);
                setIsAddPropertyOpen(true);
              }}
              onEditProperty={(p) => {
                setPropertyToEdit(p);
                setIsAddPropertyOpen(true);
              }}
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
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => handleSelectProperty(null)}
            userId={currentUser ? currentUser.email : "buyer-demo"}
            userName={currentUser ? currentUser.name : "Anil Vasudevan"}
            onSelectProperty={(p) => {
              handleSelectProperty(p);
            }}
            onEditProperty={(p) => {
              handleSelectProperty(null);
              setPropertyToEdit(p);
              setIsAddPropertyOpen(true);
            }}
            onDeleteProperty={(id) => {
              handleDeletePropertySubmit(id);
              handleSelectProperty(null);
            }}
            currentUserRole={currentRole}
            isLoggedIn={!!currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* 2. Add New Listing Form Entry Modal */}
      <AddPropertyModal
        isOpen={isAddPropertyOpen}
        onClose={() => {
          setIsAddPropertyOpen(false);
          setPropertyToEdit(null);
        }}
        onSubmit={handleAddPropertySubmit}
        propertyToEdit={propertyToEdit}
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

      {/* Persistent floating favorites drawer toggle button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsFavoritesDrawerOpen(true)}
          className="p-4 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-pink-500/30 hover:border-pink-500 text-pink-500 shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 group focus:outline-none relative"
          title="Toggle Saved Favorites Board"
        >
          <Heart className="h-6 w-6 fill-pink-500/20 group-hover:fill-pink-500/50 transition-colors" />
          {favorites.length > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1.5 rounded-full bg-pink-500 text-[10px] font-black font-mono text-white flex items-center justify-center border-2 border-slate-950 shadow-md transform scale-110 animate-bounce">
              {favorites.length}
            </span>
          ) : (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1.5 rounded-full bg-slate-800 text-[9px] font-mono text-slate-400 flex items-center justify-center border-2 border-slate-950">
              0
            </span>
          )}
        </button>
      </div>

    </div>
  );
}

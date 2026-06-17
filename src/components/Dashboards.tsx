import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Check, X, ShieldAlert, Sparkles, TrendingUp, Users, MessageSquare, Download, Trash, RefreshCw, Layers, Award, Radio, Activity, DollarSign, Calendar, Plus, Loader2, Star, Flame, Edit } from 'lucide-react';
import { Property, Booking, SubscriptionPlan, UserRole, Promotion, PromotionType } from '../types';
import { SUBSCRIPTION_PLANS } from '../data';
import AgentPerformanceHeatmap from './AgentPerformanceHeatmap';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { safeStorage } from '../services/safeStorage';

interface DashboardsProps {
  role: UserRole;
  properties: Property[];
  bookings: Booking[];
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  onUpdatePropertyStatus: (id: string, status: any, moderationNotes?: string) => void;
  onUpdateBookingStatus: (id: string, status: any) => void;
  onDeleteProperty: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenAddProperty: () => void;
  onEditProperty?: (property: Property) => void;
}

export default function Dashboards({
  role,
  properties,
  bookings,
  favorites,
  onFavoriteToggle,
  onUpdatePropertyStatus,
  onUpdateBookingStatus,
  onDeleteProperty,
  onSelectProperty,
  onOpenAddProperty,
  onEditProperty
}: DashboardsProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('plan-free');
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [activeRentalProperty, setActiveRentalProperty] = useState<Property | null>(null);

  // Administrative moderation & audit log tracking states
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>([]);
  const [rejectionModalProperty, setRejectionModalProperty] = useState<Property | null>(null);
  const [rejectionNotesInput, setRejectionNotesInput] = useState('');
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'pending' | 'moderated' | 'logs' | 'promotions' | 'diagnostics'>('pending');
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [isFetchingDiagnostics, setIsFetchingDiagnostics] = useState<boolean>(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [batchApprovalMode, setBatchApprovalMode] = useState(false);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [adminStatusFilter, setAdminStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [expandedVersionsPropertyId, setExpandedVersionsPropertyId] = useState<string | null>(null);

  // Promotions Management (Managed by Admin)
  const [adminPromos, setAdminPromos] = useState<Promotion[]>([]);
  const [isFetchingPromos, setIsFetchingPromos] = useState(false);
  const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    type: 'OFFER',
    imageUrl: '',
    badge: '',
    linkUrl: '#',
    expiryDate: '',
    active: true
  });
  const [promoFormErrors, setPromoFormErrors] = useState<{
    title?: string;
    imageUrl?: string;
    expiryDate?: string;
  }>({});
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [isPromoFormOpen, setIsPromoFormOpen] = useState(false);

  const getAuthHeaders = () => {
    const raw = safeStorage.getItem('apnaghar_user');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u.email) headers['X-User-Email'] = u.email;
        if (u.role) headers['X-User-Role'] = u.role;
      } catch (e) {}
    }
    return headers;
  };

  const fetchPromos = () => {
    setIsFetchingPromos(true);
    fetch('/api/promos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdminPromos(data);
        }
      })
      .catch(err => console.error('Failed to fetch promos:', err))
      .finally(() => setIsFetchingPromos(false));
  };

  const fetchDiagnostics = async () => {
    setIsFetchingDiagnostics(true);
    setDiagnosticsError(null);
    try {
      const response = await fetch('/api/diagnostics/db', {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      setDiagnosticsData(data);
    } catch (e: any) {
      console.error("Error fetching database diagnostics:", e);
      setDiagnosticsError(e.message || "Unknown error connecting to diagnostic telemetry");
    } finally {
      setIsFetchingDiagnostics(false);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear old errors
    const errors: typeof promoFormErrors = {};

    // 1. Validation for Title content
    if (!promoForm.title || promoForm.title.trim().length < 5) {
      errors.title = 'Title is required and must be at least 5 character length.';
    }

    // 2. Validation for Image URL
    if (!promoForm.imageUrl || promoForm.imageUrl.trim() === '') {
      errors.imageUrl = 'High-resolution promo image URL is mandatory.';
    } else {
      const urlStr = promoForm.imageUrl.trim();
      const isHttp = urlStr.startsWith('http://') || urlStr.startsWith('https://');
      const hasDot = urlStr.includes('.');
      if (!isHttp || !hasDot) {
        errors.imageUrl = 'Image URL must be valid and begin with http:// or https://';
      }
    }

    // 3. Validation for Offer Expiry dates
    if (promoForm.expiryDate) {
      try {
        const expDate = new Date(promoForm.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
        
        if (isNaN(expDate.getTime())) {
          errors.expiryDate = 'Please select or type a valid expiry date format.';
        } else if (expDate < today) {
          errors.expiryDate = 'Banner offer expiry date cannot be in the past.';
        }
      } catch (err) {
        errors.expiryDate = 'Malformed expiration date selected.';
      }
    }

    // If there are errors, abort save
    if (Object.keys(errors).length > 0) {
      setPromoFormErrors(errors);
      return;
    }

    setPromoFormErrors({});

    const url = editingPromoId ? `/api/promos/${editingPromoId}` : '/api/promos';
    const method = editingPromoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(promoForm)
      });
      if (res.ok) {
        setIsPromoFormOpen(false);
        setEditingPromoId(null);
        setPromoForm({
          title: '',
          description: '',
          type: 'OFFER',
          imageUrl: '',
          badge: '',
          linkUrl: '#',
          expiryDate: '',
          active: true
        });
        fetchPromos();
      }
    } catch (err) {
      console.error('Error saving promo:', err);
    }
  };

  const handleEditPromoClick = (promo: Promotion) => {
    setEditingPromoId(promo.id);
    setPromoFormErrors({});
    setPromoForm({
      title: promo.title,
      description: promo.description,
      type: promo.type,
      imageUrl: promo.imageUrl,
      badge: promo.badge || '',
      linkUrl: promo.linkUrl || '#',
      expiryDate: promo.expiryDate || '',
      active: promo.active
    });
    setIsPromoFormOpen(true);
  };

  const handleTogglePromoActive = async (promo: Promotion) => {
    try {
      const res = await fetch(`/api/promos/${promo.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !promo.active })
      });
      if (res.ok) {
        fetchPromos();
      }
    } catch (err) {
      console.error('Error toggling promo status:', err);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('Are you absolute certain you want to delete this promotional banner?')) return;
    try {
      const res = await fetch(`/api/promos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchPromos();
      }
    } catch (err) {
      console.error('Error deleting promo:', err);
    }
  };
  const [activeReportTab, setActiveReportTab] = useState<'revenue' | 'properties' | 'activity'>('revenue');
  const [bulkNotesInput, setBulkNotesInput] = useState('');
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);

  // Master Amenities Management (Managed by Admin)
  const [adminAmenities, setAdminAmenities] = useState<{ id: string; label: string; active: boolean }[]>([]);
  const [newAmenityLabel, setNewAmenityLabel] = useState('');
  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);
  const [editingAmenityLabel, setEditingAmenityLabel] = useState('');

  const fetchAdminAmenities = () => {
    fetch('/api/amenities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdminAmenities(data);
        }
      })
      .catch(err => console.error('Failed to fetch amenities:', err));
  };

  // Server-side admin login/session token verification state
  const [isServerAdminVerified, setIsServerAdminVerified] = useState<boolean>(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState<boolean>(false);

  useEffect(() => {
    setSelectedPropIds([]);
  }, [adminActiveSubTab, adminStatusFilter]);

  useEffect(() => {
    if (role === UserRole.ADMIN) {
      const rawUser = safeStorage.getItem('apnaghar_user');
      let userEmail = '';
      if (rawUser) {
        try {
          userEmail = JSON.parse(rawUser).email || '';
        } catch (e) {}
      }

      setIsVerifyingAdmin(true);
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Unauthorized');
        })
        .then(data => {
          if (data && data.isValid) {
            setIsServerAdminVerified(true);
            fetchAdminAmenities();
            fetchPromos();
            fetchUsers();
          } else {
            setIsServerAdminVerified(false);
          }
        })
        .catch(() => {
          setIsServerAdminVerified(false);
        })
        .finally(() => {
          setIsVerifyingAdmin(false);
        });
    } else {
      setIsServerAdminVerified(false);
    }
  }, [role]);

  const handleAddAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenityLabel.trim()) return;
    try {
      const res = await fetch('/api/amenities', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ label: newAmenityLabel.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.amenities) {
          setAdminAmenities(data.amenities);
        }
        setNewAmenityLabel('');
      }
    } catch (err) {
      console.error('Error adding amenity:', err);
    }
  };

  const handleToggleAmenity = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/amenities/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.amenities) {
          setAdminAmenities(data.amenities);
        }
      }
    } catch (err) {
      console.error('Error toggling amenity:', err);
    }
  };

  const handleUpdateAmenityLabel = async (id: string) => {
    if (!editingAmenityLabel.trim()) return;
    try {
      const res = await fetch(`/api/amenities/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ label: editingAmenityLabel.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.amenities) {
          setAdminAmenities(data.amenities);
        }
        setEditingAmenityId(null);
        setEditingAmenityLabel('');
      }
    } catch (err) {
      console.error('Error updating amenity label:', err);
    }
  };

  const handleDeleteAmenity = async (id: string) => {
    try {
      const res = await fetch(`/api/amenities/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.amenities) {
          setAdminAmenities(data.amenities);
        }
      }
    } catch (err) {
      console.error('Error deleting amenity:', err);
    }
  };

  // Bulk approve or reject action handler
  const handleBulkApproveReject = async (targetStatus: 'APPROVED' | 'REJECTED', reasonStr?: string) => {
    if (selectedPropIds.length === 0) return;
    try {
      const res = await fetch('/api/properties/bulk-moderation', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ids: selectedPropIds,
          status: targetStatus,
          moderationNotes: reasonStr || 'Bulk administrative action applied.',
          changedBy: 'Admin Executive'
        })
      });
      if (res.ok) {
        // Trigger state reload in the parent App component by calling state updater on the first selected item
        onUpdatePropertyStatus(selectedPropIds[0], targetStatus, reasonStr || 'Bulk administrative action applied.');
      }
    } catch (e) {
      console.warn("Failed bulk moderation action:", e);
    } finally {
      setSelectedPropIds([]);
      setIsBulkRejectModalOpen(false);
      setBulkNotesInput('');
    }
  };

  // Single reject trigger action
  const handleSingleRejectSubmit = () => {
    if (!rejectionModalProperty) return;
    onUpdatePropertyStatus(rejectionModalProperty.id, 'REJECTED', rejectionNotesInput || 'Failed compliance validation checklists.');
    setRejectionModalProperty(null);
    setRejectionNotesInput('');
  };

  // Admin user directory state definition
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState<string | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState<string | null>(null);

  // Promotional campaign and alert alert state
  const [promoSubject, setPromoSubject] = useState('');
  const [promoBody, setPromoBody] = useState('');
  const [promoTargetRole, setPromoTargetRole] = useState('ALL');
  const [promoSelectedPropId, setPromoSelectedPropId] = useState('');
  const [promoStatus, setPromoStatus] = useState<any>(null);
  const [promoSending, setPromoSending] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // XML Sitemap state
  const [sitemapStatus, setSitemapStatus] = useState<any>(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);

  const handleRegenerateSitemap = async () => {
    setSitemapLoading(true);
    setSitemapStatus(null);
    try {
      const res = await fetch('/api/admin/sitemap/regenerate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSitemapStatus(data);
      } else {
        console.warn("Failed sitemap status post request");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSitemapLoading(false);
    }
  };

  const handleSendPromoBlast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoSubject.trim() || !promoBody.trim()) {
      setPromoError('Subject and Body texts are required to launch broadcasts.');
      return;
    }
    setPromoSending(true);
    setPromoError(null);
    setPromoStatus(null);
    try {
      const res = await fetch('/api/admin/send-bulk-promo', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subject: promoSubject,
          body: promoBody,
          targetRole: promoTargetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPromoStatus(data);
        setPromoSubject('');
        setPromoBody('');
        setPromoSelectedPropId('');
        // Refresh alert logs
        fetchCRMData();
      } else {
        const err = await res.json();
        setPromoError(err.error || 'Composition broadcast submission rejected.');
      }
    } catch (e) {
      setPromoError('Connection issue. Try reloading servers.');
    } finally {
      setPromoSending(false);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.warn("Failed to fetch users directory:", e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleUpdateUserRole = async (email: string, targetRole: UserRole) => {
    setSubmittingEmail(email);
    setRoleUpdateMsg(null);

    // Retrieve verified admin email from current session
    const rawUser = safeStorage.getItem('apnaghar_user');
    let adminEmail = '';
    if (rawUser) {
      try {
        adminEmail = JSON.parse(rawUser).email || '';
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: targetRole, adminEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setRoleUpdateMsg(`Successfully updated user ${email} to role '${targetRole}'.`);
        fetchUsers();
        setTimeout(() => setRoleUpdateMsg(null), 3500);
      } else {
        const error = await res.json();
        setRoleUpdateMsg(`Error: ${error.error || 'Failed to update user role'}`);
      }
    } catch (e) {
      console.warn("Update user role API error:", e);
      setRoleUpdateMsg("Network error encountered.");
    } finally {
      setSubmittingEmail(null);
    }
  };



  // CRM notifications & alerts hook state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchCRMData = async () => {
    try {
      const resAlerts = await fetch('/api/alerts');
      if (resAlerts.ok) {
        setAlerts(await resAlerts.json());
      }
      const resNotif = await fetch('/api/notifications');
      if (resNotif.ok) {
        setNotifications(await resNotif.json());
      }
    } catch (err) {
      console.error("Error loading subscriber tables: ", err);
    }
  };

  React.useEffect(() => {
    if (role === UserRole.BUYER) {
      fetchCRMData();
    }
  }, [role]);

  const handleDeleteAlert = async (id: string) => {
    try {
      const resp = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setAlerts(prev => prev.filter(x => x.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter properties by current user simulation (Owner/Agent)
  const myProperties = properties.filter(p => p.ownerId === 'owner-demo' || p.ownerId === 'agent-demo');

  // Format INR Pricing
  const formatINR = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Switch comparisons checkboxes
  const handleComparisonToggle = (id: string) => {
    setComparedPropertyIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  // Printable agreement layout helper
  const handleTriggerPrintAgreement = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* ======================================= */}
      {/* 1. GUEST USER DASHBOARD (No specific lists, show CTA) */}
      {/* ======================================= */}
      {role === UserRole.GUEST && (
        <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-white animate-in fade-in duration-300">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md block w-max">
              Ready to Expand?
            </span>
            <h2 className="text-lg font-black text-white mt-2 font-sans">
              Welcome to ApnaGhar Portal!
            </h2>
            <p className="text-xs text-white/50 max-w-xl leading-relaxed mt-1">
              You are currently entering as a Guest. Switch your workspace persona using the floating selector on the top-right header to try stateful listings creations, mortgage calculators, reviews lists, or admin panel configurations immediately!
            </p>
          </div>
          <button 
            type="button"
            onClick={onOpenAddProperty}
            className="px-5 py-2.5 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white border border-white/10 font-bold text-xs rounded-xl shadow-lg hover:opacity-95 transition-all text-center shrink-0 cursor-pointer"
          >
            Create Test Listing
          </button>
        </div>
      )}


      {/* ======================================= */}
      {/* 2. BUYER WORKSPACE DASHBOARD */}
      {/* ======================================= */}
      {role === UserRole.BUYER && (
        <div className="space-y-6">
          
          {/* Favorites Grid */}
          <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl text-white">
            <h3 className="text-xs font-bold text-white/55 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
              <span>My Saved Favorites ({favorites.length})</span>
            </h3>

            {favorites.length === 0 ? (
              <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl">
                <p className="text-xs text-slate-400 italic">No favorite properties marked yet. Tap the heart icons on property cards to populate listings!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {properties.filter(p => favorites.includes(p.id)).map(p => (
                  <div key={p.id} className="p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} alt="" className="w-11 h-11 rounded-lg object-cover bg-slate-800" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                        <span className="text-[10px] text-blue-400 font-bold">{formatINR(p.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => onSelectProperty(p)}
                        className="text-[10px] font-mono bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button 
                        onClick={() => onFavoriteToggle(p.id)}
                        className="text-red-400 hover:text-red-550 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visit Scheduling Status Logs */}
          <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl text-white">
            <h3 className="text-xs font-bold text-white/55 uppercase tracking-wider font-mono mb-4">Scheduled Site Tours ({bookings.length})</h3>
            {bookings.length === 0 ? (
              <p className="text-xs text-slate-400 italic font-sans text-center">No tours booked yet. Go to any property details and pick an hour slot to schedule visits!</p>
            ) : (
              <div className="overflow-x-auto text-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[9px] text-white/50 uppercase font-bold">
                      <th className="pb-2">Property</th>
                      <th className="pb-2">Date / Hour</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-white/10 py-2">
                        <td className="py-2.5 font-bold flex items-center gap-2 max-w-xs truncate">
                          <img src={b.propertyImage} className="w-6 h-6 rounded-md object-cover bg-slate-100" />
                          <span>{b.propertyTitle}</span>
                        </td>
                        <td className="py-2.5">
                          <div>{b.date} • {b.time}</div>
                          {b.offerPrice && (
                            <div className="text-[10px] text-emerald-400 font-extrabold mt-0.5">
                              🎯 Offer: {formatINR(b.offerPrice)}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${b.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-300' : b.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/80'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-white/60">
                          {b.message || 'Demo client schedule visit.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Property Comparisons Matrix Dashboard */}
          <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl text-white">
            <div className="border-b border-white/10 pb-2 mb-4">
              <h3 className="text-sm font-extrabold text-white font-sans">
                Property Comparison Matrix (Max 3)
              </h3>
              <p className="text-[10px] text-white/50 mt-0.5">Toggle comparison checkboxes on properties to load side-by-side spec alignments.</p>
            </div>

            {/* Checkbox selectors */}
            <div className="flex flex-wrap gap-2.5 mb-5 select-none">
              {properties.slice(0, 5).map(p => (
                <label key={p.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer text-xs font-semibold text-white/90">
                  <input
                    type="checkbox"
                    checked={comparedPropertyIds.includes(p.id)}
                    onChange={() => handleComparisonToggle(p.id)}
                    className="accent-blue-500 cursor-pointer"
                  />
                  <span>{p.title}</span>
                </label>
              ))}
            </div>

            {comparedPropertyIds.length === 0 ? (
              <p className="text-xs text-white/40 italic text-center py-4 bg-white/5 rounded-2xl border border-white/5">Select properties above to showcase technical comparative specs.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparedPropertyIds.map(id => {
                  const p = properties.find(item => item.id === id);
                  if (!p) return null;

                  return (
                    <div key={p.id} className="p-4 bg-slate-900 border border-white/10 shadow-xl rounded-2xl relative">
                      <h4 className="text-xs font-bold text-white truncate mb-1">{p.title}</h4>
                      <span className="text-sm font-extrabold text-blue-400 block mb-4">{formatINR(p.price)}</span>
                      
                      <div className="space-y-2 text-xs text-white/80">
                        <div className="flex justify-between border-b border-white/5 pb-1 font-sans">
                          <span className="text-white/40">Category / Type</span>
                          <span className="font-semibold">{p.category} • {p.type}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1 font-sans">
                          <span className="text-white/40">BHK / configuration</span>
                          <span className="font-semibold">{p.details?.bedrooms || '-'} BHK</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1 font-sans">
                          <span className="text-white/40">Built Area</span>
                          <span className="font-semibold">{p.details?.area || 'N/A'} sq ft</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1 font-sans">
                          <span className="text-white/40">City / Suburb</span>
                          <span className="font-semibold">{p.location?.city || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1 font-sans">
                          <span className="text-white/40">Gym facility</span>
                          <span className="font-bold text-blue-400">{p.amenities?.gym ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between font-sans">
                          <span className="text-white/40">Swimming Pool</span>
                          <span className="font-bold text-blue-400">{p.amenities?.swimmingPool ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved Search Alerts & Active Match-making inbox notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            
            {/* 1. Alerts */}
            <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-white/55 uppercase tracking-wider font-mono">My Saved Search Alerts ({alerts.length})</h3>
                  <p className="text-[10px] text-white/40 mt-0.5">Configurations checking real-time new additions</p>
                </div>
                <button 
                  onClick={fetchCRMData}
                  className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer hover:text-white"
                  title="Refresh Alerts"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl italic text-xs text-white/30">
                  No query subscriptions saved yet. Go back to Home and click "Save Search Alert" with custom filters enabled!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alerts.map(a => (
                    <div key={a.id} className="p-3.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-3 font-sans">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white text-left">
                          <span>📍 Location:</span>
                          <span className="text-blue-400">{a.city}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-white/50 text-left">
                          {a.maxPrice && (
                            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">
                              Max ₹{a.maxPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {a.category && (
                            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded uppercase font-mono">
                              {a.category.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(a.id)}
                        className="p-1.5 text-red-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete query subscription alert"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Mock Email Inbox Notifications */}
            <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-white/55 uppercase tracking-wider font-mono font-sans">Mock Email Inbox Alerts ({notifications.length})</h3>
                  <p className="text-[10px] text-white/40 mt-0.5">Real-time matching notification triggers simulation</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl italic text-xs text-white/30">
                  Inbox is currently empty. Match-making alerts will deliver mock emails here whenever you list new properties matching saved parameters!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 rounded-xl bg-slate-900 border border-emerald-500/10 relative overflow-hidden text-left">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-[11px] text-emerald-400 uppercase tracking-widest font-mono">Match Notification Mail</span>
                        <span className="text-[9px] font-mono text-white/40">{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="font-bold text-xs text-white/95 leading-snug">{n.title}</h4>
                      <p className="text-[10px] text-white/60 font-sans mt-1 leading-normal">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}


      {/* ======================================= */}
      {/* 3. TENANT WORKSPACE DASHBOARD */}
      {/* ======================================= */}
      {role === UserRole.TENANT && (
        <div className="space-y-6">
          
          {/* Tenant agreement generator */}
          <div className="backdrop-blur-xl bg-slate-950/70 rounded-3xl border border-white/10 p-6 shadow-2xl text-white">
            <div className="border-b border-white/10 pb-2 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white font-sans">
                  Residential Tenancy Agreement Generator
                </h3>
                <p className="text-[10px] text-white/50 mt-0.5">Generate and preview standard Indian lease contracts instantly based on properties.</p>
              </div>
              <button
                onClick={handleTriggerPrintAgreement}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="h-4 w-4" />
                Print / PDF Lease
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Select corresponding property for lease */}
              <div className="space-y-3.5">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block font-mono">Select Base Rent Property:</span>
                <div className="space-y-2">
                  {properties.filter(p => p.purpose === 'RENT').map(p => (
                    <div 
                      key={p.id}
                      onClick={() => setActiveRentalProperty(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${activeRentalProperty?.id === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-slate-900 hover:bg-slate-850'}`}
                    >
                      <h4 className="text-xs font-bold text-white">{p.title}</h4>
                      <span className="text-[10px] font-semibold text-white/50">{p.location?.area || 'N/A'}, {p.location?.city || 'N/A'} • ₹{(p.price || 0).toLocaleString()}/mo</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Agreement Document */}
              <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-white/10 overflow-y-auto max-h-110 shadow-inner [print-color-adjust:exact]">
                {activeRentalProperty ? (
                  <div className="font-serif text-slate-800 space-y-4 max-w-xl mx-auto bg-white p-6 shadow rounded border border-slate-100 leading-relaxed text-xs">
                    <div className="text-center font-bold uppercase underline text-sm tracking-wide mb-6">
                      Residential Tenancy Agreement
                    </div>
                    
                    <p>
                      This Tenancy Agreement is entered into on this <strong>3rd Day of June, 2026</strong>, by and between the Landlord: 
                      <strong> {activeRentalProperty.ownerName}</strong>, hereinafter referred to as the "FIRST PARTY",
                      and the Tenant: <strong>Aniwas111</strong> (Representing Buyer/Tenant Demo), hereinafter referred to as the "SECOND PARTY".
                    </p>

                    <p>
                      The Landlord agrees to let and the Tenant agrees to lease the residential premises situated at:
                      <strong> {activeRentalProperty.location?.address || ''}, {activeRentalProperty.location?.area || ''}, {activeRentalProperty.location?.city || ''} - Pin {activeRentalProperty.location?.postalCode || ''}</strong>.
                    </p>

                    <p>
                      <strong>1. TENANCY TERM & DURATION:</strong><br />
                      This residential lease shall remain active for a locked tenure duration of 11 (eleven) months commencing from the start date, on standard mutual renewal clauses.
                    </p>

                    <p>
                      <strong>2. RENT PACK & MAINTENANCE CHARGES:</strong><br />
                      Standard monthly recurring rent value payable under this lease is <strong>₹{activeRentalProperty.price.toLocaleString('en-IN')}</strong> per month, excluding additional monthly society maintenance dues of ₹{activeRentalProperty.maintenanceCharges || '3,500'}. Rent is payable on or before the 5th day of each calendar month.
                    </p>

                    <p>
                      <strong>3. REFUNDABLE SECURITY DEPOSIT:</strong><br />
                      The Tenant has deposited with the Landlord a refundable security deposit value of <strong>₹{(activeRentalProperty.securityDeposit || activeRentalProperty.price * 3).toLocaleString('en-IN')}</strong> representing security reserves. This principal shall be refunded in full inside 15 days of lease termination.
                    </p>

                    <p>
                      IN WITNESS WHEREOF, the FIRST PARTY and SECOND PARTY sign this residential tenance document on the day and year first written above.
                    </p>

                    <div className="pt-8 grid grid-cols-2 gap-8 font-sans font-bold">
                      <div className="border-t border-slate-300 pt-1 text-center">
                        <span className="block text-[10px] text-slate-400">First Party Signature</span>
                        <span className="text-slate-700 text-xs mt-1 block">{activeRentalProperty.ownerName}</span>
                      </div>
                      <div className="border-t border-slate-300 pt-1 text-center font-bold">
                        <span className="block text-[10px] text-slate-400">Second Party Signature</span>
                        <span className="text-slate-700 text-xs mt-1 block">Aniwas111</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400">
                    <p className="text-xs text-slate-400 italic text-center">Select any rent-based property listing from the left panel to load and populate details in the Agreement template instantly!</p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}


      {/* ======================================= */}
      {/* 4. HOME OWNERS WORKSPACE */}
      {/* ======================================= */}
      {(role === UserRole.OWNER || role === UserRole.AGENT) && (
        <div className="space-y-6">
          
          {/* Analytics Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'My Listings Dues', val: myProperties.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Monthly Site Visits', val: bookings.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Inquiries Received', val: myProperties.reduce((acc, p) => acc + (p.leadsCount || 0), 0) + 4, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Overall Exposure views', val: myProperties.reduce((acc, p) => acc + (p.views || 0), 0) + 124, color: 'text-blue-400', bg: 'bg-blue-500/10' }
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border border-white/10 bg-slate-950 ${stat.bg} shadow-md`}>
                <span className="text-[10px] font-bold text-white/50 block uppercase tracking-wide font-mono">{stat.label}</span>
                <span className={`text-2xl font-black mt-1 block ${stat.color}`}>{stat.val}</span>
              </div>
            ))}
          </div>

          {/* Manage my listings segment */}
          <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">My Active Listings ({myProperties.length})</h3>
              <button
                onClick={onOpenAddProperty}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                + Add Business Property
              </button>
            </div>

            {myProperties.length === 0 ? (
              <p className="text-xs text-slate-400 italic">You have no property listings active yet. Click "+ Add Business Property" on top to write one!</p>
            ) : (
              <div className="space-y-3">
                {myProperties.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border bg-white flex flex-col gap-3 transition-all hover:shadow-md dark:bg-slate-950/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap text-left">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h4>
                            {p.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 shadow-sm animate-pulse">
                                ⏳ Pending Approval
                              </span>
                            )}
                            {p.status === 'APPROVED' && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                                ✅ Active Status
                              </span>
                            )}
                            {p.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 shadow-sm">
                                ❌ Rejected
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 mt-0.5 text-left">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.location?.area || 'N/A'}, {p.location?.city || 'N/A'} • <strong className="text-emerald-700 dark:text-emerald-400">{formatINR(p.price)}</strong></span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-mono bg-blue-500/10 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1">
                                📊 Views: {p.views || 0} • 🎯 Leads: {p.leadsCount || 0}
                              </span>
                              <span className="text-[9px] font-mono bg-amber-500/10 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase font-extrabold flex items-center gap-1">
                                🔥 Popularity Score: {p.sharesCount || 0} Shares
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => onSelectProperty(p)}
                          className="p-1 px-2.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Inspect
                        </button>
                        {onEditProperty && (
                          <button 
                            onClick={() => onEditProperty(p)}
                            className="p-1 px-2.5 text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Edit / Resubmit
                          </button>
                        )}
                        <button 
                          onClick={() => onDeleteProperty(p.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {p.status === 'REJECTED' && p.moderationNotes && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                        <span className="text-[9.5px] font-bold text-red-600 dark:text-red-400 font-sans block">⚠️ REJECTION EXPLANATION:</span>
                        <p className="text-[10px] text-red-700 dark:text-red-300 italic mt-0.5 font-sans">
                          "{p.moderationNotes}"
                        </p>
                      </div>
                    )}

                    {p.versions && p.versions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-100 dark:border-white/5 text-left">
                        <button
                          type="button"
                          onClick={() => setExpandedVersionsPropertyId(expandedVersionsPropertyId === p.id ? null : p.id)}
                          className="flex items-center gap-1 text-[9px] font-mono font-black uppercase text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          📁 {expandedVersionsPropertyId === p.id ? 'Hide Past Submissions' : `View Prior Historical Versions (${p.versions.length})`}
                        </button>
                        
                        {expandedVersionsPropertyId === p.id && (
                          <div className="mt-2 space-y-2">
                            <p className="text-[9px] text-slate-400 font-sans">
                              Select from the previous historical versions below to load and modify the listing edits, re-publishing it into the manual moderation queue.
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {p.versions.map((ver: any, vidx: number) => (
                                <div key={ver.id || vidx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                  <div className="space-y-0.5 text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-[10.5px] text-slate-800 dark:text-white">{ver.title}</span>
                                      <span className="font-mono text-[9px] text-slate-400">({formatINR(ver.price)})</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-serif leading-relaxed line-clamp-2">{ver.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[8.5px] font-mono px-1 py-0.2 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-500 uppercase">
                                        Status was: {ver.status}
                                      </span>
                                      {ver.moderationNotes && (
                                        <span className="text-[8.5px] text-red-500 italic max-w-xs truncate font-sans" title={ver.moderationNotes}>
                                          Notes: "{ver.moderationNotes}"
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onEditProperty) {
                                        onEditProperty({
                                          ...p,
                                          title: ver.title,
                                          description: ver.description,
                                          price: ver.price,
                                          status: 'PENDING',
                                          moderationNotes: ''
                                        });
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[9px] font-sans font-black uppercase text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200/50 cursor-pointer active:scale-95 transition-all self-end sm:self-center shrink-0"
                                  >
                                    Restore & Tweak
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leads CRM booking log */}
          <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Inbound Customer Lead Visit Tasks</h3>
            {bookings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No customer visits booked yet or listings are fresh.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">Tour of: {b.propertyTitle}</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">Guest: {b.clientName} ({b.clientPhone})</h4>
                      {b.offerPrice && (
                        <div className="inline-block mt-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                          🎯 Price Offer: {b.offerPrice >= 10000000 ? `₹${(b.offerPrice / 10000000).toFixed(2)} Crore` : b.offerPrice >= 100000 ? `₹${(b.offerPrice / 100000).toFixed(2)} Lakh` : `₹${b.offerPrice.toLocaleString('en-IN')}`}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 italic mt-1">{b.message || '"Greetings, I would like to schedule a walk-through."'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">{b.date} • {b.time}</span>
                      {b.status === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => onUpdateBookingStatus(b.id, 'APPROVED')}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => onUpdateBookingStatus(b.id, 'CANCELLED')}
                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">{b.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Heatmap Analyser for Brokers */}
          {role === UserRole.AGENT && (
            <AgentPerformanceHeatmap />
          )}

          {/* Broker Agency Pricing Select lists */}
          {role === UserRole.AGENT && (
            <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800">
              <div className="border-b pb-2 mb-4">
                <h3 className="text-sm font-extrabold text-slate-950 font-sans">Corporate Broker Subscription Hub</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Select a premium brokerage program to increase your exposure and listing limits.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-5 rounded-2xl border transition-all ${selectedPlanId === plan.id ? 'border-amber-500 bg-amber-500/5 shadow-lg' : 'bg-white border-slate-200'}`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Program tier</span>
                    <h4 className="text-xs font-black text-slate-900 mt-0.5">{plan.name}</h4>
                    <span className="text-xl font-extrabold text-slate-950 block mt-2">
                      ₹{plan.price.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">/ mo</span>
                    </span>

                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                      {plan.features.map((f, fidx) => (
                        <li key={fidx} className="flex items-start gap-1.5 leading-normal">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full py-2 rounded-xl text-xs font-bold mt-5 transition-all cursor-pointer ${selectedPlanId === plan.id ? 'bg-amber-500 text-white' : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                    >
                      {selectedPlanId === plan.id ? 'Active Plan' : 'Upgrade to Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}


      {/* ======================================= */}
      {/* 5. ADMIN EXECUTIVE CENTER PANEL */}
      {/* ======================================= */}
      {role === UserRole.ADMIN && isVerifyingAdmin && (
        <div className="p-12 bg-slate-900 border border-white/10 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <h4 className="text-sm font-extrabold uppercase font-mono text-white tracking-widest">Verifying Admin Session Security Token...</h4>
          <p className="text-xs text-white/50 max-w-sm">Checking server role registers to prevent administrative elevation tampering.</p>
        </div>
      )}

      {role === UserRole.ADMIN && !isVerifyingAdmin && !isServerAdminVerified && (
        <div className="p-12 bg-red-950/20 border border-red-500/35 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
          <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />
          <h4 className="text-sm font-extrabold uppercase font-mono text-red-400 tracking-wider">Security Access Alert: Unauthorized Elevation Blocked</h4>
          <p className="text-xs text-red-200/60 max-w-md leading-relaxed font-sans">
            Your client-side role status is listed as <span className="font-mono text-red-400 font-bold bg-red-500/10 px-1 py-0.5 rounded">ADMIN</span>, but server-side authorization failed or your email address does not belong to verified ApnaGhar system domains.
          </p>
          <div className="p-4 bg-red-950 border border-red-500/20 rounded-xl text-[10px] font-mono text-red-400 max-w-sm text-left space-y-1 shadow-md">
            <div>STATUS: 403 Forbidden</div>
            <div>AUDIT: Non-Admin Email Login Signature/Tampering Detected</div>
          </div>
        </div>
      )}

      {role === UserRole.ADMIN && !isVerifyingAdmin && isServerAdminVerified && (
        <div className="space-y-6">
          
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'System Properties', val: properties.length, desc: 'Across Residential, Commercial', color: 'text-indigo-600' },
              { label: 'Unverified queue', val: properties.filter(p => p.status === 'PENDING').length, desc: 'Actions pending approval', color: 'text-amber-500' },
              { label: 'Platform Users', val: '142 Contacts', desc: 'Simulated brokers & guests', color: 'text-emerald-600' },
              { label: 'Visit Audits Dues', val: bookings.length, desc: 'Tour appointments requested', color: 'text-red-500' }
            ].map((card, idx) => (
              <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">{card.label}</span>
                <span className={`text-2xl font-black mt-1 block ${card.color}`}>{card.val}</span>
                <span className="text-[9px] text-slate-400 mt-1 block leading-normal">{card.desc}</span>
              </div>
            ))}
          </div>

          {/* REPORTS & PLATFORM HEALTH OBSERVATORY */}
          {(() => {
            const totalProps = properties.length;
            const approvedProps = properties.filter(p => p.status === 'APPROVED').length;
            const pendingProps = properties.filter(p => p.status === 'PENDING').length;
            const totalBks = bookings.length;
            const totalUsrs = usersList.length || 142;

            // Generate 6 months of historical metrics up to June 2026
            const monthlyReportsData = [
              {
                month: 'Jan 26',
                revenueSub: Math.floor(totalUsrs * 110) + 10000,
                revenueAd: Math.floor(approvedProps * 1200) + 7000,
                revenueComm: Math.floor(totalBks * 1800) + 12000,
                approvedListings: Math.floor(approvedProps * 0.3) + 3,
                pendingListings: Math.floor(pendingProps * 0.2) + 1,
                activeUsers: Math.floor(totalUsrs * 0.5) + 30,
                siteVisits: Math.floor(totalBks * 0.3) + 8,
                inquiries: Math.floor(totalBks * 0.4) + 15,
              },
              {
                month: 'Feb 26',
                revenueSub: Math.floor(totalUsrs * 120) + 12000,
                revenueAd: Math.floor(approvedProps * 1400) + 8500,
                revenueComm: Math.floor(totalBks * 2000) + 15000,
                approvedListings: Math.floor(approvedProps * 0.45) + 6,
                pendingListings: Math.floor(pendingProps * 0.4) + 2,
                activeUsers: Math.floor(totalUsrs * 0.58) + 35,
                siteVisits: Math.floor(totalBks * 0.45) + 10,
                inquiries: Math.floor(totalBks * 0.5) + 20,
              },
              {
                month: 'Mar 26',
                revenueSub: Math.floor(totalUsrs * 135) + 14000,
                revenueAd: Math.floor(approvedProps * 1600) + 10000,
                revenueComm: Math.floor(totalBks * 2200) + 19000,
                approvedListings: Math.floor(approvedProps * 0.6) + 10,
                pendingListings: Math.floor(pendingProps * 0.5) + 2,
                activeUsers: Math.floor(totalUsrs * 0.65) + 42,
                siteVisits: Math.floor(totalBks * 0.58) + 14,
                inquiries: Math.floor(totalBks * 0.7) + 28,
              },
              {
                month: 'Apr 26',
                revenueSub: Math.floor(totalUsrs * 150) + 17500,
                revenueAd: Math.floor(approvedProps * 1850) + 12500,
                revenueComm: Math.floor(totalBks * 2500) + 22500,
                approvedListings: Math.floor(approvedProps * 0.75) + 14,
                pendingListings: Math.floor(pendingProps * 0.7) + 4,
                activeUsers: Math.floor(totalUsrs * 0.72) + 55,
                siteVisits: Math.floor(totalBks * 0.7) + 20,
                inquiries: Math.floor(totalBks * 0.95) + 36,
              },
              {
                month: 'May 26',
                revenueSub: Math.floor(totalUsrs * 170) + 20000,
                revenueAd: Math.floor(approvedProps * 2100) + 15500,
                revenueComm: Math.floor(totalBks * 2800) + 27000,
                approvedListings: Math.floor(approvedProps * 0.9) + 19,
                pendingListings: Math.floor(pendingProps * 0.8) + 5,
                activeUsers: Math.floor(totalUsrs * 0.8) + 72,
                siteVisits: Math.floor(totalBks * 0.85) + 26,
                inquiries: Math.floor(totalBks * 1.2) + 48,
              },
              {
                month: 'Jun 26',
                revenueSub: Math.floor(totalUsrs * 190) + 23000,
                revenueAd: Math.floor(approvedProps * 2300) + 19000,
                revenueComm: Math.floor(totalBks * 3200) + 31000,
                approvedListings: approvedProps,
                pendingListings: pendingProps,
                activeUsers: Math.floor(totalUsrs * 0.88) + 88,
                siteVisits: totalBks,
                inquiries: Math.floor(totalBks * 1.4) + 58,
              }
            ];

            const latestM = monthlyReportsData[5];
            const revSub = latestM.revenueSub;
            const revAd = latestM.revenueAd;
            const revComm = latestM.revenueComm;
            const currentTotalRev = revSub + revAd + revComm;

            const handleExportCSV = () => {
              const headers = ['Month', 'Subscription Revenue (INR)', 'Ad & Premium Revenue (INR)', 'Deals Commission (INR)', 'Approved ListingsCount', 'Pending ListingsCount', 'Active Portal Users', 'Completed Audits/Visits', 'Inquiries Filed'];
              const rows = monthlyReportsData.map(d => [
                d.month,
                d.revenueSub,
                d.revenueAd,
                d.revenueComm,
                d.approvedListings,
                d.pendingListings,
                d.activeUsers,
                d.siteVisits,
                d.inquiries
              ]);
              const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `ApnaGhar-Activity-Report-${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };

            const handleExportPDF = () => {
              const doc = new jsPDF();
              
              // Frame header
              doc.setFillColor(15, 23, 42);
              doc.rect(0, 0, 210, 35, 'F');
              
              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(20);
              doc.setTextColor(255, 255, 255);
              doc.text('ApnaGhar BI Observatory Report', 15, 18);
              
              doc.setFont('Helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(156, 163, 175);
              doc.text(`Level 4 Execution Metrics • Generated ${new Date().toLocaleDateString('en-IN')}`, 15, 26);

              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(11);
              doc.setTextColor(79, 70, 229);
              doc.text('1. GLOBAL COMPLIANCE SUMMARY LISTING', 15, 48);
              
              doc.setFont('Helvetica', 'normal');
              doc.setFontSize(9.5);
              doc.setTextColor(51, 65, 85);
              doc.text(`* Live System Catalog Listings:  ${properties.length} Active properties`, 20, 56);
              doc.text(`* Audits / Home Site-Visits scheduled:  ${bookings.length} Open requests`, 20, 62);
              doc.text(`* Total compliance pending reviews:  ${properties.filter(p => p.status === 'PENDING').length} listings`, 20, 68);
              doc.text(`* Total unique sandbox users logging activity:  ${totalUsrs} active accounts`, 20, 74);

              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(11);
              doc.setTextColor(79, 70, 229);
              doc.text('2. SIX-MONTHS HISTORICAL ANALYTICS AND REVENUE STREAMS', 15, 88);

              let y = 98;
              doc.setFillColor(241, 245, 249);
              doc.rect(15, y - 5, 180, 7, 'F');
              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(15, 23, 42);
              doc.text('Month', 17, y);
              doc.text('Subscription Rev', 35, y);
              doc.text('Ads Banner Rev', 70, y);
              doc.text('Commission', 105, y);
              doc.text('Approved Lst', 138, y);
              doc.text('Visits Log', 165, y);
              doc.text('Inquiries', 181, y);

              doc.setFont('Helvetica', 'normal');
              doc.setFontSize(8.5);
              doc.setTextColor(71, 85, 105);
              monthlyReportsData.forEach(d => {
                y += 8;
                doc.text(d.month, 17, y);
                doc.text(`Rs. ${d.revenueSub.toLocaleString()}`, 35, y);
                doc.text(`Rs. ${d.revenueAd.toLocaleString()}`, 70, y);
                doc.text(`Rs. ${d.revenueComm.toLocaleString()}`, 105, y);
                doc.text(`${d.approvedListings}`, 138, y);
                doc.text(`${d.siteVisits}`, 165, y);
                doc.text(`${d.inquiries}`, 181, y);
                
                doc.setDrawColor(241, 245, 249);
                doc.line(15, y + 2, 195, y + 2);
              });

              // Bottom copyright stamp
              doc.setFont('Helvetica', 'oblique');
              doc.setFontSize(7.5);
              doc.setTextColor(156, 163, 175);
              doc.text('© ApnaGhar Technologies Inc. This output comprises system confidential audit logs.', 15, y + 15);
              doc.save(`ApnaGhar_BI_Analytics_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
            };

            // Formatter for Currency
            const formatRev = (val: number) => {
              return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              }).format(val);
            };

            const CustomTooltipElement = ({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                return (
                  <div className="p-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl text-white font-sans text-xs space-y-1">
                    <p className="font-mono font-bold text-indigo-400">{label}</p>
                    <div className="h-px bg-white/10 my-1" />
                    {payload.map((entry: any, index: number) => (
                      <p key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="opacity-80">{entry.name}:</span>
                        <span className="font-mono font-bold">
                          {entry.name.includes('Revenue') ? formatRev(entry.value) : entry.value}
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            };

            return (
              <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800 dark:text-white space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="p-1 px-2 mb-0.5 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-mono text-[9px] font-extrabold uppercase border border-indigo-500/20">
                        BI Reports
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-350 font-mono font-bold uppercase tracking-wider block">
                        ApnaGhar Business Intelligence
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5 mt-0.5">
                      <Activity className="h-4.5 w-4.5 text-indigo-500" />
                      Reports & Platform Health Observatory
                    </h3>
                  </div>

                  {/* Reports Select Subtabs & Export Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setActiveReportTab('revenue')}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${activeReportTab === 'revenue' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Monthly Revenue
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReportTab('properties')}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${activeReportTab === 'properties' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Listing Growth
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReportTab('activity')}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${activeReportTab === 'activity' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Traffic & Activity
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer select-none"
                        title="Download raw report as Excel-compatible CSV list"
                      >
                        <Download className="h-3 w-3" />
                        CSV Export
                      </button>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-sm transition-all flex items-center gap-1 cursor-pointer select-none"
                        title="Compile and save beautifully aligned PDF analytical brief"
                      >
                        <Download className="h-3 w-3" />
                        PDF BRIEF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main visualization container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left visualization block (2 columns span) */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="h-[280px] w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        {activeReportTab === 'revenue' ? (
                          <AreaChart data={monthlyReportsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4338ca" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4338ca" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorAd" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.1} />
                            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#888888" strokeOpacity={0.5} />
                            <YAxis tickFormatter={(v) => `₹${v/1000}k`} tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#888888" strokeOpacity={0.5} />
                            <Tooltip content={<CustomTooltipElement />} />
                            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'sans-serif' }} />
                            <Area type="monotone" name="Subscription Revenue" dataKey="revenueSub" stroke="#4338ca" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
                            <Area type="monotone" name="Ad & Premium Banner" dataKey="revenueAd" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorAd)" />
                            <Area type="monotone" name="Deals Commission" dataKey="revenueComm" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComm)" />
                          </AreaChart>
                        ) : activeReportTab === 'properties' ? (
                          <BarChart data={monthlyReportsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.1} />
                            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#888888" strokeOpacity={0.5} />
                            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#888888" strokeOpacity={0.5} />
                            <Tooltip content={<CustomTooltipElement />} />
                            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'sans-serif' }} />
                            <Bar name="Approved Listings" dataKey="approvedListings" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar name="Pending Compliance" dataKey="pendingListings" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        ) : (
                          <LineChart data={monthlyReportsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.1} />
                            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#888888" strokeOpacity={0.5} />
                            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#888888" strokeOpacity={0.5} />
                            <Tooltip content={<CustomTooltipElement />} />
                            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'sans-serif' }} />
                            <Line type="monotone" name="Active Portal Members" dataKey="activeUsers" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
                            <Line type="monotone" name="Completed Visits" dataKey="siteVisits" stroke="#ef4444" strokeWidth={2.5} />
                            <Line type="monotone" name="Inquiries Filed" dataKey="inquiries" stroke="#3b82f6" strokeWidth={2.5} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right segment: KPIs & Platform Performance card */}
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-500/10 rounded-2xl flex flex-col justify-between h-full space-y-4">
                      <div>
                        <span className="text-[9px] font-mono font-black text-indigo-500 uppercase tracking-widest block">Executive KPI Indicator</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Total Dynamic Revenue (YTD)</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-black font-sans text-indigo-700 dark:text-indigo-400">{formatRev(currentTotalRev)}</span>
                          <span className="text-[10px] font-mono font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                            +18.4%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          Combined summation of active brokerage subscriptions, featured agency promotional banners, and site audit dues commissions.
                        </p>
                      </div>

                      <div className="h-px bg-slate-200/60 dark:bg-white/5" />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl">
                          <span className="text-[8px] font-mono text-slate-400 uppercase font-bold block">Ad Click CTR</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">4.82%</span>
                          <span className="text-[8px] text-emerald-500 block">▲ Lead Rate Optimum</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl">
                          <span className="text-[8px] font-mono text-slate-400 uppercase font-bold block">Inquiry Velocity</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">8.4 / Prop</span>
                          <span className="text-[8px] text-slate-400 block">Across standard tiers</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white/40 dark:bg-black/20 rounded-xl flex items-center gap-2 border dark:border-white/5">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-bold block leading-none">Automatic Audit Routine</span>
                          <span className="text-[8px] text-slate-400 block mt-0.5">Next billing iteration cycle in 14 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Admin Amenities Offerings Control Panel */}
          <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800 dark:text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Amenities Offerings Controller
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block mt-0.5">
                  Dynamic master catalog configured by administrators and consumed pan-India during listing and filtering
                </span>
              </div>
              
              <form onSubmit={handleAddAmenity} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New amenity name..."
                  value={newAmenityLabel}
                  onChange={(e) => setNewAmenityLabel(e.target.value)}
                  className="bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Create</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {adminAmenities.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    item.active
                      ? 'bg-emerald-500/[0.02] border-slate-200/80 dark:border-white/5 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/20 border-slate-200/50 dark:border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {editingAmenityId === item.id ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            type="text"
                            value={editingAmenityLabel}
                            onChange={(e) => setEditingAmenityLabel(e.target.value)}
                            className="bg-white border border-slate-300 dark:bg-slate-950 dark:border-white/10 rounded-lg px-2 py-0.5 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-blue-500 w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateAmenityLabel(item.id)}
                            className="text-emerald-600 hover:text-emerald-700 p-1"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAmenityId(null)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate text-slate-900 dark:text-white">
                            {item.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAmenityId(item.id);
                              setEditingAmenityLabel(item.label);
                            }}
                            className="text-[9px] text-blue-500 hover:text-blue-600 font-mono bg-blue-500/5 px-1.5 py-0.5 rounded-md hover:bg-blue-500/10"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      <span className="text-[9px] font-mono text-slate-400 block mt-1">ID: {item.id}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAmenity(item.id, item.active)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all ${
                          item.active
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-200/50 text-slate-500 border-slate-300/30 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-white/5 dark:hover:bg-slate-900'
                        }`}
                      >
                        {item.active ? 'Active' : 'Disabled'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteAmenity(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                        title="Delete Amenity"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {adminAmenities.length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-slate-400">
                  No amenities found. Use the form above to initialize customized listings attributes.
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Property Moderation Table with local sub-tabs */}
          <div className="backdrop-blur-md bg-white/70 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">ApnaGhar Property Moderation Table</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block mt-0.5">Audit compliance logs, bulk validation states, and rejection trail tracking</span>
              </div>


              {/* Sub-tabs menu selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('pending')}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${adminActiveSubTab === 'pending' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-600'}`}
                >
                  Pending Approval Properties ({properties.filter(p => p.status === 'PENDING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('moderated')}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${adminActiveSubTab === 'moderated' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Moderated Listings ({properties.filter(p => p.status !== 'PENDING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminActiveSubTab('logs')}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${adminActiveSubTab === 'logs' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Compliance Audit Logs ({properties.reduce((acc, p) => acc + (p.auditHistory?.length || 0), 0)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminActiveSubTab('promotions');
                    fetchPromos();
                  }}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${adminActiveSubTab === 'promotions' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Promotions & Ads ({adminPromos.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminActiveSubTab('diagnostics');
                    fetchDiagnostics();
                  }}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${adminActiveSubTab === 'diagnostics' ? 'bg-white block text-slate-900 dark:bg-slate-900 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ⚡ Persistent DB Diagnostics
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Sub-tab 1: PENDING QUEUE */}
              {adminActiveSubTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Pending Approval Explanatory Section Banner */}
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                  <div className="text-indigo-400 text-lg select-none">📋</div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Properties Pending Approval</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                      The listings explicitly detailed below have been newly submitted or edited and remain in a restricted <strong>'PENDING'</strong> status. They are entirely hidden from public searches and map views until verified by an administrator. Please use the <strong>Approve</strong> or <strong>Reject</strong> action buttons below to update status.
                    </p>
                  </div>
                </div>

                {/* Multi-Select Utility Header bar */}
                {properties.filter(p => p.status === 'PENDING').length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-white/5 rounded-2xl flex items-center gap-3 shadow-sm">
                    <input
                      type="checkbox"
                      id="select-all-pending"
                      checked={
                        properties.filter(p => p.status === 'PENDING').every(p => selectedPropIds.includes(p.id)) &&
                        properties.filter(p => p.status === 'PENDING').length > 0
                      }
                      onChange={(e) => {
                        const pendingList = properties.filter(p => p.status === 'PENDING');
                        if (e.target.checked) {
                          setSelectedPropIds(prev => {
                            const next = [...prev];
                            pendingList.forEach(p => {
                              if (!next.includes(p.id)) next.push(p.id);
                            });
                            return next;
                          });
                        } else {
                          setSelectedPropIds(prev => prev.filter(id => !pendingList.some(p => p.id === id)));
                        }
                      }}
                      className="h-4 w-4 bg-white/5 text-emerald-600 border-slate-300 dark:border-white/10 rounded focus:ring-emerald-500 hover:border-slate-400 cursor-pointer transition-all"
                    />
                    <label htmlFor="select-all-pending" className="text-[10px] font-black pointer-events-auto cursor-pointer select-none uppercase font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                      Select All Pending Audit Queue Listings ({properties.filter(p => p.status === 'PENDING').length})
                    </label>
                  </div>
                )}

                <div className="space-y-3">
                  {properties.filter(p => p.status === 'PENDING').length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                      <div className="text-emerald-500 text-lg mb-1">🎉</div>
                      <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-350 tracking-wider">All Listings Approved</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Excellent! No property broker submissions are waiting in the audit queue.</p>
                    </div>
                  ) : (
                    properties.filter(p => p.status === 'PENDING').map(p => (
                      <div key={p.id} className={`p-4 bg-white dark:bg-slate-950/40 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-350 dark:hover:border-white/10 transition-all ${selectedPropIds.includes(p.id) ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-inner' : 'dark:border-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPropIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPropIds(prev => [...prev, p.id]);
                              } else {
                                setSelectedPropIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                            className="h-4 w-4 text-emerald-600 bg-white/5 border-slate-300 dark:border-white/10 rounded focus:ring-emerald-500 hover:border-slate-400 cursor-pointer shrink-0 transition-all"
                          />
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} className="w-11 h-11 object-cover rounded-lg bg-slate-100 shrink-0" />
                          <div className="text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h4>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-mono font-black border uppercase tracking-wider bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-ping mr-0.5" />
                                PENDING AUDIT
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Listed by <strong>{p.ownerName}</strong> ({p.ownerId}) • {p.location?.city || 'N/A'} • {formatINR(p.price)}</p>
                            
                            {p.auditHistory && p.auditHistory.length > 0 && (
                              <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-white/5 space-y-1.5 max-w-xl">
                                <span className="text-[8.5px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-wider font-mono block">🛡️ Moderation History Audit Log:</span>
                                {p.auditHistory.map((log: any, i: number) => (
                                  <div key={log.id || i} className="text-[9px] text-slate-500 dark:text-slate-400 font-sans border-l-2 border-indigo-550/40 pl-2 py-0.5 leading-normal">
                                    <strong>{log.changedBy}</strong> updated status from <span className="font-mono text-[8.5px] bg-slate-200/50 dark:bg-slate-800 px-1 py-0.2 rounded font-bold">{log.fromStatus}</span> to <span className="font-mono text-[8.5px] bg-slate-200/50 dark:bg-slate-800 px-1 py-0.2 rounded font-bold">{log.toStatus}</span> on {new Date(log.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                    {log.notes && <p className="italic text-[8.5px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Reason: "{log.notes}"</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdatePropertyStatus(p.id, 'APPROVED')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1 cursor-pointer hover:shadow-lg shadow-emerald-600/10"
                          >
                            <Check className="h-4 w-4" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectionModalProperty(p);
                              setRejectionNotesInput('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1 cursor-pointer hover:shadow-lg shadow-red-600/10"
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProperty?.(p)}
                            className="p-1.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer hover:text-blue-600 transition-all flex items-center justify-center"
                            title="Edit listing details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Are you absolutely sure you want to delete this property?")) {
                                onDeleteProperty(p.id);
                              }
                            }}
                            className="p-1.5 px-3 bg-slate-100 dark:bg-slate-900 hover:bg-red-100 dark:hover:bg-red-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer hover:text-red-600 transition-all flex items-center justify-center"
                            title="Delete listing"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Sub-tab 2: MODERATED LISTINGS */}
            {adminActiveSubTab === 'moderated' && (
              <motion.div
                key={`moderated-${adminStatusFilter}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Visual filter Pills for Moderated listings */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded text-slate-400 dark:text-slate-500 font-black">Sort Archive Status:</span>
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('ALL')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${adminStatusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                  >
                    🗂️ All Audited ({properties.filter(p => p.status !== 'PENDING').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('APPROVED')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${adminStatusFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                  >
                    ✅ Approved ({properties.filter(p => p.status === 'APPROVED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminStatusFilter('REJECTED')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${adminStatusFilter === 'REJECTED' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                  >
                    ❌ Rejected ({properties.filter(p => p.status === 'REJECTED').length})
                  </button>
                </div>

                <div className="overflow-x-auto text-slate-800">
                  {properties.filter(p => p.status !== 'PENDING').filter(p => adminStatusFilter === 'ALL' || p.status === adminStatusFilter).length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                      <div className="text-slate-400 text-lg mb-1">📋</div>
                      <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">No {adminStatusFilter !== 'ALL' ? adminStatusFilter : ''} Listings Found</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Properties matching this compliance audit filter will appear in this list.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-2 w-8">
                            <input
                              type="checkbox"
                              checked={
                                properties.filter(p => p.status !== 'PENDING').filter(p => adminStatusFilter === 'ALL' || p.status === adminStatusFilter).length > 0 &&
                                properties.filter(p => p.status !== 'PENDING').filter(p => adminStatusFilter === 'ALL' || p.status === adminStatusFilter).every(p => selectedPropIds.includes(p.id))
                              }
                              onChange={(e) => {
                                const filtered = properties.filter(p => p.status !== 'PENDING').filter(p => adminStatusFilter === 'ALL' || p.status === adminStatusFilter);
                                if (e.target.checked) {
                                  setSelectedPropIds(prev => {
                                    const next = [...prev];
                                    filtered.forEach(p => {
                                      if (!next.includes(p.id)) next.push(p.id);
                                    });
                                    return next;
                                  });
                                } else {
                                  setSelectedPropIds(prev => prev.filter(id => !filtered.some(p => p.id === id)));
                                }
                              }}
                              className="h-4 w-4 bg-white/5 text-emerald-600 border-slate-300 dark:border-white/10 rounded focus:ring-emerald-500 hover:border-slate-400 cursor-pointer transition-all"
                            />
                          </th>
                          <th className="py-3 px-2">Property Listing</th>
                          <th className="py-3 px-2">Broker Name</th>
                          <th className="py-3 px-2">Location</th>
                          <th className="py-3 px-2">Price Value</th>
                          <th className="py-3 px-2">Validation Status</th>
                          <th className="py-3 px-2">Notes & Audits</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                        {properties
                          .filter(p => p.status !== 'PENDING')
                          .filter(p => adminStatusFilter === 'ALL' || p.status === adminStatusFilter)
                          .map(p => (
                            <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${selectedPropIds.includes(p.id) ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''}`}>
                              <td className="py-3 px-2 w-8">
                                <input
                                  type="checkbox"
                                  checked={selectedPropIds.includes(p.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPropIds(prev => [...prev, p.id]);
                                    } else {
                                      setSelectedPropIds(prev => prev.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="h-4 w-4 bg-white/5 text-emerald-600 border-slate-300 dark:border-white/10 rounded focus:ring-emerald-500 hover:border-slate-400 cursor-pointer transition-all shrink-0"
                                />
                              </td>
                              <td className="py-3 px-2 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} className="w-8 h-8 object-cover rounded shrink-0" />
                                <span className="truncate max-w-[140px]">{p.title}</span>
                              </td>
                              <td className="py-3 px-2 text-slate-600 dark:text-slate-350">{p.ownerName}</td>
                              <td className="py-3 px-2 font-mono text-slate-500">{p.location?.city || 'N/A'}</td>
                              <td className="py-3 px-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatINR(p.price)}</td>
                              <td className="py-3 px-2 font-sans">
                                {p.status === 'APPROVED' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black border uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    APPROVED
                                  </span>
                                )}
                                {p.status === 'REJECTED' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black border uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                    REJECTED
                                  </span>
                                )}
                                {p.status !== 'APPROVED' && p.status !== 'REJECTED' && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black border uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                                    {p.status}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2 font-sans">
                                {p.auditHistory && p.auditHistory.length > 0 ? (
                                  <div className="space-y-1 max-w-[200px] text-left">
                                    {p.auditHistory.slice(0, 2).map((log: any, i: number) => (
                                      <div key={log.id || i} className="text-[9px] border-l-2 border-indigo-500/40 pl-1.5 py-0.2 leading-tight text-slate-500 dark:text-slate-400">
                                        <span className="font-bold">{log.changedBy}</span>: <span className="text-[8.5px] italic text-slate-400 dark:text-slate-500">"{log.notes || 'No comments'}"</span>
                                      </div>
                                    ))}
                                    {p.auditHistory.length > 2 && (
                                      <span className="text-[8px] text-slate-400 block font-bold">+ {p.auditHistory.length - 2} more audit changes</span>
                                    )}
                                  </div>
                                ) : p.moderationNotes ? (
                                  <span className="text-red-400 dark:text-red-300 font-mono italic block truncate max-w-[150px]" title={p.moderationNotes}>
                                    "{p.moderationNotes}"
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {p.status !== 'APPROVED' && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdatePropertyStatus(p.id, 'APPROVED')}
                                      className="px-2 py-1 select-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] uppercase rounded border border-emerald-500/25 cursor-pointer transition-colors"
                                      title="Publish Listing to LIVE"
                                    >
                                      Publish
                                    </button>
                                  )}
                                  {p.status !== 'REJECTED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectionModalProperty(p);
                                        setRejectionNotesInput('');
                                      }}
                                      className="px-2 py-1 select-none bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-extrabold text-[9px] uppercase rounded border border-red-500/25 cursor-pointer transition-colors"
                                      title="Reject/Unpublish Listing"
                                    >
                                      Reject
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onEditProperty?.(p)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-55 dark:hover:bg-blue-950/20 rounded cursor-pointer transition-colors"
                                    title="Edit Listing Details"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('Are you absolutely sure you want to delete this listing?')) {
                                        onDeleteProperty(p.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition-colors"
                                    title="Delete Listing"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {/* Sub-tab 3: AUDIT LOG TIMELINE */}
            {adminActiveSubTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-sans">
                  🛡️ This compliance log database captures all live status changes, original to target states, rejection details, and identity stamps of auditing administrators.
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-2">Audit Timestamp</th>
                        <th className="py-3 px-2">Audited Property</th>
                        <th className="py-3 px-2">Compliance Action</th>
                        <th className="py-3 px-2">Authorized Admin</th>
                        <th className="py-3 px-2">Compliance Auditing Notes / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                      {properties.flatMap(p => (p.auditHistory || []).map(entry => ({ ...entry, propertyTitle: p.title }))).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-mono text-[10px]">
                            No manual audit transitions or logs have been recorded yet.
                          </td>
                        </tr>
                      ) : (
                        properties
                          .flatMap(p => (p.auditHistory || []).map(entry => ({ ...entry, propertyTitle: p.title })))
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2 font-mono text-slate-500">
                                {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}
                              </td>
                              <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">
                                {log.propertyTitle}
                              </td>
                              <td className="py-3 px-2">
                                <span className="flex items-center gap-1 font-mono text-[9px] font-bold">
                                  <span className="text-slate-400">{log.fromStatus}</span>
                                  <span className="text-slate-400">➔</span>
                                  <span className={
                                    log.toStatus === 'APPROVED' ? 'text-emerald-500 font-black' :
                                    log.toStatus === 'REJECTED' ? 'text-red-500 font-black' : 'text-slate-400'
                                  }>{log.toStatus}</span>
                                </span>
                              </td>
                              <td className="py-3 px-2 font-sans font-bold text-slate-700 dark:text-slate-350">
                                👤 {log.changedBy}
                              </td>
                              <td className="py-3 px-2 text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                {log.notes ? `"${log.notes}"` : <span className="text-slate-400">No context notes</span>}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Sub-tab 4: PROMOTIONS & ADS MANAGEMENT */}
            {adminActiveSubTab === 'promotions' && (
              <motion.div
                key="promotions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-3xl">
                  <div>
                    <h4 className="text-xs font-black uppercase font-mono text-slate-800 dark:text-white">Active Promotional Real Estate Campaigns</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                      Publish custom featured slides, seasonal offers, and advertisements displayed in major hero section sliders.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPromoId(null);
                      setPromoFormErrors({});
                      setPromoForm({
                        title: '',
                        description: '',
                        type: 'OFFER',
                        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000',
                        badge: 'LIMITED DEAL',
                        linkUrl: '#',
                        expiryDate: '',
                        active: true
                      });
                      setIsPromoFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-black uppercase rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Campaign Banner
                  </button>
                </div>

                {isPromoFormOpen && (
                  <form onSubmit={handleSavePromo} className="p-5 bg-white border border-slate-200 dark:bg-slate-950/70 dark:border-white/15 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2 mb-2">
                      <span className="text-[10px] uppercase font-mono font-black text-indigo-500">
                        {editingPromoId ? `Editing Banner ID: ${editingPromoId}` : 'Create Brand New Promotional Banner'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPromoFormOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {Object.keys(promoFormErrors).length > 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-bold text-red-500 flex flex-col gap-1">
                        ⚠️ Please correct the form validation errors listed below.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Campaign Title</label>
                        <input
                          type="text"
                          required
                          value={promoForm.title || ''}
                          onChange={e => {
                            setPromoForm({ ...promoForm, title: e.target.value });
                            if (promoFormErrors.title) {
                              setPromoFormErrors({ ...promoFormErrors, title: undefined });
                            }
                          }}
                          placeholder="e.g. Monsoon Premium Housing Fest 2026"
                          className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs ${
                            promoFormErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-white/10'
                          }`}
                        />
                        {promoFormErrors.title && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">{promoFormErrors.title}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Campaign Type</label>
                        <select
                          value={promoForm.type || 'OFFER'}
                          onChange={e => setPromoForm({ ...promoForm, type: e.target.value as any })}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-white [&>option]:bg-slate-900"
                        >
                          <option value="PROMOTIONAL">PROMOTIONAL</option>
                          <option value="FEATURED">FEATURED</option>
                          <option value="OFFER">OFFER</option>
                          <option value="ADVERTISEMENT">ADVERTISEMENT</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Description / Subtext</label>
                        <textarea
                          required
                          value={promoForm.description || ''}
                          rows={2}
                          onChange={e => setPromoForm({ ...promoForm, description: e.target.value })}
                          placeholder="Provide the complete marketing copy, details, pricing waivers, or discount structure..."
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">High-Res Image URL</label>
                        <input
                          type="text"
                          required
                          value={promoForm.imageUrl || ''}
                          onChange={e => {
                            setPromoForm({ ...promoForm, imageUrl: e.target.value });
                            if (promoFormErrors.imageUrl) {
                              setPromoFormErrors({ ...promoFormErrors, imageUrl: undefined });
                            }
                          }}
                          placeholder="https://images.unsplash.com/..."
                          className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs ${
                            promoFormErrors.imageUrl ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-white/10'
                          }`}
                        />
                        {promoFormErrors.imageUrl && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">{promoFormErrors.imageUrl}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[
                            { name: 'Luxury Apt', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000' },
                            { name: 'Modern Sky', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000' },
                            { name: 'Corporate Building', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000' }
                          ].map(opt => (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => {
                                setPromoForm({ ...promoForm, imageUrl: opt.url });
                                if (promoFormErrors.imageUrl) {
                                  setPromoFormErrors({ ...promoFormErrors, imageUrl: undefined });
                                }
                              }}
                              className="text-[9px] font-mono p-1 px-1.5 border dark:border-white/10 rounded hover:bg-indigo-500 hover:text-white cursor-pointer"
                            >
                              ✨ {opt.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Badge/Tag Label (e.g. 50% OFF)</label>
                        <input
                          type="text"
                          value={promoForm.badge || ''}
                          onChange={e => setPromoForm({ ...promoForm, badge: e.target.value })}
                          placeholder="e.g. SPL OFFER, BROKERAGE WAIVER"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Redirect Link Query / Direct Search Filter</label>
                        <input
                          type="text"
                          value={promoForm.linkUrl || ''}
                          onChange={e => setPromoForm({ ...promoForm, linkUrl: e.target.value })}
                          placeholder="e.g. filter:city:Mumbai or filter:category:RESIDENTIAL"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[
                            { name: 'Mumbai Only', val: 'filter:city:Mumbai' },
                            { name: 'Bengaluru Only', val: 'filter:city:Bengaluru' },
                            { name: 'Residential', val: 'filter:category:RESIDENTIAL' },
                            { name: 'Commercial', val: 'filter:category:COMMERCIAL' },
                            { name: 'For Rent', val: 'filter:purpose:RENT' },
                            { name: 'For Buying', val: 'filter:purpose:SELL' },
                            { name: 'BHK/Villas', val: 'filter:search:Villa' }
                          ].map(opt => (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => setPromoForm({ ...promoForm, linkUrl: opt.val })}
                              className={`text-[8.5px] font-mono p-1 px-1.5 border rounded cursor-pointer transition-colors ${
                                promoForm.linkUrl === opt.val
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                                  : 'dark:border-white/10 text-slate-400 dark:text-slate-300 hover:bg-indigo-500 hover:text-white'
                              }`}
                            >
                              🎯 {opt.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Offer Expiry Date (Optional)</label>
                        <input
                          type="date"
                          value={promoForm.expiryDate || ''}
                          onChange={e => {
                            setPromoForm({ ...promoForm, expiryDate: e.target.value });
                            if (promoFormErrors.expiryDate) {
                              setPromoFormErrors({ ...promoFormErrors, expiryDate: undefined });
                            }
                          }}
                          className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs text-slate-800 dark:text-white ${
                            promoFormErrors.expiryDate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-white/10'
                          }`}
                        />
                        {promoFormErrors.expiryDate && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">{promoFormErrors.expiryDate}</p>
                        )}
                        <p className="text-[9px] text-slate-400 mt-0.5">Expired promotions are automatically hidden from client landing sliders.</p>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="active-campaign"
                          checked={!!promoForm.active}
                          onChange={e => setPromoForm({ ...promoForm, active: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <label htmlFor="active-campaign" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                          Active & Visible on home page slider immediately
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsPromoFormOpen(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-white/15 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {editingPromoId ? 'Update Campaign Details' : 'Publish Campaign Banner'}
                      </button>
                    </div>
                  </form>
                )}

                {isFetchingPromos ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-[10px] font-mono mt-2 uppercase">Fetching Campaign Listings...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/5 text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-2">Banner Picture</th>
                          <th className="py-3 px-2">Campaign Category</th>
                          <th className="py-3 px-2">Marketing Copy / Text</th>
                          <th className="py-3 px-2">Launch Badge</th>
                          <th className="py-3 px-2">Expiry Date</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                        {adminPromos.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-[10px]">
                              There are currently no campaign materials recorded in the repository. Click "New Campaign Banner" above to launch.
                            </td>
                          </tr>
                        ) : (
                          adminPromos.map(promo => (
                            <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2">
                                <img
                                  src={promo.imageUrl}
                                  alt={promo.title}
                                  className="w-16 h-10 object-cover rounded-lg border dark:border-white/10 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <span className={`p-1 px-2 text-[8px] font-black tracking-wider uppercase font-mono rounded-md ${
                                  promo.type === 'PROMOTIONAL' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                                  promo.type === 'FEATURED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                  promo.type === 'OFFER' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                }`}>
                                  {promo.type}
                                </span>
                              </td>
                              <td className="py-3 px-2 max-w-xs">
                                <p className="font-bold text-slate-800 dark:text-white line-clamp-1">{promo.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{promo.description}</p>
                              </td>
                              <td className="py-3 px-2 font-mono text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                {promo.badge || <span className="text-slate-400">-</span>}
                              </td>
                              <td className="py-3 px-2 font-mono text-[10px]">
                                {promo.expiryDate ? (
                                  (() => {
                                    const exp = new Date(promo.expiryDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const expired = exp < today;
                                    return (
                                      <span className={expired ? 'text-red-500 font-extrabold font-sans bg-red-500/15 border border-red-500/25 px-2 py-1 rounded-md text-[9px]' : 'text-slate-600 dark:text-slate-350 bg-slate-500/5 border border-slate-500/10 px-2 py-1 rounded-md text-[9px]'}>
                                        {expired ? '🚨 EXPIRED' : new Date(promo.expiryDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-slate-400 italic">No Expiry Limit</span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePromoActive(promo)}
                                  className={`p-1 px-2.5 text-[9px] font-black font-mono rounded-lg border transition-all cursor-pointer ${
                                    promo.active
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/25'
                                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/25'
                                  }`}
                                >
                                  {promo.active ? '● LIVE' : '○ DISABLED'}
                                </button>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEditPromoClick(promo)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Campaign"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePromo(promo.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Campaign"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {adminActiveSubTab === 'diagnostics' && (
              <motion.div
                key="diagnostics"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Diagnostics Header & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-3xl">
                  <div>
                    <h4 className="text-xs font-black uppercase font-mono text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Database Persistence & Connection Diagnostics Tracker
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed font-sans">
                      Verify that records are successfully written to disk. Inspect actual server-side file sizes, connection loops, and client-side syncs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchDiagnostics}
                    disabled={isFetchingDiagnostics}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 dark:bg-slate-900 border border-slate-700 hover:bg-slate-700 text-white font-mono text-[10px] font-black uppercase rounded-xl transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDiagnostics ? 'animate-spin' : ''}`} />
                    Refresh Telemetry
                  </button>
                </div>

                {diagnosticsError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-rose-500 uppercase font-mono">Telemetry Error</h4>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 leading-normal">
                        Failed to retrieve real-time diagnostic parameters from the server. Check backend network bindings.
                      </p>
                      <span className="text-[9px] font-mono block bg-rose-950/20 p-2 mt-2 rounded border border-rose-500/10 text-rose-500">
                        Code: {diagnosticsError}
                      </span>
                    </div>
                  </div>
                )}

                {isFetchingDiagnostics && !diagnosticsData ? (
                  <div className="flex flex-col items-center justify-center p-24 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <span className="text-[10px] font-mono mt-3 uppercase tracking-wider">Gathering Database Footprints & Telemetry...</span>
                  </div>
                ) : diagnosticsData ? (
                  <div className="space-y-6">
                    {/* Telemetry Core Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Technical Connection Info */}
                      <div className="p-5 bg-white border border-slate-200 dark:bg-slate-950/40 dark:border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-mono font-black tracking-widest block">Connection State</span>
                            <span className="text-xs font-black text-emerald-500 dark:text-emerald-400 uppercase">● Live & Online</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Database Engine:</span>
                            <span className="font-mono font-bold text-slate-750 dark:text-slate-300">{diagnosticsData.dbType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Active Location:</span>
                            <span className="font-mono text-slate-500 truncate max-w-[150px]" title={diagnosticsData.dbLocation}>{diagnosticsData.dbLocation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">File Exists:</span>
                            <span className="font-mono font-bold text-emerald-500">{diagnosticsData.fileExists ? 'YES (PERSISTED)' : 'NO'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Storage Size:</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {(diagnosticsData.fileSizeBytes / 1024).toFixed(2)} KB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">I/O Permissions:</span>
                            <span className="font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[8px]">
                              {diagnosticsData.filePermissions}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Collection Counts details */}
                      <div className="p-5 bg-white border border-slate-200 dark:bg-slate-950/40 dark:border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-mono font-black tracking-widest block">Total Records</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              {diagnosticsData.totalProperties} Properties Persisted
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[9px] font-mono">
                          <div className="p-1 px-2 border dark:border-white/5 bg-slate-500/5 rounded-xl">
                            <span className="text-slate-400 block font-sans">APPROVED</span>
                            <span className="text-xs font-black text-emerald-500 block">{diagnosticsData.propertyCountsByStatus?.APPROVED || 0}</span>
                          </div>
                          <div className="p-1 px-2 border dark:border-white/5 bg-slate-500/5 rounded-xl">
                            <span className="text-slate-400 block font-sans">PENDING</span>
                            <span className="text-xs font-black text-amber-500 block">{diagnosticsData.propertyCountsByStatus?.PENDING || 0}</span>
                          </div>
                          <div className="p-1 px-2 border dark:border-white/5 bg-slate-500/5 rounded-xl">
                            <span className="text-slate-400 block font-sans">SOLD/RENTED</span>
                            <span className="text-xs font-black text-indigo-400 block">
                              {(diagnosticsData.propertyCountsByStatus?.SOLD || 0) + (diagnosticsData.propertyCountsByStatus?.RENTED || 0)}
                            </span>
                          </div>
                          <div className="p-1 px-2 border dark:border-white/5 bg-slate-500/5 rounded-xl">
                            <span className="text-slate-400 block font-sans">REJECTED</span>
                            <span className="text-xs font-black text-red-500 block">{diagnosticsData.propertyCountsByStatus?.REJECTED || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Server Footprints details */}
                      <div className="p-5 bg-white border border-slate-200 dark:bg-slate-950/40 dark:border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-2xl">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-mono font-black tracking-widest block">Resource Footprint</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              Server Runtime Status
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Process Uptime:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {Math.floor(diagnosticsData.processUptimeSeconds / 60)} mins
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Active Heap Memory:</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {diagnosticsData.heapUsedMB} MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Bound RAM:</span>
                            <span className="font-mono font-bold text-slate-500">
                              {diagnosticsData.ramTotalAllocatedMB} MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Secure Audit Events:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {diagnosticsData.counts?.securityLogs || 0} events
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Critical Ephemeral Volume Warning Block */}
                    <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-start gap-3.5">
                      <ShieldAlert className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono font-black text-amber-500 tracking-wider">Cloud Hosting Ephemerality Warning Indicator</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-amber-400">Why do some listings revert on container restarts?</h4>
                        <p className="text-[10px] text-slate-650 dark:text-slate-400 leading-relaxed font-sans mt-1">
                          The ApnaGhar backend server resides on an enterprise <strong>Google Cloud Run container</strong>. These cloud instances are designed to scale-to-zero when quiet, or recycle during daily updates. Unless bound to a persistent cloud database, local files inside the disk (like <code>db.json</code>) are refreshed to original factory states upon recycle.
                        </p>
                        <div className="pt-2 text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal border-t border-amber-500/10 mt-1">
                          <strong className="text-slate-700 dark:text-slate-300">Built-in Resiliency:</strong> We have configured automatic local cache synchronization (<code>localStorage: apna_added_properties</code> reconciliation) in client-side widgets. If a container recycles, clients automatically submit their saved additions in the background to keep the remote database intact! For multi-user absolute durability, connect Firebase Firestore or PostgreSQL.
                        </div>
                      </div>
                    </div>

                    {/* Database Operations Audit Log Terminal */}
                    <div className="p-5 bg-slate-950 text-slate-300 rounded-3xl space-y-3.5 border border-slate-800/80 font-mono shadow-2xl">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                          <span>Real-time DB Operation Console logs ({diagnosticsData.serverLogs?.length || 0})</span>
                        </div>
                        <span className="text-[8.5px] text-indigo-400">Telemetry Live stdout</span>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2.5 text-[10px] leading-relaxed custom-scrollbar">
                        {diagnosticsData.serverLogs?.length === 0 ? (
                          <div className="py-8 text-center text-slate-500 italic">
                            No persistent operations captured since backend process start. Try creating, editing, or deleting a listing to capture logs here.
                          </div>
                        ) : (
                          diagnosticsData.serverLogs?.map((log: any, index: number) => (
                            <div key={index} className="flex flex-col md:flex-row md:items-start gap-1 py-1 px-1.5 hover:bg-white/5 rounded transition-all">
                              {/* Timestamp */}
                              <span className="text-slate-500 shrink-0 select-none">
                                [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                              </span>

                              {/* Action Tag */}
                              <span className={`px-1.5 font-bold rounded text-[8px] tracking-wide shrink-0 ${
                                log.action === 'CREATE' ? 'bg-indigo-900 text-indigo-300' :
                                log.action === 'DELETE' ? 'bg-rose-950 text-rose-300 border border-rose-900/40' :
                                log.action === 'UPDATE' ? 'bg-amber-950 text-amber-300 border border-amber-900/40' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {log.action}
                              </span>

                              {/* Status indicator */}
                              <span className={`font-bold shrink-0 ${log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                [{log.status}]
                              </span>

                              {/* Log Message */}
                              <span className="text-slate-350 dark:text-slate-200">
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-slate-50 dark:bg-slate-900 border dark:border-white/5 rounded-3xl">
                    <button
                      type="button"
                      onClick={fetchDiagnostics}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-black uppercase rounded-xl shadow-md cursor-pointer transition-colors"
                    >
                      Initialize System Telemetry Diagnostics
                    </button>
                    <p className="text-[9px] text-slate-500 mt-2 font-mono">Secured for Admin account check loop.</p>
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>

            {/* Local Modal for Single Property Rejection Reason */}
            {rejectionModalProperty && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2.5 bg-red-500/10 border border-red-500/25 text-red-400 font-mono text-[9px] font-extrabold rounded">
                        REJECTION DIALOG
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRejectionModalProperty(null)}
                      className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">Reason for rejecting listing:</h4>
                    <span className="text-[10px] font-black text-slate-400 block font-mono">{rejectionModalProperty.title}</span>
                  </div>

                  <textarea
                    rows={4}
                    value={rejectionNotesInput}
                    onChange={(e) => setRejectionNotesInput(e.target.value)}
                    placeholder="Provide a compliant reason (e.g. Broken links, pricing values are unrealistic, verification document is missing, etc.). This reason string is notified instantly to the listing broker."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500/50 leading-relaxed font-sans"
                  />

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectionModalProperty(null)}
                      className="w-1/2 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!rejectionNotesInput.trim()}
                      onClick={handleSingleRejectSubmit}
                      className="w-1/2 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-30 rounded-xl text-xs font-bold text-white shadow-xl shadow-red-500/10 cursor-pointer transition-all active:scale-95"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isBulkRejectModalOpen && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2.5 bg-red-500/10 border border-red-500/25 text-red-300 font-mono text-[9px] font-extrabold rounded">
                        BULK COMPLIANCE ACTION
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBulkRejectModalOpen(false)}
                      className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">Reason for bulk rejection:</h4>
                    <p className="text-[10px] text-slate-400 font-sans leading-snug">
                      This action will reject <strong>{selectedPropIds.length} properties</strong> currently selected.
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    value={bulkNotesInput}
                    onChange={(e) => setBulkNotesInput(e.target.value)}
                    placeholder="Enter compliance rejection reasons that will apply to all selected properties..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500/50 leading-relaxed font-sans"
                  />

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkRejectModalOpen(false)}
                      className="w-1/2 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!bulkNotesInput.trim()}
                      onClick={() => {
                        handleBulkApproveReject('REJECTED', bulkNotesInput);
                      }}
                      className="w-1/2 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-30 rounded-xl text-xs font-bold text-white shadow-xl shadow-red-500/10 cursor-pointer transition-all active:scale-95"
                    >
                      Reject All Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Local Modal for Bulk Properties Approval Confirmation */}
            {isBulkApproveModalOpen && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono text-[9px] font-extrabold rounded">
                        CONFIRM BULK APPROVAL
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBulkApproveModalOpen(false)}
                      className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-200">Publish listings in bulk?</h4>
                    <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
                      You are about to approve <strong>{selectedPropIds.length} properties</strong> simultaneously. This action will instantly move their status to <strong className="text-emerald-400">APPROVED</strong>, publishing them to the public ApnaGhar real-estate index register immediately.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkApproveModalOpen(false)}
                      className="w-1/2 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleBulkApproveReject('APPROVED');
                        setIsBulkApproveModalOpen(false);
                      }}
                      className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-xl shadow-emerald-500/10 cursor-pointer transition-all active:scale-95"
                    >
                      Yes, Approve All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky/Floating bulk compliance action dock */}
            <AnimatePresence>
              {selectedPropIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: 50, x: '-50%', scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="fixed bottom-6 left-1/2 bg-slate-900/95 border border-white/15 backdrop-blur-md rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl z-40 text-white max-w-2xl w-[90%]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-black">
                      {selectedPropIds.length}
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">Bulk Compliance Actions</p>
                      <p className="text-[10px] text-slate-400 font-sans">{selectedPropIds.length} ApnaGhar listings ready for bulk action</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsBulkApproveModalOpen(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-colors"
                    >
                      Approve Selected ({selectedPropIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkNotesInput('');
                        setIsBulkRejectModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-lg shadow-red-500/10 cursor-pointer transition-colors"
                    >
                      Reject Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPropIds([])}
                      className="px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-mono font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DYNAMIC CAMPAIGNS & INDEX SEARCH DISCOVERABILITY CENTER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* EMAIL CAMPAIGNS BLAST BROADCASTER PANEL */}
            <div className="lg:col-span-2 bg-slate-900/90 rounded-3xl border border-white/10 p-6 shadow-2xl text-white flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">Bulk Promotional Campaigns & Alerts Broadcast</h3>
                    <p className="text-[10px] text-white/50 font-sans leading-relaxed">Compose real-time alerts, hot-listing promotions, or newsletters sent to active opted-in users on ApnaGhar registry index.</p>
                  </div>
                </div>

                <form onSubmit={handleSendPromoBlast} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-1">Target Subscriber Segment</label>
                      <select
                        value={promoTargetRole}
                        onChange={(e) => setPromoTargetRole(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-sans"
                      >
                        <option value="ALL">ALL (Opted-in Buyers, Tenants, Owners & Agents)</option>
                        <option value="BUYER">BUYERS ONLY (Investors & Hot-leads)</option>
                        <option value="TENANT">TENANTS ONLY (Premium Renters)</option>
                        <option value="OWNER">PROPERTY OWNERS (Asset Owners)</option>
                        <option value="AGENT">AGENTS & BROKERS (Local Realtors)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-1">Quick-Insert Active Property</label>
                      <select
                        value={promoSelectedPropId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPromoSelectedPropId(val);
                          if (val) {
                            const found = properties.find(p => p.id === val);
                            if (found) {
                              setPromoSubject(`Exclusive ApnaGhar Hot Listing Alert: ${found.title}`);
                              setPromoBody(`Greetings ApnaGhar Premium Investors,\n\nWe would like to introduce a premium handpicked asset that has successfully passed all our regulatory compliance audits:\n\n🏡 Title: ${found.title}\n📍 Location: ${found.location?.area || 'N/A'}, ${found.location?.city || 'N/A'}\n📏 Size: ${found.details?.bedrooms || 'N/A'} BHK (${found.details?.area || 'N/A'} sqft spacious flat)\n📊 Pricing: ₹ ${(found.price / 100000).toFixed(1)} Lakhs only.\n\nThis flat boasts full vitrified tiling, 24 Hours municipal water backup, and resides in a beautiful gated community. Respond immediately via this email or request a direct WhatsApp tour with our registered broker!`);
                            }
                          }
                        }}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-sans"
                      >
                        <option value="">-- Custom Draft (Empty Template) --</option>
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>Insert: {p.title} (₹{(p.price / 100000).toFixed(2)}L)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-1">Campaign Subject Header</label>
                    <input
                      type="text"
                      required
                      value={promoSubject}
                      onChange={(e) => setPromoSubject(e.target.value)}
                      placeholder="e.g. ✨ Exclusive ApnaGhar Spotlight: Luxurious 3 BHK Flat in Bandra West"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-1">Alert content & instructions</label>
                    <textarea
                      rows={4}
                      required
                      value={promoBody}
                      onChange={(e) => setPromoBody(e.target.value)}
                      placeholder="Draft your promotional newsletter or dynamic property alert details here..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed font-sans"
                    />
                  </div>

                  {promoError && (
                    <p className="text-[10px] text-red-400 font-mono font-bold">⚠️ Broadcast Error: {promoError}</p>
                  )}

                  {promoStatus && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono space-y-1 text-indigo-300 animate-in fade-in">
                      <p className="font-bold text-[11px] text-indigo-200">🚀 Campaign Blast Initiated successfully!</p>
                      <p>• Recipients Segment: {promoTargetRole}</p>
                      <p>• Count Opted-in: {promoStatus.recipientsCount} active accounts</p>
                      <p className="truncate">• Dispatched Target Array: {promoStatus.emailsSent?.join(', ')}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={promoSending}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-35 transition-all text-white text-xs font-bold rounded-xl shadow-xl shadow-indigo-600/15 cursor-pointer flex items-center gap-1.5"
                    >
                      {promoSending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Broadcasting Alerts...
                        </>
                      ) : (
                        <>
                          🚀 Launch Symmetrical Blast
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* XML SITEMAP CRAWLER STATUS & REBUILD PANEL */}
            <div className="bg-slate-900/90 rounded-3xl border border-white/10 p-6 shadow-2xl text-white flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/15 pb-3">
                  <RefreshCw className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">XML Sitemap Controller</h3>
                    <p className="text-[10px] text-white/50 font-sans leading-relaxed">Dynamic SEO crawler indexes management for improved SEO search discoverability.</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 space-y-3 font-mono text-[10px] leading-relaxed select-none">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>SITEMAP LOCAL PATH</span>
                    <span className="text-slate-200 font-bold">/sitemap.xml</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>INDEX STATUS</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">🟢 online & parsed</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>AUTO REINDEX TRIGGERS</span>
                    <span className="text-blue-300 font-bold">ON (CREATE/UPDATE/DELETE)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>SITEMAP NODES</span>
                    <span className="text-indigo-300 font-bold">
                      {properties.filter(p => ['APPROVED', 'SOLD', 'RENTED'].includes(p.status)).length} properties
                    </span>
                  </div>

                  {sitemapStatus ? (
                    <div className="pt-2.5 border-t border-white/5 space-y-1 animate-in fade-in">
                      <p className="text-emerald-400 font-bold">✓ Sitemap generated successfully!</p>
                      <p className="text-slate-400">📂 File Size: <strong className="text-slate-200">{(sitemapStatus.size / 1024).toFixed(2)} KB</strong></p>
                      <p className="text-slate-400">📅 Saved Workspace At: <strong className="text-slate-200">{sitemapStatus.updatedAt ? new Date(sitemapStatus.updatedAt).toLocaleTimeString() : 'Just now'}</strong></p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-white/5 text-slate-500 italic text-[9px] leading-relaxed">
                      Auto-generated at server initialization. Click manually below to force XML rebuilding.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleRegenerateSitemap}
                  disabled={sitemapLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-35 transition-all text-white text-xs font-bold rounded-xl shadow-xl shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {sitemapLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Parsing Schema XML...
                    </>
                  ) : (
                    <>
                      🔄 Re-build Sitemap Index
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* USER DIRECTORY & ROLE MANAGEMENT CONTROL CONSOLE */}
          <div className="backdrop-blur-md bg-slate-900/90 rounded-3xl border border-white/10 p-6 shadow-2xl text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">User Registry & Active Role Assignment</h3>
                  <p className="text-[10px] text-white/50">Manage platform member roles. Modifying user role takes effect immediately.</p>
                </div>
              </div>

              {/* Quick statistics badge */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full border border-blue-500/25">
                  🛡️ Strict Admin-Only System Settings
                </span>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[9px] font-mono"
                  title="Force Reload Directory"
                >
                  <RefreshCw className="h-3 w-3" /> Reload
                </button>
              </div>
            </div>

            {roleUpdateMsg && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300 flex items-center gap-2 animate-pulse leading-snug">
                <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>{roleUpdateMsg}</span>
              </div>
            )}

            {isUsersLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-7 w-7 rounded-full border-2 border-blue-500/15 border-t-blue-400 animate-spin"></div>
                <span className="text-[10px] text-white/40 font-mono">Loading Registry database records...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-wider text-white/55">
                      <th className="py-2.5 pb-2">Profile Member Info</th>
                      <th className="py-2.5 pb-2">Verified Contact</th>
                      <th className="py-2.5 pb-2">Current Appointed Role</th>
                      <th className="py-2.5 pb-2 text-right">Assign Authority Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {usersList.map((usr: any) => {
                      const isCurrentUserAdminSelf = usr.email.toLowerCase() === 'aniwas111@gmail.com';
                      return (
                        <tr key={usr.email} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8.5 w-8.5 rounded-xl bg-slate-850 border border-white/10 flex items-center justify-center font-bold text-xs text-blue-400 uppercase">
                                {(usr.name || usr.email).charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  {usr.name || 'Member Record'}
                                  {isCurrentUserAdminSelf && (
                                    <span className="text-[8px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded uppercase font-black">
                                      System Superadmin
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-white/40 font-mono block truncate">{usr.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-xs text-white/70 font-mono">
                            {usr.phone || <span className="text-white/20 italic font-sans text-[10px]">No contact listed</span>}
                          </td>
                          <td className="py-3">
                            <span className={`text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              usr.role === UserRole.ADMIN ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              usr.role === UserRole.AGENT ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                              usr.role === UserRole.OWNER ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' :
                              usr.role === UserRole.TENANT ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' :
                              usr.role === UserRole.BUYER ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                              'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {isCurrentUserAdminSelf ? (
                              <span className="text-[9px] font-mono text-white/30 italic">Unmodifiable root</span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <select
                                  disabled={submittingEmail === usr.email}
                                  value={usr.role}
                                  onChange={(e) => handleUpdateUserRole(usr.email, e.target.value as UserRole)}
                                  className="bg-slate-950 border border-white/10 rounded-lg text-[10px] font-bold text-white px-2 py-1.5 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer font-mono"
                                >
                                  {Object.values(UserRole).map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

// ==========================================
// TENANT SCREENING INTUITIVE BUREAU
// ==========================================
interface TenantScreening {
  id: string;
  applicantName: string;
  applicantEmail: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  creditScore?: number;
  criminalRecord?: string;
  evictionHistory?: string;
  employmentStatus?: string;
  incomeRatio?: number;
  recommendation?: string;
  createdAt: string;
}

function TenantScreeningModule({ myProperties }: { myProperties: Property[] }) {
  const [screenings, setScreenings] = useState<TenantScreening[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [runningScreen, setRunningScreen] = useState(false);
  const [screenStep, setScreenStep] = useState(0);

  const fetchScreenings = async () => {
    try {
      const res = await fetch('/api/tenant-screenings');
      if (res.ok) {
        const data = await res.json();
        setScreenings(data);
      }
    } catch (err) {
      console.warn("Failed fetching screenings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
    if (myProperties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(myProperties[0].id);
    }
  }, [myProperties]);

  const handleTriggerScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim() || !selectedPropertyId) return;

    const prop = myProperties.find(p => p.id === selectedPropertyId);
    if (!prop) return;

    setRunningScreen(true);
    setScreenStep(1); // 1. identity trace

    setTimeout(() => {
      setScreenStep(2); // 2. criminal checking
      setTimeout(() => {
        setScreenStep(3); // 3. checking eviction listings
        setTimeout(() => {
          setScreenStep(4); // 4. finalized
          setTimeout(async () => {
            try {
              const res = await fetch('/api/tenant-screenings/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicantName: applicantName.trim(),
                  applicantEmail: applicantEmail.trim(),
                  propertyId: selectedPropertyId,
                  propertyTitle: prop.title,
                  ownerId: 'owner-demo'
                })
              });

              if (res.ok) {
                setApplicantName('');
                setApplicantEmail('');
                fetchScreenings();
                confetti({
                  particleCount: 100,
                  spread: 60,
                  origin: { y: 0.8 },
                  colors: ['#3b82f6', '#10b981', '#f59e0b']
                });
              }
            } catch (err) {
              console.error(err);
            } finally {
              setRunningScreen(false);
              setScreenStep(0);
            }
          }, 1100);
        }, 1100);
      }, 1100);
    }, 1100);
  };

  return (
    <div className="backdrop-blur-md bg-white/75 rounded-3xl border border-white/50 p-6 shadow-xl dark:bg-slate-900/60 dark:border-white/10 text-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3 dark:border-white/10">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            🛡️ AI Tenant Screening Bureau
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Automated deep background reports, credit score verification, and eviction databases queries</p>
        </div>
        <span className="text-[9px] font-mono font-bold bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-400 px-2.5 py-1 rounded-xl">
          🛡️ SafeLease™ Core Certified
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Screening form */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">Initiate Background Check</h4>
          
          <form onSubmit={handleTriggerScreening} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 font-mono block">APPLICANT LEGAL NAME</label>
              <input
                type="text"
                required
                disabled={runningScreen}
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Aditya Sen"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 font-mono block">EMAIL FOR CONSENT LINK</label>
              <input
                type="text"
                required
                disabled={runningScreen}
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="aditya.sen@gmail.com"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-[11px] font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 font-mono block">SELECT TARGET RENTAL UNIT</label>
              <select
                disabled={runningScreen}
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-[11px]"
              >
                {myProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={runningScreen || myProperties.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              {runningScreen ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing SafeLease Verification...</span>
                </>
              ) : (
                <>
                  <span>Request Automated Screening</span>
                </>
              )}
            </button>
          </form>

          {/* Screening interactive progress states */}
          {runningScreen && (
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 border border-indigo-500/25 animate-in fade-in zoom-in-95 leading-normal font-sans">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-indigo-400">STATUS: AUDITING</span>
                <span>{Math.round(screenStep * 25)}%</span>
              </div>
              
              <div className="w-full h-1 bg-slate-100/10 rounded-full overflow-hidden font-mono">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${screenStep * 25}%` }}
                />
              </div>

              <div className="space-y-1.5 text-[10px] font-mono text-slate-300">
                <div className={`flex items-center gap-1.5 ${screenStep >= 1 ? 'text-indigo-300 font-bold' : 'opacity-40'}`}>
                  <span>{screenStep > 1 ? '✅' : '⚡'}</span>
                  <span>1. Performing deep identity trace</span>
                </div>
                <div className={`flex items-center gap-1.5 ${screenStep >= 2 ? 'text-indigo-300 font-bold' : 'opacity-40'}`}>
                  <span>{screenStep > 2 ? '✅' : screenStep === 2 ? '⚡' : '▫️'}</span>
                  <span>2. Auditing national criminal registries</span>
                </div>
                <div className={`flex items-center gap-1.5 ${screenStep >= 3 ? 'text-indigo-300 font-bold' : 'opacity-40'}`}>
                  <span>{screenStep > 3 ? '✅' : screenStep === 3 ? '⚡' : '▫️'}</span>
                  <span>3. Querying state eviction records</span>
                </div>
                <div className={`flex items-center gap-1.5 ${screenStep >= 4 ? 'text-indigo-300 font-bold' : 'opacity-40'}`}>
                  <span>{screenStep >= 4 ? '⚡' : '▫️'}</span>
                  <span>4. Computing final lease suitability index</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List of screening check reports */}
        <div className="lg:col-span-7 space-y-3 font-sans">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Verification Reports ({screenings.length})</h4>
          
          {loading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500 mr-2" />
              <span>Fetching verified background profiles...</span>
            </div>
          ) : screenings.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center p-12 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
              No applicant evaluations registered yet. Fill out the screening request form to test ApnaGhar SafeLease.
            </p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {screenings.map((s) => (
                <div key={s.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-all text-slate-800 dark:text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2 dark:border-white/5">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{s.applicantName}</h5>
                      <span className="text-[10px] text-slate-400 block font-mono">{s.applicantEmail}</span>
                    </div>
                    <div className="text-left sm:text-right font-sans">
                      <span className="text-[8px] font-bold font-mono text-indigo-500 block uppercase">Target unit:</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-300 block leading-tight font-sans">{s.propertyTitle}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-sans">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                      <span className="text-[8px] text-slate-400 block font-bold font-mono uppercase">CREDIT SCORE</span>
                      <span className={`text-xs mt-0.5 font-mono font-black ${(s.creditScore || 0) >= 700 ? 'text-emerald-500' : (s.creditScore || 0) >= 600 ? 'text-amber-500' : 'text-red-500'}`}>
                        {s.creditScore} ({(s.creditScore || 0) >= 700 ? 'GOOD' : 'FAIR'})
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center font-sans">
                      <span className="text-[8px] text-slate-400 block font-bold font-mono uppercase">CRIMINAL</span>
                      <span className="text-[9px] mt-0.5 font-bold text-slate-600 dark:text-slate-300 line-clamp-1" title={s.criminalRecord}>
                        {s.criminalRecord?.includes('No criminal') ? '🟢 Clear' : '⚠️ Alert'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center font-sans">
                      <span className="text-[8px] text-slate-400 block font-bold font-mono uppercase">EVICTION</span>
                      <span className="text-[9px] mt-0.5 font-bold text-slate-600 dark:text-slate-300 line-clamp-1" title={s.evictionHistory}>
                        {s.evictionHistory?.includes('No prior') ? '🟢 Clear' : '⚠️ Record'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col justify-center font-sans">
                      <span className="text-[8px] text-slate-400 block font-bold font-mono uppercase">COVERAGE</span>
                      <span className="text-xs mt-0.5 font-mono font-black text-emerald-500">
                        {s.incomeRatio}x Ratio
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-indigo-500/5 border-indigo-500/15 flex items-center justify-between gap-2.5 font-sans">
                    <div className="leading-none">
                      <span className="text-[8px] font-bold text-slate-400 font-mono block uppercase">INSURANCE DECISION</span>
                      <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{s.recommendation}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono uppercase shrink-0">
                      📝 VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

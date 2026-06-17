import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, DollarSign, Calculator, Send, MessageSquare, Star, Sparkles, MapPin, Check, Phone, ArrowUpRight, Download, Compass, RotateCw, ArrowLeft, ArrowRight, TrendingUp, Award, Play, Image, Maximize2, Flame, Car, Dumbbell, Waves, Zap, Wifi, Shield, ArrowUp, Camera, Trees, Edit, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { Property, Review, Booking } from '../types';
import InteractiveMap from './InteractiveMap';
import MortgageCalculator from './MortgageCalculator';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useTranslation } from '../context/TranslationContext';
import FullscreenLightbox from './FullscreenLightbox';
import SocialShare from './SocialShare';
import VoiceInquirySection from './VoiceInquirySection';
import ThreeDFloorPlanViewer from './ThreeDFloorPlanViewer';
import NeighborhoodVibe from './NeighborhoodVibe';
import SchematicFloorPlan from './SchematicFloorPlan';
import PropertyHistoryLog from './PropertyHistoryLog';
import confetti from 'canvas-confetti';
import { safeStorage } from '../services/safeStorage';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  userId: string;
  userName: string;
  onSelectProperty?: (property: Property) => void;
  onEditProperty?: (property: Property) => void;
  onDeleteProperty?: (id: string) => void;
  currentUserRole?: string;
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
}

export default function PropertyDetailModal({ 
  property, 
  onClose, 
  userId, 
  userName, 
  onSelectProperty, 
  onEditProperty, 
  onDeleteProperty, 
  currentUserRole,
  isLoggedIn = false,
  onOpenAuth
}: PropertyDetailModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const propertyImages = (property.images && property.images.length > 0)
    ? property.images
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'];

  // Keyboard accessibility listeners (Escape Closure & Focus Trapping)
  useEffect(() => {
    // Focus modal container on mount
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        const elements = Array.from(focusableElements) as HTMLElement[];
        if (elements.length === 0) return;

        const firstEl = elements[0];
        const lastEl = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const [amenityLabels, setAmenityLabels] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetch('/api/amenities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: { [key: string]: string } = {};
          data.forEach(item => {
            map[item.id] = item.label;
          });
          setAmenityLabels(map);
        }
      })
      .catch(err => console.warn("Could not load amenities dynamic labels:", err));
  }, []);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const hasVideoOrTour = !!(property.videoUrl || property.virtualTourUrl);
  const [viewingVideo, setViewingVideo] = useState(hasVideoOrTour);
  const [virtualStagingActive, setVirtualStagingActive] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeFloorTab, setActiveFloorTab] = useState<'3d' | '2d'>('2d');

  const [isPriceDropAlertRegistered, setIsPriceDropAlertRegistered] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  // Load registered price alerts from local storage on mount
  useEffect(() => {
    try {
      const rawStoredList = safeStorage.getItem('ap_price_drop_alerts');
      if (rawStoredList) {
        const parsedList = JSON.parse(rawStoredList);
        if (Array.isArray(parsedList) && parsedList.includes(property.id)) {
          setIsPriceDropAlertRegistered(true);
        }
      }
    } catch (err) {
      console.warn("Failed to read price alerts from localstorage", err);
    }
  }, [property.id]);

  const handleTogglePriceDropAlert = () => {
    try {
      const rawStoredList = safeStorage.getItem('ap_price_drop_alerts') || '[]';
      let parsedList = JSON.parse(rawStoredList);
      if (!Array.isArray(parsedList)) parsedList = [];
      
      let nextState = false;
      if (parsedList.includes(property.id)) {
        parsedList = parsedList.filter((id: string) => id !== property.id);
        nextState = false;
      } else {
        parsedList.push(property.id);
        nextState = true;
        // Trigger celebratory visual outcome!
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      safeStorage.setItem('ap_price_drop_alerts', JSON.stringify(parsedList));
      setIsPriceDropAlertRegistered(nextState);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWebShare = async () => {
    const shareData = {
      title: `${property.title} | ApnaGhar`,
      text: `Check out this amazing property: ${property.title} in ${property.location?.area || ''}, ${property.location?.city || ''} on ApnaGhar for ${formatINR(property.price || 0)}!`,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        confetti({ particleCount: 30, spread: 45 });
      } catch (err) {
        console.warn("Web Share API failed or dismissed, falling back to copy to clipboard:", err);
        fallbackCopyToClipboard();
      }
    } else {
      fallbackCopyToClipboard();
    }
  };

  const fallbackCopyToClipboard = () => {
    const textToCopy = `Check out this amazing property: ${property.title} located in ${property.location?.area || ''}, ${property.location?.city || ''}. It's listed for ${formatINR(property.price || 0)} on ApnaGhar!\n\nLink: ${window.location.href}`;
    
    const writeText = (): Promise<void> => {
      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(textToCopy);
      }
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) return Promise.resolve();
        return Promise.reject(new Error('Copy failed'));
      } catch (e: any) {
        return Promise.reject(e);
      }
    };

    writeText()
      .then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3500);
        confetti({ particleCount: 20, spread: 40 });
      })
      .catch((err) => {
        console.error("Failed to copy listing link to clipboard:", err);
      });
  };

  const getAmenityIcon = (key: string) => {
    const normKey = key.toLowerCase();
    if (normKey.includes('parking')) return <Car className="h-4.5 w-4.5 shrink-0 text-amber-400" />;
    if (normKey.includes('gym')) return <Dumbbell className="h-4.5 w-4.5 shrink-0 text-pink-400 animate-pulse" />;
    if (normKey.includes('pool') || normKey.includes('swimming')) return <Waves className="h-4.5 w-4.5 shrink-0 text-cyan-400" />;
    if (normKey.includes('power') || normKey.includes('backup')) return <Zap className="h-4.5 w-4.5 shrink-0 text-yellow-400" />;
    if (normKey.includes('internet') || normKey.includes('wifi')) return <Wifi className="h-4.5 w-4.5 shrink-0 text-teal-400" />;
    if (normKey.includes('security')) return <Shield className="h-4.5 w-4.5 shrink-0 text-emerald-400" />;
    if (normKey.includes('cctv')) return <Camera className="h-4.5 w-4.5 shrink-0 text-blue-400" />;
    if (normKey.includes('lift')) return <ArrowUp className="h-4.5 w-4.5 shrink-0 text-indigo-400" />;
    if (normKey.includes('garden') || normKey.includes('park')) return <Trees className="h-4.5 w-4.5 shrink-0 text-green-400" />;
    return <Check className="h-4.5 w-4.5 shrink-0 text-white/50" />;
  };

  // Real-time dynamic SEO tag injection and JSON-LD Schema markup manager
  useEffect(() => {
    if (!property) return;

    // Save previous document values
    const prevTitle = document.title;
    
    // 1. Dynamic Title and Meta Description
    document.title = `${property.title || 'Property Detail'} | ${property.location?.city || ''} Real Estate | ApnaGhar`;
    
    let descMeta = document.querySelector('meta[name="description"]');
    const prevDesc = descMeta ? descMeta.getAttribute('content') : '';
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    const dynamicDesc = `Explore ${property.title || ''} located at ${property.location?.area || ''}, ${property.location?.city || ''}. It features ${property.details?.bedrooms || 'N/A'} BHK spacious rooms and beautiful amenities, measuring ${property.details?.area || 'N/A'} sqft. Compare values, get real-time EMI schedules, and connect in ApnaGhar.`;
    descMeta.setAttribute('content', dynamicDesc);

    // 2. Open Graph fields configurations
    const ogTagsConfig = [
      { property: 'og:title', content: `${property.title || ''} | Premium ApnaGhar Listing` },
      { property: 'og:description', content: (property.description || '').substring(0, 160) + '...' },
      { property: 'og:image', content: propertyImages[0] },
      { property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : '' },
      { property: 'og:type', content: 'website' }
    ];

    const prevOg = ogTagsConfig.map(tag => {
      const el = document.querySelector(`meta[property="${tag.property}"]`);
      return {
        property: tag.property,
        content: el ? el.getAttribute('content') : null
      };
    });

    ogTagsConfig.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content || '');
    });

    // 3. Inject Structured JSON-LD SingleFamilyResidence Schema Markup
    let schemaScript = document.getElementById('apnaghar-jsonld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.setAttribute('id', 'apnaghar-jsonld-schema');
      document.head.appendChild(schemaScript);
    }

    const structuredLD = {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": property.title || 'Property',
      "image": propertyImages,
      "description": property.description || '',
      "address": {
        "@type": "PostalAddress",
        "addressLocality": property.location?.city || '',
        "addressRegion": property.location?.state || "Maharashtra",
        "streetAddress": property.location?.area || '',
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": property.location?.latitude || 19.076,
        "longitude": property.location?.longitude || 72.877
      },
      "numberOfRooms": (property.details?.bedrooms || 0) + (property.details?.bathrooms || 1),
      "numberOfBedrooms": property.details?.bedrooms || 0,
      "numberOfBathroomsTotal": property.details?.bathrooms || 1,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.details?.area || 0,
        "unitCode": "FTK"
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": property.price || 0,
        "availability": "https://schema.org/InStock",
        "url": typeof window !== 'undefined' ? window.location.href : ""
      }
    };

    schemaScript.textContent = JSON.stringify(structuredLD);

    // Clean up
    return () => {
      document.title = prevTitle;
      
      const curDesc = document.querySelector('meta[name="description"]');
      if (curDesc) {
        if (prevDesc) {
          curDesc.setAttribute('content', prevDesc);
        } else {
          try {
            document.head.removeChild(curDesc);
          } catch (e) {}
        }
      }

      // Rollback OG Tags
      prevOg.forEach(p => {
        const el = document.querySelector(`meta[property="${p.property}"]`);
        if (el) {
          if (p.content) {
            el.setAttribute('content', p.content);
          } else {
            try {
              document.head.removeChild(el);
            } catch (e) {}
          }
        }
      });

      // Remove Schema element
      const sc = document.getElementById('apnaghar-jsonld-schema');
      if (sc) {
        try {
          document.head.removeChild(sc);
        } catch (e) {}
      }
    };
  }, [property]);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Visit Scheduler inputs
  const [visitDate, setVisitDate] = useState('2026-06-10');
  const [visitTime, setVisitTime] = useState('11:00');
  const [visitMsg, setVisitMsg] = useState('');
  const [visitOfferPrice, setVisitOfferPrice] = useState('');
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [visitBookedSuccess, setVisitBookedSuccess] = useState(false);

  // EMI Calculator State
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState(20);
  const [calculatedEMI, setCalculatedEMI] = useState(0);

  // Loan Eligibility State
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [otherMonthlyDues, setOtherMonthlyDues] = useState(15000);

  // Agent reviews state
  const [agentReviews, setAgentReviews] = useState<Review[]>([]);
  const [newAgentRating, setNewAgentRating] = useState(5);
  const [newAgentComment, setNewAgentComment] = useState('');
  const [isSubmittingAgentRev, setIsSubmittingAgentRev] = useState(false);

  // Auto-playing image carousel state
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Toggle state for mortgage/EMI calculator
  const [showEmiCalculator, setShowEmiCalculator] = useState(false);

  // Toggle state for contact form modal
  const [showContactFormModal, setShowContactFormModal] = useState(false);
  const [contactSubject, setContactSubject] = useState(`ApnaGhar Inquiry: ${property.title}`);
  const [contactName, setContactName] = useState(userName || '');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState(`Hello ${property.ownerName},\n\nI am interested in your property "${property.title}" listed for ${property.purpose === 'SELL' ? 'sale' : 'rent'} at ${property.location?.area || ''}, ${property.location?.city || ''}.\n\nCould you please share the availability and support a walk-through?\n\nBest regards,\n${userName}`);
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      if (userName && userName !== 'Anil Vasudevan') {
        setContactName(userName);
      }
      if (userId && userId !== 'buyer-demo') {
        setContactEmail(userId);
      }
      setContactMessage(`Hello ${property.ownerName},\n\nI am interested in your property "${property.title}" listed for ${property.purpose === 'SELL' ? 'sale' : 'rent'} at ${property.location?.area || ''}, ${property.location?.city || ''}.\n\nCould you please share the availability and support a walk-through?\n\nBest regards,\n${userName}`);
    }
  }, [isLoggedIn, userName, userId, property.ownerName, property.title, property.purpose, property.location?.area, property.location?.city]);

  // Push notifications & 360 Tour Interactive States
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [activeRoom, setActiveRoom] = useState(0);
  const [panOffset, setPanOffset] = useState(50);
  const [isRotating, setIsRotating] = useState(true);

  // Auto rotation effect for 360 Virtual Tour
  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setPanOffset((prev) => {
        let next = prev + 0.15;
        if (next > 100) next = 0;
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Autoplay image carousel effect
  useEffect(() => {
    if (!isPlaying || viewingVideo || propertyImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIdx((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1));
    }, 4500); // Transitions to next image every 4.5 seconds
    return () => clearInterval(interval);
  }, [isPlaying, viewingVideo, propertyImages.length]);

  // Touch gesture swipe callbacks
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distanceX = touchStart - touchEnd;
    const isLeftSwipe = distanceX > 45;
    const isRightSwipe = distanceX < -45;

    if (isLeftSwipe) {
      setActiveImageIdx((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setActiveImageIdx((prev) => (prev === 0 ? propertyImages.length - 1 : prev - 1));
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported in this environment.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("🔔 Notification Enabled!", {
          body: "You will now receive alerts for site visits and market trends in ApnaGhar.",
          icon: "/favicon.ico"
        });
      }
    } catch (e) {
      console.warn("Permission dialog failed to resolve:", e);
    }
  };

  // Load reviews on mount
  useEffect(() => {
    fetchReviews();
    fetchAgentReviews();
  }, [property.id]);

  // Recalculate EMI
  useEffect(() => {
    const loanAmount = property.price * (1 - downPaymentPercent / 100);
    const monthlyRate = (interestRate / 12) / 100;
    const totalPayments = loanTenureYears * 12;

    if (monthlyRate === 0) {
      setCalculatedEMI(loanAmount / totalPayments);
      return;
    }

    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                (Math.pow(1 + monthlyRate, totalPayments) - 1);
    setCalculatedEMI(Math.round(emi));
  }, [property.price, downPaymentPercent, interestRate, loanTenureYears]);

  const fetchReviews = async () => {
    try {
      const resp = await fetch(`/api/properties/${property.id}/reviews`);
      if (resp.ok) {
        const data = await resp.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgentReviews = async () => {
    try {
      const resp = await fetch(`/api/agents/${property.ownerId || 'owner-demo'}/reviews`);
      if (resp.ok) {
        const data = await resp.json();
        setAgentReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAgentReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentComment.trim()) return;
    setIsSubmittingAgentRev(true);

    try {
      const resp = await fetch(`/api/agents/${property.ownerId || 'owner-demo'}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: userName || 'Anil Vasudevan',
          reviewerId: userId,
          rating: newAgentRating,
          comment: newAgentComment
        })
      });

      if (resp.ok) {
        setNewAgentComment('');
        await fetchAgentReviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAgentRev(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);

    try {
      const resp = await fetch(`/api/properties/${property.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: userName || 'Anil Vasudevan',
          reviewerId: userId,
          rating: newRating,
          comment: newComment
        })
      });

      if (resp.ok) {
        setNewComment('');
        await fetchReviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVisit(true);

    try {
      const resp = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          date: visitDate,
          time: visitTime,
          message: visitMsg,
          offerPrice: visitOfferPrice ? Number(visitOfferPrice) : undefined,
          clientId: userId,
          clientName: userName,
          clientEmail: 'aniwas111@gmail.com',
          clientPhone: '+91 98765 43210'
        })
      });

      if (resp.ok) {
        setVisitBookedSuccess(true);
        setVisitMsg('');
        setVisitOfferPrice('');

        // Trigger premium celebration confetti burst
        confetti({
          particleCount: 150,
          spread: 85,
          origin: { y: 0.65 },
          colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899']
        });

        // Trigger browser push notification alert
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification("📅 Site Visit Requested!", {
              body: `Your tour of "${property.title}" is requested for ${visitDate} at ${visitTime}.`,
              icon: propertyImages[0] || "/favicon.ico"
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              setNotificationPermission(permission);
              if (permission === 'granted') {
                new Notification("📅 Site Visit Requested!", {
                  body: `Your tour of "${property.title}" is requested for ${visitDate} at ${visitTime}.`,
                  icon: propertyImages[0] || "/favicon.ico"
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  const formatINR = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Crore`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Helper function to convert image URLs to Base64 safely
      const getBase64ImageFromUrl = (url: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.setAttribute('crossOrigin', 'anonymous');
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              try {
                const dataURL = canvas.toDataURL('image/jpeg', 0.82);
                resolve(dataURL);
              } catch (e) {
                resolve('');
              }
            } else {
              resolve('');
            }
          };
          img.onerror = () => resolve('');
          img.src = url;
        });
      };

      // Theme Colors
      const primaryColor = '#3b82f6'; 
      const darkColor = '#0f172a'; 
      const grayColor = '#64748b'; 

      // 1. Frame Branding Block
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("ApnaGhar Real Estate", 15, 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(147, 197, 253);
      doc.text("OFFICIAL VERIFIED LISTING PROPERTY DOSSIER", 15, 25);

      // Date Stamp
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`GENERATED ON: ${new Date().toLocaleDateString('en-IN')}`, 150, 16);
      doc.text(`STATUS: ACTIVE VERIFIED`, 150, 23);

      // 2. Property Title Section
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text(property.title, 15, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`📍 Location: ${property.location?.address || ''}, ${property.location?.area || ''}, ${property.location?.city || ''}`, 15, 57);

      // 3. Price Highlight Banner Box
      doc.setFillColor(240, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.rect(15, 64, 180, 18, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(59, 130, 246);
      doc.text("ASKING VALUATION / TERM:", 22, 75);

      doc.setFontSize(14.5);
      doc.setTextColor(15, 23, 42);
      const isRent = property.purpose !== 'SELL';
      const priceText = `${formatINR(property.price)}${isRent ? " per month lease" : " outright sale"}`;
      doc.text(priceText, 85, 76);

      // 4. Specifications Overview Row Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Property Specification Parameters", 15, 96);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 100, 195, 100);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);

      const bulletPoints = [
        `• Real Estate Asset Class: ${property.category || 'N/A'}`,
        `• Structural Architecture:   ${property.type || 'N/A'}`,
        `• Covered Living Area:     ${property.details?.area || 'N/A'} Sq. Ft.`,
        `• BHK Configuration:       ${property.details?.bedrooms ? property.details.bedrooms + ' Bedrooms' : 'Standard Land Plot'}`,
        `• Bath Rooms Config:       ${property.details?.bathrooms ? property.details.bathrooms + ' Bathrooms' : 'N/A'}`,
        `• Furnishing Status:        ${(property.details?.furnishingStatus || 'Standard').replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}`,
        `• Registered Landlord:      ${property.ownerName || 'Demo Host'} (${property.ownerType || 'OWNER'})`,
        `• Vastu Facing Direction:   ${property.details?.facingDirection || 'East-Facing Point'}`,
        `• Nearby Landmark Locator: ${property.details?.nearbyLandmark || 'Central Metro Hub Point'}`,
        `• Gated Community Status:  ${property.details?.gatedCommunity !== false ? 'Verified Gated' : 'Standalone Residential Unit'}`,
        `• RERA License Number:     ${property.details?.reraId || 'PR/MUM/APNAGHAR/992G'}`,
        `• Structural Age of Asset: ${property.details?.propertyAge || '1-3 Years Construction'}`,
        `• Approved Water Source:    ${property.details?.waterSupply || '24 hrs Municipal Connection'}`,
        `• ApnaGhar Safety Index:   Grade-A structural and locality certification`,
      ];

      let specY = 108;
      bulletPoints.forEach((point) => {
        doc.text(point, 18, specY);
        specY += 8;
      });

      // 5. Short Description Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Detailed Narrative Description", 15, 230);
      doc.line(15, 234, 195, 234);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitDesc = doc.splitTextToSize(property.description || '', 180);
      doc.text(splitDesc, 15, 240);

      // 6. Next page check for amenities
      doc.addPage();

      // Top bar Page 2
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 18, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Premium Amenities Grid & Certified Asset Quality", 15, 12);

      // Amenities Layout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Included Amenities Checklist", 15, 32);
      doc.line(15, 36, 195, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);

      let amenityY = 46;
      let amenityX = 20;
      let colIdx = 0;

      Object.entries(property.amenities || {}).forEach(([key, value]) => {
        const readableLabel = key.replace(/([A-Z]|\d+)/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase());
        const statusIcon = value ? "[YES]  " : "[ - ]   ";
        
        if (value) {
          doc.setTextColor(16, 185, 129); // emerald-500
        } else {
          doc.setTextColor(148, 163, 184); // slate-400
        }
        
        doc.text(`${statusIcon} ${readableLabel}`, amenityX, amenityY);
        
        colIdx++;
        if (colIdx % 2 === 0) {
          amenityX = 20;
          amenityY += 8.5;
        } else {
          amenityX = 110;
        }
      });

      // Disclaimer footer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Disclaimer: Listings published under ApnaGhar index are subject to validation checks and landlord coordination on physical visits.", 15, 270);
      doc.text("ApnaGhar Housing Corporation. Private & Commercial Property Dossier. 2026. All rights reserved.", 15, 276);

      // 7. Interactive High-Resolution Image Gallery On Page 3
      const imagesToLoad = propertyImages.slice(0, 3);
      if (imagesToLoad.length > 0) {
        const loadedBase64List = await Promise.all(
          imagesToLoad.map(url => getBase64ImageFromUrl(url))
        );

        const filterImages = loadedBase64List.filter(b => b && b.length > 0);

        if (filterImages.length > 0) {
          doc.addPage();
          
          // Page 3 Branding Header
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 210, 18, 'F');
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text("Verified Premium Property Visual Gallery", 15, 12);

          // Add Hero picture
          const firstImg = filterImages[0];
          try {
            doc.addImage(firstImg, 'JPEG', 15, 30, 180, 105);
            doc.setFillColor(248, 250, 252);
            doc.rect(15, 135, 180, 7, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text("IMAGE 1 OF 3: PRIMARY WALKWAY AND FACADE PROFILE - RATED VERIFIED HIGH RESOLUTION", 18, 140);
          } catch (err) {
            console.warn("Could not paint PDF hero image:", err);
          }

          // Add secondary pictures in grid
          if (filterImages.length > 1) {
            const secondImg = filterImages[1];
            try {
              doc.addImage(secondImg, 'JPEG', 15, 155, 85, 55);
              doc.setFillColor(248, 250, 252);
              doc.rect(15, 210, 85, 6, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              doc.setTextColor(100, 116, 139);
              doc.text("IMAGE 2: SECONDARY INDOOR SPONTANEOUS LIVING SUITE", 17, 214);
            } catch (err) {
              console.warn("Could not paint PDF secondary image 1:", err);
            }
          }

          if (filterImages.length > 2) {
            const thirdImg = filterImages[2];
            try {
              doc.addImage(thirdImg, 'JPEG', 110, 155, 85, 55);
              doc.setFillColor(248, 250, 252);
              doc.rect(110, 210, 85, 6, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              doc.setTextColor(100, 116, 139);
              doc.text("IMAGE 3: ANCILLARY OUTDOOR DECK AND UTILITY SPACE", 112, 214);
            } catch (err) {
              console.warn("Could not paint PDF secondary image 2:", err);
            }
          }
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("All images are certified genuine representations of modern status, photographed on official asset onboarding audits.", 15, 270);
          doc.text("ApnaGhar Housing Corporation. Private & Commercial Property Dossier. 2026. All rights reserved.", 15, 276);
        }
      }

      // Save PDF directly to client downloads
      doc.save(`ApnaGhar_Brochure_${property.id}.pdf`);
    } catch (err) {
      console.error("PDF download failure: ", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-2xl bg-slate-950/80 p-4 sm:p-6 md:p-8 flex items-center justify-center"
    >
      
      <motion.div 
        ref={modalRef} 
        tabIndex={-1} 
        aria-modal="true" 
        role="dialog" 
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-6xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 text-white focus:outline-none"
      >
        
        {/* Admin Access Control Panel inside listing view */}
        {currentUserRole === 'ADMIN' && (
          <div className="bg-slate-950 border-b border-red-550/30 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
              <span className="text-xs font-black uppercase text-red-400 tracking-wider font-mono">
                🛡️ System Admin Access Control Panel
              </span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-slate-400 font-medium mr-1.5 hidden md:inline">
                Status: <strong className="text-slate-200 font-mono uppercase">{property.status}</strong>
              </span>
              
              {property.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/properties/${property.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'APPROVED' })
                      });
                      if (res.ok) {
                        alert('Listing published successfully!');
                        onClose();
                        window.location.reload();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex items-center gap-1 transition-all"
                >
                  <Check className="h-3.5 w-3.5" /> Publish / Approve
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  onEditProperty?.(property);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-1 transition-all"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Details
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you absolutely sure you want to permanently delete this listing from the ApnaGhar grid? This action is IRREVERSIBLE.")) {
                    onDeleteProperty?.(property.id);
                  }
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-550 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-1 transition-all"
              >
                <Trash className="h-3.5 w-3.5" /> Delete Permanently
              </button>
            </div>
          </div>
        )}
        
        {/* Detail Header Banner - Fully Responsive Stacking Carousel with Desktop Overlay */}
        <div className="relative h-auto lg:h-[450px] bg-slate-950 flex flex-col lg:block select-none group" id="property-detail-header-banner">
          
          {/* Main big image view with a responsive carousel layout */}
          <div className="w-full h-[240px] sm:h-[350px] md:h-[400px] lg:h-full relative overflow-hidden" id="main-gallery-carousel">
            
            {/* 360° Virtual Tour Badge overlay */}
            {(property.virtualTourUrl || (property as any).virtual_tour_url) && (
              <div className="absolute top-4 left-4 z-30 bg-teal-500 hover:bg-teal-400 border border-teal-400/30 text-white text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md select-none">
                <Compass className="h-4 w-4 animate-spin text-teal-350" style={{ animationDuration: '6s' }} />
                <span>360° Virtual Tour Available</span>
              </div>
            )}

            {viewingVideo && hasVideoOrTour ? (
              <video
                src={property.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-luxury-home-with-swimming-pool-and-palm-trees-4416-large.mp4"}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={() => setIsPlaying(false)}
                onMouseLeave={() => setIsPlaying(true)}
              >
                <img
                  key={activeImageIdx}
                  src={propertyImages[activeImageIdx]}
                  alt={`${property.title} - Visual #${activeImageIdx + 1}`}
                  loading="eager"
                  decoding="async"
                  sizes="(max-width: 1200px) 100vw, 80vw"
                  className="w-full h-full object-cover cursor-pointer hover:scale-[1.01] transition-all duration-300 animate-in fade-in zoom-in-95"
                  style={virtualStagingActive ? { filter: 'brightness(1.08) contrast(1.02) saturate(1.15) sepia(0.04)' } : undefined}
                  referrerPolicy="no-referrer"
                  onClick={() => setShowLightbox(true)}
                />

                {virtualStagingActive && !viewingVideo && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-in fade-in duration-500 z-10">
                    {/* Simulated living-room furniture overlay */}
                    <div className="absolute bottom-16 left-4 sm:left-12 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-blue-500/30 p-2.5 flex items-center gap-2 max-w-[240px] shadow-2xl select-none">
                      <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded font-mono shrink-0 select-none animate-pulse col-span-1">AI STAGED</span>
                      <p className="text-[10px] text-white/90 leading-tight">Virtual modern interior armchair couch, fuzzy rug & stylish planter live.</p>
                    </div>
                    
                    {/* Sofa Couch & Rug illustration */}
                    <svg className="absolute bottom-4 left-1/4 -translate-x-1/2 w-[35%] max-w-[200px] drop-shadow-[0_15px_15px_rgba(0,0,0,0.85)] filter saturate-125" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="100" cy="110" rx="90" ry="10" fill="#020617" opacity="0.4" />
                      {/* Rug */}
                      <path d="M10 110h180v4H10z" fill="#334155" />
                      {/* Armchair body */}
                      <path d="M30 85h140v15H30z" fill="#475569" />
                      <path d="M20 50h18v45H20zm142 0h18v45h-18z" fill="#1e293b" />
                      <path d="M38 55h124v30H38z" fill="#1e293b" />
                      <rect x="42" y="30" width="116" height="30" rx="4" fill="#334155" />
                      <rect x="62" y="55" width="35" height="10" rx="2" fill="#d1d5db" opacity="0.3" />
                      <rect x="103" y="55" width="35" height="10" rx="2" fill="#d1d5db" opacity="0.3" />
                      {/* Legs */}
                      <rect x="40" y="100" width="8" height="10" rx="1" fill="#020617" />
                      <rect x="152" y="100" width="8" height="10" rx="1" fill="#020617" />
                    </svg>

                    {/* Staged potted plant */}
                    <svg className="absolute bottom-4 right-12 w-[15%] max-w-[80px] drop-shadow-[2px_10px_10px_rgba(0,0,0,0.6)]" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Pot */}
                      <path d="M35 110l5 30h20l5-30H35z" fill="#c2410c" />
                      {/* Stem */}
                      <line x1="50" y1="50" x2="50" y2="110" stroke="#78350f" strokeWidth="4" />
                      {/* Foliage */}
                      <circle cx="50" cy="50" r="30" fill="#15803d" />
                      <circle cx="65" cy="45" r="22" fill="#16a34a" />
                      <circle cx="35" cy="55" r="25" fill="#22c55e" />
                      <circle cx="50" cy="30" r="20" fill="#4ade80" />
                    </svg>
                  </div>
                )}

                {/* Left navigation arrow */}
                {propertyImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev === 0 ? propertyImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 p-2 sm:p-2.5 bg-slate-950/60 hover:bg-slate-950/90 border border-white/10 text-white rounded-full transition-all cursor-pointer shadow-lg active:scale-90 z-20"
                    title="Previous visual asset"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {propertyImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 p-2 sm:p-2.5 bg-slate-950/60 hover:bg-slate-950/90 border border-white/10 text-white rounded-full transition-all cursor-pointer shadow-lg active:scale-90 z-20"
                    title="Next visual asset"
                  >
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                )}

                {/* Autoplay Play/Pause & Page Indicator Badge */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(!isPlaying);
                    }}
                    className="p-1.5 bg-slate-950/85 border border-white/10 hover:bg-slate-950 rounded-lg text-white/70 hover:text-white transition-all cursor-pointer text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md"
                    title={isPlaying ? "Pause auto-play" : "Play auto-play"}
                  >
                    {isPlaying ? (
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    )}
                    <span>{isPlaying ? 'Live' : 'Paused'}</span>
                  </button>
                  <div className="bg-slate-950/85 border border-white/10 px-3 py-1 text-[10px] sm:text-xs font-bold font-mono tracking-wider rounded-xl shadow-md backdrop-blur-md select-none">
                    📸 {activeImageIdx + 1} / {propertyImages.length}
                  </div>
                </div>

                {/* Thumbnail Gallery Slider Overlay (Horizontal scroll on mobile, Vertical gallery strip on desktop) */}
                {propertyImages.length > 1 && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-6 lg:top-[76px] lg:translate-x-0 flex flex-row lg:flex-col gap-2 p-1.5 bg-slate-950/65 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 z-30 max-w-[90%] lg:max-w-none lg:max-h-[290px] overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar scroll-smooth" id="property-thumbnail-slider">
                    {propertyImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(idx);
                          setViewingVideo(false);
                          setIsPlaying(false);
                        }}
                        className={`w-14 h-10 sm:w-16 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 relative ${idx === activeImageIdx && !viewingVideo ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/25' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'}`}
                        title={`Slide to Image #${idx + 1}`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover pointer-events-none" 
                        />
                        {idx === activeImageIdx && !viewingVideo && (
                          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                          </div>
                        )}
                        <div className="absolute bottom-0.5 right-1 bg-slate-950/70 text-[8px] font-mono px-1 rounded text-white font-bold pointer-events-none">
                          {idx + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Bullet navigation dot indicator */}
                {propertyImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 py-1 px-2.5 rounded-full bg-slate-950/50 backdrop-blur-sm border border-white/5">
                    {propertyImages.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(dotIdx);
                          setIsPlaying(false); // Stop autoplay when user manually selects dot
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${dotIdx === activeImageIdx ? 'w-4 bg-blue-500' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                        title={`Show image ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Dark glass cover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none"></div>

            {/* Quick Media Controls Badge Group */}
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
              {!viewingVideo && (
                <button
                  type="button"
                  onClick={() => setVirtualStagingActive(prev => !prev)}
                  className={`px-3 py-2 border rounded-xl transition-all text-[10px] font-extrabold uppercase font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                    virtualStagingActive 
                      ? 'bg-blue-605 bg-blue-600 border-blue-400 text-white shadow-blue-500/20' 
                      : 'bg-slate-900/80 hover:bg-slate-950 border-white/15 text-white/95'
                  }`}
                  title="Toggle Virtual Furniture Placement"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${virtualStagingActive ? 'animate-pulse text-amber-300' : 'text-blue-400'}`} />
                  <span>AI STAGING: {virtualStagingActive ? 'ACTIVATED' : 'OFF'}</span>
                </button>
              )}
              {hasVideoOrTour && (
                <div className="bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-xl p-0.5 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => setViewingVideo(false)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${!viewingVideo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Image className="h-3 w-3" /> Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingVideo(true)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${viewingVideo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Play className="h-3 w-3" /> Video Tour
                  </button>
                </div>
              )}

              {/* Immersive Lightbox Button Overlay */}
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="px-3 py-2 bg-slate-900/80 hover:bg-slate-950 border border-white/15 text-white/95 rounded-xl hover:text-white transition-all text-[10px] font-extrabold uppercase font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                title={t('fullscreen_mode')}
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-400" />
                {t('fullscreen_mode')}
              </button>
            </div>
          </div>

          {/* Close Floating Button */}
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2.5 bg-slate-900/80 hover:bg-slate-950 backdrop-blur-md rounded-full border border-white/20 text-white transition-all cursor-pointer shadow-lg active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Core property info: beautifully stacks below image on smaller viewports and overlays on desktop */}
          <div className="relative lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:z-10 text-white p-5 sm:p-6 lg:p-0 bg-slate-950/85 lg:bg-transparent border-t lg:border-t-0 border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1 bg-transparent">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white px-2.5 py-0.5 rounded-lg border border-blue-400 shadow">
                  {property.category} • {property.type}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 text-white px-2.5 py-0.5 rounded-lg border border-white/15 shadow backdrop-blur-sm">
                  FOR {property.purpose}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-md font-sans text-white leading-snug">
                {property.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 lg:text-white/70 flex items-center gap-1.5 leading-snug mt-1">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="truncate">{property.location?.address || ''}, {property.location?.area || ''}, {property.location?.city || ''}</span>
              </p>
            </div>

            <div className="bg-slate-950/90 lg:bg-slate-950/80 border border-white/15 backdrop-blur-md px-5 py-3 rounded-2xl flex flex-col items-start md:items-end shadow-xl shrink-0 self-start md:self-auto w-full md:w-auto">
              <span className="text-[9px] font-mono text-white/40 font-bold uppercase tracking-wider">{t('asking_price')}</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-400">{formatINR(property.price)}</span>
              {property.purpose !== 'SELL' ? (
                <span className="text-[9px] sm:text-[10px] text-white/60 font-mono mt-0.5">{t('per_month_rent')}</span>
              ) : (
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono mt-0.5 uppercase font-bold tracking-wider">Outright Valuation</span>
              )}
            </div>
          </div>

        </div>

        {/* Outer Grid content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 p-4 sm:p-6 max-h-[55vh] lg:max-h-[60vh] overflow-y-auto bg-slate-950/30">
          
          {/* LEFT 2 COLUMNS: DETAIL DECK */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Selector Thumbnails */}
            {propertyImages.length > 1 && (
              <div>
                <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-2">Image Gallery</span>
                <div className="flex gap-2 pb-1 overflow-x-auto">
                  {propertyImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveImageIdx(idx);
                        setViewingVideo(false);
                      }}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${idx === activeImageIdx && !viewingVideo ? 'border-blue-500 scale-102 shadow-md shadow-blue-500/20' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <img 
                        src={img} 
                        alt="Thumb" 
                        loading="lazy"
                        decoding="async"
                        sizes="80px"
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </button>
                  ))}
                  {hasVideoOrTour && (
                    <button
                      onClick={() => setViewingVideo(true)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 flex flex-col items-center justify-center bg-slate-950 text-center gap-1 ${viewingVideo ? 'border-blue-500 scale-102 shadow-md' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <Play className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                      <span className="text-[8px] font-mono font-bold tracking-widest text-slate-300">VIDEO</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Smart Interactive Quick Actions Panel: Web Share & Price Drop alerts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl" id="smart-interactive-quick-actions-panel">
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-extrabold text-white font-sans flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-400/20 text-indigo-400">⚡</span>
                  Quick Listing Actions
                </h4>
                <p className="text-[11px] text-white/50 leading-tight mt-0.5 font-medium">Instantly share listing with peers or subscribe to price drop metrics</p>
              </div>

              <div className="flex flex-row gap-3 items-center justify-start sm:justify-end">
                <button
                  type="button"
                  id="notify-price-drops-btn"
                  onClick={handleTogglePriceDropAlert}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold font-sans border flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none ${
                    isPriceDropAlertRegistered
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/5'
                      : 'bg-slate-950 hover:bg-slate-950/80 border-white/10 text-white/95'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 ${isPriceDropAlertRegistered ? 'animate-bounce text-amber-400' : 'text-slate-400'}`} />
                  <span>{isPriceDropAlertRegistered ? 'Alert Configured' : 'Notify Price Drops'}</span>
                </button>

                <button
                  type="button"
                  id="web-share-listing-btn"
                  onClick={handleWebShare}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold font-sans bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/10 text-white border border-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none"
                >
                  <ArrowUpRight className="h-4 w-4 animate-pulse text-white/95" />
                  <span>{shareSuccess ? 'Link Copied!' : 'Share Listing'}</span>
                </button>
              </div>

              {isPriceDropAlertRegistered && (
                <div className="col-span-1 sm:col-span-2 text-[10px] sm:text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <span className="text-sm select-none">🔔</span>
                  <p className="leading-snug">
                    Registered custom subscription alert under <strong>{userId || 'Aniwas111@gmail.com'}</strong>! We will dispatch a push alert or email confirmation immediately if the price drops below <strong className="text-white">{formatINR(property.price)}</strong>.
                  </p>
                </div>
              )}

              {shareSuccess && (
                <div className="col-span-1 sm:col-span-2 text-[10px] sm:text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <span className="text-sm select-none">✅</span>
                  <p className="leading-snug">
                    Listing specifications & share link copied to clipboard successfully. Pass it on to friends, family, or professional brokers!
                  </p>
                </div>
              )}
            </div>

            {/* General Description */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono mb-2">Property Description</h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">{property.description}</p>
            </div>

            {/* Quick specifications */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono mb-3">Specifications Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Size Area</span>
                  <span className="text-sm font-extrabold text-white">{property.details?.area || 'N/A'} <span className="text-[10px] font-normal font-sans text-white/60">Sq Ft</span></span>
                </div>
                {property.details?.bedrooms && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Configuration</span>
                    <span className="text-sm font-extrabold text-white">{property.details?.bedrooms} BHK</span>
                  </div>
                )}
                {property.details?.bathrooms && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Bathrooms</span>
                    <span className="text-sm font-extrabold text-white">{property.details?.bathrooms} Baths</span>
                  </div>
                )}
                {property.details?.balconies !== undefined && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Balconies</span>
                    <span className="text-sm font-extrabold text-white">{property.details?.balconies} Balcs</span>
                  </div>
                )}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Floor Level</span>
                  <span className="text-sm font-extrabold text-white">
                    {property.details?.floorNo !== undefined ? `${property.details?.floorNo} / ` : ''}
                    {property.details?.floors || '1'} {((property.details?.floors || 1) > 1) ? 'Flrs' : 'Flr'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Furnishing</span>
                  <span className="text-sm font-extrabold text-white capitalize text-blue-450">
                    {property.details?.furnishingStatus?.replace('_', ' ').toLowerCase() || 'Standard'}
                  </span>
                </div>
                {property.details?.facingDirection && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Vastu Facing</span>
                    <span className="text-sm font-extrabold text-white">{property.details?.facingDirection}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Construction, Regulatory & Water supply profile */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl text-white">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono mb-3">Construction & Regulatory Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Possession</span>
                    <span className="text-xs font-medium text-emerald-400 mt-0.5 block">{property.details?.possessionStatus || 'Ready to Move'}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Property Age</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block">{property.details?.propertyAge || '1-3 Years'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Gated Complex</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block">
                      {property.details?.gatedCommunity !== false ? 'Yes, Premium Gated' : 'No / Standalone'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">RERA Status</span>
                    <span className="text-xs font-semibold text-indigo-400 mt-0.5 block truncate" title={property.details?.reraId || 'Approved'}>
                      {property.details?.reraId || 'Verified License'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Flooring Type</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block capitalize">{property.details?.flooringType || 'Vitrified Tiles'}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Floors (Unit / Total)</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block">
                      {property.details?.floorNo !== undefined ? `${property.details?.floorNo}th` : 'Ground'} of {property.details?.floors || 'Many'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Nearby Landmark</span>
                  <span className="text-xs text-amber-300 mt-0.5 block">
                    📍 {property.details?.nearbyLandmark || 'Central Metro Junction Circle'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Water Supply Details</span>
                  <span className="text-xs text-white/80 mt-0.5 block">
                    {property.details?.waterSupply || '24 Hours Available (Municipal Corporate & Borewell backup)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities Checklist: Enhanced modern icon-based visual chips mapping */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl" id="amenities-highlights-chips">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono mb-3.5">Included Key Features & Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(property.amenities || {}).map(([key, value]) => {
                  const iconElement = getAmenityIcon(key);
                  return (
                    <div 
                      key={key} 
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        value 
                          ? 'border-blue-500/30 bg-blue-950/40 text-white/95 shadow-md shadow-blue-950/20 hover:border-blue-500/50' 
                          : 'border-white/5 bg-slate-950/30 text-white/40 opacity-70'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                        value ? 'bg-slate-950 border border-white/10' : 'bg-slate-900 text-white/25'
                      }`}>
                        {iconElement}
                      </div>
                      <span className="capitalize truncate" title={amenityLabels[key] || key.replace(/([A-Z]|\d+)/g, ' $1').trim()}>
                        {amenityLabels[key] || key.replace(/([A-Z]|\d+)/g, ' $1').trim()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modular Floor Plan & 3D Interactive Canvas Tab Deck */}
            {property.floorPlanUrl ? (
              <div className="space-y-4">
                <div className="flex border-b border-white/10 pb-1 gap-6">
                  <button
                    type="button"
                    onClick={() => setActiveFloorTab('2d')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${activeFloorTab === '2d' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-white font-semibold'}`}
                  >
                    Floor Plan Schematic
                    {activeFloorTab === '2d' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full animate-in fade-in zoom-in-95 duration-200" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFloorTab('3d')}
                    className={`pb-2.5 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${activeFloorTab === '3d' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white font-semibold'}`}
                  >
                    Interactive 3D Cad
                    {activeFloorTab === '3d' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full animate-in fade-in zoom-in-95 duration-200" />
                    )}
                  </button>
                </div>
                
                {activeFloorTab === '2d' ? (
                  <SchematicFloorPlan property={property} />
                ) : (
                  <ThreeDFloorPlanViewer property={property} />
                )}
              </div>
            ) : (
              <ThreeDFloorPlanViewer property={property} />
            )}

            {/* Unified Location & Travel Map Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Location Radar Blueprint</h3>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full select-none">Simulated POIs</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-white/10 h-[360px]">
                  <InteractiveMap property={property} onSelectProperty={onSelectProperty} />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Static Google Maps Preview</h3>
                  <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-400/20 px-2 py-0.5 rounded-full select-none">Geocoded Area Map</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-white/10 h-[360px] bg-slate-950 relative">
                  <iframe
                    title="Google Maps Location Preview"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.location?.area || ''}, ${property.location?.city || ''}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    className="absolute inset-0 grayscale filter invert opacity-80"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-[10px] leading-normal text-white/80 select-none shadow-2xl">
                    📍 Appoximate address listing centered squarely on <strong>{property.location?.area || ''}</strong>, <strong>{property.location?.city || ''}</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Neighborhood Walk Score & Amenities Section */}
            <NeighborhoodVibe property={property} />

            {/* Modular Toggleable EMI & Mortgage Calculator */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-extrabold font-sans text-white">Smart EMI & Mortgage Planner</h3>
                    <p className="text-[10px] text-white/50">Simulate custom home loans & qualifications</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmiCalculator(!showEmiCalculator);
                    confetti({
                      particleCount: 25,
                      spread: 40,
                      origin: { y: 0.8 }
                    });
                  }}
                  className={`px-3.5 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer ${showEmiCalculator ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-blue-400 border border-blue-500/20'}`}
                >
                  {showEmiCalculator ? 'Hide Calculator' : 'Estimate Monthly EMI'}
                </button>
              </div>

              {showEmiCalculator && (
                <MortgageCalculator propertyPrice={property.price} />
              )}
            </div>

            {/* Price History & Locality Index Chart */}
            <PriceHistoryChart property={property} />

            {/* Property History Log feed component */}
            <PropertyHistoryLog property={property} />

            {/* Smart Energy Consumption Utility Line Chart Widget */}
            {property.purpose === 'RENT' && (
              <SmartEnergyWidget property={property} />
            )}

            {/* Community Vibe & Neighborhood Tips section */}
            <CommunityVibeSection property={property} />

            {/* 360° VR Interior Tour interactive panel */}
            <VirtualTour360 property={property} />

            {/* Reviews Section */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono">Reviews & Community Ratings ({reviews.length})</h3>
                <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>
                    {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'} / 5.0
                  </span>
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {reviews.length === 0 ? (
                  <p className="text-xs text-white/40 italic">No reviews written yet. Be the first to express feedback!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-950/60 border border-white/5 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white/90">{rev.reviewerName}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current text-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-white/75 font-sans leading-relaxed">{rev.comment}</p>
                      <span className="text-[9px] font-mono text-white/40 mt-1 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Add feedback box form */}
              <form onSubmit={handleAddReview} className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 justify-between">
                  <span className="text-xs font-bold text-white/90 font-sans">Submit Custom Impression Rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setNewRating(starVal)}
                        className="p-1 hover:scale-110 active:scale-95 transition-all text-sm font-semibold cursor-pointer"
                      >
                        <Star className={`h-4.5 w-4.5 ${starVal <= newRating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    required
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Describe your site visit feedback or property expectations..."
                    className="flex-1 bg-slate-950 border border-white/10 focus:border-blue-500 rounded-xl p-2.5 text-xs focus:outline-none text-white transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: SIDE ACTIONS (OWNER SPECS & SCHEDULER) */}
          <div className="space-y-6">
            
            {/* Social Share Component */}
            <SocialShare property={property} />

            {/* Voice Inquiry Section System */}
            <VoiceInquirySection
              property={property}
              currentUser={{ name: userName || 'Anil Vasudevan', email: userId || 'aniwas111@gmail.com' }}
              onLeadSubmitted={() => {
                if (onSelectProperty) {
                  onSelectProperty(property);
                }
              }}
            />
            
            {/* Owner Profile Panel */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-2.5">Owner / Agent Information</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-400/20 flex items-center justify-center font-bold font-sans text-lg">
                      {(property.ownerName || 'Host').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{property.ownerName || 'Demo Host'}</h4>
                      <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider bg-slate-950 border border-white/10 rounded px-1.5 py-0.5">{property.ownerType || 'OWNER'}</span>
                    </div>
                  </div>

                  {/* Agent overall stars */}
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl text-[11px] text-amber-400 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>
                      {agentReviews.length > 0
                        ? (agentReviews.reduce((sum, r) => sum + r.rating, 0) / agentReviews.length).toFixed(1)
                        : '5.0'}
                    </span>
                    <span className="text-white/40 font-normal">({agentReviews.length})</span>
                  </div>
                </div>
              </div>

              {/* Direct call selectors */}
              <div className="flex flex-col gap-2">
                <a 
                  href="tel:+919876543210"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow border border-white/10 hover:opacity-90 active:scale-95"
                >
                  <Phone className="h-4 w-4" />
                  Call Landlord
                </a>
                
                {/* Instant dynamic WhatsApp router */}
                <a 
                  href={`https://wa.me/919876543210?text=Hello%20${encodeURIComponent(property.ownerName)},%20I%20am%20interested%20in%20your%20ApnaGhar%20listing:%20${encodeURIComponent(property.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="h-4 w-4 text-blue-400" />
                  Chat on WhatsApp
                </a>

                {/* Direct Contact Agent modal trigger */}
                <button 
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      onOpenAuth?.();
                    } else {
                      setShowContactFormModal(true);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95"
                >
                  <Send className="h-4 w-4 text-indigo-400" />
                  {isLoggedIn ? 'Contact Agent / Inquiry' : 'Sign In to Contact Agent'}
                </button>
              </div>

              {/* Agent reviews feedback stream */}
              <div className="border-t border-white/10 pt-3 space-y-3">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block">Agent Client Reviews</span>
                
                {agentReviews.length === 0 ? (
                  <p className="text-[10px] text-white/40 italic">No agent reviews compiled yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {agentReviews.map(r => (
                      <div key={r.id} className="p-2 rounded-lg bg-white/5 border border-white/5 text-[10px] leading-relaxed">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-extrabold text-white/90">{r.reviewerName}</span>
                          <span className="text-amber-400 font-mono flex items-center gap-0.5">
                            ★ {r.rating}
                          </span>
                        </div>
                        <p className="text-white/60 font-sans italic">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submitting form for Agent */}
                <form onSubmit={handleAddAgentReview} className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-[9px] font-mono font-bold text-slate-300 block">Post Review for {property.ownerName}</span>
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-xl border border-white/10">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(starVal => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setNewAgentRating(starVal)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star className={`h-3.5 w-3.5 ${starVal <= newAgentRating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={newAgentComment}
                      onChange={(e) => setNewAgentComment(e.target.value)}
                      placeholder="Share agent service rating..."
                      className="flex-1 bg-slate-950 border border-white/10 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-[10px] focus:outline-none text-white font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingAgentRev}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-[10px] font-bold text-white shrink-0 cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </form>

              </div>
            </div>

            {/* Visit Scheduler Panel */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="text-xs font-extrabold text-white font-sans">Schedule Physical Site Visit</h3>
              </div>
              <p className="text-[11px] text-white/55 leading-normal mb-4">Select an available date and suitable time slot. We will arrange a hosted tour with the agent.</p>

              {visitBookedSuccess ? (
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/30 text-white text-xs leading-relaxed animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Check className="h-4 w-4 text-blue-400" strokeWidth={3} />
                    <span>Appointment Requested</span>
                  </div>
                  Your tour of <strong>{property.title}</strong> has been saved on {visitDate} at {visitTime}. The host has been notified. Check updates in your dashboard!
                  <button
                    onClick={() => setVisitBookedSuccess(false)}
                    className="text-blue-400 underline font-semibold mt-2 block cursor-pointer"
                  >
                    Schedule Another Slot
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookVisit} className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-bold text-white/40 uppercase font-mono block mb-1">Select Date *</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-505 focus:border-blue-500 transition-all cursor-pointer font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-white/40 uppercase font-mono block mb-1">Preferred Hour *</label>
                    <input
                      type="time"
                      required
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-white/40 uppercase font-mono block mb-1">Proposed Price Offer (₹ - Optional)</label>
                    <input
                      type="number"
                      value={visitOfferPrice}
                      onChange={(e) => setVisitOfferPrice(e.target.value)}
                      placeholder={`e.g. ${Math.round(property.price * 0.95)}`}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-white/40 uppercase font-mono block mb-1">Inquiry Memo (Optional)</label>
                    <textarea
                      rows={2}
                      value={visitMsg}
                      onChange={(e) => setVisitMsg(e.target.value)}
                      placeholder="e.g. Please let me know if pet owners are welcome..."
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                    />
                  </div>

                  {/* Browser-based Push Notification segment */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/70">Browser Push Alerts</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold ${notificationPermission === 'granted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                        {notificationPermission === 'granted' ? 'Granted' : notificationPermission}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/50 leading-snug">Receive active browser reminders directly when agents approve tours.</p>
                    {notificationPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="w-full text-center text-[9px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-1.5 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                      >
                        🔔 Enable Push Notifications
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingVisit}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                  >
                    Book Site Visit Tour
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 transition-all border border-blue-400/20"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF Brochure</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Go Back
          </button>
        </div>

      </motion.div>

      {showLightbox && (
        <FullscreenLightbox
          images={propertyImages}
          initialIdx={activeImageIdx}
          onClose={() => setShowLightbox(false)}
          title={property.title}
        />
      )}

      {showContactFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="contact-agent-modal-container">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-white relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowContactFormModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-white/10 text-white/75 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block font-sans">Direct Channel</span>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2 font-sans">
                <Send className="h-5 w-5 text-indigo-400" />
                Inquire About Property
              </h3>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Connect directly with the host agent or submit a pre-filled email client form.
              </p>
            </div>

            {/* Prefilled Property Listing Card */}
            <div className="flex gap-3 p-3 bg-slate-950/40 border border-white/5 rounded-xl">
              <img 
                src={propertyImages[0]} 
                alt="Listing brief" 
                className="w-16 h-12 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate font-sans">{property.title}</h4>
                <p className="text-[10px] text-white/50 truncate font-sans">{property.location?.area || ''}, {property.location?.city || ''}</p>
                <p className="text-xs font-extrabold text-blue-400 mt-0.5 font-sans">{formatINR(property.price)}</p>
              </div>
            </div>

            {inquirySuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="inline-flex p-3 bg-emerald-500/15 text-emerald-400 rounded-full font-bold">✓</div>
                <h4 className="text-sm font-black text-white font-sans">Inquiry Forwarded Successfully!</h4>
                <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto font-sans">
                  Your inquiry message of interest was logged inside our system, and an email notification with full property attachments has been sent to <strong>{property.ownerName}</strong> ({property.ownerType}).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInquirySuccess(false);
                    setShowContactFormModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer font-sans"
                >
                  Back to Details
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSendingInquiry(true);
                  setTimeout(() => {
                    setIsSendingInquiry(false);
                    setInquirySuccess(true);
                    confetti({
                      particleCount: 50,
                      spread: 60,
                      origin: { y: 0.6 }
                    });
                  }, 1200);
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block font-mono">Your Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block font-mono">Your Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +91 9999999999"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block font-mono">Your Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="email@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block font-mono">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block font-mono">Message Text</label>
                  <textarea 
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSendingInquiry}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 font-sans"
                  >
                    {isSendingInquiry ? 'Dispatching...' : 'Digital Submission'}
                  </button>
                  <a
                    href={`mailto:inquiries@apnaghar.com,agent-demo@example.com?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(
                      `${contactMessage}\n\nSender Contact Details:\nName: ${contactName}\nPhone: ${contactPhone}\nEmail: ${contactEmail}\n\nSent via ApnaGhar Listing Suite.`
                    )}`}
                    onClick={() => {
                      confetti({
                        particleCount: 20,
                        spread: 30,
                        origin: { y: 0.8 }
                      });
                      setShowContactFormModal(false);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-500/20 active:scale-95 text-center font-sans"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Mailto (Local Client)
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </motion.div>
  );
}

// ==========================================
// PRICE TREND & MARKET HISTORY CHART
// ==========================================
interface PriceHistoryChartProps {
  property: Property;
}

function PriceHistoryChart({ property }: PriceHistoryChartProps) {
  const mul = property.price;
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  // Realistically model price fluctuations (annual indexes)
  const data = [
    { year: '2022', LocalPrice: Math.round(mul * 0.81), CityAvg: Math.round(mul * 0.85) },
    { year: '2023', LocalPrice: Math.round(mul * 0.86), CityAvg: Math.round(mul * 0.88) },
    { year: '2024', LocalPrice: Math.round(mul * 0.93), CityAvg: Math.round(mul * 0.92) },
    { year: '2025', LocalPrice: Math.round(mul * 0.97), CityAvg: Math.round(mul * 0.96) },
    { year: '2026', LocalPrice: Math.round(mul * 1.00), CityAvg: Math.round(mul * 0.98) },
    { year: '2027 (Est)', LocalPrice: Math.round(mul * 1.08), CityAvg: Math.round(mul * 1.03) },
  ];

  const formatYAxis = (tick: number) => {
    if (tick >= 10000000) return `₹${(tick / 10000000).toFixed(1)} Cr`;
    if (tick >= 100000) return `₹${(tick / 100000).toFixed(0)} L`;
    return `₹${tick.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 p-3 rounded-xl border border-white/10 text-xs text-white space-y-1 font-sans">
          <p className="font-bold text-slate-400 font-mono">📅 Fiscal Year: {label}</p>
          <p className="text-blue-400 font-extrabold font-mono">Locality Rate: {formatYAxis(payload[0].value)}</p>
          {payload[1] && (
            <p className="text-emerald-400 font-extrabold font-mono">City Average: {formatYAxis(payload[1].value)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
          <div>
            <h3 className="text-xs font-extrabold text-white font-sans">Price History & Local Market Index</h3>
            <p className="text-[10px] text-white/50">Historical price trends vs. city index performance (2022 - 2027)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 text-[9px] font-bold font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 text-[9px] font-bold font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${chartType === 'area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Area
            </button>
          </div>
          <span className="text-[9px] uppercase font-mono bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-lg font-bold">
            {property.location?.area || ''}
          </span>
        </div>
      </div>

      <div className="h-48 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" vertical={false} />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={9} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="LocalPrice" name="Locality Rate" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="CityAvg" name="City Average" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" vertical={false} />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={9} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="LocalPrice" name="Locality Rate" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLocal)" />
              <Area type="monotone" dataKey="CityAvg" name="City Average" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCity)" strokeDasharray="4 4" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-300 leading-normal">
        <Award className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          <strong>Insight:</strong> Rates in {property.location?.area || ''} have grown by {(((data[4].LocalPrice - data[0].LocalPrice) / data[0].LocalPrice) * 100).toFixed(0)}% since 2022, outperforming the {property.location?.city || ''} baseline index.
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 360° INTERIOR VR PORTAL VIEW SCREEN
// ==========================================
interface TourRoom {
  name: string;
  image: string;
}

const TOUR_ROOMS: TourRoom[] = [
  { name: 'Living Room', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Master Suite', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=1600' },
  { name: 'Modish Kitchen', image: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&q=80&w=1600' }
];

function VirtualTour360({ property }: { property: Property }) {
  const [activeTab, setActiveTab] = useState<'3d' | '360'>('3d');
  const [activeRoom, setActiveRoom] = useState(0);
  const [panOffset, setPanOffset] = useState(50); // percentage offset 0-100
  const [isRotating, setIsRotating] = useState(true);

  const rawTourUrl = property.virtualTourUrl || (property as any).virtual_tour_url;
  
  // Clean tourUrl to be embedded or fall back to high quality Matterport demo if it is the example URL
  const getEmbeddableTourUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.includes('?m=example')) {
      return 'https://my.matterport.com/show/?m=syZLa994vKx&play=1&qs=1&brand=0';
    }
    return url;
  };

  const has3dTorus = !!rawTourUrl;
  const embedUrl = getEmbeddableTourUrl(rawTourUrl);

  // Auto rotation effect for panoramic view
  useEffect(() => {
    if (!isRotating || activeTab !== '360') return;
    const interval = setInterval(() => {
      setPanOffset((prev) => {
        let next = prev + 0.15;
        if (next > 100) next = 0;
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating, activeTab]);

  // Adjust active tab based on whether live 3D tour exists
  useEffect(() => {
    if (has3dTorus) {
      setActiveTab('3d');
    } else {
      setActiveTab('360');
    }
  }, [has3dTorus]);

  const handlePan = (direction: 'left' | 'right') => {
    setIsRotating(false);
    setPanOffset((prev) => {
      const step = 8;
      const next = direction === 'left' ? prev - step : prev + step;
      return Math.max(0, Math.min(100, next));
    });
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4" id="virtual-tour-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white font-sans">Interactive 360° Virtual Tour</h3>
            <p className="text-[11px] text-white/50 leading-tight">Walk through the property layouts virtually or swipe panorama photos</p>
          </div>
        </div>

        {/* Tab Selector: Live 3D Tour vs Panoramic Photos */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 shrink-0 gap-1 self-start sm:self-auto select-none">
          {has3dTorus && (
            <button
              type="button"
              onClick={() => setActiveTab('3d')}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                activeTab === '3d'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/10 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live 3D Tour
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('360')}
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              activeTab === '360'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Panoramic Photos
          </button>
        </div>
      </div>

      {activeTab === '3d' && has3dTorus ? (
        <div className="relative h-80 sm:h-96 rounded-xl overflow-hidden border border-white/10 bg-slate-950 animate-in fade-in duration-350">
          {/* Real WebGL Matterport/Kuula 3d iframe viewer */}
          <iframe
            src={embedUrl}
            title={`${property.title} Interactive 3D Virtual Tour`}
            className="w-full h-full border-0 rounded-xl"
            allowFullScreen
            allow="gyroscope; accelerometer; vr"
            id="virtual-tour-iframe"
          />
          
          {/* Interactive HUD Overlay indicators */}
          <div className="absolute top-3 left-3 bg-slate-950/90 px-3 py-1.5 rounded-lg text-[9px] font-mono border border-white/10 flex items-center gap-2 shadow backdrop-blur-md select-none pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="font-extrabold text-white/95">INTERACTIVE WebGL ACTIVE</span>
            <span className="text-white/40">|</span>
            <span className="text-white/60">DRAG TO WALK THROUGH</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-350">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/5 max-w-fit shrink-0 gap-1">
            {TOUR_ROOMS.map((room, idx) => (
              <button
                key={room.name}
                type="button"
                onClick={() => {
                  setActiveRoom(idx);
                  setPanOffset(50);
                  setIsRotating(false);
                }}
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-all ${idx === activeRoom ? 'bg-blue-500 text-white shadow font-black' : 'text-slate-400 hover:text-white'}`}
              >
                {room.name}
              </button>
            ))}
          </div>

          {/* Panoramic View Screen viewport */}
          <div className="relative h-56 rounded-xl overflow-hidden border border-white/10 group bg-slate-950">
            <div 
              className="absolute inset-y-0 w-[240%] h-full bg-cover bg-center transition-transform duration-100 ease-out"
              style={{
                backgroundImage: `url(${TOUR_ROOMS[activeRoom].image})`,
                transform: `translateX(-${panOffset * 0.58}%)`
              }}
            />

            {/* HUD overlay decorations */}
            <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded-md text-[9px] font-mono border border-white/10 flex items-center gap-1.5 shadow">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="font-extrabold text-white/90">360° IMMERSIVE VIEW</span>
            </div>

            {/* Panning controllers buttons */}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-none">
              <button 
                type="button"
                onClick={() => handlePan('left')}
                className="p-2 rounded-lg bg-slate-950/90 text-white hover:bg-slate-900 border border-white/10 active:scale-95 transition-all cursor-pointer pointer-events-auto shadow-md"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>

              <button 
                type="button"
                onClick={() => setIsRotating(!isRotating)}
                className={`px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase rounded-lg border flex items-center gap-1.5 cursor-pointer pointer-events-auto transition-all shadow-md ${isRotating ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-950/90 text-slate-300 border-white/10'}`}
              >
                <RotateCw className={`h-3 w-3 ${isRotating ? 'animate-spin' : ''}`} />
                <span>{isRotating ? 'Auto Tracking' : 'Paused'}</span>
              </button>

              <button 
                type="button"
                onClick={() => handlePan('right')}
                className="p-2 rounded-lg bg-slate-950/90 text-white hover:bg-slate-900 border border-white/10 active:scale-95 transition-all cursor-pointer pointer-events-auto shadow-md"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SMART ENERGY CONSUMPTION WIDGET
// ==========================================
function SmartEnergyWidget({ property }: { property: Property }) {
  const [occupants, setOccupants] = useState<number>(2);

  const basePower = Math.round((property.details?.area || 1000) * 1.6);
  const baseWater = 420;

  const multiplier = occupants === 1 ? 0.70 : occupants === 2 ? 1.00 : occupants === 3 ? 1.35 : 1.70;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const seasonalPowerFactors = [0.8, 0.85, 1.1, 1.5, 1.7, 1.6, 1.35, 1.2, 1.1, 0.95, 0.8, 0.75];
  const seasonalWaterFactors = [0.95, 1.0, 1.1, 1.25, 1.3, 1.15, 1.0, 1.0, 1.05, 0.95, 0.9, 0.9];

  const data = months.map((m, idx) => {
    const power = Math.round(basePower * seasonalPowerFactors[idx] * multiplier);
    const water = Math.round(baseWater * seasonalWaterFactors[idx] * multiplier);
    return {
      month: m,
      Electricity: power,
      Water: water,
      Total: power + water
    };
  });

  const avgMonthlyTotal = Math.round(
    data.reduce((acc, d) => acc + d.Total, 0) / 12
  );

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className="h-4.5 w-4.5 text-orange-405 text-orange-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-extrabold text-white font-sans uppercase tracking-wider">⚡ Smart Utility Utility Costs</h3>
            <p className="text-[10px] text-white/50 font-mono">Historical monthly values with occupancy variations (electricity/water)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
          <span className="text-[9px] text-white/40 font-mono pl-1.5 pr-1 font-bold">OCCUPANTS:</span>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOccupants(n)}
              className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${occupants === n ? 'bg-orange-600 text-white font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              {n === 4 ? '4+' : n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
          <span className="text-[9px] text-white/50 block font-bold font-mono">EST AVG POWER</span>
          <span className="text-sm font-extrabold text-orange-400 mt-0.5 block font-mono">₹{Math.round(basePower * multiplier)}/mo</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
          <span className="text-[9px] text-white/50 block font-bold font-mono font-sans">EST AVG WATER</span>
          <span className="text-sm font-extrabold text-blue-400 mt-0.5 block font-mono">₹{Math.round(baseWater * multiplier)}/mo</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
          <span className="text-[9px] text-white/50 block font-bold font-mono">TOTAL ESTIMATED</span>
          <span className="text-sm font-black text-emerald-400 mt-0.5 block font-mono">₹{avgMonthlyTotal}/mo</span>
        </div>
      </div>

      <div className="h-44 w-full mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
              labelStyle={{ fontWeight: 'bold', color: '#94a3b8', fontFamily: 'monospace' }}
            />
            <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
            <Line type="monotone" dataKey="Electricity" name="Electricity Cost (₹)" stroke="#f97316" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Water" name="Water Cost (₹)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-2.5 bg-orange-500/5 border border-orange-500/10 rounded-xl leading-relaxed text-[10px] text-orange-300">
        📌 <strong>Heating / Cooling Factor:</strong> AC usage inflates electricity rates inside {property.location?.city || ''} by up to 80% during peak summers (April-June).
      </div>
    </div>
  );
}

// ==========================================
// NEIGHBORHOOD TIPS & VIBES SECTION
// ==========================================
function CommunityVibeSection({ property }: { property: Property }) {
  const [vibes, setVibes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vibeComment, setVibeComment] = useState('');
  const [vibeCategory, setVibeCategory] = useState('Transport & Commute');
  const [vibeRating, setVibeRating] = useState(5);
  const [vibeAuthor, setVibeAuthor] = useState('');
  const [posting, setPosting] = useState(false);

  const categories = [
    'Transport & Commute',
    'Safety & Vigilance',
    'Food, Dining & Parks',
    'Noise & Serenity',
    'Schools & Families',
    'Overall Vibe'
  ];

  const fetchVibes = async () => {
    try {
      const res = await fetch(`/api/properties/${property.id}/community-vibes`);
      if (res.ok) {
        const data = await res.json();
        setVibes(data);
      }
    } catch (e) {
      console.warn("Failed fetching community vibes: ", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVibes();
  }, [property.id]);

  const handleSubmitVibe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibeComment.trim()) return;

    setPosting(true);
    try {
      const response = await fetch(`/api/properties/${property.id}/community-vibes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: vibeAuthor.trim() || 'Verified Local Resident',
          category: vibeCategory,
          comment: vibeComment,
          rating: vibeRating
        })
      });

      if (response.ok) {
        setVibeComment('');
        setVibeAuthor('');
        fetchVibes();
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        });
      }
    } catch (e) {
      console.error("Vibe posting failed: ", e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-blue-500/10 rounded-lg text-blue-400">🌟</span>
          <div>
            <h3 className="text-xs font-extrabold text-white font-sans uppercase tracking-wider">🏡 Community Vibe & Neighborhood Tips</h3>
            <p className="text-[10px] text-white/50 font-mono">Real neighborhood reviews and insights shared by verified locals</p>
          </div>
        </div>
        <span className="text-[9px] font-mono bg-blue-500/15 text-blue-400 px-2.5 py-0.5 rounded font-extrabold uppercase">
          {vibes.length} Tip{vibes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-xs text-white/40">
          <RotateCw className="h-4 w-4 animate-spin text-blue-500 mr-2" />
          <span>Syncing neighborhood indexes...</span>
        </div>
      ) : vibes.length === 0 ? (
        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-center">
          <p className="text-xs text-white/40 italic">No neighborhood insights shared for this area yet. Contribute your first tip below!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {vibes.map((v) => (
            <div key={v.id} className="p-3 bg-slate-950/50 border border-white/5 rounded-xl space-y-1.5 transition-all hover:border-white/10">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold font-mono uppercase bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">
                    {v.category}
                  </span>
                  <div className="text-[10px] text-emerald-400 font-semibold font-mono mt-0.5">
                    Verified Insider: {v.reviewerName}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                  {Array.from({ length: v.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current text-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-white/80 font-sans leading-relaxed italic">"{v.comment}"</p>
              <div className="text-[8px] text-white/30 font-mono text-right">
                {new Date(v.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share a vibe tip contributor form */}
      <form onSubmit={handleSubmitVibe} className="pt-3 border-t border-white/10 space-y-3">
        <h4 className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider font-mono">Submit Insider Neighborhood Insight</h4>
         
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] text-white/50 block font-bold font-mono">CONTRIBUTOR DISCLOSURE</label>
            <input
              type="text"
              value={vibeAuthor}
              onChange={(e) => setVibeAuthor(e.target.value)}
              placeholder="e.g. Local tenant, Agent, etc."
              className="w-full bg-slate-950 border border-white/10 focus:border-blue-500 rounded-xl p-2 text-xs focus:outline-none text-white font-sans text-[11px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-white/50 block font-bold font-mono">VIBE ASPECT</label>
            <select
              value={vibeCategory}
              onChange={(e) => setVibeCategory(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 focus:border-blue-500 rounded-xl p-2 text-xs focus:outline-none text-white font-sans text-[11px]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-white/50 block font-bold font-mono font-sans">NEIGHBORHOOD RATING</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((starVal) => (
              <button
                key={starVal}
                type="button"
                onClick={() => setVibeRating(starVal)}
                className="hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <Star className={`h-4.5 w-4.5 ${starVal <= vibeRating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-white/50 block font-bold font-mono font-sans">INSIDER REPORT CONTENT</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={vibeComment}
              onChange={(e) => setVibeComment(e.target.value)}
              placeholder="Tell other guests about traffic levels, safety, night spots, or local school quality..."
              className="flex-1 bg-slate-950 border border-white/10 focus:border-blue-500 rounded-xl p-2.5 text-xs focus:outline-none text-white font-sans text-[11px]"
            />
            <button
              type="submit"
              disabled={posting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 cursor-pointer transition-all flex items-center gap-1 shadow-lg border border-white/10 active:scale-95"
            >
              Publish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


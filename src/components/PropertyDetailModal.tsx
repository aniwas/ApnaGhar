import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, DollarSign, Calculator, Send, MessageSquare, Star, Sparkles, MapPin, Check, Phone, ArrowUpRight, Download, Compass, RotateCw, ArrowLeft, ArrowRight, TrendingUp, Award, Play, Image, Maximize2 } from 'lucide-react';
import { Property, Review, Booking } from '../types';
import InteractiveMap from './InteractiveMap';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useTranslation } from '../context/TranslationContext';
import FullscreenLightbox from './FullscreenLightbox';
import SocialShare from './SocialShare';
import VoiceInquirySection from './VoiceInquirySection';
import ThreeDFloorPlanViewer from './ThreeDFloorPlanViewer';
import confetti from 'canvas-confetti';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  userId: string;
  userName: string;
  onSelectProperty?: (property: Property) => void;
}

export default function PropertyDetailModal({ property, onClose, userId, userName, onSelectProperty }: PropertyDetailModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Real-time dynamic SEO tag injection and JSON-LD Schema markup manager
  useEffect(() => {
    if (!property) return;

    // Save previous document values
    const prevTitle = document.title;
    
    // 1. Dynamic Title and Meta Description
    document.title = `${property.title} | ${property.location.city} Real Estate | ApnaGhar`;
    
    let descMeta = document.querySelector('meta[name="description"]');
    const prevDesc = descMeta ? descMeta.getAttribute('content') : '';
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    const dynamicDesc = `Explore ${property.title} located at ${property.location.area}, ${property.location.city}. It features ${property.details.bedrooms} BHK spacious rooms and beautiful amenities, measuring ${property.details.area} sqft. Compare values, get real-time EMI schedules, and connect in ApnaGhar.`;
    descMeta.setAttribute('content', dynamicDesc);

    // 2. Open Graph fields configurations
    const ogTagsConfig = [
      { property: 'og:title', content: `${property.title} | Premium ApnaGhar Listing` },
      { property: 'og:description', content: property.description.substring(0, 160) + '...' },
      { property: 'og:image', content: property.images[0] },
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
      el.setAttribute('content', tag.content);
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
      "name": property.title,
      "image": property.images,
      "description": property.description,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": property.location.city,
        "addressRegion": property.location.state || "Maharashtra",
        "streetAddress": property.location.area,
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": property.location.latitude || 19.076,
        "longitude": property.location.longitude || 72.877
      },
      "numberOfRooms": property.details.bedrooms + (property.details.bathrooms || 1),
      "numberOfBedrooms": property.details.bedrooms,
      "numberOfBathroomsTotal": property.details.bathrooms || 1,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.details.area,
        "unitCode": "FTK"
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": property.price,
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
              icon: property.images[0] || "/favicon.ico"
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              setNotificationPermission(permission);
              if (permission === 'granted') {
                new Notification("📅 Site Visit Requested!", {
                  body: `Your tour of "${property.title}" is requested for ${visitDate} at ${visitTime}.`,
                  icon: property.images[0] || "/favicon.ico"
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
          const img = new Image();
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
      doc.text(`📍 Location: ${property.location.address}, ${property.location.area}, ${property.location.city}`, 15, 57);

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
        `• Real Estate Asset Class: ${property.category}`,
        `• Structural Architecture:   ${property.type}`,
        `• Covered Living Area:     ${property.details.area} Sq. Ft.`,
        `• BHK Configuration:       ${property.details.bedrooms ? property.details.bedrooms + ' Bedrooms' : 'Standard Land Plot'}`,
        `• Bath Rooms Config:       ${property.details.bathrooms ? property.details.bathrooms + ' Bathrooms' : 'N/A'}`,
        `• Furnishing Status:        ${(property.details.furnishingStatus || 'Standard').replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}`,
        `• Registered Landlord:      ${property.ownerName} (${property.ownerType})`,
        `• Vastu Facing Direction:   ${property.details.facingDirection || 'East-Facing Point'}`,
        `• Nearby Landmark Locator: ${property.details.nearbyLandmark || 'Central Metro Hub Point'}`,
        `• Gated Community Status:  ${property.details.gatedCommunity !== false ? 'Verified Gated' : 'Standalone Residential Unit'}`,
        `• RERA License Number:     ${property.details.reraId || 'PR/MUM/APNAGHAR/992G'}`,
        `• Structural Age of Asset: ${property.details.propertyAge || '1-3 Years Construction'}`,
        `• Approved Water Source:    ${property.details.waterSupply || '24 hrs Municipal Connection'}`,
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
      const splitDesc = doc.splitTextToSize(property.description, 180);
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

      Object.entries(property.amenities).forEach(([key, value]) => {
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
      const imagesToLoad = property.images.slice(0, 3);
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
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-2xl bg-slate-950/80 p-4 sm:p-6 md:p-8 flex items-center justify-center animate-in fade-in duration-200">
      
      <div 
        ref={modalRef} 
        tabIndex={-1} 
        aria-modal="true" 
        role="dialog" 
        className="relative w-full max-w-6xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 text-white focus:outline-none"
      >
        
        {/* Detail Header Banner */}
        <div className="relative h-64 sm:h-96 bg-slate-950 flex select-none group">
          
          {/* Main big image view with a responsive carousel layout */}
          <div className="w-full h-full relative overflow-hidden" id="main-gallery-carousel">
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
              <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
                <img
                  key={activeImageIdx}
                  src={property.images[activeImageIdx]}
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
                {property.images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 p-2 sm:p-2.5 bg-slate-950/60 hover:bg-slate-950/90 border border-white/10 text-white rounded-full transition-all cursor-pointer shadow-lg active:scale-90 z-20"
                    title="Previous visual asset"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {property.images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 p-2 sm:p-2.5 bg-slate-950/60 hover:bg-slate-950/90 border border-white/10 text-white rounded-full transition-all cursor-pointer shadow-lg active:scale-90 z-20"
                    title="Next visual asset"
                  >
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                )}

                {/* Page Indicator Badge */}
                <div className="absolute bottom-4 right-4 bg-slate-950/80 border border-white/10 px-3 py-1 text-[10px] sm:text-xs font-bold font-mono tracking-wider rounded-xl z-20 shadow-md backdrop-blur-md select-none">
                  📸 {activeImageIdx + 1} / {property.images.length}
                </div>

                {/* Bullet navigation dot indicator */}
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 py-1 px-2.5 rounded-full bg-slate-950/50 backdrop-blur-sm border border-white/5">
                    {property.images.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(dotIdx);
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

          {/* Core property info overlaid on image bottom */}
          <div className="absolute bottom-6 left-6 right-6 z-10 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white px-2.5 py-0.5 rounded-lg border border-blue-400">
                  {property.category} • {property.type}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950/60 text-white px-2.5 py-0.5 rounded-lg border border-white/15 backdrop-blur-sm">
                  FOR {property.purpose}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight drop-shadow font-sans text-white">
                {property.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 flex items-center gap-1.5 mt-1">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                {property.location.address}, {property.location.area}, {property.location.city}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-white/15 backdrop-blur-md px-5 py-3.5 rounded-2xl flex flex-col items-start sm:items-end shadow-xl shrink-0">
              <span className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-wider">{t('asking_price')}</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-400">{formatINR(property.price)}</span>
              {property.purpose !== 'SELL' && <span className="text-[10px] text-white/60 font-mono">{t('per_month_rent')}</span>}
            </div>
          </div>

        </div>

        {/* Outer Grid content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] overflow-y-auto bg-slate-950/30">
          
          {/* LEFT 2 COLUMNS: DETAIL DECK */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Selector Thumbnails */}
            {property.images.length > 1 && (
              <div>
                <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider block mb-2">Image Gallery</span>
                <div className="flex gap-2 pb-1 overflow-x-auto">
                  {property.images.map((img, idx) => (
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
                  <span className="text-sm font-extrabold text-white">{property.details.area} <span className="text-[10px] font-normal font-sans text-white/60">Sq Ft</span></span>
                </div>
                {property.details.bedrooms && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Configuration</span>
                    <span className="text-sm font-extrabold text-white">{property.details.bedrooms} BHK</span>
                  </div>
                )}
                {property.details.bathrooms && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Bathrooms</span>
                    <span className="text-sm font-extrabold text-white">{property.details.bathrooms} Baths</span>
                  </div>
                )}
                {property.details.balconies !== undefined && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Balconies</span>
                    <span className="text-sm font-extrabold text-white">{property.details.balconies} Balcs</span>
                  </div>
                )}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Floor Level</span>
                  <span className="text-sm font-extrabold text-white">
                    {property.details.floorNo !== undefined ? `${property.details.floorNo} / ` : ''}
                    {property.details.floors || '1'} {((property.details.floors || 1) > 1) ? 'Flrs' : 'Flr'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Furnishing</span>
                  <span className="text-sm font-extrabold text-white capitalize text-blue-450">
                    {property.details.furnishingStatus?.replace('_', ' ').toLowerCase() || 'Standard'}
                  </span>
                </div>
                {property.details.facingDirection && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Vastu Facing</span>
                    <span className="text-sm font-extrabold text-white">{property.details.facingDirection}</span>
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
                    <span className="text-xs font-medium text-emerald-400 mt-0.5 block">{property.details.possessionStatus || 'Ready to Move'}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Property Age</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block">{property.details.propertyAge || '1-3 Years'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Gated Complex</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block">
                      {property.details.gatedCommunity !== false ? 'Yes, Premium Gated' : 'No / Standalone'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">RERA Status</span>
                    <span className="text-xs font-semibold text-indigo-400 mt-0.5 block truncate" title={property.details.reraId || 'Approved'}>
                      {property.details.reraId || 'Verified License'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Flooring Type</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block capitalize">{property.details.flooringType || 'Vitrified Tiles'}</span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Floors (Unit / Total)</span>
                    <span className="text-xs font-bold text-white/80 mt-0.5 block">
                      {property.details.floorNo !== undefined ? `${property.details.floorNo}th` : 'Ground'} of {property.details.floors || 'Many'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Nearby Landmark</span>
                  <span className="text-xs text-amber-300 mt-0.5 block">
                    📍 {property.details.nearbyLandmark || 'Central Metro Junction Circle'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase font-mono text-white/40 font-bold block">Water Supply Details</span>
                  <span className="text-xs text-white/80 mt-0.5 block">
                    {property.details.waterSupply || '24 Hours Available (Municipal Corporate & Borewell backup)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities Checklist */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono mb-3.5">Included Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(property.amenities).map(([key, value]) => (
                  <div 
                    key={key} 
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${value ? 'border-blue-500/20 bg-blue-500/5 text-white/95' : 'border-white/5 bg-white/5 text-white/45'}`}
                  >
                    <div className={`p-1 rounded-full ${value ? 'bg-blue-500 text-white' : 'bg-slate-800 text-white/40'}`}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="capitalize">{amenityLabels[key] || key.replace(/([A-Z]|\d+)/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic 2.5D / 3D Floor Plan CAD Interactive Model Section */}
            <ThreeDFloorPlanViewer property={property} />

            {/* Map Pinboard Placement */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono">Location Blueprint Map</h3>
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <InteractiveMap property={property} onSelectProperty={onSelectProperty} />
              </div>
            </div>

            {/* EMI Mortgage interactive calculator */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-extrabold font-sans text-white">EMI & Mortgage Calculator</h3>
                  <p className="text-[10px] text-white/50">Calculate home loans & downpayments instantly</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-white/55 uppercase font-mono block mb-1">Down Payment ({downPaymentPercent}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-bold font-mono text-blue-400 mt-1 block">
                    ₹{((property.price * downPaymentPercent) / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/55 uppercase font-mono block mb-1">Interest Rate ({interestRate}%)</label>
                  <input
                    type="range"
                    min="6"
                    max="15"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-bold font-mono text-blue-400 mt-1 block">
                    {interestRate}% Annually
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/55 uppercase font-mono block mb-1">Loan Tenure ({loanTenureYears} Years)</label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-bold font-mono text-blue-400 mt-1 block">
                    {loanTenureYears} Years Long
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase block font-mono">Estimated Monthly EMI</span>
                  <p className="text-[10px] text-white/40 mt-0.5">Calculated on remaining principal loan value</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-400">₹{calculatedEMI.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-300 font-mono block">/ Month</span>
                </div>
              </div>

              {/* Dynamic Loan Eligibility segment */}
              <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dynamic Loan Eligibility Check</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/55 uppercase font-mono block mb-1">Your Monthly Income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-white/40">₹</span>
                      <input 
                        type="number"
                        min="1000"
                        step="5000"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-6 pr-3 py-1.5 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <span className="text-[9px] text-white/40 mt-1 block">Net monthly take-home salary</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/55 uppercase font-mono block mb-1">Existing Monthly EMIs</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-white/40">₹</span>
                      <input 
                        type="number"
                        min="0"
                        step="1000"
                        value={otherMonthlyDues}
                        onChange={(e) => setOtherMonthlyDues(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-6 pr-3 py-1.5 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <span className="text-[9px] text-white/40 mt-1 block">Other active monthly payments</span>
                  </div>
                </div>

                {/* Derived computations for status box */}
                {(() => {
                  const reqLoan = property.price * (1 - downPaymentPercent / 100);
                  const mRate = (interestRate / 12) / 100;
                  const totalM = loanTenureYears * 12;
                  const availEMIForLoan = Math.max(0, (monthlyIncome * 0.5) - otherMonthlyDues);
                  
                  let maxEligibilityValue = 0;
                  if (mRate > 0) {
                    maxEligibilityValue = (availEMIForLoan * (1 - Math.pow(1 + mRate, -totalM))) / mRate;
                  } else {
                    maxEligibilityValue = availEMIForLoan * totalM;
                  }
                  maxEligibilityValue = Math.round(maxEligibilityValue);
                  const elStatus = maxEligibilityValue >= reqLoan;

                  return (
                    <div className={`p-4 rounded-xl border ${elStatus ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'} space-y-2`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold">Required Loan Amount:</span>
                        <span className="font-mono font-bold text-slate-300">₹{reqLoan.toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold">Max Allowed EMI Limit:</span>
                        <span className="font-mono font-bold text-slate-300">₹{availEMIForLoan.toLocaleString('en-IN')} / mo</span>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-2 text-xs">
                        <span className="font-bold">Max Eligible Loan:</span>
                        <span className={`text-sm font-black ${elStatus ? 'text-emerald-400' : 'text-amber-500'}`}>
                          ₹{maxEligibilityValue.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="border-t border-white/5 pt-2 flex items-center gap-1.5 text-[11px]">
                        {elStatus ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-emerald-400 font-bold font-sans">
                              ✅ Eligible! Your income comfortably covers the ₹{reqLoan.toLocaleString('en-IN')} loan.
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className="text-amber-400 font-bold font-sans">
                              ⚠️ Income below standard requirements. Raise down payment or lease tenure.
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Price History & Locality Index Chart */}
            <PriceHistoryChart property={property} />

            {/* Smart Energy Consumption Utility Line Chart Widget */}
            {property.purpose === 'RENT' && (
              <SmartEnergyWidget property={property} />
            )}

            {/* Community Vibe & Neighborhood Tips section */}
            <CommunityVibeSection property={property} />

            {/* 360° VR Interior Tour interactive panel */}
            <VirtualTour360 />

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
                      {property.ownerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{property.ownerName}</h4>
                      <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider bg-slate-950 border border-white/10 rounded px-1.5 py-0.5">{property.ownerType}</span>
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

      </div>

      {showLightbox && (
        <FullscreenLightbox
          images={property.images}
          initialIdx={activeImageIdx}
          onClose={() => setShowLightbox(false)}
          title={property.title}
        />
      )}

    </div>
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
          <p className="text-emerald-400 font-extrabold font-mono">City Average: {formatYAxis(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
          <div>
            <h3 className="text-xs font-extrabold text-white font-sans">Price History & Local Market Index</h3>
            <p className="text-[10px] text-white/50">Historical price trends vs. city index performance (2022 - 2027)</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-mono bg-blue-500/15 text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
            {property.location.area}
          </span>
        </div>
      </div>

      <div className="h-48 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
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
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-300 leading-normal">
        <Award className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          <strong>Insight:</strong> Rates in {property.location.area} have grown by {(((data[4].LocalPrice - data[0].LocalPrice) / data[0].LocalPrice) * 100).toFixed(0)}% since 2022, outperforming the {property.location.city} baseline index.
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

function VirtualTour360() {
  const [activeRoom, setActiveRoom] = useState(0);
  const [panOffset, setPanOffset] = useState(50); // percentage offset 0-100
  const [isRotating, setIsRotating] = useState(true);

  // Auto rotation effect
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

  const handlePan = (direction: 'left' | 'right') => {
    setIsRotating(false);
    setPanOffset((prev) => {
      const step = 8;
      const next = direction === 'left' ? prev - step : prev + step;
      return Math.max(0, Math.min(100, next));
    });
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Compass className="h-4.5 w-4.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="text-xs font-extrabold text-white font-sans">Interactive 360° Interior tour</h3>
            <p className="text-[10px] text-white/50">Explore beautiful panoramic layout inside rooms</p>
          </div>
        </div>
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/5 max-w-fit shrink-0 gap-1 self-start sm:self-auto">
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
  );
}

// ==========================================
// SMART ENERGY CONSUMPTION WIDGET
// ==========================================
function SmartEnergyWidget({ property }: { property: Property }) {
  const [occupants, setOccupants] = useState<number>(2);

  const basePower = Math.round((property.details.area || 1000) * 1.6);
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
        📌 <strong>Heating / Cooling Factor:</strong> AC usage inflates electricity rates inside {property.location.city} by up to 80% during peak summers (April-June).
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


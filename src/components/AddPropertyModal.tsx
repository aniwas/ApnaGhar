import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Plus, X, Building, DollarSign, MapPin, ListPlus, Trash2, Image as ImageIcon, AlertCircle, CheckCircle, UploadCloud, Info } from 'lucide-react';
import { PropertyCategory, PropertyPurpose, FurnishingStatus } from '../types';
import { INDIAN_CITIES, INDIAN_GEO_DATABASE, GeoLocationItem } from '../data';
import { validatePropertyImage, uploadImageToAWS } from '../services/imageUploadService';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file class (${file.type || 'unknown'}). Only JPG, PNG, WEBP, GIF, and SVG are accepted.`
    };
  }
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `Size too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Limit is 5MB.`
    };
  }
  
  return { isValid: true };
}

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function AddPropertyModal({ isOpen, onClose, onSubmit }: AddPropertyModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility listeners (Escape Closure & Focus Trapping)
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecorating, setIsDecorating] = useState(false);
  const [decorError, setDecorError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PropertyCategory>('RESIDENTIAL');
  const [type, setType] = useState('Apartment');
  const [purpose, setPurpose] = useState<PropertyPurpose>('SELL');
  const [price, setPrice] = useState<number>(5500000);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [maintenanceCharges, setMaintenanceCharges] = useState<number>(0);
  
  // Location
  const [city, setCity] = useState('Mumbai');
  const [stateName, setStateName] = useState('Maharashtra');
  const [districtName, setDistrictName] = useState('Mumbai City / Suburban');
  const [citySearch, setCitySearch] = useState('Mumbai');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [area, setArea] = useState('Bandra West');
  const [address, setAddress] = useState('Turner Road, Bandra');
  const [postalCode, setPostalCode] = useState('400050');
  const [latitude, setLatitude] = useState<number>(18.9750);
  const [longitude, setLongitude] = useState<number>(72.8258);
  
  // Details
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [balconies, setBalconies] = useState<number>(2);
  const [floors, setFloors] = useState<number>(10);
  const [floorNo, setFloorNo] = useState<number>(3);
  const [propertyArea, setPropertyArea] = useState<number>(1400);
  const [furnishingStatus, setFurnishingStatus] = useState<FurnishingStatus>('FULLY_FURNISHED');
  const [facingDirection, setFacingDirection] = useState('East');
  const [waterSupply, setWaterSupply] = useState('24 Hours Available (Municipal + Borewell)');
  const [gatedCommunity, setGatedCommunity] = useState(true);
  const [reraId, setReraId] = useState('');
  const [propertyAge, setPropertyAge] = useState('1-3 Years');
  const [possessionStatus, setPossessionStatus] = useState('Ready to Move');
  const [flooringType, setFlooringType] = useState('Vitrified Tiles');
  const [nearbyLandmark, setNearbyLandmark] = useState('Opposite Central Metro Station');

  // Amenities
  const [masterAmenities, setMasterAmenities] = useState<{ id: string; label: string; active: boolean }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      fetch('/api/amenities')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMasterAmenities(data);
            const initial: { [key: string]: boolean } = {};
            data.forEach(item => {
              if (item.active) {
                // Set default true for standard conveniences
                initial[item.id] = ['parking', 'lift', 'security24x7', 'cctv', 'powerBackup', 'internet'].includes(item.id);
              }
            });
            setSelectedAmenities(initial);
          }
        })
        .catch(err => {
          console.warn("Failed to load master amenities:", err);
        });
    }
  }, [isOpen]);

  // Images input
  const presetImages = {
    preset1: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800'
    ],
    preset2: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800'
    ],
    preset3: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200'
    ]
  };

  const [imageUrl, setImageUrl] = useState<'preset1' | 'preset2' | 'preset3' | 'custom'>('preset1');
  const [galleryImages, setGalleryImages] = useState<string[]>(presetImages.preset1);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // AWS S3 simulated state
  const [awsUploading, setAwsUploading] = useState(false);
  const [awsProgress, setAwsProgress] = useState(0);
  const [awsStatus, setAwsStatus] = useState('');

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'error' | 'success' | 'info' }[]>([]);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    if (isOpen) {
      setImageUrl('preset1');
      setGalleryImages([...presetImages.preset1]);
      setImageFiles([]);
      setNewImageUrl('');
      setImageError(null);
      setDragActive(false);
      setAwsUploading(false);
      setAwsProgress(0);
      setAwsStatus('');
      setToasts([]);
    }
  }, [isOpen]);

  const handleSelectPreset = (preset: 'preset1' | 'preset2' | 'preset3') => {
    setImageUrl(preset);
    setGalleryImages([...presetImages[preset]]);
    setImageFiles([]); // Clear uploaded files when selecting presets
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      await processFiles(files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const validFiles: File[] = [];
    let containsInvalid = false;
    let latestErrorMessage = '';

    for (const file of files) {
      const check = validatePropertyImage(file);
      if (check.isValid) {
        validFiles.push(file);
      } else {
        containsInvalid = true;
        latestErrorMessage = check.error || 'Invalid file.';
        showToast(latestErrorMessage, 'error');
      }
    }

    if (containsInvalid) {
      setImageError(latestErrorMessage || 'Some files were skipped due to validation failures. Ensure images are JPG, PNG, or WebP under 5.00MB.');
    } else {
      setImageError(null);
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      setImageUrl('custom');

      const readPromises = validFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      });

      const base64s = await Promise.all(readPromises);
      const filteredBase64s = base64s.filter(Boolean);

      setGalleryImages(prev => {
        if (imageUrl !== 'custom') {
          return [...filteredBase64s];
        }
        return [...prev, ...filteredBase64s];
      });

      showToast(`Staged ${validFiles.length} file(s) for AWS S3 queue.`, 'success');
    }
  };

  if (!isOpen) return null;

  // Calling Server Gemini API to automatically generate professional description
  const handleAIDecorateDescription = async () => {
    setIsDecorating(true);
    setDecorError(null);

    const payload = {
      category,
      type,
      price,
      area: propertyArea,
      details: { bedrooms, bathrooms, furnishingStatus },
      location: { area, city },
      amenities: selectedAmenities
    };

    try {
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('AI Server is uninitialized or missing configured API secrets.');
      }

      const result = await response.json();
      if (result.description) {
        setDescription(result.description);
      } else if (result.error) {
        throw new Error(result.message || 'Verification failed');
      }
    } catch (err: any) {
      console.warn('AI decorate proxy warn:', err);
      // Fallback generator in case of missing keys
      const mockDescription = `Fabulous, sunlit ${bedrooms > 0 ? `${bedrooms} BHK ` : ''}${type} situated in the heart of ${area}, ${city}. Offering extensive amenities including ${selectedAmenities.parking ? 'designated parking' : ''} ${selectedAmenities.lift ? 'access' : ''} ${selectedAmenities.powerBackup ? 'and uninterrupted back-up power' : ''}. With an open-plan styled modular setup spanning ${propertyArea} sq. ft., this represents an extraordinary residency or lease opportunity for modern families.`;
      
      setDescription(mockDescription);
      setDecorError('Note: Injected default listing template. Set GEMINI_API_KEY inside the "Secrets" panel in Settings to enable real-time Gemini AI composition!');
    } finally {
      setIsDecorating(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);

    let finalizedImages = [...galleryImages];

    // Check if we need to upload files to simulated AWS S3 bucket
    if (imageFiles.length > 0 && imageUrl === 'custom') {
      try {
        setAwsUploading(true);
        setAwsProgress(5);
        setAwsStatus('Establishing secure SSL context with aws-s3-ap-south-1...');
        
        const uploadedUrls: string[] = [];
        let completedCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          setAwsStatus(`Prerequesting signature & uploading image #${i + 1} of ${imageFiles.length} (${file.name})...`);
          
          const uploadedUrl = await uploadImageToAWS(file, (percent) => {
            const fileWeight = 100 / imageFiles.length;
            const currentFileProgress = (percent / 100) * fileWeight;
            const previousFilesProgress = completedCount * fileWeight;
            setAwsProgress(Math.floor(previousFilesProgress + currentFileProgress));
          });
          
          uploadedUrls.push(uploadedUrl);
          completedCount++;
        }
        
        setAwsProgress(100);
        setAwsStatus('All images securely pushed to s3-ap-south-1 cloud storage! Handshaking with ApnaGhar index server...');
        await new Promise(resolve => setTimeout(resolve, 800));
        finalizedImages = uploadedUrls;
        showToast('Successfully uploaded all staged assets to AWS S3 bucket!', 'success');
      } catch (err: any) {
        showToast(`AWS S3 Upload Failure: ${err.message || 'Validation error'}`, 'error');
        setIsSubmitting(false);
        setAwsUploading(false);
        return;
      } finally {
        setAwsUploading(false);
      }
    }

    const formattedPayload = {
      title,
      description: description || 'Beautiful property located in premium surroundings.',
      category,
      type,
      purpose,
      price,
      securityDeposit,
      maintenanceCharges,
      location: { 
        country: 'India', 
        state: stateName, 
        city, 
        area, 
        address, 
        postalCode,
        latitude,
        longitude
      },
      details: { 
        bedrooms, 
        bathrooms, 
        balconies, 
        floors, 
        floorNo, 
        area: propertyArea, 
        furnishingStatus,
        facingDirection,
        waterSupply,
        gatedCommunity,
        reraId,
        propertyAge,
        possessionStatus,
        flooringType,
        nearbyLandmark
      },
      amenities: selectedAmenities,
      images: finalizedImages
    };

    try {
      await onSubmit(formattedPayload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-2xl bg-slate-950/80 p-4 flex items-center justify-center animate-in fade-in duration-200">
      
      <div 
        ref={modalRef} 
        tabIndex={-1} 
        aria-modal="true" 
        role="dialog" 
        className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 text-white focus:outline-none"
      >
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Building className="h-5.5 w-5.5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold font-sans text-white">List Your Property</h2>
              <p className="text-[10px] text-white/50">Add listings to ApnaGhar network</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-white/10 text-white/55 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="max-h-[75vh] overflow-y-auto p-6 space-y-6 bg-slate-900/40">
          
          {/* Section 1: Basic Information */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/10 pb-1.5">
              <ListPlus className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">1. Basic Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious 3 BHK Sea View Flat"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Property Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="SELL" className="bg-slate-900 text-white">SELL (For Sale)</option>
                  <option value="RENT" className="bg-slate-900 text-white">RENT (For Rent)</option>
                  <option value="LEASE" className="bg-slate-900 text-white">LEASE (For Lease)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Broad Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="RESIDENTIAL" className="bg-slate-900 text-white">RESIDENTIAL</option>
                  <option value="COMMERCIAL" className="bg-slate-900 text-white">COMMERCIAL</option>
                  <option value="LAND" className="bg-slate-900 text-white">LAND PLOTS</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Sub-Type</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Apartment, Villa, Plot, Office"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Furnishing Status</label>
                <select
                  value={furnishingStatus}
                  onChange={(e) => setFurnishingStatus(e.target.value as FurnishingStatus)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="UNFURNISHED" className="bg-slate-900 text-white">UNFURNISHED</option>
                  <option value="SEMI_FURNISHED" className="bg-slate-900 text-white">SEMI FURNISHED</option>
                  <option value="FULLY_FURNISHED" className="bg-slate-900 text-white">FULLY FURNISHED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Details */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/10 pb-1.5">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">2. Pricing Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Property Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Monthly Maintenance (₹)</label>
                <input
                  type="number"
                  value={maintenanceCharges}
                  onChange={(e) => setMaintenanceCharges(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Geographic Location */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/10 pb-1.5">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">3. Geographic Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Search City *</label>
                <input
                  type="text"
                  required
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setCity(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder="Type to search (e.g. Pune, Noida)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
                
                {showCitySuggestions && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-905 bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-2 py-1 flex items-center justify-between text-[10px] text-white/40">
                      <span>Standard Indian Regions</span>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCitySuggestions(false);
                        }} 
                        className="text-blue-400 hover:text-white font-bold"
                      >
                        [Close]
                      </button>
                    </div>
                    {(() => {
                      const query = citySearch.toLowerCase().trim();
                      const filtered = INDIAN_GEO_DATABASE.filter(item => 
                        item.city.toLowerCase().includes(query) || 
                        item.district.toLowerCase().includes(query) || 
                        item.state.toLowerCase().includes(query)
                      );
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="p-2 text-xs text-white/50 text-center">No standard matches found</div>
                        );
                      }
                      
                      const initCoordsMap: { [key: string]: { lat: number, lng: number } } = {
                        "Mumbai": { lat: 18.9750, lng: 72.8258 },
                        "Delhi": { lat: 28.6139, lng: 77.2090 },
                        "Bangalore": { lat: 12.9716, lng: 77.5946 },
                        "Hyderabad": { lat: 17.3850, lng: 78.4867 },
                        "Chennai": { lat: 13.0827, lng: 80.2707 },
                        "Kolkata": { lat: 22.5726, lng: 88.3639 },
                        "Pune": { lat: 18.5204, lng: 73.8567 },
                        "Noida": { lat: 28.5355, lng: 77.3910 },
                        "Gurgaon": { lat: 28.4595, lng: 77.0266 },
                        "Ahmedabad": { lat: 23.0225, lng: 72.5714 }
                      };

                      return filtered.slice(0, 15).map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setCity(item.city);
                            setCitySearch(item.city);
                            setStateName(item.state);
                            setDistrictName(item.district);
                            setShowCitySuggestions(false);
                            
                            const selectedAnchor = initCoordsMap[item.city] || { lat: 20.5937, lng: 78.9629 };
                            setLatitude(selectedAnchor.lat);
                            setLongitude(selectedAnchor.lng);
                          }}
                          className="w-full text-left p-2 hover:bg-white/5 border-b border-white/5 text-xs text-white flex flex-col cursor-pointer"
                        >
                          <span className="font-bold">{item.city}</span>
                          <span className="text-[10px] text-white/50">{item.district}, {item.state}</span>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">District (Auto)</label>
                <input
                  type="text"
                  disabled
                  value={districtName}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/50 font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">State (Auto)</label>
                <input
                  type="text"
                  disabled
                  value={stateName}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/50 font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Area / Suburb *</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Bandra, Sector 62, Whitefield"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Full Postal Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Tower C, Floor 14, Turner Road"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Postal Code (PIN) *</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 400050"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 3.5: Interactive Coordinate Pin-Dropper Picker */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/10 pb-1.5">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">3.5 Interactive Map Location Pin-Dropper</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 relative h-[200px] bg-slate-950 border border-white/10 rounded-2xl overflow-hidden cursor-crosshair">
                {/* Visual SVG blueprint representing grid lines and streets */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-35"></div>
                
                {/* Concentric rings represent radio-radar boundaries */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] border border-blue-500/10 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-emerald-500/5 rounded-full"></div>

                <svg className="absolute inset-0 w-full h-full text-slate-800/20" stroke="currentColor" strokeWidth="1.5" fill="none">
                  <line x1="120" y1="0" x2="120" y2="400" strokeWidth="2" />
                  <line x1="0" y1="100" x2="800" y2="100" strokeWidth="2" />
                  <path d="M0,60 Q200,120 400,90 T800,150" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="3" />
                </svg>

                {/* Pin interaction handler layer */}
                <div 
                  className="absolute inset-0 z-10"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const pctX = (x / rect.width) - 0.5;
                    const pctY = 0.5 - (y / rect.height);
                    
                    const newLat = Number((latitude + (pctY * 0.12)).toFixed(6));
                    const newLng = Number((longitude + (pctX * 0.12)).toFixed(6));
                    
                    setLatitude(newLat);
                    setLongitude(newLng);
                  }}
                >
                  <span className="absolute bottom-2 left-3 text-[9px] font-mono text-white/40 bg-slate-900/90 px-2 py-0.5 rounded border border-white/5">
                    🎯 CLICK ANYWHERE ON BLUEPRINT Grid TO RELOCATE THE PIN
                  </span>

                  {/* Absolute pin marker centered visually */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="absolute inline-flex h-10 w-10 rounded-full bg-emerald-500/30 animate-pulse"></span>
                    <MapPin className="h-6 w-6 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="bg-slate-900/90 text-[9px] text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20 mt-1 shadow-xl">
                      Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-center">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase font-mono block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(Number(e.target.value).toFixed(6)))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase font-mono block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(Number(e.target.value).toFixed(6)))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-400">
                  Update coordinates or click anywhere to drop a pin.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Specifications */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/10 pb-1.5">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">4. Property Details & Size</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Bedrooms Count</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Bathrooms Count</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Balconies</label>
                <input
                  type="number"
                  value={balconies}
                  onChange={(e) => setBalconies(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Total Floors</label>
                <input
                  type="number"
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Build Area (Sq Ft) *</label>
                <input
                  type="number"
                  required
                  value={propertyArea}
                  onChange={(e) => setPropertyArea(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 4.5: Construction, Facing & Regulatory Details */}
          <div>
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/10 pb-1.5">
              <Building className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono">4.5 Construction, Facing & Regulatory Info</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Property Floor No.</label>
                <input
                  type="number"
                  value={floorNo}
                  onChange={(e) => setFloorNo(Number(e.target.value))}
                  placeholder="e.g. 3"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Vastu Facing Direction</label>
                <select
                  value={facingDirection}
                  onChange={(e) => setFacingDirection(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="East" className="bg-slate-900 text-white">East</option>
                  <option value="North" className="bg-slate-900 text-white">North</option>
                  <option value="North-East" className="bg-slate-900 text-white">North-East</option>
                  <option value="West" className="bg-slate-900 text-white">West</option>
                  <option value="South" className="bg-slate-900 text-white">South</option>
                  <option value="North-West" className="bg-slate-900 text-white">North-West</option>
                  <option value="South-East" className="bg-slate-900 text-white">South-East</option>
                  <option value="South-West" className="bg-slate-900 text-white">South-West</option>
                  <option value="None" className="bg-slate-900 text-white">None / Facing Main Road</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Possession Status</label>
                <select
                  value={possessionStatus}
                  onChange={(e) => setPossessionStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="Ready to Move" className="bg-slate-900 text-white">Ready to Move</option>
                  <option value="Under Construction" className="bg-slate-900 text-white">Under Construction</option>
                  <option value="New Launch" className="bg-slate-900 text-white">New Launch</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Age of Construction</label>
                <select
                  value={propertyAge}
                  onChange={(e) => setPropertyAge(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="New Launch / Under Construction" className="bg-slate-900 text-white">New Launch / Under Construction</option>
                  <option value="Brand New (Ready)" className="bg-slate-900 text-white">Brand New (Ready)</option>
                  <option value="1-3 Years" className="bg-slate-900 text-white">1-3 Years</option>
                  <option value="3-5 Years" className="bg-slate-900 text-white">3-5 Years</option>
                  <option value="5-10 Years" className="bg-slate-900 text-white">5-10 Years</option>
                  <option value="10+ Years" className="bg-slate-900 text-white">10+ Years</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Flooring Type</label>
                <select
                  value={flooringType}
                  onChange={(e) => setFlooringType(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="Vitrified Tiles" className="bg-slate-900 text-white">Vitrified Tiles</option>
                  <option value="Italian Marble" className="bg-slate-900 text-white">Italian Marble</option>
                  <option value="Premium Indian Marble" className="bg-slate-900 text-white">Premium Indian Marble</option>
                  <option value="Granite" className="bg-slate-900 text-white">Granite</option>
                  <option value="Hardwood Wood" className="bg-slate-900 text-white">Hardwood Wood</option>
                  <option value="Laminated Wooden" className="bg-slate-900 text-white">Laminated Wooden</option>
                  <option value="Mosaic Tiles" className="bg-slate-900 text-white">Mosaic Tiles</option>
                  <option value="Ceramic / Slate" className="bg-slate-900 text-white">Ceramic / Slate</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Nearby Landmark</label>
                <input
                  type="text"
                  value={nearbyLandmark}
                  onChange={(e) => setNearbyLandmark(e.target.value)}
                  placeholder="e.g. Opposite Central Metro Station"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Water Supply Setup</label>
                <input
                  type="text"
                  value={waterSupply}
                  onChange={(e) => setWaterSupply(e.target.value)}
                  placeholder="e.g. 24 Hours Available (Municipal Corporate + Borewell)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">RERA ID (Regulatory Number)</label>
                <input
                  type="text"
                  value={reraId}
                  onChange={(e) => setReraId(e.target.value)}
                  placeholder="e.g. P51800001234"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">Gated Neighborhood?</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none">
                    <input
                      type="radio"
                      name="gatedCommunity"
                      checked={gatedCommunity === true}
                      onChange={() => setGatedCommunity(true)}
                      className="accent-blue-500"
                    />
                    <span>Yes, Gated Complex</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none">
                    <input
                      type="radio"
                      name="gatedCommunity"
                      checked={gatedCommunity === false}
                      onChange={() => setGatedCommunity(false)}
                      className="accent-blue-500"
                    />
                    <span>No / Standalone</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Amenities Icons Checklists */}
          <div>
            <span className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-2">Amenities Offerings</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {masterAmenities.filter(item => item.active).map((item, idx) => (
                <label key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-950/40 cursor-pointer select-none text-[11px] font-semibold text-white/90 transition-all ${selectedAmenities[item.id] ? 'border-blue-500/40 bg-blue-500/5 text-white' : ''}`}>
                  <input
                    type="checkbox"
                    checked={!!selectedAmenities[item.id]}
                    onChange={() => setSelectedAmenities(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="accent-blue-500 cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 6: Unlimited Photo Gallery Asset Manager */}
          <div className="backdrop-blur-xl bg-slate-950/40 rounded-3xl p-5 border border-white/10 space-y-4">
            <div>
              <label className="text-[11px] font-bold text-white/50 uppercase font-mono block mb-1">6. Property Photo Gallery ({galleryImages.length} images)</label>
              <p className="text-[10px] text-white/40 mb-3">Load a base preset starting bundle, or drag and drop raw image files (JPG, PNG, WebP) to upload to our secure AWS S3 bucket.</p>
            </div>

            {/* Quick Presets Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pb-2">
              <button 
                type="button"
                onClick={() => handleSelectPreset('preset1')}
                className={`py-2 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${imageUrl === 'preset1' ? 'bg-blue-500/10 border-blue-500 text-blue-300 font-bold font-sans' : 'bg-slate-950 border-white/5 hover:border-white/15 text-white/60'}`}
              >
                <span>🏢 Apartment Preset</span>
                <span className="text-[9px] font-mono opacity-50">2 Photos</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSelectPreset('preset2')}
                className={`py-2 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${imageUrl === 'preset2' ? 'bg-[#059669]/10 border-[#10b981] text-[#a7f3d0] font-bold font-sans' : 'bg-slate-950 border-white/5 hover:border-white/15 text-white/60'}`}
              >
                <span>🏡 Luxury Villa Preset</span>
                <span className="text-[9px] font-mono opacity-50">2 Photos</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSelectPreset('preset3')}
                className={`py-2 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${imageUrl === 'preset3' ? 'bg-[#7c3aed]/10 border-[#8b5cf6] text-[#ddd6fe] font-bold font-sans' : 'bg-slate-950 border-white/5 hover:border-white/15 text-white/60'}`}
              >
                <span>🌇 Corporate Office Preset</span>
                <span className="text-[9px] font-mono opacity-50">1 Photo</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setImageUrl('custom');
                  setGalleryImages([]);
                  setImageFiles([]);
                }}
                className={`py-2 px-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${imageUrl === 'custom' && galleryImages.length === 0 ? 'bg-[#d97706]/10 border-[#f59e0b] text-[#fde68a] font-bold font-sans' : 'bg-slate-950 border-white/5 hover:border-white/15 text-white/60'}`}
              >
                <span>✨ Start From Scratch</span>
                <span className="text-[9px] font-mono opacity-50">0 Photos</span>
              </button>
            </div>

            {/* Custom URL addition Input row and direct multi-file drag & drop selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag and Drop multiple files */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-white/40 uppercase font-mono block">6a. Drag & Drop or select multiple image files</span>
                <div 
                  id="gallery-file-dropzone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('property-gallery-file-upload')?.click()}
                  className={`border border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 select-none min-h-[96px] ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-500/10 text-white' 
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5 bg-slate-900/30 text-white/60'
                  }`}
                >
                  <input
                    type="file"
                    id="property-gallery-file-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <ListPlus className="h-6 w-6 text-blue-400 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-white">Drag and drop images, or <span className="text-blue-400 underline">browse</span></p>
                    <p className="text-[8px] text-white/40 font-mono uppercase">JPG, PNG, OR WEBP (MAX 5MB)</p>
                  </div>
                </div>
                {imageFiles.length > 0 && (
                  <div className="flex items-center justify-between bg-slate-950/65 rounded-xl px-2.5 py-1.5 border border-white/5 animate-in fade-in">
                    <span className="text-[9px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      <span>{imageFiles.length} file(s) queued for AWS S3</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFiles([]);
                        setGalleryImages([]);
                        setImageUrl('custom');
                        showToast('AWS S3 Queue cleared', 'info');
                      }}
                      className="text-[9px] font-bold uppercase text-red-400 hover:text-red-300 font-mono cursor-pointer"
                    >
                      Clear Queue
                    </button>
                  </div>
                )}
              </div>

              {/* URL method fallback */}
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-white/40 uppercase font-mono block mb-2">6b. Or add custom image URLs manually</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value);
                        setImageError(null);
                      }}
                      placeholder="Paste secure URL here (https://images.unsplash.com/...)"
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newImageUrl.trim()) return;
                        if (!newImageUrl.startsWith('http://') && !newImageUrl.startsWith('https://')) {
                          setImageError('Please enter a valid URL starting with http:// or https://');
                          showToast('Please enter a valid URL starting with http:// or https://', 'error');
                          return;
                        }
                        setImageUrl('custom');
                        setGalleryImages(prev => [...prev, newImageUrl.trim()]);
                        setNewImageUrl('');
                        setImageError(null);
                        showToast('Added manual URL to gallery', 'info');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 font-sans text-xs text-white px-3.5 py-2 font-bold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add URL</span>
                    </button>
                  </div>
                </div>

                {imageError && (
                  <p className="text-[10px] text-red-400 font-mono select-none leading-tight">{imageError}</p>
                )}
              </div>
            </div>

            {/* Premium Category Pre-designed Stock Library Adders */}
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase font-mono block mb-1.5">No camera ready? Add beautiful preset rooms with one click:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Living Room 🛋️", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200" },
                  { label: "Luxury Kitchen 🍳", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200" },
                  { label: "Master Bedroom 🛏️", url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=1200" },
                  { label: "Modern Bathroom 🛁", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200" },
                  { label: "Infinity Pool 🏊", url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200" },
                  { label: "Balcony View 🌅", url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=1200" },
                  { label: "Lush Garden 🏡", url: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=1200" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl('custom');
                      setGalleryImages(prev => [...prev, item.url]);
                      showToast(`Injected ${item.label} snapshot!`, 'info');
                    }}
                    className="text-[10px] font-sans bg-slate-900 border border-white/5 hover:border-blue-500/40 text-slate-300 hover:text-white rounded-lg px-2.5 py-1.5 transition-all cursor-pointer hover:bg-blue-500/5 select-none"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AWS S3 Real-time Simulated Upload Progress Bar Container */}
            {awsUploading && (
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-blue-500/30 shadow-2xl space-y-2.5 animate-in slide-in-from-bottom duration-300 select-none">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-blue-400 animate-pulse flex items-center gap-1.5 uppercase">
                    <UploadCloud className="h-4 w-4 text-blue-400 animate-bounce" />
                    <span>AWS Multi-Part S3 Chunking Protocol Active</span>
                  </span>
                  <span className="font-mono font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">{awsProgress}%</span>
                </div>
                
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 relative shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                    style={{ width: `${awsProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] animate-shimmer bg-[size:200%_100%]"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-white/50 leading-relaxed bg-slate-900/40 p-2 rounded-xl border border-white/5">
                  <p>Stream: <span className="text-white font-bold">{awsStatus}</span></p>
                  <p className="text-emerald-400 select-none">ap-south-1</p>
                </div>
              </div>
            )}

            {/* Preview Gallery component: displays thumbnail previews, files metadata layout and individual removal of items */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <span className="text-[10px] font-bold text-white/40 uppercase font-mono block">Preview Gallery ({galleryImages.length} live visually staged assets)</span>
                {imageUrl === 'custom' && imageFiles.length > 0 && (
                  <span className="text-[9px] font-bold text-blue-400 font-mono tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                    ☁️ AWS S3 Queue Staged ({imageFiles.length} files)
                  </span>
                )}
              </div>

              {galleryImages.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-white/10">
                  <p className="text-xs text-slate-400 italic">No gallery images added yet. Click preset bundle cards, drop high-res pictures, or add custom URLs above to instantly build the visual layout!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5" id="staged-preview-gallery">
                  {galleryImages.map((img, index) => {
                    // Match file size and name metadata if this index maps to a staged file in imageFiles
                    const stagedFile = imageUrl === 'custom' && imageFiles[index] ? imageFiles[index] : null;
                    const formattedSize = stagedFile ? `${(stagedFile.size / (1024 * 1024)).toFixed(2)} MB` : "External Preset";
                    const truncatedName = stagedFile ? (stagedFile.name.length > 15 ? `${stagedFile.name.substring(0, 12)}...` : stagedFile.name) : `Visual Asset #${index + 1}`;

                    return (
                      <div key={index} className="relative aspect-video sm:aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-white/15 shadow-lg group hover:border-blue-500/50 transition-all duration-300 animate-in fade-in zoom-in-95">
                        <img 
                          src={img} 
                          alt={truncatedName} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Overlay tags and captions */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-1.5 pointer-events-none">
                          <p className="text-[9px] font-bold font-sans text-white truncate leading-none">{truncatedName}</p>
                          <p className="text-[7.5px] font-mono text-white/50 mt-0.5 leading-none">{formattedSize}</p>
                        </div>

                        <div className="absolute top-1.5 left-1.5 bg-slate-950/80 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded border border-white/5 shadow-md">
                          #{index + 1}
                        </div>

                        {stagedFile && (
                          <div className="absolute top-1.5 left-8 bg-blue-500/90 text-white font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border border-blue-400/20 shadow-md">
                            QUEUED
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const isPreset = imageUrl !== 'custom';
                            setImageUrl('custom');
                            setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
                            // Align imageFiles deletion index properly if we are in custom mode
                            if (!isPreset) {
                              setImageFiles(prev => prev.filter((_, idx) => idx !== index));
                            }
                            showToast(`Removed visual asset #${index + 1} from list`, 'info');
                          }}
                          className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-600 text-white p-1 rounded-lg shadow-lg cursor-pointer transition-all duration-200 border border-white/10 hover:scale-110 active:scale-95 flex items-center justify-center"
                          title="Remove from queue"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 7: Description text with AI COMPOSER */}
          <div className="bg-slate-950/70 rounded-3xl p-5 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-400 font-sans" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  5. Detailed Description & AI Composer
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAIDecorateDescription}
                disabled={isDecorating}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                {isDecorating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>AI Composing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Autocomplete with Gemini</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide key highlights about this beautiful property... Or tap autocomplete button on the top right to draft automatically!"
              className="w-full bg-slate-900 border border-white/10 hover:border-white/15 focus:border-blue-500 rounded-2xl p-4 text-xs text-white placeholder-white/40 focus:outline-none transition-all font-sans"
            />

            {decorError && (
              <span className="text-[10px] text-amber-300 block mt-2 leading-relaxed">
                {decorError}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 border border-white/10 text-white hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Listing...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Submit Property Listing</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Dynamic Toaster Notification Portal overlay */}
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`p-3.5 rounded-2xl border shadow-2xl flex items-start gap-2.5 pointer-events-auto backdrop-blur-xl animate-in slide-in-from-right-10 duration-300 ${
                toast.type === 'error' 
                  ? 'bg-red-950/90 border-red-500/30 text-rose-200' 
                  : toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900/95 border-white/10 text-slate-200'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              ) : toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-bold leading-tight font-sans">
                  {toast.type === 'error' ? 'Validation Error' : toast.type === 'success' ? 'S3 Upload Success' : 'System Notice'}
                </p>
                <p className="text-[10px] text-white/70 font-mono mt-1 break-normal leading-relaxed">{toast.message}</p>
              </div>
              <button 
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/40 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

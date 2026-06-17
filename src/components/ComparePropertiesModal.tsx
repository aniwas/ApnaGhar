import React, { useEffect, useRef } from 'react';
import { X, Check, ArrowRight, Star } from 'lucide-react';
import { Property } from '../types';

interface CompareModalProps {
  propertyIds: string[];
  allProperties: Property[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onSelectProperty: (property: Property) => void;
}

export default function ComparePropertiesModal({ 
  propertyIds, 
  allProperties, 
  onClose, 
  onRemove,
  onSelectProperty
}: CompareModalProps) {
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

  const selectedList = allProperties.filter(p => propertyIds.includes(p.id)).slice(0, 3);

  // Format Indian currency style
  const formatINR = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const amenityKeys = [
    { label: '🚘 Covered Parking', key: 'parking' },
    { label: '🛗 High Speed Lift', key: 'lift' },
    { label: '🏊 Swimming Pool', key: 'swimmingPool' },
    { label: '🏋️ Smart Gym', key: 'gym' },
    { label: '🌲 Relax Garden', key: 'garden' },
    { label: '🛡️ 24/7 Guards Security', key: 'security24x7' },
    { label: '📹 CCTV Cam Surveillance', key: 'cctv' },
    { label: '⚡ full Power Backup', key: 'powerBackup' },
    { label: '📶 High Speed Broadband', key: 'internet' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-2xl bg-slate-950/85 p-4 sm:p-6 md:p-8 flex items-center justify-center animate-in fade-in duration-200">
      
      <div 
        ref={modalRef} 
        tabIndex={-1} 
        aria-modal="true" 
        role="dialog" 
        className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 text-white flex flex-col max-h-[90vh] focus:outline-none"
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-black font-sans leading-none">⚖️ Side-by-Side Property Comparison Matrix</h2>
            <p className="text-[11px] text-white/50 mt-1">Symmetrical metrics audit alignment of up to three selected listing candidates</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Core Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedList.length === 0 ? (
            <div className="py-16 text-center text-white/40 italic">
              No property listings added to comparison pool yet. Clear selections & check comparing listings!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-xs text-white/80 select-none">
                <thead>
                  <tr className="border-b border-white/15 bg-white/5">
                    <th className="p-4 font-bold text-white/40 uppercase tracking-widest font-mono text-[10px] w-1/4">Metric Specifications</th>
                    {selectedList.map(p => (
                      <th key={p.id} className="p-4 w-1/4 relative border-l border-white/10">
                        <button 
                          onClick={() => onRemove(p.id)}
                          className="absolute top-2 right-2 text-[9px] font-mono tracking-widest font-bold uppercase text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                        <div className="pr-12">
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} className="w-full h-24 object-cover rounded-xl bg-slate-950 border border-white/10 mb-2" />
                          <h4 className="font-extrabold text-white text-xs line-clamp-1">{p.title || 'Property'}</h4>
                          <span className="text-[9px] font-mono font-black text-blue-400">{p.location?.area || ''}, {p.location?.city || ''}</span>
                        </div>
                      </th>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, idx) => (
                      <th key={idx} className="p-4 w-1/4 bg-white/5 opacity-40 text-center text-[10.5px] italic text-white/30 border-l border-white/10">
                        Empty comparison slot
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {/* Price range */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Asking Value / Price</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 font-bold text-sm text-blue-400">
                        {formatINR(p.price)}
                        {p.purpose !== 'SELL' && <span className="text-[10px] font-normal text-white/40"> / mo</span>}
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Rating Stars */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Ratings Feedback</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10">
                        {p.averageRating !== undefined && p.averageRating !== null ? (
                          <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                            ★ {p.averageRating} <span className="text-white/40 font-normal">({p.reviewsCount} reviews)</span>
                          </span>
                        ) : (
                          <span className="text-white/30 italic">No feedback registered</span>
                        )}
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Purpose */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Inventory Purpose</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 uppercase font-bold text-white/90">
                        {p.purpose === 'SELL' ? '🇮🇳 Buy / Own' : '🔑 Month rent'}
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* BHK Configuration */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">BHK Beds Layout</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 font-bold">
                        {p.details?.bedrooms ? `${p.details.bedrooms} BHK configuration` : 'Commercial/Standard plot'}
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Bathrooms */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Bathrooms count</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 font-mono">
                        {p.details?.bathrooms || '-'} Baths
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Floor Area */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Super Built Area</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 font-mono text-emerald-400 font-bold">
                        {p.details?.area ? `${p.details.area} Sq. Ft.` : 'N/A'}
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Furnishing */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Furnishing status</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 font-sans capitalize">
                        {p.details?.furnishingStatus ? p.details.furnishingStatus.toLowerCase() : 'Unspecified'}
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Owner Partner */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Partner listing Host</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10 font-semibold text-xs text-white/90">
                        {p.ownerName} <span className="text-[9px] font-mono text-white/40 block">({p.ownerType})</span>
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>

                  {/* Amenities title row */}
                  <tr className="bg-white/5">
                    <td colSpan={4} className="p-2.5 font-bold uppercase tracking-wider text-[10px] text-blue-400 font-mono">
                      Amenities Alignment Mapping
                    </td>
                  </tr>

                  {amenityKeys.map(amenity => (
                    <tr key={amenity.key}>
                      <td className="p-3 font-medium text-white/70 pl-6 text-[11px]">{amenity.label}</td>
                      {selectedList.map(p => {
                        const hasIt = p.amenities ? !!(p.amenities as any)[amenity.key] : false;
                        return (
                          <td key={p.id} className="p-3 border-l border-white/10 text-center">
                            {hasIt ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[9px]">
                                <Check className="h-3 w-3" strokeWidth={3} /> INCLUDED
                              </span>
                            ) : (
                              <span className="text-white/20 select-none">-</span>
                            )}
                          </td>
                        );
                      })}
                      {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-3 border-l border-white/10 bg-slate-950/20"></td>)}
                    </tr>
                  ))}

                  {/* Action row at bottom */}
                  <tr>
                    <td className="p-4 font-mono font-bold text-white/60 uppercase tracking-wide text-[9px]">Operations</td>
                    {selectedList.map(p => (
                      <td key={p.id} className="p-4 border-l border-white/10">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectProperty(p);
                          }}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Details <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    ))}
                    {selectedList.length < 3 && Array.from({ length: 3 - selectedList.length }).map((_, i) => <td key={i} className="p-4 border-l border-white/10 bg-slate-950/20"></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Close Symmetrical Matrix
          </button>
        </div>

      </div>

    </div>
  );
}

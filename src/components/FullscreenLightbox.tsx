import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenLightboxProps {
  images: string[];
  initialIdx: number;
  onClose: () => void;
  title: string;
}

export default function FullscreenLightbox({ images, initialIdx, onClose, title }: FullscreenLightboxProps) {
  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isFullscreenState, setIsFullscreenState] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus modal container on mount
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // Touch tracking refs for pinch & swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Reset zoom & pan when image changes
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  }, [activeIdx]);

  // Handle keyboard arrow keys, Escape, and Focus Trapping
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      else if (e.key === 'ArrowRight') {
        handleNext();
        return;
      }
      else if (e.key === 'ArrowLeft') {
        handlePrev();
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
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIdx, onClose]);

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  // Magnify / Zoom operations
  const zoomIn = () => setZoomScale((prev) => Math.min(prev + 0.5, 4));
  const zoomOut = () => setZoomScale((prev) => Math.max(prev - 0.5, 1));
  const resetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const toggleFullscreenNative = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreenState(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreenState(false);
    }
  };

  // Wheel zoom helper
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Touch handlers for swipe & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger: Prep swipe or Drag/Pan if zoomed
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      
      if (zoomScale > 1) {
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.touches[0].clientX - panPosition.x,
          y: e.touches[0].clientY - panPosition.y,
        };
      }
    } else if (e.touches.length === 2) {
      // Two fingers: Pinch zoom
      touchStartRef.current = null; // abort swipe
      isDraggingRef.current = false;

      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current && zoomScale > 1) {
      // Pan/Drag zoomed image
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPanPosition({ x: dx, y: dy });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null && touchStartScaleRef.current !== null) {
      // Multi-touch Pinch calculation
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const computedScale = Math.min(Math.max(touchStartScaleRef.current * ratio, 1), 4);
      setZoomScale(computedScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

      // Ensure it was a horizontal swipe rather than scroll
      if (Math.abs(deltaX) > 55 && Math.abs(deltaY) < 100) {
        if (deltaX > 0) {
          handlePrev(); // Swipe Right -> Prev
        } else {
          handleNext(); // Swipe Left -> Next
        }
      }
    }
    // Clear refs
    touchStartRef.current = null;
    touchStartDistRef.current = null;
    touchStartScaleRef.current = null;
    isDraggingRef.current = false;
  };

  return (
    <div 
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] backdrop-blur-3xl bg-black/95 select-none flex flex-col justify-between p-4 animate-in fade-in duration-200 focus:outline-none"
    >
      
      {/* Top Header Controls Bar */}
      <div className="w-full h-16 flex items-center justify-between border-b border-white/5 px-2 sm:px-6">
        <div>
          <h4 className="text-[11px] font-bold tracking-widest text-blue-400 font-mono uppercase">Full Resolution View</h4>
          <p className="text-white text-xs sm:text-sm font-semibold truncate max-w-[250px] sm:max-w-[450px]">
            {title} ({activeIdx + 1} / {images.length})
          </p>
        </div>

        {/* Gallery Control Tools */}
        <div className="flex items-center gap-1.5 sm:gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl">
          <button
            onClick={zoomOut}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <span className="text-[10px] font-mono font-bold text-slate-400/80 px-1">
            {zoomScale.toFixed(1)}x
          </span>

          <button
            onClick={zoomIn}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            onClick={resetZoom}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Reset Fit"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <span className="h-4 w-px bg-white/10 mx-1"></span>

          <button
            onClick={toggleFullscreenNative}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer hidden sm:inline-block"
            title="Toggle Native Screen Zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
            title="Exit Screen"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main Slideshow Workspace */}
      <div 
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden cursor-move touch-none"
        onWheel={handleWheelZoom}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Arrow */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-2 sm:left-6 z-10 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer shadow-2xl active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Center Stage Image Viewer */}
        <div 
          className="transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
          }}
          onDoubleClick={zoomScale > 1 ? resetZoom : () => setZoomScale(2.5)}
        >
          <img
            src={images[activeIdx]}
            alt={`Immersive full preview ${activeIdx + 1}`}
            className="max-w-[90vw] max-h-[75vh] object-contain rounded-2xl select-none pointer-events-none shadow-2xl border border-white/5"
            draggable={false}
          />
        </div>

        {/* Right Arrow */}
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-2 sm:right-6 z-10 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer shadow-2xl active:scale-95"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Slider Index Navigation Bar */}
      <div className="w-full flex flex-col items-center py-4 border-t border-white/5 space-y-2.5 bg-black/40">
        <div className="flex gap-1.5 max-w-full overflow-x-auto px-6 py-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-14 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${activeIdx === i ? 'border-blue-500 scale-105 shadow-lg' : 'border-white/10 opacity-40 hover:opacity-100'}`}
            >
              <img src={img} alt={`Thumb preview ${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <p className="text-[10px] sm:text-xs text-white/40 font-mono uppercase tracking-wider">
          💡 Swipe horizontally, Pinch-to-zoom (multitouch), or Double click to Zoom
        </p>
      </div>

    </div>
  );
}

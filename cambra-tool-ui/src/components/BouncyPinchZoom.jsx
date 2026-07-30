// /src/components/BouncyPinchZoom.jsx
import React, { useRef, useEffect } from 'react';
import 'pinch-zoom-element-js';

export default function BouncyPinchZoom({ src, alt, className = "" }) {
  const pinchZoomRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const pz = pinchZoomRef.current;
    if (!pz) return;

    // 1. Desktop: Centered Mouse Wheel Zoom
    const handleWheel = (e) => {
      e.preventDefault();
      
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      const newScale = Math.max(1, Math.min(pz.scale * zoomFactor, 5));

      // Snap back if scaled out completely
      if (newScale <= 1) {
        pz.setTransform({ scale: 1, x: 0, y: 0 });
        return;
      }

      // Calculate perfect center zoom
      const newX = (pz.offsetWidth - (pz.offsetWidth * newScale)) / 2;
      const newY = (pz.offsetHeight - (pz.offsetHeight * newScale)) / 2;
      pz.setTransform({ scale: newScale, x: newX, y: newY });
    };

    // 2. Mobile & Desktop: Smooth Bouncy Snap-Back on Release
    const resetZoomSmoothly = () => {
      if (pz.scale === 1 && pz.x === 0 && pz.y === 0) return;

      const innerWrapper = pz.firstElementChild;
      if (innerWrapper) {
        // Bouncy Expo ease-out curve
        innerWrapper.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (innerWrapper) innerWrapper.style.transition = 'none';
        }, 500); // match transition duration
      }
      pz.setTransform({ scale: 1, x: 0, y: 0 });
    };

    // Attach native events
    // passive: false is REQUIRED for wheel events to allow e.preventDefault()
    pz.addEventListener('wheel', handleWheel, { passive: false });
    
    const releaseEvents = ['pointerup', 'pointercancel', 'pointerleave', 'touchend'];
    releaseEvents.forEach(evt => pz.addEventListener(evt, resetZoomSmoothly));

    // Cleanup listeners on unmount
    return () => {
      pz.removeEventListener('wheel', handleWheel);
      releaseEvents.forEach(evt => pz.removeEventListener(evt, resetZoomSmoothly));
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-[260px] overflow-hidden rounded-xl border border-slate-700/50 bg-black/30 touch-none select-none">
      {/* 
        Custom web component tags in React. 
        Strings are used for boolean attributes to satisfy the Web Component spec.
      */}
      <pinch-zoom 
        ref={pinchZoomRef} 
        disable-pan="true" 
        animating="true"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <div className="absolute top-0 left-0 w-full h-full origin-top">
          <img 
            src={src} 
            alt={alt} 
            className={`w-full h-full object-contain pointer-events-none ${className}`} 
            draggable="false"
          />
        </div>
      </pinch-zoom>
    </div>
  );
}
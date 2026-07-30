// src/components/BouncyPinchZoom.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

// ── Constants ──────────────────────────────────────────────
const BASE_SCALE = 1;
const ZOOM_SCALE = 2;
const SWIPE_THRESHOLD = 30;      // px minimum to count as a swipe
const SWIPE_ANGLE_BIAS = 0.6;    // ratio threshold: dominant axis must be > 60% of total
const ANIM_DURATION = 380;       // ms for all transitions
const EASE_CURVE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // smooth expo out

export default function BouncyPinchZoom({ src, alt, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(BASE_SCALE);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);

  // refs that survive re-renders without causing them
  const scaleRef = useRef(BASE_SCALE);
  const posRef = useRef({ x: 0, y: 0 });
  const animLockRef = useRef(false);
  const pointerRef = useRef(null); // tracks active gesture

  // keep refs in sync
  scaleRef.current = scale;
  posRef.current = pos;

  // ── helpers ──────────────────────────────────────────────
  const getMaxOffset = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    return (el.offsetWidth * (ZOOM_SCALE - 1)) / 2;
  }, []);

  // returns { x, y } clamped so image always fills container
  const clamp = useCallback(
    (x, y) => {
      const m = getMaxOffset();
      return {
        x: Math.max(-m, Math.min(m, x)),
        y: Math.max(-m, Math.min(m, y)),
      };
    },
    [getMaxOffset],
  );

  // quadrant offset for a given corner
  const quadrantPos = useCallback(
    (right, bottom) => {
      const m = getMaxOffset();
      return { x: right ? -m : m, y: bottom ? -m : m };
    },
    [getMaxOffset],
  );

  // smoothly transition to target state
  const goTo = useCallback(
    (nextScale, nextPos) => {
      if (animLockRef.current) return;
      animLockRef.current = true;
      setAnimate(true);
      setScale(nextScale);
      setPos(nextPos);
      setTimeout(() => {
        setAnimate(false);
        animLockRef.current = false;
      }, ANIM_DURATION);
    },
    [],
  );

  const zoomOut = useCallback(() => goTo(BASE_SCALE, { x: 0, y: 0 }), [goTo]);

  const zoomInto = useCallback(
    (clientX, clientY) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const right = clientX - rect.left > rect.width / 2;
      const bottom = clientY - rect.top > rect.height / 2;
      goTo(ZOOM_SCALE, quadrantPos(right, bottom));
    },
    [goTo, quadrantPos],
  );

  // snap to the nearest axis-aligned quadrant based on a drag vector
  const snapToQuadrant = useCallback(
    (dx, dy) => {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const total = absDx + absDy || 1;

      const cur = posRef.current;
      const m = getMaxOffset();

      let targetX = cur.x;
      let targetY = cur.y;

      // determine if the swipe is mostly horizontal, mostly vertical, or truly diagonal
      const horizontalRatio = absDx / total;
      const verticalRatio = absDy / total;

      if (horizontalRatio >= SWIPE_ANGLE_BIAS) {
        // purely horizontal swipe
        targetX = dx > 0 ? m : -m;
      } else if (verticalRatio >= SWIPE_ANGLE_BIAS) {
        // purely vertical swipe
        targetY = dy > 0 ? m : -m;
      } else {
        // user genuinely swiped diagonally — honour it
        targetX = dx > 0 ? m : -m;
        targetY = dy > 0 ? m : -m;
      }

      goTo(ZOOM_SCALE, { x: targetX, y: targetY });
    },
    [goTo, getMaxOffset],
  );

  // ── pointer handlers ────────────────────────────────────
  const onPointerDown = (e) => {
    if (animLockRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: posRef.current.x,
      startPosY: posRef.current.y,
      startTime: Date.now(),
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const p = pointerRef.current;
    if (!p || p.id !== e.pointerId) return;
    if (scaleRef.current <= BASE_SCALE) return; // no pan when not zoomed

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) p.moved = true;

    const raw = clamp(p.startPosX + dx, p.startPosY + dy);
    setPos(raw);
  };

  const onPointerUp = (e) => {
    const p = pointerRef.current;
    if (!p || p.id !== e.pointerId) return;
    pointerRef.current = null;

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dt = Date.now() - p.startTime;

    // ── TAP (no significant movement) ──
    if (!p.moved || dist < 6) {
      if (scaleRef.current <= BASE_SCALE) {
        zoomInto(e.clientX, e.clientY);
      } else {
        zoomOut();
      }
      return;
    }

    // ── SWIPE while zoomed in ──
    if (scaleRef.current > BASE_SCALE && dist > SWIPE_THRESHOLD) {
      snapToQuadrant(dx, dy);
      return;
    }

    // ── small drag that didn't meet swipe threshold — snap to nearest quadrant ──
    if (scaleRef.current > BASE_SCALE) {
      const cur = posRef.current;
      const m = getMaxOffset();
      const nearX = cur.x >= 0 ? m : -m;
      const nearY = cur.y >= 0 ? m : -m;
      goTo(ZOOM_SCALE, { x: nearX, y: nearY });
    }
  };

  const onPointerCancel = () => {
    pointerRef.current = null;
    if (scaleRef.current > BASE_SCALE) {
      const cur = posRef.current;
      const m = getMaxOffset();
      goTo(ZOOM_SCALE, { x: cur.x >= 0 ? m : -m, y: cur.y >= 0 ? m : -m });
    }
  };

  // ── wheel zoom toggle ──────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      if (animLockRef.current) return;

      if (scaleRef.current <= BASE_SCALE && e.deltaY < 0) {
        const rect = el.getBoundingClientRect();
        const right = e.clientX - rect.left > rect.width / 2;
        const bottom = e.clientY - rect.top > rect.height / 2;
        const m = (el.offsetWidth * (ZOOM_SCALE - 1)) / 2;
        goTo(ZOOM_SCALE, { x: right ? -m : m, y: bottom ? -m : m });
      } else if (scaleRef.current > BASE_SCALE && e.deltaY > 0) {
        goTo(BASE_SCALE, { x: 0, y: 0 });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goTo]);

  // ── render ──────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="relative w-full aspect-square overflow-hidden rounded-xl bg-slate-950 touch-none select-none cursor-pointer"
    >
      {/* decorative inner stroke */}
      <div className="pointer-events-none absolute inset-0 rounded-xl border-[3px] border-slate-900 z-10" />

      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`,
          transition: animate
            ? `transform ${ANIM_DURATION}ms ${EASE_CURVE}`
            : 'none',
          willChange: 'transform',
        }}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover pointer-events-none ${className}`}
          draggable="false"
        />
      </div>
    </div>
  );
}
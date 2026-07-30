import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity, User, Check, AlertCircle, Shield, PieChart,
    ChevronLeft, ChevronRight, Zap, Stethoscope, ShieldCheck,
    ClipboardCheck, Calendar, ArrowUpRight, Droplets, Info,
    ChevronDown, HeartPulse, X, Download,
    Settings, Shuffle, FileText, Minus, Layers, Eye, EyeOff
} from 'lucide-react';
import BouncyPinchZoom from './components/BouncyPinchZoom';

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const STYLE_ID = 'cambra-styles-v3';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap');

    @keyframes cFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cSlideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
    @keyframes cScaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
    @keyframes cPop { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
    @keyframes cPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
    @keyframes cDrift { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(1deg)} }
    @keyframes cTypeIn { from{max-width:0} to{max-width:600px} }
    @keyframes cBlink { 0%,100%{border-color:transparent} 50%{border-color:currentColor} }

    .c-fade-up{animation:cFadeUp .4s cubic-bezier(.22,1,.36,1) both}
    .c-slide-up{animation:cSlideUp .4s cubic-bezier(.22,1,.36,1) both}
    .c-scale-in{animation:cScaleIn .3s cubic-bezier(.22,1,.36,1) both}
    .c-pop{animation:cPop .35s cubic-bezier(.22,1,.36,1) both}
    .c-drift{animation:cDrift 4s ease-in-out infinite}
    .c-pulse-dot{animation:cPulse 2s ease-in-out infinite}

    .c-d1{animation-delay:.05s} .c-d2{animation-delay:.1s}
    .c-d3{animation-delay:.15s} .c-d4{animation-delay:.2s}
    .c-d5{animation-delay:.25s}

    /* Smooth accordion via grid rows */
    .c-accordion{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .35s cubic-bezier(.4,0,.2,1),opacity .3s cubic-bezier(.4,0,.2,1)}
    .c-accordion.open{grid-template-rows:1fr;opacity:1}
    .c-accordion>div{overflow:hidden}

    /* Checkbox morph */
    .c-check{transition:all .25s cubic-bezier(.4,0,.2,1)}
    .c-check.on{transform:scale(1);opacity:1}
    .c-check.off{transform:scale(0);opacity:0}

    /* Score chip */
    .c-chip-enter{animation:cPop .35s cubic-bezier(.22,1,.36,1) both}

    /* Typing animation for welcome */
    .c-type-wrap{display:inline-block;overflow:hidden;white-space:nowrap;animation:cTypeIn 1.2s cubic-bezier(.22,1,.36,1) both}
    .c-type-wrap::after{content:'';border-right:1px solid currentColor;animation:cBlink 1s step-end infinite;margin-inline-start:2px}
    .c-type-wrap.done::after{border-color:transparent}

    .c-blink{animation:cBlink 1s step-end infinite}

@media print{@page{margin:0;size:A4}}

html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden; /* Locks the window body from scrolling */
        background-color: #ffffff;
    }

    /* Screen preview: simulate A4 pages */

    .lhsmall{
    line-height:10px;
    }
    `;
    document.head.appendChild(s);
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE PATHS
// ═══════════════════════════════════════════════════════════════════════════════
const CAMBRA_IMAGES = {
    ui_balance_single_25: '/images/ui_balance_single_25.png',
    ui_empty_single_24: '/images/ui_empty_single_24.png',
    ui_header_disease_single_23: '/images/ui_header_disease_single_23.png',
    ui_header_protective_single_22: '/images/ui_header_protective_single_22.png',
    ui_header_risk_single_21: '/images/ui_header_risk_single_21.png',
    ui_hero_single_20: '/images/ui_hero_single_20.png',
    ui_loading_single_18: '/images/ui_loading_single_18.png',
    ui_outcome_extreme_single_19: '/images/ui_outcome_extreme_single_19.png',
    ui_outcome_high_single_17: '/images/ui_outcome_high_single_17.png',
    ui_outcome_low_single_16: '/images/ui_outcome_low_single_16.png',
    ui_outcome_moderate_single_15: '/images/ui_outcome_moderate_single_15.png',
    ui_tab_disease_single_14: '/images/ui_tab_disease_single_14.png',
    ui_tab_patient_single_13: '/images/ui_tab_patient_single_13.png',
    ui_tab_protective_single_12: '/images/ui_tab_protective_single_12.png',
    ui_tab_results_single_11: '/images/ui_tab_results_single_11.png',
};

const OUTCOME_IMAGES = {
    lowRisk: 'ui_outcome_low_single_16',
    moderateRisk: 'ui_outcome_moderate_single_15',
    highRisk: 'ui_outcome_high_single_17',
    extremeRisk: 'ui_outcome_extreme_single_19',
};

const CImg = ({ name, alt = '', className = '', style = {} }) => (
    <img
        src={CAMBRA_IMAGES[name]}
        alt={alt}
        draggable={false}
        className={className}
        style={{ objectFit: 'contain', userSelect: 'none', ...style }}
    />
);

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toFa = (n, lang) => lang !== 'fa' ? String(n) : String(n).replace(/\d/g, d => FA[+d]);

/** Always store chartNo with English digits; display with locale digits */
// const normalizeDigits = (str) =>
//     str.replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728 + 48))
//        .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));

const displayDigits = (str, lang) =>
    lang !== 'fa' ? str : str.replace(/\d/g, d => FA[+d]);

// ═══════════════════════════════════════════════════════════════════════════════
// JALALI
// ═══════════════════════════════════════════════════════════════════════════════
function g2j(gy, gm, gd) { const g = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; let jy = gy <= 1600 ? 0 : 979; gy -= gy <= 1600 ? 621 : 1600; const gy2 = gm > 2 ? gy + 1 : gy; let d = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g[gm - 1]; jy += 33 * Math.floor(d / 12053); d %= 12053; jy += 4 * Math.floor(d / 1461); d %= 1461; if (d > 365) { jy += Math.floor((d - 1) / 365); d = (d - 1) % 365 } const jm = d < 186 ? 1 + Math.floor(d / 31) : 7 + Math.floor((d - 186) / 30); const jd = 1 + (d < 186 ? d % 31 : (d - 186) % 30); return { jy, jm, jd } }
function j2g(jy, jm, jd) { jy += 1595; let d = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186); let gy = 400 * Math.floor(d / 146097); d %= 146097; if (d > 36524) { gy += 100 * Math.floor(--d / 36524); d %= 36524; if (d >= 365) d++ } gy += 4 * Math.floor(d / 1461); d %= 1461; if (d > 365) { gy += Math.floor((d - 1) / 365); d = (d - 1) % 365 } let gd = d + 1; const s = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let gm; for (gm = 0; gm < 13 && gd > s[gm]; gm++)gd -= s[gm]; return { gy, gm, gd } }
const jLeap = jy => [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33);
const jML = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : jLeap(jy) ? 30 : 29;
const gLeap = gy => (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
const gML = (gy, gm) => [31, gLeap(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][gm - 1];
const JM = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const JW = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const GM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const GW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const todJ = () => { const d = new Date(); return g2j(d.getFullYear(), d.getMonth() + 1, d.getDate()) };
const todG = () => { const d = new Date(); return { gy: d.getFullYear(), gm: d.getMonth() + 1, gd: d.getDate() } };
const jDow = (jy, jm, jd) => { const g = j2g(jy, jm, jd); return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7 };
const gDow = (gy, gm, gd) => new Date(gy, gm - 1, gd).getDay();
const ds = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ═══════════════════════════════════════════════════════════════════════════════
// PORTAL DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════
function PortalLegacy({ anchorRef, open, onClose, children, maxH = 420 }) {
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const [flip, setFlip] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open || !anchorRef.current) return;
        const u = () => { const r = anchorRef.current.getBoundingClientRect(); const sb = window.innerHeight - r.bottom; const sa = r.top; const f = sb < maxH && sa > sb; setFlip(f); setPos({ top: f ? r.top + window.scrollY : r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: Math.max(r.width, 280) }) };
        u(); window.addEventListener('scroll', u, true); window.addEventListener('resize', u);
        return () => { window.removeEventListener('scroll', u, true); window.removeEventListener('resize', u) };
    }, [open, anchorRef, maxH]);
    useEffect(() => {
        if (!open) return;
        const h = e => { if (anchorRef.current?.contains(e.target) || ref.current?.contains(e.target)) return; onClose() };
        document.addEventListener('mousedown', h); document.addEventListener('touchstart', h);
        return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h) };
    }, [open, onClose, anchorRef]);
    if (!open) return null;
    return createPortal(<div ref={ref} className="c-scale-in" style={{ position: 'absolute', zIndex: 9999, top: flip ? 'auto' : pos.top, bottom: flip ? `${window.innerHeight - pos.top + 4}px` : 'auto', left: pos.left, width: pos.width, maxHeight: maxH, transformOrigin: flip ? 'bottom center' : 'top center' }}>{children}</div>, document.body);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTAL DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════
function Portal({ anchorRef, open, onClose, children, maxH = 420 }) {
    const [pos, setPos] = useState({ top: 'auto', bottom: 'auto', left: 0, width: 0, actualMaxH: maxH });
    const [flip, setFlip] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open || !anchorRef.current) return;
        const u = () => {
            const r = anchorRef.current.getBoundingClientRect();
            // Calculate available space in viewport
            const spaceBelow = window.innerHeight - r.bottom - 16;
            const spaceAbove = r.top - 16;
            const shouldFlip = spaceBelow < maxH && spaceAbove > spaceBelow;

            // Strictly clamp maximum height so it never exits the window
            const actualMaxH = Math.min(maxH, shouldFlip ? spaceAbove : spaceBelow);

            // Constrain width and left position to prevent horizontal overflow on mobile
            const winW = window.innerWidth;
            let finalWidth = Math.max(r.width, 280);
            if (finalWidth > winW - 32) finalWidth = winW - 32; // 16px padding on sides

            let finalLeft = r.left; // Use Fixed positioning so we drop window.scrollX
            if (finalLeft + finalWidth > winW - 16) finalLeft = winW - finalWidth - 16;
            if (finalLeft < 16) finalLeft = 16;

            setFlip(shouldFlip);
            setPos({
                top: shouldFlip ? 'auto' : r.bottom + 4,
                bottom: shouldFlip ? window.innerHeight - r.top + 4 : 'auto',
                left: finalLeft,
                width: finalWidth,
                actualMaxH
            });
        };
        u(); window.addEventListener('scroll', u, true); window.addEventListener('resize', u);
        return () => { window.removeEventListener('scroll', u, true); window.removeEventListener('resize', u) };
    }, [open, anchorRef, maxH]);

    useEffect(() => {
        if (!open) return;
        const h = e => { if (anchorRef.current?.contains(e.target) || ref.current?.contains(e.target)) return; onClose() };
        document.addEventListener('mousedown', h); document.addEventListener('touchstart', h);
        return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h) };
    }, [open, onClose, anchorRef]);

    if (!open) return null;
    return createPortal(
        <div ref={ref} className="c-scale-in" style={{
            position: 'fixed', // Changed from absolute to fixed to ignore body scroll
            zIndex: 9999,
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.actualMaxH,
            // overflowY: 'auto', // Enables internal scrolling if clamped
            transformOrigin: flip ? 'bottom center' : 'top center'
        }}>
            {children}
        </div>,
        document.body
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════════════════════
function CalPicker({ value, onChange, lang }) {
    const fa = lang === 'fa'; const [open, setOpen] = useState(false); const aRef = useRef(null);
    const parse = useCallback(() => { if (value) { const [y, m, d] = value.split('-').map(Number); return { y, m, d } } if (fa) { const t = todJ(); return { y: t.jy, m: t.jm, d: t.jd } } const t = todG(); return { y: t.gy, m: t.gm, d: t.gd } }, [value, fa]);
    const p = parse(); const [vY, sY] = useState(p.y); const [vM, sM] = useState(p.m);
    useEffect(() => { const pp = parse(); sY(pp.y); sM(pp.m) }, [value, lang]);
    const mn = fa ? JM : GM; const wd = fa ? JW : GW; const ml = fa ? jML(vY, vM) : gML(vY, vM); const fd = fa ? jDow(vY, vM, 1) : gDow(vY, vM, 1);
    const td = fa ? todJ() : todG(); const tY = fa ? td.jy : td.gy; const tM = fa ? td.jm : td.gm; const tD = fa ? td.jd : td.gd;
    const pv = () => { if (vM === 1) { sM(12); sY(vY - 1) } else sM(vM - 1) }; const nx = () => { if (vM === 12) { sM(1); sY(vY + 1) } else sM(vM + 1) };
    const pk = d => { onChange(ds(vY, vM, d)); setOpen(false) };
    const pkT = () => { if (fa) { const t = todJ(); onChange(ds(t.jy, t.jm, t.jd)) } else { const t = todG(); onChange(ds(t.gy, t.gm, t.gd)) } setOpen(false) };
    const disp = () => { if (!value) return fa ? 'انتخاب تاریخ' : 'Select date'; const [y, m, d] = value.split('-').map(Number); return fa ? `${toFa(d, 'fa')} ${JM[m - 1]} ${toFa(y, 'fa')}` : `${GM[m - 1]} ${d}, ${y}` };
    const cells = []; for (let i = 0; i < fd; i++)cells.push(null); for (let d = 1; d <= ml; d++)cells.push(d); while (cells.length % 7) cells.push(null);
    return (<>
        <button ref={aRef} type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl text-base cursor-pointer hover:border-slate-400 active:scale-[.98] transition-all">
            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-white" /></div><span className={`font-semibold ${!value ? 'text-slate-400' : 'text-slate-900'}`}>{disp()}</span></div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
        <Portal anchorRef={aRef} open={open} onClose={() => setOpen(false)} maxH={380}>
            <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0_#0f172a] overflow-hidden" dir={fa ? 'rtl' : 'ltr'}>
                <div className="flex gap-2 p-2.5 border-b border-slate-100">
                    <button onClick={pkT} className="flex-1 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-700 active:scale-95 transition-all">{fa ? 'امروز' : 'Today'}</button>
                    <button onClick={() => { const y = new Date(); y.setDate(y.getDate() - 1); if (fa) { const j = g2j(y.getFullYear(), y.getMonth() + 1, y.getDate()); onChange(ds(j.jy, j.jm, j.jd)) } else onChange(ds(y.getFullYear(), y.getMonth() + 1, y.getDate())); setOpen(false) }} className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200 active:scale-95 transition-all">{fa ? 'دیروز' : 'Yesterday'}</button>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                    <button onClick={fa ? nx : pv} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer active:scale-90 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                    <span className="font-bold text-sm select-none">{mn[vM - 1]} <span className="text-slate-500 font-mono">{toFa(vY, lang)}</span></span>
                    <button onClick={fa ? pv : nx} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer active:scale-90 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-7 px-2.5">{wd.map((w, i) => <div key={i} className="text-center text-[9px] font-bold text-slate-400 uppercase py-1">{w}</div>)}</div>
                <div className="grid grid-cols-7 gap-0.5 p-2.5 pt-0.5">
                    {cells.map((day, i) => {
                        if (!day) return <div key={i} />; const iT = vY === tY && vM === tM && day === tD; const iS = vY === p.y && vM === p.m && day === p.d; return (
                            <button key={i} onClick={() => pk(day)} className={`relative w-full aspect-square rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer active:scale-90 transition-all ${iS ? 'bg-slate-900 text-white shadow-lg' : iT ? 'bg-slate-100 text-slate-900 font-bold ring-2 ring-slate-300' : 'hover:bg-slate-50 text-slate-600'}`}>{toFa(day, lang)}{iT && !iS && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-slate-900" />}</button>
                        )
                    })}
                </div>
            </div>
        </Portal>
    </>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM SELECT
// ═══════════════════════════════════════════════════════════════════════════════
function Sel({ value, onChange, options, placeholder, icon: Ic }) {
    const [open, setOpen] = useState(false); const aRef = useRef(null); const sel = options.find(o => o.value === value);
    return (<>
        <button ref={aRef} type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl text-base cursor-pointer hover:border-slate-400 active:scale-[.98] transition-all">
            <div className="flex items-center gap-2.5">{Ic && <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center"><Ic className="w-3.5 h-3.5 text-white" /></div>}<span className={`font-semibold ${sel ? 'text-slate-900' : 'text-slate-400'}`}>{sel ? sel.label : placeholder}</span></div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
        <Portal anchorRef={aRef} open={open} onClose={() => setOpen(false)} maxH={250}>
            <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0_#0f172a] overflow-hidden">
                {options.map((o, i) => (
                    <button key={o.value} onClick={() => { onChange(o.value); setOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 text-start cursor-pointer transition-all ${i < options.length - 1 ? 'border-b border-slate-100' : ''} ${value === o.value ? 'bg-slate-50' : 'hover:bg-slate-50'} active:bg-slate-100`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${value === o.value ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>{value === o.value && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}</div>
                        <div><span className="font-semibold text-sm text-slate-900">{o.label}</span>{o.desc && <span className="block text-xs text-slate-400 mt-0.5">{o.desc}</span>}</div>
                    </button>
                ))}
            </div>
        </Portal>
    </>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTOR ROW — totally redesigned
// ═══════════════════════════════════════════════════════════════════════════════
// function FactorRow({label,hint,desc,checked,onToggle,color,weight,lang}){
//     const[showDesc,setShowDesc]=useState(false);

function FactorRow({ label, hint, desc, checked, onToggle, color, weight, lang, descOpen, onDescToggle }) {

    const prevChecked = useRef(checked);
    const [popKey, setPopKey] = useState(0);
    useEffect(() => { if (prevChecked.current !== checked) { setPopKey(k => k + 1); prevChecked.current = checked } }, [checked]);

    const palette = {
        red: { check: 'bg-red-500', ring: 'ring-red-200', dot: 'bg-red-400', badge: 'bg-red-500', hintBg: 'bg-red-50', hintBorder: 'border-red-100', hintText: 'text-red-800', infoBtn: 'text-red-400 hover:text-red-600' },
        amber: { check: 'bg-amber-500', ring: 'ring-amber-200', dot: 'bg-amber-400', badge: 'bg-amber-500', hintBg: 'bg-amber-50', hintBorder: 'border-amber-100', hintText: 'text-amber-800', infoBtn: 'text-amber-400 hover:text-amber-600' },
        emerald: { check: 'bg-emerald-500', ring: 'ring-emerald-200', dot: 'bg-emerald-400', badge: 'bg-emerald-500', hintBg: 'bg-emerald-50', hintBorder: 'border-emerald-100', hintText: 'text-emerald-800', infoBtn: 'text-emerald-400 hover:text-emerald-600' },
    }[color];
    const sign = color === 'emerald' ? '−' : '+';

    return (
        <div className={`group transition-colors duration-200 ${checked ? 'bg-slate-50/50' : 'bg-transparent'}`}>
            {/* Main row */}
            <div className="flex items-start gap-3 px-4 sm:px-5 py-3 cursor-pointer select-none" onClick={onToggle}>
                {/* Checkbox */}
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${checked ? `${palette.check} border-transparent ring-2 ${palette.ring}` : 'border-slate-300'}`}>
                    <Check className={`w-3 h-3 text-white c-check ${checked ? 'on' : 'off'}`} strokeWidth={3} />
                </div>
                {/* Label */}
                <div className="flex-1 min-w-0 pt-px">
                    <span className={`text-[13px] leading-snug transition-colors duration-200 ${checked ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{label}</span>
                    {/* Inline hint */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 leading-tight">{hint}</span>
                        {desc && (
                            <button type="button" onClick={e => { e.stopPropagation(); onDescToggle() }} className={`flex-shrink-0 transition-colors cursor-pointer ${palette.infoBtn}`}>
                                <Info className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
                {/* Weight badge */}
                <div className={`flex-shrink-0 mt-0.5 transition-all duration-300 ${checked ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                    {checked && (
                        <div key={popKey} className={`c-pop inline-flex items-center gap-px px-2 py-0.5 rounded-md ${palette.badge} text-white text-xs font-bold font-mono`} dir="ltr">
                            <span className="opacity-70 text-[10px]">{sign}</span>{toFa(weight, lang)}
                        </div>
                    )}
                </div>
            </div>
            {/* Expandable description */}
            {desc && (
                <div className={`c-accordion ${descOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                    <div>
                        <div className={`mx-4 sm:mx-5 mb-3 ms-12 p-3 rounded-xl border text-xs leading-relaxed ${palette.hintBg} ${palette.hintBorder} ${palette.hintText}`}>
                            {desc}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME SCREEN — typographic, no cards, no icons grid
// ═══════════════════════════════════════════════════════════════════════════════
function Welcome({ lang, onStart }) {
    const fa = lang === 'fa';
    const [typed, setTyped] = useState(false);
    useEffect(() => { const t = setTimeout(() => setTyped(true), 1400); return () => clearTimeout(t) }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-100px)] px-5">
            <div className="w-full max-w-md space-y-6 text-center">
                {/* Logo mark */}
                <div className="c-fade-up flex justify-center">
                    <CImg name="ui_hero_single_20" alt="CAMBRA" className="w-28 h-28 sm:w-36 sm:h-36 c-drift" />
                </div>
                {/* Title — typographic, not decorated */}
                <div className="c-fade-up c-d1 space-y-3">
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                        CAMBRA
                    </h1>
                    <div className="h-px w-12 bg-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                        {fa
                            ? 'ابزار بالینی ارزیابی ریسک پوسیدگی دندان. اطلاعات بیمار را وارد کنید و برنامه درمانی دریافت کنید.'
                            : 'Clinical caries risk assessment tool. Enter patient data and receive a personalised treatment plan.'
                        }
                    </p>
                </div>

                {/* Animated protocol name */}
                <div className="c-fade-up c-d2">
                    <p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-400">
                        <span className={`c-type-wrap ${typed ? 'done' : ''}`}>
                            {fa ? 'مدیریت پوسیدگی بر اساس ارزیابی ریسک' : 'Caries Management by Risk Assessment'}
                        </span>
                    </p>
                </div>

                {/* Minimal process indicator */}
                {/* <div className="c-fade-up c-d3 flex items-center justify-center gap-1">
                    {[1,2,3,4].map(n=>(
                        <React.Fragment key={n}>
                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-500 font-mono">{toFa(n,lang)}</span>
                            </div>
                            {n<4&&<div className="w-4 h-px bg-slate-200"/>}
                        </React.Fragment>
                    ))}
                </div> */}

                {/* CTA */}
                <div className="c-fade-up c-d4">
                    <button onClick={onStart} className="group relative cursor-pointer active:scale-[.97] transition-transform w-full sm:w-auto">
                        <div className="absolute inset-0 bg-slate-700 rounded-xl translate-y-1" />
                        <div className="relative bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:translate-y-0.5 transition-transform">
                            {fa ? 'شروع' : 'Start'}
                            <ChevronRight className={`w-4 h-4 opacity-50 ${fa ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                </div>

                <p className="c-fade-up c-d5 text-[9px] text-slate-300 font-medium tracking-wider uppercase">
                    {fa ? 'بیماران ۶ سال و بالاتر' : 'Patients aged 6+'}
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════
function PdfModal({ open, onClose, lang, patient, results, config, diseaseInd, riskFact, protFact }) {
    const fa = lang === 'fa'; const t = config?.dict?.[lang];
    const SECS = [
        { id: 'patient', label: fa ? 'اطلاعات بیمار' : 'Patient Info', on: true },
        { id: 'disease', label: fa ? 'شاخص‌های بیماری' : 'Disease Indicators', on: true },
        { id: 'risk', label: fa ? 'عوامل خطر' : 'Risk Factors', on: true },
        { id: 'protect', label: fa ? 'عوامل محافظتی' : 'Protective Factors', on: true },
        { id: 'result', label: fa ? 'نتیجه' : 'Result', on: true },
        { id: 'tables', label: fa ? 'جداول مرجع' : 'Reference Tables', on: true },
        { id: 'plan', label: fa ? 'برنامه درمانی' : 'Action Plan', on: true },
    ];
    const [secs, setSecs] = useState(SECS);
    useEffect(() => { if (open) setSecs(SECS) }, [open, lang]);
    const tog = id => setSecs(p => p.map(s => s.id === id ? { ...s, on: !s.on } : s));
    const isOn = id => secs.find(s => s.id === id)?.on;

    const gen = () => {
        const rc = { lowRisk: '#059669', moderateRisk: '#d97706', highRisk: '#dc2626', extremeRisk: '#7f1d1d' };
        const rb = { lowRisk: '#ecfdf5', moderateRisk: '#fffbeb', highRisk: '#fef2f2', extremeRisk: '#fef2f2' };
        const catL = t?.[results?.finalCat] || '';
        const dateD = (() => { if (!patient.date) return ''; const [y, m, d] = patient.date.split('-').map(Number); return fa ? `${toFa(d, 'fa')} ${JM[m - 1]} ${toFa(y, 'fa')}` : `${GM[m - 1]} ${d}, ${y}`; })();
        const rl = (arr, pfx) => arr.map((v, i) => v ? t?.[`${pfx}_${i + 1}`] : null).filter(Boolean);
        const RM = { lowRisk: { d: 'rec_low_diag', i: 'rec_low_int' }, moderateRisk: { d: 'rec_mod_diag', i: 'rec_mod_int' }, highRisk: { d: 'rec_high_diag', i: 'rec_high_int' }, extremeRisk: { d: 'rec_ext_diag', i: 'rec_ext_int' } };

        let body = '';

        if (isOn('patient')) body += `<section><h2>Patient Information</h2><div class="g2"><div class="gi"><div class="gl">${t?.patientName}</div><div class="gv">${patient.name || '—'}</div></div><div class="gi"><div class="gl">${t?.chartNo}</div><div class="gv mono">${patient.chartNo || '—'}</div></div><div class="gi"><div class="gl">${t?.date}</div><div class="gv">${dateD}</div></div><div class="gi"><div class="gl">${t?.assessmentType}</div><div class="gv">${patient.assessmentType === 'baseline' ? t?.baseline : t?.recall}</div></div></div></section>`;

        const makeList = (arr, pfx, title, cls) => { const items = rl(arr, pfx); body += `<section><h2>${title}</h2>`; if (items.length) body += `<ul class="fl ${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`; else body += `<p class="empty">${fa ? 'موردی نیست' : 'None'}</p>`; body += `</section>`; };
        if (isOn('disease')) makeList(diseaseInd, 'di', fa ? 'شاخص‌های بیماری' : 'Disease Indicators', 'red');
        if (isOn('risk')) makeList(riskFact, 'rf', fa ? 'عوامل خطر' : 'Risk Factors', 'amber');
        if (isOn('protect')) makeList(protFact, 'pf', fa ? 'عوامل محافظتی' : 'Protective Factors', 'green');

        if (isOn('result')) body += `<section class="result" style="background:${rb[results?.finalCat]};border-color:${rc[results?.finalCat]}"><div class="ri"><div><div class="rl">${fa ? 'سطح خطر' : 'Risk Level'}</div><div class="rv" style="color:${rc[results?.finalCat]}">${catL}</div>${results?.dOverride ? `<div class="ro">${fa ? '⚠ ارتقا با شاخص بیماری' : '⚠ Disease override'}</div>` : ''}${results?.eOverride ? `<div class="ro">${fa ? '⚠ ارتقا با خشکی دهان' : '⚠ Hyposalivation override'}</div>` : ''}</div><div class="sb" style="border-color:${rc[results?.finalCat]}"><div class="sn" style="color:${rc[results?.finalCat]}">${results?.score > 0 ? '+' : ''}${results?.score}</div><div class="ss">${fa ? 'نمره خالص' : 'Net Score'}</div><div class="sd"><span class="si r">+${results?.dScore}</span><span class="si a">+${results?.rScore}</span><span class="si g">−${results?.pScore}</span></div></div></div></section>`;

        if (isOn('tables')) body += `<section><h2>${fa ? 'جداول مرجع بالینی' : 'Clinical Reference Tables'}</h2><div class="tg"><div><h3>ICDAS — ${fa ? 'طبقه‌بندی ضایعات اکلوزال' : 'Occlusal Lesion Classification'}</h3><table><thead><tr><th>${fa ? 'کد' : 'Code'}</th><th>${fa ? 'معنی' : 'Meaning'}</th><th>${fa ? 'وضعیت' : 'Status'}</th></tr></thead><tbody><tr><td class="tc">0</td><td>${fa ? 'سطح دندان سالم' : 'Sound tooth surface'}</td><td>${fa ? 'بدون پوسیدگی' : 'No caries'}</td></tr><tr><td class="tc">1</td><td>${fa ? 'اولین تغییر قابل مشاهده در مینا (فقط بعد از خشک کردن)' : 'First visible enamel change (after drying)'}</td><td>${fa ? 'دمینرالیزاسیون اولیه' : 'Initial demineralisation'}</td></tr><tr><td class="tc">2</td><td>${fa ? 'ضایعه سفید یا قهوه‌ای واضح، بدون نیاز به خشک کردن' : 'Distinct white/brown lesion without drying'}</td><td>${fa ? 'پوسیدگی اولیه مینا' : 'Early enamel caries'}</td></tr><tr><td class="tc">3</td><td>${fa ? 'شکستگی موضعی مینا (Microcavity)، عاج هنوز دیده نمی‌شود' : 'Localised enamel breakdown, no visible dentin'}</td><td>${fa ? 'هنوز عمدتاً محدود به مینا' : 'Mostly enamel-limited'}</td></tr><tr><td class="tc">4</td><td>${fa ? 'سایه تیره از عاج زیر مینا دیده می‌شود' : 'Dark shadow from underlying dentin'}</td><td>${fa ? 'احتمال درگیری عاج' : 'Probable dentin involvement'}</td></tr><tr><td class="tc">5</td><td>${fa ? 'حفره واضح همراه با نمایان شدن عاج' : 'Distinct cavity with exposed dentin'}</td><td>${fa ? 'پوسیدگی واضح' : 'Obvious caries'}</td></tr><tr><td class="tc">6</td><td>${fa ? 'حفره وسیع با تخریب گسترده عاج' : 'Extensive cavity with wide dentin destruction'}</td><td>${fa ? 'پوسیدگی شدید' : 'Severe caries'}</td></tr></tbody></table><div style="margin-top:16px; text-align:center;"><img src="/images/icdas.png" style="max-width:100%; max-height:180px; object-fit:contain;" alt="ICDAS Reference" /></div></div><div><h3>${fa ? 'درجه‌بندی پوسیدگی پروگزیمال' : 'Proximal Caries Classification'} (C1–C4)</h3><table><thead><tr><th>${fa ? 'کد' : 'Code'}</th><th>${fa ? 'محل ضایعه' : 'Lesion Location'}</th></tr></thead><tbody><tr><td class="tc">C1</td><td>${fa ? 'نیمه خارجی مینا' : 'Outer half of enamel'}</td></tr><tr><td class="tc">C2</td><td>${fa ? 'نیمه داخلی مینا' : 'Inner half of enamel'}</td></tr><tr><td class="tc">C3</td><td>${fa ? 'یک‌سوم خارجی عاج' : 'Outer third of dentin'}</td></tr><tr><td class="tc">C4</td><td>${fa ? 'یک‌سوم میانی یا داخلی عاج' : 'Middle or inner third of dentin'}</td></tr></tbody></table></div></div></section>`;

        if (isOn('plan')) body += `<section><h2>${fa ? 'برنامه درمانی' : 'Action Plan'}</h2><div class="pg"><div class="pc"><h3>${t?.recDiagnostics}</h3><div class="px">${t?.[RM[results?.finalCat]?.d] || ''}</div></div><div class="pc dark"><h3>${t?.recInterventions}</h3><div class="px">${t?.[RM[results?.finalCat]?.i] || ''}</div></div></div></section>`;

        const html = `<!DOCTYPE html><html dir="${fa ? 'rtl' : 'ltr'}" lang="${lang}"><head><meta charset="UTF-8"><title>CAMBRA — ${patient.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Vazirmatn',sans-serif;color:#1e293b;font-size:12px;line-height:1.8;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0 14mm}

/* Repeating vertical page margins */
.pw{width:100%;border-collapse:collapse}
.pw thead{display:table-header-group}
.pw tfoot{display:table-footer-group}
.pw>thead td,.pw>tbody>tr>td,.pw>tfoot td{padding:0;border:none}
.pw-top{height:16mm}
.pw-bot{height:14mm}

/* Header */
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0f172a;margin-bottom:32px}
.hdr-l{display:flex;align-items:center;gap:14px}
.logo{width:44px;height:44px;background:#0f172a;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Amiri',serif;font-weight:700;font-size:22px}
.hdr-l h1{font-size:28px;font-weight:900;letter-spacing:-1.5px;line-height:1}
.hdr-l p{font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;margin-top:3px}
.hdr-r{text-align:${fa ? 'left' : 'right'}}
.hdr-r .date{font-size:10px;color:#64748b;font-weight:600}
.badge{display:inline-block;padding:5px 16px;border-radius:8px;color:#fff;font-weight:800;font-size:14px;margin-top:6px}
.hdr-r .name{font-size:11px;font-weight:700;color:#475569;margin-top:4px}

/* Sections */
section{margin-bottom:24px;break-inside:avoid;page-break-inside:avoid;position:relative}
h2{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:#64748b;border-bottom:1.5px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px}
h3{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#475569;margin-bottom:8px}

/* Info grid */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:7px 10px}
.gl{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
.gv{font-size:12px;font-weight:700;color:#0f172a;margin-top:1px}
.mono{font-family:ui-monospace,monospace}

/* Fact lists */
.fl{list-style:none;display:flex;flex-direction:column;gap:4px}
.fl li{display:flex;align-items:flex-start;gap:7px;font-size:11px;font-weight:500;padding:4px 8px;border-radius:5px}
.fl li::before{content:'';width:5px;height:5px;border-radius:50%;margin-top:5px;flex-shrink:0}
.fl.red li{background:#fff1f2;color:#881337}.fl.red li::before{background:#ef4444}
.fl.amber li{background:#fffbeb;color:#78350f}.fl.amber li::before{background:#f59e0b}
.fl.green li{background:#f0fdf4;color:#14532d}.fl.green li::before{background:#22c55e}
.empty{font-size:11px;color:#94a3b8;font-style:italic}

/* Result */
.result{border:2px solid;border-radius:10px;padding:16px 20px}
.ri{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.rl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b}
.rv{font-size:30px;font-weight:900;letter-spacing:-1px;line-height:1;margin-top:4px}
.ro{font-size:9px;font-weight:600;color:#dc2626;margin-top:4px;padding:2px 6px;background:rgba(220,38,38,.08);border-radius:4px;display:inline-block}
.sb{border:2px solid;border-radius:8px;padding:10px 16px;text-align:center;min-width:110px;background:rgba(255,255,255,.7)}
.sn{font-size:38px;font-weight:900;font-family:ui-monospace,monospace;line-height:1}
.ss{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-top:2px}
.sd{display:flex;gap:4px;justify-content:center;margin-top:6px}
.si{font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px}
.si.r{background:#fee2e2;color:#dc2626}.si.a{background:#fef3c7;color:#d97706}.si.g{background:#d1fae5;color:#059669}

/* Tables */
.tg{display:grid;grid-template-columns:2fr 1fr;gap:20px}
table{width:100%;border-collapse:collapse;font-size:10px}
th,td{border:1px solid #e2e8f0;padding:4px 8px;text-align:${fa ? 'right' : 'left'}}
th{background:#f1f5f9;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569}
.tc{text-align:center;font-weight:800;font-family:ui-monospace,monospace;background:#f8fafc}

/* Plan */
.pg{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pc{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;break-inside:avoid}
.pc h3{margin:0;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.pc.dark h3{background:#0f172a;color:#e2e8f0;border:none}
.px{padding:10px 12px;font-size:11px;line-height:1.8}
.px ul{list-style:none;display:flex;flex-direction:column;gap:5px}
.px li{padding:4px 8px;border-radius:5px;background:#f8fafc;border:1px solid #f1f5f9}

/* Footer */
.ftr{margin-top:36px;padding-top:10px;border-top:1.5px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;font-weight:600}
.ftr b{color:#475569;letter-spacing:2px;text-transform:uppercase}

@media print{section{break-inside:avoid}.pg>div,.tg>div{break-inside:avoid}}
@media screen{
  html{background:#64748b}
  body{background:#64748b;padding:0}
  .pw{display:block;width:210mm;margin:0 auto}
  .pw thead,.pw tfoot{display:none}
  .page{background:#fff;width:210mm;min-height:297mm;padding:18mm 16mm;margin:24px auto;box-shadow:0 4px 32px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.08);position:relative}
  .page+.page::before{content:'';display:block;position:absolute;top:-24px;left:0;right:0;height:24px;background:#64748b}
}
@media print{
  .pw>thead td,.pw>tbody td,.pw>tfoot td{padding-left:0;padding-right:0}
}
/* Hide scrollbars for horizontal tab rows */
.hide-scroll::-webkit-scrollbar { display: none; }
.hide-scroll { -ms-overflow-style: none; scrollbar-width: none; scroll-behavior: smooth; }

/* Prevent iOS auto-zoom on inputs while keeping accessible pinch-to-zoom */
@media screen and (max-width: 768px) {
    input[type="text"], input[type="number"], input[type="tel"], select, textarea {
        font-size: 16px !important;
    }
}
    
</style></head><body>
<table class="pw"><thead><tr><td><div class="pw-top"></div></td></tr></thead><tbody><tr><td>
<div class="page"><div class="hdr"><div class="hdr-l"><div class="logo">C</div><div><h1>CAMBRA</h1><p>${fa ? 'گزارش ارزیابی ریسک پوسیدگی' : 'Caries Risk Assessment Report'}</p></div></div><div class="hdr-r"><div class="date">${dateD}</div><div class="badge" style="background:${rc[results?.finalCat]}">${catL}</div>${patient.name ? `<div class="name">${patient.name}</div>` : ''}</div></div>
${body}
<div class="ftr"><b>CAMBRA</b><span>${fa ? 'ابزار بالینی ارزیابی ریسک پوسیدگی' : 'Clinical Caries Risk Assessment Tool'}</span><span>${dateD}</span></div>
</div></td></tr></tbody><tfoot><tr><td><div class="pw-bot"></div></td></tr></tfoot></table></body></html>`;

        const w = window.open('', '_blank', 'width=1000,height=1100');
        w.document.write(html); w.document.close();
        setTimeout(() => w.print(), 500); onClose();
    };

    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="c-slide-up bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t-2 sm:border-2 border-slate-900 shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Download className="w-4 h-4 text-white" /></div>
                        <div><h3 className="font-bold text-base">{fa ? 'خروجی PDF' : 'Export PDF'}</h3><p className="text-xs text-slate-400">{fa ? 'بخش‌ها را انتخاب کنید' : 'Choose sections'}</p></div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-1">
                    {secs.map(s => (
                        <button key={s.id} onClick={() => tog(s.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${s.on ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}>
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${s.on ? 'bg-slate-900' : 'bg-slate-200'}`}>
                                {s.on ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                            </div>
                            <span className={`text-sm font-medium ${s.on ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <button onClick={gen} className="group relative w-full cursor-pointer active:scale-[.97] transition-transform">
                        <div className="absolute inset-0 bg-slate-700 rounded-xl translate-y-1" />
                        <div className="relative bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:translate-y-0.5 transition-transform">
                            <FileText className="w-4 h-4" />{fa ? 'تولید و چاپ' : 'Generate & Print'}
                        </div>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const ADMIN_KEY = 'cambra_admin_2026';

export default function CambraApp() {
    const [lang, setLang] = useState('fa');
    const [tab, setTab] = useState('welcome');
    const [busy, setBusy] = useState(false);
    const [config, setConfig] = useState(null);
    const [showPdf, setShowPdf] = useState(false);

    const isAdmin = useMemo(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === ADMIN_KEY, []);

    const initDate = l => { const d = new Date(); if (l === 'fa') { const j = g2j(d.getFullYear(), d.getMonth() + 1, d.getDate()); return ds(j.jy, j.jm, j.jd) } return ds(d.getFullYear(), d.getMonth() + 1, d.getDate()) };

    const [patient, setPatient] = useState({ name: '', chartNo: '', date: initDate('fa'), assessmentType: 'baseline' });
    const [dInd, setDInd] = useState([]);
    const [rFact, setRFact] = useState([]);
    const [pFact, setPFact] = useState([]);
    const [alert, setAlert] = useState({ show: false, msg: '', type: 'info', cb: null });

    const [openDI, setOpenDI] = useState(null);
    const [openRF, setOpenRF] = useState(null);
    const [openPF, setOpenPF] = useState(null);


    useEffect(() => {
        setPatient(prev => {
            if (!prev.date) return prev;
            const [y, m, d] = prev.date.split('-').map(Number);
            if (lang === 'fa' && y > 1500) { const j = g2j(y, m, d); return { ...prev, date: ds(j.jy, j.jm, j.jd) } }
            if (lang === 'en' && y < 1500) { const g = j2g(y, m, d); return { ...prev, date: ds(g.gy, g.gm, g.gd) } }
            return prev;
        });
    }, [lang]);

    useEffect(() => {
        fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/config')
            .then(r => r.json()).then(data => {
                setConfig(data); const s = data.settings;
                setDInd(new Array(s.diseaseCount).fill(false));
                setRFact(new Array(s.riskCount).fill(false));
                setPFact(new Array(s.protectiveCount).fill(false));
            }).catch(console.error);
    }, []);

    // useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [tab]);
    useEffect(() => {
        // Delay scroll slightly to allow the DOM to mount the new tab's height
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
        return () => clearTimeout(timer);
    }, [tab]);

    const results = useMemo(() => {
        if (!config) return null; const s = config.settings;
        const dc = dInd.filter(Boolean).length, rc = rFact.filter(Boolean).length, pc = pFact.filter(Boolean).length;
        const dS = dc * s.diseaseWeight, rS = rc * s.riskWeight, pS = pc * s.protectiveWeight, sc = (dS + rS) - pS;
        let b = 'lowRisk'; if (sc >= s.extremeMin) b = 'extremeRisk'; else if (sc >= s.modMax + 1) b = 'highRisk'; else if (sc >= s.lowMax + 1) b = 'moderateRisk';
        let f = b, dO = false, eO = false, oO = false;
        if (rFact[7] && b === 'lowRisk') { f = 'moderateRisk'; oO = true }
        if (dc > 0 && (f === 'lowRisk' || f === 'moderateRisk')) { f = 'highRisk'; dO = true; oO = false }
        const hH = rFact[1] || rFact[4];
        if (f === 'highRisk' && hH) { f = 'extremeRisk'; eO = true; dO = false }
        return { dCount: dc, rCount: rc, pCount: pc, dScore: dS, rScore: rS, pScore: pS, score: sc, finalCat: f, dOverride: dO, eOverride: eO, orthoOverride: oO, hasHyposalivation: hH };
    }, [dInd, rFact, pFact, config]);

    const tabs = ['welcome', 'patient', 'disease', 'protective', 'results'];
    const valid = id => id === 'patient' ? patient.name.length > 0 && patient.chartNo.length > 0 : true;
    const tog = (setter, i) => setter(p => { const n = [...p]; n[i] = !n[i]; return n });
    const genChart = () => { const r = Math.floor(1000 + Math.random() * 9000); const d = new Date(); setPatient(p => ({ ...p, chartNo: `CMB-${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}-${r}` })) };

    const reset = () => {
        setPatient({ name: '', chartNo: '', date: initDate(lang), assessmentType: 'baseline' });
        if (config) { const s = config.settings; setDInd(new Array(s.diseaseCount).fill(false)); setRFact(new Array(s.riskCount).fill(false)); setPFact(new Array(s.protectiveCount).fill(false)) }
        setTab('welcome');
    };

    const submit = async () => {
        setBusy(true);
        try {
            const cd = config.dict[lang]; const gl = (arr, pfx) => arr.map((v, i) => v ? cd[`${pfx}_${i + 1}`] : null).filter(Boolean);
            let sd = patient.date; if (lang === 'fa' && patient.date) { const [y, m, d] = patient.date.split('-').map(Number); if (y < 1500) { const g = j2g(y, m, d); sd = ds(g.gy, g.gm, g.gd) } }
            const payload = { patient_name: patient.name, chart_no: patient.chartNo, assessment_type: patient.assessmentType, disease_ind: JSON.stringify(gl(dInd, 'di')), risk_fact: JSON.stringify(gl(rFact, 'rf')), prot_fact: JSON.stringify(gl(pFact, 'pf')), severe_hypo: (results.hasHyposalivation || false).toString(), net_score: results.score, final_category: results.finalCat, raw_data: JSON.stringify({ patient: { ...patient, date: sd }, dInd, rFact, pFact }) };
            const res = await fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) setAlert({ show: true, msg: lang === 'fa' ? 'ثبت شد!' : 'Submitted!', type: 'ok', cb: reset });
            else setAlert({ show: true, msg: lang === 'fa' ? 'خطا' : 'Error', type: 'err' });
        } catch { setAlert({ show: true, msg: lang === 'fa' ? 'اتصال اینترنت را بررسی کنید' : 'Check connection', type: 'err' }) }
        setBusy(false);
    };


    if (!config) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
            <CImg name="ui_loading_single_18" alt="Loading" className="w-20 h-20 sm:w-24 sm:h-24 opacity-80 c-drift" />
            <div className="w-10 h-10 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
    );

    const t = config.dict[lang]; const fa = lang === 'fa'; const st = config.settings; const isW = tab === 'welcome';

    const catBg = { extremeRisk: 'bg-red-950', highRisk: 'bg-red-800', moderateRisk: 'bg-amber-500', lowRisk: 'bg-emerald-600' };
    const catText = { extremeRisk: 'text-red-100', highRisk: 'text-white', moderateRisk: 'text-amber-950', lowRisk: 'text-white' };
    const RecMap = { lowRisk: { d: 'rec_low_diag', i: 'rec_low_int' }, moderateRisk: { d: 'rec_mod_diag', i: 'rec_mod_int' }, highRisk: { d: 'rec_high_diag', i: 'rec_high_int' }, extremeRisk: { d: 'rec_ext_diag', i: 'rec_ext_int' } };

    // ICDAS data
    const icdasData = fa ? [
        ['۰', 'سطح دندان سالم', 'بدون پوسیدگی'],
        ['۱', 'اولین تغییر قابل مشاهده در مینا (فقط بعد از خشک کردن)', 'دمینرالیزاسیون اولیه'],
        ['۲', 'ضایعه سفید یا قهوه‌ای واضح، بدون نیاز به خشک کردن', 'پوسیدگی اولیه مینا'],
        ['۳', 'شکستگی موضعی مینا (Microcavity)، عاج هنوز دیده نمی‌شود', 'هنوز عمدتاً محدود به مینا'],
        ['۴', 'سایه تیره از عاج زیر مینا دیده می‌شود', 'احتمال درگیری عاج'],
        ['۵', 'حفره واضح همراه با نمایان شدن عاج', 'پوسیدگی واضح'],
        ['۶', 'حفره وسیع با تخریب گسترده عاج', 'پوسیدگی شدید'],
    ] : [
        ['0', 'Sound tooth surface', 'No caries'],
        ['1', 'First visible enamel change (only after drying)', 'Initial demineralisation'],
        ['2', 'Distinct white/brown lesion, visible without drying', 'Early enamel caries'],
        ['3', 'Localised enamel breakdown (microcavity), no visible dentin', 'Mostly enamel-limited'],
        ['4', 'Dark shadow from underlying dentin visible', 'Probable dentin involvement'],
        ['5', 'Distinct cavity with exposed dentin', 'Obvious caries'],
        ['6', 'Extensive cavity with widespread dentin destruction', 'Severe caries'],
    ];

    const proxData = fa ? [
        ['C1', 'نیمه خارجی مینا'], ['C2', 'نیمه داخلی مینا'],
        ['C3', 'یک‌سوم خارجی عاج'], ['C4', 'یک‌سوم میانی یا داخلی عاج'],
    ] : [
        ['C1', 'Outer half of enamel'], ['C2', 'Inner half of enamel'],
        ['C3', 'Outer third of dentin'], ['C4', 'Middle or inner third of dentin'],
    ];

    // const hTabs=[
    //     {id:'patient',icon:User,label:t.tabPatient},
    //     {id:'disease',icon:AlertCircle,label:t.tabDisease},
    //     {id:'protective',icon:Shield,label:t.tabProtective},
    //     {id:'results',icon:PieChart,label:t.tabResults},
    // ];

    const hTabs = [
        { id: 'patient', icon: User, img: 'ui_tab_patient_single_13', label: t.tabPatient },
        { id: 'disease', icon: AlertCircle, img: 'ui_tab_disease_single_14', label: t.tabDisease },
        { id: 'protective', icon: Shield, img: 'ui_tab_protective_single_12', label: t.tabProtective },
        { id: 'results', icon: PieChart, img: 'ui_tab_results_single_11', label: t.tabResults },
    ];


    return (
        <div dir={fa ? 'rtl' : 'ltr'} className="h-[100dvh] w-full flex flex-col bg-white text-slate-900 overflow-hidden" style={{ fontFamily: "'Vazirmatn',system-ui,sans-serif" }}>

            {/* HEADER - Locked */}
            <header className="bg-white border-b border-slate-100 px-4 py-2 flex-shrink-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-2 lhsmall">
                    <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs" style={{ fontFamily: 'Georgia,serif' }}>C</span>
                    </div>
                    <div><h1 className="font-bold text-sm text-slate-900 leading-tight">{t.title}</h1><span className="text-[8px] font-medium text-slate-400 tracking-wider uppercase">{t.subtitle}</span></div>
                </div>
                <div className="flex items-center gap-1.5">
                    {isAdmin && <a href="/appliance_survey/admin-cambra-789" target="_blank" className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer"><Settings className="w-3 h-3 text-slate-500" /></a>}
                    <button onClick={() => setLang(lang === 'en' ? 'fa' : 'en')} className="h-7 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 cursor-pointer active:scale-95 transition-all">{t.language}</button>
                </div>
            </header>

            {/* TABS */}
            {!isW && (
                <div className="bg-white border-b border-slate-100 sticky top-[40px] z-20 overflow-x-auto hide-scroll">
                    <div className="flex w-full max-w-2xl mx-auto min-w-max px-2 sm:px-0">
                        {hTabs.map(tb => (
                            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex-1 min-w-[85px] flex flex-col items-center gap-1 py-2 text-[10px] sm:text-[11px] font-semibold border-b-2 transition-all cursor-pointer ${tab === tb.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                {/* ... image and text ... */}
                                {/* <tb.icon className={`w-3 h-3 ${tab===tb.id?'text-slate-900':'text-slate-300'}`}/> */}

                                <CImg
                                    name={tb.img}
                                    alt={tb.label}
                                    className={`w-12 h-12 sm:w-12 sm:h-12 ${tab === tb.id ? 'opacity-100' : 'opacity-30'}`}
                                />{tb.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN - Scrollable Content Area Only */}
            <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-28">
                <div className="max-w-2xl mx-auto">
                    {isW && <Welcome lang={lang} onStart={() => setTab('patient')} />}

                    <div className={isW ? 'hidden' : 'space-y-5'}>
                        {/* PATIENT */}
                        <div className={tab !== 'patient' ? 'hidden' : ''}>
                            <div className="c-fade-up bg-white rounded-2xl border border-slate-200 overflow-visible">
                                <div className="px-4 py-2.5 border-b border-slate-100"><h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.patientInfo}</h2></div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.patientName}</label>
                                        <input type="text" value={patient.name} onChange={e => setPatient(p => ({ ...p, name: e.target.value }))}
                                            className="w-full text-sm font-medium px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 transition-all bg-white"
                                            placeholder={fa ? 'نام بیمار' : 'Patient name'} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.chartNo}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={displayDigits(patient.chartNo, lang)}
                                                onChange={e => {
                                                    // const raw = normalizeDigits(e.target.value);
                                                    const raw = e.target.value;
                                                    setPatient(p => ({ ...p, chartNo: raw }));
                                                }}
                                                className="w-full text-sm font-medium font-mono px-3 pe-10 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 transition-all bg-white"
                                                placeholder={fa ? 'شماره پرونده' : 'Chart #'} />
                                            <button onClick={genChart} type="button" className="absolute top-1/2 -translate-y-1/2 end-1.5 w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center cursor-pointer active:scale-90 transition-all"><Shuffle className="w-3 h-3 text-white" /></button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.date}</label>
                                        <CalPicker value={patient.date} onChange={v => setPatient(p => ({ ...p, date: v }))} lang={lang} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.assessmentType}</label>
                                        <Sel value={patient.assessmentType} onChange={v => setPatient(p => ({ ...p, assessmentType: v }))} options={[{ value: 'baseline', label: t.baseline, desc: fa ? 'اولین ارزیابی' : 'First assessment' }, { value: 'recall', label: t.recall, desc: fa ? 'دوره‌ای' : 'Follow-up' }]} placeholder={fa ? 'انتخاب' : 'Select'} icon={ClipboardCheck} />
                                    </div>
                                </div>
                            </div>

                            <div className="c-fade-up c-d1 flex justify-center mb-2">
                                <CImg name="ui_empty_single_24" alt="" className="w-50 h-50 active:scale-120 transition-all active:opacity-100 opacity-80" />
                            </div>
                        </div>

                        {/* DISEASE + RISK */}
                        <div className={`${tab !== 'disease' ? 'hidden' : ''} space-y-5`}>
                            <div className="c-fade-up rounded-2xl border border-slate-200 overflow-visible bg-white">
                                <div className="px-4 py-3 border-b border-red-100 bg-red-50/50 flex items-center gap-4 rounded-t-2xl relative">
                                    <CImg name="ui_header_disease_single_23" alt="" className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0" />
                                    <div>
                                        <h2 className="text-[14px] font-bold text-red-700 uppercase tracking-wider">{t.diseaseIndicators}</h2>
                                        <p className="text-[12px] text-red-400 mt-0.5">{t.diseaseIndSubtitle}</p>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-50">
                                    {Array.from({ length: st.diseaseCount }).map((_, i) => (
                                        <FactorRow key={`d${i}`} label={t[`di_${i + 1}`]} hint={t[`di_${i + 1}_hint`]} desc={t[`di_${i + 1}_desc`]}
                                            checked={dInd[i]} onToggle={() => tog(setDInd, i)} color="red" weight={st.diseaseWeight} lang={lang}
                                            descOpen={openDI === i} onDescToggle={() => setOpenDI(v => v === i ? null : i)} />
                                    ))}
                                </div>
                            </div>
                            <div className="c-fade-up c-d2 rounded-2xl border border-slate-200 overflow-visible bg-white">
                                <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center gap-4 rounded-t-2xl relative">
                                    <CImg name="ui_header_risk_single_21" alt="" className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0" />
                                    <div>
                                        <h2 className="text-[14px] font-bold text-amber-700 uppercase tracking-wider">{t.riskFactors}</h2>
                                        <p className="text-[12px] text-amber-400 mt-0.5">{t.riskFactSubtitle}</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {Array.from({ length: st.riskCount }).map((_, i) => (
                                        <FactorRow key={`r${i}`} label={t[`rf_${i + 1}`]} hint={t[`rf_${i + 1}_hint`]} desc={t[`rf_${i + 1}_desc`]}
                                            checked={rFact[i]} onToggle={() => tog(setRFact, i)} color="amber" weight={st.riskWeight} lang={lang} descOpen={openRF === i} onDescToggle={() => setOpenRF(v => v === i ? null : i)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* PROTECTIVE */}
                        <div className={tab !== 'protective' ? 'hidden' : ''}>
                            <div className="c-fade-up rounded-2xl border border-slate-200 overflow-visible bg-white">
                                <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/50 flex items-center gap-4 rounded-t-2xl relative">
                                    <CImg name="ui_header_protective_single_22" alt="" className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0" />
                                    <div>
                                        <h2 className="text-[14px] font-bold text-emerald-700 uppercase tracking-wider">{t.protectiveFactors}</h2>
                                        <p className="text-[12px] text-emerald-400 mt-0.5">{t.protFactSubtitle}</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {Array.from({ length: st.protectiveCount }).map((_, i) => (
                                        <FactorRow key={`p${i}`} label={t[`pf_${i + 1}`]} hint={t[`pf_${i + 1}_hint`]} desc={t[`pf_${i + 1}_desc`]}
                                            checked={pFact[i]} onToggle={() => tog(setPFact, i)} color="emerald" weight={st.protectiveWeight} lang={lang} descOpen={openPF === i} onDescToggle={() => setOpenPF(v => v === i ? null : i)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RESULTS */}
                        <div className={`${tab !== 'results' ? 'hidden' : ''} space-y-5 pb-12`}>
                            {/* ── Verdict banner ── */}
                            <div className="c-fade-up">
                                <div className={`flex flex-col sm:flex-row items-center sm:items-stretch border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0_#0f172a] ${catBg[results.finalCat]}`}>

                                    {/* Mascot Image */}
                                    <div className="w-full sm:w-1/3 p-6 flex items-center justify-center bg-black/10">
                                        <CImg name={OUTCOME_IMAGES[results.finalCat]} alt="" className="w-40 sm:w-full max-w-[180px] drop-shadow-md c-pop" />
                                    </div>

                                    {/* Content Side */}
                                    <div className="w-full sm:w-2/3 p-5 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1 block">
                                                    {fa ? 'نتیجه ارزیابی ریسک' : 'Risk Assessment Result'}
                                                </span>
                                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                                                    {t[results.finalCat]}
                                                </h2>

                                                {/* Overrides */}
                                                {(results.dOverride || results.eOverride || results.orthoOverride) && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {results.dOverride && <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t.diseaseOverride}</span>}
                                                        {results.eOverride && <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Droplets className="w-3 h-3" /> {t.extremeOverride}</span>}
                                                        {results.orthoOverride && <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t.orthoOverride}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Total Score Chip */}
                                            <div className="flex-shrink-0 text-center bg-white rounded-xl p-3 border-2 border-slate-900 shadow-[2px_2px_0_#0f172a] min-w-[70px]">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">{t.totalScore}</span>
                                                <div className="text-2xl font-black font-mono text-slate-900" dir="ltr">
                                                    {results.score > 0 ? '+' : ''}{toFa(results.score, lang)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Breakdown Bar */}
                                        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/20" dir="ltr">
                                            <span className="flex items-center justify-center px-2 py-1 rounded bg-red-500 text-white text-[11px] font-bold font-mono border border-slate-900">+{toFa(results.dScore, lang)}</span>
                                            <span className="flex items-center justify-center px-2 py-1 rounded bg-amber-400 text-slate-900 text-[11px] font-bold font-mono border border-slate-900">+{toFa(results.rScore, lang)}</span>
                                            <span className="flex items-center justify-center px-2 py-1 rounded bg-emerald-500 text-white text-[11px] font-bold font-mono border border-slate-900">−{toFa(results.pScore, lang)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Salivation Status */}
                                {results.hasHyposalivation && (
                                    <div className="mt-4 bg-slate-900 text-white border-2 border-slate-900 rounded-xl px-5 py-3 flex items-center gap-3 shadow-[4px_4px_0_#cbd5e1]">
                                        <Droplets className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        <span className="text-sm font-semibold">{fa ? 'هیپوسالیواسیون — جریان بزاق کاهش‌یافته' : 'Hyposalivation — reduced salivary flow'}</span>
                                    </div>
                                )}
                            </div>


                            {/* ── Score breakdown bars ── */}
                            <div className="c-fade-up c-d1 flex justify-center mb-2">
                                <CImg name="ui_balance_single_25" alt="" className="w-50 h-50 -my-8 opacity-60" />
                            </div>
                            <div className="c-fade-up c-d1 grid grid-cols-3 gap-2">
                                {[
                                    { label: fa ? 'بیماری' : 'Disease', val: results.dScore, max: st.diseaseCount * st.diseaseWeight, bar: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', ic: Stethoscope, items: dInd.map((c, i) => c ? t[`di_${i + 1}`] : null).filter(Boolean) },
                                    { label: fa ? 'خطر' : 'Risk', val: results.rScore, max: st.riskCount * st.riskWeight, bar: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', ic: Zap, items: rFact.map((c, i) => c ? t[`rf_${i + 1}`] : null).filter(Boolean) },
                                    { label: fa ? 'محافظت' : 'Protect', val: results.pScore, max: st.protectiveCount * st.protectiveWeight, bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', ic: ShieldCheck, items: pFact.map((c, i) => c ? t[`pf_${i + 1}`] : null).filter(Boolean) },
                                ].map(s => (
                                    <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-3`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <s.ic className={`w-3.5 h-3.5 ${s.text}`} />
                                            <span className={`font-mono font-bold text-sm ${s.text}`} dir="ltr">{s.val > 0 ? '+' : ''}{toFa(s.val, lang)}</span>
                                        </div>
                                        <div className="h-1 bg-white rounded-full overflow-hidden mb-2">
                                            <div className={`h-full rounded-full transition-all duration-700 ${s.bar}`} style={{ width: `${Math.min(100, s.val / (s.max || 1) * 100)}%` }} />
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase tracking-wider ${s.text} opacity-70`}>{s.label}</div>
                                        {s.items.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {s.items.map((it, i) => (
                                                    <div key={i} className={`text-[10px] font-medium ${s.text} opacity-80 flex items-start gap-1`}>
                                                        <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${s.bar}`} />{it}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* ── Reference tables ── */}
                            <div className="c-fade-up c-d2 space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{fa ? 'جداول مرجع بالینی' : 'Clinical Reference'}</h3>
                                    <div className="flex-1 h-px bg-slate-100" />
                                </div>

                                {/* ICDAS */}
                                {/* ICDAS and Pinch Zoom Image Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Table Card */}
                                    <div className="rounded-2xl border border-slate-200 overflow-hidden h-fit">
                                        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                                            <span className="text-white text-xs font-bold tracking-wider">ICDAS</span>
                                            <span className="text-slate-500 text-[8px] font-medium tracking-wider uppercase">{fa ? 'طبقه‌بندی ضایعات اکلوزال' : 'Occlusal Lesion Classification'}</span>
                                        </div>
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 w-12">{fa ? 'کد' : 'Code'}</th>
                                                    <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{fa ? 'معنی' : 'Meaning'}</th>
                                                    <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{fa ? 'وضعیت' : 'Status'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {icdasData.map(([code, meaning, status], i) => (
                                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-1.5 px-3 font-mono font-bold text-center text-slate-900">{code}</td>
                                                        <td className="py-1.5 px-3 text-slate-700 font-medium text-[11px]">{meaning}</td>
                                                        <td className="py-1.5 px-3 text-slate-500 text-[10px]">{status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Bouncy Pinch Zoom Area */}
                                    <BouncyPinchZoom src="/images/icdas.png" alt="ICDAS Reference" />
                                </div>
                                {/* Proximal */}
                                <div className="rounded-2xl border border-slate-200 overflow-hidden">                                <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
                                    <span className="text-white text-xs font-bold tracking-wider">{fa ? 'پروگزیمال' : 'Proximal C'}</span>
                                    <span className="text-indigo-200 text-[8px] font-medium tracking-wider uppercase">{fa ? 'درجه‌بندی پوسیدگی پروگزیمال' : 'Proximal Caries Classification'}</span>
                                </div>
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 w-16">{fa ? 'کد' : 'Code'}</th>
                                                <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{fa ? 'محل ضایعه' : 'Lesion Location'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {proxData.map(([code, loc], i) => (
                                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-2 px-3"><span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">{code}</span></td>
                                                    <td className="py-2 px-3 text-slate-700 font-medium text-[11px]">{loc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── Action plan ── */}
                            <div className="c-fade-up c-d3 space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{fa ? 'برنامه درمانی' : 'Action Plan'}</h3>
                                    <div className="flex-1 h-px bg-slate-100" />
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${results.finalCat === 'lowRisk' ? 'bg-emerald-50 text-emerald-600' : results.finalCat === 'moderateRisk' ? 'bg-amber-50 text-amber-600' : results.finalCat === 'highRisk' ? 'bg-red-50 text-red-600' : 'bg-slate-900 text-white'}`}>{t[results.finalCat]}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-50 border-b border-slate-100 px-3 py-2">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3 h-3" />{t.recDiagnostics}</span>
                                        </div>
                                        <div className="p-3"><div dangerouslySetInnerHTML={{ __html: t[RecMap[results.finalCat].d] }} className="text-[12px] text-slate-700 leading-relaxed [&_ul]:space-y-2 [&_li]:text-[12px]" /></div>
                                    </div>
                                    <div className="rounded-2xl border-2 border-slate-900 overflow-hidden">
                                        <div className="bg-slate-900 px-3 py-2">
                                            <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5"><Zap className="w-3 h-3" />{t.recInterventions}</span>
                                        </div>
                                        <div className="p-3"><div dangerouslySetInnerHTML={{ __html: t[RecMap[results.finalCat].i] }} className="text-[12px] text-slate-700 leading-relaxed [&_ul]:space-y-2 [&_li]:text-[12px]" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Buttons ── */}
                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                                <button onClick={() => setShowPdf(true)} className="group relative cursor-pointer active:scale-[.97] transition-transform w-full sm:w-auto">
                                    <div className="absolute inset-0 bg-slate-600 rounded-xl translate-y-1" />
                                    <div className="relative bg-slate-700 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:translate-y-0.5 transition-transform"><Download className="w-4 h-4" />{fa ? 'خروجی PDF' : 'Export PDF'}</div>
                                </button>
                                <button onClick={submit} disabled={busy} className="group relative cursor-pointer active:scale-[.97] transition-transform disabled:opacity-50 w-full sm:w-auto">
                                    <div className="absolute inset-0 bg-slate-800 rounded-xl translate-y-1" />
                                    <div className="relative bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:translate-y-0.5 transition-transform">
                                        {busy ? <Activity className="animate-spin w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                                        {busy ? (fa ? 'ثبت...' : 'Saving...') : (fa ? 'ثبت و پایان' : 'Submit')}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* NAV */}
            {!isW && (
                <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-lg z-40 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-900 rounded-xl px-1 py-0.5 flex items-center justify-between gap-1 pointer-events-auto shadow-[3px_3px_0_#0f172a]">
                        <button disabled={tabs.indexOf(tab) <= 1} onClick={() => setTab(tabs[tabs.indexOf(tab) - 1])} className={`flex-shrink-0 w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center disabled:opacity-20 cursor-pointer active:scale-90 transition-all ${tabs.indexOf(tab) <= 1 ? 'invisible' : ''}`}>
                            <ChevronLeft className={`w-3.5 h-3.5 text-slate-800 ${fa ? 'scale-x-[-1]' : ''}`} strokeWidth={3} />
                        </button>
                        <div className="flex flex-1 justify-center gap-1">
                            {tabs.filter(t => t !== 'welcome').map((tb, idx) => {
                                const ci = tabs.indexOf(tab) - 1; return (
                                    <div key={tb} className={`rounded-full border-2 border-slate-900 transition-all duration-300 ${idx === ci ? 'w-4 h-1.5 bg-slate-900' : idx < ci ? 'w-1.5 h-1.5 bg-slate-600' : 'w-1.5 h-1.5 bg-slate-200'}`} />
                                )
                            })}
                        </div>
                        <button disabled={tabs.indexOf(tab) === tabs.length - 1 || !valid(tab)} onClick={() => setTab(tabs[tabs.indexOf(tab) + 1])} className={`flex-shrink-0 w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center disabled:opacity-20 cursor-pointer active:scale-90 transition-all ${tabs.indexOf(tab) === tabs.length - 1 ? 'invisible' : ''}`}>
                            <ChevronRight className={`w-3.5 h-3.5 text-slate-800 ${fa ? 'scale-x-[-1]' : ''}`} strokeWidth={3} />
                        </button>
                    </div>
                </nav>
            )}

            <PdfModal open={showPdf} onClose={() => setShowPdf(false)} lang={lang} patient={patient} results={results} config={config} diseaseInd={dInd} riskFact={rFact} protFact={pFact} />

            {alert.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="c-scale-in bg-white border-2 border-slate-900 shadow-[6px_6px_0_#0f172a] w-full max-w-xs p-5 text-center rounded-2xl">
                        <div className="mb-3">
                            {alert.type === 'ok'
                                ? <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500"><Check className="w-6 h-6" strokeWidth={3} /></div>
                                : <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-500"><AlertCircle className="w-6 h-6" strokeWidth={3} /></div>}
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-4">{alert.msg}</p>
                        <button onClick={() => { if (alert.cb) alert.cb(); setAlert(a => ({ ...a, show: false, cb: null })) }} className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl cursor-pointer active:scale-95 transition-all text-sm">{fa ? 'باشه' : 'OK'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}
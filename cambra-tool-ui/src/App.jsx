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
    overflow: hidden;
    background-color: #ffffff;
}
* {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
}
::-webkit-scrollbar { width: 0; height: 0; }

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
    const fa = lang === 'fa';
    const t = config?.dict?.[lang];

    const SECS = [
        { id: 'patient', label: fa ? 'اطلاعات بیمار' : 'Patient Info', on: true },
        { id: 'disease', label: fa ? 'شاخص‌های بیماری' : 'Disease Indicators', on: true },
        { id: 'risk', label: fa ? 'عوامل خطر' : 'Risk Factors', on: true },
        { id: 'protect', label: fa ? 'عوامل محافظتی' : 'Protective Factors', on: true },
        { id: 'result', label: fa ? 'نتیجه' : 'Result', on: true },
        {
            id: 'tables',
            label: fa ? 'جداول مرجع' : 'Reference Tables',
            on: true,
            children: [
                { id: 'icdasImg', label: fa ? 'تصویر راهنمای ICDAS' : 'ICDAS Reference Image', on: true }
            ]
        },
        { id: 'plan', label: fa ? 'برنامه درمانی' : 'Action Plan', on: true },
    ];

    const [secs, setSecs] = useState(SECS);
    useEffect(() => { if (open) setSecs(SECS) }, [open, lang]);

    const toggleTree = (items, id) =>
        items.map(item => {
            if (item.id === id) return { ...item, on: !item.on };
            if (item.children) return { ...item, children: toggleTree(item.children, id) };
            return item;
        });

    const tog = id => setSecs(prev => toggleTree(prev, id));

    const findIsOn = (items, id, parentOn = true) => {
        for (const item of items) {
            const effectiveOn = parentOn && item.on;
            if (item.id === id) return effectiveOn;
            if (item.children) {
                const found = findIsOn(item.children, id, effectiveOn);
                if (found !== undefined) return found;
            }
        }
        return undefined;
    };

    const isOn = id => findIsOn(secs, id);

    // ── renderSecs defined here, BEFORE return ──
    const renderSecs = (items, level = 0, parentOn = true) => (
        <div className="space-y-1">
            {items.map(s => {
                const effectiveOn = parentOn && s.on;
                return (
                    <div key={s.id}>
                        <button
                            onClick={() => tog(s.id)}
                            disabled={!parentOn}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-start
                                ${effectiveOn ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}
                                ${!parentOn ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${effectiveOn ? 'bg-slate-900' : 'bg-slate-200'}`}>
                                {effectiveOn
                                    ? <Eye className="w-3 h-3 text-white" />
                                    : <EyeOff className="w-3 h-3 text-slate-400" />}
                            </div>
                            <span className={`${level > 0 ? 'text-xs' : 'text-sm'} font-medium ${effectiveOn ? 'text-slate-900' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </button>

                        {s.children && (
                            <div
                                style={{
                                    marginInlineStart: 18,
                                    paddingInlineStart: 10,
                                    borderInlineStart: '2px solid #e2e8f0'
                                }}
                                className="mt-1"
                            >
                                {renderSecs(s.children, level + 1, effectiveOn)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const gen = () => {
        const rc = { lowRisk: '#059669', moderateRisk: '#d97706', highRisk: '#dc2626', extremeRisk: '#991b1b' };
        const rb = { lowRisk: '#f0fdf4', moderateRisk: '#fffbeb', highRisk: '#fef2f2', extremeRisk: '#fef2f2' };
        const rg = { lowRisk: 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)', moderateRisk: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)', highRisk: 'linear-gradient(135deg,#fef2f2 0%,#fecaca 100%)', extremeRisk: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)' };
        const isExtreme = results?.finalCat === 'extremeRisk';
        const catL = t?.[results?.finalCat] || '';
        const dateD = (() => { if (!patient.date) return ''; const [y, m, d] = patient.date.split('-').map(Number); return fa ? `${toFa(d, 'fa')} ${JM[m - 1]} ${toFa(y, 'fa')}` : `${GM[m - 1]} ${d}, ${y}`; })();
        const rl = (arr, pfx) => arr.map((v, i) => v ? t?.[`${pfx}_${i + 1}`] : null).filter(Boolean);
        const RM = { lowRisk: { d: 'rec_low_diag', i: 'rec_low_int' }, moderateRisk: { d: 'rec_mod_diag', i: 'rec_mod_int' }, highRisk: { d: 'rec_high_diag', i: 'rec_high_int' }, extremeRisk: { d: 'rec_ext_diag', i: 'rec_ext_int' } };
        const icdasImgSrc = `${window.location.origin}/images/icdas.png`;

        let body = '';

        if (isOn('patient')) body += `
        <section>
            <div class="sec-head">
                <div class="sec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <h2>${fa ? 'اطلاعات بیمار' : 'Patient Information'}</h2>
            </div>
            <div class="info-grid">
                <div class="info-card"><div class="info-label">${t?.patientName}</div><div class="info-value">${patient.name || '—'}</div></div>
                <div class="info-card"><div class="info-label">${t?.chartNo}</div><div class="info-value mono">${patient.chartNo || '—'}</div></div>
                <div class="info-card"><div class="info-label">${t?.date}</div><div class="info-value">${dateD}</div></div>
                <div class="info-card"><div class="info-label">${t?.assessmentType}</div><div class="info-value">${patient.assessmentType === 'baseline' ? t?.baseline : t?.recall}</div></div>
            </div>
        </section>`;

        const makeFactorSection = (arr, pfx, title, dotColor, bgColor, borderColor, textColor, iconSvg) => {
            const items = rl(arr, pfx);
            body += `<section><div class="sec-head"><div class="sec-icon" style="color:${textColor}">${iconSvg}</div><h2>${title}</h2><div class="sec-count" style="background:${bgColor};color:${textColor};border-color:${borderColor}">${items.length}</div></div>`;
            if (items.length) {
                body += `<div class="factor-list">`;
                items.forEach(item => { body += `<div class="factor-item" style="border-color:${borderColor}"><div class="factor-dot" style="background:${dotColor}"></div><span>${item}</span></div>`; });
                body += `</div>`;
            } else {
                body += `<div class="empty-state"><span>${fa ? 'موردی انتخاب نشده' : 'None selected'}</span></div>`;
            }
            body += `</section>`;
        };

        const svgDisease = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87L13.637 3.59a1.914 1.914 0 0 0-3.274 0z"/><path d="M12 17h.01"/></svg>`;
        const svgRisk = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
        const svgProtect = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`;

        if (isOn('disease')) makeFactorSection(diseaseInd, 'di', fa ? 'شاخص‌های بیماری' : 'Disease Indicators', '#ef4444', '#fef2f2', '#fecaca', '#dc2626', svgDisease);
        if (isOn('risk')) makeFactorSection(riskFact, 'rf', fa ? 'عوامل خطر' : 'Risk Factors', '#f59e0b', '#fffbeb', '#fde68a', '#d97706', svgRisk);
        if (isOn('protect')) makeFactorSection(protFact, 'pf', fa ? 'عوامل محافظتی' : 'Protective Factors', '#22c55e', '#f0fdf4', '#bbf7d0', '#059669', svgProtect);

        if (isOn('result')) body += `
        <section class="verdict-section">
            <div class="verdict-card" style="background:${rg[results?.finalCat]};border-color:${isExtreme ? '#334155' : rc[results?.finalCat]}">
                <div class="verdict-main">
                    <div class="verdict-left">
                        <div class="verdict-eyebrow" style="color:${isExtreme ? '#94a3b8' : rc[results?.finalCat]}">${fa ? 'نتیجه ارزیابی ریسک' : 'RISK ASSESSMENT RESULT'}</div>
                        <div class="verdict-title" style="color:${isExtreme ? '#ffffff' : rc[results?.finalCat]}">${catL}</div>
                        ${results?.dOverride ? `<div class="verdict-override" style="background:${isExtreme ? 'rgba(255,255,255,0.08)' : 'rgba(220,38,38,0.08)'};color:${isExtreme ? '#fca5a5' : '#dc2626'}">⚠ ${t?.diseaseOverride || (fa ? 'ارتقا با شاخص بیماری' : 'Disease indicator override')}</div>` : ''}
                        ${results?.eOverride ? `<div class="verdict-override" style="background:${isExtreme ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.08)'};color:${isExtreme ? '#fcd34d' : '#d97706'}">⚠ ${t?.extremeOverride || (fa ? 'ارتقا با هیپوسالیواسیون' : 'Hyposalivation override')}</div>` : ''}
                        ${results?.orthoOverride ? `<div class="verdict-override" style="background:${isExtreme ? 'rgba(255,255,255,0.08)' : 'rgba(100,116,139,0.08)'};color:${isExtreme ? '#cbd5e1' : '#475569'}">⚠ ${t?.orthoOverride || (fa ? 'ارتقا ارتودنسی' : 'Orthodontic override')}</div>` : ''}
                    </div>
                    <div class="verdict-score-box" style="border-color:${isExtreme ? '#475569' : rc[results?.finalCat]}">
                        <div class="verdict-score-num" style="color:${isExtreme ? '#f1f5f9' : rc[results?.finalCat]}">${results?.score > 0 ? '+' : ''}${results?.score}</div>
                        <div class="verdict-score-label" style="color:${isExtreme ? '#64748b' : '#94a3b8'}">${fa ? 'نمره خالص' : 'NET SCORE'}</div>
                        <div class="verdict-chips">
                            <span class="vchip vchip-r">+${results?.dScore}</span>
                            <span class="vchip vchip-a">+${results?.rScore}</span>
                            <span class="vchip vchip-g">−${results?.pScore}</span>
                        </div>
                    </div>
                </div>
                ${results?.hasHyposalivation ? `<div class="hypo-bar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg><span>${fa ? 'هیپوسالیواسیون — جریان بزاق کاهش‌یافته' : 'Hyposalivation — Reduced salivary flow detected'}</span></div>` : ''}
            </div>
        </section>`;

        if (isOn('tables')) body += `
        <section>
            <div class="sec-head">
                <div class="sec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg></div>
                <h2>${fa ? 'جداول مرجع بالینی' : 'Clinical Reference Tables'}</h2>
            </div>
            <div class="tables-grid">
                <div class="ref-table">
                    <div class="ref-table-head dark"><span class="ref-table-title">ICDAS</span><span class="ref-table-sub">${fa ? 'طبقه‌بندی ضایعات اکلوزال' : 'Occlusal Lesion Classification'}</span></div>
                    <table><thead><tr><th class="w-code">${fa ? 'کد' : 'Code'}</th><th>${fa ? 'معنی' : 'Meaning'}</th><th>${fa ? 'وضعیت' : 'Status'}</th></tr></thead>
                    <tbody>
                        <tr><td class="tc">0</td><td>${fa ? 'سطح دندان سالم' : 'Sound tooth surface'}</td><td class="ts">${fa ? 'بدون پوسیدگی' : 'No caries'}</td></tr>
                        <tr><td class="tc">1</td><td>${fa ? 'اولین تغییر قابل مشاهده در مینا' : 'First visible enamel change (after drying)'}</td><td class="ts">${fa ? 'دمینرالیزاسیون اولیه' : 'Initial demineralisation'}</td></tr>
                        <tr><td class="tc">2</td><td>${fa ? 'ضایعه سفید یا قهوه‌ای واضح' : 'Distinct white/brown lesion without drying'}</td><td class="ts">${fa ? 'پوسیدگی اولیه مینا' : 'Early enamel caries'}</td></tr>
                        <tr><td class="tc">3</td><td>${fa ? 'شکستگی موضعی مینا' : 'Localised enamel breakdown, no visible dentin'}</td><td class="ts">${fa ? 'محدود به مینا' : 'Mostly enamel-limited'}</td></tr>
                        <tr><td class="tc">4</td><td>${fa ? 'سایه تیره از عاج زیر مینا' : 'Dark shadow from underlying dentin'}</td><td class="ts">${fa ? 'احتمال درگیری عاج' : 'Probable dentin involvement'}</td></tr>
                        <tr><td class="tc">5</td><td>${fa ? 'حفره واضح همراه با نمایان شدن عاج' : 'Distinct cavity with exposed dentin'}</td><td class="ts">${fa ? 'پوسیدگی واضح' : 'Obvious caries'}</td></tr>
                        <tr><td class="tc">6</td><td>${fa ? 'حفره وسیع با تخریب گسترده عاج' : 'Extensive cavity with wide dentin destruction'}</td><td class="ts">${fa ? 'پوسیدگی شدید' : 'Severe caries'}</td></tr>
                    </tbody></table>
                </div>
                <div class="ref-table">
                    <div class="ref-table-head indigo"><span class="ref-table-title">${fa ? 'پروگزیمال' : 'Proximal'}</span><span class="ref-table-sub">${fa ? 'درجه‌بندی پوسیدگی پروگزیمال' : 'Proximal Caries Classification'}</span></div>
                    <table><thead><tr><th class="w-code">${fa ? 'کد' : 'Code'}</th><th>${fa ? 'محل ضایعه' : 'Lesion Location'}</th></tr></thead>
                    <tbody>
                        <tr><td class="tc accent">C1</td><td>${fa ? 'نیمه خارجی مینا' : 'Outer half of enamel'}</td></tr>
                        <tr><td class="tc accent">C2</td><td>${fa ? 'نیمه داخلی مینا' : 'Inner half of enamel'}</td></tr>
                        <tr><td class="tc accent">C3</td><td>${fa ? 'یک‌سوم خارجی عاج' : 'Outer third of dentin'}</td></tr>
                        <tr><td class="tc accent">C4</td><td>${fa ? 'یک‌سوم میانی یا داخلی عاج' : 'Middle or inner third of dentin'}</td></tr>
                    </tbody></table>
                </div>
            </div>
            ${isOn('icdasImg') ? `
            <div class="icdas-image-card">
                <div class="icdas-image-title">${fa ? 'راهنمای تصویری ICDAS' : 'ICDAS Visual Reference'}</div>
                <div class="icdas-image-wrap"><img src="${icdasImgSrc}" alt="ICDAS Reference" /></div>
            </div>` : ''}
        </section>`;

        if (isOn('plan')) body += `
        <section>
            <div class="sec-head">
                <div class="sec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/><path d="m9 14 2 2 4-4"/></svg></div>
                <h2>${fa ? 'برنامه درمانی' : 'Action Plan'}</h2>
                <div class="plan-badge" style="background:${rb[results?.finalCat]};color:${rc[results?.finalCat]};border-color:${rc[results?.finalCat]}">${catL}</div>
            </div>
            <div class="plan-grid">
                <div class="plan-card">
                    <div class="plan-card-head light"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg><span>${t?.recDiagnostics}</span></div>
                    <div class="plan-card-body">${t?.[RM[results?.finalCat]?.d] || ''}</div>
                </div>
                <div class="plan-card dark">
                    <div class="plan-card-head dark"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg><span>${t?.recInterventions}</span></div>
                    <div class="plan-card-body">${t?.[RM[results?.finalCat]?.i] || ''}</div>
                </div>
            </div>
        </section>`;

        const html = `<!DOCTYPE html>
<html dir="${fa ? 'rtl' : 'ltr'}" lang="${lang}">
<head>
<meta charset="UTF-8">
<title>CAMBRA — ${patient.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Vazirmatn','Inter',system-ui,sans-serif;color:#1e293b;font-size:11px;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:12mm 14mm}
.page{max-width:182mm;margin:0 auto;padding:0}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;margin-bottom:24px;border-bottom:2.5px solid #0f172a}
.header-left{display:flex;align-items:center;gap:12px}
.logo-mark{width:40px;height:40px;background:#0f172a;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px;font-family:'Inter','Vazirmatn',sans-serif}
.header-left h1{font-size:24px;font-weight:900;letter-spacing:-1.5px;line-height:1;color:#0f172a;font-family:'Inter','Vazirmatn',sans-serif}
.header-left .protocol{font-size:7px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;margin-top:3px}
.header-right{text-align:${fa ? 'left' : 'right'}}
.header-right .date{font-size:9px;color:#94a3b8;font-weight:600}
.header-right .patient-name{font-size:10px;font-weight:700;color:#334155;margin-top:2px}
.risk-badge{display:inline-block;padding:4px 16px;border-radius:8px;color:#fff;font-weight:800;font-size:12px;margin-top:6px;letter-spacing:0.5px}
.sec-head{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1.5px solid #f1f5f9}
.sec-icon{width:22px;height:22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#64748b;flex-shrink:0}
.sec-head h2{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:#475569;flex:1}
.sec-count{font-size:9px;font-weight:800;padding:2px 8px;border-radius:6px;border:1px solid;font-family:'Inter',monospace}
section{margin-bottom:20px;break-inside:avoid;page-break-inside:avoid}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px}
.info-label{font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px}
.info-value{font-size:12px;font-weight:700;color:#0f172a;margin-top:2px}
.mono{font-family:'Inter',ui-monospace,monospace;letter-spacing:0.5px}
.factor-list{display:flex;flex-direction:column;gap:4px}
.factor-item{display:flex;align-items:flex-start;gap:8px;font-size:10.5px;font-weight:500;padding:6px 10px;border-radius:6px;border-${fa ? 'right' : 'left'}:3px solid;background:#fafafa;line-height:1.6}
.factor-dot{width:5px;height:5px;border-radius:50%;margin-top:5px;flex-shrink:0}
.empty-state{padding:12px;text-align:center;color:#cbd5e1;font-size:10px;font-style:italic;background:#fafafa;border-radius:8px;border:1px dashed #e2e8f0}
.verdict-section{margin-bottom:20px}
.verdict-card{border:2px solid;border-radius:12px;overflow:hidden}
.verdict-main{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;flex-wrap:wrap}
.verdict-left{flex:1;min-width:200px}
.verdict-eyebrow{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px}
.verdict-title{font-size:32px;font-weight:900;letter-spacing:-1px;line-height:1.1}
.verdict-override{display:inline-block;font-size:8px;font-weight:700;padding:3px 8px;border-radius:5px;margin-top:6px;margin-${fa ? 'left' : 'right'}:4px}
.verdict-score-box{border:2px solid;border-radius:10px;padding:12px 20px;text-align:center;min-width:100px;background:rgba(255,255,255,0.85)}
.verdict-score-num{font-size:40px;font-weight:900;font-family:'Inter',ui-monospace,monospace;line-height:1;letter-spacing:-2px}
.verdict-score-label{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-top:3px}
.verdict-chips{display:flex;gap:3px;justify-content:center;margin-top:8px}
.vchip{font-size:8px;font-weight:800;padding:2px 6px;border-radius:4px;font-family:'Inter',ui-monospace,monospace}
.vchip-r{background:#fee2e2;color:#dc2626}
.vchip-a{background:#fef3c7;color:#d97706}
.vchip-g{background:#d1fae5;color:#059669}
.hypo-bar{display:flex;align-items:center;gap:10px;padding:10px 24px;background:#0f172a;color:#f8fafc;font-size:10px;font-weight:600;border-top:1px solid #1e293b}
.tables-grid{display:grid;grid-template-columns:1.8fr 1fr;gap:14px}
.icdas-image-card{margin-top:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;break-inside:avoid}
.icdas-image-title{padding:7px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:8px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b}
.icdas-image-wrap{padding:12px;display:flex;justify-content:center;align-items:center}
.icdas-image-wrap img{max-width:100%;max-height:220px;object-fit:contain;display:block}
.ref-table{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;break-inside:avoid}
.ref-table-head{display:flex;justify-content:space-between;align-items:center;padding:6px 12px}
.ref-table-head.dark{background:#0f172a}
.ref-table-head.indigo{background:#4f46e5}
.ref-table-title{color:#fff;font-size:10px;font-weight:800;letter-spacing:1px}
.ref-table-sub{font-size:7px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
.ref-table-head.dark .ref-table-sub{color:#64748b}
.ref-table-head.indigo .ref-table-sub{color:#c7d2fe}
table{width:100%;border-collapse:collapse;font-size:10px}
th{background:#f8fafc;font-weight:700;font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;padding:5px 8px;text-align:${fa ? 'right' : 'left'};border-bottom:1.5px solid #e2e8f0}
td{padding:5px 8px;border-bottom:1px solid #f1f5f9;text-align:${fa ? 'right' : 'left'};font-size:10px;color:#334155}
.w-code{width:36px}
.tc{text-align:center;font-weight:800;font-family:'Inter',ui-monospace,monospace;color:#0f172a;background:#fafafa}
.tc.accent{color:#4f46e5}
.ts{font-size:9px;color:#64748b}
.plan-badge{font-size:8px;font-weight:800;padding:2px 10px;border-radius:6px;border:1px solid;letter-spacing:0.5px}
.plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.plan-card{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;break-inside:avoid}
.plan-card.dark{border:2px solid #0f172a}
.plan-card-head{display:flex;align-items:center;gap:6px;padding:8px 12px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:2px}
.plan-card-head.light{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569}
.plan-card-head.dark{background:#0f172a;color:#a5b4fc}
.plan-card-body{padding:10px 12px;font-size:10px;line-height:1.8;color:#334155}
.plan-card-body ul{list-style:none;display:flex;flex-direction:column;gap:4px;padding:0;margin:0}
.plan-card-body li{padding:4px 8px;border-radius:5px;background:#f8fafc;border:1px solid #f1f5f9;font-size:10px;line-height:1.6}
.footer{margin-top:28px;padding-top:10px;border-top:2px solid #0f172a;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#94a3b8;font-weight:600}
.footer-brand{font-size:9px;font-weight:900;color:#0f172a;letter-spacing:2px;font-family:'Inter','Vazirmatn',sans-serif}
.footer-dots{display:flex;gap:3px}
.footer-dots span{width:4px;height:4px;border-radius:50%;background:#cbd5e1}
@media screen{html{background:#64748b}body{background:#64748b;padding:20px 0}.page{background:#fff;width:210mm;min-height:297mm;padding:18mm 16mm;margin:0 auto;box-shadow:0 8px 40px rgba(0,0,0,.25);border-radius:4px}}
@media print{body{padding:0;background:#fff}.page{padding:0;box-shadow:none;min-height:auto}section{break-inside:avoid}.plan-grid>div,.tables-grid>div{break-inside:avoid}}
</style>
</head>
<body>
<div class="page">
    <div class="header">
        <div class="header-left">
            <div class="logo-mark">C</div>
            <div><h1>CAMBRA</h1><div class="protocol">${fa ? 'گزارش ارزیابی ریسک پوسیدگی' : 'Caries Risk Assessment Report'}</div></div>
        </div>
        <div class="header-right">
            <div class="date">${dateD}</div>
            ${patient.name ? `<div class="patient-name">${patient.name}</div>` : ''}
            <div class="risk-badge" style="background:${rc[results?.finalCat]}">${catL}</div>
        </div>
    </div>
    ${body}
    <div class="footer">
        <span class="footer-brand">CAMBRA</span>
        <div class="footer-dots"><span></span><span></span><span></span></div>
        <span>${fa ? 'ابزار بالینی ارزیابی ریسک پوسیدگی' : 'Clinical Caries Risk Assessment Tool'}</span>
        <span>${dateD}</span>
    </div>
</div>
</body>
</html>`;

        const w = window.open('', '_blank', 'width=1000,height=1100');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 600);
        onClose();
    };

    // ── renderSecs and gen are defined above — now return ──
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="c-slide-up bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t-2 sm:border-2 border-slate-900 shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Download className="w-4 h-4 text-white" /></div>
                        <div>
                            <h3 className="font-bold text-base">{fa ? 'خروجی PDF' : 'Export PDF'}</h3>
                            <p className="text-xs text-slate-400">{fa ? 'بخش‌ها را انتخاب کنید' : 'Choose sections'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
                </div>

                {/* ── Nested checklist ── */}
                <div className="overflow-y-auto flex-1 p-3">
                    {renderSecs(secs)}
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
    const mainScrollRef = useRef(null);

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
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (mainScrollRef.current) {
                    mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
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
            <main ref={mainScrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-28" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
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
                                <div className="relative rounded-2xl border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0_#0f172a]">

                                    {/* Background — subtle gradient instead of harsh solid */}
                                    <div className={`absolute inset-0 ${results.finalCat === 'lowRisk' ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50' :
                                        results.finalCat === 'moderateRisk' ? 'bg-gradient-to-br from-amber-50 via-white to-orange-50' :
                                            results.finalCat === 'highRisk' ? 'bg-gradient-to-br from-red-50 via-white to-rose-50' :
                                                'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                                        }`} />

                                    {/* Decorative corner accent */}
                                    <div className={`absolute top-0 ${fa ? 'left-0' : 'right-0'} w-32 h-32 rounded-full blur-3xl opacity-20 ${results.finalCat === 'lowRisk' ? 'bg-emerald-400' :
                                        results.finalCat === 'moderateRisk' ? 'bg-amber-400' :
                                            results.finalCat === 'highRisk' ? 'bg-red-400' :
                                                'bg-red-600'
                                        }`} />

                                    <div className="relative flex flex-col sm:flex-row items-center sm:items-stretch">

                                        {/* Mascot */}
                                        <div className={`w-full sm:w-5/12 p-6 sm:p-8 flex items-center justify-center ${results.finalCat === 'extremeRisk' ? 'bg-white/5' : 'bg-slate-900/[0.03]'
                                            }`}>
                                            <CImg
                                                name={OUTCOME_IMAGES[results.finalCat]}
                                                alt=""
                                                className="w-36 sm:w-full max-w-[160px] drop-shadow-lg c-pop"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="w-full sm:w-7/12 p-5 sm:p-6 flex flex-col justify-center gap-4">

                                            {/* Risk Level Label */}
                                            <div>
                                                <span className={`text-[9px] font-bold uppercase tracking-[.2em] ${results.finalCat === 'extremeRisk' ? 'text-red-300' : 'text-slate-400'
                                                    }`}>
                                                    {fa ? 'نتیجه ارزیابی ریسک' : 'Risk Assessment Result'}
                                                </span>

                                                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight leading-none mt-1.5 ${results.finalCat === 'lowRisk' ? 'text-emerald-700' :
                                                    results.finalCat === 'moderateRisk' ? 'text-amber-700' :
                                                        results.finalCat === 'highRisk' ? 'text-red-700' :
                                                            'text-white'
                                                    }`}>
                                                    {t[results.finalCat]}
                                                </h2>

                                                {/* Override pills */}
                                                {(results.dOverride || results.eOverride || results.orthoOverride) && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {results.dOverride && (
                                                            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${results.finalCat === 'extremeRisk'
                                                                ? 'bg-white/10 text-red-200 border border-white/10'
                                                                : 'bg-red-100 text-red-700 border border-red-200'
                                                                }`}>
                                                                <AlertCircle className="w-3 h-3" /> {t.diseaseOverride}
                                                            </span>
                                                        )}
                                                        {results.eOverride && (
                                                            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${results.finalCat === 'extremeRisk'
                                                                ? 'bg-white/10 text-amber-200 border border-white/10'
                                                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                }`}>
                                                                <Droplets className="w-3 h-3" /> {t.extremeOverride}
                                                            </span>
                                                        )}
                                                        {results.orthoOverride && (
                                                            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${results.finalCat === 'extremeRisk'
                                                                ? 'bg-white/10 text-slate-200 border border-white/10'
                                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                }`}>
                                                                <AlertCircle className="w-3 h-3" /> {t.orthoOverride}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Score chip + breakdown — unified row */}
                                            <div className={`flex items-center gap-3 pt-4 mt-auto ${results.finalCat === 'extremeRisk' ? 'border-t border-white/10' : 'border-t border-slate-200/60'
                                                }`}>
                                                {/* Net score */}
                                                <div className={`flex-shrink-0 px-4 py-2.5 rounded-xl border-2 text-center min-w-[72px] ${results.finalCat === 'extremeRisk'
                                                    ? 'border-white/20 bg-white/5'
                                                    : 'border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]'
                                                    }`}>
                                                    <div className={`text-2xl font-black font-mono leading-none ${results.finalCat === 'extremeRisk' ? 'text-white' : 'text-slate-900'
                                                        }`} dir="ltr">
                                                        {results.score > 0 ? '+' : ''}{toFa(results.score, lang)}
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${results.finalCat === 'extremeRisk' ? 'text-white/50' : 'text-slate-400'
                                                        }`}>{t.totalScore}</span>
                                                </div>

                                                {/* Breakdown chips */}
                                                <div className="flex flex-wrap gap-1.5" dir="ltr">
                                                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-bold font-mono shadow-sm">
                                                        <Stethoscope className="w-3 h-3 opacity-70" />+{toFa(results.dScore, lang)}
                                                    </span>
                                                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-900 text-[11px] font-bold font-mono shadow-sm">
                                                        <Zap className="w-3 h-3 opacity-70" />+{toFa(results.rScore, lang)}
                                                    </span>
                                                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold font-mono shadow-sm">
                                                        <ShieldCheck className="w-3 h-3 opacity-70" />−{toFa(results.pScore, lang)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hyposalivation alert */}
                                {results.hasHyposalivation && (
                                    <div className="mt-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-2 border-slate-900 rounded-xl px-5 py-3 flex items-center gap-3 shadow-[3px_3px_0_#cbd5e1]">
                                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                                            <Droplets className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold block">{fa ? 'هیپوسالیواسیون' : 'Hyposalivation'}</span>
                                            <span className="text-[11px] text-slate-400">{fa ? 'جریان بزاق کاهش‌یافته' : 'Reduced salivary flow detected'}</span>
                                        </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {/* Table Card */}
                                    <div className="md:col-span-3 rounded-2xl border border-slate-200 overflow-hidden h-fit">
                                        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                                            <span className="text-white text-xs font-bold tracking-wider">ICDAS</span>
                                            <span className="text-slate-500 text-[8px] font-medium tracking-wider uppercase">{fa ? 'طبقه‌بندی ضایعات اکلوزال' : 'Occlusal Lesion Classification'}</span>
                                        </div>
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="py-1.5 px-1 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 w-3">{fa ? 'کد' : 'Code'}</th>
                                                    <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{fa ? 'معنی' : 'Meaning'}</th>
                                                    <th className="py-1.5 px-3 text-start text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{fa ? 'وضعیت' : 'Status'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {icdasData.map(([code, meaning, status], i) => (
                                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-1.5 px-1 font-mono font-bold text-center text-slate-900">{code}</td>
                                                        <td className="py-1.5 px-3 text-slate-700 font-medium text-[11px]">{meaning}</td>
                                                        <td className="py-1.5 px-3 text-slate-500 text-[10px]">{status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Bouncy Pinch Zoom Area */}
                                    <div className="md:col-span-2">
                                        <BouncyPinchZoom src="/images/icdas.png" alt="ICDAS Reference" />
                                    </div>
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
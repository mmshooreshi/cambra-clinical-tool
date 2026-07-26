import React, { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity, User, Check, AlertCircle, Shield, PieChart,
    ChevronLeft, ChevronRight, Zap, Stethoscope, ShieldCheck,
    ClipboardCheck, Calendar, ArrowUpRight, Droplets, Info,
    ChevronDown, Sparkles, HeartPulse, BookOpen, X, Download,
    Settings, Shuffle, FileText, GripVertical, BarChart3, TrendingUp,
    TrendingDown, Minus, Star, Award, Target, Layers
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const STYLE_ID = 'cambra-anim-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes cambraFadeIn {
            from { opacity:0; transform:translateY(6px); }
            to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cambraSlideUp {
            from { opacity:0; transform:translateY(100%); }
            to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cambraScaleIn {
            from { opacity:0; transform:scale(0.92); }
            to   { opacity:1; transform:scale(1); }
        }
        @keyframes cambraFloatIn {
            from { opacity:0; transform:translateY(16px); }
            to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cambraPulseGlow {
            0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,0.25); }
            50%     { box-shadow:0 0 24px 6px rgba(99,102,241,0.12); }
        }
        @keyframes cambraGentleBob {
            0%,100% { transform:translateY(0); }
            50%     { transform:translateY(-3px); }
        }
        @keyframes cambraScorePop {
            0%   { transform:scale(1); }
            40%  { transform:scale(1.18) rotate(-2deg); }
            70%  { transform:scale(0.96) rotate(1deg); }
            100% { transform:scale(1) rotate(0deg); }
        }
        @keyframes cambraExpandDown {
            from { opacity:0; transform:translateY(-8px) scaleY(0.85); }
            to   { opacity:1; transform:translateY(0) scaleY(1); }
        }
        @keyframes cambraCollapseUp {
            from { opacity:1; transform:translateY(0) scaleY(1); }
            to   { opacity:0; transform:translateY(-8px) scaleY(0.85); }
        }
        @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
        }

        .cambra-fade-in   { animation: cambraFadeIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .cambra-scale-in  { animation: cambraScaleIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .cambra-slide-up  { animation: cambraSlideUp 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        .cambra-float-in  { animation: cambraFloatIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .cambra-gentle-bob { animation: cambraGentleBob 3s ease-in-out infinite; }
        .cambra-pulse-glow { animation: cambraPulseGlow 2.5s ease-in-out infinite; }
        .cambra-score-pop  { animation: cambraScorePop 0.45s cubic-bezier(0.22,1,0.36,1) both; }

        .cambra-stagger-1 { animation-delay:0.04s; }
        .cambra-stagger-2 { animation-delay:0.08s; }
        .cambra-stagger-3 { animation-delay:0.12s; }
        .cambra-stagger-4 { animation-delay:0.16s; }
        .cambra-stagger-5 { animation-delay:0.20s; }

        /* Smooth accordion - CSS only transition, no spring */
        .cambra-drawer {
            display: grid;
            grid-template-rows: 0fr;
            opacity: 0;
            transition:
                grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1),
                opacity 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .cambra-drawer.open {
            grid-template-rows: 1fr;
            opacity: 1;
        }
        .cambra-drawer > div { overflow: hidden; }

        /* Score badge — no simultaneous re-pop */
        .score-badge-wrap { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
        .score-badge-pop  { animation: cambraScorePop 0.42s cubic-bezier(0.22,1,0.36,1) both; }

        /* Drag handle cursor */
        .drag-handle { cursor: grab; }
        .drag-handle:active { cursor: grabbing; }

        /* PDF paper */
        @media print {
            @page { margin: 18mm 15mm; size: A4; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    `;
    document.head.appendChild(styleEl);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
const FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
const toFa  = (n, lang) => lang !== 'fa' ? String(n) : String(n).replace(/\d/g, d => FA_DIGITS[+d]);
const toFaS = (s, lang) => lang !== 'fa' ? s : String(s).replace(/\d/g, d => FA_DIGITS[+d]);

// ═══════════════════════════════════════════════════════════════════════════════
// JALALI ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
function g2j(gy, gm, gd) {
    const g = [0,31,59,90,120,151,181,212,243,273,304,334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy+1 : gy;
    let d = 365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)-80+gd+g[gm-1];
    jy += 33*Math.floor(d/12053); d %= 12053;
    jy += 4*Math.floor(d/1461); d %= 1461;
    if (d > 365) { jy += Math.floor((d-1)/365); d = (d-1)%365; }
    const jm = d < 186 ? 1+Math.floor(d/31) : 7+Math.floor((d-186)/30);
    const jd = 1+(d < 186 ? d%31 : (d-186)%30);
    return { jy, jm, jd };
}
function j2g(jy, jm, jd) {
    let gy, gm, gd;
    jy += 1595;
    let d = -355668+365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4)+jd+(jm < 7 ? (jm-1)*31 : (jm-7)*30+186);
    gy = 400*Math.floor(d/146097); d %= 146097;
    if (d > 36524) { gy += 100*Math.floor(--d/36524); d %= 36524; if (d >= 365) d++; }
    gy += 4*Math.floor(d/1461); d %= 1461;
    if (d > 365) { gy += Math.floor((d-1)/365); d = (d-1)%365; }
    gd = d+1;
    const s = [0,31,((gy%4===0&&gy%100!==0)||gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
    for (gm = 0; gm < 13 && gd > s[gm]; gm++) gd -= s[gm];
    return { gy, gm, gd };
}
const jLeap  = jy => [1,5,9,13,17,22,26,30].includes(jy%33);
const jMonLen = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : jLeap(jy) ? 30 : 29;
const gLeap  = gy => (gy%4===0&&gy%100!==0)||gy%400===0;
const gMonLen = (gy, gm) => [31,gLeap(gy)?29:28,31,30,31,30,31,31,30,31,30,31][gm-1];

const JM = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const JW = ['ش','ی','د','س','چ','پ','ج'];
const GM = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const todayJ = () => { const d = new Date(); return g2j(d.getFullYear(), d.getMonth()+1, d.getDate()); };
const todayG = () => { const d = new Date(); return { gy:d.getFullYear(), gm:d.getMonth()+1, gd:d.getDate() }; };
const jDow   = (jy,jm,jd) => { const g = j2g(jy,jm,jd); return (new Date(g.gy,g.gm-1,g.gd).getDay()+1)%7; };
const gDow   = (gy,gm,gd) => new Date(gy,gm-1,gd).getDay();
const ds     = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

// ═══════════════════════════════════════════════════════════════════════════════
// PORTAL DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════════
function PortalDropdown({ anchorRef, open, onClose, children, maxH = 420 }) {
    const [pos, setPos] = useState({ top:0, left:0, width:0 });
    const [flip, setFlip] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        if (!open || !anchorRef.current) return;
        const update = () => {
            const r = anchorRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - r.bottom;
            const spaceAbove = r.top;
            const shouldFlip = spaceBelow < maxH && spaceAbove > spaceBelow;
            setFlip(shouldFlip);
            setPos({ top: shouldFlip ? r.top + window.scrollY : r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: Math.max(r.width, 300) });
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
    }, [open, anchorRef, maxH]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (anchorRef.current?.contains(e.target)) return;
            if (dropRef.current?.contains(e.target)) return;
            onClose();
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
    }, [open, onClose, anchorRef]);

    if (!open) return null;
    return createPortal(
        <div ref={dropRef} className="cambra-scale-in" style={{ position:'absolute', zIndex:9999, top: flip ? 'auto' : pos.top, bottom: flip ? `${window.innerHeight - pos.top + 6}px` : 'auto', left:pos.left, width:pos.width, maxHeight:maxH, transformOrigin: flip ? 'bottom center' : 'top center' }}>
            {children}
        </div>,
        document.body
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR PICKER
// ═══════════════════════════════════════════════════════════════════════════════
function CalendarPicker({ value, onChange, lang }) {
    const isRtl = lang === 'fa';
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    const parse = useCallback(() => {
        if (value) { const [y,m,d] = value.split('-').map(Number); return {y,m,d}; }
        if (isRtl) { const t = todayJ(); return {y:t.jy,m:t.jm,d:t.jd}; }
        const t = todayG(); return {y:t.gy,m:t.gm,d:t.gd};
    }, [value, isRtl]);

    const p = parse();
    const [vY, setVY] = useState(p.y);
    const [vM, setVM] = useState(p.m);
    useEffect(() => { const pp = parse(); setVY(pp.y); setVM(pp.m); }, [value, lang]);

    const mNames = isRtl ? JM : GM;
    const wDays  = isRtl ? JW : GW;
    const mLen   = isRtl ? jMonLen(vY, vM) : gMonLen(vY, vM);
    const fDow   = isRtl ? jDow(vY, vM, 1) : gDow(vY, vM, 1);
    const td     = isRtl ? todayJ() : todayG();
    const tdY    = isRtl ? td.jy : td.gy;
    const tdM    = isRtl ? td.jm : td.gm;
    const tdD    = isRtl ? td.jd : td.gd;

    const prev = () => { if (vM===1){setVM(12);setVY(vY-1)}else setVM(vM-1); };
    const next = () => { if (vM===12){setVM(1);setVY(vY+1)}else setVM(vM+1); };
    const pick = d => { onChange(ds(vY,vM,d)); setOpen(false); };
    const pickToday = () => {
        if(isRtl){const t=todayJ();onChange(ds(t.jy,t.jm,t.jd))}
        else{const t=todayG();onChange(ds(t.gy,t.gm,t.gd))}
        setOpen(false);
    };
    const pickYesterday = () => {
        const yd = new Date(); yd.setDate(yd.getDate()-1);
        if(isRtl){const j=g2j(yd.getFullYear(),yd.getMonth()+1,yd.getDate());onChange(ds(j.jy,j.jm,j.jd))}
        else onChange(ds(yd.getFullYear(),yd.getMonth()+1,yd.getDate()));
        setOpen(false);
    };

    const display = () => {
        if (!value) return isRtl ? 'انتخاب تاریخ' : 'Select Date';
        const [y,m,d] = value.split('-').map(Number);
        return isRtl ? `${toFa(d,'fa')} ${JM[m-1]} ${toFa(y,'fa')}` : `${GM[m-1]} ${d}, ${y}`;
    };

    const cells = [];
    for (let i=0;i<fDow;i++) cells.push(null);
    for (let d=1;d<=mLen;d++) cells.push(d);
    while (cells.length%7) cells.push(null);

    return (
        <>
            <button ref={anchorRef} type="button" onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base text-slate-900 cursor-pointer hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/50 active:scale-[0.98] transition-all duration-200">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <span className={!value ? 'text-slate-400' : ''}>{display()}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open?'rotate-180':''}`} />
            </button>
            <PortalDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} maxH={400}>
                <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[6px_6px_0px_rgba(15,23,42,0.7)] overflow-hidden" dir={isRtl?'rtl':'ltr'}>
                    <div className="flex gap-2 p-3 bg-slate-50 border-b border-slate-100">
                        <button onClick={pickToday} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all">
                            {isRtl ? 'امروز' : 'Today'}
                        </button>
                        <button onClick={pickYesterday} className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-slate-300 active:scale-95 transition-all">
                            {isRtl ? 'دیروز' : 'Yesterday'}
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3">
                        <button onClick={isRtl?next:prev} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                            <ChevronRight className="w-4 h-4 text-slate-700" />
                        </button>
                        <span className="font-black text-slate-900 select-none">{mNames[vM-1]} <span className="text-indigo-600 font-mono">{toFa(vY,lang)}</span></span>
                        <button onClick={isRtl?prev:next} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                            <ChevronLeft className="w-4 h-4 text-slate-700" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 px-3">
                        {wDays.map((w,i) => <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase py-1">{w}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 p-3 pt-1">
                        {cells.map((day,i) => {
                            if (!day) return <div key={i}/>;
                            const isT = vY===tdY&&vM===tdM&&day===tdD;
                            const isS = vY===p.y&&vM===p.m&&day===p.d;
                            return (
                                <button key={i} onClick={() => pick(day)}
                                    className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer active:scale-90 transition-all duration-150
                                        ${isS ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-300/50 scale-105 z-10'
                                        : isT ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300 font-black'
                                        : 'hover:bg-slate-100 text-slate-700'}`}>
                                    {toFa(day,lang)}
                                    {isT && !isS && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-500"/>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </PortalDropdown>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM SELECT
// ═══════════════════════════════════════════════════════════════════════════════
function CustomSelect({ value, onChange, options, placeholder, lang, icon: Icon }) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const sel = options.find(o => o.value === value);
    return (
        <>
            <button ref={anchorRef} type="button" onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base cursor-pointer hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/50 active:scale-[0.98] transition-all duration-200">
                <div className="flex items-center gap-2.5">
                    {Icon && <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0 shadow-md"><Icon className="w-4 h-4 text-white"/></div>}
                    <span className={sel?'text-slate-900':'text-slate-400'}>{sel?sel.label:placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open?'rotate-180':''}`}/>
            </button>
            <PortalDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} maxH={300}>
                <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0px_rgba(15,23,42,0.7)] overflow-hidden">
                    {options.map((opt, idx) => (
                        <button key={opt.value} onClick={() => {onChange(opt.value);setOpen(false);}}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-start cursor-pointer transition-all duration-150
                                ${idx < options.length-1 ? 'border-b border-slate-100':''}
                                ${value===opt.value?'bg-indigo-50 text-indigo-900':'hover:bg-slate-50 text-slate-700'} active:bg-indigo-100`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${value===opt.value?'border-indigo-500 bg-indigo-500':'border-slate-300'}`}>
                                {value===opt.value && <Check className="w-3 h-3 text-white" strokeWidth={3}/>}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{opt.label}</span>
                                {opt.desc && <span className="text-xs text-slate-400 font-medium mt-0.5">{opt.desc}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </PortalDropdown>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE BADGE — stable, only pops when its own value changes
// ═══════════════════════════════════════════════════════════════════════════════
function ScoreBadge({ value, sign, color, lang }) {
    const [popKey, setPopKey] = useState(0);
    const prevVal = useRef(value);
    useEffect(() => {
        if (prevVal.current !== value) {
            setPopKey(k => k+1);
            prevVal.current = value;
        }
    }, [value]);

    const g = { red:'from-red-500 to-rose-600', amber:'from-amber-400 to-orange-500', emerald:'from-emerald-400 to-teal-500' }[color];
    return (
        <div key={popKey} className={`cambra-score-pop inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl bg-gradient-to-r ${g} text-white font-black text-sm font-mono shadow-lg`} dir="ltr">
            <span className="opacity-75 text-xs">{sign}</span>
            <span>{toFa(Math.abs(value), lang)}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INFO DRAWER — smooth CSS grid transition, no spring
// Opens independently per row (openId pattern)
// ═══════════════════════════════════════════════════════════════════════════════
function InfoDrawer({ hint, desc, color, open, onToggle }) {
    const c  = { red:'text-red-500 hover:text-red-700', amber:'text-amber-600 hover:text-amber-800', emerald:'text-emerald-600 hover:text-emerald-800' }[color]||'text-slate-500';
    const bg = { red:'bg-red-50/80 border-red-200 text-red-900', amber:'bg-amber-50/80 border-amber-200 text-amber-900', emerald:'bg-emerald-50/80 border-emerald-200 text-emerald-900' }[color]||'';
    return (
        <div className="ms-10 mt-1">
            <button type="button" onClick={e => { e.stopPropagation(); onToggle(); }}
                className={`flex items-center gap-1.5 text-[11px] font-bold py-0.5 px-2 rounded-lg transition-colors duration-200 cursor-pointer ${c}`}>
                <Info className="w-3 h-3 flex-shrink-0"/>
                <span className="truncate max-w-[220px] sm:max-w-xs">{hint}</span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-300 ${open?'rotate-180':''}`}/>
            </button>
            <div className={`cambra-drawer ${open ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div>
                    <div className={`mt-2 mx-1 p-3 rounded-2xl border text-xs leading-relaxed font-medium ${bg}`}>
                        {desc}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA ROW — individual openId, no leakage between rows
// ═══════════════════════════════════════════════════════════════════════════════
function DataRow({ label, hint, desc, checked, onChange, idx, color, weightNum }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const ac = { red:'bg-gradient-to-br from-red-500 to-rose-600', amber:'bg-gradient-to-br from-amber-400 to-orange-500', emerald:'bg-gradient-to-br from-emerald-400 to-teal-500' }[color];
    const hc = { red:'hover:bg-red-50/30', amber:'hover:bg-amber-50/30', emerald:'hover:bg-emerald-50/30' }[color];
    const sign = color === 'emerald' ? '-' : '+';
    return (
        <div className={`flex flex-col border-b border-slate-100 last:border-0 transition-colors duration-200 ${checked ? 'bg-slate-50/60' : `bg-white ${hc}`}`}>
            <div className="flex items-center justify-between gap-3 py-3.5 px-4 sm:px-5 cursor-pointer select-none"
                onClick={() => onChange(idx)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-250
                        ${checked ? `${ac} border-transparent shadow-md` : 'border-slate-300 bg-white'}`}>
                        <Check className={`w-3.5 h-3.5 text-white transition-all duration-250 ${checked?'opacity-100 scale-100':'opacity-0 scale-50'}`} strokeWidth={3}/>
                    </div>
                    <span className={`text-sm font-semibold leading-snug transition-colors duration-200 ${checked?'text-slate-900':'text-slate-600'}`}>{label}</span>
                </div>
                <div className={`transition-all duration-300 ${checked?'opacity-100':'opacity-0 scale-75 w-0 overflow-hidden'}`}>
                    {checked && <ScoreBadge value={weightNum} sign={sign} color={color} lang="fa"/>}
                </div>
            </div>
            <InfoDrawer hint={hint} desc={desc} color={color} open={drawerOpen} onToggle={() => setDrawerOpen(v=>!v)}/>
            <div className="h-3"/>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAGGABLE RESULT CARD (for results page)
// ═══════════════════════════════════════════════════════════════════════════════
function DraggableCards({ cards, renderCard }) {
    const [order, setOrder] = useState(cards.map((_,i)=>i));
    const dragIdx = useRef(null);
    const overIdx = useRef(null);

    const onDragStart = (i) => { dragIdx.current = i; };
    const onDragOver  = (e, i) => { e.preventDefault(); overIdx.current = i; };
    const onDrop      = () => {
        if (dragIdx.current === null || overIdx.current === null || dragIdx.current === overIdx.current) return;
        const next = [...order];
        const [moved] = next.splice(dragIdx.current, 1);
        next.splice(overIdx.current, 0, moved);
        setOrder(next);
        dragIdx.current = null;
        overIdx.current = null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {order.map((cardIdx, displayIdx) => (
                <div key={cardIdx}
                    draggable
                    onDragStart={() => onDragStart(displayIdx)}
                    onDragOver={(e) => onDragOver(e, displayIdx)}
                    onDrop={onDrop}
                    className="group relative">
                    <div className="drag-handle absolute top-3 end-3 z-10 opacity-0 group-hover:opacity-50 transition-opacity">
                        <GripVertical className="w-4 h-4 text-slate-400"/>
                    </div>
                    {renderCard(cards[cardIdx], cardIdx)}
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT MODAL — two-level hierarchical sections + drag-to-reorder preview
// ═══════════════════════════════════════════════════════════════════════════════
function PdfModal({ open, onClose, lang, patient, results, config, diseaseInd, riskFact, protFact }) {
    const isRtl = lang==='fa';
    const t = config?.dict?.[lang];

    const TOP_SECTIONS = [
        { id:'patient',  label: isRtl?'اطلاعات بیمار':'Patient Info',       icon:'👤', children: [] },
        { id:'clinical', label: isRtl?'یافته‌های بالینی':'Clinical Findings', icon:'🔬', children: [
            { id:'disease',  label: isRtl?'شاخص‌های بیماری':'Disease Indicators' },
            { id:'risk',     label: isRtl?'عوامل خطر':'Risk Factors' },
            { id:'protect',  label: isRtl?'عوامل محافظتی':'Protective Factors' },
        ]},
        { id:'result',   label: isRtl?'نتیجه و امتیاز':'Result & Score',    icon:'📊', children: [] },
        { id:'tables',   label: isRtl?'جداول مرجع':'Reference Tables',       icon:'📋', children: [
            { id:'icdas',   label:'ICDAS' },
            { id:'proximal',label: isRtl?'پروگزیمال':'Proximal C' },
        ]},
        { id:'plan',     label: isRtl?'برنامه درمانی':'Action Plan',          icon:'📝', children: [] },
    ];

    const [sections, setSections] = useState(TOP_SECTIONS);
    const [checked, setChecked] = useState(() => {
        const m = {};
        const walk = (s) => { m[s.id]=true; s.children?.forEach(walk); };
        TOP_SECTIONS.forEach(walk);
        return m;
    });
    const [previewOrder, setPreviewOrder] = useState(TOP_SECTIONS.map(s=>s.id));
    const dragIdx = useRef(null);
    const overIdx = useRef(null);

    useEffect(() => { if(open){ setChecked(()=>{ const m={}; const walk=(s)=>{m[s.id]=true;s.children?.forEach(walk);}; TOP_SECTIONS.forEach(walk); return m; }); setPreviewOrder(TOP_SECTIONS.map(s=>s.id)); } }, [open, lang]);

    const toggleChecked = (id, children=[]) => {
        setChecked(prev => {
            const next = {...prev, [id]: !prev[id]};
            const newVal = next[id];
            children.forEach(c => { next[c.id] = newVal; });
            return next;
        });
    };

    const isParentChecked = (sec) => checked[sec.id];
    const isIndeterminate = (sec) => sec.children?.length > 0 && sec.children.some(c=>checked[c.id]) && !sec.children.every(c=>checked[c.id]);

    const onDragStart = i => { dragIdx.current = i; };
    const onDragOver  = (e, i) => { e.preventDefault(); overIdx.current = i; };
    const onDrop      = () => {
        if (dragIdx.current===null||overIdx.current===null||dragIdx.current===overIdx.current) return;
        const next = [...previewOrder];
        const [m] = next.splice(dragIdx.current,1);
        next.splice(overIdx.current,0,m);
        setPreviewOrder(next);
        dragIdx.current=null; overIdx.current=null;
    };

    const gen = () => {
        const isActive = id => checked[id];
        const riskColors = {lowRisk:'#059669',moderateRisk:'#d97706',highRisk:'#dc2626',extremeRisk:'#7f1d1d'};
        const riskBg     = {lowRisk:'#d1fae5',moderateRisk:'#fef3c7',highRisk:'#fee2e2',extremeRisk:'#fecaca'};
        const catLabel   = t?.[results?.finalCat]||'';
        const dateDisp   = (()=>{ if(!patient.date)return''; const[y,m,d]=patient.date.split('-').map(Number); return isRtl?`${toFa(d,'fa')} ${JM[m-1]} ${toFa(y,'fa')}`:`${GM[m-1]} ${d}, ${y}`; })();
        const rl=(arr,pfx)=>arr.map((v,i)=>v?t?.[`${pfx}_${i+1}`]:null).filter(Boolean);

        const orderedSections = previewOrder.map(id => TOP_SECTIONS.find(s=>s.id===id)).filter(Boolean);

        let body = '';
        for (const sec of orderedSections) {
            if (!isActive(sec.id) && !sec.children?.some(c=>isActive(c.id))) continue;
            switch(sec.id) {
                case 'patient':
                    body += `
                    <section class="section">
                      <h2 class="sec-title"><span class="sec-icon">👤</span>${isRtl?'اطلاعات بیمار':'Patient Information'}</h2>
                      <div class="info-grid">
                        <div class="info-item"><span class="info-label">${t?.patientName}</span><span class="info-val">${patient.name||'—'}</span></div>
                        <div class="info-item"><span class="info-label">${t?.chartNo}</span><span class="info-val mono">${toFaS(patient.chartNo||'—',lang)}</span></div>
                        <div class="info-item"><span class="info-label">${t?.date}</span><span class="info-val">${dateDisp||'—'}</span></div>
                        <div class="info-item"><span class="info-label">${t?.assessmentType}</span><span class="info-val">${patient.assessmentType==='baseline'?t?.baseline:t?.recall}</span></div>
                      </div>
                    </section>`;
                    break;
                case 'clinical':
                    if (isActive('disease')) {
                        const items = rl(diseaseInd,'di');
                        body += `<section class="section"><h2 class="sec-title"><span class="sec-icon">🔴</span>${isRtl?'شاخص‌های بیماری':'Disease Indicators'}</h2>`;
                        if (items.length) body += `<ul class="fact-list red">${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
                        else body += `<p class="none-text">${isRtl?'مورد انتخاب‌شده‌ای وجود ندارد':'None selected'}</p>`;
                        body += `</section>`;
                    }
                    if (isActive('risk')) {
                        const items = rl(riskFact,'rf');
                        body += `<section class="section"><h2 class="sec-title"><span class="sec-icon">🟡</span>${isRtl?'عوامل خطر':'Risk Factors'}</h2>`;
                        if (items.length) body += `<ul class="fact-list amber">${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
                        else body += `<p class="none-text">${isRtl?'مورد انتخاب‌شده‌ای وجود ندارد':'None selected'}</p>`;
                        body += `</section>`;
                    }
                    if (isActive('protect')) {
                        const items = rl(protFact,'pf');
                        body += `<section class="section"><h2 class="sec-title"><span class="sec-icon">🟢</span>${isRtl?'عوامل محافظتی':'Protective Factors'}</h2>`;
                        if (items.length) body += `<ul class="fact-list green">${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
                        else body += `<p class="none-text">${isRtl?'مورد انتخاب‌شده‌ای وجود ندارد':'None selected'}</p>`;
                        body += `</section>`;
                    }
                    break;
                case 'result':
                    body += `
                    <section class="section result-section" style="background:${riskBg[results?.finalCat]};border-color:${riskColors[results?.finalCat]}">
                      <div class="result-inner">
                        <div>
                          <div class="result-label">${isRtl?'سطح خطر نهایی':'Final Risk Level'}</div>
                          <div class="result-cat" style="color:${riskColors[results?.finalCat]}">${catLabel}</div>
                          ${results?.dOverride?`<div class="override-note">${isRtl?'⚠ ارتقا توسط شاخص بیماری':'⚠ Overridden by disease indicator'}</div>`:''}
                          ${results?.eOverride?`<div class="override-note">${isRtl?'⚠ ارتقا توسط هیپوسالیواسیون':'⚠ Overridden by hyposalivation'}</div>`:''}
                        </div>
                        <div class="score-box" style="border-color:${riskColors[results?.finalCat]}">
                          <div class="score-num" style="color:${riskColors[results?.finalCat]}">${results?.score>0?'+':''}${results?.score}</div>
                          <div class="score-sub">${isRtl?'نمره خالص':'Net Score'}</div>
                          <div class="score-breakdown">
                            <span class="br-item red">+${results?.dScore} ${isRtl?'بیماری':'disease'}</span>
                            <span class="br-item amber">+${results?.rScore} ${isRtl?'خطر':'risk'}</span>
                            <span class="br-item green">−${results?.pScore} ${isRtl?'محافظت':'protect'}</span>
                          </div>
                        </div>
                      </div>
                    </section>`;
                    break;
                case 'tables':
                    if (isActive('icdas') || isActive('proximal')) {
                        body += `<section class="section"><h2 class="sec-title"><span class="sec-icon">📋</span>${isRtl?'جداول مرجع':'Reference Tables'}</h2><div class="tables-row">`;
                        if (isActive('icdas')) {
                            body += `<div class="ref-table"><h3>ICDAS</h3><table><thead><tr><th>${isRtl?'کد':'Code'}</th><th>${isRtl?'توضیح':'Description'}</th><th>${isRtl?'درمان':'Tx'}</th></tr></thead><tbody>
                                ${[['0',isRtl?'سالم':'Sound',isRtl?'پیشگیری':'Prevent'],['1',isRtl?'تغییر مینا':'Enamel change',isRtl?'ریمینرال':'Remineralise'],['2',isRtl?'ضایعه مینا':'Enamel lesion',isRtl?'فلوراید':'Fluoride'],['3',isRtl?'میکروکاویتی':'Microcavity',isRtl?'ریستوریشن':'Restore'],['4',isRtl?'سایه عاج':'Dentin shadow',isRtl?'ترمیم':'Restore'],['5',isRtl?'حفره عاج':'Dentin cavity',isRtl?'ترمیم فوری':'Urgent'],['6',isRtl?'ضایعه وسیع':'Extensive',isRtl?'اورژانس':'Emergency']].map(([c,d,tx])=>`<tr><td class="code-cell">${toFa(c,lang)}</td><td>${d}</td><td class="tx-cell">${tx}</td></tr>`).join('')}
                                </tbody></table></div>`;
                        }
                        if (isActive('proximal')) {
                            body += `<div class="ref-table"><h3>${isRtl?'ضایعات پروگزیمال':'Proximal Lesions'}</h3><table><thead><tr><th>${isRtl?'کد':'Code'}</th><th>${isRtl?'توضیح':'Description'}</th><th>${isRtl?'درمان':'Tx'}</th></tr></thead><tbody>
                                ${[['C1',isRtl?'نیمه خارجی مینا':'Outer ½ enamel',isRtl?'ریمینرال':'Remineralise'],['C2',isRtl?'نیمه داخلی مینا':'Inner ½ enamel',isRtl?'فلوراید':'Fluoride'],['C3',isRtl?'خارجی عاج':'Outer dentin',isRtl?'ترمیم':'Restore'],['C4',isRtl?'میانی/داخلی عاج':'Mid/inner dentin',isRtl?'ترمیم فوری':'Urgent']].map(([c,d,tx])=>`<tr><td class="code-cell">${c}</td><td>${d}</td><td class="tx-cell">${tx}</td></tr>`).join('')}
                                </tbody></table></div>`;
                        }
                        body += `</div></section>`;
                    }
                    break;
                case 'plan': {
                    const RM={lowRisk:{d:'rec_low_diag',i:'rec_low_int'},moderateRisk:{d:'rec_mod_diag',i:'rec_mod_int'},highRisk:{d:'rec_high_diag',i:'rec_high_int'},extremeRisk:{d:'rec_ext_diag',i:'rec_ext_int'}};
                    body += `
                    <section class="section plan-section">
                      <h2 class="sec-title"><span class="sec-icon">📝</span>${isRtl?'برنامه درمانی':'Action Plan'}</h2>
                      <div class="plan-grid">
                        <div class="plan-col diag">
                          <h3>${t?.recDiagnostics}</h3>
                          <div class="plan-content">${t?.[RM[results?.finalCat]?.d]||''}</div>
                        </div>
                        <div class="plan-col int">
                          <h3>${t?.recInterventions}</h3>
                          <div class="plan-content">${t?.[RM[results?.finalCat]?.i]||''}</div>
                        </div>
                      </div>
                    </section>`;
                    break;
                }
            }
        }

        const html = `<!DOCTYPE html>
<html dir="${isRtl?'rtl':'ltr'}" lang="${lang}">
<head>
<meta charset="UTF-8">
<title>CAMBRA Report — ${patient.name||''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&family=Amiri:ital,wght@0,400;0,700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Vazirmatn',sans-serif;background:#fff;color:#1e293b;font-size:13px;line-height:1.75;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:18mm 15mm}

/* HEADER */
.report-header{display:flex;justify-content:space-between;align-items:flex-start;padding:0 0 16px 0;border-bottom:3px solid #0f172a;margin-bottom:28px}
.header-brand{display:flex;align-items:center;gap:12px}
.header-logo{width:48px;height:48px;background:#0f172a;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;color:white;font-family:'Amiri',serif;font-weight:700;line-height:1}
.header-text h1{font-size:26px;font-weight:900;letter-spacing:-1px;color:#0f172a}
.header-text p{font-size:9px;color:#64748b;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-top:2px}
.header-meta{text-align:${isRtl?'left':'right'};display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.header-date{font-size:11px;color:#64748b;font-weight:600}
.risk-badge{display:inline-block;padding:6px 18px;border-radius:10px;color:#fff;font-weight:900;font-size:16px;letter-spacing:0.5px}

/* SECTIONS */
.section{margin-bottom:22px;break-inside:avoid}
.sec-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2.5px;color:#475569;border-bottom:2px solid #e2e8f0;padding-bottom:7px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.sec-icon{font-size:14px}

/* INFO GRID */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.info-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;display:flex;flex-direction:column;gap:2px}
.info-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
.info-val{font-size:13px;font-weight:700;color:#0f172a}
.mono{font-family:monospace}

/* FACT LISTS */
.fact-list{list-style:none;display:flex;flex-direction:column;gap:5px}
.fact-list li{display:flex;align-items:flex-start;gap:8px;font-size:12px;font-weight:500;padding:5px 10px;border-radius:7px}
.fact-list li::before{content:'';width:6px;height:6px;border-radius:50%;margin-top:6px;flex-shrink:0}
.fact-list.red li{background:#fff1f2;color:#9f1239}.fact-list.red li::before{background:#ef4444}
.fact-list.amber li{background:#fffbeb;color:#92400e}.fact-list.amber li::before{background:#f59e0b}
.fact-list.green li{background:#f0fdf4;color:#14532d}.fact-list.green li::before{background:#22c55e}
.none-text{font-size:12px;color:#94a3b8;font-style:italic;padding:4px 0}

/* RESULT */
.result-section{border:2px solid;border-radius:12px;padding:18px 20px}
.result-inner{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.result-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#475569;margin-bottom:6px}
.result-cat{font-size:32px;font-weight:900;letter-spacing:-1px;line-height:1}
.override-note{font-size:10px;font-weight:600;color:#dc2626;margin-top:6px;padding:3px 8px;background:rgba(220,38,38,0.1);border-radius:6px;display:inline-block}
.score-box{border:2px solid;border-radius:10px;padding:12px 18px;text-align:center;background:rgba(255,255,255,0.7);min-width:130px}
.score-num{font-size:42px;font-weight:900;font-family:monospace;line-height:1}
.score-sub{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin-top:2px}
.score-breakdown{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px}
.br-item{font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px}
.br-item.red{background:#fee2e2;color:#dc2626}
.br-item.amber{background:#fef3c7;color:#d97706}
.br-item.green{background:#d1fae5;color:#059669}

/* TABLES */
.tables-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ref-table h3{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#475569;margin-bottom:7px}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border:1px solid #e2e8f0;padding:5px 9px;text-align:${isRtl?'right':'left'}}
th{background:#f1f5f9;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#475569}
.code-cell{text-align:center;font-weight:900;font-size:12px;background:#f8fafc;font-family:monospace;white-space:nowrap}
.tx-cell{font-size:10px;color:#64748b;white-space:nowrap}

/* PLAN */
.plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.plan-col h3{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;padding:5px 10px;border-radius:6px}
.plan-col.diag h3{background:#f1f5f9;color:#475569}
.plan-col.int h3{background:#0f172a;color:#e2e8f0}
.plan-content{font-size:12px;line-height:1.75}
.plan-content ul{list-style:none;display:flex;flex-direction:column;gap:6px}
.plan-content li{padding:5px 8px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0}

/* FOOTER */
.report-footer{margin-top:32px;padding-top:12px;border-top:1.5px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#94a3b8;font-weight:600}
.footer-brand{font-weight:900;color:#475569;letter-spacing:2px;text-transform:uppercase}

@media print{
  .section{break-inside:avoid}
  .plan-col,.ref-table,.result-inner{break-inside:avoid}
}
</style>
</head>
<body>
<div class="report-header">
  <div class="header-brand">
    <div class="header-logo">C</div>
    <div class="header-text">
      <h1>CAMBRA</h1>
      <p>${isRtl?'گزارش ارزیابی ریسک پوسیدگی':'Caries Risk Assessment Report'}</p>
    </div>
  </div>
  <div class="header-meta">
    <div class="header-date">${dateDisp}</div>
    <div class="risk-badge" style="background:${riskColors[results?.finalCat]}">${catLabel}</div>
    ${patient.name?`<div style="font-size:12px;font-weight:700;color:#475569">${patient.name}</div>`:''}
  </div>
</div>

${body}

<div class="report-footer">
  <span class="footer-brand">CAMBRA</span>
  <span>${isRtl?'ابزار بالینی ارزیابی ریسک پوسیدگی — ویژه بیماران ۶ سال و بالاتر':'Clinical Caries Risk Assessment Tool — For patients aged 6+'}</span>
  <span>${dateDisp}</span>
</div>
</body>
</html>`;

        const w = window.open('','_blank','width=860,height=1100');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 600);
        onClose();
    };

    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="cambra-slide-up bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border-t-4 sm:border-4 border-slate-900 shadow-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-3xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Download className="w-5 h-5 text-white"/>
                        </div>
                        <div>
                            <h3 className="font-black text-lg">{isRtl?'ذخیره گزارش':'Export Report'}</h3>
                            <p className="text-xs text-slate-400 font-bold">{isRtl?'بخش‌ها را انتخاب و مرتب‌سازی کنید':'Select & reorder sections'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer active:scale-90 transition-all"><X className="w-4 h-4 text-slate-500"/></button>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {/* Hierarchical section picker */}
                    {TOP_SECTIONS.map(sec => (
                        <div key={sec.id} className="rounded-2xl overflow-hidden border-2 border-slate-100">
                            {/* Parent */}
                            <button onClick={() => toggleChecked(sec.id, sec.children)}
                                className={`w-full flex items-center gap-3 p-3.5 cursor-pointer active:scale-[0.99] transition-all ${checked[sec.id]?'bg-indigo-50':'bg-white hover:bg-slate-50'}`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${checked[sec.id]?'bg-indigo-600':'bg-slate-200'} ${isIndeterminate(sec)?'bg-indigo-300':''}`}>
                                    {checked[sec.id] && <Check className="w-4 h-4 text-white" strokeWidth={3}/>}
                                    {isIndeterminate(sec) && !checked[sec.id] && <Minus className="w-3 h-3 text-white" strokeWidth={3}/>}
                                </div>
                                <span className="text-lg">{sec.icon}</span>
                                <span className={`font-bold text-sm ${checked[sec.id]?'text-slate-900':'text-slate-500'}`}>{sec.label}</span>
                            </button>
                            {/* Children */}
                            {sec.children?.length > 0 && (
                                <div className="bg-slate-50 border-t border-slate-100 divide-y divide-slate-100">
                                    {sec.children.map(child => (
                                        <button key={child.id} onClick={() => toggleChecked(child.id)}
                                            className={`w-full flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-all ${checked[child.id]?'text-indigo-900':'text-slate-500 hover:text-slate-700'}`}>
                                            <div className={`w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0 ${checked[child.id]?'bg-indigo-500':'bg-slate-200'}`}>
                                                {checked[child.id] && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/>}
                                            </div>
                                            <span className="text-xs font-semibold">{child.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Drag-to-reorder preview */}
                    <div className="pt-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">{isRtl?'ترتیب بخش‌ها را بکشید':'Drag to reorder sections'}</p>
                        <div className="space-y-1.5">
                            {previewOrder.map((id, displayIdx) => {
                                const sec = TOP_SECTIONS.find(s=>s.id===id);
                                if (!sec) return null;
                                const active = checked[id] || sec.children?.some(c=>checked[c.id]);
                                return (
                                    <div key={id} draggable onDragStart={()=>onDragStart(displayIdx)} onDragOver={e=>onDragOver(e,displayIdx)} onDrop={onDrop}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${active?'border-slate-200 bg-white':'border-dashed border-slate-100 bg-slate-50 opacity-40'}`}>
                                        <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0"/>
                                        <span className="text-sm">{sec.icon}</span>
                                        <span className="text-xs font-semibold text-slate-600">{sec.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 pt-0 pb-6 flex-shrink-0 border-t border-slate-100">
                    <button onClick={gen}
                        className="group relative w-full cursor-pointer active:scale-95 transition-transform mt-4">
                        <div className="absolute inset-0 bg-indigo-800 rounded-2xl translate-y-1"/>
                        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 group-hover:translate-y-0.5 transition-transform">
                            <FileText className="w-5 h-5"/>{isRtl?'تولید PDF':'Generate PDF'}
                        </div>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME SCREEN — clean, no-slop, professional
// ═══════════════════════════════════════════════════════════════════════════════
function WelcomeScreen({ lang, onStart, t }) {
    const r = lang === 'fa';
    const steps = r
        ? [{icon:User,   label:'اطلاعات',   sub:'پروفایل بیمار'},
           {icon:AlertCircle,label:'پاتولوژی', sub:'شاخص‌های بیماری'},
           {icon:Shield, label:'پیشگیری',   sub:'عوامل محافظتی'},
           {icon:PieChart,label:'تحلیل',    sub:'نتیجه و برنامه'}]
        : [{icon:User,   label:'Profile',   sub:'Patient info'},
           {icon:AlertCircle,label:'Pathology',sub:'Disease indicators'},
           {icon:Shield, label:'Prevention',sub:'Protective factors'},
           {icon:PieChart,label:'Analysis', sub:'Result & plan'}];

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] px-4 py-8">
            <div className="w-full max-w-md flex flex-col items-center gap-8">

                {/* Brand */}
                <div className="cambra-float-in text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl cambra-gentle-bob">
                        <HeartPulse className="w-8 h-8 text-white" strokeWidth={1.5}/>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">CAMBRA</h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
                        {r ? 'ارزیابی ریسک پوسیدگی' : 'Caries Risk Assessment'}
                    </p>
                </div>

                {/* Workflow steps */}
                <div className="cambra-float-in cambra-stagger-1 w-full grid grid-cols-4 gap-2">
                    {steps.map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 py-4 px-2 bg-white border-2 border-slate-200 rounded-2xl text-center">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                <s.icon className="w-4 h-4 text-slate-600"/>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{s.label}</div>
                                <div className="text-[9px] text-slate-400 font-medium mt-0.5 leading-tight">{s.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Description */}
                <div className="cambra-float-in cambra-stagger-2 w-full bg-white border-2 border-slate-200 rounded-2xl p-5">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed text-center">
                        {r
                            ? 'بر پایه پروتکل بالینی CAMBRA — اطلاعات بیمار را وارد کنید، فاکتورها را ثبت کنید، و نتیجه همراه با برنامه درمانی شخصی‌سازی‌شده دریافت کنید.'
                            : 'Based on the CAMBRA clinical protocol — enter patient data, record factors, and receive a personalised risk level with a tailored treatment plan.'}
                    </p>
                </div>

                {/* CTA */}
                <button onClick={onStart}
                    className="cambra-float-in cambra-stagger-3 cambra-pulse-glow group relative cursor-pointer active:scale-95 transition-transform w-full rounded-2xl">
                    <div className="absolute inset-0 bg-slate-900 rounded-2xl translate-y-1.5"/>
                    <div className="relative bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 group-hover:bg-slate-800 transition-colors">
                        {r ? 'شروع ارزیابی' : 'Start Assessment'}
                        <ChevronRight className={`w-5 h-5 ${r?'rotate-180':''}`}/>
                    </div>
                </button>

                <p className="cambra-float-in cambra-stagger-4 text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                    {r ? 'ویژه بیماران ۶ سال و بالاتر' : 'For patients aged 6 and above'}
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE MINIBAR (results page visual summary)
// ═══════════════════════════════════════════════════════════════════════════════
function ScoreBar({ label, value, max, color, icon: Icon }) {
    const pct = Math.min(100, Math.abs(value) / max * 100);
    const colors = {
        red:    { bar:'bg-red-500',     bg:'bg-red-50',     text:'text-red-700',     border:'border-red-200' },
        amber:  { bar:'bg-amber-400',   bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200' },
        emerald:{ bar:'bg-emerald-500', bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' },
    }[color];
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bar.replace('bg-','bg-').replace('500','100')}`}>
                <Icon className={`w-3.5 h-3.5 ${colors.text}`}/>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${colors.text}`}>{label}</span>
                    <span className={`font-black font-mono text-sm ${colors.text}`} dir="ltr">{value > 0 ? '+' : value < 0 ? '−' : ''}{Math.abs(value)}</span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                    <div className={`h-full rounded-full transition-all duration-700 ${colors.bar}`} style={{width:`${pct}%`}}/>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT CARD
// ═══════════════════════════════════════════════════════════════════════════════
function ResultCard({ st, lang, t }) {
    const isRtl = lang === 'fa';
    return (
        <div className={`flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden h-full`}>
            {/* Card header */}
            <div className={`p-4 border-b-2 border-slate-100 ${st.headerBg}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${st.m} shadow-md`}>
                            <st.ic className="w-4 h-4"/>
                        </div>
                        <div>
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider">{st.lb}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">{st.sub}</p>
                        </div>
                    </div>
                    <div dir="ltr" className={`px-2.5 py-1.5 rounded-xl border-2 ${st.b} ${st.l}`}>
                        <span className={`font-mono font-black text-lg leading-none ${st.tx}`}>{st.s}{toFa(st.sc, lang)}</span>
                    </div>
                </div>
            </div>
            {/* Card body */}
            <div className="p-3 flex-1 flex flex-col gap-2">
                {st.it.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        {st.it.map((item, idx) => (
                            <div key={idx} className={`flex items-start gap-2 px-2.5 py-2 rounded-xl border ${st.b} ${st.l}`}>
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${st.dot}`}/>
                                <span className={`text-[11px] font-semibold leading-snug ${st.tx}`}>{item}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 opacity-25 py-6">
                        <div className={`w-8 h-8 rounded-xl border-2 border-dashed ${st.b} flex items-center justify-center`}>
                            <st.ic className={`w-3.5 h-3.5 ${st.tx}`}/>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isRtl?'هیچ‌کدام':'None'}</span>
                    </div>
                )}
            </div>
            {/* Mini count */}
            <div className={`px-4 py-2 border-t border-slate-100 flex items-center justify-between`}>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isRtl?'موارد':'items'}</span>
                <span className={`text-xs font-black font-mono ${st.tx}`}>{toFa(st.it.length, lang)}</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const ADMIN_KEY = 'cambra_admin_2026';

export default function CambraApp() {
    const [lang, setLang] = useState('fa');
    const [activeTab, setActiveTab] = useState('welcome');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [config, setConfig] = useState(null);
    const [showPdf, setShowPdf] = useState(false);

    const isAdmin = useMemo(() => typeof window!=='undefined' && new URLSearchParams(window.location.search).get('admin')===ADMIN_KEY, []);

    const initDate = l => {
        const d = new Date();
        if (l==='fa'){const j=g2j(d.getFullYear(),d.getMonth()+1,d.getDate());return ds(j.jy,j.jm,j.jd);}
        return ds(d.getFullYear(),d.getMonth()+1,d.getDate());
    };

    const [patient,    setPatient]    = useState({name:'',chartNo:'',date:initDate('fa'),assessmentType:'baseline'});
    const [diseaseInd, setDiseaseInd] = useState([]);
    const [riskFact,   setRiskFact]   = useState([]);
    const [protFact,   setProtFact]   = useState([]);
    const [appAlert,   setAppAlert]   = useState({show:false,message:'',type:'info',onClose:null});

    useEffect(() => {
        setPatient(prev => {
            if (!prev.date) return prev;
            const [y,m,d] = prev.date.split('-').map(Number);
            if (lang==='fa' && y>1500){const j=g2j(y,m,d);return{...prev,date:ds(j.jy,j.jm,j.jd)};}
            if (lang==='en' && y<1500){const g=j2g(y,m,d);return{...prev,date:ds(g.gy,g.gm,g.gd)};}
            return prev;
        });
    }, [lang]);

    useEffect(() => {
        fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/config')
            .then(r => r.json())
            .then(data => {
                setConfig(data);
                const s = data.settings;
                setDiseaseInd(new Array(s.diseaseCount).fill(false));
                setRiskFact(new Array(s.riskCount).fill(false));
                setProtFact(new Array(s.protectiveCount).fill(false));
            })
            .catch(console.error);
    }, []);

    useEffect(() => { window.scrollTo({top:0,behavior:'smooth'}); }, [activeTab]);

    const results = useMemo(() => {
        if (!config) return null;
        const s = config.settings;
        const dC=diseaseInd.filter(Boolean).length, rC=riskFact.filter(Boolean).length, pC=protFact.filter(Boolean).length;
        const dS=dC*s.diseaseWeight, rS=rC*s.riskWeight, pS=pC*s.protectiveWeight, sc=(dS+rS)-pS;
        let b='lowRisk';
        if (sc>=s.extremeMin) b='extremeRisk';
        else if (sc>=s.modMax+1) b='highRisk';
        else if (sc>=s.lowMax+1) b='moderateRisk';
        let f=b,dO=false,eO=false,oO=false;
        if (riskFact[7]&&b==='lowRisk'){f='moderateRisk';oO=true;}
        if (dC>0&&(f==='lowRisk'||f==='moderateRisk')){f='highRisk';dO=true;oO=false;}
        const hH=riskFact[1]||riskFact[4];
        if (f==='highRisk'&&hH){f='extremeRisk';eO=true;dO=false;}
        return {dCount:dC,rCount:rC,pCount:pC,dScore:dS,rScore:rS,pScore:pS,score:sc,finalCat:f,dOverride:dO,eOverride:eO,orthoOverride:oO,hasHyposalivation:hH};
    }, [diseaseInd,riskFact,protFact,config]);

    const tabOrder = ['welcome','patient','disease','protective','results'];
    const isValid  = id => id==='patient' ? patient.name.length>0 && patient.chartNo.length>0 : true;
    const toggle   = (setter, idx) => setter(p => { const n=[...p]; n[idx]=!n[idx]; return n; });

    const genChart = () => {
        const r = Math.floor(1000+Math.random()*9000);
        const d = new Date();
        setPatient(p => ({...p, chartNo:`CMB-${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}-${r}`}));
    };

    const reset = () => {
        setPatient({name:'',chartNo:'',date:initDate(lang),assessmentType:'baseline'});
        if (config){const s=config.settings;setDiseaseInd(new Array(s.diseaseCount).fill(false));setRiskFact(new Array(s.riskCount).fill(false));setProtFact(new Array(s.protectiveCount).fill(false));}
        setActiveTab('welcome');
    };

    const submit = async () => {
        setIsSubmitting(true);
        try {
            const cd = config.dict[lang];
            const gl = (arr,pfx) => arr.map((v,i)=>v?cd[`${pfx}_${i+1}`]:null).filter(Boolean);
            let sd = patient.date;
            if (lang==='fa' && patient.date){const[y,m,d]=patient.date.split('-').map(Number);if(y<1500){const g=j2g(y,m,d);sd=ds(g.gy,g.gm,g.gd);}}
            const payload = {
                patient_name:patient.name, chart_no:patient.chartNo, assessment_type:patient.assessmentType,
                disease_ind:JSON.stringify(gl(diseaseInd,'di')), risk_fact:JSON.stringify(gl(riskFact,'rf')),
                prot_fact:JSON.stringify(gl(protFact,'pf')), severe_hypo:results.hasHyposalivation.toString(),
                net_score:results.score, final_category:results.finalCat,
                raw_data:JSON.stringify({patient:{...patient,date:sd},diseaseInd,riskFact,protFact})
            };
            const res = await fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
            if (res.ok) setAppAlert({show:true,message:lang==='fa'?'با موفقیت ثبت شد!':'Submitted successfully!',type:'success',onClose:reset});
            else        setAppAlert({show:true,message:lang==='fa'?'خطا در ثبت':'Submission error',type:'error'});
        } catch {
            setAppAlert({show:true,message:lang==='fa'?'اینترنت را بررسی کنید':'Check your connection',type:'error'});
        }
        setIsSubmitting(false);
    };

    if (!config) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/>
            <span className="font-bold text-sm text-slate-400">Loading CAMBRA...</span>
        </div>
    );

    const t = config.dict[lang];
    const isRtl = lang === 'fa';
    const settings = config.settings;
    const isW = activeTab === 'welcome';

    const headerTabs = [
        {id:'patient',   icon:User,         label:t.tabPatient},
        {id:'disease',   icon:AlertCircle,  label:t.tabDisease},
        {id:'protective',icon:Shield,       label:t.tabProtective},
        {id:'results',   icon:PieChart,     label:t.tabResults},
    ];

    const CatColors = {
        extremeRisk:  'bg-gradient-to-br from-red-900 to-slate-950',
        highRisk:     'bg-gradient-to-br from-red-500 to-rose-700',
        moderateRisk: 'bg-gradient-to-br from-amber-400 to-orange-500',
        lowRisk:      'bg-gradient-to-br from-emerald-500 to-teal-600',
    };
    const CatTextColors = { extremeRisk:'text-red-100', highRisk:'text-white', moderateRisk:'text-amber-950', lowRisk:'text-white' };
    const RecMap = {
        lowRisk:     {d:'rec_low_diag',  i:'rec_low_int'},
        moderateRisk:{d:'rec_mod_diag',  i:'rec_mod_int'},
        highRisk:    {d:'rec_high_diag', i:'rec_high_int'},
        extremeRisk: {d:'rec_ext_diag',  i:'rec_ext_int'},
    };

    const resultCards = [
        {
            k:'di', sc:results?.dScore||0, s:'+',
            m:'bg-gradient-to-br from-red-500 to-rose-600',
            l:'bg-red-50', b:'border-red-200', tx:'text-red-700',
            lb:isRtl?'پاتولوژی':'Pathology',
            sub:isRtl?'شاخص‌های بیماری':'Disease indicators',
            ic:Stethoscope, dot:'bg-red-500',
            headerBg:'bg-red-50/60',
            it:(diseaseInd||[]).map((c,i)=>c?t[`di_${i+1}`]:null).filter(Boolean),
        },
        {
            k:'rf', sc:results?.rScore||0, s:'+',
            m:'bg-gradient-to-br from-amber-400 to-orange-500',
            l:'bg-amber-50', b:'border-amber-200', tx:'text-amber-700',
            lb:isRtl?'بیولوژی':'Biology',
            sub:isRtl?'عوامل خطر':'Risk factors',
            ic:Zap, dot:'bg-amber-400',
            headerBg:'bg-amber-50/60',
            it:(riskFact||[]).map((c,i)=>c?t[`rf_${i+1}`]:null).filter(Boolean),
        },
        {
            k:'pf', sc:results?.pScore||0, s:'−',
            m:'bg-gradient-to-br from-emerald-400 to-teal-500',
            l:'bg-emerald-50', b:'border-emerald-200', tx:'text-emerald-700',
            lb:isRtl?'محافظت':'Protection',
            sub:isRtl?'عوامل پیشگیری':'Protective factors',
            ic:ShieldCheck, dot:'bg-emerald-500',
            headerBg:'bg-emerald-50/60',
            it:(protFact||[]).map((c,i)=>c?t[`pf_${i+1}`]:null).filter(Boolean),
        },
    ];

    return (
        <div dir={isRtl?'rtl':'ltr'} className={`min-h-screen bg-slate-50 text-slate-900 ${isRtl?'font-arabic':''} ${isW?'':'pb-24'}`}
            style={{fontFamily:isRtl?"'Vazirmatn',sans-serif":"system-ui,sans-serif"}}>

            {/* ── HEADER ── */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-2.5 sticky top-0 z-30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
                        <Activity className="w-4 h-4"/>
                    </div>
                    <div className="flex flex-col leading-tight">
                        <h1 className="font-black text-sm sm:text-base text-slate-900">{t.title}</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">{t.subtitle}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {isAdmin && (
                        <a href="/appliance_survey/admin-cambra-789" target="_blank"
                            className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-indigo-200">
                            <Settings className="w-3.5 h-3.5 text-indigo-600"/>
                        </a>
                    )}
                    <button onClick={() => setLang(lang==='en'?'fa':'en')}
                        className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer active:scale-95 transition-all border border-slate-200">
                        {t.language}
                    </button>
                </div>
            </header>

            {/* ── TAB BAR ── */}
            {!isW && (
                <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-[45px] z-20">
                    <div className="max-w-3xl mx-auto flex">
                        {headerTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-bold border-b-2 transition-all duration-200 cursor-pointer
                                    ${activeTab===tab.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                <tab.icon className={`w-3.5 h-3.5 transition-colors ${activeTab===tab.id?'text-slate-900':'text-slate-300'}`}/>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── MAIN ── */}
            <main className="max-w-3xl mx-auto p-4 md:p-6">
                {isW && <WelcomeScreen lang={lang} onStart={() => setActiveTab('patient')} t={t}/>}

                <div className={isW ? 'hidden' : 'space-y-6'}>

                    {/* ── PATIENT ── */}
                    <div className={activeTab!=='patient' ? 'hidden' : ''}>
                        <div className="cambra-fade-in bg-white rounded-3xl border-2 border-slate-200 overflow-visible shadow-sm">
                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 rounded-t-3xl">
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{t.patientInfo}</h2>
                            </div>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Name */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.patientName}</label>
                                    <div className="relative">
                                        <div className="absolute top-1/2 -translate-y-1/2 start-3 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-slate-500"/>
                                        </div>
                                        <input type="text" value={patient.name}
                                            onChange={e => setPatient(p => ({...p, name:e.target.value}))}
                                            className="w-full text-base font-bold ps-13 pe-4 py-3 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-100/50 transition-all bg-white"
                                            placeholder={isRtl?'نام بیمار...':'Patient name...'}/>
                                    </div>
                                </div>
                                {/* Chart No */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.chartNo}</label>
                                    <div className="relative">
                                        <div className="absolute top-1/2 -translate-y-1/2 start-3 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <ClipboardCheck className="w-3.5 h-3.5 text-slate-500"/>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="text"
                                            value={toFaS(patient.chartNo, lang)}
                                            onChange={e => {
                                                let v = e.target.value;
                                                // Normalise Persian/Arabic numerals → ASCII digits
                                                // v = v.replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728 + 48));
                                                // v = v.replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));
                                                setPatient(p => ({...p, chartNo:v}));
                                            }}
                                            className="w-full text-base font-bold ps-13 pe-12 py-3 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-100/50 transition-all font-mono bg-white"
                                            placeholder={isRtl?'شماره پرونده...':'Chart #...'}
                                            dir="ltr"
                                        />
                                        <button onClick={genChart} type="button"
                                            className="absolute top-1/2 -translate-y-1/2 end-2 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-sm">
                                            <Shuffle className="w-3.5 h-3.5 text-white"/>
                                        </button>
                                    </div>
                                </div>
                                {/* Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.date}</label>
                                    <CalendarPicker value={patient.date} onChange={v => setPatient(p => ({...p,date:v}))} lang={lang}/>
                                </div>
                                {/* Type */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.assessmentType}</label>
                                    <CustomSelect value={patient.assessmentType} onChange={v => setPatient(p => ({...p,assessmentType:v}))}
                                        options={[
                                            {value:'baseline',label:t.baseline,desc:isRtl?'اولین ارزیابی بیمار':'First-time assessment'},
                                            {value:'recall',  label:t.recall,  desc:isRtl?'ارزیابی دوره‌ای':'Periodic follow-up'},
                                        ]}
                                        placeholder={isRtl?'انتخاب نوع...':'Select type...'} lang={lang} icon={ClipboardCheck}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── DISEASE + RISK ── */}
                    <div className={`${activeTab!=='disease'?'hidden':''} space-y-6`}>
                        {/* Disease Indicators */}
                        <div className="cambra-fade-in bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-red-50 border-b-2 border-red-100 px-5 py-3">
                                <h2 className="text-sm font-black text-red-800 uppercase tracking-widest">{t.diseaseIndicators}</h2>
                                <p className="text-[11px] text-red-500/80 mt-0.5 font-semibold">{t.diseaseIndSubtitle}</p>
                            </div>
                            {Array.from({length:settings.diseaseCount}).map((_,i) => (
                                <DataRow key={`di_${i}`}
                                    label={t[`di_${i+1}`]}
                                    hint={t[`di_${i+1}_hint`]}
                                    desc={t[`di_${i+1}_desc`]}
                                    checked={diseaseInd[i]}
                                    onChange={x => toggle(setDiseaseInd, x)}
                                    idx={i} color="red" weightNum={settings.diseaseWeight}
                                />
                            ))}
                        </div>
                        {/* Risk Factors */}
                        <div className="cambra-fade-in cambra-stagger-2 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-amber-50 border-b-2 border-amber-100 px-5 py-3">
                                <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest">{t.riskFactors}</h2>
                                <p className="text-[11px] text-amber-600/80 mt-0.5 font-semibold">{t.riskFactSubtitle}</p>
                            </div>
                            {Array.from({length:settings.riskCount}).map((_,i) => (
                                <DataRow key={`rf_${i}`}
                                    label={t[`rf_${i+1}`]}
                                    hint={t[`rf_${i+1}_hint`]}
                                    desc={t[`rf_${i+1}_desc`]}
                                    checked={riskFact[i]}
                                    onChange={x => toggle(setRiskFact, x)}
                                    idx={i} color="amber" weightNum={settings.riskWeight}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── PROTECTIVE ── */}
                    <div className={activeTab!=='protective' ? 'hidden' : ''}>
                        <div className="cambra-fade-in bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-emerald-50 border-b-2 border-emerald-100 px-5 py-3">
                                <h2 className="text-sm font-black text-emerald-800 uppercase tracking-widest">{t.protectiveFactors}</h2>
                                <p className="text-[11px] text-emerald-600/80 mt-0.5 font-semibold">{t.protFactSubtitle}</p>
                            </div>
                            {Array.from({length:settings.protectiveCount}).map((_,i) => (
                                <DataRow key={`pf_${i}`}
                                    label={t[`pf_${i+1}`]}
                                    hint={t[`pf_${i+1}_hint`]}
                                    desc={t[`pf_${i+1}_desc`]}
                                    checked={protFact[i]}
                                    onChange={x => toggle(setProtFact, x)}
                                    idx={i} color="emerald" weightNum={settings.protectiveWeight}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── RESULTS ── */}
                    <div className={`${activeTab!=='results'?'hidden':'block'} space-y-6 pb-16`}>

                        {/* ── Hero verdict ── */}
                        <div className="cambra-fade-in">
                            <div className={`relative rounded-3xl overflow-hidden border-2 border-slate-900 shadow-[6px_6px_0px_rgba(15,23,42,0.8)] ${CatColors[results.finalCat]}`}>
                                {/* Texture */}
                                <div className="absolute inset-0 opacity-[0.07]"
                                    style={{backgroundImage:'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)',backgroundSize:'14px 14px'}}/>
                                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                    {/* Left: verdict */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"/>
                                            <span className={`text-[9px] font-black uppercase tracking-[0.25em] ${CatTextColors[results.finalCat]} opacity-70`}>
                                                {isRtl?'نتیجه تحلیل':'ASSESSMENT VERDICT'}
                                            </span>
                                        </div>
                                        <h2 className={`text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none ${CatTextColors[results.finalCat]}`}>
                                            {t[results.finalCat]}
                                        </h2>
                                        {/* Overrides */}
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {results.dOverride && (
                                                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 flex items-center gap-1">
                                                    <ArrowUpRight className="w-3 h-3"/>{t.diseaseOverride}
                                                </span>
                                            )}
                                            {results.eOverride && (
                                                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 flex items-center gap-1">
                                                    <Droplets className="w-3 h-3"/>{t.extremeOverride}
                                                </span>
                                            )}
                                            {results.orthoOverride && (
                                                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 flex items-center gap-1">
                                                    <Activity className="w-3 h-3"/>{t.orthoOverride}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Right: score + stats */}
                                    <div className="flex flex-col gap-3 sm:items-end w-full sm:w-auto">
                                        {/* Net score */}
                                        <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 text-center min-w-[120px]" dir="ltr">
                                            <div className={`text-4xl font-black font-mono leading-none ${CatTextColors[results.finalCat]}`}>
                                                {results.score > 0 ? '+' : ''}{toFa(results.score, lang)}
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">{t.totalScore}</div>
                                        </div>
                                        {/* Mini bars */}
                                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10 w-full sm:w-48 space-y-2">
                                            {[
                                                {label:isRtl?'بیماری':'Disease', val:results.dScore, max:settings.diseaseCount*settings.diseaseWeight, c:'bg-red-400'},
                                                {label:isRtl?'خطر':'Risk',     val:results.rScore, max:settings.riskCount*settings.riskWeight,   c:'bg-amber-400'},
                                                {label:isRtl?'محافظت':'Protect', val:results.pScore, max:settings.protectiveCount*settings.protectiveWeight, c:'bg-emerald-400'},
                                            ].map(b => (
                                                <div key={b.label}>
                                                    <div className="flex justify-between text-[9px] text-white/60 font-bold mb-0.5">
                                                        <span>{b.label}</span>
                                                        <span dir="ltr">{b.val}</span>
                                                    </div>
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${b.c}`}
                                                            style={{width:`${Math.min(100,b.val/b.max*100)}%`}}/>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Date */}
                                        {patient.date && (
                                            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-semibold" dir={isRtl?'rtl':'ltr'}>
                                                <Calendar className="w-3 h-3"/>
                                                {(()=>{const[y,m,d]=patient.date.split('-').map(Number);return isRtl?`${toFa(d,'fa')} ${JM[m-1]} ${toFa(y,'fa')}`:`${GM[m-1]} ${d}, ${y}`;})()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Salivation strip */}
                                {results.hasHyposalivation && (
                                    <div className="border-t border-white/20 bg-black/30 px-6 py-2.5 flex items-center gap-2.5">
                                        <Droplets className="w-4 h-4 text-red-300 flex-shrink-0"/>
                                        <span className="text-red-200 text-xs font-bold">
                                            {isRtl ? 'هشدار: هیپوسالیواسیون — جریان بزاق کاهش‌یافته' : 'Alert: Hyposalivation detected — reduced salivary flow'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Draggable result cards ── */}
                        <div className="cambra-fade-in cambra-stagger-1">
                            <DraggableCards
                                cards={resultCards}
                                renderCard={(st, idx) => (
                                    <div className={`cambra-fade-in cambra-stagger-${idx+1} h-full`}>
                                        <ResultCard st={st} lang={lang} t={t}/>
                                    </div>
                                )}
                            />
                        </div>

                        {/* ── Reference tables: ICDAS + Proximal combined ── */}
                        <div className="cambra-fade-in cambra-stagger-2">
                            <div className="flex items-center gap-2 px-1 mb-3">
                                <Layers className="w-4 h-4 text-slate-500"/>
                                <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">{isRtl?'جداول مرجع بالینی':'Clinical Reference Tables'}</h3>
                                <div className="flex-1 h-px bg-slate-200"/>
                            </div>
                            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                    {/* ICDAS */}
                                    <div>
                                        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
                                            <span className="font-black text-white text-xs tracking-widest uppercase">ICDAS</span>
                                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{isRtl?'اکلوزال':'Occlusal'}</span>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {[
                                                ['0', isRtl?'سالم':'Sound',             isRtl?'پیشگیری':'Prevent'],
                                                ['1', isRtl?'تغییر مینا':'Enamel change',    isRtl?'ریمینرال':'Remineralise'],
                                                ['2', isRtl?'ضایعه مینا':'Enamel lesion',    isRtl?'فلوراید':'Fluoride'],
                                                ['3', isRtl?'میکروکاویتی':'Microcavity',    isRtl?'ریستوریشن':'Restore'],
                                                ['4', isRtl?'سایه عاج':'Dentin shadow',     isRtl?'ترمیم':'Restore'],
                                                ['5', isRtl?'حفره عاج':'Dentin cavity',     isRtl?'ترمیم فوری':'Urgent Rx'],
                                                ['6', isRtl?'ضایعه وسیع':'Extensive',        isRtl?'اورژانس':'Emergency'],
                                            ].map(([code, desc, tx]) => (
                                                <div key={code} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors">
                                                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[11px] font-mono flex-shrink-0">
                                                        {toFa(code, lang)}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-slate-700">{desc}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-end">{tx}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Proximal */}
                                    <div>
                                        <div className="bg-indigo-600 px-4 py-2.5 flex items-center justify-between">
                                            <span className="font-black text-white text-xs tracking-widest uppercase">{isRtl?'پروگزیمال':'Proximal C'}</span>
                                            <span className="text-indigo-200 text-[9px] font-bold uppercase tracking-wider">{isRtl?'رادیوگرافی':'Radiographic'}</span>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {[
                                                ['C1', isRtl?'نیمه خارجی مینا':'Outer ½ enamel',    isRtl?'ریمینرال':'Remineralise'],
                                                ['C2', isRtl?'نیمه داخلی مینا':'Inner ½ enamel',    isRtl?'فلوراید':'Fluoride'],
                                                ['C3', isRtl?'خارجی عاج':'Outer dentin',             isRtl?'ترمیم':'Restore'],
                                                ['C4', isRtl?'میانی/داخلی عاج':'Mid/inner dentin',   isRtl?'ترمیم فوری':'Urgent Rx'],
                                            ].map(([code, desc, tx]) => (
                                                <div key={code} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                                                    <span className="h-7 px-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                                                        {code}
                                                    </span>
                                                    <span className="text-sm font-semibold text-slate-700">{desc}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-end">{tx}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Plan ── */}
                        <div className="cambra-fade-in cambra-stagger-3 space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <ClipboardCheck className="w-4 h-4 text-slate-500"/>
                                <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">{isRtl?'برنامه درمانی':'Action Plan'}</h3>
                                <div className="flex-1 h-px bg-slate-200"/>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider
                                    ${results.finalCat==='lowRisk'?'bg-emerald-100 text-emerald-700':
                                      results.finalCat==='moderateRisk'?'bg-amber-100 text-amber-700':
                                      results.finalCat==='highRisk'?'bg-red-100 text-red-700':
                                      'bg-slate-900 text-white'}`}>
                                    {t[results.finalCat]}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Diagnostics */}
                                <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 border-b-2 border-slate-100 p-3.5 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500"/>
                                        <span className="font-black text-[11px] text-slate-600 uppercase tracking-wider">{t.recDiagnostics}</span>
                                    </div>
                                    <div className="p-4">
                                        <div dangerouslySetInnerHTML={{__html:t[RecMap[results.finalCat].d]}}
                                            className="text-sm text-slate-700 leading-relaxed [&_ul]:space-y-2.5 [&_li]:text-sm [&_li]:leading-relaxed"/>
                                    </div>
                                </div>
                                {/* Interventions */}
                                <div className="bg-slate-900 rounded-3xl border-2 border-slate-900 overflow-hidden">
                                    <div className="border-b border-slate-700/50 p-3.5 flex items-center justify-between">
                                        <span className="font-black text-[11px] text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                            <Zap className="w-3.5 h-3.5"/>{t.recInterventions}
                                        </span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                                    </div>
                                    <div className="p-4">
                                        <div dangerouslySetInnerHTML={{__html:t[RecMap[results.finalCat].i]}}
                                            className="text-sm text-slate-300 leading-relaxed [&_ul]:space-y-2.5 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-slate-300"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action buttons ── */}
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onClick={() => setShowPdf(true)}
                                className="group relative cursor-pointer active:scale-95 transition-transform w-full sm:w-auto">
                                <div className="absolute inset-0 bg-slate-600 rounded-2xl translate-y-1"/>
                                <div className="relative bg-slate-700 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 group-hover:translate-y-0.5 transition-transform">
                                    <Download className="w-4 h-4"/>{isRtl?'ذخیره PDF':'Export PDF'}
                                </div>
                            </button>
                            <button onClick={submit} disabled={isSubmitting}
                                className="group relative cursor-pointer active:scale-95 transition-transform disabled:opacity-50 w-full sm:w-auto">
                                <div className="absolute inset-0 bg-indigo-800 rounded-2xl translate-y-1"/>
                                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 group-hover:translate-y-0.5 transition-transform shadow-lg shadow-indigo-200/20">
                                    {isSubmitting ? <Activity className="animate-spin w-4 h-4"/> : <ClipboardCheck className="w-4 h-4"/>}
                                    {isSubmitting ? (isRtl?'در حال ثبت...':'Saving...') : (isRtl?'ثبت و پایان':'Finish & Log')}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── NAV ── */}
            {!isW && (
                <nav className="fixed bottom-2.5 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-xl z-40 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-xl border-2 border-slate-900 rounded-2xl px-1.5 py-1 flex items-center justify-between gap-1 pointer-events-auto shadow-[3px_3px_0px_#0f172a]">
                        <button
                            disabled={tabOrder.indexOf(activeTab) <= 1}
                            onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab)-1])}
                            className={`flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center disabled:opacity-20 cursor-pointer active:scale-90 transition-all ${tabOrder.indexOf(activeTab)<=1?'invisible':''}`}>
                            <ChevronLeft className={`w-4 h-4 text-slate-800 ${isRtl?'scale-x-[-1]':''}`} strokeWidth={3}/>
                        </button>
                        <div className="hidden sm:flex flex-1 justify-center gap-1.5">
                            {tabOrder.filter(t => t!=='welcome').map((tab, idx) => {
                                const ci = tabOrder.indexOf(activeTab)-1;
                                return (
                                    <div key={tab} className={`transition-all duration-400 rounded-full border-2 border-slate-900
                                        ${idx===ci?'w-5 h-2 bg-slate-900':idx<ci?'w-2 h-2 bg-slate-600':'w-2 h-2 bg-slate-200'}`}/>
                                );
                            })}
                        </div>
                        <div className="flex sm:hidden flex-1 justify-center">
                            <span className="font-black font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]" dir="ltr">
                                {toFa(tabOrder.indexOf(activeTab),lang)}/{toFa(tabOrder.length-1,lang)}
                            </span>
                        </div>
                        <button
                            disabled={tabOrder.indexOf(activeTab)===tabOrder.length-1 || !isValid(activeTab)}
                            onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab)+1])}
                            className={`flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center disabled:opacity-20 cursor-pointer active:scale-90 transition-all ${tabOrder.indexOf(activeTab)===tabOrder.length-1?'invisible':''}`}>
                            <ChevronRight className={`w-4 h-4 text-slate-800 ${isRtl?'scale-x-[-1]':''}`} strokeWidth={3}/>
                        </button>
                    </div>
                </nav>
            )}

            {/* ── PDF MODAL ── */}
            <PdfModal
                open={showPdf} onClose={() => setShowPdf(false)}
                lang={lang} patient={patient} results={results}
                config={config} diseaseInd={diseaseInd} riskFact={riskFact} protFact={protFact}
            />

            {/* ── ALERT ── */}
            {appAlert.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="cambra-scale-in bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center rounded-3xl">
                        <div className="mb-4">
                            {appAlert.type==='success'
                                ? <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500"><Check className="w-7 h-7" strokeWidth={4}/></div>
                                : <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-500"><AlertCircle className="w-7 h-7" strokeWidth={4}/></div>
                            }
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest mb-3">
                            {appAlert.type==='success'?(isRtl?'موفقیت':'Success'):(isRtl?'خطا':'Error')}
                        </h3>
                        <p className="text-slate-600 font-semibold mb-5">{appAlert.message}</p>
                        <button
                            onClick={() => { if(appAlert.onClose) appAlert.onClose(); setAppAlert(a=>({...a,show:false,onClose:null})); }}
                            className="w-full py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 cursor-pointer active:scale-95 transition-all">
                            {isRtl?'باشه':'OK'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

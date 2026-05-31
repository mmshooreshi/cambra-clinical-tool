import React, { useState, useMemo } from 'react';
import { 
  Globe, Info, Settings, Download, FileJson, Printer, 
  AlertTriangle, ShieldCheck, Activity, User, Check,
  ChevronRight, ChevronLeft, Bot, Sparkles, Mic, 
  Settings2, ActivitySquare, ShieldAlert, Save, Play, CloudUpload, Loader
} from 'lucide-react';

const DICT = {
  en: {
    title: "CAMBRA Clinical Tool",
    subtitle: "Advanced Assessment Engine",
    tabPatient: "Patient",
    tabDisease: "Disease & Risk",
    tabProtective: "Protective",
    tabResults: "Math & Results",
    patientInfo: "Patient Profile",
    patientName: "Name",
    chartNo: "Chart ID",
    date: "Date",
    assessmentType: "Type",
    baseline: "Baseline",
    recall: "Recall",
    controls: "Controls",
    language: "Fa/En",
    adminMode: "Super Admin",
    exportJson: "JSON",
    exportCsv: "CSV",
    print: "Print",
    thresholds: "Admin Bounds",
    lowMaxLimit: "Low Bound",
    modMaxLimit: "Mod Bound",
    weightConfig: "Weight Config",
    saveVersion: "Save Version",
    diseaseIndicators: "Disease Indicators",
    diseaseIndSubtitle: "Forces High Risk override.",
    di_1: "Visible cavities / dentin radiolucency",
    di_1_hint: "Cavitation requires operative intervention.",
    di_2: "Radiographic approximal enamel lesions",
    di_2_hint: "Enamel demineralization.",
    di_3: "White spots on smooth surfaces",
    di_3_hint: "Active subsurface porosity.",
    di_4: "Restorations in the last 3 years",
    di_4_hint: "Historical predictor of activity.",
    riskFactors: "Risk Factors",
    riskFactSubtitle: "Biological predispositions.",
    rf_1: "MS and LB medium/high",
    rf_1_hint: "High pathogen titers.",
    rf_2: "Visible heavy plaque on teeth",
    rf_2_hint: "Biofilm blocks buffering.",
    rf_3: "Frequent snack (>3x daily)",
    rf_3_hint: "Prolongs low oral pH.",
    rf_4: "Deep pits and fissures",
    rf_4_hint: "Anatomical retentive areas.",
    rf_5: "Recreational drug use",
    rf_5_hint: "Depresses salivary flow.",
    rf_6: "Inadequate saliva flow",
    rf_6_hint: "Loss of mechanical washing.",
    rf_7: "Saliva reducing factors",
    rf_7_hint: "Damage to acinar cells.",
    rf_8: "Exposed roots",
    rf_8_hint: "Critical pH is ~6.2-6.7.",
    rf_9: "Orthodontic appliances",
    rf_9_hint: "Plaque-retentive networks.",
    protectiveFactors: "Protective Factors",
    protFactSubtitle: "Therapeutic interventions.",
    pf_1: "Fluoridated community",
    pf_1_hint: "Ambient fluoride.",
    pf_2: "Fluoride toothpaste 1x daily",
    pf_2_hint: "Topical fluoride.",
    pf_3: "Fluoride toothpaste 2x+ daily",
    pf_3_hint: "Increases F reservoirs.",
    pf_4: "Fluoride mouthrinse daily",
    pf_4_hint: "Targeted exposure.",
    pf_5: "5,000 ppm F toothpaste daily",
    pf_5_hint: "Robust calcium fluoride.",
    pf_6: "Fluoride varnish (6 mo)",
    pf_6_hint: "High-dose slow release.",
    pf_7: "Office F topical (6 mo)",
    pf_7_hint: "Professional application.",
    pf_8: "Chlorhexidine 1 week/mo",
    pf_8_hint: "Disrupts biofilm.",
    pf_9: "Xylitol gum 4x daily",
    pf_9_hint: "Starves S. mutans.",
    pf_10: "Calcium/phosphate paste",
    pf_10_hint: "Enamel repair (CPP-ACP).",
    pf_11: "Adequate stimulated saliva",
    pf_11_hint: "Rapid clearance.",
    clinicalJudgment: "Modifiers",
    severeHypofunction: "Severe Hypofunction",
    severeHypoDesc: "Upgrades High to Extreme.",
    results: "Final Assessment",
    totalScore: "Net Score",
    riskCategory: "Assigned Category",
    extremeRisk: "EXTREME",
    highRisk: "HIGH",
    moderateRisk: "MODERATE",
    lowRisk: "LOW",
    mathBreakdown: "Math & Balance Engine",
    balanceBeam: "Caries Balance Visualization",
    diseaseOverride: "Pathology Override",
    extremeOverride: "Modifier: Hypofunction",
    aiAgent: "AI Assistant",
    aiStart: "Auto-Fill via Voice/Chat",
    aiStop: "Stop Agent",
    submitData: "Save to Database",
    submitting: "Saving...",
    submitSuccess: "Saved Successfully!"
  },
  fa: {
    title: "ابزار هوشمند و ادمین CAMBRA",
    subtitle: "موتور پیشرفته ارزیابی",
    tabPatient: "بیمار",
    tabDisease: "بیماری/خطر",
    tabProtective: "محافظتی",
    tabResults: "ریاضی و نتایج",
    patientInfo: "پروفایل بیمار",
    patientName: "نام",
    chartNo: "شماره پرونده",
    date: "تاریخ",
    assessmentType: "نوع ویزیت",
    baseline: "اولیه",
    recall: "دوره‌ای",
    controls: "کنترل‌ها",
    language: "En/Fa",
    adminMode: "ادمین ویژه",
    exportJson: "JSON",
    exportCsv: "CSV",
    print: "چاپ",
    thresholds: "آستانه‌های ادمین",
    lowMaxLimit: "حد کم‌خطر",
    modMaxLimit: "حد متوسط",
    weightConfig: "تنظیم وزن",
    saveVersion: "ذخیره تنظیمات",
    diseaseIndicators: "اندیکاتورهای بیماری",
    diseaseIndSubtitle: "اجبار به دسته پرخطر.",
    di_1: "حفره واضح یا نفوذ در عاج",
    di_1_hint: "نیاز به مداخله ترمیمی.",
    di_2: "ضایعات پروگزیمال مینایی",
    di_2_hint: "دمینرالیزاسیون مینا.",
    di_3: "نقاط سفید روی سطوح صاف",
    di_3_hint: "تخلخل فعال.",
    di_4: "ترمیم در ۳ سال اخیر",
    di_4_hint: "نشانگر فعالیت اخیر.",
    riskFactors: "فاکتورهای خطر",
    riskFactSubtitle: "استعداد بیولوژیک.",
    rf_1: "باکتری‌های SM و LB متوسط/زیاد",
    rf_1_hint: "تیتر بالای پاتوژن.",
    rf_2: "پلاک شدید و قابل مشاهده",
    rf_2_hint: "انسداد بزاق.",
    rf_3: "میان‌وعده قندی (>۳ بار)",
    rf_3_hint: "طولانی شدن افت pH.",
    rf_4: "پیت و فیشورهای عمیق",
    rf_4_hint: "نواحی گیردار.",
    rf_5: "مصرف مواد مخدر تفریحی",
    rf_5_hint: "کاهش جریان بزاق.",
    rf_6: "کاهش جریان بزاق",
    rf_6_hint: "از دست دادن شستشو.",
    rf_7: "عوامل کاهنده بزاق",
    rf_7_hint: "آسیب سلول‌های ترشحی.",
    rf_8: "ریشه‌های در معرض دید",
    rf_8_hint: "مستعد تخریب اسیدی.",
    rf_9: "اپلاینس‌های ارتودنسی",
    rf_9_hint: "شبکه‌های گیردار پلاک.",
    protectiveFactors: "فاکتورهای محافظتی",
    protFactSubtitle: "مداخلات درمانی.",
    pf_1: "آب فلورایده محیطی",
    pf_1_hint: "حفظ سطح فلوراید.",
    pf_2: "خمیردندان فلورایددار ۱بار",
    pf_2_hint: "تامین فلوراید موضعی.",
    pf_3: "خمیردندان فلورایددار ۲بار+",
    pf_3_hint: "افزایش مخازن فلوراید.",
    pf_4: "دهانشویه فلوراید روزانه",
    pf_4_hint: "مفید در افت بزاق.",
    pf_5: "خمیردندان 5000ppm روزانه",
    pf_5_hint: "مخازن قوی کلسیم فلوراید.",
    pf_6: "وارنیش فلوراید (۶ ماه)",
    pf_6_hint: "آزادسازی آهسته.",
    pf_7: "فلوراید موضعی مطب (۶ ماه)",
    pf_7_hint: "کاربرد حرفه‌ای.",
    pf_8: "کلرهگزیدین ۱هفته در ماه",
    pf_8_hint: "اختلال در بیوفیلم.",
    pf_9: "آدامس زایلیتول ۴بار در روز",
    pf_9_hint: "کاهش استرپتوکوک موتانس.",
    pf_10: "خمیر کلسیم/فسفات",
    pf_10_hint: "ترمیم مینا.",
    pf_11: "جریان بزاق تحریکی کافی",
    pf_11_hint: "بافرینگ اسیدها.",
    clinicalJudgment: "تعدیل‌کننده‌ها",
    severeHypofunction: "هایپوفانکشن شدید غددی",
    severeHypoDesc: "ارتقا به خطر بسیار شدید.",
    results: "ارزیابی نهایی",
    totalScore: "نمره خالص",
    riskCategory: "دسته خطر",
    extremeRisk: "بسیار شدید",
    highRisk: "پرخطر",
    moderateRisk: "متوسط",
    lowRisk: "کم‌خطر",
    mathBreakdown: "موتور ریاضی و تعادل",
    balanceBeam: "تجسم تعادل پوسیدگی",
    diseaseOverride: "نقض قانون: پاتولوژی",
    extremeOverride: "تعدیل: زروستومیا",
    aiAgent: "دستیار هوشمند",
    aiStart: "تکمیل خودکار صوتی/چت",
    aiStop: "توقف دستیار",
    submitData: "ارسال به دیتابیس",
    submitting: "در حال ارسال...",
    submitSuccess: "با موفقیت ذخیره شد!"
  }
};

const sketchyBox = {
  borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
  border: 'solid 3px'
};
const sketchyHighlight = {
  borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px',
  padding: '0.1rem 0.4rem',
  margin: '0 0.2rem'
};
const aiBubble = {
  borderRadius: '255px 255px 15px 255px/255px 255px 15px 255px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};
const balancePivot = {
  clipPath: 'polygon(50% 0, 100% 100%, 0 100%)'
};

const Tag = ({ children, color }) => {
  const map = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    fuchsia: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300"
  };
  return (
    <span className={`px-2 py-0.5 border rounded-sm text-xs font-extrabold uppercase tracking-widest ${Reflect.get(map, color)}`}>
      {children}
    </span>
  );
};

export default function CambraApp() {
  const langTuple = useState('en'); const lang = langTuple.at(0); const setLang = langTuple.at(1);
  const adminTuple = useState(false); const isAdmin = adminTuple.at(0); const setAdmin = adminTuple.at(1);
  const tabTuple = useState('patient'); const activeTab = tabTuple.at(0); const setActiveTab = tabTuple.at(1);
  
  // AI Agent States
  const aiStateTuple = useState(false); const isAiActive = aiStateTuple.at(0); const setAiActive = aiStateTuple.at(1);
  const aiMsgTuple = useState(''); const aiMessage = aiMsgTuple.at(0); const setAiMessage = aiMsgTuple.at(1);
  const aiPulseTuple = useState(false); const aiPulse = aiPulseTuple.at(0); const setAiPulse = aiPulseTuple.at(1);

  // Submission States
  const submitTuple = useState(false); const isSubmitting = submitTuple.at(0); const setIsSubmitting = submitTuple.at(1);
  const successTuple = useState(false); const isSuccess = successTuple.at(0); const setIsSuccess = successTuple.at(1);

  const t = Reflect.get(DICT, lang);
  const isRtl = lang === 'fa';

  const patientTuple = useState({
    name: '', chartNo: '', date: new Date().toISOString().split('T').at(0), assessmentType: 'baseline'
  });
  const patient = patientTuple.at(0); const setPatient = patientTuple.at(1);

  // Dynamic Tunable Params (Admin Mode)
  const paramsTuple = useState({ lowMax: -1, modMax: 2, rWeight: 1, pWeight: 1 });
  const params = paramsTuple.at(0); const setParams = paramsTuple.at(1);

  const diseaseTuple = useState(new Array(4).fill(false)); const diseaseInd = diseaseTuple.at(0); const setDiseaseInd = diseaseTuple.at(1);
  const riskTuple = useState(new Array(9).fill(false)); const riskFact = riskTuple.at(0); const setRiskFact = riskTuple.at(1);
  const protTuple = useState(new Array(11).fill(false)); const protFact = protTuple.at(0); const setProtFact = protTuple.at(1);
  const hypoTuple = useState(false); const severeHypo = hypoTuple.at(0); const setSevereHypo = hypoTuple.at(1);

  const calcDeps = Array.of(diseaseInd, riskFact, protFact, severeHypo, params);

  const results = useMemo(() => {
    const rCount = riskFact.filter(Boolean).length;
    const pCount = protFact.filter(Boolean).length;
    
    // Using dynamic weights from admin mode
    const rScore = rCount * params.rWeight;
    const pScore = pCount * params.pWeight;
    const score = rScore - pScore;
    
    const hasDisease = diseaseInd.some(Boolean);
    
    let base = 'lowRisk';
    if (score > params.modMax) base = 'highRisk';
    else if (score > params.lowMax) base = 'moderateRisk';

    let finalCat = base;
    let dOverride = false;
    let eOverride = false;

    if (hasDisease && (base === 'lowRisk' || base === 'moderateRisk')) {
      finalCat = 'highRisk';
      dOverride = true;
    }

    if (finalCat === 'highRisk' && severeHypo) {
      finalCat = 'extremeRisk';
      eOverride = true;
    }

    return { rCount, pCount, rScore, pScore, score, finalCat, dOverride, eOverride };
  }, calcDeps);

  const toggleItem = (setter, idx) => {
    setter(prev => {
      const n = Array.from(prev);
      n.splice(idx, 1, !n.at(idx));
      return n;
    });
  };

  const setParamValue = (key, val) => {
    setParams(prev => {
      const next = Object.assign({}, prev);
      Reflect.set(next, key, val);
      return next;
    });
  };

  const handleExportJSON = () => {
    const data = { patient, thresholds: params, diseaseInd, riskFact, protFact, severeHypo, results };
    const uri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const a = document.createElement('a');
    a.href = uri; a.download = "cambra.json"; a.click();
  };

  const handleServerSubmit = async () => {
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const payload = {
        patient_name: patient.name,
        chart_no: patient.chartNo,
        assessment_type: patient.assessmentType,
        disease_ind: JSON.stringify(diseaseInd),
        risk_fact: JSON.stringify(riskFact),
        prot_fact: JSON.stringify(protFact),
        severe_hypo: String(severeHypo),
        net_score: results.score,
        final_category: results.finalCat
      };

      const response = await fetch("https://attendance.rlh.ir/appliance_survey/api/cambra/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (err) {
      // Intentionally suppressing raw error objects to avoid renderer crashes
      console.error("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAiSequence = () => {
    setAiActive(true);
    setAiPulse(true);
    
    const sequence = Array.of(
      { m: 'Initializing voice processing...', t: 1000 },
      { m: 'Switching to Profile Tab...', tab: 'patient', t: 1500 },
      { m: 'Extracting data: "Patient John, baseline"...', action: () => setPatient(Object.assign({}, patient, { name: 'John Doe', assessmentType: 'baseline' })), t: 2500 },
      { m: 'Analyzing Disease & Risk factors...', tab: 'disease', t: 1500 },
      { m: 'Detected: Frequent snacks & Plaque...', action: () => {
          const nr = Array.from(riskFact);
          nr.splice(1, 1, true); nr.splice(2, 1, true);
          setRiskFact(nr);
        }, t: 2500 },
      { m: 'Checking Protective factors...', tab: 'protective', t: 1500 },
      { m: 'Detected: F toothpaste 2x/day...', action: () => {
          const np = Array.from(protFact);
          np.splice(2, 1, true);
          setProtFact(np);
        }, t: 2500 },
      { m: 'Calculating final Math & Balance...', tab: 'results', t: 1500 },
      { m: 'Done. Result is MODERATE RISK.', t: 2000, end: true }
    );

    let currentDelay = 0;
    sequence.forEach((step) => {
      currentDelay += step.t;
      setTimeout(() => {
        setAiMessage(step.m);
        if (step.tab) setActiveTab(step.tab);
        if (step.action) step.action();
        if (step.end) setAiPulse(false);
      }, currentDelay);
    });
  };

  const tabs = Array.of(
    { id: 'patient', icon: User, label: t.tabPatient },
    { id: 'disease', icon: ShieldAlert, label: t.tabDisease },
    { id: 'protective', icon: ShieldCheck, label: t.tabProtective },
    { id: 'results', icon: ActivitySquare, label: t.tabResults }
  );

  const CatColors = {
    extremeRisk: 'bg-red-900 text-white border-red-950',
    highRisk: 'bg-red-600 text-white border-red-700',
    moderateRisk: 'bg-amber-500 text-amber-950 border-amber-600',
    lowRisk: 'bg-emerald-500 text-white border-emerald-600'
  };

  const balanceTilt = Math.max(Math.min((results.rScore - results.pScore) * 6, 35), -35);

  const DenseToggle = ({ label, hint, checked, onChange, idx, color, weightKey }) => {
    const openTuple = useState(false); const isOpen = openTuple.at(0); const setOpen = openTuple.at(1);
    const colors = {
      red: checked ? "bg-red-500 border-red-500" : "bg-slate-200 border-slate-300",
      amber: checked ? "bg-amber-500 border-amber-500" : "bg-slate-200 border-slate-300",
      emerald: checked ? "bg-emerald-500 border-emerald-500" : "bg-slate-200 border-slate-300"
    };

    return (
      <div className={`flex flex-col py-3 px-4 border-b border-slate-200 transition-all ${checked ? 'bg-slate-50' : 'bg-white'}`}>
        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-4 flex-1 cursor-pointer">
            <div className={`relative inline-flex flex-shrink-0 items-center rounded-full border-2 transition-colors duration-200 ${Reflect.get(colors, color)}`} style={{ height: '24px', width: '44px' }}>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => onChange(idx)} />
              <span className={`inline-block transform rounded-full bg-white transition duration-200 shadow-sm`} style={{ height: '16px', width: '16px', transform: checked ? (isRtl ? 'translateX(-20px)' : 'translateX(20px)') : 'translateX(2px)' }} />
            </div>
            <span className={`text-sm md:text-base font-bold leading-snug ${checked ? 'text-slate-900' : 'text-slate-600'}`}>
              {label}
            </span>
          </label>
          <div className="flex items-center gap-2">
            {isAdmin && weightKey && (
               <input 
                 type="number" 
                 value={Reflect.get(params, weightKey)} 
                 onChange={e => setParamValue(weightKey, parseInt(e.target.value))}
                 className="w-12 text-center text-xs font-black bg-fuchsia-50 text-fuchsia-900 outline-none"
                 style={Object.assign({}, sketchyHighlight, { border: '1px solid #d946ef' })}
               />
            )}
            <button onClick={() => setOpen(!isOpen)} className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="mt-3 ms-14 text-sm text-slate-600 border-s-4 border-indigo-200 ps-4 py-1 font-medium bg-slate-50/50">
            {hint}
          </div>
        )}
      </div>
    );
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={`flex flex-col h-screen bg-slate-100 text-slate-900  ${isRtl ? 'font-arabic' : ''}`}>
      
      {/* HEADER */}
      <header className="flex-none bg-slate-900 text-slate-100 border-b-4 border-slate-800 px-4 py-3 flex items-center justify-between z-10 sticky top-0 print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white p-1.5 rounded-lg shadow-inner border border-white/20">
            <Activity className="w-6 h-6" />
          </div>
          <div className="leading-none">
            <div className="font-black text-lg text-white tracking-wide text-left">{t.title}</div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{t.subtitle}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'fa' : 'en')} className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"><Globe className="w-4 h-4"/> {t.language}</button>
          <button onClick={() => setAdmin(!isAdmin)} className={`p-2 rounded text-xs font-black flex items-center gap-1.5 transition-all ${isAdmin ? 'bg-fuchsia-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Settings2 className="w-4 h-4"/> {t.adminMode}</button>
        </div>
      </header>

      {/* AI AGENT OVERLAY */}
      {isAiActive && (
        <div className={`fixed z-50 transition-all duration-500 flex items-end gap-3 ${isRtl ? 'bottom-24 left-4' : 'bottom-24 right-4'}`}>
          <div className="bg-white border-2 border-indigo-200 p-3 px-5 text-sm font-bold text-indigo-900" style={aiBubble}>
             {aiMessage || "Waiting for signal..."}
          </div>
          <div className="relative">
             {aiPulse && <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>}
             <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-full shadow-2xl border-4 border-white text-white flex items-center justify-center">
               <Bot className="w-8 h-8" />
             </div>
          </div>
        </div>
      )}

      {/* ADMIN FLOATING PANEL */}
      {isAdmin && (
        <div className="flex-none bg-fuchsia-900 text-fuchsia-100 p-4 shadow-inner border-b-4 border-fuchsia-950 print:hidden">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
             <div className="flex items-center gap-2 font-black text-lg text-fuchsia-300">
               <Settings2 className="w-6 h-6 animate-spin-slow"/> 
               <span style={Object.assign({}, sketchyHighlight, { backgroundColor: '#86198f', color: 'white' })}>SUPER ADMIN ACTIVE</span>
             </div>
             
             <div className="flex flex-wrap gap-4 items-center bg-fuchsia-950 p-3" style={Object.assign({}, sketchyBox, { borderColor: '#d946ef' })}>
               <div className="flex items-center gap-2">
                 <label className="text-xs font-bold uppercase">{t.lowMaxLimit}:</label>
                 <input type="number" value={params.lowMax} onChange={e => setParamValue('lowMax', parseInt(e.target.value))} className="w-14 bg-fuchsia-100 text-fuchsia-900 font-black text-center p-1 rounded outline-none" />
               </div>
               <div className="flex items-center gap-2">
                 <label className="text-xs font-bold uppercase">{t.modMaxLimit}:</label>
                 <input type="number" value={params.modMax} onChange={e => setParamValue('modMax', parseInt(e.target.value))} className="w-14 bg-fuchsia-100 text-fuchsia-900 font-black text-center p-1 rounded outline-none" />
               </div>
               <div className="w-px h-6 bg-fuchsia-700"></div>
               <button className="flex items-center gap-1.5 text-xs font-bold bg-fuchsia-700 hover:bg-fuchsia-600 px-3 py-1.5 rounded transition-colors"><Save className="w-4 h-4"/> {t.saveVersion}</button>
             </div>
           </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex-none bg-white border-b-2 border-slate-200 overflow-x-auto hide-scrollbar print:hidden shadow-sm z-10">
        <div className="flex max-w-4xl mx-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 flex-1 min-w-max px-4 py-4 text-sm font-black border-b-4 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 print:p-0 bg-slate-100 mb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* TAB: PATIENT */}
          <div className={`${activeTab !== 'patient' ? 'hidden print:block' : ''} space-y-6`}>
            
            {/* AI Call to Action */}
            {!isAiActive && (
              <button onClick={runAiSequence} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between group transition-all hover:scale-105 print:hidden" style={{ borderWidth: '4px', borderColor: '#312e81' }}>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full group-hover:animate-spin">
                    <Sparkles className="w-8 h-8 text-indigo-100" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-black text-2xl tracking-wide">{t.aiAgent}</h2>
                    <p className="font-bold text-indigo-200 mt-1 flex items-center gap-2"><Mic className="w-4 h-4"/> {t.aiStart}</p>
                  </div>
                </div>
                <Play className="w-10 h-10 text-indigo-200 group-hover:text-white" />
              </button>
            )}

            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
              <div className="bg-slate-800 text-white px-5 py-3 border-b-4 border-slate-900 flex items-center gap-2 font-black text-sm uppercase tracking-widest"><User className="w-5 h-5"/> {t.patientInfo}</div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">{t.patientName}</label>
                  <input type="text" value={patient.name} onChange={e => setPatient(Object.assign({}, patient, {name: e.target.value}))} className="w-full text-base font-bold p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">{t.chartNo}</label>
                  <input type="text" value={patient.chartNo} onChange={e => setPatient(Object.assign({}, patient, {chartNo: e.target.value}))} className="w-full text-base font-bold p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">{t.date}</label>
                  <input type="date" value={patient.date} onChange={e => setPatient(Object.assign({}, patient, {date: e.target.value}))} className="w-full text-base font-bold p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase">{t.assessmentType}</label>
                  <select value={patient.assessmentType} onChange={e => setPatient(Object.assign({}, patient, {assessmentType: e.target.value}))} className="w-full text-base font-bold p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 transition-colors">
                    <option value="baseline">{t.baseline}</option>
                    <option value="recall">{t.recall}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* TAB: DISEASE & RISK */}
          <div className={`${activeTab !== 'disease' ? 'hidden print:block' : ''} space-y-6`}>
            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
               <div className="bg-red-700 text-white border-b-4 border-red-900 px-5 py-3 flex items-center justify-between">
                 <div className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {t.diseaseIndicators}</div>
                 {isAdmin && <span className="bg-fuchsia-400 text-fuchsia-950 font-black px-2 py-0.5 text-xs" style={sketchyHighlight}>OVERRIDE TIER</span>}
               </div>
               <div>
                  {Array.of(1,2,3,4).map((num, idx) => (
                    <DenseToggle key={`di_${idx}`} label={Reflect.get(t, `di_${num}`)} hint={Reflect.get(t, `di_${num}_hint`)} checked={diseaseInd.at(idx)} onChange={(i) => toggleItem(setDiseaseInd, i)} idx={idx} color="red"/>
                  ))}
               </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
               <div className="bg-amber-600 text-white border-b-4 border-amber-800 px-5 py-3 flex items-center justify-between">
                 <div className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Activity className="w-5 h-5"/> {t.riskFactors}</div>
                 {isAdmin && <span className="bg-fuchsia-400 text-fuchsia-950 font-black px-2 py-0.5 text-xs" style={sketchyHighlight}>ADD TO SUM</span>}
               </div>
               <div>
                  {Array.of(1,2,3,4,5,6,7,8,9).map((num, idx) => (
                    <DenseToggle key={`rf_${idx}`} label={Reflect.get(t, `rf_${num}`)} hint={Reflect.get(t, `rf_${num}_hint`)} checked={riskFact.at(idx)} onChange={(i) => toggleItem(setRiskFact, i)} idx={idx} color="amber" weightKey="rWeight"/>
                  ))}
               </div>
            </div>
          </div>

          {/* TAB: PROTECTIVE */}
          <div className={`${activeTab !== 'protective' ? 'hidden print:block' : ''} space-y-6`}>
            <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
               <div className="bg-emerald-600 text-white border-b-4 border-emerald-800 px-5 py-3 flex items-center justify-between">
                 <div className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> {t.protectiveFactors}</div>
                 {isAdmin && <span className="bg-fuchsia-400 text-fuchsia-950 font-black px-2 py-0.5 text-xs" style={sketchyHighlight}>SUB FROM SUM</span>}
               </div>
               <div>
                  {Array.of(1,2,3,4,5,6,7,8,9,10,11).map((num, idx) => (
                    <DenseToggle key={`pf_${idx}`} label={Reflect.get(t, `pf_${num}`)} hint={Reflect.get(t, `pf_${num}_hint`)} checked={protFact.at(idx)} onChange={(i) => toggleItem(setProtFact, i)} idx={idx} color="emerald" weightKey="pWeight"/>
                  ))}
               </div>
            </div>

            <div className="bg-slate-800 text-white border-4 border-slate-900 rounded-xl p-5 shadow-lg">
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={severeHypo} onChange={e => setSevereHypo(e.target.checked)} className="w-6 h-6 text-indigo-600 rounded border-slate-500 focus:ring-0" />
                <div>
                  <span className="block text-lg font-black">{t.severeHypofunction}</span>
                  <span className="block text-sm text-slate-400 mt-1 font-bold">{t.severeHypoDesc}</span>
                </div>
              </label>
            </div>
          </div>

          {/* TAB: RESULTS & MATH VISUALIZATION */}
          <div className={`${activeTab !== 'results' ? 'hidden print:block' : ''} space-y-6`}>
            
            {/* Visual Balance Beam */}
            <div className="bg-white rounded-xl border-4 border-slate-800 shadow-2xl p-6 overflow-hidden relative print:hidden">
               <h3 className="font-black text-slate-800 uppercase tracking-widest mb-8 text-center text-lg">{t.balanceBeam}</h3>
               
               <div className="relative mt-12 mb-8 mx-auto" style={{ maxWidth: '400px' }}>
                 {/* The Beam */}
                 <div className="h-4 bg-slate-800 rounded-full relative z-10 transition-transform duration-700 ease-in-out origin-center" style={{ transform: `rotate(${balanceTilt}deg)` }}>
                    {/* Left Weight (Risk) */}
                    <div className="absolute -top-12 -left-4 flex flex-col items-center" style={{ transform: `rotate(${-balanceTilt}deg)` }}>
                      <div className="w-12 h-12 bg-amber-500 rounded border-4 border-slate-800 flex items-center justify-center font-black text-xl shadow-lg">{results.rScore}</div>
                      <div className="w-1 h-8 bg-slate-800"></div>
                    </div>
                    {/* Right Weight (Protective) */}
                    <div className="absolute -top-12 -right-4 flex flex-col items-center" style={{ transform: `rotate(${-balanceTilt}deg)` }}>
                      <div className="w-12 h-12 bg-emerald-500 rounded border-4 border-slate-800 flex items-center justify-center font-black text-xl text-white shadow-lg">{results.pScore}</div>
                      <div className="w-1 h-8 bg-slate-800"></div>
                    </div>
                 </div>
                 {/* Pivot */}
                 <div className="w-12 h-12 bg-slate-800 mx-auto -mt-2 relative z-0" style={balancePivot}></div>
               </div>

               <div className="flex justify-between text-xs font-black uppercase text-slate-500 px-4 mt-4">
                 <span className="text-amber-600">PATHOLOGY</span>
                 <span className="text-emerald-600">PREVENTION</span>
               </div>
            </div>

            {/* Admin Math Inspector */}
            {isAdmin && (
              <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-5 font-mono text-sm text-fuchsia-900 shadow-inner" style={sketchyBox}>
                <div className="font-black text-fuchsia-800 mb-3 uppercase flex items-center gap-2"><Settings2 className="w-5 h-5"/> {t.mathBreakdown}</div>
                <div className="space-y-2 bg-white p-4 rounded border border-fuchsia-200">
                   <div className="flex justify-between items-center"><span className="opacity-75">Risk Factors Sum (Count * W):</span><span className="font-bold text-lg">{results.rCount} * {params.rWeight} = <span className="text-amber-600">+{results.rScore}</span></span></div>
                   <div className="flex justify-between items-center"><span className="opacity-75">Protective Sum (Count * W):</span><span className="font-bold text-lg">{results.pCount} * {params.pWeight} = <span className="text-emerald-600">-{results.pScore}</span></span></div>
                   <div className="w-full h-px bg-fuchsia-200 my-2"></div>
                   <div className="flex justify-between items-center font-black text-xl text-slate-900"><span>NET ALGORITHM SCORE:</span><span>{results.score}</span></div>
                   <div className="flex justify-between items-center mt-2 text-xs opacity-75"><span>Condition:</span><span>Score {'>'} {params.modMax} ? HIGH : (Score {'>'} {params.lowMax} ? MODERATE : LOW)</span></div>
                </div>
              </div>
            )}

            {/* Final Outcome Plate */}
            <div className={`p-8 rounded-2xl text-center shadow-xl flex flex-col items-center justify-center ${Reflect.get(CatColors, results.finalCat)}`} style={{ borderWidth: '6px' }}>
               <div className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">{t.riskCategory}</div>
               <div className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md">{Reflect.get(t, results.finalCat)}</div>
               
               {(results.dOverride || results.eOverride) && (
                 <div className="mt-6 flex flex-col items-center gap-2">
                   {results.dOverride && <span className="text-xs bg-black/30 px-3 py-1.5 rounded-full font-black tracking-wide text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {t.diseaseOverride}</span>}
                   {results.eOverride && <span className="text-xs bg-black/30 px-3 py-1.5 rounded-full font-black tracking-wide text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> {t.extremeOverride}</span>}
                 </div>
               )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="print:hidden pb-10">
              <button 
                onClick={handleServerSubmit} 
                disabled={isSubmitting || isSuccess}
                className={`w-full py-4 px-6 rounded-xl font-black text-lg text-white shadow-xl transition-all flex justify-center items-center gap-3 ${isSuccess ? 'bg-emerald-500' : (isSubmitting ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-2xl')}`}
              >
                {isSubmitting && <Loader className="w-6 h-6 animate-spin" />}
                {isSuccess && <Check className="w-6 h-6" />}
                {!isSubmitting && !isSuccess && <CloudUpload className="w-6 h-6" />}
                
                {isSubmitting ? t.submitting : (isSuccess ? t.submitSuccess : t.submitData)}
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white border-t-4 border-slate-800 p-3 flex items-center justify-between z-40 print:hidden" style={{ boxShadow: '0 -10px 20px rgba(0,0,0,0.2)' }}>
         <div className="flex items-center gap-4 px-2">
           <button onClick={() => setActiveTab('results')} className="flex flex-col text-left">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.totalScore}</span>
             <span className="font-black text-2xl leading-none">{results.score}</span>
           </button>
           <div className="w-px h-8 bg-slate-700"></div>
           <button onClick={() => setActiveTab('results')} className="flex flex-col text-left">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.riskCategory}</span>
             <span className={`font-black text-xl leading-none tracking-tight ${results.finalCat === 'extremeRisk' || results.finalCat === 'highRisk' ? 'text-red-400' : (results.finalCat === 'moderateRisk' ? 'text-amber-400' : 'text-emerald-400')}`}>
               {Reflect.get(t, results.finalCat)}
             </span>
           </button>
         </div>
         <button onClick={() => setActiveTab('results')} className={`px-6 py-3 rounded-lg text-white font-black tracking-wider transition-all shadow-lg ${activeTab === 'results' ? 'bg-indigo-600 opacity-80 cursor-default' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`}>
           {activeTab === 'results' ? <Check className="w-5 h-5"/> : (isRtl ? <ChevronLeft className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>)}
         </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media print {
          body { background: white; height: auto; overflow: visible; }
        }
      `}} />
    </div>
  );
}

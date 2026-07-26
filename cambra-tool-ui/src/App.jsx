import React, { useState, useMemo, useEffect } from 'react';
import {
    Globe, Activity, User, Check, AlertCircle, Shield, PieChart, Save, ChevronLeft, ChevronRight, Zap, Scale, Stethoscope, ShieldCheck, ClipboardCheck, Calendar, ArrowUpRight, Droplets, Info, ChevronDown
} from 'lucide-react';

// Date Picker Imports for Jalali Support
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function CambraApp() {
    const langTuple = useState('fa'); const lang = langTuple.at(0); const setLang = langTuple.at(1);
    const tabTuple = useState('welcome'); const activeTab = tabTuple.at(0); const setActiveTab = tabTuple.at(1);
    const submittingTuple = useState(false); const isSubmitting = submittingTuple.at(0); const setIsSubmitting = submittingTuple.at(1);

    const configTuple = useState(null); const config = configTuple.at(0); const setConfig = configTuple.at(1);

    const patientTuple = useState({
        name: '', chartNo: '', date: new Date().toISOString().split('T').at(0), assessmentType: 'baseline'
    });
    const patient = patientTuple.at(0); const setPatient = patientTuple.at(1);

    const diseaseTuple = useState(new Array(0)); const diseaseInd = diseaseTuple.at(0); const setDiseaseInd = diseaseTuple.at(1);
    const riskTuple = useState(new Array(0)); const riskFact = riskTuple.at(0); const setRiskFact = riskTuple.at(1);
    const protTuple = useState(new Array(0)); const protFact = protTuple.at(0); const setProtFact = protTuple.at(1);

    const modalTuple = useState(null);
    const activeModal = modalTuple.at(0);
    const setActiveModal = modalTuple.at(1);

    const [appAlert, setAppAlert] = useState({ show: false, message: '', type: 'info', onClose: null });

    useEffect(() => {
        fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                const settings = Reflect.get(data, 'settings');
                setDiseaseInd(new Array(Reflect.get(settings, 'diseaseCount')).fill(false));
                setRiskFact(new Array(Reflect.get(settings, 'riskCount')).fill(false));
                setProtFact(new Array(Reflect.get(settings, 'protectiveCount')).fill(false));
            })
            .catch(err => console.error(err));
    }, Array.of());

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    const calcDeps = Array.of(diseaseInd, riskFact, protFact, config);

    const results = useMemo(() => {
        if (!config) return null;
        const settings = Reflect.get(config, 'settings');

        const dCount = diseaseInd.filter(Boolean).length;
        const rCount = riskFact.filter(Boolean).length;
        const pCount = protFact.filter(Boolean).length;

        const dScore = dCount * Reflect.get(settings, 'diseaseWeight');
        const rScore = rCount * Reflect.get(settings, 'riskWeight');
        const pScore = pCount * Reflect.get(settings, 'protectiveWeight');

        const score = (dScore + rScore) - pScore;

        let base = 'lowRisk';
        if (score >= Reflect.get(settings, 'extremeMin')) base = 'extremeRisk';
        else if (score >= Reflect.get(settings, 'modMax') + 1) base = 'highRisk';
        else if (score >= Reflect.get(settings, 'lowMax') + 1) base = 'moderateRisk';
        else base = 'lowRisk';

        let finalCat = base;
        let dOverride = false;
        let eOverride = false;
        let orthoOverride = false;

        if (riskFact.at(7) && base === 'lowRisk') {
            finalCat = 'moderateRisk';
            orthoOverride = true;
        }

        if (dCount > 0 && (finalCat === 'lowRisk' || finalCat === 'moderateRisk')) {
            finalCat = 'highRisk';
            dOverride = true;
            orthoOverride = false;
        }

        const hasHyposalivation = riskFact.at(1) || riskFact.at(4);
        if (finalCat === 'highRisk' && hasHyposalivation) {
            finalCat = 'extremeRisk';
            eOverride = true;
            dOverride = false;
        }

        return { dCount, rCount, pCount, dScore, rScore, pScore, score, finalCat, dOverride, eOverride, orthoOverride, hasHyposalivation };
    }, calcDeps);

    const tabOrder = Array.of('welcome', 'patient', 'disease', 'protective', 'results');

    const isTabValid = (id) => {
        if (id === 'patient') return patient.name.length > 0 && patient.chartNo.length > 0;
        return true; 
    };

    const toggleItem = (setter, idx) => {
        setter(prev => {
            const n = Array.from(prev);
            n.splice(idx, 1, !n.at(idx));
            return n;
        });
    };

    const resetForm = () => {
        setPatient({
            name: '',
            chartNo: '',
            date: new Date().toISOString().split('T').at(0),
            assessmentType: 'baseline'
        });
        const settings = Reflect.get(config, 'settings');
        setDiseaseInd(new Array(Reflect.get(settings, 'diseaseCount')).fill(false));
        setRiskFact(new Array(Reflect.get(settings, 'riskCount')).fill(false));
        setProtFact(new Array(Reflect.get(settings, 'protectiveCount')).fill(false));
        setActiveTab('welcome');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submitToServer = async () => {
        setIsSubmitting(true);
        try {
            const currentDict = Reflect.get(Reflect.get(config, 'dict'), lang);
            const getCheckedLabels = (boolArray, prefix) => {
                const labels = new Array();
                boolArray.forEach((isChecked, idx) => {
                    if (isChecked) {
                        labels.push(Reflect.get(currentDict, prefix + "_" + (idx + 1)));
                    }
                });
                return labels;
            };

            const payload = {
                patient_name: patient.name,
                chart_no: patient.chartNo,
                assessment_type: patient.assessmentType,
                disease_ind: JSON.stringify(getCheckedLabels(diseaseInd, 'di')),
                risk_fact: JSON.stringify(getCheckedLabels(riskFact, 'rf')),
                prot_fact: JSON.stringify(getCheckedLabels(protFact, 'pf')),
                severe_hypo: Reflect.get(results, 'hasHyposalivation').toString(),
                net_score: Reflect.get(results, 'score'),
                final_category: Reflect.get(results, 'finalCat'),
                raw_data: JSON.stringify({ patient, diseaseInd, riskFact, protFact })
            };

            const response = await fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setAppAlert({
                    show: true,
                    message: lang === 'fa' ? 'با موفقیت ثبت شد!' : 'Submitted successfully!',
                    type: 'success',
                    onClose: resetForm
                });
            } else {
                setAppAlert({ show: true, message: lang === 'fa' ? 'خطا در ثبت اطلاعات.' : 'Error submitting data.', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setAppAlert({ show: true, message: lang === 'fa' ? 'اینترنت خود را بررسی کنید.' : 'Check out your internet connection.', type: 'error' });
        }
        setIsSubmitting(false);
    };

    if (!config) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Configuration...</div>;
    }

    const t = Reflect.get(Reflect.get(config, 'dict'), lang);
    const isRtl = lang === 'fa';
    const settings = Reflect.get(config, 'settings');

    const tabs = Array.of(
        { id: 'welcome', icon: Info, label: isRtl ? 'راهنما' : 'Intro' },
        { id: 'patient', icon: User, label: Reflect.get(t, 'tabPatient') },
        { id: 'disease', icon: AlertCircle, label: Reflect.get(t, 'tabDisease') },
        { id: 'protective', icon: Shield, label: Reflect.get(t, 'tabProtective') },
        { id: 'results', icon: PieChart, label: Reflect.get(t, 'tabResults') }
    );

    const CatColors = { extremeRisk: 'bg-red-900 text-red-50 border-red-900', highRisk: 'bg-red-600 text-white border-red-600', moderateRisk: 'bg-amber-500 text-amber-950 border-amber-500', lowRisk: 'bg-emerald-600 text-white border-emerald-600' };
    const RecMap = { lowRisk: { d: 'rec_low_diag', i: 'rec_low_int' }, moderateRisk: { d: 'rec_mod_diag', i: 'rec_mod_int' }, highRisk: { d: 'rec_high_diag', i: 'rec_high_int' }, extremeRisk: { d: 'rec_ext_diag', i: 'rec_ext_int' } };

    const DataRow = ({ label, hint, desc, checked, onChange, idx, color, weightTag }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const activeColor = Reflect.get({ red: "bg-red-600", amber: "bg-amber-500", emerald: "bg-emerald-500" }, color);
        const hoverColor = Reflect.get({ red: "hover:bg-red-50", amber: "hover:bg-amber-50", emerald: "hover:bg-emerald-50" }, color);

        return (
            <div className={`group flex flex-col border-b border-slate-100 transition-colors ${checked ? 'bg-slate-50' : `bg-white ${hoverColor}`}`}>
                <div className="flex items-start justify-between gap-4 py-4 px-5 cursor-pointer" onClick={() => onChange(idx)}>
                    <div className="flex items-start gap-4 flex-1">
                        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checked ? `${activeColor} border-transparent` : 'border-slate-300 bg-white'}`}>
                            <Check className={`w-4 h-4 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-base font-bold leading-tight transition-colors ${checked ? 'text-slate-900' : 'text-slate-700'}`}>
                                {label}
                            </span>
                            <span className="mt-1 text-xs text-slate-500 font-medium">{hint}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        {checked && <span className={`ltr text-xs font-black ${color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>{weightTag}</span>}
                        {desc && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Expanded Description Box */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-4 ms-10">
                        <div className="p-3 bg-slate-100/80 rounded-lg text-sm text-slate-700 font-medium leading-relaxed border border-slate-200">
                            {desc}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className={`min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 print:pb-0 ${isRtl ? 'font-arabic' : ''}`}>

            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 text-white p-2 rounded-lg">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg text-slate-900 leading-tight">{Reflect.get(t, 'title')}</h1>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{Reflect.get(t, 'subtitle')}</span>
                    </div>
                </div>
                <button onClick={() => setLang(lang === 'en' ? 'fa' : 'en')} className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold">
                    {Reflect.get(t, 'language')}
                </button>
            </header>

            {/* TABS (Scrollable on mobile) */}
            <div className="bg-white border-b border-slate-200 overflow-x-auto no-scrollbar">
                <div className="max-w-3xl mx-auto flex min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={Reflect.get(tab, 'id')}
                            onClick={() => setActiveTab(Reflect.get(tab, 'id'))}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === Reflect.get(tab, 'id') ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === Reflect.get(tab, 'id') ? 'text-slate-900' : 'text-slate-400'}`} />
                            {Reflect.get(tab, 'label')}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="max-w-3xl mx-auto p-4 md:p-8">
                <div className="space-y-8">

                    {/* TAB: WELCOME */}
                    <div className={`${activeTab !== 'welcome' ? 'hidden print:block' : ''}`}>
                        <div className="bg-white rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8 md:p-12 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center border-4 border-indigo-600 transform rotate-3">
                                <Stethoscope className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">
                                {isRtl ? 'به دستیار کمبرا خوش آمدید' : 'Welcome to CAMBRA'}
                            </h2>
                            <p className="text-slate-600 font-medium text-lg leading-relaxed max-w-lg">
                                {isRtl 
                                    ? 'این ابزار هوشمند جهت ارزیابی دقیق میزان خطر پوسیدگی دندان (CAMBRA) طراحی شده است. لطفاً اطلاعات بیمار و شاخص‌های بالینی را با دقت وارد نمایید تا پروتکل درمانی و پیشگیرانه اختصاصی تولید گردد.' 
                                    : 'This clinical tool assesses dental caries risk (CAMBRA). Please enter patient details and clinical indicators carefully to generate a customized preventive protocol.'}
                            </p>
                            <button 
                                onClick={() => setActiveTab('patient')}
                                className="mt-4 bg-indigo-600 text-white font-black text-lg px-8 py-3 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                {isRtl ? 'شروع ارزیابی' : 'Start Assessment'}
                            </button>
                        </div>
                    </div>

                    {/* TAB: PATIENT */}
                    <div className={`${activeTab !== 'patient' ? 'hidden print:block' : ''}`}>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{Reflect.get(t, 'patientInfo')}</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="patientName" className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'patientName')}</label>
                                    <input id="patientName" type="text" value={patient.name} onChange={e => setPatient(Object.assign({}, patient, { name: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="chartNo" className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'chartNo')}</label>
                                    <input id="chartNo" type="text" value={patient.chartNo} onChange={e => setPatient(Object.assign({}, patient, { chartNo: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="date" className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'date')}</label>
                                    {isRtl ? (
                                        <DatePicker
                                            value={patient.date}
                                            onChange={(dateObj) => setPatient(Object.assign({}, patient, { date: dateObj ? dateObj.format("YYYY-MM-DD") : "" }))}
                                            calendar={persian}
                                            locale={persian_fa}
                                            inputClass="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500 text-left"
                                            containerClassName="w-full"
                                        />
                                    ) : (
                                        <input id="date" type="date" value={patient.date} onChange={e => setPatient(Object.assign({}, patient, { date: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 select-container">
                                    <label htmlFor="assessmentType" className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'assessmentType')}</label>
                                    <select id="assessmentType" value={patient.assessmentType} onChange={e => setPatient(Object.assign({}, patient, { assessmentType: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500 bg-white">
                                        <option value="baseline">{Reflect.get(t, 'baseline')}</option>
                                        <option value="recall">{Reflect.get(t, 'recall')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB: DISEASE & RISK */}
                    <div className={`${activeTab !== 'disease' ? 'hidden print:block' : ''} space-y-8`}>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{Reflect.get(t, 'diseaseIndicators')}</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-bold">{Reflect.get(t, 'diseaseIndSubtitle')}</p>
                                </div>
                            </div>
                            <div>
                                {Array.from(Object.assign({}, { length: Reflect.get(settings, 'diseaseCount') })).map((_, idx) => (
                                    <DataRow key={`di_${idx}`} label={Reflect.get(t, `di_${idx + 1}`)} hint={Reflect.get(t, `di_${idx + 1}_hint`)} desc={Reflect.get(t, `di_${idx + 1}_desc`)} checked={diseaseInd.at(idx)} onChange={(i) => toggleItem(setDiseaseInd, i)} idx={idx} color="red" weightTag={`+${Reflect.get(settings, 'diseaseWeight')}`} />
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{Reflect.get(t, 'riskFactors')}</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-bold">{Reflect.get(t, 'riskFactSubtitle')}</p>
                                </div>
                            </div>
                            <div>
                                {Array.from(Object.assign({}, { length: Reflect.get(settings, 'riskCount') })).map((_, idx) => (
                                    <DataRow key={`rf_${idx}`} label={Reflect.get(t, `rf_${idx + 1}`)} hint={Reflect.get(t, `rf_${idx + 1}_hint`)} desc={Reflect.get(t, `rf_${idx + 1}_desc`)} checked={riskFact.at(idx)} onChange={(i) => toggleItem(setRiskFact, i)} idx={idx} color="amber" weightTag={`+${Reflect.get(settings, 'riskWeight')}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TAB: PROTECTIVE */}
                    <div className={`${activeTab !== 'protective' ? 'hidden print:block' : ''} space-y-8`}>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{Reflect.get(t, 'protectiveFactors')}</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-bold">{Reflect.get(t, 'protFactSubtitle')}</p>
                                </div>
                            </div>
                            <div>
                                {Array.from(Object.assign({}, { length: Reflect.get(settings, 'protectiveCount') })).map((_, idx) => (
                                    <DataRow key={`pf_${idx}`} label={Reflect.get(t, `pf_${idx + 1}`)} hint={Reflect.get(t, `pf_${idx + 1}_hint`)} desc={Reflect.get(t, `pf_${idx + 1}_desc`)} checked={protFact.at(idx)} onChange={(i) => toggleItem(setProtFact, i)} idx={idx} color="emerald" weightTag={`-${Reflect.get(settings, 'protectiveWeight')}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TAB: RESULTS */}
                    <div className={`transition-all duration-700 ease-out transform ${activeTab === 'results' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'} ${activeTab !== 'results' ? 'hidden' : 'block'} space-y-6 pb-20`}>
                        {/* Status "Stamp" */}
                        <div className="relative group perspective-1000 w-full mb-10">
                            <div className="relative w-full rounded-[2rem] border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a] hover:translate-x-2.5 hover:translate-y-2.5 transition-all duration-300 ease-out flex flex-col md:flex-row overflow-hidden bg-white">
                                <div className={`relative flex-1 p-8 md:p-12 flex flex-col justify-center overflow-hidden transition-all duration-500 ${CatColors[results.finalCat].split(' ')[0]}`}>
                                    <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}></div>
                                    <Shield className="absolute -right-12 -bottom-12 w-80 h-80 opacity-[0.07] text-black rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110 pointer-events-none" strokeWidth={1} />
                                    <div className="relative z-10 flex flex-col items-start">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/10 text-black border-2 border-black/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md mb-6 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                                            <Activity className="w-3 h-3" />
                                            {isRtl ? 'نتیجه آنالیز الگوریتم' : 'ALGORITHM VERDICT'}
                                        </div>
                                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                                            {Reflect.get(t, results.finalCat)}
                                        </h2>
                                    </div>
                                </div>
                                <div className="w-full md:w-[320px] bg-slate-900 text-white p-8 md:p-10 flex flex-col justify-between border-t-4 md:border-t-0 md:border-l-4 border-slate-900 relative">
                                    <div className="absolute inset-2 border border-slate-700/50 rounded-[1.2rem] pointer-events-none"></div>
                                    <div className="relative z-10 flex flex-col gap-1 mb-8">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                            {isRtl ? 'شاخص نمره خالص' : 'NET SCORE INDEX'}
                                        </span>
                                        <div className="flex items-end gap-3 mt-2" dir="ltr">
                                            <span className="text-7xl font-black font-mono leading-none tracking-tighter text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                                {results.score > 0 ? `+${results.score}` : results.score}
                                            </span>
                                            <span className="text-sm font-bold text-slate-500 mb-1.5 uppercase">pts</span>
                                        </div>
                                    </div>
                                    <div className="relative z-10 flex-1 flex flex-col justify-end">
                                        {results.hasHyposalivation ? (
                                            <div className="bg-red-500 text-white border-2 border-red-300 p-3.5 rounded-xl shadow-[4px_4px_0px_#7f1d1d]">
                                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-1 opacity-80"><Droplets className="w-3 h-3" /> {isRtl ? 'پرچم بحرانی' : 'CRITICAL FLAG'}</span>
                                                <span className="font-bold text-sm leading-tight block">{isRtl ? 'نقص شدید بزاق ثبت شده' : 'HYPOSALIVATION DETECTED'}</span>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-800 text-slate-400 border-2 border-slate-700 p-3.5 rounded-xl border-dashed">
                                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-1 opacity-50"><Droplets className="w-3 h-3" /> {isRtl ? 'وضعیت' : 'STATUS'}</span>
                                                <span className="font-bold text-sm leading-tight block opacity-50">{isRtl ? 'جریان بزاق نرمال' : 'SALIVARY FLOW NORMAL'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dossier UI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { key: 'di', score: results.dScore, sign: '+', themeMain: 'bg-red-500', themeLight: 'bg-red-50', themeBorder: 'border-red-200', themeText: 'text-red-800', label: isRtl ? 'پاتولوژی' : 'PATHOLOGY', icon: Stethoscope, items: diseaseInd.map((checked, idx) => checked ? Reflect.get(t, `di_${idx + 1}`) : null).filter(Boolean) },
                                { key: 'rf', score: results.rScore, sign: '+', themeMain: 'bg-amber-500', themeLight: 'bg-amber-50', themeBorder: 'border-amber-200', themeText: 'text-amber-800', label: isRtl ? 'بیولوژی' : 'BIOLOGY', icon: Zap, items: riskFact.map((checked, idx) => checked ? Reflect.get(t, `rf_${idx + 1}`) : null).filter(Boolean) },
                                { key: 'pf', score: results.pScore, sign: '-', themeMain: 'bg-emerald-500', themeLight: 'bg-emerald-50', themeBorder: 'border-emerald-200', themeText: 'text-emerald-800', label: isRtl ? 'محافظت' : 'PROTECTION', icon: ShieldCheck, items: protFact.map((checked, idx) => checked ? Reflect.get(t, `pf_${idx + 1}`) : null).filter(Boolean) }
                            ].map((stat, i) => (
                                <div key={stat.key} className="group relative flex flex-col bg-white rounded-[2rem] border-4 border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:shadow-[0px_0px_0px_#0f172a] hover:translate-x-1.5 hover:translate-y-1.5 transition-all duration-300 overflow-hidden">
                                    <div className="relative p-5 md:p-6 flex justify-between items-start">
                                        <div className="flex flex-col gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-white ${stat.themeMain}`}><stat.icon className="w-6 h-6" /></div>
                                            <h3 className="font-black text-sm md:text-base text-slate-900 uppercase tracking-widest">{stat.label}</h3>
                                        </div>
                                        <div dir="ltr" className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${stat.themeLight}`}>
                                            <span className={`font-mono font-black text-2xl md:text-3xl leading-none ${stat.themeText}`}>{stat.sign}{stat.score}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 pt-0 md:p-4 md:pt-0 flex-1 relative">
                                        {stat.items.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {stat.items.map((item, idx) => (
                                                    <div key={idx} className={`inline-flex items-start gap-2 px-2.5 py-1.5 rounded-lg border-2 ${stat.themeBorder} ${stat.themeLight}`}>
                                                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 border border-black/10 ${stat.themeMain}`}></div>
                                                        <span className={`text-[10px] md:text-[11px] font-bold leading-snug ${stat.themeText}`}>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-30 py-6">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-900 flex items-center justify-center"><span className="font-mono font-black text-xl">-</span></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overrides */}
                        {(results.dOverride || results.eOverride || results.orthoOverride) && (
                            <div className="flex flex-wrap gap-4 py-4">
                                {results.dOverride && (
                                    <div className="rotate-[-1deg] bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex-1 min-w-[280px]">
                                        <span className="flex items-center gap-2 text-red-600 font-black text-xs uppercase mb-1"><ArrowUpRight className="w-4 h-4" /> {Reflect.get(t, 'diseaseOverride')}</span>
                                        <p className="text-sm font-bold text-red-800/80 leading-snug">{isRtl ? 'شناسایی ضایعات فعال باعث انتقال به دسته پرخطر شد.' : 'Active lesions detected; status set to HIGH RISK regardless of score.'}</p>
                                    </div>
                                )}
                                {results.eOverride && (
                                    <div className="rotate-[1deg] bg-slate-900 text-white p-4 rounded-xl shadow-lg flex-1 min-w-[280px]">
                                        <span className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase mb-1"><Zap className="w-4 h-4" /> {Reflect.get(t, 'extremeOverride')}</span>
                                        <p className="text-sm font-bold text-slate-300 leading-snug">{isRtl ? 'ترکیب ریسک بالا و نقص بزاق یعنی ریسک حداکثری.' : 'High Risk + Dry Mouth protocol activated for EXTREME classification.'}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Plan */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 px-2">
                                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">{isRtl ? 'برنامه درمانی اختصاصی' : 'CLINICAL ACTION PLAN'}</h3>
                                <div className="flex-1 h-[1px] bg-slate-200"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden transition-all hover:shadow-2xl">
                                    <div className="bg-slate-50 border-b-2 border-slate-900 p-4 flex items-center justify-between">
                                        <span className="font-black text-xs text-slate-500 uppercase tracking-tighter flex items-center gap-2"><Calendar className="w-4 h-4" /> {Reflect.get(t, 'recDiagnostics')}</span>
                                    </div>
                                    <div className="p-6">
                                        <div dangerouslySetInnerHTML={{ __html: Reflect.get(t, Reflect.get(RecMap[results.finalCat], 'd')) }} className="text-[15px] text-slate-700 leading-relaxed space-y-4" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden transition-all hover:shadow-2xl">
                                    <div className="bg-slate-900 p-4 flex items-center justify-between">
                                        <span className="font-black text-xs text-indigo-300 uppercase tracking-tighter flex items-center gap-2"><Zap className="w-4 h-4" /> {Reflect.get(t, 'recInterventions')}</span>
                                    </div>
                                    <div className="p-6">
                                        <div dangerouslySetInnerHTML={{ __html: Reflect.get(t, Reflect.get(RecMap[results.finalCat], 'i')) }} className="text-[15px] text-slate-700 leading-relaxed space-y-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ICDAS & Proximal Reference Tables */}
                        <div className="mt-8 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                                    <h3 className="font-bold text-sm text-slate-700 uppercase tracking-widest">راهنمای کدهای ICDAS</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3">ICDAS</th>
                                                <th className="px-6 py-3">معنی</th>
                                                <th className="px-6 py-3">وضعیت</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">0</td><td className="px-6 py-3">سطح دندان سالم</td><td className="px-6 py-3 text-emerald-600 font-bold">بدون پوسیدگی</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">1</td><td className="px-6 py-3">اولین تغییر قابل مشاهده در مینا (فقط بعد از خشک کردن)</td><td className="px-6 py-3">دمینرالیزاسیون اولیه</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">2</td><td className="px-6 py-3">ضایعه سفید یا قهوه‌ای واضح، بدون نیاز به خشک کردن</td><td className="px-6 py-3">پوسیدگی اولیه مینا</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">3</td><td className="px-6 py-3">شکستگی موضعی مینا (Microcavity)، عاج هنوز دیده نمی‌شود</td><td className="px-6 py-3 text-amber-600 font-bold">هنوز عمدتاً محدود به مینا</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">4</td><td className="px-6 py-3">سایه تیره از عاج زیر مینا دیده می‌شود</td><td className="px-6 py-3 text-red-500 font-bold">احتمال درگیری عاج</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">5</td><td className="px-6 py-3">حفره واضح همراه با نمایان شدن عاج</td><td className="px-6 py-3 text-red-600 font-bold">پوسیدگی واضح</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono">6</td><td className="px-6 py-3">حفره وسیع با تخریب گسترده عاج</td><td className="px-6 py-3 text-red-700 font-black">پوسیدگی شدید</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                                    <h3 className="font-bold text-sm text-slate-700 uppercase tracking-widest">درجه بندی پوسیدگی پروگزیمال (C1-C4)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                            <tr><th className="px-6 py-3">C</th><th className="px-6 py-3">محل ضایعه</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold">C1</td><td className="px-6 py-3">نیمه خارجی مینا</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold">C2</td><td className="px-6 py-3">نیمه داخلی مینا</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-bold text-red-500">C3</td><td className="px-6 py-3 text-red-500 font-bold">یک‌سوم خارجی عاج</td></tr>
                                            <tr className="hover:bg-slate-50"><td className="px-6 py-3 font-mono font-black text-red-700">C4</td><td className="px-6 py-3 text-red-700 font-black">یک‌سوم میانی یا داخلی عاج</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-12 flex flex-col items-center">
                            <button onClick={submitToServer} disabled={isSubmitting} className="group relative cursor-pointer active:scale-95 transition-transform">
                                <div className="absolute inset-0 bg-indigo-800 rounded-2xl translate-x-1 translate-y-2"></div>
                                <div className="relative bg-indigo-600 text-white border-4 border-slate-900 px-12 py-4 rounded-2xl font-black text-xl flex items-center gap-4 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform">
                                    {isSubmitting ? <Activity className="animate-spin" /> : <ClipboardCheck className="w-6 h-6" />}
                                    {isSubmitting ? (isRtl ? 'در حال ثبت...' : 'SAVING...') : (isRtl ? 'ثبت و خروج' : 'FINISH & LOG')}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* THINNER TACTICAL NAVIGATION */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-40 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-slate-900 rounded-full p-1 flex items-center justify-between gap-3 pointer-events-auto shadow-md">
                    <button
                        disabled={tabOrder.indexOf(activeTab) === 0}
                        onClick={() => setActiveTab(tabOrder.at(tabOrder.indexOf(activeTab) - 1))}
                        className={`group relative flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full border border-slate-900 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 active:bg-slate-300 transition-colors ${tabOrder.indexOf(activeTab) === 0 ? 'invisible' : ''}`}
                    >
                        <ChevronLeft className={`w-5 h-5 text-slate-900 ${isRtl ? 'transform scale-x-[-1] group-active:translate-x-1' : 'group-active:-translate-x-1'} transition-transform`} strokeWidth={3} />
                    </button>
                    
                    <div className="hidden sm:flex flex-1 justify-center gap-2">
                        {tabOrder.map((tab, idx) => (
                            <div key={tab} className={`transition-all duration-500 rounded-full border border-slate-900 ${idx === tabOrder.indexOf(activeTab) ? 'w-6 h-2 bg-indigo-500 shadow-[1px_1px_0px_#0f172a]' : idx < tabOrder.indexOf(activeTab) ? 'w-2 h-2 bg-slate-900' : 'w-2 h-2 bg-slate-200'}`} />
                        ))}
                    </div>

                    <div className="flex sm:hidden flex-1 justify-center">
                        <span className="font-bold font-mono text-sm text-slate-900 bg-slate-100 border border-slate-900 px-3 py-0.5 rounded-full" dir="ltr">{tabOrder.indexOf(activeTab) + 1} / {tabOrder.length}</span>
                    </div>

                    <button
                        disabled={tabOrder.indexOf(activeTab) === tabOrder.length - 1 || !isTabValid(activeTab)}
                        onClick={() => setActiveTab(tabOrder.at(tabOrder.indexOf(activeTab) + 1))}
                        className={`group relative flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full border border-slate-900 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 active:bg-slate-300 transition-colors ${tabOrder.indexOf(activeTab) === tabOrder.length - 1 ? 'invisible' : ''}`}
                    >
                        <ChevronRight className={`w-5 h-5 text-slate-900 ${isRtl ? 'transform scale-x-[-1] group-active:-translate-x-1' : 'group-active:translate-x-1'} transition-transform`} strokeWidth={3} />
                    </button>
                </div>
            </nav>

            {appAlert.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center">
                        <div className="mb-4">
                            {appAlert.type === 'success' ? (
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-600"><Check className="w-8 h-8" strokeWidth={4} /></div>
                            ) : (
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-600"><AlertCircle className="w-8 h-8" strokeWidth={4} /></div>
                            )}
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-4">{appAlert.type === 'success' ? (isRtl ? 'موفقیت' : 'SUCCESS') : (isRtl ? 'خطا' : 'ERROR')}</h3>
                        <p className="text-slate-600 font-bold mb-6">{appAlert.message}</p>
                        <button onClick={() => { if (appAlert.onClose) appAlert.onClose(); setAppAlert({ ...appAlert, show: false, onClose: null }); }} className="w-full py-3 bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">
                            {isRtl ? 'باشه' : 'OK'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
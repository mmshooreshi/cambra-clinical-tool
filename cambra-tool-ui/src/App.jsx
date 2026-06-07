import React, { useState, useMemo, useEffect } from 'react';
import {
    Globe, Activity, User, Check, AlertCircle, Shield, PieChart, Save, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function CambraApp() {
    const langTuple = useState('fa'); const lang = langTuple.at(0); const setLang = langTuple.at(1);
    const tabTuple = useState('patient'); const activeTab = tabTuple.at(0); const setActiveTab = tabTuple.at(1);
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

    // Add this state to your list of states
    const [appAlert, setAppAlert] = useState({ show: false, message: '', type: 'info' });


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


    const tabOrder = Array.of('patient', 'disease', 'protective', 'results');

    const isTabValid = (id) => {
        if (id === 'patient') return patient.name.length > 0 && patient.chartNo.length > 0;
        return true; // Other tabs are optional
    };

    const toggleItem = (setter, idx) => {
        setter(prev => {
            const n = Array.from(prev);
            n.splice(idx, 1, !n.at(idx));
            return n;
        });
    };

    const submitToServer = async () => {
        setIsSubmitting(true);
        try {
            const currentDict = Reflect.get(Reflect.get(config, 'dict'), lang);

            // --- NEW LOGIC: Extract actual text instead of true/false ---
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
                raw_data: JSON.stringify({ patient, diseaseInd, riskFact, protFact }) // Added this
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
                    type: 'success'
                });
            } else {
                setAppAlert({
                    show: true,
                    message: lang === 'fa' ? 'خطا در ثبت اطلاعات.' : 'Error submitting data.',
                    type: 'error'
                });
            }



        } catch (err) {
            console.error(err);
            setAppAlert({
                show: true,
                message: lang === 'fa' ? 'اینترنت خود را بررسی کنید.' : 'Check out your internet connection.',
                type: 'error'
            });

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
        { id: 'patient', icon: User, label: Reflect.get(t, 'tabPatient') },
        { id: 'disease', icon: AlertCircle, label: Reflect.get(t, 'tabDisease') },
        { id: 'protective', icon: Shield, label: Reflect.get(t, 'tabProtective') },
        { id: 'results', icon: PieChart, label: Reflect.get(t, 'tabResults') }
    );

    const CatColors = {
        extremeRisk: 'bg-red-900 text-red-50 border-red-900',
        highRisk: 'bg-red-600 text-white border-red-600',
        moderateRisk: 'bg-amber-500 text-amber-950 border-amber-500',
        lowRisk: 'bg-emerald-600 text-white border-emerald-600'
    };

    const CatText = {
        extremeRisk: 'text-red-700',
        highRisk: 'text-red-600',
        moderateRisk: 'text-amber-600',
        lowRisk: 'text-emerald-600'
    };

    const RecMap = {
        lowRisk: { d: 'rec_low_diag', i: 'rec_low_int' },
        moderateRisk: { d: 'rec_mod_diag', i: 'rec_mod_int' },
        highRisk: { d: 'rec_high_diag', i: 'rec_high_int' },
        extremeRisk: { d: 'rec_ext_diag', i: 'rec_ext_int' }
    };

    const DataRow = ({ label, hint, checked, onChange, idx, color, weightTag }) => {
        const activeColor = Reflect.get({ red: "bg-red-600", amber: "bg-amber-500", emerald: "bg-emerald-500" }, color);
        const hoverColor = Reflect.get({ red: "hover:bg-red-50", amber: "hover:bg-amber-50", emerald: "hover:bg-emerald-50" }, color);

        return (
            <div className={`group flex flex-col py-4 px-5 border-b border-slate-100 transition-colors cursor-pointer ${checked ? 'bg-slate-50' : `bg-white ${hoverColor}`}`} onClick={() => onChange(idx)}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checked ? `${activeColor} border-transparent` : 'border-slate-300 bg-white'}`}>
                            <Check className={`w-4 h-4 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                        </div>
                        <span className={`text-base font-bold transition-colors ${checked ? 'text-slate-900' : 'text-slate-700'}`}>
                            {label}
                        </span>
                    </div>
                    {checked && <span className={`ltr text-xs font-black ${color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>{weightTag}</span>}
                </div>
                <div className="mt-2 ms-10 text-sm text-slate-500 font-medium">{hint}</div>
            </div>
        );
    };

    const getModalContent = () => {
        if (!activeModal) return null;

        const items = new Array();
        let title = '';
        let colorClass = '';

        if (activeModal === 'disease') {
            title = 'PATHOLOGY INDICATORS';
            colorClass = 'border-red-600 text-red-600 bg-red-50';
            diseaseInd.forEach((isActive, idx) => {
                if (isActive) items.push(Reflect.get(t, `di_${idx + 1}`));
            });
        } else if (activeModal === 'risk') {
            title = 'BIOLOGICAL RISK';
            colorClass = 'border-amber-600 text-amber-600 bg-amber-50';
            riskFact.forEach((isActive, idx) => {
                if (isActive) items.push(Reflect.get(t, `rf_${idx + 1}`));
            });
        } else if (activeModal === 'protective') {
            title = 'PREVENTIVE FACTORS';
            colorClass = 'border-emerald-600 text-emerald-600 bg-emerald-50';
            protFact.forEach((isActive, idx) => {
                if (isActive) items.push(Reflect.get(t, `pf_${idx + 1}`));
            });
        }

        return { title, items, colorClass };
    };

    const modalData = getModalContent();

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className={`min-h-screen bg-slate-50 text-slate-900 font-sans pb-28 print:pb-0 ${isRtl ? 'font-arabic' : ''}`}>

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
                <button onClick={() => setLang(lang === 'en' ? 'fa' : 'en')} className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">
                    {Reflect.get(t, 'language')}
                </button>
            </header>

            {/* TABS */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-3xl mx-auto flex">
                    {tabs.map(tab => (
                        <button
                            key={Reflect.get(tab, 'id')}
                            onClick={() => setActiveTab(Reflect.get(tab, 'id'))}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === Reflect.get(tab, 'id') ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === Reflect.get(tab, 'id') ? 'text-slate-900' : 'text-slate-400'}`} />
                            {Reflect.get(tab, 'label')}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="max-w-3xl mx-auto p-4 md:p-8">
                <div className="space-y-8">

                    {/* TAB: PATIENT */}
                    <div className={`${activeTab !== 'patient' ? 'hidden print:block' : ''}`}>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{Reflect.get(t, 'patientInfo')}</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'patientName')}</label>
                                    <input type="text" value={patient.name} onChange={e => setPatient(Object.assign({}, patient, { name: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'chartNo')}</label>
                                    <input type="text" value={patient.chartNo} onChange={e => setPatient(Object.assign({}, patient, { chartNo: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'date')}</label>
                                    <input type="date" value={patient.date} onChange={e => setPatient(Object.assign({}, patient, { date: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'assessmentType')}</label>
                                    <select value={patient.assessmentType} onChange={e => setPatient(Object.assign({}, patient, { assessmentType: e.target.value }))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500 bg-white">
                                        <option value="baseline">{Reflect.get(t, 'baseline')}</option>
                                        <option value="recall">{Reflect.get(t, 'recall')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                    <DataRow key={`di_${idx}`} label={Reflect.get(t, `di_${idx + 1}`)} hint={Reflect.get(t, `di_${idx + 1}_hint`)} checked={diseaseInd.at(idx)} onChange={(i) => toggleItem(setDiseaseInd, i)} idx={idx} color="red" weightTag={`+${Reflect.get(settings, 'diseaseWeight')}`} />
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
                                    <DataRow key={`rf_${idx}`} label={Reflect.get(t, `rf_${idx + 1}`)} hint={Reflect.get(t, `rf_${idx + 1}_hint`)} checked={riskFact.at(idx)} onChange={(i) => toggleItem(setRiskFact, i)} idx={idx} color="amber" weightTag={`+${Reflect.get(settings, 'riskWeight')}`} />
                                ))}
                            </div>
                        </div>
                    </div>

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
                                    <DataRow key={`pf_${idx}`} label={Reflect.get(t, `pf_${idx + 1}`)} hint={Reflect.get(t, `pf_${idx + 1}_hint`)} checked={protFact.at(idx)} onChange={(i) => toggleItem(setProtFact, i)} idx={idx} color="emerald" weightTag={`-${Reflect.get(settings, 'protectiveWeight')}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* TAB: RESULTS */}
                    <div className={`${activeTab !== 'results' ? 'hidden print:block' : ''} space-y-6 relative`}>

                        {/* OVERLAY MODAL */}
                        {activeModal && modalData && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
                                <div
                                    className="bg-white w-full max-w-lg border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col max-h-[80vh]"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className={`p-4 border-b-4 border-slate-900 flex justify-between items-center ${Reflect.get(modalData, 'colorClass')}`}>
                                        <span className="font-black font-mono tracking-widest uppercase">{Reflect.get(modalData, 'title')}</span>
                                        <button onClick={() => setActiveModal(null)} className="font-black hover:scale-110 transition-transform hover:bg-red-500 rounded pt-0.5 px-1.5 hover:text-white cursor-pointer active:scale-50">✕</button>
                                    </div>
                                    <div className="p-6 overflow-y-auto bg-slate-50 font-mono text-sm space-y-3">
                                        {Reflect.get(modalData, 'items').length > 0 ? (
                                            Reflect.get(modalData, 'items').map((item, i) => (
                                                <div key={i} className="flex gap-3 items-start border-l-2 border-slate-300 pl-3 py-1">
                                                    <span className="text-slate-400 font-black pt-0.5">{(i + 1).toString().padStart(2, '0')}</span>
                                                    <span className="text-slate-800 font-bold leading-relaxed">{item}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-400 font-black text-center py-8">No data logged</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STATUS PANEL */}
                        <div className={`p-8 border-4 border-slate-900 flex flex-col md:flex-row items-center justify-between text-center md:text-start shadow-[6px_6px_0px_rgba(15,23,42,1)] ${Reflect.get(CatColors, Reflect.get(results, 'finalCat'))}`}>
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-1">
                                    {Reflect.get(t, 'riskCategory')}
                                </div>
                                <div className="text-5xl font-black uppercase drop-shadow-sm">
                                    {Reflect.get(t, Reflect.get(results, 'finalCat'))}
                                </div>
                            </div>

                            {(Reflect.get(results, 'dOverride') || Reflect.get(results, 'eOverride') || Reflect.get(results, 'orthoOverride')) && (
                                <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end gap-2 border-t-2 md:border-t-0 md:border-l-2 border-black/20 pt-4 md:pt-0 md:pl-6">
                                    {Reflect.get(results, 'dOverride') && <span className="text-xs bg-black/20 px-3 py-1.5 font-bold tracking-widest uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {Reflect.get(t, 'diseaseOverride')}</span>}
                                    {Reflect.get(results, 'eOverride') && <span className="text-xs bg-black/20 px-3 py-1.5 font-bold tracking-widest uppercase flex items-center gap-2"><Activity className="w-4 h-4" /> {Reflect.get(t, 'extremeOverride')}</span>}
                                    {Reflect.get(results, 'orthoOverride') && !Reflect.get(results, 'dOverride') && !Reflect.get(results, 'eOverride') && <span className="text-xs bg-black/20 px-3 py-1.5 font-bold tracking-widest uppercase flex items-center gap-2"><Activity className="w-4 h-4" /> {Reflect.get(t, 'orthoOverride')}</span>}
                                </div>
                            )}
                        </div>

                        {/* INTERACTIVE TELEMETRY */}
                        <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_rgba(15,23,42,1)] font-mono">
                            <div className="bg-slate-900 text-white p-3 text-xs font-black uppercase tracking-widest flex items-center justify-between">
                                <span>{Reflect.get(t, 'mathBreakdown')}</span>
                            </div>

                            <div className="flex flex-col text-sm">
                                <button
                                    onClick={() => setActiveModal('disease')}
                                    className="cursor-pointer flex justify-between items-center p-4 border-b border-slate-300 hover:bg-slate-100 transition-colors group text-left"
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-slate-800">PATHOLOGY INDICATORS</span>
                                        <span className="w-max ltr text-xs text-slate-500 font-bold group-hover:text-slate-800 transition-colors">{Reflect.get(results, 'dCount')} × [+{Reflect.get(settings, 'diseaseWeight')}] <br /> ⇲ INSPECT</span>
                                    </div>
                                    <span className="text-red-600 font-black text-xl bg-red-50 ltr monofont px-3 py-1 border border-red-200">+{Reflect.get(results, 'dScore')}</span>
                                </button>

                                <button
                                    onClick={() => setActiveModal('risk')}
                                    className="cursor-pointer flex justify-between items-center p-4 border-b border-slate-300 hover:bg-slate-100 transition-colors group text-left"
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-slate-800">BIOLOGICAL RISK</span>
                                        <span className="w-max ltr text-xs text-slate-500 font-bold group-hover:text-slate-800 transition-colors">{Reflect.get(results, 'rCount')} × [+{Reflect.get(settings, 'riskWeight')}] <br /> ⇲ INSPECT</span>
                                    </div>
                                    <span className="text-amber-600 font-black text-xl bg-amber-50 ltr monofont px-3 py-1 border border-amber-200">+{Reflect.get(results, 'rScore')}</span>
                                </button>

                                <button
                                    onClick={() => setActiveModal('protective')}
                                    className="cursor-pointer flex justify-between items-center p-4 border-b border-slate-300 hover:bg-slate-100 transition-colors group text-left"
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-slate-800">PREVENTIVE FACTORS</span>
                                        <span className="w-max ltr text-xs text-slate-500 font-bold group-hover:text-slate-800 transition-colors">{Reflect.get(results, 'pCount')} × [-{Reflect.get(settings, 'protectiveWeight')}] <br /> ⇲ INSPECT</span>
                                    </div>
                                    <span className="text-emerald-600 font-black text-xl bg-emerald-50 ltr monofont px-3 py-1 border border-emerald-200">-{Reflect.get(results, 'pScore')}</span>
                                </button>

                                <div className="flex justify-between items-center p-5 bg-slate-200 border-t-4 border-slate-900">
                                    <span className="font-black text-slate-900 uppercase text-lg tracking-widest">{Reflect.get(t, 'totalScore')}</span>
                                    <span className="text-white bg-slate-900 font-black text-2xl px-4 py-1">{Reflect.get(results, 'score')}</span>
                                </div>
                            </div>
                        </div>

                        {/* CLINICAL DIRECTIVES (Mixed RTL/LTR Handled Here) */}
                        <div className="grid grid-cols-1 gap-6 pt-4">

                            <div className="bg-white border-2 border-slate-800 flex flex-col">
                                <div className="bg-slate-100 border-b-2 border-slate-800 px-4 py-3 flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{Reflect.get(t, 'recDiagnostics')}</h2>
                                </div>
                                <div dir={isRtl ? 'rtl' : 'ltr'} className={`p-6 font-serif text-[15px] text-slate-800 leading-loose bg-white ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: Reflect.get(t, Reflect.get(Reflect.get(RecMap, Reflect.get(results, 'finalCat')), 'd')) }}
                                        className="[&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:ms-6 [&>ul>li]:mb-2"
                                    />
                                </div>
                            </div>

                            <div className="bg-white border-2 border-slate-800 flex flex-col">
                                <div className="bg-slate-100 border-b-2 border-slate-800 px-4 py-3 flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{Reflect.get(t, 'recInterventions')}</h2>
                                </div>
                                <div dir={isRtl ? 'rtl' : 'ltr'} className={`p-6 font-serif text-[15px] text-slate-800 leading-loose bg-white ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <div
                                        dangerouslySetInnerHTML={{ __html: Reflect.get(t, Reflect.get(Reflect.get(RecMap, Reflect.get(results, 'finalCat')), 'i')) }}
                                        className="[&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:ms-6 [&>ul>li]:mb-2"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="pt-6 flex justify-center pb-8">
                            <button onClick={submitToServer} disabled={isSubmitting} className="cursor-pointer bg-slate-900 active:bg-slate-500 hover:bg-slate-600 text-white border-4 border-transparent  px-8 py-4 font-black text-lg flex items-center gap-3 transition-all disabled:opacity-50">
                                <Save className="w-6 h-6" /> {isSubmitting ? '...' : (isRtl ? 'ثبت نهایی در سرور' : 'SUBMIT_ASSESSMENT')}
                            </button>
                        </div>

                    </div>
                </div>
            </main>


            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-40">

                <button
                    disabled={activeTab === 'patient'}
                    onClick={() => setActiveTab(tabOrder.at(tabOrder.indexOf(activeTab) - 1))}
                    className="p-3 bg-slate-100 rounded-full disabled:opacity-30"
                >
                    <ChevronLeft className={`w-6 h-6 ${isRtl ? 'transform scale-x-[-1]' : ''}`} />
                </button>

                <span className="font-black text-slate-400 text-sm" dir='ltr'>
                    {tabOrder.indexOf(activeTab) + 1} / {tabOrder.length}
                </span>

                <button
                    disabled={activeTab === 'results' || !isTabValid(activeTab)}
                    onClick={() => setActiveTab(tabOrder.at(tabOrder.indexOf(activeTab) + 1))}
                    className="p-3 bg-indigo-600 text-white rounded-full disabled:opacity-30"
                >
                    <ChevronRight className={`w-6 h-6 ${isRtl ? 'transform scale-x-[-1]' : ''}`} />
                </button>

            </nav>


            {appAlert.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center">
                        <div className="mb-4">
                            {appAlert.type === 'success' ? (
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-600">
                                    <Check className="w-8 h-8" strokeWidth={4} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-600">
                                    <AlertCircle className="w-8 h-8" strokeWidth={4} />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest mb-4">
                            {appAlert.type === 'success' ? (isRtl ? 'موفقیت' : 'SUCCESS') : (isRtl ? 'خطا' : 'ERROR')}
                        </h3>
                        <p className="text-slate-600 font-bold mb-6">{appAlert.message}</p>
                        <button
                            onClick={() => setAppAlert({ ...appAlert, show: false })}
                            className="w-full py-3 bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                        >
                            {isRtl ? 'باشه' : 'OK'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
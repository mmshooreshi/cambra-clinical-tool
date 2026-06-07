import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, Activity, User, Check, AlertCircle, Shield, PieChart, Save
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
        final_category: Reflect.get(results, 'finalCat')
      };

      const response = await fetch('https://attendance.rlh.ir/appliance_survey/api/cambra/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert(lang === 'fa' ? 'با موفقیت ثبت شد!' : 'Submitted successfully!');
      } else {
        alert(lang === 'fa' ? 'خطا در ثبت اطلاعات.' : 'Error submitting data.');
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
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
          {checked && <span className={`text-xs font-black ${color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>{weightTag}</span>}
        </div>
        <div className="mt-2 ms-10 text-sm text-slate-500 font-medium">{hint}</div>
      </div>
    );
  };

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
                  <input type="text" value={patient.name} onChange={e => setPatient(Object.assign({}, patient, {name: e.target.value}))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'chartNo')}</label>
                  <input type="text" value={patient.chartNo} onChange={e => setPatient(Object.assign({}, patient, {chartNo: e.target.value}))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'date')}</label>
                  <input type="date" value={patient.date} onChange={e => setPatient(Object.assign({}, patient, {date: e.target.value}))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">{Reflect.get(t, 'assessmentType')}</label>
                  <select value={patient.assessmentType} onChange={e => setPatient(Object.assign({}, patient, {assessmentType: e.target.value}))} className="w-full text-base font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-slate-500 bg-white">
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
                    <DataRow key={`di_${idx}`} label={Reflect.get(t, `di_${idx+1}`)} hint={Reflect.get(t, `di_${idx+1}_hint`)} checked={diseaseInd.at(idx)} onChange={(i) => toggleItem(setDiseaseInd, i)} idx={idx} color="red" weightTag={`+${Reflect.get(settings, 'diseaseWeight')}`}/>
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
                    <DataRow key={`rf_${idx}`} label={Reflect.get(t, `rf_${idx+1}`)} hint={Reflect.get(t, `rf_${idx+1}_hint`)} checked={riskFact.at(idx)} onChange={(i) => toggleItem(setRiskFact, i)} idx={idx} color="amber" weightTag={`+${Reflect.get(settings, 'riskWeight')}`}/>
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
                    <DataRow key={`pf_${idx}`} label={Reflect.get(t, `pf_${idx+1}`)} hint={Reflect.get(t, `pf_${idx+1}_hint`)} checked={protFact.at(idx)} onChange={(i) => toggleItem(setProtFact, i)} idx={idx} color="emerald" weightTag={`-${Reflect.get(settings, 'protectiveWeight')}`}/>
                  ))}
               </div>
            </div>
          </div>

          <div className={`${activeTab !== 'results' ? 'hidden print:block' : ''} space-y-8`}>
            
            <div className={`p-10 rounded-2xl border-4 flex flex-col items-center justify-center text-center shadow-lg ${Reflect.get(CatColors, Reflect.get(results, 'finalCat'))}`}>
               <div className="text-sm font-black uppercase tracking-widest opacity-80 mb-3">{Reflect.get(t, 'riskCategory')}</div>
               <div className="text-5xl md:text-7xl font-black drop-shadow-sm">{Reflect.get(t, Reflect.get(results, 'finalCat'))}</div>
               
               {(Reflect.get(results, 'dOverride') || Reflect.get(results, 'eOverride') || Reflect.get(results, 'orthoOverride')) && (
                 <div className="mt-6 flex flex-col items-center gap-2">
                   {Reflect.get(results, 'dOverride') && <span className="text-xs bg-black/20 px-3 py-1.5 rounded font-bold tracking-wide flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {Reflect.get(t, 'diseaseOverride')}</span>}
                   {Reflect.get(results, 'eOverride') && <span className="text-xs bg-black/20 px-3 py-1.5 rounded font-bold tracking-wide flex items-center gap-2"><Activity className="w-4 h-4"/> {Reflect.get(t, 'extremeOverride')}</span>}
                   {Reflect.get(results, 'orthoOverride') && !Reflect.get(results, 'dOverride') && !Reflect.get(results, 'eOverride') && <span className="text-xs bg-black/20 px-3 py-1.5 rounded font-bold tracking-wide flex items-center gap-2"><Activity className="w-4 h-4"/> {Reflect.get(t, 'orthoOverride')}</span>}
                 </div>
               )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 font-mono text-sm text-slate-700 shadow-sm">
                <div className="font-black text-slate-900 mb-4 uppercase text-center border-b border-slate-200 pb-3">{Reflect.get(t, 'mathBreakdown')}</div>
                <div className="space-y-4 pt-2">
                   <div className="flex justify-between items-center text-base"><span>Disease <span className="text-xs opacity-60">({Reflect.get(results, 'dCount')} * +{Reflect.get(settings, 'diseaseWeight')})</span></span><span className="font-bold text-red-600">+{Reflect.get(results, 'dScore')}</span></div>
                   <div className="flex justify-between items-center text-base"><span>Risk <span className="text-xs opacity-60">({Reflect.get(results, 'rCount')} * +{Reflect.get(settings, 'riskWeight')})</span></span><span className="font-bold text-amber-600">+{Reflect.get(results, 'rScore')}</span></div>
                   <div className="flex justify-between items-center text-base border-b border-slate-200 pb-4"><span>Protective <span className="text-xs opacity-60">({Reflect.get(results, 'pCount')} * -{Reflect.get(settings, 'protectiveWeight')})</span></span><span className="font-bold text-emerald-600">-{Reflect.get(results, 'pScore')}</span></div>
                   <div className="flex justify-between items-center font-black text-2xl pt-2"><span>{Reflect.get(t, 'totalScore')}:</span><span className="text-slate-900 bg-slate-100 px-4 py-1 rounded-lg border border-slate-200">{Reflect.get(results, 'score')}</span></div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
               <div className="bg-indigo-50 border-b border-slate-200 px-6 py-4">
                 <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest">{Reflect.get(t, 'recDiagnostics')}</h2>
               </div>
               <div className="p-6 text-sm font-medium text-slate-700 leading-relaxed bg-white">
                 {Reflect.get(t, Reflect.get(Reflect.get(RecMap, Reflect.get(results, 'finalCat')), 'd'))}
               </div>
               <div className="bg-indigo-50 border-y border-slate-200 px-6 py-4">
                 <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest">{Reflect.get(t, 'recInterventions')}</h2>
               </div>
               <div className="p-6 text-sm font-medium text-slate-700 leading-relaxed bg-white">
                 {Reflect.get(t, Reflect.get(Reflect.get(RecMap, Reflect.get(results, 'finalCat')), 'i'))}
               </div>
            </div>
            
            <div className="pt-4 flex justify-center pb-12">
              <button onClick={submitToServer} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black text-lg flex items-center gap-3 shadow-lg disabled:opacity-50">
                <Save className="w-6 h-6"/> {isSubmitting ? '...' : (isRtl ? 'ثبت نهایی در سرور' : 'Submit Assessment')}
              </button>
            </div>
            
          </div>

        </div>
      </main>

    </div>
  );
}
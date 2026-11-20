import React, { useState } from 'react';
import { X, Save, RotateCcw, Download, Upload, Check, AlertTriangle } from 'lucide-react';
import { DEFAULT_CAMBRA_CONFIG } from '../cambraConfig';

export default function AdminConfigModal({ open, onClose, config, onSaveConfig, lang }) {
    const isFa = lang === 'fa';
    const [editLang, setEditLang] = useState('fa');
    const [activeSection, setActiveSection] = useState('di'); // 'di', 'rf', 'pf', 'settings'
    const [formData, setFormData] = useState(() => JSON.parse(JSON.stringify(config || DEFAULT_CAMBRA_CONFIG)));
    const [savedNotice, setSavedNotice] = useState(false);

    if (!open) return null;

    const dict = formData.dict[editLang] || {};

    const handleDictChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            dict: {
                ...prev.dict,
                [editLang]: {
                    ...prev.dict[editLang],
                    [key]: value
                }
            }
        }));
    };

    const handleSave = () => {
        onSaveConfig(formData);
        localStorage.setItem('cambra_custom_config', JSON.stringify(formData));
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    const handleReset = () => {
        const conf = window.confirm(isFa ? 'آیا مایلید تمام تغییرات به تنظیمات پیش‌فرض بازنشانی شود؟' : 'Reset all configuration to default values?');
        if (!conf) return;
        setFormData(JSON.parse(JSON.stringify(DEFAULT_CAMBRA_CONFIG)));
        localStorage.removeItem('cambra_custom_config');
        onSaveConfig(DEFAULT_CAMBRA_CONFIG);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    const handleExportJson = () => {
        const jsonStr = JSON.stringify(formData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cambra_config_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    };

    const handleImportJson = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.dict && parsed.settings) {
                    setFormData(parsed);
                    onSaveConfig(parsed);
                    localStorage.setItem('cambra_custom_config', JSON.stringify(parsed));
                    alert(isFa ? 'تنظیمات با موفقیت بارگذاری شد!' : 'Config imported successfully!');
                } else {
                    alert(isFa ? 'فرمت فایل معتبر نیست' : 'Invalid config format');
                }
            } catch (err) {
                alert(isFa ? 'خطا در خواندن فایل JSON' : 'JSON parse error');
            }
        };
        reader.readAsText(file);
    };

    const diseaseCount = formData.settings.diseaseCount;
    const riskCount = formData.settings.riskCount;
    const protectiveCount = formData.settings.protectiveCount;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm" dir={isFa ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-900 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-blue-400">
                            ⚙️
                        </div>
                        <div>
                            <h2 className="font-bold text-base leading-tight">
                                {isFa ? 'ویرایشگر متون و محتوای بالینی (Admin Cambra Config)' : 'Clinical Content & Config Editor'}
                            </h2>
                            <p className="text-[11px] text-slate-300">
                                {isFa ? 'ویرایش عناوین، توضیحات تفصیلی، راهنماها و وزن‌دهی بالینی' : 'Edit labels, descriptions, clinical hints, and risk weights'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Subheader Controls */}
                <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600">{isFa ? 'زبان ویرایش:' : 'Edit Language:'}</span>
                        <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white">
                            <button
                                onClick={() => setEditLang('fa')}
                                className={`px-3 py-1 font-semibold transition ${editLang === 'fa' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                فارسی (FA)
                            </button>
                            <button
                                onClick={() => setEditLang('en')}
                                className={`px-3 py-1 font-semibold transition ${editLang === 'en' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                English (EN)
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isFa ? 'وارد کردن JSON' : 'Import JSON'}</span>
                            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                        </label>
                        <button
                            onClick={handleExportJson}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isFa ? 'خروجی JSON' : 'Export JSON'}</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 rounded-xl border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-medium flex items-center gap-1.5 transition"
                            title={isFa ? 'بازنشانی به تنظیمات پیش‌فرض' : 'Reset to default'}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isFa ? 'بازنشانی' : 'Reset'}</span>
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-bold text-slate-600">
                    <button
                        onClick={() => setActiveSection('di')}
                        className={`py-3 px-4 border-b-2 transition ${activeSection === 'di' ? 'border-red-600 text-red-600' : 'border-transparent hover:text-slate-900'}`}
                    >
                        🔴 {isFa ? `شاخص‌های بیماری (${diseaseCount})` : `Disease Indicators (${diseaseCount})`}
                    </button>
                    <button
                        onClick={() => setActiveSection('rf')}
                        className={`py-3 px-4 border-b-2 transition ${activeSection === 'rf' ? 'border-amber-600 text-amber-600' : 'border-transparent hover:text-slate-900'}`}
                    >
                        🟡 {isFa ? `فاکتورهای خطر (${riskCount})` : `Risk Factors (${riskCount})`}
                    </button>
                    <button
                        onClick={() => setActiveSection('pf')}
                        className={`py-3 px-4 border-b-2 transition ${activeSection === 'pf' ? 'border-emerald-600 text-emerald-600' : 'border-transparent hover:text-slate-900'}`}
                    >
                        🟢 {isFa ? `فاکتورهای محافظتی (${protectiveCount})` : `Protective Factors (${protectiveCount})`}
                    </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 overflow-auto p-5 space-y-4 bg-slate-50/50">
                    {activeSection === 'di' && (
                        Array.from({ length: diseaseCount }).map((_, i) => {
                            const idx = i + 1;
                            const titleKey = `di_${idx}`;
                            const hintKey = `di_${idx}_hint`;
                            const descKey = `di_${idx}_desc`;

                            return (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center">
                                            {idx}
                                        </span>
                                        <h3 className="font-bold text-sm text-slate-800">
                                            {isFa ? `شاخص بیماری شماره ${idx}` : `Disease Indicator #${idx}`}
                                        </h3>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'عنوان / نام شاخص:' : 'Title / Label:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={dict[titleKey] || ''}
                                            onChange={e => handleDictChange(titleKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'راهنمای بالینی کوتاه (Hint):' : 'Short Clinical Hint:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={dict[hintKey] || ''}
                                            onChange={e => handleDictChange(hintKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'توضیحات تفصیلی و معیارهای تشخیصی (_desc):' : 'Detailed Description & Diagnostic Criteria (_desc):'}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={dict[descKey] || ''}
                                            onChange={e => handleDictChange(descKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {activeSection === 'rf' && (
                        Array.from({ length: riskCount }).map((_, i) => {
                            const idx = i + 1;
                            const titleKey = `rf_${idx}`;
                            const hintKey = `rf_${idx}_hint`;
                            const descKey = `rf_${idx}_desc`;

                            return (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                                            {idx}
                                        </span>
                                        <h3 className="font-bold text-sm text-slate-800">
                                            {isFa ? `فاکتور خطر بیولوژیک شماره ${idx}` : `Biological Risk Factor #${idx}`}
                                        </h3>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'عنوان / نام فاکتور:' : 'Title / Label:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={dict[titleKey] || ''}
                                            onChange={e => handleDictChange(titleKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'راهنمای بالینی کوتاه (Hint):' : 'Short Clinical Hint:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={dict[hintKey] || ''}
                                            onChange={e => handleDictChange(hintKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'توضیحات تفصیلی بالینی (_desc):' : 'Detailed Description (_desc):'}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={dict[descKey] || ''}
                                            onChange={e => handleDictChange(descKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {activeSection === 'pf' && (
                        Array.from({ length: protectiveCount }).map((_, i) => {
                            const idx = i + 1;
                            const titleKey = `pf_${idx}`;
                            const hintKey = `pf_${idx}_hint`;
                            const descKey = `pf_${idx}_desc`;

                            return (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                            {idx}
                                        </span>
                                        <h3 className="font-bold text-sm text-slate-800">
                                            {isFa ? `فاکتور محافظتی شماره ${idx}` : `Protective Factor #${idx}`}
                                        </h3>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'عنوان / نام فاکتور:' : 'Title / Label:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={dict[titleKey] || ''}
                                            onChange={e => handleDictChange(titleKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'راهنمای بالینی کوتاه (Hint):' : 'Short Clinical Hint:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={dict[hintKey] || ''}
                                            onChange={e => handleDictChange(hintKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            {isFa ? 'توضیحات تفصیلی بالینی (_desc):' : 'Detailed Description (_desc):'}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={dict[descKey] || ''}
                                            onChange={e => handleDictChange(descKey, e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-slate-800"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {savedNotice && (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                <Check className="w-4 h-4" />
                                {isFa ? 'تغییرات با موفقیت ذخیره شد!' : 'Changes saved successfully!'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                            {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
                        >
                            <Save className="w-4 h-4 text-emerald-400" />
                            <span>{isFa ? 'ذخیره و اعمال تغییرات' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

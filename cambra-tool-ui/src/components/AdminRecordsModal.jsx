import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, Edit3, Download, RefreshCw, FileSpreadsheet, Eye, User, Calendar, ShieldAlert } from 'lucide-react';

export default function AdminRecordsModal({ open, onClose, onLoadRecord, lang }) {
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);

    const isFa = lang === 'fa';

    const loadRecords = () => {
        try {
            const data = JSON.parse(localStorage.getItem('cambra_patient_records') || '[]');
            setRecords(Array.isArray(data) ? data : []);
        } catch (e) {
            setRecords([]);
        }
    };

    useEffect(() => {
        if (open) {
            loadRecords();
        }
    }, [open]);

    if (!open) return null;

    const filteredRecords = records.filter(r => {
        const query = search.toLowerCase();
        return (
            (r.patient_name || '').toLowerCase().includes(query) ||
            (r.chart_no || '').toLowerCase().includes(query) ||
            (r.final_category || '').toLowerCase().includes(query) ||
            (r.date || '').toLowerCase().includes(query)
        );
    });

    const handleDelete = (id, e) => {
        e.stopPropagation();
        const conf = window.confirm(isFa ? 'آیا از حذف این پرونده مطمئن هستید؟' : 'Are you sure you want to delete this record?');
        if (!conf) return;

        const updated = records.filter(r => r.id !== id);
        localStorage.setItem('cambra_patient_records', JSON.stringify(updated));
        setRecords(updated);
        if (selectedRecord && selectedRecord.id === id) {
            setSelectedRecord(null);
        }
    };

    const handleEdit = (record, e) => {
        e.stopPropagation();
        if (onLoadRecord) {
            onLoadRecord(record);
            onClose();
        }
    };

    const exportCSV = () => {
        if (!records.length) return;
        const headers = ["ID", "Patient Name", "Chart No", "Date", "Assessment Type", "Final Risk", "Net Score", "Hyposalivation", "Disease Indicators", "Risk Factors", "Protective Factors"];
        const rows = records.map(r => [
            `"${r.id || ''}"`,
            `"${r.patient_name || ''}"`,
            `"${r.chart_no || ''}"`,
            `"${r.date || ''}"`,
            `"${r.assessment_type || ''}"`,
            `"${r.final_category || ''}"`,
            `"${r.net_score || 0}"`,
            `"${r.severe_hypo || 'false'}"`,
            `"${(r.disease_list || []).join('; ')}"`,
            `"${(r.risk_list || []).join('; ')}"`,
            `"${(r.protective_list || []).join('; ')}"`
        ]);

        const csvContent = "\ufeff" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cambra_records_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    const getRiskBadge = (cat) => {
        const c = (cat || '').toLowerCase();
        if (c.includes('low')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        if (c.includes('mod')) return 'bg-amber-100 text-amber-800 border-amber-300';
        if (c.includes('extreme')) return 'bg-purple-100 text-purple-900 border-purple-300';
        return 'bg-red-100 text-red-800 border-red-300';
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm" dir={isFa ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-900 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-amber-400">
                            📊
                        </div>
                        <div>
                            <h2 className="font-bold text-base leading-tight">
                                {isFa ? 'پنل مدیریت پرونده‌های ارزیابی (Admin Cambra)' : 'Clinical Records Manager'}
                            </h2>
                            <p className="text-[11px] text-slate-300">
                                {isFa ? `تعداد کل سوابق ثبت‌شده: ${records.length}` : `Total stored records: ${records.length}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isFa ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={isFa ? 'جستجو بر اساس نام بیمار، شماره پرونده، سطح ریسک...' : 'Search by name, chart #, risk level...'}
                            className={`w-full py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ${isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportCSV}
                            disabled={!records.length}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>{isFa ? 'خروجی CSV' : 'Export CSV'}</span>
                        </button>
                        <button
                            onClick={loadRecords}
                            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium transition"
                            title={isFa ? 'بروزرسانی' : 'Refresh'}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table / List */}
                <div className="flex-1 overflow-auto p-4">
                    {filteredRecords.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-semibold">{isFa ? 'هیچ پرونده‌ای یافت نشد' : 'No records found'}</p>
                            <p className="text-xs mt-1">{isFa ? 'پس از ثبت هر ارزیابی در فرم، پرونده اینجا نمایش داده می‌شود.' : 'Records will appear here once saved in the app.'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-xs text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                        <th className="p-3">{isFa ? 'بیمار' : 'Patient'}</th>
                                        <th className="p-3">{isFa ? 'شماره پرونده' : 'Chart No'}</th>
                                        <th className="p-3">{isFa ? 'تاریخ' : 'Date'}</th>
                                        <th className="p-3">{isFa ? 'سطح ریسک نهایی' : 'Final Risk'}</th>
                                        <th className="p-3">{isFa ? 'امتیاز خالص' : 'Net Score'}</th>
                                        <th className="p-3 text-center">{isFa ? 'عملیات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.map(rec => (
                                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3 font-semibold text-slate-800">{rec.patient_name || '-'}</td>
                                            <td className="p-3 font-mono text-slate-600">{rec.chart_no || '-'}</td>
                                            <td className="p-3 text-slate-500">{rec.date || '-'}</td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRiskBadge(rec.final_category)}`}>
                                                    {rec.final_category || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-3 font-bold text-slate-700">{rec.net_score ?? 0}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedRecord(rec)}
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                                                        title={isFa ? 'مشاهده جزئیات' : 'View details'}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleEdit(rec, e)}
                                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                                                        title={isFa ? 'بارگذاری در فرم ارزیابی جهت ویرایش' : 'Load in form to edit'}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(rec.id, e)}
                                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                                                        title={isFa ? 'حذف رکورد' : 'Delete record'}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <span>💡 {isFa ? 'پرونده‌ها در حافظه محلی ذخیره می‌شوند و همزمان به ربات تلگرام و بله نیز ارسال می‌گردند.' : 'Records are stored locally & dispatched to Telegram/Bale bots.'}</span>
                    <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition">
                        {isFa ? 'بستن' : 'Close'}
                    </button>
                </div>
            </div>

            {/* Detail Modal Sub-overlay */}
            {selectedRecord && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-bold text-sm text-slate-800">{isFa ? 'جزئیات ارزیابی بالینی' : 'Assessment Details'}</h3>
                            <button onClick={() => setSelectedRecord(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">{isFa ? 'نام بیمار' : 'Patient'}:</span><span className="font-bold">{selectedRecord.patient_name}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">{isFa ? 'شماره پرونده' : 'Chart #'}:</span><span className="font-mono">{selectedRecord.chart_no}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">{isFa ? 'تاریخ' : 'Date'}:</span><span>{selectedRecord.date}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">{isFa ? 'سطح ریسک' : 'Risk'}:</span><span className="font-bold text-blue-600">{selectedRecord.final_category}</span></div>
                            <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">{isFa ? 'کاهش شدید بزاق' : 'Hyposalivation'}:</span><span>{selectedRecord.severe_hypo === 'true' ? (isFa ? 'بله ⚠️' : 'Yes ⚠️') : (isFa ? 'خیر' : 'No')}</span></div>

                            <div className="pt-2">
                                <span className="font-bold text-slate-700 block mb-1">🔴 {isFa ? 'شاخص‌های بیماری:' : 'Disease Indicators:'}</span>
                                <div className="bg-red-50 p-2.5 rounded-lg text-slate-700">
                                    {(selectedRecord.disease_list && selectedRecord.disease_list.length) ? selectedRecord.disease_list.map((it, i) => <div key={i}>• {it}</div>) : (isFa ? 'موردی ثبت نشده' : 'None')}
                                </div>
                            </div>

                            <div className="pt-1">
                                <span className="font-bold text-slate-700 block mb-1">🟡 {isFa ? 'فاکتورهای خطر بیولوژیک:' : 'Risk Factors:'}</span>
                                <div className="bg-amber-50 p-2.5 rounded-lg text-slate-700">
                                    {(selectedRecord.risk_list && selectedRecord.risk_list.length) ? selectedRecord.risk_list.map((it, i) => <div key={i}>• {it}</div>) : (isFa ? 'موردی ثبت نشده' : 'None')}
                                </div>
                            </div>

                            <div className="pt-1">
                                <span className="font-bold text-slate-700 block mb-1">🟢 {isFa ? 'فاکتورهای محافظتی:' : 'Protective Factors:'}</span>
                                <div className="bg-emerald-50 p-2.5 rounded-lg text-slate-700">
                                    {(selectedRecord.protective_list && selectedRecord.protective_list.length) ? selectedRecord.protective_list.map((it, i) => <div key={i}>• {it}</div>) : (isFa ? 'موردی ثبت نشده' : 'None')}
                                </div>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button onClick={() => setSelectedRecord(null)} className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs">{isFa ? 'بستن' : 'Close'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

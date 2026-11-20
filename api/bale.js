// api/bale.js
// Handles CAMBRA Clinical Assessment submissions for Bale Messenger (Iran)

import { buildXLSXFromObjects } from './xlsx_builder.js';

const CATEGORY_MAP = {
    lowRisk: { fa: "کم‌خطر", en: "LOW RISK", emoji: "🟢" },
    moderateRisk: { fa: "متوسط", en: "MODERATE RISK", emoji: "🟡" },
    highRisk: { fa: "پرخطر", en: "HIGH RISK", emoji: "🔴" },
    extremeRisk: { fa: "بسیار شدید", en: "EXTREME RISK", emoji: "🟣" }
};

function toPersianDigits(str) {
    if (str === null || str === undefined) return '';
    const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/[0-9]/g, w => faDigits[+w]);
}

function escapeCSV(val) {
    return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
}

function parseArrayField(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [String(val)];
    } catch {
        return [String(val)];
    }
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const botToken = process.env.BALE_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatIdsString = process.env.BALE_CHAT_IDS || process.env.TELEGRAM_CHAT_IDS;

    if (!botToken || !chatIdsString) {
        console.error("Missing BALE_BOT_TOKEN or BALE_CHAT_IDS in environment variables.");
        return res.status(500).json({ error: 'Bale environment variables missing' });
    }

    const authorizedChatIds = chatIdsString.split(',').map(id => id.trim()).filter(Boolean);

    const payload = req.body?.responses || req.body;
    if (!payload) {
        return res.status(400).json({ error: 'No data provided' });
    }

    const patientName = payload.patient_name || "نامشخص";
    const chartNo = payload.chart_no || "—";
    const dateStr = payload.date || new Date().toISOString().split('T')[0];
    const assessType = payload.assessment_type === 'recall' ? 'دوره‌ای (Recall)' : 'اولیه (Baseline)';

    const catInfo = CATEGORY_MAP[payload.final_category] || { fa: payload.final_category || "—", en: "", emoji: "⚪" };
    const netScore = payload.net_score !== undefined ? payload.net_score : (payload.score || 0);

    const diseaseList = parseArrayField(payload.disease_list || payload.disease_ind);
    const riskList = parseArrayField(payload.risk_list || payload.risk_fact);
    const protList = parseArrayField(payload.protective_list || payload.prot_fact);

    const dScore = payload.dScore ?? (diseaseList.length * 1);
    const rScore = payload.rScore ?? (riskList.length * 1);
    const pScore = payload.pScore ?? (protList.length * 1);

    const overrides = [];
    if (payload.dOverride || payload.overrides?.diseaseOverride) {
        overrides.push("⚠️ ارتقای بیماری: بیمار به دلیل وجود ضایعه فعال مستقیماً در دسته پرخطر قرار گرفت.");
    }
    if (payload.eOverride || payload.severe_hypo === 'true' || payload.severe_hypo === true) {
        overrides.push("⚠️ ارتقای هیپوسالیواسیون: به دلیل کاهش شدید ترشح بزاق، دسته به بسیار شدید ارتقا یافت.");
    }
    if (payload.orthoOverride || payload.overrides?.orthoOverride) {
        overrides.push("⚠️ تعدیل ارتودنسی: به دلیل اپلاینس ارتودنسی، حداقل ریسک متوسط لحاظ شد.");
    }

    // Build plain message for Bale
    let msg = `🦷 ثبت ارزیابی جدید CAMBRA (پیام‌رسان بله)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 مشخصات بیمار:\n`;
    msg += `• نام بیمار: ${patientName}\n`;
    msg += `• شماره پرونده: ${chartNo}\n`;
    msg += `• تاریخ ارزیابی: ${toPersianDigits(dateStr)}\n`;
    msg += `• نوع ویزیت: ${assessType}\n\n`;

    msg += `📊 نتیجه ارزیابی ریسک:\n`;
    msg += `• دسته نهایی: ${catInfo.emoji} ${catInfo.fa} (${catInfo.en})\n`;
    msg += `• نمره خالص: ${netScore > 0 ? '+' : ''}${toPersianDigits(netScore)}\n`;
    msg += `  ├ شاخص بیماری: +${toPersianDigits(dScore)}\n`;
    msg += `  ├ عوامل خطر: +${toPersianDigits(rScore)}\n`;
    msg += `  └ عوامل محافظتی: -${toPersianDigits(pScore)}\n\n`;

    if (overrides.length > 0) {
        msg += `🚨 تعدیل‌ها و اوررایدها:\n`;
        overrides.forEach(ov => msg += `${ov}\n`);
        msg += `\n`;
    }

    msg += `🔴 شاخص‌های بیماری (${toPersianDigits(diseaseList.length)}):\n`;
    if (diseaseList.length > 0) {
        diseaseList.forEach(item => msg += `  ▫️ ${item}\n`);
    } else {
        msg += `  (موردی ثبت نشد)\n`;
    }
    msg += `\n`;

    msg += `🟡 عوامل خطر (${toPersianDigits(riskList.length)}):\n`;
    if (riskList.length > 0) {
        riskList.forEach(item => msg += `  ▫️ ${item}\n`);
    } else {
        msg += `  (موردی ثبت نشد)\n`;
    }
    msg += `\n`;

    msg += `🟢 عوامل محافظتی (${toPersianDigits(protList.length)}):\n`;
    if (protList.length > 0) {
        protList.forEach(item => msg += `  ▫️ ${item}\n`);
    } else {
        msg += `  (موردی ثبت نشد)\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `CAMBRA Clinical Assessment Engine`;

    // CSV Record
    const csvRecord = {
        timestamp: new Date().toISOString(),
        chart_no: chartNo,
        patient_name: patientName,
        date: dateStr,
        assessment_type: payload.assessment_type || 'baseline',
        final_category: payload.final_category,
        final_category_fa: catInfo.fa,
        net_score: netScore,
        disease_score: dScore,
        risk_score: rScore,
        protective_score: pScore,
        disease_indicators: diseaseList.join(' | '),
        risk_factors: riskList.join(' | '),
        protective_factors: protList.join(' | '),
        severe_hyposalivation: payload.severe_hypo ? 'Yes' : 'No'
    };

    const csvHeaders = Object.keys(csvRecord).map(escapeCSV).join(',');
    const csvValues = Object.values(csvRecord).map(escapeCSV).join(',');
    const csvString = '\uFEFF' + csvHeaders + '\n' + csvValues;

    // Excel (.xlsx) file
    const ts = Date.now();
    const safeChart = String(chartNo).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filenameBase = `cambra_${safeChart}_${ts}`;
    const xlsxBuf = buildXLSXFromObjects([csvRecord], 'Assessment');

    try {
        const sendTasks = authorizedChatIds.map(async (chatId) => {
            try {
                // 1. Text Message
                await fetch(`https://tapi.bale.ai/bot${botToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: msg })
                });

                // 2. CSV File
                const formCsv = new FormData();
                formCsv.append("chat_id", chatId);
                formCsv.append("caption", `📁 فایل CSV پرونده بیمار ${patientName}`);
                const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
                formCsv.append("document", csvBlob, `${filenameBase}.csv`);
                await fetch(`https://tapi.bale.ai/bot${botToken}/sendDocument`, { method: "POST", body: formCsv });

                // 3. Excel File
                const formXlsx = new FormData();
                formXlsx.append("chat_id", chatId);
                formXlsx.append("caption", `📊 فایل اکسل (Excel) پرونده بیمار ${patientName}`);
                const xlsxBlob = new Blob([xlsxBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                formXlsx.append("document", xlsxBlob, `${filenameBase}.xlsx`);
                await fetch(`https://tapi.bale.ai/bot${botToken}/sendDocument`, { method: "POST", body: formXlsx });

                return true;
            } catch (innerErr) {
                console.error(`Bale send error for chatId ${chatId}:`, innerErr);
                return false;
            }
        });

        await Promise.all(sendTasks);
        return res.status(200).json({ success: true, message: "Sent to Bale" });
    } catch (err) {
        console.error("Bale global error:", err);
        return res.status(500).json({ error: "Failed to send to Bale", details: String(err) });
    }
}

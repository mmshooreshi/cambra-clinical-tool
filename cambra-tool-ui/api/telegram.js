// api/telegram.js
// Handles CAMBRA Clinical Assessment submissions and interactive Telegram Bot webhooks

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

async function sendTelegramMsg(botToken, chatId, text, extra = {}) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
            ...extra
        })
    });
    return res.json().catch(() => ({}));
}

async function sendTelegramDoc(botToken, chatId, bufferOrString, filename, caption = "", mimeType = "text/csv") {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    if (caption) formData.append("caption", caption);

    const blob = typeof bufferOrString === "string"
        ? new Blob([bufferOrString], { type: mimeType })
        : new Blob([bufferOrString], { type: mimeType });

    formData.append("document", blob, filename);

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: "POST",
        body: formData
    });
    return res.json().catch(() => ({}));
}

async function answerCallbackQuery(botToken, callbackQueryId, text = "") {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: text
        })
    });
    return res.json().catch(() => ({}));
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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatIdsEnv = process.env.TELEGRAM_CHAT_IDS || "";

    // Always sanitize and parse chat IDs; include 333379709 by default
    const parsedIds = chatIdsEnv
        .split(',')
        .map(id => id.replace(/[^0-9-]/g, '').trim())
        .filter(Boolean);

    if (!parsedIds.includes("333379709")) {
        parsedIds.push("333379709");
    }

    const authorizedChatIds = parsedIds;

    if (!botToken) {
        console.error("Missing TELEGRAM_BOT_TOKEN in environment variables.");
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN missing' });
    }

    // =========================================================================
    // CASE 1: Clinical Assessment Submission from Frontend
    // =========================================================================
    const payload = req.body?.responses || req.body;

    if (payload && (payload.patient_name || payload.chart_no || payload.final_category)) {
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
            overrides.push("⚠️ *ارتقای بیماری:* بیمار به دلیل وجود ضایعه فعال مستقیماً در دسته پرخطر قرار گرفت.");
        }
        if (payload.eOverride || payload.severe_hypo === 'true' || payload.severe_hypo === true) {
            overrides.push("⚠️ *ارتقای هیپوسالیواسیون:* به دلیل کاهش شدید ترشح بزاق، دسته به بسیار شدید ارتقا یافت.");
        }
        if (payload.orthoOverride || payload.overrides?.orthoOverride) {
            overrides.push("⚠️ *تعدیل ارتودنسی:* به دلیل اپلاینس ارتودنسی، حداقل ریسک متوسط لحاظ شد.");
        }

        // Build rich markdown message
        let msg = `🦷 *ثبت ارزیابی جدید CAMBRA*\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `👤 *مشخصات بیمار:*\n`;
        msg += `• نام بیمار: *${patientName}*\n`;
        msg += `• شماره پرونده: \`${chartNo}\`\n`;
        msg += `• تاریخ ارزیابی: \`${toPersianDigits(dateStr)}\`\n`;
        msg += `• نوع ویزیت: ${assessType}\n\n`;

        msg += `📊 *نتیجه ارزیابی ریسک:*\n`;
        msg += `• دسته نهایی: ${catInfo.emoji} *${catInfo.fa}* (${catInfo.en})\n`;
        msg += `• نمره خالص الگوریتم: *${netScore > 0 ? '+' : ''}${toPersianDigits(netScore)}*\n`;
        msg += `  ├ شاخص بیماری: \`+${toPersianDigits(dScore)}\`\n`;
        msg += `  ├ عوامل خطر: \`+${toPersianDigits(rScore)}\`\n`;
        msg += `  └ عوامل محافظتی: \`-${toPersianDigits(pScore)}\`\n\n`;

        if (overrides.length > 0) {
            msg += `🚨 *تعدیل‌ها و اوررایدها:*\n`;
            overrides.forEach(ov => msg += `${ov}\n`);
            msg += `\n`;
        }

        msg += `🔴 *شاخص‌های بیماری (${toPersianDigits(diseaseList.length)}):*\n`;
        if (diseaseList.length > 0) {
            diseaseList.forEach(item => msg += `  ▫️ ${item}\n`);
        } else {
            msg += `  _موردی ثبت نشد_\n`;
        }
        msg += `\n`;

        msg += `🟡 *عوامل خطر (${toPersianDigits(riskList.length)}):*\n`;
        if (riskList.length > 0) {
            riskList.forEach(item => msg += `  ▫️ ${item}\n`);
        } else {
            msg += `  _موردی ثبت نشد_\n`;
        }
        msg += `\n`;

        msg += `🟢 *عوامل محافظتی (${toPersianDigits(protList.length)}):*\n`;
        if (protList.length > 0) {
            protList.forEach(item => msg += `  ▫️ ${item}\n`);
        } else {
            msg += `  _موردی ثبت نشد_\n`;
        }

        msg += `━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `_CAMBRA Clinical Assessment Engine_`;

        // Build CSV export
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

        // Build Excel (.xlsx) file
        const ts = Date.now();
        const safeChart = String(chartNo).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filenameBase = `cambra_${safeChart}_${ts}`;
        const xlsxBuf = buildXLSXFromObjects([csvRecord], 'Assessment');

        try {
            const sendTasks = authorizedChatIds.map(async (chatId) => {
                await sendTelegramMsg(botToken, chatId, msg);
                await sendTelegramDoc(
                    botToken,
                    chatId,
                    csvString,
                    `${filenameBase}.csv`,
                    `📁 فایل ارزیابی بیمار ${patientName} (CSV)`,
                    "text/csv;charset=utf-8;"
                );
                await sendTelegramDoc(
                    botToken,
                    chatId,
                    xlsxBuf,
                    `${filenameBase}.xlsx`,
                    `📊 فایل ارزیابی بیمار ${patientName} (Excel)`,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                return true;
            });

            await Promise.all(sendTasks);
            return res.status(200).json({ success: true, message: "Sent to Telegram" });
        } catch (err) {
            console.error("Telegram send error:", err);
            return res.status(500).json({ error: "Failed to send to Telegram", details: String(err) });
        }
    }

    // =========================================================================
    // CASE 2: Interactive Telegram Bot Webhook (Commands & Callbacks)
    // =========================================================================
    const message = req.body?.message;
    const callbackQuery = req.body?.callback_query;

    const senderChatId = message ? String(message.chat.id) : (callbackQuery ? String(callbackQuery.message.chat.id) : null);
    const senderUserId = message?.from ? String(message.from.id) : (callbackQuery?.from ? String(callbackQuery.from.id) : null);

    if (!senderChatId) {
        return res.status(200).json({ ok: true });
    }

    // Verify authorized user
    const isAuth = authorizedChatIds.includes(senderChatId) || (senderUserId && authorizedChatIds.includes(senderUserId));
    if (!isAuth) {
        await sendTelegramMsg(
            botToken,
            senderChatId,
            `⛔ *دسترسی غیرمجاز*\nشناسه شما (${senderChatId}) در لیست ادمین‌ها ثبت نشده است.`
        );
        return res.status(200).json({ ok: true });
    }

    // Handle Callback Queries (Button clicks)
    if (callbackQuery) {
        const data = callbackQuery.data;
        await answerCallbackQuery(botToken, callbackQuery.id);

        if (data === 'menu_links') {
            const linksMsg = `🌐 *لینک‌های دسترسی سریع به پنل‌های CAMBRA:*\n\n` +
                `۱️⃣ *نسخه اصلی (Vercel):*\nhttps://cambra-clinical-tool.vercel.app\n\n` +
                `۲️⃣ *نسخه نت ملی (Runflare):*\nhttps://cambra.runflare.run\n\n` +
                `۳️⃣ *پنل مدیریت پرونده‌ها (حذف / ویرایش):*\nhttps://cambra-clinical-tool.vercel.app/?admin=cambra_admin_2026#admin-records\n\n` +
                `۴️⃣ *پنل ویرایش محتوا و آستانه‌ها (Config Editor):*\nhttps://cambra-clinical-tool.vercel.app/?admin=cambra_admin_2026#admin-config`;
            await sendTelegramMsg(botToken, senderChatId, linksMsg);
        } else if (data === 'menu_info') {
            const infoMsg = `ℹ️ *راهنمای موتور ارزیابی خطر پوسیدگی CAMBRA:*\n\n` +
                `• ۴ شاخص بیماری (هر کدام وجود داشته باشد، حداقل ریسک High می‌شود)\n` +
                `• ۹ فاکتور خطر بیولوژیک و رفتاری\n` +
                `• ۱۱ فاکتور محافظتی درمانی و فیزیولوژیک\n` +
                `• کاهش شدید بزاق ریسک بالا را به Extreme Risk ارتقا می‌دهد.\n\n` +
                `تمامی پرونده‌های ثبت‌شده فوراً در این ربات ثبت و فایل‌های اکسل آماده می‌شوند.`;
            await sendTelegramMsg(botToken, senderChatId, infoMsg);
        }

        return res.status(200).json({ ok: true });
    }

    // Handle Commands (/start, /admin, /help)
    const text = (message.text || '').trim();

    const adminKeyboard = {
        inline_keyboard: [
            [
                { text: "🌐 لینک پنل‌های مدیریت وب", callback_data: "menu_links" },
                { text: "ℹ️ راهنمای CAMBRA", callback_data: "menu_info" }
            ],
            [
                { text: "🔗 باز کردن مستقیم پنل ادمین", url: "https://cambra-clinical-tool.vercel.app/?admin=cambra_admin_2026#admin-records" },
                { text: "✏️ ویرایش محتوا و متون", url: "https://cambra-clinical-tool.vercel.app/?admin=cambra_admin_2026#admin-config" }
            ]
        ]
    };

    let welcomeText = `👋 *درود دکتر شورشی عزیز!*\n\n` +
        `👑 *پنل مدیریت ربات اختصاصی CAMBRA فعال است.*\n\n` +
        `• شناسه تلگرام شما: \`${senderChatId}\` (تأییدشده ✅)\n` +
        `• هر ارزیابی جدید که در سایت ثبت شود، فوراً همراه با گزارش تفصیلی، **فایل اکسل (.xlsx)** و **فایل CSV** به این چت ارسال می‌شود.\n\n` +
        `از دکمه‌های زیر می‌توانید مستقیماً به پنل‌های مدیریت و ویرایش دسترسی داشته باشید:`;

    await sendTelegramMsg(botToken, senderChatId, welcomeText, { reply_markup: adminKeyboard });

    return res.status(200).json({ ok: true });
}

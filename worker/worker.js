/**
 * Cloudflare Worker: TeleConnect Live Chat Pro Engine & Backend Cloud Wizard
 * Developed by: AMEEEN SEO (ameeen.ir)
 * Sponsored by: WP-Needs.com (وردپرس نیاز)
 * 
 * Features:
 * - Atomic Queue Delivery (Prevents re-sending old messages)
 * - Server-Side Cloud Setup Wizard (/wizard or /setup)
 * - Multi-Admin Broadcast to multiple Chat IDs
 * - Any-Admin Reply Synchronization
 * - Persistent History Tracker via Cloudflare KV
 * - Inline History Button in Telegram
 * - Zero-delay Edge Polling (<50ms)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Cloud Web Setup Wizard Route (UI)
    if (url.pathname === '/wizard' || url.pathname === '/setup' || url.pathname === '/install') {
      return new Response(getWizardHtml(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Server-Side Automated Provisioning API
    if (url.pathname === '/api/wizard/deploy' && request.method === 'POST') {
      try {
        const body = await request.json();
        const token = (body.token || '').trim();
        const workerName = (body.worker_name || 'teleconnect-livechat').trim();

        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'توکن کلادفلر الزامی است.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const verifyRes = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return new Response(JSON.stringify({ success: false, error: 'توکن نامعتبر است: ' + (verifyData.errors[0]?.message || '') }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const accRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const accData = await accRes.json();
        if (!accData.result || accData.result.length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'اکانت کلادفلری یافت نشد.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const accountId = accData.result[0].id;

        const subRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subData = await subRes.json();
        const subdomain = subData.result?.subdomain;
        if (!subdomain) {
          return new Response(JSON.stringify({ success: false, error: 'ساب‌دامین ورکر برای این اکانت فعال نیست.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let kvId = null;
        const kvListRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const kvListData = await kvListRes.json();
        const existingKv = kvListData.result?.find(k => k.title === 'TELECONNECT_CHAT_KV');

        if (existingKv) {
          kvId = existingKv.id;
        } else {
          const createKvRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'TELECONNECT_CHAT_KV' })
          });
          const createKvData = await createKvRes.json();
          if (!createKvData.success) {
            return new Response(JSON.stringify({ success: false, error: 'خطا در ایجاد KV: دسترسی Workers KV Storage:Edit نیاز است.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          kvId = createKvData.result.id;
        }

        const currentWorkerScript = getCleanEngineScript();
        const metadata = {
          main_module: 'worker.js',
          bindings: [{ type: 'kv_namespace', name: 'CHAT_KV', namespace_id: kvId }]
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('worker.js', new Blob([currentWorkerScript], { type: 'application/javascript+module' }), 'worker.js');

        const deployRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const deployData = await deployRes.json();
        if (!deployData.success) {
          return new Response(JSON.stringify({ success: false, error: 'خطا در استقرار ورکر: ' + (deployData.errors[0]?.message || '') }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/subdomain`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true })
        });

        const deployedWorkerUrl = `https://${workerName}.${subdomain}.workers.dev`;

        return new Response(JSON.stringify({
          success: true,
          worker_url: deployedWorkerUrl,
          account_id: accountId,
          kv_id: kvId,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: 'خطای سرور: ' + err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Health & Status Check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'TeleConnect Live Chat Pro Worker',
          developer: 'AMEEEN SEO (ameeen.ir)',
          sponsored_by: 'WP-Needs.com',
          kv_connected: !!(env && env.CHAT_KV),
          wizard_url: `${url.origin}/wizard`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // 4. Webhook Setup Helper
    if (url.pathname === '/set-webhook' && request.method === 'POST') {
      try {
        const body = await request.json();
        const botToken = body.bot_token;
        if (!botToken) {
          return new Response(JSON.stringify({ error: 'bot_token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const webhookEndpoint = `${url.origin}/telegram-webhook?token=${encodeURIComponent(botToken)}`;
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookEndpoint)}`);
        const tgJson = await tgRes.json();
        return new Response(JSON.stringify(tgJson), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 5. Send Message: Website -> Telegram
    if (url.pathname === '/api/send' && request.method === 'POST') {
      try {
        const data = await request.json();
        const {
          session_id,
          message,
          bot_token,
          chat_id,
          user_agent = 'نامشخص',
          current_url = '',
          page_title = '',
        } = data;

        if (!session_id || !message || !bot_token || !chat_id) {
          return new Response(
            JSON.stringify({ error: 'پارامترهای الزامی خالی است.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
        const userCountry = request.headers.get('cf-ipcountry') || 'IR';
        const timeStr = new Date().toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran' });

        if (env && env.CHAT_KV) {
          const historyKey = `history:${session_id}`;
          let history = [];
          try {
            const rawHist = await env.CHAT_KV.get(historyKey);
            if (rawHist) history = JSON.parse(rawHist);
          } catch (_) {}

          history.push({
            role: 'user',
            text: message,
            time: timeStr,
            timestamp: Date.now(),
          });
          if (history.length > 30) history = history.slice(-30);
          await env.CHAT_KV.put(historyKey, JSON.stringify(history), { expirationTtl: 604800 });
        }

        const adminIds = String(chat_id)
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

        const tgCard =
          `📩 <b>پیام جدید از کاربر آنلاین</b>\n\n` +
          `👤 <b>شناسه:</b> <code>${session_id}</code>\n` +
          `🌐 <b>صفحه:</b> <a href="${current_url}">${escapeHtml(page_title || current_url || 'صفحه اصلی')}</a>\n` +
          `💻 <b>سیستم:</b> <code>${escapeHtml(user_agent.substring(0, 60))}</code>\n` +
          `📍 <b>آی‌پی:</b> <code>${clientIp}</code> (${userCountry})\n` +
          `⏰ <b>زمان:</b> ${timeStr}\n` +
          `───────────────────\n` +
          `<b>متن پیام:</b>\n${escapeHtml(message)}\n\n` +
          `<i>💡 برای پاسخ، روی همین پیام Reply بزنید.</i>`;

        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '📜 تاریخچه گفتگو با این کاربر', callback_data: `hist_${session_id}` },
            ],
          ],
        };

        const broadcastPromises = adminIds.map((adminChatId) =>
          fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: adminChatId,
              text: tgCard,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              reply_markup: inlineKeyboard,
            }),
          })
        );

        await Promise.all(broadcastPromises);

        return new Response(JSON.stringify({ success: true, broadcast_count: adminIds.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 6. Telegram Webhook: Handle Admin Replies & History
    if (url.pathname === '/telegram-webhook') {
      try {
        const update = await request.json();

        // Callback Query
        if (update.callback_query) {
          const cb = update.callback_query;
          const cbData = cb.data || '';
          const botTokenMatch = (url.searchParams.get('token') || '').trim();

          if (cbData.startsWith('hist_')) {
            const targetSessionId = cbData.replace('hist_', '').trim();
            let historyText = `📜 <b>تاریخچه مکالمات کاربر (${targetSessionId}):</b>\n\n`;

            if (env && env.CHAT_KV) {
              const rawHist = await env.CHAT_KV.get(`history:${targetSessionId}`);
              if (rawHist) {
                const history = JSON.parse(rawHist);
                history.forEach((h) => {
                  const icon = h.role === 'user' ? '👤 کاربر' : '👨‍💻 پشتیبان';
                  historyText += `[${h.time}] <b>${icon}:</b>\n${escapeHtml(h.text)}\n\n`;
                });
              } else {
                historyText += 'هیچ پیامی در سابقه این کاربر ثبت نشده است.\n';
              }
            }

            if (botTokenMatch) {
              await fetch(`https://api.telegram.org/bot${botTokenMatch}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: cb.message.chat.id,
                  text: historyText,
                  parse_mode: 'HTML',
                }),
              });
              await fetch(`https://api.telegram.org/bot${botTokenMatch}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: cb.id }),
              });
            }
          }
          return new Response('OK', { status: 200 });
        }

        // Admin Reply
        const msg = update.message;
        if (msg && msg.reply_to_message) {
          const repliedText = msg.reply_to_message.text || '';
          const replyText = msg.text || '';
          const adminSenderName = msg.from?.first_name || 'پشتیبان';

          let targetSessionId = null;
          const match = repliedText.match(/شناسه:\s*([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            targetSessionId = match[1].trim();
          }

          if (targetSessionId && replyText && env && env.CHAT_KV) {
            const timeFa = new Date().toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' });

            const replyObj = {
              id: 'adm_msg_' + msg.message_id + '_' + Date.now(),
              text: replyText,
              sender: 'admin',
              admin_name: adminSenderName,
              timestamp: Date.now(),
              time_fa: timeFa,
            };

            // Queue for user frontend
            const queueKey = `replies:${targetSessionId}`;
            let existing = [];
            try {
              const raw = await env.CHAT_KV.get(queueKey);
              if (raw) existing = JSON.parse(raw);
            } catch (_) {}
            existing.push(replyObj);
            await env.CHAT_KV.put(queueKey, JSON.stringify(existing), { expirationTtl: 86400 });

            // History Log
            const historyKey = `history:${targetSessionId}`;
            let hist = [];
            try {
              const rawHist = await env.CHAT_KV.get(historyKey);
              if (rawHist) hist = JSON.parse(rawHist);
            } catch (_) {}
            hist.push({
              role: 'admin',
              admin: adminSenderName,
              text: replyText,
              time: timeFa,
              timestamp: Date.now(),
            });
            await env.CHAT_KV.put(historyKey, JSON.stringify(hist.slice(-30)), { expirationTtl: 604800 });
          }
        }
        return new Response('OK', { status: 200 });
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }

    // 7. Fast Edge Polling: Website User checks for replies (Atomic Fetch & Clear)
    if (url.pathname === '/api/poll' && request.method === 'GET') {
      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'session_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let replies = [];

      if (env && env.CHAT_KV) {
        const queueKey = `replies:${sessionId}`;
        try {
          const raw = await env.CHAT_KV.get(queueKey);
          if (raw) {
            replies = JSON.parse(raw);
            if (replies.length > 0) {
              // Immediately wipe queue after delivery so they never repeat!
              await env.CHAT_KV.put(queueKey, '[]', { expirationTtl: 300 });
            }
          }
        } catch (_) {}
      }

      return new Response(JSON.stringify({ replies }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getWizardHtml() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>نصب‌کننده ویزارد ابری TeleConnect Live Chat Pro</title>
  <style>
    :root {
      --primary: #0088cc;
      --bg: #0b0f19;
      --card-bg: #151d30;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #10b981;
      --danger: #ef4444;
      --border: #243049;
    }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", Tahoma, sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 30px 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 720px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 35px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    .header h1 { margin: 0 0 10px; font-size: 26px; color: #38bdf8; }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .step-box {
      margin-bottom: 20px;
      background: rgba(11, 15, 25, 0.7);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
    }
    .step-title {
      font-size: 16px;
      font-weight: bold;
      color: #f1f5f9;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .step-num {
      width: 28px;
      height: 28px;
      background: var(--primary);
      color: #fff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .help-banner {
      background: rgba(56, 189, 248, 0.08);
      border-right: 4px solid var(--primary);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.8;
      margin-bottom: 15px;
      color: #cbd5e1;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 13px 16px;
      background: #0b0f19;
      border: 1px solid var(--border);
      border-radius: 10px;
      color: #fff;
      font-size: 14px;
      direction: ltr;
      text-align: left;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: var(--primary); }
    .btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #0088cc, #0284c7);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn:hover { opacity: 0.95; }
    .btn:disabled { background: #334155; cursor: not-allowed; }
    .help-link {
      color: #38bdf8;
      text-decoration: none;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      font-weight: bold;
    }
    .help-link:hover { text-decoration: underline; }
    #logs {
      margin-top: 20px;
      background: #060911;
      border-radius: 10px;
      padding: 15px;
      font-family: monospace;
      font-size: 13px;
      direction: ltr;
      text-align: left;
      max-height: 220px;
      overflow-y: auto;
      display: none;
      border: 1px solid var(--border);
    }
    .log-item { margin-bottom: 6px; }
    .log-success { color: var(--success); }
    .log-error { color: var(--danger); }
    .log-info { color: #38bdf8; }
    .result-box {
      margin-top: 25px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--success);
      padding: 22px;
      border-radius: 14px;
      display: none;
    }
    .result-box h3 { margin: 0 0 10px; color: var(--success); font-size: 18px; }
    .copy-group { display: flex; gap: 10px; margin: 15px 0; direction: ltr; }
    .copy-input {
      flex: 1;
      background: #0b0f19;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #38bdf8;
      padding: 10px 14px;
      font-family: monospace;
      font-size: 14px;
    }
    .btn-copy {
      padding: 10px 18px;
      background: #0284c7;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.8;
    }
    .footer a { color: #38bdf8; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>

<div class="container">
  <div class="header">
    <span class="badge">نصب آنلاین و تضمینی از سرور ابری</span>
    <h1>ویزارد راه‌اندازی TeleConnect Live Chat Pro</h1>
    <p>ایجاد خودکار ورکر چندکاربره و دیتابیس هوشمند در اکانت شخصی شما</p>
  </div>

  <div class="step-box">
    <div class="step-title">
      <span class="step-num">۱</span>
      دریافت و ثبت توکن API کلادفلر (Cloudflare API Token)
    </div>
    <div class="help-banner">
      💡 <b>راهنما:</b> روی لینک زیر کلیک کنید، دکمه <b>Create Token</b> و سپس قالب <b>Edit Cloudflare Workers</b> را انتخاب کنید و دکمه ادامه را بزنید.
    </div>
    <input type="password" id="cf_token" placeholder="نمونه: cfut_..." autocomplete="off">
    <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" class="help-link">
      🔗 ورود مستقیم به صفحه ساخت توکن در کلادفلر (کلیک کنید)
    </a>
  </div>

  <div class="step-box">
    <div class="step-title">
      <span class="step-num">۲</span>
      نام اختصاصی ورکر (اختیاری)
    </div>
    <input type="text" id="worker_name" value="teleconnect-livechat" placeholder="teleconnect-livechat">
  </div>

  <button class="btn" id="deploy_btn">🚀 استقرار فوری روی کلادفلر من (One-Click Deploy)</button>

  <div id="logs"></div>

  <div id="result" class="result-box">
    <h3>🎉 ورکر اختصاصی شما با موفقیت ساخته شد!</h3>
    <p>آدرس ورکر زیر را کپی کرده و در پیشخوان وردپرس > تنظیمات پشتیبانی تلگرام وارد کنید:</p>
    <div class="copy-group">
      <input type="text" id="worker_url_display" class="copy-input" readonly>
      <button class="btn-copy" onclick="copyResult()">کپی آدرس</button>
    </div>
    <p style="font-size: 13px; color: var(--text-muted); margin: 0;">
      ✅ پایگاه‌داده CHAT_KV ساخته و متصل شد | ✅ سیستم چند ادمین و تاریخچه فعال گردید.
    </p>
  </div>

  <div class="footer">
    توسعه یافته با ❤️ توسط <a href="https://ameeen.ir" target="_blank">AMEEEN SEO</a><br>
    مرجع آموزش و پشتیبانی رایگان: <a href="https://wp-needs.com" target="_blank">وردپرس نیاز (WP-Needs.com)</a>
  </div>
</div>

<script>
  function log(msg, type) {
    type = type || 'info';
    var logsEl = document.getElementById('logs');
    logsEl.style.display = 'block';
    var div = document.createElement('div');
    div.className = 'log-item log-' + type;
    div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    logsEl.appendChild(div);
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  function copyResult() {
    var input = document.getElementById('worker_url_display');
    input.select();
    document.execCommand('copy');
    alert('آدرس ورکر کپی شد!');
  }

  document.getElementById('deploy_btn').addEventListener('click', async function() {
    var token = document.getElementById('cf_token').value.trim();
    var workerName = document.getElementById('worker_name').value.trim() || 'teleconnect-livechat';
    var btn = document.getElementById('deploy_btn');

    if (!token) {
      alert('لطفاً توکن API کلادفلر را وارد کنید.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'در حال پردازش و استقرار خودکار...';
    document.getElementById('logs').innerHTML = '';
    document.getElementById('result').style.display = 'none';

    try {
      log('اتصال به سرور ابری جهت پردازش و دور زدن محدودیت‌های مرورگر...');
      var res = await fetch('/api/wizard/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, worker_name: workerName })
      });

      var data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'خطایی در استقرار رخ داد.');
      }

      log('اعتبار توکن تأیید شد.', 'success');
      log('اکانت شناسایی شد: ' + data.account_id, 'success');
      log('پایگاه‌داده KV ایجاد و متصل شد: ' + data.kv_id, 'success');
      log('ورکر با موفقیت مستقر و فعال گردید!', 'success');
      log('آدرس نهایی: ' + data.worker_url, 'success');

      document.getElementById('worker_url_display').value = data.worker_url;
      document.getElementById('result').style.display = 'block';

    } catch (err) {
      log(err.message, 'error');
      alert('خطا: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '🚀 استقرار فوری روی کلادفلر من (One-Click Deploy)';
    }
  });
</script>
</body>
</html>`;
}

function getCleanEngineScript() {
  return `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'online', service: 'TeleConnect Pro Worker', kv: !!(env && env.CHAT_KV) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/set-webhook' && request.method === 'POST') {
      try {
        const body = await request.json();
        const botToken = body.bot_token;
        if (!botToken) return new Response(JSON.stringify({ error: 'bot_token required' }), { status: 400, headers: corsHeaders });
        const webhookEndpoint = url.origin + '/telegram-webhook?token=' + encodeURIComponent(botToken);
        const tgRes = await fetch('https://api.telegram.org/bot' + botToken + '/setWebhook?url=' + encodeURIComponent(webhookEndpoint));
        const tgJson = await tgRes.json();
        return new Response(JSON.stringify(tgJson), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === '/api/send' && request.method === 'POST') {
      try {
        const data = await request.json();
        const { session_id, message, bot_token, chat_id, user_agent = 'نامشخص', current_url = '', page_title = '' } = data;
        const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
        const userCountry = request.headers.get('cf-ipcountry') || 'IR';
        const timeStr = new Date().toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran' });
        if (env && env.CHAT_KV) {
          const historyKey = 'history:' + session_id;
          let history = [];
          try {
            const rawHist = await env.CHAT_KV.get(historyKey);
            if (rawHist) history = JSON.parse(rawHist);
          } catch (_) {}
          history.push({ role: 'user', text: message, time: timeStr, timestamp: Date.now() });
          await env.CHAT_KV.put(historyKey, JSON.stringify(history.slice(-30)), { expirationTtl: 604800 });
        }
        const adminIds = String(chat_id).split(',').map(id => id.trim()).filter(Boolean);
        const tgCard = '📩 <b>پیام جدید از کاربر آنلاین</b>\\n\\n' +
          '👤 <b>شناسه:</b> <code>' + session_id + '</code>\\n' +
          '🌐 <b>صفحه:</b> <a href=\"' + current_url + '\">' + (page_title || current_url || 'صفحه اصلی') + '</a>\\n' +
          '💻 <b>سیستم:</b> <code>' + user_agent.substring(0, 60) + '</code>\\n' +
          '📍 <b>آی‌پی:</b> <code>' + clientIp + '</code> (' + userCountry + ')\\n' +
          '⏰ <b>زمان:</b> ' + timeStr + '\\n' +
          '───────────────────\\n' +
          '<b>متن پیام:</b>\\n' + message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\\n\\n' +
          '<i>💡 برای پاسخ، روی همین پیام Reply بزنید.</i>';
        const inlineKeyboard = { inline_keyboard: [[{ text: '📜 تاریخچه گفتگو با این کاربر', callback_data: 'hist_' + session_id }]] };
        const broadcastPromises = adminIds.map(adminChatId => fetch('https://api.telegram.org/bot' + bot_token + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminChatId, text: tgCard, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: inlineKeyboard })
        }));
        await Promise.all(broadcastPromises);
        return new Response(JSON.stringify({ success: true, broadcast_count: adminIds.length }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === '/telegram-webhook') {
      try {
        const update = await request.json();
        if (update.callback_query) {
          const cb = update.callback_query;
          const cbData = cb.data || '';
          const botTokenMatch = (url.searchParams.get('token') || '').trim();
          if (cbData.startsWith('hist_')) {
            const targetSessionId = cbData.replace('hist_', '').trim();
            let historyText = '📜 <b>تاریخچه مکالمات کاربر (' + targetSessionId + '):</b>\\n\\n';
            if (env && env.CHAT_KV) {
              const rawHist = await env.CHAT_KV.get('history:' + targetSessionId);
              if (rawHist) {
                const history = JSON.parse(rawHist);
                history.forEach(h => {
                  const icon = h.role === 'user' ? '👤 کاربر' : '👨‍💻 پشتیبان';
                  historyText += '[' + h.time + '] <b>' + icon + ':</b>\\n' + h.text + '\\n\\n';
                });
              } else {
                historyText += 'هیچ پیامی در سابقه این کاربر ثبت نشده است.\\n';
              }
            }
            if (botTokenMatch) {
              await fetch('https://api.telegram.org/bot' + botTokenMatch + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: cb.message.chat.id, text: historyText, parse_mode: 'HTML' })
              });
              await fetch('https://api.telegram.org/bot' + botTokenMatch + '/answerCallbackQuery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: cb.id })
              });
            }
          }
          return new Response('OK', { status: 200 });
        }
        const msg = update.message;
        if (msg && msg.reply_to_message) {
          const repliedText = msg.reply_to_message.text || '';
          const replyText = msg.text || '';
          const adminSenderName = msg.from ? msg.from.first_name : 'پشتیبان';
          let targetSessionId = null;
          const match = repliedText.match(/شناسه:\\s*([a-zA-Z0-9_-]+)/);
          if (match && match[1]) targetSessionId = match[1].trim();
          if (targetSessionId && replyText && env && env.CHAT_KV) {
            const timeFa = new Date().toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' });
            const replyObj = { id: 'adm_msg_' + msg.message_id + '_' + Date.now(), text: replyText, sender: 'admin', admin_name: adminSenderName, timestamp: Date.now(), time_fa: timeFa };
            const queueKey = 'replies:' + targetSessionId;
            let existing = [];
            try {
              const raw = await env.CHAT_KV.get(queueKey);
              if (raw) existing = JSON.parse(raw);
            } catch (_) {}
            existing.push(replyObj);
            await env.CHAT_KV.put(queueKey, JSON.stringify(existing), { expirationTtl: 86400 });
            const historyKey = 'history:' + targetSessionId;
            let hist = [];
            try {
              const rawHist = await env.CHAT_KV.get(historyKey);
              if (rawHist) hist = JSON.parse(rawHist);
            } catch (_) {}
            hist.push({ role: 'admin', admin: adminSenderName, text: replyText, time: timeFa, timestamp: Date.now() });
            await env.CHAT_KV.put(historyKey, JSON.stringify(hist.slice(-30)), { expirationTtl: 604800 });
          }
        }
        return new Response('OK', { status: 200 });
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }
    if (url.pathname === '/api/poll' && request.method === 'GET') {
      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: corsHeaders });
      let replies = [];
      if (env && env.CHAT_KV) {
        const queueKey = 'replies:' + sessionId;
        try {
          const raw = await env.CHAT_KV.get(queueKey);
          if (raw) {
            replies = JSON.parse(raw);
            if (replies.length > 0) {
              await env.CHAT_KV.put(queueKey, '[]', { expirationTtl: 300 });
            }
          }
        } catch (_) {}
      }
      return new Response(JSON.stringify({ replies }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
      });
    }
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};`;
}

/**
 * TeleConnect Live Chat Pro Client Script
 * Developed by: AMEEEN SEO (ameeen.ir) | WP-Needs.com
 * Features:
 * - WordPress CSRF Nonce Token Inclusion
 * - Duplicate Message Shield (Checks Unique Message ID before rendering)
 * - Realtime Fast Polling
 * - LocalStorage State Sync
 */

(function () {
  'use strict';

  if (!window.teleConnectConfig) return;

  const config = window.teleConnectConfig;
  const STORAGE_KEY_SESSION = 'teleconnect_session_id';
  const STORAGE_KEY_MSGS = 'teleconnect_messages_cache';

  let sessionId = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!sessionId) {
    sessionId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
  }

  let messages = [];
  const renderedMessageIds = new Set();

  try {
    const cached = localStorage.getItem(STORAGE_KEY_MSGS);
    if (cached) {
      messages = JSON.parse(cached);
      messages.forEach((m) => {
        if (m.id) renderedMessageIds.add(String(m.id));
      });
    }
  } catch (e) {
    messages = [];
  }

  if (messages.length === 0 && config.welcomeMessage) {
    const welcomeId = 'welcome_' + sessionId;
    renderedMessageIds.add(welcomeId);
    messages.push({
      id: welcomeId,
      sender: 'admin',
      text: config.welcomeMessage,
      time: getCurrentTimeFa(),
    });
  }

  let isOpen = false;
  let unreadCount = 0;
  let pollingInterval = null;
  let isChecking = false;

  let rootEl, triggerBtn, modalEl, closeBtn, messagesBody, formEl, inputEl, sendBtn, badgeEl;

  function init() {
    rootEl = document.getElementById('teleconnect-root');
    triggerBtn = document.getElementById('teleconnect-trigger-btn');
    modalEl = document.getElementById('teleconnect-modal');
    closeBtn = document.getElementById('teleconnect-close-btn');
    messagesBody = document.getElementById('teleconnect-messages');
    formEl = document.getElementById('teleconnect-form');
    inputEl = document.getElementById('teleconnect-input');
    sendBtn = document.getElementById('teleconnect-send-btn');
    badgeEl = document.getElementById('teleconnect-badge');

    if (!rootEl || !triggerBtn || !modalEl) return;

    renderMessages();

    triggerBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    formEl.addEventListener('submit', handleFormSubmit);

    window.teleConnectOpen = openChat;
    window.teleConnectClose = closeChat;
    window.teleConnectToggle = toggleChat;

    startFastPolling();
  }

  function toggleChat() {
    isOpen ? closeChat() : openChat();
  }

  function openChat() {
    isOpen = true;
    rootEl.classList.add('teleconnect-open');
    modalEl.style.display = 'flex';
    unreadCount = 0;
    updateBadge();
    scrollToBottom();
    setTimeout(() => inputEl && inputEl.focus(), 100);
  }

  function closeChat() {
    isOpen = false;
    rootEl.classList.remove('teleconnect-open');
    modalEl.style.display = 'none';
  }

  function renderMessages() {
    if (!messagesBody) return;
    messagesBody.innerHTML = '';

    messages.forEach((msg) => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `teleconnect-msg ${msg.sender === 'user' ? 'teleconnect-msg-user' : 'teleconnect-msg-admin'}`;

      const textDiv = document.createElement('div');
      textDiv.className = 'teleconnect-msg-text';
      textDiv.textContent = msg.text;

      const timeDiv = document.createElement('div');
      timeDiv.className = 'teleconnect-msg-time';
      timeDiv.textContent = msg.time || '';

      msgDiv.appendChild(textDiv);
      msgDiv.appendChild(timeDiv);
      messagesBody.appendChild(msgDiv);
    });

    scrollToBottom();
  }

  function appendMessage(sender, text, time, messageId) {
    const finalId = String(messageId || ('msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)));

    if (renderedMessageIds.has(finalId)) {
      return;
    }
    renderedMessageIds.add(finalId);

    const msg = {
      id: finalId,
      sender: sender,
      text: text,
      time: time || getCurrentTimeFa(),
    };
    messages.push(msg);
    saveMessages();
    renderMessages();

    if (!isOpen && sender === 'admin') {
      unreadCount++;
      updateBadge();
      playNotificationSound();
    }
  }

  function saveMessages() {
    try {
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messages.slice(-50)));
    } catch (_) {}
  }

  function updateBadge() {
    if (!badgeEl) return;
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  function scrollToBottom() {
    if (messagesBody) {
      messagesBody.scrollTop = messagesBody.scrollHeight;
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    sendBtn.disabled = true;

    const userMsgId = 'usr_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    appendMessage('user', text, getCurrentTimeFa(), userMsgId);

    let sent = false;

    // Direct to worker first
    if (config.workerUrl) {
      try {
        const payload = {
          session_id: sessionId,
          message: text,
          bot_token: config.botToken,
          chat_id: config.chatId,
          user_agent: navigator.userAgent,
          current_url: window.location.href,
          page_title: document.title,
        };

        const res = await fetch(config.workerUrl + '/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          sent = true;
        }
      } catch (err) {
        sent = false;
      }
    }

    // WordPress AJAX fallback with CSRF Nonce Token
    if (!sent && config.ajaxUrl) {
      try {
        const formData = new FormData();
        formData.append('action', 'teleconnect_send');
        formData.append('nonce', config.nonce || '');
        formData.append('session_id', sessionId);
        formData.append('message', text);
        formData.append('user_agent', navigator.userAgent);
        formData.append('current_url', window.location.href);
        formData.append('page_title', document.title);

        const res = await fetch(config.ajaxUrl, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          sent = true;
        } else {
          appendMessage('admin', '⚠️ خطا در ارسال: ' + (data.error || 'خطای سرور'));
        }
      } catch (e) {
        appendMessage('admin', '⚠️ خطا در ارسال: ' + e.message);
      }
    }

    sendBtn.disabled = false;
    inputEl.focus();
  }

  function startFastPolling() {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        let replies = null;

        // Try Worker
        try {
          const res = await fetch(`${config.workerUrl}/api/poll?session_id=${encodeURIComponent(sessionId)}&_=${Date.now()}`, {
            cache: 'no-store',
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.replies)) {
              replies = data.replies;
            }
          }
        } catch (_) {}

        // Fallback to WP Ajax with Nonce
        if (replies === null && config.ajaxUrl) {
          try {
            const res = await fetch(`${config.ajaxUrl}?action=teleconnect_poll&nonce=${encodeURIComponent(config.nonce || '')}&session_id=${encodeURIComponent(sessionId)}&_=${Date.now()}`, {
              cache: 'no-store',
            });
            if (res.ok) {
              const data = await res.json();
              if (data && Array.isArray(data.replies)) {
                replies = data.replies;
              }
            }
          } catch (_) {}
        }

        if (replies && replies.length > 0) {
          replies.forEach((rep) => {
            appendMessage('admin', rep.text, rep.time_fa || getCurrentTimeFa(), rep.id);
          });
        }
      } finally {
        isChecking = false;
      }
    }, 1500);
  }

  function getCurrentTimeFa() {
    const d = new Date();
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

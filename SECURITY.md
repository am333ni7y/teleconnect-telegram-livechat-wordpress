# Security Policy (خط‌مشی امنیتی)

We take the security of **TeleConnect Live Chat Pro** seriously. If you believe you have found a security vulnerability, please report it to us responsibly as described below.

---

## 🔒 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.1.0 | :x:                |

---

## 🚨 Reporting a Vulnerability (گزارش آسیب‌پذیری)

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to:
📧 **support@wp-needs.com** or contact the lead developer at **https://ameeen.ir**

Please include:
1. Type of issue (e.g., XSS, CSRF, Privilege Escalation).
2. Step-by-step instructions to reproduce the issue.
3. Proof-of-concept (PoC) code or screenshots if applicable.

We will acknowledge your report within 48 hours and work with you to release a patched version promptly.

---

## 🛡️ Built-in Security Architecture
- **CSRF Protection:** All WordPress AJAX endpoints require valid `wp_create_nonce('teleconnect_chat_nonce')`.
- **Access Control:** Admin settings require strict `current_user_can('manage_options')`.
- **Sanitization:** All inputs are strictly scrubbed using `sanitize_textarea_field`, `sanitize_key`, and `esc_url_raw`.
- **Zero Raw SQL:** The plugin uses WordPress Options API & KV Storage, eliminating SQL injection vectors.
- **DDoS / Duplicate Shield:** Edge KV atomic flushes prevent replay attacks and queue bloat.

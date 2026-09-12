# TeleConnect Live Chat Pro - افزونه چت آنلاین تلگرام وردپرس (بدون فیلترشکن)

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0.html)
[![WordPress Compatibility](https://img.shields.io/badge/WordPress-5.8%2B-blue)](https://wordpress.org)
[![Cloudflare Edge](https://img.shields.io/badge/Cloudflare-Workers%20%26%20KV-orange)](https://workers.cloudflare.com)
[![Developer: AMEEEN SEO](https://img.shields.io/badge/Developer-AMEEEN%20SEO-green)](https://ameeen.ir)
[![Official Hub: WP-Needs](https://img.shields.io/badge/Sponsored%20by-WP--Needs.com-purple)](https://wp-needs.com)

**TeleConnect Live Chat Pro** یک سیستم گفتگوی آنلاین فوق‌سریع و هوشمند برای وب‌سایت‌های وردپرسی است که کاربران را مستقیماً به ربات تلگرام ادمین‌ها متصل می‌کند. این سیستم با استفاده از ورکر اختصاصی کلادفلر و سیستم پیشرفته **Dual-Route Fallback**، به صورت ۱۰۰٪ تضمینی محدودیت‌های اینترنت ایران و فیلترینگ تلگرام را دور می‌زند؛ **بدون اینکه کاربر سایت نیازی به روشن کردن فیلترشکن داشته باشد.**

توسعه‌یافته با افتخار توسط **[AMEEEN SEO](https://ameeen.ir)** | اسپانسر و مرجع آموزش: **[وردپرس نیاز (WP-Needs.com)](https://wp-needs.com)**.

---

## 🇮🇷 راهنمای جامع فارسی (Persian Documentation)

### 🎯 کلمات کلیدی و کاربردها
- **چت آنلاین وردپرس در تلگرام**
- **افزونه پشتیبانی تلگرام بدون نیاز به فیلترشکن برای کاربر**
- **اتصال وردپرس به تلگرام از طریق Cloudflare Worker**
- **پشتیبانی آنلاین چند ادمینی در تلگرام**
- **لایو چت فوق‌سریع المنتور وردپرس**

---

### ✨ قابلیت‌ها و مزایای رقابتی

1. **🚀 اتصال ۱۰۰٪ بدون فیلترشکن:** کاربران شما با هر اپراتوری (ایرانسل، همراه اول، مخابرات و...) بدون هیچ اختلالی پیام ارسال و دریافت می‌کنند.
2. **⚡ تأخیر نزدیک به صفر (زیر ۵۰ میلی‌ثانیه):** بهینه‌سازی شده با تکنولوژی حافظه موقت لبه (Cloudflare Edge KV) و پروتکل اتمیک برای جلوگیری از تکرار پیام‌ها.
3. **👥 پشتیبانی همزمان از چند ادمین (Multi-Admin Broadcast):** امکان وارد کردن چندین Chat ID با کاما (` , `). پیام ورودی برای تمام ادمین‌ها ارسال شده و پاسخ هر ادمینی با نام او به کاربر سایت می‌رسد.
4. **📜 تاریخچه هوشمند مکالمات (History Log):** دکمه شیشه‌ای درون تلگرام برای استخراج آنی ۳۰ پیام اخیر هر کاربر.
5. **📱 ارسال کامل جزئیات کاربر به تلگرام:** آی‌پی واقعی، سیستم‌عامل، مرورگر، عنوان صفحه و لینک صفحه‌ای که کاربر در آن قرار دارد.
6. **🧙‍♂️ ویزارد نصب ابری خودکار (Cloud Wizard):** صفحه گرافیکی برای ساخت و دیپلوی خودکار ورکر و دیتابیس با ۱ کلیک و بدون نیاز به دانش فنی.
7. **🎨 سازگاری کامل با المنتور و قالب‌ها:** دارای ویجت اختصاصی و به ارث بردن خودکار فونت سایت (`font-family: inherit !important`).

---

### 🛠️ راهنمای سریع راه‌اندازی (۲ دقیقه)

#### گام ۱: ساخت ربات تلگرام
1. در تلگرام وارد ربات رسمی [@BotFather](https://t.me/botfather) شوید و دستور `/newbot` را بزنید.
2. توکن ربات (`Bot Token`) را کپی کنید.
3. **مهم:** وارد ربات خود شوید و دکمه **Start** را بزنید تا ربات فعال شود.
4. شناسه عددی اکانت خود (`Chat ID`) را از ربات [@userinfobot](https://t.me/userinfobot) دریافت کنید. (اگر چند ادمین هستید، تمام ادمین‌ها باید ربات را استارت بزنند).

#### گام ۲: راه‌اندازی ورکر کلادفلر با ویزارد خودکار
1. ویزارد اختصاصی را باز کنید (یا از طریق آدرس ورکر خودتان وارد `/wizard` شوید).
2. توکن API کلادفلر خود را با دسترسی Workers وارد کنید.
3. دکمه **«استقرار فوری (One-Click Deploy)»** را بزنید و آدرس نهایی ورکر را کپی کنید.

#### گام ۳: نصب در وردپرس
1. فایل `teleconnect-live-chat.zip` را در مسیر **پیشخوان > افزونه‌ها > افزودن** نصب و فعال کنید.
2. در منوی **پشتیبانی تلگرام**:
   - آدرس ورکر، توکن ربات و شناسه‌های ادمین (جداشده با کاما) را ذخیره کنید.
   - دکمه **«تنظیم خودکار وب‌هوک»** را کلیک کنید.
3. لذت ببرید! چت زنده اختصاصی شما آماده است.

---

## 🇬🇧 English Overview

**TeleConnect Live Chat Pro** is an open-source, ultra-fast live chat bridge that links WordPress website visitors directly to Telegram administrators. It is specifically engineered to bypass heavy censorship environments (like Iran) using serverless Cloudflare Workers and KV storage.

### Key Highlights
- **No Client VPN Needed:** Works seamlessly even when Telegram is censored locally.
- **Multi-Admin Routing:** Dispatches customer chats to multiple agents concurrently.
- **Sub-50ms Message Delivery:** High-efficiency edge polling with automated atomic clearing.
- **One-Click Cloud Setup Wizard:** Provision Cloudflare Workers and KV databases without touching command-line tools.
- **Elementor Widget Included:** Visual drag-and-drop support that respects native typography.

---

## 📄 License & Attribution
- **Author & Lead Developer:** [AMEEEN SEO](https://ameeen.ir)
- **Official Portal & Knowledgebase:** [WP-Needs.com (وردپرس نیاز)](https://wp-needs.com)
- **License:** GNU General Public License v2.0 (GPLv2)

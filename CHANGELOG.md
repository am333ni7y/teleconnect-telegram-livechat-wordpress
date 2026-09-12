# Changelog (تاریخچه تغییرات)

All notable changes to **TeleConnect Live Chat Pro** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-09-13
### Security
- Added WordPress CSRF `wp_create_nonce` & `check_ajax_referer` to all AJAX proxy endpoints (`teleconnect_send`, `teleconnect_poll`).
- Added strict `current_user_can('manage_options')` checks before rendering admin configuration.
- Enforced strict input sanitization (`sanitize_key`, `sanitize_textarea_field`, `esc_url_raw`).

### Fixed
- Fixed message duplicate bug where previous replies were re-rendered in ongoing conversations.
- Fixed Cloudflare API CORS issue in setup wizard by introducing Server-Side Provisioning (`/api/wizard/deploy`).

---

## [1.1.0] - 2026-09-12
### Added
- Multi-Admin broadcast support (multiple Telegram Chat IDs separated by commas).
- Telegram Interactive Inline Button (`📜 تاریخچه گفتگو`) for extracting past 30 messages.
- Embedded Cloudflare Web Setup Wizard directly hosted within Worker.
- WordPress backend fallback proxy (`Dual-Route`) for Iranian ISPs blocking `workers.dev`.

---

## [1.0.0] - 2026-09-12
### Added
- Initial public release of TeleConnect Live Chat.
- Elementor Widget and WordPress Shortcode support.
- Zero-delay Edge KV synchronization.

=== TeleConnect Live Chat Pro - Telegram WordPress Bridge ===
Contributors: ameeen, am333ni7y
Tags: live chat, telegram, chat, support, telegram live chat
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.1.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Direct, serverless WordPress live chat connected straight to your Telegram bot. Multi-admin support, Cloudflare Edge powered, zero server load.

== Description ==

TeleConnect Live Chat connects your website visitors directly with your team via Telegram. Using Cloudflare Workers and KV storage, it provides real-time bi-directional messaging with zero database bloat on your WordPress server.

=== Key Features ===
* **Direct Telegram Bridge:** Chat with your visitors directly from Telegram.
* **Multi-Admin Support:** Add multiple Telegram admin chat IDs (separated by commas).
* **Conversation History:** Admins can view complete chat history with an inline button.
* **Elementor Widget Integration:** Add custom chat launch buttons anywhere using Elementor.
* **Rock-Solid Security:** Zero bot token or chat ID exposure in frontend code. Server-side proxy and secret verification.
* **Edge Rate-Limiting:** IP-based protection prevents abuse and spam.
* **Lightweight & Fast:** Modular CSS and vanilla JS with zero third-party dependencies.

== Installation ==

1. Upload the `wp-needs-telegram-livechat` folder to the `/wp-content/plugins/` directory, or upload the zip file directly via the WordPress admin (Plugins -> Add New -> Upload Plugin).
2. Activate the plugin through the "Plugins" menu in WordPress.
3. Configure your Telegram Bot Token and Cloudflare Worker URL under **تنظیمات -> گفتگوی تلگرام**.
4. You can use the free web setup wizard to automatically deploy the Cloudflare Worker.

== Frequently Asked Questions ==

= Is my Telegram bot token visible to visitors? =
No. The bot token and admin chat IDs are stored securely on your server and are never passed to the browser or client-side scripts.

= Can multiple team members receive chats? =
Yes! You can enter multiple Telegram chat IDs separated by commas in the admin settings.

= What are the requirements? =
A WordPress site running PHP 7.4 or higher, a Telegram bot from @BotFather, and a free Cloudflare Worker.

== Screenshots ==

1. Admin settings interface.
2. Visitor chat widget on frontend.
3. Telegram notification with customer details and conversation history button.

== Changelog ==

= 1.1.2 =
* Fix: Completely eliminated sensitive bot token & chat ID leakage from frontend JavaScript.
* Security: Implemented CSPRNG cryptographically secure random session IDs.
* Security: Added Telegram webhook secret token validation.
* Security: Added IP-based edge rate limiting in Cloudflare Worker.
* Fix: Resolved Elementor widget button click trigger.
* Improvement: Standardized WordPress headers, added uninstall.php, and added readme.txt.

= 1.1.1 =
* Multi-admin broadcast support.
* Conversation history retrieval button via Telegram inline keyboard.

= 1.0.0 =
* Initial public release.

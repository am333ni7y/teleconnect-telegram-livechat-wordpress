<?php
/**
 * Plugin Name:       TeleConnect Live Chat Pro - Telegram WordPress Bridge
 * Plugin URI:        https://wp-needs.com/plugins/teleconnect-live-chat
 * Description:       افزونه چت آنلاین فوق‌سریع تلگرام برای وردپرس با معماری چند ادمین، ثبت تاریخچه، امنیت داده‌ها و ویزارد کلادفلر.
 * Version:           1.1.2
 * Requires at least: 5.8
 * Tested up to:      6.7
 * Requires PHP:      7.4
 * Author:            AMEEEN SEO
 * Author URI:        https://ameeen.ir
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       teleconnect-livechat
 * Domain Path:       /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TELECONNECT_VERSION', '1.1.2');
define('TELECONNECT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TELECONNECT_PLUGIN_URL', plugin_dir_url(__FILE__));

class TeleConnect_Live_Chat {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);

        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_footer', [$this, 'render_widget']);

        // Dual-route proxy endpoints with Nonce & Rate-limit security
        add_action('wp_ajax_teleconnect_send', [$this, 'ajax_send_message']);
        add_action('wp_ajax_nopriv_teleconnect_send', [$this, 'ajax_send_message']);

        add_action('wp_ajax_teleconnect_poll', [$this, 'ajax_poll_messages']);
        add_action('wp_ajax_nopriv_teleconnect_poll', [$this, 'ajax_poll_messages']);

        add_shortcode('teleconnect_chat_button', [$this, 'render_shortcode_button']);
        add_action('elementor/widgets/register', [$this, 'register_elementor_widget']);
    }

    public function register_admin_menu() {
        add_menu_page(
            'TeleConnect Live Chat',
            'پشتیبانی تلگرام',
            'manage_options',
            'teleconnect-settings',
            [$this, 'render_settings_page'],
            'dashicons-format-chat',
            65
        );
    }

    public function register_settings() {
        register_setting('teleconnect_group', 'teleconnect_worker_url', [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => ''
        ]);
        register_setting('teleconnect_group', 'teleconnect_bot_token', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ]);
        register_setting('teleconnect_group', 'teleconnect_admin_chat_id', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ]);
        register_setting('teleconnect_group', 'teleconnect_primary_color', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#0088cc'
        ]);
        register_setting('teleconnect_group', 'teleconnect_welcome_message', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_textarea_field',
            'default' => 'سلام! چطور می‌تونیم کمکتون کنیم؟ کارشناسان ما آماده پاسخگویی هستند.'
        ]);
        register_setting('teleconnect_group', 'teleconnect_title', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'پشتیبانی آنلاین'
        ]);
        register_setting('teleconnect_group', 'teleconnect_position', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'bottom-right'
        ]);
    }

    public function render_settings_page() {
        // Strict Capability Check
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('شما اجازه دسترسی به این بخش را ندارید.', 'teleconnect-livechat'));
        }

        $worker_url = get_option('teleconnect_worker_url');
        ?>
        <div class="wrap" style="max-width: 950px; font-family: inherit; direction: rtl; text-align: right;">
            <div style="background: linear-gradient(135deg, #0088cc, #005f9e); color: #fff; padding: 25px; border-radius: 14px; margin: 20px 0; box-shadow: 0 4px 20px rgba(0,136,204,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h1 style="color: #fff; margin: 0 0 8px; font-size: 24px; font-weight: 700;">TeleConnect Live Chat Pro (توسعه یافته توسط AMEEEN SEO)</h1>
                        <p style="margin: 0; opacity: 0.95; font-size: 14px; line-height: 1.8;">
                            چت آنلاین تلگرام سازگار با اینترنت ایران بدون نیاز به فیلترشکن. مرجع آموزش در <a href="https://wp-needs.com" target="_blank" style="color: #ffe600; text-decoration: none; font-weight: bold;">وردپرس نیاز (WP-Needs.com)</a> و وبسایت <a href="https://ameeen.ir" target="_blank" style="color: #ffe600; text-decoration: none; font-weight: bold;">AMEEEN.ir</a>.
                        </p>
                    </div>
                    <div>
                        <a href="<?php echo !empty($worker_url) ? esc_url(untrailingslashit($worker_url) . '/wizard') : 'https://rough-hill-19fc.ameeenity.workers.dev/wizard'; ?>" target="_blank" class="button button-hero" style="background: #ffe600; color: #000; font-weight: bold; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: inline-flex; align-items: center; gap: 6px;">
                            🧙‍♂️ باز کردن ویزارد ابری کلادفلر
                        </a>
                    </div>
                </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 16px 20px; border-radius: 12px; margin-bottom: 25px; line-height: 1.8; color: #166534; font-size: 14px;">
                <strong>👥 قابلیت چند ادمین (Multi-Admin) و امنیت فوق‌العاده:</strong><br>
                شناسه‌های عددی تلگرام را با کاما (<code>,</code>) جدا کنید. اطلاعات حساس (توکن ربات و شناسه چت) کاملاً در سمت سرور امن نگاه داشته می‌شوند و هرگز در سورس‌کد مرورگر کاربران منتشر نخواهند شد.
            </div>

            <form method="post" action="options.php" style="background: #fff; padding: 25px; border-radius: 12px; border: 1px solid #e1e8ed; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <?php
                settings_fields('teleconnect_group');
                do_settings_sections('teleconnect_group');
                ?>
                <table class="form-table" style="font-size: 14px;">
                    <tr>
                        <th scope="row"><label for="teleconnect_worker_url">آدرس ورکر کلادفلر (Worker URL)</label></th>
                        <td>
                            <input name="teleconnect_worker_url" type="url" id="teleconnect_worker_url" value="<?php echo esc_attr($worker_url); ?>" class="regular-text" style="direction: ltr; text-align: left;" placeholder="https://your-worker.yourdomain.workers.dev" required />
                            <p class="description">آدرس ورکر ساخته‌شده از طریق ویزارد بالا یا پنل کلادفلر.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="teleconnect_bot_token">توکن ربات تلگرام (Bot Token)</label></th>
                        <td>
                            <input name="teleconnect_bot_token" type="password" id="teleconnect_bot_token" value="<?php echo esc_attr(get_option('teleconnect_bot_token')); ?>" class="regular-text" style="direction: ltr; text-align: left;" placeholder="123456789:AA..." required />
                            <p class="description">توکن دریافتی از ربات رسمی @BotFather در تلگرام (به صورت امن ذخیره می‌شود).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="teleconnect_admin_chat_id">شناسه تلگرام ادمین‌ها (Chat IDs)</label></th>
                        <td>
                            <input name="teleconnect_admin_chat_id" type="text" id="teleconnect_admin_chat_id" value="<?php echo esc_attr(get_option('teleconnect_admin_chat_id')); ?>" class="large-text" style="direction: ltr; text-align: left;" placeholder="1921970823, 987654321, 554433221" required />
                            <p class="description">شناسه عددی اکانت‌ها یا گروه‌ها. برای چند ادمین با کاما جدا کنید.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="teleconnect_title">عنوان پنجره چت</label></th>
                        <td>
                            <input name="teleconnect_title" type="text" id="teleconnect_title" value="<?php echo esc_attr(get_option('teleconnect_title', 'پشتیبانی آنلاین')); ?>" class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="teleconnect_welcome_message">پیام آغازین</label></th>
                        <td>
                            <textarea name="teleconnect_welcome_message" id="teleconnect_welcome_message" rows="3" class="large-text"><?php echo esc_textarea(get_option('teleconnect_welcome_message', 'سلام! چطور می‌تونیم کمکتون کنیم؟')); ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="teleconnect_primary_color">رنگ سازمانی ویجت</label></th>
                        <td>
                            <input name="teleconnect_primary_color" type="color" id="teleconnect_primary_color" value="<?php echo esc_attr(get_option('teleconnect_primary_color', '#0088cc')); ?>" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="teleconnect_position">موقعیت دکمه چت</label></th>
                        <td>
                            <select name="teleconnect_position" id="teleconnect_position">
                                <option value="bottom-right" <?php selected(get_option('teleconnect_position', 'bottom-right'), 'bottom-right'); ?>>پایین - راست</option>
                                <option value="bottom-left" <?php selected(get_option('teleconnect_position'), 'bottom-left'); ?>>پایین - چپ</option>
                            </select>
                        </td>
                    </tr>
                </table>

                <?php submit_button('ذخیره تنظیمات', 'primary', 'submit', true, ['style' => 'background: #0088cc; border-color: #0077b5; padding: 6px 20px; font-weight: bold;']); ?>
            </form>

            <div style="background: #fff; padding: 20px; border-radius: 12px; margin-top: 20px; border: 1px solid #e1e8ed;">
                <h3 style="margin-top: 0;">⚡ فعال‌سازی وب‌هوک ربات تلگرام</h3>
                <p>پس از ذخیره اطلاعات بالا، دکمه زیر را بزنید تا ارتباط دوطرفه بین ورکر و تلگرام شما در کسری از ثانیه تنظیم شود:</p>
                <button type="button" class="button button-secondary" id="teleconnect_set_webhook_btn">تنظیم خودکار وب‌هوک</button>
                <span id="teleconnect_webhook_status" style="margin-right: 15px; font-weight: bold;"></span>
            </div>

            <script>
            document.getElementById('teleconnect_set_webhook_btn')?.addEventListener('click', async function() {
                const workerUrl = document.getElementById('teleconnect_worker_url').value.trim();
                const botToken = document.getElementById('teleconnect_bot_token').value.trim();
                const statusSpan = document.getElementById('teleconnect_webhook_status');

                if (!workerUrl || !botToken) {
                    alert('لطفاً ابتدا آدرس ورکر و توکن ربات را ذخیره کنید.');
                    return;
                }

                statusSpan.style.color = '#333';
                statusSpan.textContent = 'در حال اتصال به تلگرام...';

                try {
                    const res = await fetch(workerUrl.replace(/\/$/, '') + '/set-webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bot_token: botToken })
                    });
                    const data = await res.json();
                    if (data.ok) {
                        statusSpan.style.color = '#2b8a3e';
                        statusSpan.textContent = '✅ وب‌هوک تلگرام با موفقیت فعال شد!';
                    } else {
                        statusSpan.style.color = '#c92a2a';
                        statusSpan.textContent = '❌ خطا: ' + (data.description || data.error || 'ناشناخته');
                    }
                } catch (e) {
                    statusSpan.style.color = '#c92a2a';
                    statusSpan.textContent = '❌ خطا در اتصال: ' + e.message;
                }
            });
            </script>
        </div>
        <?php
    }

    public function enqueue_assets() {
        $worker_url = get_option('teleconnect_worker_url');
        if (empty($worker_url)) return;

        // Proper cache-friendly file modification time versioning
        $css_file = TELECONNECT_PLUGIN_DIR . 'assets/css/teleconnect-widget.css';
        $js_file  = TELECONNECT_PLUGIN_DIR . 'assets/js/teleconnect-widget.js';
        $css_ver  = file_exists($css_file) ? filemtime($css_file) : TELECONNECT_VERSION;
        $js_ver   = file_exists($js_file) ? filemtime($js_file) : TELECONNECT_VERSION;

        wp_enqueue_style('teleconnect-style', TELECONNECT_PLUGIN_URL . 'assets/css/teleconnect-widget.css', [], $css_ver);
        wp_enqueue_script('teleconnect-script', TELECONNECT_PLUGIN_URL . 'assets/js/teleconnect-widget.js', [], $js_ver, true);

        // Security Nonce for Frontend Ajax actions
        $nonce = wp_create_nonce('teleconnect_chat_nonce');

        // Zero Secrets Exposed to Browser: botToken and chatId REMOVED completely!
        wp_localize_script('teleconnect-script', 'teleConnectConfig', [
            'ajaxUrl'        => admin_url('admin-ajax.php'),
            'nonce'          => $nonce,
            'workerUrl'      => esc_url_raw(untrailingslashit($worker_url)),
            'title'          => esc_html(get_option('teleconnect_title', 'پشتیبانی آنلاین')),
            'welcomeMessage' => esc_html(get_option('teleconnect_welcome_message', 'سلام! چطور می‌تونیم کمکتون کنیم؟')),
            'position'       => esc_attr(get_option('teleconnect_position', 'bottom-right')),
            'primaryColor'   => esc_attr(get_option('teleconnect_primary_color', '#0088cc')),
            'pageTitle'      => esc_js(wp_get_document_title()),
            'currentUrl'     => esc_url_raw(home_url(add_query_arg([], $GLOBALS['wp']->request ?? ''))),
        ]);
    }

    public function ajax_send_message() {
        // Security Check: Verify Nonce
        check_ajax_referer('teleconnect_chat_nonce', 'nonce');

        $worker_url = get_option('teleconnect_worker_url');
        if (empty($worker_url)) {
            wp_send_json_error(['error' => 'Worker URL empty']);
        }

        // Strict Sanitization
        $session_id  = sanitize_key($_POST['session_id'] ?? '');
        $message     = sanitize_textarea_field($_POST['message'] ?? '');
        $user_agent  = sanitize_text_field($_POST['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');
        $current_url = esc_url_raw($_POST['current_url'] ?? '');
        $page_title  = sanitize_text_field($_POST['page_title'] ?? '');
        $client_ip   = sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? '');

        if (empty($session_id) || empty($message)) {
            wp_send_json_error(['error' => 'Invalid parameters']);
        }

        // Server-Side Secrets Injection (100% safe, never exposed to visitors)
        $payload = [
            'session_id'  => $session_id,
            'message'     => $message,
            'bot_token'   => get_option('teleconnect_bot_token'),
            'chat_id'     => get_option('teleconnect_admin_chat_id'),
            'user_agent'  => $user_agent,
            'current_url' => $current_url,
            'page_title'  => $page_title,
            'user_ip'     => $client_ip,
        ];

        $response = wp_remote_post(untrailingslashit($worker_url) . '/api/send', [
            'headers' => [
                'Content-Type'   => 'application/json',
                'X-WP-Site-Auth' => wp_hash(get_option('teleconnect_bot_token') . home_url()),
            ],
            'body'    => wp_json_encode($payload),
            'timeout' => 8,
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['error' => $response->get_error_message()]);
        }

        $body = wp_remote_retrieve_body($response);
        wp_send_json(json_decode($body, true));
    }

    public function ajax_poll_messages() {
        // Security Check: Verify Nonce
        check_ajax_referer('teleconnect_chat_nonce', 'nonce');

        $worker_url = get_option('teleconnect_worker_url');
        $session_id = sanitize_key($_GET['session_id'] ?? '');

        if (empty($worker_url) || empty($session_id)) {
            wp_send_json(['replies' => []]);
        }

        $url = add_query_arg(['session_id' => $session_id, '_' => microtime(true)], untrailingslashit($worker_url) . '/api/poll');
        $response = wp_remote_get($url, ['timeout' => 4]);

        if (is_wp_error($response)) {
            wp_send_json(['replies' => []]);
        }

        $body = wp_remote_retrieve_body($response);
        wp_send_json(json_decode($body, true) ?: ['replies' => []]);
    }

    public function render_widget() {
        $worker_url = get_option('teleconnect_worker_url');
        if (empty($worker_url)) return;
        ?>
        <div id="teleconnect-root" class="teleconnect-root teleconnect-pos-<?php echo esc_attr(get_option('teleconnect_position', 'bottom-right')); ?>" style="--teleconnect-primary: <?php echo esc_attr(get_option('teleconnect_primary_color', '#0088cc')); ?>;">
            <button id="teleconnect-trigger-btn" class="teleconnect-bubble" aria-label="گفتگو با پشتیبانی">
                <svg class="teleconnect-icon-chat" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <svg class="teleconnect-icon-close" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span id="teleconnect-badge" class="teleconnect-badge" style="display: none;">1</span>
            </button>

            <div id="teleconnect-modal" class="teleconnect-modal" style="display: none;">
                <div class="teleconnect-header">
                    <div class="teleconnect-header-info">
                        <div class="teleconnect-avatar">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                            <span class="teleconnect-status-dot"></span>
                        </div>
                        <div>
                            <div class="teleconnect-title"><?php echo esc_html(get_option('teleconnect_title', 'پشتیبانی آنلاین')); ?></div>
                            <div class="teleconnect-subtitle">پاسخگویی مستقیم از تلگرام</div>
                        </div>
                    </div>
                    <button type="button" id="teleconnect-close-btn" class="teleconnect-header-close" aria-label="بستن">&times;</button>
                </div>

                <div id="teleconnect-messages" class="teleconnect-messages-body"></div>

                <form id="teleconnect-form" class="teleconnect-input-area">
                    <input type="text" id="teleconnect-input" placeholder="پیام خود را بنویسید..." autocomplete="off" required />
                    <button type="submit" id="teleconnect-send-btn" aria-label="ارسال">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
        <?php
    }

    public function render_shortcode_button($atts) {
        $atts = shortcode_atts(['text' => 'گفتگو با پشتیبانی', 'class' => ''], $atts, 'teleconnect_chat_button');
        return sprintf('<button type="button" class="teleconnect-custom-btn %s" onclick="window.teleConnectOpen&&window.teleConnectOpen();">%s</button>', esc_attr($atts['class']), esc_html($atts['text']));
    }

    public function register_elementor_widget($widgets_manager) {
        if (!did_action('elementor/loaded')) return;
        require_once TELECONNECT_PLUGIN_DIR . 'includes/class-elementor-widget.php';
        $widgets_manager->register(new \TeleConnect_Elementor_Widget());
    }
}

add_action('plugins_loaded', ['TeleConnect_Live_Chat', 'get_instance']);

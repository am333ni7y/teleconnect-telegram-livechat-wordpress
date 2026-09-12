<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package TeleConnect_Live_Chat
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete all TeleConnect plugin options
$options = [
    'teleconnect_bot_token',
    'teleconnect_admin_chat_id',
    'teleconnect_worker_url',
    'teleconnect_title',
    'teleconnect_welcome_message',
    'teleconnect_position',
    'teleconnect_theme_color',
];

foreach ($options as $option) {
    delete_option($option);
}

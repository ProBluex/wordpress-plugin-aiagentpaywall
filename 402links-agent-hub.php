<?php
/**
 * Plugin Name: 402links Agent Hub
 * Plugin URI: https://402links.com
 * Description: Automatically monetize WordPress content with AI agent payments via x402 protocol
 * Version: 2.2.7
 * Author: 402links
 * Author URI: https://402links.com
 * License: Proprietary
 * Text Domain: 402links-agent-hub
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('AGENT_HUB_VERSION', '2.2.7');
define('AGENT_HUB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('AGENT_HUB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('AGENT_HUB_PLUGIN_FILE', __FILE__);

// Autoload classes
spl_autoload_register(function ($class) {
    $prefix = 'AgentHub\\';
    $base_dir = AGENT_HUB_PLUGIN_DIR . 'includes/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// GitHub Auto-Update Integration
if (file_exists(AGENT_HUB_PLUGIN_DIR . 'vendor/plugin-update-checker/plugin-update-checker.php')) {
    require_once AGENT_HUB_PLUGIN_DIR . 'vendor/plugin-update-checker/plugin-update-checker.php';
    
    $updateChecker = YahnisElsts\PluginUpdateChecker\v5p6\PucFactory::buildUpdateChecker(
        'https://github.com/ProBluex/wordpress-plugin-aiagentpaywall',
        __FILE__,
        '402links-agent-hub'
    );
    
    // Check for updates from the main branch
    $updateChecker->setBranch('main');
    
    // Optional: Set GitHub access token for private repos
    // $updateChecker->setAuthentication('YOUR_GITHUB_TOKEN_HERE');
}

// Activation hook - now using Installer class
register_activation_hook(__FILE__, ['\AgentHub\Installer', 'activate']);
register_activation_hook(__FILE__, 'agent_hub_activate');
function agent_hub_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . '402links_agent_logs';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        post_id BIGINT UNSIGNED NOT NULL,
        agent_name VARCHAR(255),
        user_agent TEXT,
        ip_address VARCHAR(45),
        payment_status VARCHAR(20) DEFAULT 'unpaid',
        payment_tx_hash VARCHAR(255),
        amount_paid DECIMAL(20,6) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_id (post_id),
        INDEX idx_created_at (created_at),
        INDEX idx_payment_status (payment_status)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Set default options
    if (!get_option('402links_settings')) {
        add_option('402links_settings', [
            'default_price' => 0.10,
            'auto_generate' => true,
            'payment_wallet' => '',
            'network' => 'base',
            'api_endpoint' => 'https://cnionwnknwnzpwfuacse.supabase.co/functions/v1'
        ]);
    }
    
    // Track plugin activation state
    update_option('402links_plugin_active', true);
    update_option('402links_last_activated', current_time('mysql'));
    
    // Flush rewrite rules for .well-known endpoint
    flush_rewrite_rules();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'agent_hub_deactivate');
function agent_hub_deactivate() {
    // Track plugin deactivation state
    update_option('402links_plugin_active', false);
    update_option('402links_last_deactivated', current_time('mysql'));
    
    // IMPORTANT: DO NOT DELETE credentials or 402links data
    // We want to preserve all 402-compatible pages in the Agent Hub
    // even if the plugin is temporarily disabled
    
    flush_rewrite_rules();
}

// Initialize plugin
add_action('plugins_loaded', function() {
    $core = new AgentHub\Core();
    $core->init();
});

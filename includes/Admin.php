<?php
namespace AgentHub;

class Admin {
    /**
     * Show provisioning status notices
     */
    public static function show_provisioning_notice() {
        // Check if wallet is configured
        $settings = get_option('402links_settings', []);
        $wallet = $settings['payment_wallet'] ?? '';
        $site_id = get_option('402links_site_id');
        
        
        // Show success notice
        if (get_option('402links_provisioning_success')) {
            $site_id = get_option('402links_site_id');
            ?>
            <div class="notice notice-success is-dismissible">
                <p><strong>🎉 402links:</strong> Your site has been automatically registered! 
                Site ID: <code><?php echo esc_html($site_id); ?></code></p>
                <p>Configure your payment wallet in the <a href="<?php echo admin_url('admin.php?page=agent-hub'); ?>">AI Agent Paywall dashboard</a> to start protecting and monetizing your content.</p>
            </div>
            <?php
            delete_option('402links_provisioning_success');
        }
        
        // Show info notice (for already provisioned sites)
        $info = get_option('402links_provisioning_info');
        if ($info) {
            ?>
            <div class="notice notice-info is-dismissible">
                <p><strong>ℹ️ 402links:</strong> <?php echo esc_html($info); ?></p>
            </div>
            <?php
            delete_option('402links_provisioning_info');
        }
        
        // Show error notice
        $error = get_option('402links_provisioning_error');
        if ($error) {
            ?>
            <div class="notice notice-error is-dismissible">
                <p><strong>⚠️ 402links:</strong> Auto-provisioning failed: <?php echo esc_html($error); ?></p>
                <p>You can manually register at <a href="https://402links.com" target="_blank">402links.com</a> or contact support for assistance.</p>
            </div>
            <?php
            delete_option('402links_provisioning_error');
        }
    }
    
    /**
     * Register admin menu
     */
    public static function register_menu() {
        add_menu_page(
            '402links Agent Hub',
            'AI Agent Paywall',
            'manage_options',
            'agent-hub',
            [self::class, 'render_dashboard'],
            'dashicons-shield-alt',
            30
        );
    }
    
    
    /**
     * Enqueue admin assets
     */
    public static function enqueue_assets($hook) {
        if ($hook !== 'toplevel_page_agent-hub') {
            return;
        }
        
        wp_enqueue_style(
            'agent-hub-admin',
            AGENT_HUB_PLUGIN_URL . 'assets/css/admin.css',
            [],
            AGENT_HUB_VERSION
        );
        
        wp_enqueue_style(
            'agent-hub-batch-processor',
            AGENT_HUB_PLUGIN_URL . 'assets/css/batch-processor.css',
            [],
            AGENT_HUB_VERSION
        );
        
        wp_enqueue_script(
            'agent-hub-admin',
            AGENT_HUB_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_enqueue_script(
            'agent-hub-analytics',
            AGENT_HUB_PLUGIN_URL . 'assets/js/analytics.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_enqueue_script(
            'agent-hub-content',
            AGENT_HUB_PLUGIN_URL . 'assets/js/content-manager.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_enqueue_script(
            'agent-hub-overview',
            AGENT_HUB_PLUGIN_URL . 'assets/js/overview.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_enqueue_script(
            'agent-hub-contact',
            AGENT_HUB_PLUGIN_URL . 'assets/js/contact.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_enqueue_script(
            'agent-hub-violations',
            AGENT_HUB_PLUGIN_URL . 'assets/js/violations.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_enqueue_script(
            'agent-hub-batch-processor',
            AGENT_HUB_PLUGIN_URL . 'assets/js/batch-processor.js',
            ['jquery'],
            AGENT_HUB_VERSION,
            true
        );
        
        wp_localize_script('agent-hub-admin', 'agentHubData', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('agent_hub_nonce'),
            'siteUrl' => get_site_url(),
            'siteName' => get_bloginfo('name'),
            'siteId' => get_option('402links_site_id')  // Add site_id for contact form validation
        ]);
    }
    
    /**
     * Render dashboard
     */
    public static function render_dashboard() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        include AGENT_HUB_PLUGIN_DIR . 'templates/settings-page.php';
    }
    
    /**
     * Add meta box to posts
     */
    public static function add_meta_box() {
        add_meta_box(
            'agent-hub-meta-box',
            '402links Agent Protection',
            [self::class, 'render_meta_box'],
            ['post', 'page'],
            'side',
            'default'
        );
    }
    
    /**
     * Render meta box
     * 
     * SECURITY FIX: Added CSRF nonce field
     */
    public static function render_meta_box($post) {
        // Add nonce field for CSRF protection
        wp_nonce_field('402links_save_meta_' . $post->ID, '402links_meta_nonce');
        
        include AGENT_HUB_PLUGIN_DIR . 'templates/meta-box.php';
    }
    
    /**
     * AJAX: Save settings
     */
    public static function ajax_save_settings() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $settings = [
            'default_price' => floatval($_POST['default_price'] ?? 0.10),
            'auto_generate' => isset($_POST['auto_generate']) && $_POST['auto_generate'] === 'true',
            'payment_wallet' => sanitize_text_field($_POST['payment_wallet'] ?? ''),
            'network' => sanitize_text_field($_POST['network'] ?? 'base'),
            'api_endpoint' => sanitize_text_field($_POST['api_endpoint'] ?? 'https://api.402links.com/v1')
        ];
        
        update_option('402links_settings', $settings);
        
        if (isset($_POST['api_key'])) {
            update_option('402links_api_key', sanitize_text_field($_POST['api_key']));
        }
        
        wp_send_json_success(['message' => 'Settings saved successfully']);
    }
    
    /**
     * AJAX: Register site
     */
    public static function ajax_register_site() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $api = new API();
        $result = $api->register_site();
        
        if ($result['success']) {
            if (isset($result['site_id'])) {
                update_option('402links_site_id', $result['site_id']);
            }
            
            // Auto-generate 402links for all published content
            $bulk_result = ContentSync::bulk_sync_all();
            
            $message = sprintf(
                'Site registered successfully! Generated %d 402links for your content.',
                $bulk_result['created']
            );
            
            wp_send_json_success([
                'message' => $message,
                'site_id' => $result['site_id'],
                'auto_generated' => $bulk_result
            ]);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Generate link for post
     */
    public static function ajax_generate_link() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $post_id = intval($_POST['post_id'] ?? 0);
        if (!$post_id) {
            wp_send_json_error(['message' => 'Invalid post ID']);
        }
        
        $result = ContentSync::create_link($post_id);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Get analytics
     */
    public static function ajax_get_analytics() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $timeframe = sanitize_text_field($_POST['timeframe'] ?? '30d');
        
        error_log('402links: ajax_get_analytics called');
        error_log('402links: Timeframe: ' . $timeframe);
        error_log('402links: Site URL: ' . get_site_url());
        
        $api = new API();
        $result = $api->get_analytics($timeframe);
        
        error_log('402links: get_analytics result success: ' . ($result['success'] ? 'true' : 'false'));
        if (!$result['success']) {
            error_log('402links: get_analytics error: ' . ($result['error'] ?? 'unknown'));
        } else {
            error_log('402links: get_analytics data keys: ' . implode(', ', array_keys($result['data'] ?? [])));
        }
        
        if ($result['success']) {
            // Add cache-busting headers
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
            
            // Unwrap the 'data' key to avoid double-nesting when wp_send_json_success wraps it again
            wp_send_json_success($result['data'] ?? $result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Get content list
     */
    public static function ajax_get_content() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        // Get site_id
        $site_id = get_option('402links_site_id');
        
        // Fetch page analytics from backend API
        $api = new API();
        $analytics_result = $api->get_pages_analytics($site_id);
        
        $page_stats = [];
        if ($analytics_result['success'] && isset($analytics_result['data']['pages'])) {
            foreach ($analytics_result['data']['pages'] as $page) {
                $wp_post_id = $page['wordpress_post_id'];
                $page_stats[$wp_post_id] = [
                    'crawls' => intval($page['crawls'] ?? 0),
                    'revenue' => floatval($page['revenue'] ?? 0)
                ];
                
                error_log("402links: Page stats for WP Post ID {$wp_post_id}: {$page_stats[$wp_post_id]['crawls']} crawls, \${$page_stats[$wp_post_id]['revenue']} revenue");
            }
        }
        
        error_log('402links: Analytics returned stats for post IDs: ' . implode(', ', array_keys($page_stats)));
        
        $posts = get_posts([
            'post_type' => 'post',  // ✅ ONLY posts, not pages
            'post_status' => 'publish',
            'posts_per_page' => 100,
            'orderby' => 'date',
            'order' => 'DESC'
        ]);
        
        $wp_post_ids = array_map(function($p) { return $p->ID; }, $posts);
        error_log('402links: WordPress query returned post IDs: ' . implode(', ', $wp_post_ids));
        
        $content_list = [];
        
        foreach ($posts as $post) {
            $post_id = $post->ID;
            
            $link_id = get_post_meta($post_id, '_402links_id', true);
            $link_url = get_post_meta($post_id, '_402links_url', true);
            $price = get_post_meta($post_id, '_402links_price', true);
            $block_humans = get_post_meta($post_id, '_402link_block_humans', true);
            
            // Robust lookup with fallback
            $crawls = 0;
            $revenue = 0;
            
            if (isset($page_stats[$post_id])) {
                $crawls = $page_stats[$post_id]['crawls'];
                $revenue = $page_stats[$post_id]['revenue'];
                error_log("402links: Post #{$post_id} '{$post->post_title}' - MATCHED: {$crawls} crawls, \${$revenue} revenue");
            } else {
                error_log("402links: Post #{$post_id} '{$post->post_title}' - NO MATCH in analytics data");
            }
            
            $content_list[] = [
                'id' => $post_id,
                'title' => get_the_title($post_id),
                'url' => get_permalink($post_id),
                'type' => $post->post_type,
                'link_id' => $link_id,
                'link_url' => $link_url,
                'price' => $price ?: (get_option('402links_settings')['default_price'] ?? 0.10),
                'has_link' => !empty($link_id),
                'crawls' => $crawls,
                'revenue' => $revenue,
                'published' => $post->post_date,
                'block_humans' => (bool)$block_humans
            ];
        }
        
        wp_send_json_success(['content' => $content_list]);
    }
    
    /**
     * AJAX: Save wallet address
     */
    public static function ajax_save_wallet() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $wallet = sanitize_text_field($_POST['wallet'] ?? '');
        $default_price = floatval($_POST['default_price'] ?? 0.10);
        
        error_log('402links: ajax_save_wallet called');
        error_log('402links: Wallet: ' . $wallet);
        error_log('402links: Default Price: ' . $default_price);
        
        if (empty($wallet)) {
            wp_send_json_error(['message' => 'Wallet address is required']);
        }
        
        // Enhanced validation: Check Ethereum/Base address format
        if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $wallet)) {
            wp_send_json_error([
                'message' => 'Invalid wallet address format. Must be a valid Ethereum/Base address (0x + 40 hex characters)',
                'sync_success' => false
            ]);
        }
        
        // Save locally first
        $settings = get_option('402links_settings', []);
        $settings['payment_wallet'] = $wallet;
        $settings['default_price'] = $default_price;
        update_option('402links_settings', $settings);
        
        // CHECK IF SITE IS PROVISIONED
        $site_id = get_option('402links_site_id');
        $api_key = get_option('402links_api_key');
        
        // SCENARIO 1: Site not provisioned at all
        if (!$site_id) {
            error_log('402links: Site not provisioned - triggering auto-provision');
            
            // Trigger auto-provisioning
            Installer::activate();
            
            // Wait a moment for provisioning to complete
            sleep(2);
            
            // Re-check if provisioning succeeded
            $site_id = get_option('402links_site_id');
            $api_key = get_option('402links_api_key');
            
            if (!$site_id) {
                $provision_error = get_option('402links_provisioning_error', 'Auto-provisioning failed');
                error_log('402links: Auto-provisioning failed: ' . $provision_error);
                
                wp_send_json_success([
                    'message' => 'Configuration saved locally',
                    'sync_success' => false,
                    'sync_error' => 'Site registration pending. ' . $provision_error,
                    'wallet' => $wallet
                ]);
                return;
            }
            
            error_log('402links: Auto-provisioning completed. Site ID: ' . $site_id);
        }
        
        // SCENARIO 2: Site provisioned but no API key
        if (!$api_key) {
            error_log('402links: Site provisioned but no API key found');
            wp_send_json_success([
                'message' => 'Configuration saved locally',
                'sync_success' => false,
                'sync_error' => 'Site registered but API key is missing. Please contact support.',
                'wallet' => $wallet
            ]);
            return;
        }
        
        // SCENARIO 3: Everything is ready - sync to backend
        error_log('402links: Site ID: ' . $site_id . ' - Syncing wallet to backend');
        
        $api = new API();
        $result = $api->sync_wallet($site_id, $wallet);
        
        error_log('402links: Sync wallet API result: ' . json_encode($result));
        
        if ($result['success']) {
            wp_send_json_success([
                'message' => 'Configuration saved and synced successfully',
                'sync_success' => true,
                'wallet' => $wallet
            ]);
        } else {
            $sync_error = $result['error'] ?? 'Unknown sync error';
            error_log('402links: Failed to sync wallet: ' . $sync_error);
            
            wp_send_json_success([
                'message' => 'Configuration saved locally',
                'sync_success' => false,
                'sync_error' => $sync_error,
                'wallet' => $wallet
            ]);
        }
    }
    
    /**
     * AJAX: Toggle human access for a post
     */
    public static function ajax_toggle_human_access() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $post_id = intval($_POST['post_id'] ?? 0);
        $block_humans = isset($_POST['block_humans']) && $_POST['block_humans'] === 'true';
        
        if (!$post_id) {
            wp_send_json_error(['message' => 'Invalid post ID']);
        }
        
        update_post_meta($post_id, '_402link_block_humans', $block_humans);
        
        wp_send_json_success([
            'message' => 'Human access updated',
            'block_humans' => $block_humans
        ]);
    }
    
    /**
     * AJAX: Bulk generate links
     */
    public static function ajax_bulk_generate() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        // Generate for all published posts
        $result = ContentSync::bulk_sync_all();
        
        if ($result['created'] > 0 || $result['updated'] > 0) {
            $message = sprintf(
                'Successfully generated %d new links and updated %d existing links.',
                $result['created'],
                $result['updated']
            );
            
            if ($result['failed'] > 0) {
                $message .= sprintf(' %d failed.', $result['failed']);
            }
            
            wp_send_json_success([
                'message' => $message,
                'stats' => $result
            ]);
        } else {
            wp_send_json_error([
                'message' => 'No links were generated. Please check your content.',
                'errors' => $result['errors'] ?? []
            ]);
        }
    }
    
    /**
     * AJAX: Start batch generation
     */
    public static function ajax_start_batch_generation() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $progress = BatchProcessor::start_batch();
        wp_send_json_success($progress);
    }
    
    /**
     * AJAX: Process next batch
     */
    public static function ajax_process_batch() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $result = BatchProcessor::process_next_batch();
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Get batch status
     */
    public static function ajax_get_batch_status() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        $status = BatchProcessor::get_status();
        wp_send_json_success($status);
    }
    
    /**
     * AJAX: Get violations summary
     */
    public static function ajax_get_violations_summary() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
            return;
        }
        
        $api = new API();
        $result = $api->get_violations_summary();
        
        error_log('402links: Violations AJAX handler - API result: ' . print_r($result, true));
        
        if ($result['success']) {
            // Extract agents and totals from flat result structure
            $response_data = [
                'agents' => $result['agents'] ?? [],
                'totals' => $result['totals'] ?? []
            ];
            
            error_log('402links: Violations AJAX handler - Sending response: ' . print_r($response_data, true));
            wp_send_json_success($response_data);
        } else {
            error_log('402links: Violations AJAX handler - Error: ' . ($result['error'] ?? 'Unknown error'));
            wp_send_json_error([
                'message' => $result['error'] ?? 'Failed to fetch violations data'
            ]);
        }
    }
    
    /**
     * AJAX: Cancel batch
     */
    public static function ajax_cancel_batch() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        $result = BatchProcessor::cancel_batch();
        wp_send_json_success($result);
    }
    
    /**
     * AJAX: Check wallet sync status
     * Returns whether the current wallet is already synced to Supabase
     */
    public static function ajax_check_wallet_sync_status() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $settings = get_option('402links_settings', []);
        $local_wallet = $settings['payment_wallet'] ?? '';
        $site_id = get_option('402links_site_id');
        
        if (!$site_id || !$local_wallet) {
            wp_send_json_success([
                'synced' => false,
                'wallet' => $local_wallet,
                'reason' => 'no_site_or_wallet'
            ]);
            return;
        }
        
        // Check if wallet matches what's in Supabase
        $api = new API();
        $result = $api->get_site_info($site_id);
        
        if ($result['success'] && isset($result['data']['agent_payment_wallet'])) {
            $remote_wallet = strtolower($result['data']['agent_payment_wallet'] ?? '');
            $is_synced = (strtolower($local_wallet) === $remote_wallet);
            
            wp_send_json_success([
                'synced' => $is_synced,
                'wallet' => $local_wallet,
                'remote_wallet' => $result['data']['agent_payment_wallet']
            ]);
        } else {
            wp_send_json_success([
                'synced' => false,
                'wallet' => $local_wallet,
                'reason' => 'api_error'
            ]);
        }
    }
    
    /**
     * AJAX: Get agent violations
     */
    public static function ajax_get_violations() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $site_id = get_option('402links_site_id');
        if (!$site_id) {
            wp_send_json_error(['message' => 'Site not registered']);
        }
        
        $api = new API();
        $result = $api->get_violations($site_id);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Get site bot policies
     */
    public static function ajax_get_site_bot_policies() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $site_id = get_option('402links_site_id');
        if (!$site_id) {
            wp_send_json_error(['message' => 'Site not registered']);
        }
        
        $api = new API();
        $result = $api->get_site_bot_policies($site_id);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX: Update site bot policies
     */
    public static function ajax_update_site_bot_policies() {
        check_ajax_referer('agent_hub_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }
        
        $site_id = get_option('402links_site_id');
        if (!$site_id) {
            wp_send_json_error(['message' => 'Site not registered']);
        }
        
        $policies = $_POST['policies'] ?? [];
        
        if (empty($policies)) {
            wp_send_json_error(['message' => 'No policies provided']);
        }
        
        $api = new API();
        $result = $api->update_site_bot_policies($site_id, $policies);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
}

<?php
namespace AgentHub;

class PaymentGate {
    use PaymentGateHelpers;
    /**
     * Intercept requests and apply 402 payment gate
     * Called on 'template_redirect' hook
     * 
     * DUAL DETECTION: AI agents always see 402, humans see 402 only if blocked
     */
    public static function intercept_request() {
        // Skip if not singular post/page
        if (!is_singular(['post', 'page'])) {
            return;
        }
        
        global $post;
        
        // Check if post has a 402link (need to check before admin bypass)
        $link_id = get_post_meta($post->ID, '_402links_id', true);
        
        // Skip if user is logged in admin
        if (current_user_can('manage_options')) {
            // If admin is viewing protected post, show preview notice
            if (!empty($link_id)) {
                add_action('admin_bar_menu', function($wp_admin_bar) use ($post) {
                    $block_humans = get_post_meta($post->ID, '_402link_block_humans', true);
                    $protection_type = ($block_humans === '1' || $block_humans === 1) 
                        ? 'Agents + Humans' 
                        : 'Agents Only';
                        
                    $wp_admin_bar->add_node([
                        'id' => '402links-preview-notice',
                        'title' => '⚠️ ADMIN PREVIEW - Paywall Active (' . $protection_type . ')',
                        'href' => false,
                        'meta' => [
                            'class' => '402links-preview-warning',
                            'title' => 'You are viewing as admin. Others will see paywall. Test in incognito to verify.'
                        ]
                    ]);
                }, 999);
                
                // Enqueue CSS for admin bar warning
                add_action('wp_enqueue_scripts', function() {
                    wp_add_inline_style('admin-bar', '
                        #wp-admin-bar-402links-preview-notice > .ab-item {
                            background-color: #ff9800 !important;
                            color: #000 !important;
                            font-weight: bold !important;
                            animation: pulse 2s infinite;
                        }
                        #wp-admin-bar-402links-preview-notice > .ab-item:hover {
                            background-color: #f57c00 !important;
                        }
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.7; }
                        }
                    ');
                });
            }
            return;
        }
        
        error_log('===== 402links PaymentGate: Intercepting Request =====');
        error_log('Post ID: ' . $post->ID);
        error_log('Post Title: ' . get_the_title($post->ID));
        error_log('User-Agent: ' . ($_SERVER['HTTP_USER_AGENT'] ?? 'NONE'));
        
        // Link ID already checked above before admin bypass
        error_log('402links ID meta: ' . ($link_id ?: 'NOT SET'));
        
        if (empty($link_id)) {
            error_log('402links: NOT PROTECTED - No link_id meta found');
            error_log('===== 402links PaymentGate: ALLOWING ACCESS =====');
            return; // Not protected
        }
        
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        $agent_check = AgentDetector::is_bot($user_agent);
        
        error_log('Agent Check Result: ' . json_encode($agent_check));
        
        // For detected bots, check robots.txt compliance and policy
        if ($agent_check['is_bot']) {
            $site_id = get_option('402links_site_id');
            
            // Check robots.txt compliance
            $robots_check = self::check_robots_txt_compliance($request_uri, $agent_check['bot_name']);
            
            // Get bot policy
            $api = new API();
            $policy_result = $api->get_bot_registry();
            
            $bot_action = 'monetize'; // Default
            if ($policy_result['success'] && !empty($policy_result['data'])) {
                foreach ($policy_result['data'] as $registry_bot) {
                    if ($registry_bot['bot_name'] === $agent_check['bot_name']) {
                        $bot_action = $registry_bot['default_action'] ?? 'monetize';
                        break;
                    }
                }
            }
            
            // Log the bot crawl with detailed info
            self::log_bot_crawl($site_id, $agent_check, $robots_check, $bot_action, $request_uri, $user_agent);
            
            // Apply bot-specific policy
            if ($bot_action === 'block') {
                error_log('402links: BOT BLOCKED by policy');
                status_header(403);
                wp_die(
                    '<h1>Access Denied</h1><p>This site blocks access from ' . esc_html($agent_check['bot_name']) . '.</p>',
                    'Forbidden',
                    ['response' => 403]
                );
            } elseif ($bot_action === 'allow') {
                error_log('402links: BOT ALLOWED by policy (free access)');
                return; // Allow free access
            }
            // If 'monetize', continue with normal 402 flow
        }
        
        // Determine if we should show 402
        $should_block = false;
        
        if ($agent_check['is_bot']) {
            error_log('402links: AGENT DETECTED - Will monetize');
            $should_block = true;
        } else {
            // For humans, check the block_humans flag
            $block_humans = get_post_meta($post->ID, '_402link_block_humans', true);
            error_log('Block Humans Meta: ' . ($block_humans ?: '0'));
            
            if ($block_humans === '1' || $block_humans === 1) {
                error_log('402links: HUMAN BLOCKING ENABLED - Will block');
                $should_block = true;
            } else {
                error_log('402links: HUMAN ALLOWED - Not blocking');
            }
        }
        
        if (!$should_block) {
            error_log('===== 402links PaymentGate: ALLOWING ACCESS =====');
            return; // Allow access
        }
        
        error_log('===== 402links PaymentGate: BLOCKING REQUEST =====');
        
        // Log the crawl attempt
        AgentDetector::log_crawl($post->ID, $agent_check, 'pending');
        
        // Check if blacklisted
        $settings = get_option('402links_settings');
        $site_id = get_option('402links_site_id');
        if (AgentDetector::is_blacklisted($user_agent, $site_id)) {
            wp_die('Access denied: Agent blacklisted', 'Forbidden', ['response' => 403]);
        }
        
        // UNIVERSAL REDIRECT: All unpaid visitors → 402links.com for payment
        $short_url = get_post_meta($post->ID, '_402links_url', true);
        
        if (!empty($short_url)) {
            if ($agent_check['is_bot']) {
                error_log('402links: REDIRECTING AGENT to ' . $short_url);
            } else {
                error_log('402links: REDIRECTING HUMAN to ' . $short_url);
            }
            wp_redirect($short_url, 302);
            exit;
        }
        
        // Fallback: If no short URL exists, show local paywall as emergency backup
        error_log('402links: WARNING - No short URL found! Showing fallback paywall.');
        $requirements = self::get_payment_requirements($post->ID);
        self::send_402_response($requirements);
        exit;
        
        // Verify payment with backend
        $verification = self::verify_payment($payment_header, $requirements);
        
        if (!$verification['isValid']) {
            self::send_402_response($requirements, $verification['error'] ?? 'Payment verification failed');
            exit;
        }
        
        // Log successful payment
        self::log_agent_payment($post->ID, $verification, $agent_check);
        
        // Set header for successful payment response
        add_filter('wp_headers', function($headers) use ($verification) {
            if (isset($verification['settlement_header'])) {
                $headers['X-PAYMENT-RESPONSE'] = $verification['settlement_header'];
            }
            return $headers;
        });
        
        // Allow access to content (WordPress will serve normally)
    }
    
    /**
     * Build x402 payment requirements
     * Mirrors access-link.ts payment structure
     * 
     * SECURITY FIX: bind_hash is now persisted in post meta to prevent replay attacks
     */
    private static function get_payment_requirements($post_id) {
        $settings = get_option('402links_settings');
        
        // Get post-specific price or use default
        $price = get_post_meta($post_id, '_402links_price', true);
        if (empty($price)) {
            $price = $settings['default_price'] ?? 0.10;
        }
        $price = floatval($price);
        
        $payment_wallet = $settings['payment_wallet'] ?? '';
        
        // Validate wallet is configured before sending 402 response
        if (empty($payment_wallet)) {
            error_log('402links PaymentGate: Payment wallet not configured - content NOT protected');
            return; // Skip 402 response, allow normal WordPress content delivery
        }
        
        $network = $settings['network'] ?? 'base';
        
        // Network configuration
        $network_config = [
            'base' => [
                'chain_id' => 8453,
                'usdc' => '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
            ],
            'base-sepolia' => [
                'chain_id' => 84532,
                'usdc' => '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
            ]
        ];
        
        $config = $network_config[$network] ?? $network_config['base'];
        $maxAmountRequired = (string)floor($price * 1000000); // Convert to USDC base units
        
        // SECURITY: Generate or retrieve persistent bind_hash and nonce
        $bind_hash = self::get_or_create_bind_hash($post_id, $payment_wallet, $price);
        $invoice_id = self::get_or_create_invoice_id($post_id);
        
        return [
            'scheme' => 'exact',
            'network' => $network,
            'asset' => $config['usdc'],
            'maxAmountRequired' => $maxAmountRequired,
            'payTo' => $payment_wallet,
            'resource' => get_permalink($post_id),
            'description' => get_the_title($post_id),
            'mimeType' => 'text/html',
            'maxTimeoutSeconds' => 60,
            'extra' => [
                'name' => 'USDC',
                'version' => '2',
                'bind_hash' => $bind_hash,
                'invoice_id' => $invoice_id,
                'post_id' => $post_id,
                'site_url' => get_site_url()
            ]
        ];
    }
    
    /**
     * Generate or retrieve persistent bind_hash for payment verification
     * This prevents replay attacks by ensuring each post has a unique, reusable hash
     * 
     * @param int $post_id Post ID
     * @param string $payment_wallet Payment wallet address
     * @param float $price Post price
     * @return string Persistent bind_hash
     */
    private static function get_or_create_bind_hash($post_id, $payment_wallet, $price) {
        // Check if bind_hash already exists
        $existing_hash = get_post_meta($post_id, '_402links_bind_hash', true);
        if (!empty($existing_hash)) {
            return $existing_hash;
        }
        
        // Generate new unique nonce for this post (never changes after creation)
        $unique_nonce = wp_generate_password(32, false);
        update_post_meta($post_id, '_402links_nonce', $unique_nonce);
        
        // Generate bind_hash using post-specific nonce
        $bind_hash = hash('sha256', $post_id . $payment_wallet . $price . $unique_nonce);
        update_post_meta($post_id, '_402links_bind_hash', $bind_hash);
        
        return $bind_hash;
    }
    
    /**
     * Generate or retrieve persistent invoice_id
     * 
     * @param int $post_id Post ID
     * @return string Persistent invoice_id
     */
    private static function get_or_create_invoice_id($post_id) {
        // Check if invoice_id already exists
        $existing_invoice_id = get_post_meta($post_id, '_402links_invoice_id', true);
        if (!empty($existing_invoice_id)) {
            return $existing_invoice_id;
        }
        
        // Generate new invoice_id
        $invoice_id = 'wp_' . $post_id . '_' . time() . '_' . wp_generate_password(8, false);
        update_post_meta($post_id, '_402links_invoice_id', $invoice_id);
        
        return $invoice_id;
    }
    
    /**
     * Check if request is from a browser
     */
    private static function is_browser_request() {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Browser will request text/html and have Mozilla in user agent
        return (strpos($accept, 'text/html') !== false && 
                strpos($user_agent, 'Mozilla') !== false);
    }
    
    /**
     * Send 402 Payment Required response
     * x402 spec compliant with proper PaymentRequirements in body
     * Returns HTML paywall for browsers, JSON for agents
     */
    private static function send_402_response($requirements, $error_msg = 'Payment Required') {
        $x402_response = [
            'x402Version' => 1,
            'error' => $error_msg,
            'accepts' => [$requirements]
        ];
        
        // Encode for WWW-Authenticate header
        $www_auth_payload = base64_encode(json_encode($x402_response));
        
        // Set response code
        status_header(402);
        
        // Set headers with x402 discovery info
        header('WWW-Authenticate: x402="' . $www_auth_payload . '"');
        header('X-402-Version: 1');
        header('X-402-Scheme: exact');
        header('X-402-Network: ' . $requirements['network']);
        header('X-402-Amount: ' . $requirements['maxAmountRequired']);
        header('X-402-Currency: USDC');
        header('X-402-Asset: ' . $requirements['asset']);
        header('X-402-PayTo: ' . $requirements['payTo']);
        header('X-402-Resource: ' . $requirements['resource']);
        header('X-402-Discovery: ' . get_site_url() . '/.well-known/402.json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Expose-Headers: WWW-Authenticate, X-402-Version, X-402-Scheme, X-402-Network, X-402-Amount, X-402-Currency, X-402-Asset, X-402-PayTo, X-402-Resource, X-402-Discovery');
        
        // BROWSER vs AGENT: Return HTML for browsers, JSON for agents
        if (self::is_browser_request()) {
            require_once plugin_dir_path(__FILE__) . 'PaywallTemplate.php';
            header('Content-Type: text/html; charset=UTF-8');
            echo PaywallTemplate::render($x402_response, $requirements);
        } else {
            header('Content-Type: application/json');
            echo json_encode($x402_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        }
        
        exit;
    }
    
    /**
     * Verify payment with backend edge function
     * Calls: verify-wordpress-payment edge function
     */
    private static function verify_payment($payment_header, $requirements) {
        $settings = get_option('402links_settings');
        $api_key = get_option('402links_api_key');
        $api_endpoint = $settings['api_endpoint'] ?? 'https://api.402links.com/v1';
        
        $response = wp_remote_post($api_endpoint . '/verify-wordpress-payment', [
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key
            ],
            'body' => json_encode([
                'payment_header' => $payment_header,
                'payment_requirements' => $requirements,
                'post_id' => get_the_ID(),
                'site_url' => get_site_url()
            ])
        ]);
        
        if (is_wp_error($response)) {
            return ['isValid' => false, 'error' => $response->get_error_message()];
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['isValid' => false, 'error' => 'Invalid JSON response'];
        }
        
        return $data;
    }
    
    /**
     * Log successful payment to backend and local database
     */
    private static function log_agent_payment($post_id, $verification, $agent_check) {
        global $wpdb;
        $table_name = $wpdb->prefix . '402links_agent_logs';
        
        // Update local log
        $wpdb->update(
            $table_name,
            [
                'payment_status' => 'paid',
                'payment_tx_hash' => $verification['transaction'] ?? '',
                'amount_paid' => $verification['amount'] ?? 0
            ],
            [
                'post_id' => $post_id,
                'payment_status' => 'pending'
            ],
            ['%s', '%s', '%f'],
            ['%d', '%s']
        );
        
        // Send to backend for aggregation
        $settings = get_option('402links_settings');
        $api_key = get_option('402links_api_key');
        $api_endpoint = $settings['api_endpoint'] ?? 'https://api.402links.com/v1';
        
        wp_remote_post($api_endpoint . '/log-agent-payment', [
            'timeout' => 15,
            'blocking' => false, // Don't wait for response
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key
            ],
            'body' => json_encode([
                'post_id' => $post_id,
                'site_url' => get_site_url(),
                'agent_name' => $agent_check['agent_name'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'ip_address' => AgentDetector::get_client_ip(),
                'payment_tx_hash' => $verification['transaction'] ?? '',
                'amount' => $verification['amount'] ?? 0,
                'payer_address' => $verification['payer'] ?? ''
            ])
        ]);
    }
}

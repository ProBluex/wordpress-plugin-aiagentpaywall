<?php
namespace AgentHub;

/**
 * Helper methods for PaymentGate - Robots.txt & Bot Logging
 */
trait PaymentGateHelpers {
    
    /**
     * Check if bot is complying with robots.txt rules
     * 
     * @param string $request_uri Current request URI
     * @param string $bot_name Bot name from registry
     * @return array Compliance check results
     */
    private static function check_robots_txt_compliance($request_uri, $bot_name) {
        // Get robots.txt content
        $robots_txt = RobotsTxtParser::get_robots_txt();
        
        if (empty($robots_txt)) {
            return [
                'respected' => true,
                'directive' => null,
                'violation_type' => null,
                'expected' => 'no_rules',
                'actual' => 'access_attempted'
            ];
        }
        
        // Parse rules for this bot
        $rules = RobotsTxtParser::parse($robots_txt, $bot_name);
        
        // Check if current path is allowed
        $current_path = parse_url($request_uri, PHP_URL_PATH);
        $is_allowed = RobotsTxtParser::is_path_allowed($current_path, $rules);
        
        // Determine violation type
        $violation_type = null;
        if (!$is_allowed && $rules['has_disallow']) {
            $violation_type = 'ignored_disallow';
        }
        
        return [
            'respected' => $is_allowed || !$rules['has_disallow'],
            'directive' => $is_allowed ? 'Allow' : 'Disallow',
            'violation_type' => $violation_type,
            'expected' => $is_allowed ? 'allow' : 'deny',
            'actual' => 'access_attempted',
            'crawl_delay' => $rules['crawl_delay'] ?? null
        ];
    }
    
    /**
     * Log bot crawl with detailed tracking
     * 
     * @param string $site_id Site UUID
     * @param array $bot_info Bot information from detector
     * @param array $robots_check Robots.txt compliance results
     * @param string $action Applied policy action
     * @param string $request_uri Request URI
     * @param string $user_agent Full user agent string
     */
    private static function log_bot_crawl($site_id, $bot_info, $robots_check, $action, $request_uri, $user_agent) {
        $api = new API();
        
        // Get page info if available
        $post_id = get_the_ID();
        $page_id = null;
        
        if ($post_id) {
            $page_id = get_post_meta($post_id, '402links_page_id', true);
        }
        
        // Determine payment status based on action
        $payment_status = 'pending';
        if ($action === 'allow') {
            $payment_status = 'free_access';
        } elseif ($action === 'block') {
            $payment_status = 'blocked';
        }
        
        // Log to backend
        $log_data = [
            'site_id' => $site_id,
            'page_id' => $page_id,
            'agent_name' => $bot_info['bot_name'],
            'agent_user_agent' => substr($user_agent, 0, 500), // Truncate if too long
            'agent_ip_address' => self::get_client_ip(),
            'request_path' => $request_uri,
            'respected_robots_txt' => $robots_check['respected'],
            'robots_txt_directive' => $robots_check['directive'],
            'violation_type' => $robots_check['violation_type'],
            'expected_behavior' => $robots_check['expected'],
            'actual_behavior' => $robots_check['actual'],
            'payment_status' => $payment_status,
            'payment_required' => ($action === 'monetize'),
            'pages_accessed' => 1
        ];
        
        // Call API to log crawl
        $api->log_agent_crawl($log_data);
    }
    
    /**
     * Get client IP address (supports proxies)
     * 
     * @return string Client IP address
     */
    private static function get_client_ip() {
        $ip_keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs (proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
}

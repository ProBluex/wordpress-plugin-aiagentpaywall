<?php
namespace AgentHub;

class AgentDetector {
    // Bot registry will be loaded from backend
    private static $bot_registry = null;
    
    /**
     * Get bot registry from API with caching
     * 
     * @return array Bot registry
     */
    private static function get_bot_registry() {
        // Check cache first
        $registry = get_transient('402links_bot_registry');
        if (false !== $registry) {
            return $registry;
        }
        
        // Fetch from API
        $api = new API();
        $result = $api->get_bot_registry();
        
        if ($result['success'] && isset($result['data'])) {
            $registry = $result['data'];
            set_transient('402links_bot_registry', $registry, HOUR_IN_SECONDS);
            return $registry;
        }
        
        // Fallback to empty array if API fails
        error_log('402links: Failed to fetch bot registry from API');
        return [];
    }
    
    /**
     * Check if the user agent is an AI agent
     * 
     * @param string $user_agent
     * @return array ['is_agent' => bool, 'agent_name' => string|null]
     */
    public static function is_ai_agent($user_agent) {
        if (empty($user_agent)) {
            return ['is_bot' => false, 'bot_name' => null, 'bot_id' => null, 'company' => null, 'category' => null];
        }
        
        $registry = self::get_bot_registry();
        
        // Match against bot registry patterns
        foreach ($registry as $bot) {
            if (!isset($bot['user_agent_patterns']) || !is_array($bot['user_agent_patterns'])) {
                continue;
            }
            
            foreach ($bot['user_agent_patterns'] as $pattern) {
                if (stripos($user_agent, $pattern) !== false) {
                    return [
                        'is_bot' => true,
                        'bot_id' => $bot['id'],
                        'bot_name' => $bot['bot_name'],
                        'company' => $bot['company'],
                        'category' => $bot['bot_category']
                    ];
                }
            }
        }
        
        // Fallback: generic bot detection
        $generic_keywords = ['bot', 'crawler', 'spider', 'scraper'];
        $ua_lower = strtolower($user_agent);
        foreach ($generic_keywords as $keyword) {
            if (strpos($ua_lower, $keyword) !== false) {
                return [
                    'is_bot' => true,
                    'bot_id' => null,
                    'bot_name' => 'Generic Agent',
                    'company' => 'Unknown',
                    'category' => 'Other'
                ];
            }
        }
        
        return ['is_bot' => false, 'bot_name' => null, 'bot_id' => null, 'company' => null, 'category' => null];
    }
    
    /**
     * Check if agent is blacklisted
     * 
     * @param string $user_agent
     * @param string $site_id
     * @return bool
     */
    public static function is_blacklisted($user_agent, $site_id = null) {
        $api = new API();
        $result = $api->check_blacklist($user_agent, $site_id);
        
        return $result['is_blacklisted'] ?? false;
    }
    
    /**
     * Log agent crawl attempt
     * 
     * @param int $post_id
     * @param array $agent_info
     * @param string $payment_status
     */
    public static function log_crawl($post_id, $agent_info, $payment_status = 'unpaid') {
        global $wpdb;
        $table_name = $wpdb->prefix . '402links_agent_logs';
        
        $wpdb->insert(
            $table_name,
            [
                'post_id' => $post_id,
                'agent_name' => $agent_info['agent_name'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'ip_address' => self::get_client_ip(),
                'payment_status' => $payment_status,
                'created_at' => current_time('mysql')
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s']
        );
    }
    
    /**
     * Get client IP address
     * 
     * @return string
     */
    private static function get_client_ip() {
        $ip_keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (isset($_SERVER[$key]) && filter_var($_SERVER[$key], FILTER_VALIDATE_IP)) {
                return $_SERVER[$key];
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}

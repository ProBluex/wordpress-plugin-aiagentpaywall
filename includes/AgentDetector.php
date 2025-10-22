<?php
namespace AgentHub;

class AgentDetector {
    // Known AI agent patterns - expanded for better detection
    private static $agent_patterns = [
        // Major AI agents
        'GPTBot',
        'ClaudeBot',
        'Claude-Web',
        'anthropic-ai',
        'ChatGPT-User',
        'cohere-ai',
        'Perplexitybot',
        'Bytespider',
        'Google-Extended',
        'Applebot-Extended',
        'CCBot',
        'Diffbot',
        'omgili',
        'omgilibot',
        'YouBot',
        'Timpibot',
        'PetalBot',
        'AdsBot',
        
        // Generic patterns for catch-all detection
        'bot/',
        'Bot/',
        'crawler',
        'Crawler',
        'spider',
        'Spider',
        'scraper',
        'Scraper',
        'agent/',
        'Agent/',
        
        // Our own test agent
        'x402-agent',
        'x402-crawler'
    ];
    
    /**
     * Check if the user agent is an AI agent
     * 
     * @param string $user_agent
     * @return array ['is_agent' => bool, 'agent_name' => string|null]
     */
    public static function is_ai_agent($user_agent) {
        if (empty($user_agent)) {
            return ['is_agent' => false, 'agent_name' => null];
        }
        
        $ua_lower = strtolower($user_agent);
        
        // Check specific patterns first (case-insensitive)
        foreach (self::$agent_patterns as $pattern) {
            if (stripos($user_agent, $pattern) !== false) {
                return [
                    'is_agent' => true,
                    'agent_name' => $pattern
                ];
            }
        }
        
        // Fallback: detect generic bot/crawler/spider patterns
        $generic_keywords = ['bot', 'crawler', 'spider', 'scraper'];
        foreach ($generic_keywords as $keyword) {
            if (strpos($ua_lower, $keyword) !== false) {
                return [
                    'is_agent' => true,
                    'agent_name' => 'Generic Agent'
                ];
            }
        }
        
        return ['is_agent' => false, 'agent_name' => null];
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

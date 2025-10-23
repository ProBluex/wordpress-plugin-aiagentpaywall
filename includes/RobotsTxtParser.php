<?php
namespace AgentHub;

class RobotsTxtParser {
    /**
     * Parse robots.txt content and extract rules for specific user-agent
     * 
     * @param string $robots_txt_content Full robots.txt content
     * @param string $bot_name Bot name to match
     * @return array Rules applicable to this bot
     */
    public static function parse($robots_txt_content, $bot_name) {
        if (empty($robots_txt_content)) {
            return [
                'has_disallow' => false,
                'disallow_paths' => [],
                'allow_paths' => [],
                'crawl_delay' => null
            ];
        }
        
        $lines = explode("\n", $robots_txt_content);
        $rules = [
            'has_disallow' => false,
            'disallow_paths' => [],
            'allow_paths' => [],
            'crawl_delay' => null
        ];
        
        $current_user_agent = null;
        $applies_to_all = false;
        $applies_to_bot = false;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip comments and empty lines
            if (empty($line) || strpos($line, '#') === 0) {
                continue;
            }
            
            // Parse directives
            if (stripos($line, 'User-agent:') === 0) {
                $agent = trim(substr($line, 11));
                
                // Reset flags
                $applies_to_all = ($agent === '*');
                $applies_to_bot = (stripos($agent, $bot_name) !== false);
                $current_user_agent = $agent;
            } elseif (($applies_to_all || $applies_to_bot) && stripos($line, 'Disallow:') === 0) {
                $path = trim(substr($line, 9));
                if (!empty($path)) {
                    $rules['disallow_paths'][] = $path;
                    $rules['has_disallow'] = true;
                }
            } elseif (($applies_to_all || $applies_to_bot) && stripos($line, 'Allow:') === 0) {
                $path = trim(substr($line, 6));
                if (!empty($path)) {
                    $rules['allow_paths'][] = $path;
                }
            } elseif (($applies_to_all || $applies_to_bot) && stripos($line, 'Crawl-delay:') === 0) {
                $delay = trim(substr($line, 12));
                if (is_numeric($delay)) {
                    $rules['crawl_delay'] = intval($delay);
                }
            }
        }
        
        return $rules;
    }
    
    /**
     * Check if a path is allowed based on robots.txt rules
     * 
     * @param string $path Path to check
     * @param array $rules Parsed rules from robots.txt
     * @return bool True if path is allowed
     */
    public static function is_path_allowed($path, $rules) {
        // First check explicit Allow paths (they override Disallow)
        foreach ($rules['allow_paths'] as $allow_path) {
            if (self::path_matches($path, $allow_path)) {
                return true;
            }
        }
        
        // Then check Disallow paths
        foreach ($rules['disallow_paths'] as $disallow_path) {
            if (self::path_matches($path, $disallow_path)) {
                return false;
            }
        }
        
        // If no rules matched, allow by default
        return true;
    }
    
    /**
     * Check if a path matches a pattern from robots.txt
     * 
     * @param string $path Actual path
     * @param string $pattern Pattern from robots.txt
     * @return bool True if path matches pattern
     */
    private static function path_matches($path, $pattern) {
        // Wildcard support: * matches any sequence
        // $ at end matches end of path
        
        $pattern = str_replace('*', '.*', preg_quote($pattern, '/'));
        $pattern = str_replace('\$', '$', $pattern);
        
        return (bool)preg_match('/^' . $pattern . '/i', $path);
    }
    
    /**
     * Get robots.txt content for current site
     * 
     * @return string Robots.txt content
     */
    public static function get_robots_txt() {
        $robots_url = get_site_url() . '/robots.txt';
        
        $response = wp_remote_get($robots_url, [
            'timeout' => 5,
            'sslverify' => false
        ]);
        
        if (is_wp_error($response)) {
            return '';
        }
        
        return wp_remote_retrieve_body($response);
    }
}

<?php
namespace AgentHub;

class API {
    private $api_key;
    private $api_endpoint;
    
    public function __construct() {
        $this->api_key = get_option('402links_api_key');
        $settings = get_option('402links_settings');
        $this->api_endpoint = $settings['api_endpoint'] ?? 'https://api.402links.com/v1';
    }
    
    /**
     * Register WordPress site with 402links backend
     */
    public function register_site() {
        // Get the stored API key ID from the api_keys table lookup
        $api_key_id = $this->get_api_key_id();
        
        $payload = [
            'site_url' => get_site_url(),
            'site_name' => get_bloginfo('name'),
            'admin_email' => get_bloginfo('admin_email'),
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => AGENT_HUB_VERSION
        ];
        
        // Only include api_key_id if we have one
        if ($api_key_id) {
            $payload['api_key_id'] = $api_key_id;
        }
        
        $result = $this->request('POST', '/register-wordpress-site', $payload);
        
        // Handle specific API key reuse error
        if (!$result['success'] && isset($result['error']) && strpos($result['error'], 'already being used') !== false) {
            error_log('402links: API key is already in use by another site');
            return [
                'success' => false,
                'error' => $result['error'],
                'error_code' => 'API_KEY_IN_USE'
            ];
        }
        
        return $result;
    }
    
    /**
     * Get the API key ID from the api_keys table
     * This queries the backend using the API key to find its ID
     */
    private function get_api_key_id() {
        if (!$this->api_key) {
            return null;
        }
        
        // Make authenticated request - the API key middleware will look it up
        $response = $this->request('GET', '/get-api-key-id');
        
        if ($response['success'] && isset($response['api_key_id'])) {
            return $response['api_key_id'];
        }
        
        return null;
    }
    
    /**
     * Create a 402link for a WordPress post
     */
    public function create_link($post_id) {
        $post = get_post($post_id);
        $settings = get_option('402links_settings');
        
        $price = get_post_meta($post_id, '_402links_price', true);
        if (empty($price)) {
            $price = $settings['default_price'] ?? 0.10;
        }
        
        // Get post excerpt
        $excerpt = $post->post_excerpt;
        if (empty($excerpt)) {
            $excerpt = wp_trim_words(strip_tags($post->post_content), 30);
        }
        
        // Get author information
        $author = get_the_author_meta('display_name', $post->post_author);
        
        // Get featured image
        $featured_image_url = get_the_post_thumbnail_url($post_id, 'large');
        
        // Calculate word count
        $word_count = str_word_count(strip_tags($post->post_content));
        
        // Get tags
        $tags = [];
        $post_tags = get_the_tags($post_id);
        if ($post_tags && !is_wp_error($post_tags)) {
            foreach ($post_tags as $tag) {
                $tags[] = $tag->name;
            }
        }
        
        // Get categories for description
        $categories = get_the_category($post_id);
        $category_names = [];
        if ($categories) {
            foreach ($categories as $category) {
                $category_names[] = $category->name;
            }
        }
        
        $payload = [
            'post_id' => $post_id,
            'title' => get_the_title($post_id),
            'url' => get_permalink($post_id),
            'price' => floatval($price),
            'site_url' => get_site_url(),
            'content_type' => $post->post_type,
            'published_at' => $post->post_date,
            'excerpt' => $excerpt,
            'author' => $author,
            'featured_image_url' => $featured_image_url ?: null,
            'word_count' => $word_count,
            'tags' => $tags,
            'description' => !empty($category_names) ? 'Filed under: ' . implode(', ', $category_names) : ''
        ];
        
        error_log('402links: Creating link for post ' . $post_id . ' with payload: ' . json_encode($payload));
        
        return $this->request('POST', '/create-wordpress-link', $payload);
    }
    
    /**
     * Update existing 402link
     */
    public function update_link($post_id, $link_id) {
        $settings = get_option('402links_settings');
        
        $price = get_post_meta($post_id, '_402links_price', true);
        if (empty($price)) {
            $price = $settings['default_price'] ?? 0.10;
        }
        
        return $this->request('PUT', '/update-wordpress-link', [
            'site_url' => get_site_url(),
            'link_id' => $link_id,
            'post_id' => $post_id,
            'title' => get_the_title($post_id),
            'url' => get_permalink($post_id),
            'price' => floatval($price)
        ]);
    }
    
    /**
     * Get analytics for the site
     */
    public function get_analytics($timeframe = '30d') {
        return $this->request('POST', '/wordpress-analytics', [
            'site_url' => get_site_url(),
            'timeframe' => $timeframe
        ]);
    }
    
    /**
     * Check if agent is blacklisted
     */
    public function check_blacklist($user_agent, $site_id = null) {
        if (!$site_id) {
            $site_id = get_option('402links_site_id');
        }
        
        return $this->request('POST', '/check-agent-blacklist', [
            'user_agent' => $user_agent,
            'site_id' => $site_id
        ]);
    }
    
    /**
     * Get all links for this site
     */
    public function get_links($page = 1, $per_page = 20) {
        $site_id = get_option('402links_site_id');
        return $this->request('GET', "/wordpress-links?site_id={$site_id}&page={$page}&per_page={$per_page}");
    }
    
    /**
     * Get page analytics for all synced pages
     */
    public function get_pages_analytics($site_id) {
        return $this->request('GET', '/get-site-pages-analytics?site_id=' . $site_id);
    }
    
    /**
     * Sync payment wallet to Supabase
     */
    public function sync_wallet($site_id, $wallet) {
        return $this->request('POST', '/sync-site-wallet', [
            'site_id' => $site_id,
            'payment_wallet' => $wallet
        ]);
    }
    
    /**
     * Get site info from Supabase
     */
    public function get_site_info($site_id) {
        return $this->request('GET', '/get-site-info?site_id=' . $site_id);
    }
    
    /**
     * Get bot registry from Supabase
     * Returns all active bots with their detection patterns
     */
    public function get_bot_registry() {
        $result = $this->request('GET', '/get-bot-registry');
        
        if ($result['success'] && isset($result['bots'])) {
            return $result['bots'];
        }
        
        error_log('402links: Failed to fetch bot registry: ' . ($result['error'] ?? 'Unknown error'));
        return [];
    }
    
    /**
     * Report agent violation to backend
     * 
     * @param array $violation_data {
     *     @type string $site_id Site UUID
     *     @type int $wordpress_post_id WordPress post ID
     *     @type string $agent_name Bot/Agent name
     *     @type string $user_agent Full user agent string
     *     @type string $ip_address Client IP address
     *     @type string $requested_url The URL that was accessed
     *     @type string $violation_type Type: 'unpaid_access', 'ignored_402', 'scraped_content', 'robots_txt'
     *     @type string $detected_at ISO 8601 timestamp
     *     @type string $robots_txt_directive Optional robots.txt rule that was violated
     * }
     * @return array Response from backend
     */
    public function report_violation($violation_data) {
        $site_id = get_option('402links_site_id');
        if (!$site_id) {
            error_log('402links: Cannot report violation - site not registered');
            return ['success' => false, 'error' => 'Site not registered'];
        }
        
        // Ensure required fields
        $payload = array_merge([
            'site_id' => $site_id,
            'detected_at' => gmdate('Y-m-d\TH:i:s\Z')
        ], $violation_data);
        
        error_log('402links: Reporting violation: ' . json_encode($payload));
        
        return $this->request('POST', '/report-violation', $payload);
    }
    
    /**
     * Static wrapper for report_violation() for use in PaymentGate
     * Creates temporary API instance and reports violation
     * Non-blocking - failures won't prevent 402 response
     * 
     * @param array $violation_data Violation data array
     * @return array Response from backend (or error array)
     */
    public static function report_violation_static($violation_data) {
        error_log('402links: Static violation report called');
        
        try {
            $api = new self();
            $result = $api->report_violation($violation_data);
            
            if (isset($result['success']) && $result['success']) {
                error_log('402links: Violation reported successfully');
            } else {
                error_log('402links: Violation report failed: ' . json_encode($result));
            }
            
            return $result;
        } catch (\Exception $e) {
            error_log('402links: EXCEPTION in report_violation_static: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Get agent violations from backend
     * 
     * @param string $site_id Site UUID
     * @param array $filters Optional filters (violation_type, agent_name, start_date, end_date)
     * @return array Response from backend
     */
    public function get_violations($site_id, $filters = []) {
        $params = array_merge(['site_id' => $site_id], $filters);
        $query_string = http_build_query($params);
        
        $result = $this->request('GET', '/get-violations?' . $query_string);
        
        if ($result['success'] && isset($result['violations'])) {
            return [
                'success' => true,
                'violations' => $result['violations'],
                'count' => $result['count'] ?? count($result['violations'])
            ];
        }
        
        error_log('402links: Failed to fetch violations: ' . ($result['error'] ?? 'Unknown error'));
        return [
            'success' => false,
            'error' => $result['error'] ?? 'Failed to fetch violations',
            'violations' => [],
            'count' => 0
        ];
    }
    
    /**
     * Register REST API routes
     */
    public static function register_rest_routes() {
        register_rest_route('402links/v1', '/sync-meta', [
            'methods' => 'POST',
            'callback' => [self::class, 'rest_sync_meta'],
            'permission_callback' => [self::class, 'rest_permission_check']
        ]);
    }
    
    /**
     * REST API permission check
     */
    public static function rest_permission_check($request) {
        $auth_header = $request->get_header('X-402Links-Auth');
        if (empty($auth_header)) {
            return new \WP_Error('no_auth', 'Missing authentication', ['status' => 401]);
        }
        
        // Extract Bearer token
        $api_key = str_replace('Bearer ', '', $auth_header);
        $stored_key = get_option('402links_api_key');
        
        if ($api_key !== $stored_key) {
            return new \WP_Error('invalid_auth', 'Invalid API key', ['status' => 403]);
        }
        
        return true;
    }
    
    /**
     * REST API endpoint: Sync post meta from Supabase
     */
    public static function rest_sync_meta($request) {
        error_log('===== 402links REST SYNC CALLED =====');
        error_log('Request params: ' . json_encode($request->get_json_params()));
        
        $params = $request->get_json_params();
        
        $post_id = $params['post_id'] ?? null;
        $link_id = $params['link_id'] ?? null;
        $short_id = $params['short_id'] ?? null;
        $link_url = $params['link_url'] ?? null;
        $force_agent = $params['force_agent_payment'] ?? true;
        $force_human = $params['force_human_payment'] ?? false;
        
        if (!$post_id || !$link_id) {
            error_log('402links: SYNC FAILED - Missing required params');
            return new \WP_Error('missing_params', 'Missing required parameters', ['status' => 400]);
        }
        
        error_log('402links: Syncing meta for post ' . $post_id . ' with link ' . $link_id);
        error_log('402links: force_human_payment = ' . ($force_human ? 'true' : 'false'));
        
        // Update post meta to enable PaymentGate blocking
        update_post_meta($post_id, '_402links_id', $link_id);
        update_post_meta($post_id, '_402links_short_id', $short_id);
        update_post_meta($post_id, '_402links_url', $link_url);
        update_post_meta($post_id, '_402links_synced_at', current_time('mysql'));
        update_post_meta($post_id, '_402link_block_humans', $force_human ? '1' : '0');
        
        error_log('402links: SYNC SUCCESS - Post meta updated for post ' . $post_id);
        error_log('===== 402links REST SYNC COMPLETE =====');
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Post meta updated',
            'post_id' => $post_id
        ]);
    }
    
    /**
     * Bulk sync meta for all existing links from Supabase
     */
    public function bulk_sync_meta() {
        $site_id = get_option('402links_site_id');
        if (!$site_id) {
            return [
                'success' => false,
                'error' => 'Site not registered'
            ];
        }
        
        // Get all pages from Supabase
        $result = $this->request('GET', '/get-site-pages-analytics?site_id=' . $site_id);
        
        if (!$result['success'] || !isset($result['data']['pages'])) {
            return [
                'success' => false,
                'error' => 'Failed to fetch pages from backend'
            ];
        }
        
        $pages = $result['data']['pages'];
        $updated = 0;
        
        foreach ($pages as $page) {
            if (!isset($page['wordpress_post_id']) || !isset($page['paid_link_id'])) {
                continue;
            }
            
            $post_id = $page['wordpress_post_id'];
            
            // Get paid_link details
            $paid_link_result = $this->request('GET', "/paid-links/{$page['paid_link_id']}");
            if (!$paid_link_result['success']) {
                continue;
            }
            
            $paid_link = $paid_link_result['data'];
            $link_url = 'https://402links.com/p/' . $paid_link['short_id'];
            
            // Update post meta
            update_post_meta($post_id, '_402links_id', $page['paid_link_id']);
            update_post_meta($post_id, '_402links_short_id', $paid_link['short_id']);
            update_post_meta($post_id, '_402links_url', $link_url);
            update_post_meta($post_id, '_402links_synced_at', current_time('mysql'));
            update_post_meta($post_id, '_402link_block_humans', $page['force_human_payment'] ? '1' : '0');
            
            $updated++;
        }
        
        return [
            'success' => true,
            'updated' => $updated,
            'message' => "Synced {$updated} posts"
        ];
    }
    
    /**
     * Get violations summary from backend
     */
    public function get_violations_summary() {
        $site_id = get_option('402links_site_id');
        
        if (!$site_id) {
            return [
                'success' => false,
                'error' => 'Site not registered. Please complete setup first.'
            ];
        }
        
        return $this->request('GET', '/get-agent-violations-summary', [
            'site_id' => $site_id
        ]);
    }
    
    /**
     * Get site bot policies from backend
     */
    public function get_site_bot_policies($site_id) {
        if (!$site_id) {
            return [
                'success' => false,
                'error' => 'Site ID is required'
            ];
        }
        
        return $this->request('GET', '/get-site-bot-policies', [
            'site_id' => $site_id
        ]);
    }
    
    /**
     * Get basic dashboard stats (no premium required)
     */
    public function get_basic_stats($site_id) {
        return $this->request('GET', '/get-site-basic-stats', [
            'site_id' => $site_id
        ]);
    }
    
    /**
     * Update site bot policies
     */
    public function update_site_bot_policies($site_id, $policies) {
        if (!$site_id) {
            return [
                'success' => false,
                'error' => 'Site ID is required'
            ];
        }
        
        if (!is_array($policies)) {
            return [
                'success' => false,
                'error' => 'Policies must be an array'
            ];
        }
        
        // Validate policy structure
        foreach ($policies as $policy) {
            if (!isset($policy['bot_registry_id']) || !isset($policy['action'])) {
                return [
                    'success' => false,
                    'error' => 'Each policy must have bot_registry_id and action'
                ];
            }
        }
        
        return $this->request('POST', '/update-site-bot-policies', [
            'site_id' => $site_id,
            'policies' => $policies
        ]);
    }
    
    /**
     * Make HTTP request to API
     */
    private function request($method, $endpoint, $data = []) {
        $url = $this->api_endpoint . $endpoint;
        
        // For GET requests, append data as query parameters
        if ($method === 'GET' && !empty($data)) {
            $url = add_query_arg($data, $url);
        }
        
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key
            ]
        ];
        
        if ($method === 'POST' || $method === 'PUT') {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            $error_msg = $response->get_error_message();
            error_log('402links: API request failed: ' . $error_msg);
            return [
                'success' => false,
                'error' => $error_msg
            ];
        }
        
        $body = wp_remote_retrieve_body($response);
        $status_code = wp_remote_retrieve_response_code($response);
        
        error_log('402links: API response (status ' . $status_code . '): ' . $body);
        
        $result = json_decode($body, true);
        
        if ($status_code >= 400) {
            error_log('402links: API error (status ' . $status_code . '): ' . ($result['error'] ?? 'Unknown error'));
            return [
                'success' => false,
                'error' => $result['error'] ?? 'API request failed',
                'status_code' => $status_code
            ];
        }
        
        return array_merge(['success' => true], $result ?? []);
    }
}

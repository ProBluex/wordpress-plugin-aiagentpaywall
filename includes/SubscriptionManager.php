<?php
namespace AgentHub;

class SubscriptionManager {
    private static $cache_key = '402links_subscription_status';
    private static $cache_duration = 300; // 5 minutes
    
    /**
     * Check subscription status by polling Stripe API directly
     */
    public static function check_subscription_status() {
        $site_id = get_option('402links_site_id');
        
        if (!$site_id) {
            return [
                'subscribed' => false,
                'subscription_tier' => null,
                'subscription_status' => null,
                'error' => 'Site not registered'
            ];
        }
        
        // First try to get cached Stripe customer ID from our database
        $response = wp_remote_post('https://cnionwnknwnzpwfuacse.supabase.co/functions/v1/check-site-subscription', [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'site_id' => $site_id
            ]),
            'timeout' => 15
        ]);
        
        if (is_wp_error($response)) {
            error_log('402links: Subscription check failed: ' . $response->get_error_message());
            return [
                'subscribed' => false,
                'error' => $response->get_error_message()
            ];
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        // Cache the result
        set_transient(self::$cache_key, $body, self::$cache_duration);
        update_option(self::$cache_key, $body);
        
        return $body;
    }
    
    /**
     * Poll Stripe API directly for latest subscription status
     * This is called after successful checkout to immediately update status
     */
    public static function poll_stripe_for_subscription($site_id) {
        if (!$site_id) {
            return ['success' => false, 'error' => 'No site_id provided'];
        }
        
        // Call edge function that polls Stripe API
        $response = wp_remote_post('https://cnionwnknwnzpwfuacse.supabase.co/functions/v1/poll-stripe-subscription', [
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'site_id' => $site_id
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            error_log('402links: Stripe polling failed: ' . $response->get_error_message());
            return ['success' => false, 'error' => $response->get_error_message()];
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['subscribed']) && $body['subscribed']) {
            // Update cache immediately
            self::update_cached_status($body);
        }
        
        return $body;
    }
    
    /**
     * Get cached subscription status
     */
    public static function get_cached_status() {
        // Try transient first (faster)
        $cached = get_transient(self::$cache_key);
        if ($cached !== false) {
            return $cached;
        }
        
        // Fallback to option
        $cached = get_option(self::$cache_key);
        if ($cached) {
            return $cached;
        }
        
        // No cache, fetch fresh
        return self::check_subscription_status();
    }
    
    /**
     * Update cached subscription status
     */
    public static function update_cached_status($status) {
        set_transient(self::$cache_key, $status, self::$cache_duration);
        update_option(self::$cache_key, $status);
    }
    
    /**
     * Force refresh subscription status
     */
    public static function refresh_subscription_status() {
        delete_transient(self::$cache_key);
        return self::check_subscription_status();
    }
    
    /**
     * Check if user is a Pro subscriber
     */
    public static function is_pro_subscriber() {
        $status = self::get_cached_status();
        return isset($status['subscribed']) && $status['subscribed'] === true;
    }
    
    /**
     * Get subscription tier
     */
    public static function get_subscription_tier() {
        $status = self::get_cached_status();
        return $status['subscription_tier'] ?? null;
    }
    
    /**
     * Clear subscription cache
     */
    public static function clear_cache() {
        delete_transient(self::$cache_key);
        delete_option(self::$cache_key);
    }
}

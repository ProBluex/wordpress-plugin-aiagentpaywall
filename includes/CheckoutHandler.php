<?php
namespace AgentHub;

class CheckoutHandler {
    /**
     * Register AJAX handlers
     */
    public static function init() {
        add_action('wp_ajax_agent_hub_create_checkout', [__CLASS__, 'create_checkout_session']);
    }
    
    /**
     * Create Stripe checkout session via Supabase edge function
     */
    public static function create_checkout_session() {
        check_ajax_referer('agent_hub_checkout', 'nonce');
        
        $site_id = isset($_POST['site_id']) ? sanitize_text_field($_POST['site_id']) : null;
        $return_url = isset($_POST['return_url']) ? esc_url_raw($_POST['return_url']) : null;
        
        if (!$site_id) {
            wp_send_json_error(['message' => 'Site ID is required']);
            return;
        }
        
        if (!$return_url) {
            wp_send_json_error(['message' => 'Return URL is required']);
            return;
        }
        
        error_log('402links: Creating checkout session for site: ' . $site_id);
        
        // Call Supabase edge function to create checkout session
        $response = wp_remote_post('https://cnionwnknwnzpwfuacse.supabase.co/functions/v1/create-checkout-session', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . SUPABASE_ANON_KEY,
            ],
            'body' => json_encode([
                'siteId' => $site_id,
                'returnUrl' => $return_url
            ]),
            'timeout' => 30
        ]);
        
        if (is_wp_error($response)) {
            error_log('402links: Checkout session creation failed: ' . $response->get_error_message());
            wp_send_json_error(['message' => 'Failed to connect to checkout service']);
            return;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['sessionId'])) {
            error_log('402links: Checkout session created: ' . $body['sessionId']);
            wp_send_json_success([
                'sessionId' => $body['sessionId'],
                'url' => $body['url']
            ]);
        } else {
            error_log('402links: Checkout session creation returned error: ' . json_encode($body));
            wp_send_json_error(['message' => $body['error'] ?? 'Failed to create checkout session']);
        }
    }
}

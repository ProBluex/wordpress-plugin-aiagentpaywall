<?php
/**
 * Direct Ecosystem Data Endpoint
 * 
 * Bypasses Admin.php and API.php to directly call wordpress-ecosystem-stats edge function.
 * This isolates the data flow for debugging ecosystem statistics display issues.
 */

// Load WordPress core
require_once(dirname(__FILE__) . '/../../../wp-load.php');

// Security check
if (!defined('ABSPATH')) {
    die('Direct access not allowed');
}

// Verify nonce
if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'agent_hub_nonce')) {
    wp_send_json_error(['message' => 'Invalid nonce']);
    exit;
}

// Check user permissions
if (!current_user_can('manage_options')) {
    wp_send_json_error(['message' => 'Unauthorized']);
    exit;
}

// Get timeframe parameter
$timeframe = sanitize_text_field($_POST['timeframe'] ?? '30d');

error_log('[ecosystem-data.php] 🌍 ==================== DIRECT ECOSYSTEM REQUEST ====================');
error_log('[ecosystem-data.php] 🌍 Timeframe: ' . $timeframe);

// Get API key
$api_key = get_option('402links_api_key');
if (empty($api_key)) {
    error_log('[ecosystem-data.php] ❌ No API key found');
    wp_send_json_error(['message' => 'API key not configured']);
    exit;
}

// Get site ID
$site_id = get_option('402links_site_id');
if (empty($site_id)) {
    error_log('[ecosystem-data.php] ❌ No site ID found');
    wp_send_json_error(['message' => 'Site not registered']);
    exit;
}

// Direct call to wordpress-ecosystem-stats edge function
$edge_function_url = 'https://cnionwnknwnzpwfuacse.supabase.co/functions/v1/wordpress-ecosystem-stats';

$request_body = [
    'timeframe' => $timeframe
];

error_log('[ecosystem-data.php] 🌍 Calling edge function: ' . $edge_function_url);
error_log('[ecosystem-data.php] 🌍 Request body: ' . json_encode($request_body));

$response = wp_remote_post($edge_function_url, [
    'timeout' => 15,
    'headers' => [
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer ' . $api_key,
        'x-site-id' => $site_id
    ],
    'body' => json_encode($request_body)
]);

// Handle errors
if (is_wp_error($response)) {
    $error_message = $response->get_error_message();
    error_log('[ecosystem-data.php] ❌ WP Error: ' . $error_message);
    wp_send_json_error(['message' => 'Request failed: ' . $error_message]);
    exit;
}

$status_code = wp_remote_retrieve_response_code($response);
$body = wp_remote_retrieve_body($response);

error_log('[ecosystem-data.php] 🌍 Response status: ' . $status_code);
error_log('[ecosystem-data.php] 🌍 Response body: ' . $body);

if ($status_code !== 200) {
    error_log('[ecosystem-data.php] ❌ Non-200 status code: ' . $status_code);
    wp_send_json_error([
        'message' => 'Edge function returned error',
        'status_code' => $status_code,
        'body' => $body
    ]);
    exit;
}

// Parse response
$data = json_decode($body, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log('[ecosystem-data.php] ❌ JSON decode error: ' . json_last_error_msg());
    wp_send_json_error(['message' => 'Invalid JSON response']);
    exit;
}

error_log('[ecosystem-data.php] ✅ Successfully retrieved ecosystem data');
error_log('[ecosystem-data.php] 🌍 Data keys: ' . json_encode(array_keys($data ?? [])));

if (isset($data['total_transactions'])) {
    error_log('[ecosystem-data.php] 🌍 total_transactions: ' . $data['total_transactions']);
}
if (isset($data['unique_buyers'])) {
    error_log('[ecosystem-data.php] 🌍 unique_buyers: ' . $data['unique_buyers']);
}
if (isset($data['unique_sellers'])) {
    error_log('[ecosystem-data.php] 🌍 unique_sellers: ' . $data['unique_sellers']);
}
if (isset($data['total_amount'])) {
    error_log('[ecosystem-data.php] 🌍 total_amount: ' . $data['total_amount']);
}

// Return success
wp_send_json_success($data);
exit;

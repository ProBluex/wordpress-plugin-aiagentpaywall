<?php
/**
 * Direct Ecosystem Data Endpoint
 * 
 * Bypasses Admin.php and API.php to directly call the wordpress-ecosystem-stats edge function.
 * This file provides a clean, standalone route for fetching ecosystem statistics.
 * 
 * @package Tolliver
 */

// Load WordPress core
require_once dirname(__FILE__) . '/../../../wp-load.php';

// Security: Verify nonce
if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'agent_hub_nonce')) {
    wp_send_json_error(['message' => 'Security check failed']);
    exit;
}

// Security: Check user capability
if (!current_user_can('manage_options')) {
    wp_send_json_error(['message' => 'Unauthorized']);
    exit;
}

// Get timeframe from request
$timeframe = sanitize_text_field($_POST['timeframe'] ?? '30d');

// Get API key from WordPress options
$api_key = get_option('402links_api_key');

if (empty($api_key)) {
    wp_send_json_error([
        'message' => 'API key not configured',
        'debug' => 'No API key found in WordPress options'
    ]);
    exit;
}

// Prepare request to edge function
$edge_function_url = 'https://cnionwnknwnzpwfuacse.supabase.co/functions/v1/wordpress-ecosystem-stats';

$request_body = json_encode([
    'timeframe' => $timeframe
]);

$headers = [
    'Content-Type' => 'application/json',
    'x-wordpress-api-key' => $api_key
];

error_log('[ecosystem-data.php] 🚀 Direct call to edge function');
error_log('[ecosystem-data.php] 📍 URL: ' . $edge_function_url);
error_log('[ecosystem-data.php] 📦 Body: ' . $request_body);
error_log('[ecosystem-data.php] 🔑 API Key: ' . substr($api_key, 0, 8) . '...');

// Make the HTTP request
$response = wp_remote_post($edge_function_url, [
    'timeout' => 15,
    'headers' => $headers,
    'body' => $request_body
]);

// Handle HTTP errors
if (is_wp_error($response)) {
    $error_message = $response->get_error_message();
    error_log('[ecosystem-data.php] ❌ HTTP Error: ' . $error_message);
    wp_send_json_error([
        'message' => 'HTTP request failed',
        'error' => $error_message
    ]);
    exit;
}

// Get response code and body
$response_code = wp_remote_retrieve_response_code($response);
$response_body = wp_remote_retrieve_body($response);

error_log('[ecosystem-data.php] 📬 Response Code: ' . $response_code);
error_log('[ecosystem-data.php] 📬 Response Body: ' . substr($response_body, 0, 500));

// Parse JSON response
$data = json_decode($response_body, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log('[ecosystem-data.php] ❌ JSON Parse Error: ' . json_last_error_msg());
    wp_send_json_error([
        'message' => 'Invalid JSON response from edge function',
        'error' => json_last_error_msg(),
        'raw_response' => substr($response_body, 0, 200)
    ]);
    exit;
}

// Check if edge function returned success
if (!isset($data['success']) || !$data['success']) {
    error_log('[ecosystem-data.php] ❌ Edge function returned error: ' . json_encode($data));
    wp_send_json_error([
        'message' => 'Edge function error',
        'error' => $data['error'] ?? 'Unknown error',
        'data' => $data
    ]);
    exit;
}

// Extract ecosystem data
$ecosystem_data = $data['data'] ?? [];

error_log('[ecosystem-data.php] ✅ Success! Data keys: ' . json_encode(array_keys($ecosystem_data)));
error_log('[ecosystem-data.php] 📊 Total Transactions: ' . ($ecosystem_data['total_transactions'] ?? 0));
error_log('[ecosystem-data.php] 📊 Total Amount: ' . ($ecosystem_data['total_amount'] ?? 0));
error_log('[ecosystem-data.php] 📊 Unique Buyers: ' . ($ecosystem_data['unique_buyers'] ?? 0));
error_log('[ecosystem-data.php] 📊 Unique Sellers: ' . ($ecosystem_data['unique_sellers'] ?? 0));

// Return successful response
wp_send_json_success([
    'ecosystem' => [
        'total_transactions' => $ecosystem_data['total_transactions'] ?? 0,
        'unique_buyers' => $ecosystem_data['unique_buyers'] ?? 0,
        'unique_sellers' => $ecosystem_data['unique_sellers'] ?? 0,
        'total_amount' => $ecosystem_data['total_amount'] ?? 0.0,
        'bucketed_data' => $ecosystem_data['bucketed_data'] ?? []
    ],
    'cache' => $data['cache'] ?? null,
    'source' => 'direct-ecosystem-endpoint'
]);
exit;

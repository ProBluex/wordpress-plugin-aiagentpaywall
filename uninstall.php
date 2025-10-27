<?php
/**
 * Uninstall script for Tolliver - Ai Agent Pay Collector
 * Fired when the plugin is uninstalled
 */

// Exit if accessed directly
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Drop custom table
global $wpdb;
$table_name = $wpdb->prefix . '402links_agent_logs';
$wpdb->query("DROP TABLE IF EXISTS {$table_name}");

// Delete all plugin options
delete_option('402links_settings');
delete_option('402links_api_key');
delete_option('402links_site_id');

// Delete all post meta
$wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE '_402links_%'");

// Flush rewrite rules
flush_rewrite_rules();

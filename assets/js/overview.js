/**
 * Overview Tab Configuration Handler
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Track if user has started editing
        let userIsEditing = false;
        
        // Only show validation when user actively types (keydown/keyup)
        $('#overview-payment-wallet').on('keydown', function() {
            userIsEditing = true;
        });
        
        $('#overview-payment-wallet').on('keyup', function() {
            if (!userIsEditing) return; // Don't run if user hasn't typed
            
            const wallet = $(this).val().trim();
            const indicator = $('#wallet-sync-indicator');
            
            if (!wallet) {
                indicator.removeClass().addClass('wallet-sync-indicator wallet-status-empty');
                indicator.find('.status-dot').removeClass().addClass('status-dot gray');
                indicator.find('.status-text').text('Not synced');
                return;
            }
            
            // Validate format: 0x + 40 hex characters (Ethereum/Base address)
            const isValid = /^0x[a-fA-F0-9]{40}$/.test(wallet);
            
            if (!isValid) {
                indicator.removeClass().addClass('wallet-sync-indicator wallet-status-invalid');
                indicator.find('.status-dot').removeClass().addClass('status-dot red');
                indicator.find('.status-text').text('Invalid address format');
            } else {
                indicator.removeClass().addClass('wallet-sync-indicator wallet-status-valid');
                indicator.find('.status-dot').removeClass().addClass('status-dot orange');
                indicator.find('.status-text').text('Valid format - click Save to sync');
            }
        });
        
        // Save configuration button
        $(document).on('click', '#save-overview-config', function(e) {
            e.preventDefault();
            
            const wallet = $('#overview-payment-wallet').val().trim();
            const defaultPrice = $('#overview-default-price').val();
            
            if (!wallet) {
                window.showToast('Validation Error', 'Payment wallet address is required', 'error');
                return;
            }
            
            // Basic wallet validation
            if (!wallet.startsWith('0x') || wallet.length !== 42) {
                window.showToast('Validation Error', 'Invalid wallet address format', 'error');
                return;
            }
            
            const button = $(this);
            const originalHtml = button.html();
            const indicator = $('#wallet-sync-indicator');
            
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'agent_hub_save_wallet',
                    nonce: agentHubData.nonce,
                    wallet: wallet,
                    default_price: defaultPrice
                },
                beforeSend: function() {
                    button.prop('disabled', true).html('<span class="dashicons dashicons-update-alt"></span> Saving...');
                    indicator.removeClass().addClass('wallet-sync-indicator wallet-status-syncing');
                    indicator.find('.status-dot').removeClass().addClass('status-dot orange pulsing');
                    indicator.find('.status-text').text('Syncing...');
                },
                success: function(response) {
                    if (response.success) {
                        button.html('<span class="dashicons dashicons-yes-alt"></span> Saved');
                        
                        // Check if sync was successful
                        if (response.data.sync_success) {
                            indicator.removeClass().addClass('wallet-sync-indicator wallet-status-synced');
                            indicator.find('.status-dot').removeClass().addClass('status-dot green');
                            indicator.find('.status-text').text('Synced');
                            userIsEditing = false; // Reset editing flag
                            window.showToast('Success', response.data.message, 'success');
                        } else {
                            indicator.removeClass().addClass('wallet-sync-indicator wallet-status-sync-failed');
                            indicator.find('.status-dot').removeClass().addClass('status-dot red');
                            indicator.find('.status-text').html('Sync failed <span class="dashicons dashicons-warning"></span>');
                            const errorMsg = response.data.sync_error || 'Failed to sync to database';
                            
                            // Show more helpful error message
                            let userMessage = response.data.message;
                            if (errorMsg.includes('not provisioned') || errorMsg.includes('pending')) {
                                userMessage += ' - Site registration is pending.';
                            } else if (errorMsg.includes('API key')) {
                                userMessage += ' - Authentication issue.';
                            }
                            
                            window.showToast('Warning', userMessage + ' (Sync: ' + errorMsg + ')', 'warning');
                        }
                        
                        setTimeout(function() {
                            button.prop('disabled', false).html(originalHtml);
                        }, 2000);
                    } else {
                        indicator.removeClass().addClass('wallet-sync-indicator wallet-status-sync-failed');
                        indicator.find('.status-dot').removeClass().addClass('status-dot red');
                        indicator.find('.status-text').html('Sync failed <span class="dashicons dashicons-warning"></span>');
                        window.showToast('Error', response.data.message || 'Failed to save configuration', 'error');
                        button.prop('disabled', false).html(originalHtml);
                    }
                },
                error: function(xhr, status, error) {
                    indicator.removeClass().addClass('wallet-sync-indicator wallet-status-sync-failed');
                    indicator.find('.status-dot').removeClass().addClass('status-dot red');
                    indicator.find('.status-text').text('Sync failed - connection error');
                    window.showToast('Error', 'Failed to save configuration: ' + error, 'error');
                    button.prop('disabled', false).html(originalHtml);
                }
            });
        });
        
        // ========== ANALYTICS LOADING FOR OVERVIEW TAB ==========
        let overviewDataInterval;

        function loadOverviewAnalytics() {
            console.log('[Overview] Loading analytics data for overview cards');
            
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'agent_hub_get_analytics',
                    nonce: agentHubData.nonce,
                    timeframe: '30d'
                },
                success: function(response) {
                    console.log('[Overview] Analytics response:', response);
                    
                    if (response.success && response.data) {
                        const siteData = response.data.site;
                        
                        // Update metric cards
                        $('#total-crawls').text(siteData.total_crawls || 0);
                        $('#paid-crawls').text(siteData.total_paid || 0);
                        $('#total-revenue').text('$' + (siteData.total_revenue || 0).toFixed(2));
                        $('#protected-pages').text(siteData.protected_pages || 0);
                        
                        console.log('[Overview] ✅ Metrics updated successfully');
                    } else {
                        console.error('[Overview] ❌ Failed to load analytics:', response);
                        // Show zeros with error state
                        $('#total-crawls').text('0');
                        $('#paid-crawls').text('0');
                        $('#total-revenue').text('$0.00');
                        $('#protected-pages').text('0');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('[Overview] ❌ AJAX error:', error);
                    // Show zeros on error
                    $('#total-crawls').text('0');
                    $('#paid-crawls').text('0');
                    $('#total-revenue').text('$0.00');
                    $('#protected-pages').text('0');
                }
            });
        }

        // Load on page load
        loadOverviewAnalytics();
        
        // DISABLED: No auto-refresh - only refresh on page load
        // Data will be cached and only updated when user refreshes page
        console.log('[Overview] Auto-refresh disabled - data will only refresh on page load');
    });
    
})(jQuery);

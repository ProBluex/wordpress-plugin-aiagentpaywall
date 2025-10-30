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
        
        // Track original price for change detection
        let originalPrice = null;
        
        // Capture original price on page load
        $(document).ready(function() {
            originalPrice = parseFloat($('#overview-default-price').val());
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
                            
                            // Check for price change
                            const newPrice = parseFloat(defaultPrice);
                            const priceChanged = originalPrice !== null && originalPrice !== newPrice;
                            
                            if (priceChanged) {
                                console.log('[Overview] Price changed from', originalPrice, 'to', newPrice);
                                checkExistingLinksAndAlert();
                                originalPrice = newPrice; // Update for next change
                            }
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
            console.log('🔵 [Overview] ==================== ANALYTICS REQUEST START ====================');
            console.log('🔵 [Overview] Timestamp:', new Date().toISOString());
            console.log('🔵 [Overview] AJAX URL:', agentHubData.ajaxUrl);
            
            const requestPayload = {
                action: 'agent_hub_get_analytics',
                nonce: agentHubData.nonce,
                timeframe: '30d'
            };
            console.log('🔵 [Overview] Request payload:', requestPayload);
            
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: requestPayload,
                success: function(response) {
                    console.log('🟢 [Overview] ==================== RESPONSE RECEIVED ====================');
                    console.log('🟢 [Overview] Raw response:', response);
                    console.log('🟢 [Overview] response.success:', response.success);
                    console.log('🟢 [Overview] response.data exists:', !!response.data);
                    
                    if (response.data) {
                        console.log('🟢 [Overview] response.data.site exists:', !!response.data.site);
                        console.log('🟢 [Overview] response.data.ecosystem exists:', !!response.data.ecosystem);
                        console.log('🟢 [Overview] response.data structure:', {
                            site: response.data.site ? Object.keys(response.data.site) : 'N/A',
                            ecosystem: response.data.ecosystem ? Object.keys(response.data.ecosystem) : 'N/A'
                        });
                    }
                    
                    if (response.success && response.data && response.data.site) {
                        const siteData = response.data.site;
                        console.log('🟢 [Overview] Extracted siteData:', siteData);
                        
                        // Log each metric extraction
                        const metrics = {
                            total_crawls: siteData?.total_crawls,
                            paid_crawls: siteData?.paid_crawls,
                            total_revenue: siteData?.total_revenue,
                            protected_pages: siteData?.protected_pages
                        };
                        console.log('🟢 [Overview] Extracted metrics (before fallback):', metrics);
                        
                        // Update metric cards with logging
                        const finalValues = {
                            total_crawls: siteData.total_crawls || 0,
                            paid_crawls: siteData.paid_crawls || 0,
                            total_revenue: '$' + (siteData.total_revenue || 0).toFixed(2),
                            protected_pages: siteData.protected_pages || 0
                        };
                        console.log('🟢 [Overview] Final values (after fallback):', finalValues);
                        
                        $('#total-crawls').text(finalValues.total_crawls);
                        $('#paid-crawls').text(finalValues.paid_crawls);
                        $('#total-revenue').text(finalValues.total_revenue);
                        $('#protected-pages').text(finalValues.protected_pages);
                        
                        console.log('✅ [Overview] Metrics updated in DOM successfully');
                        
                        // ========== EXTRACT & RENDER ECOSYSTEM DATA ==========
                        if (response.data.ecosystem) {
                            const ecosystemData = response.data.ecosystem;
                            console.log('🟢 [Overview] Extracted ecosystemData:', ecosystemData);
                            
                            const ecosystemMetrics = {
                                unique_buyers: ecosystemData.unique_buyers || 0,
                                unique_sellers: ecosystemData.unique_sellers || 0,
                                total_transactions: ecosystemData.total_transactions || 0,
                                total_amount: ecosystemData.total_amount || 0
                            };
                            console.log('🟢 [Overview] Ecosystem metrics (after fallback):', ecosystemMetrics);
                            
                            // Update ecosystem metric cards in DOM
                            $('#ecosystem-active-buyers').text(ecosystemMetrics.unique_buyers.toLocaleString());
                            $('#ecosystem-active-sellers').text(ecosystemMetrics.unique_sellers.toLocaleString());
                            $('#ecosystem-total-transactions').text(ecosystemMetrics.total_transactions.toLocaleString());
                            $('#ecosystem-market-revenue').text('$' + ecosystemMetrics.total_amount.toFixed(2));
                            
                            console.log('✅ [Overview] Ecosystem metrics updated in DOM successfully');
                        } else {
                            console.warn('⚠️ [Overview] No ecosystem data in response');
                        }
                    } else {
                        console.error('❌ [Overview] ==================== FAILURE ====================');
                        console.error('❌ [Overview] Response indicates failure');
                        console.error('❌ [Overview] response.success:', response.success);
                        console.error('❌ [Overview] response.data:', response.data);
                        console.error('❌ [Overview] response.data.site exists:', !!(response.data && response.data.site));
                        console.error('❌ [Overview] response.message:', response.message);
                        console.error('❌ [Overview] Full response:', JSON.stringify(response, null, 2));
                        
                        // Show zeros with error state
                        $('#total-crawls').text('0');
                        $('#paid-crawls').text('0');
                        $('#total-revenue').text('$0.00');
                        $('#protected-pages').text('0');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('🔴 [Overview] ==================== AJAX ERROR ====================');
                    console.error('🔴 [Overview] Status:', status);
                    console.error('🔴 [Overview] Error:', error);
                    console.error('🔴 [Overview] XHR status:', xhr.status);
                    console.error('🔴 [Overview] XHR responseText:', xhr.responseText);
                    
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
        
        // ========== PRICE CHANGE ALERT SYSTEM ==========
        
        function checkExistingLinksAndAlert() {
            console.log('[Overview] Checking for existing links...');
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'agent_hub_check_existing_links',
                    nonce: agentHubData.nonce
                },
                success: function(response) {
                    console.log('[Overview] Check links response:', response);
                    if (response.success && response.data.has_links) {
                        showPriceChangeAlert(response.data.link_count);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('[Overview] Failed to check links:', error);
                }
            });
        }
        
        function showPriceChangeAlert(linkCount) {
            console.log('[Overview] Showing price change alert for', linkCount, 'links');
            
            // Remove any existing alerts
            $('#price-change-alert').remove();
            
            const alertHtml = `
                <div class="notice notice-warning is-dismissible" id="price-change-alert" style="margin: 20px 0; padding: 15px; border-left: 4px solid #f0ad4e;">
                    <h4 style="margin-top: 0;">
                        <span class="dashicons dashicons-warning" style="color: #f0ad4e;"></span> 
                        Price Changed - Action Required
                    </h4>
                    <p>
                        You have <strong>${linkCount} existing paid link${linkCount !== 1 ? 's' : ''}</strong> that ${linkCount !== 1 ? 'are' : 'is'} still using the old price.
                        To apply the new price to all your content, please regenerate your paid links.
                    </p>
                    <p>
                        <button type="button" class="button button-primary" id="go-to-content-tab" style="margin-right: 10px;">
                            <span class="dashicons dashicons-update"></span>
                            Go to My Content & Regenerate Links
                        </button>
                        <button type="button" class="button" id="dismiss-price-alert">Dismiss</button>
                    </p>
                </div>
            `;
            
            // Insert after the configuration card
            $('.agent-hub-config-card').after(alertHtml);
            
            // Handle button clicks
            $('#go-to-content-tab').on('click', function() {
                console.log('[Overview] Switching to content tab');
                $('.tab-button[data-tab="content"]').trigger('click');
                $('#price-change-alert').fadeOut(300, function() { $(this).remove(); });
            });
            
            $('#dismiss-price-alert').on('click', function() {
                $('#price-change-alert').fadeOut(300, function() { $(this).remove(); });
            });
            
            // Allow dismissing via close button
            $('#price-change-alert').on('click', '.notice-dismiss', function() {
                $('#price-change-alert').fadeOut(300, function() { $(this).remove(); });
            });
        }
    });
    
})(jQuery);

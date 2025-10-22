/**
 * Overview Tab Configuration Handler
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Real-time wallet validation
        $('#overview-payment-wallet').on('input', function() {
            const wallet = $(this).val().trim();
            const indicator = $('#wallet-sync-indicator');
            
            if (!wallet) {
                indicator.removeClass().addClass('wallet-sync-indicator wallet-status-empty');
                indicator.find('.status-dot').removeClass().addClass('status-dot gray');
                indicator.find('.status-text').text('Enter wallet address');
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
                indicator.find('.status-dot').removeClass().addClass('status-dot green');
                indicator.find('.status-text').text('Valid format - click Save to sync');
            }
        });
        
        // Check initial wallet state on page load
        const initialWallet = $('#overview-payment-wallet').val().trim();
        if (initialWallet) {
            $('#overview-payment-wallet').trigger('input');
        }
        
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
                    indicator.find('.status-dot').removeClass().addClass('status-dot yellow pulsing');
                    indicator.find('.status-text').text('Syncing...');
                },
                success: function(response) {
                    if (response.success) {
                        button.html('<span class="dashicons dashicons-yes-alt"></span> Saved');
                        
                        // Check if sync was successful
                        if (response.data.sync_success) {
                            indicator.removeClass().addClass('wallet-sync-indicator wallet-status-synced');
                            indicator.find('.status-dot').removeClass().addClass('status-dot green');
                            indicator.find('.status-text').html('Synced <span class="dashicons dashicons-yes-alt"></span>');
                            window.showToast('Success', response.data.message, 'success');
                        } else {
                            indicator.removeClass().addClass('wallet-sync-indicator wallet-status-sync-failed');
                            indicator.find('.status-dot').removeClass().addClass('status-dot red');
                            indicator.find('.status-text').html('Sync failed <span class="dashicons dashicons-warning"></span>');
                            const errorMsg = response.data.sync_error || 'Failed to sync to database';
                            window.showToast('Warning', response.data.message + ' (Sync: ' + errorMsg + ')', 'warning');
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
    });
    
})(jQuery);

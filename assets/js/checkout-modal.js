/**
 * Checkout Modal Handler
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Handle upgrade button clicks
        $(document).on('click', '.upgrade-button', function(e) {
            e.preventDefault();
            showUpgradeModal();
        });
        
        // Handle manage subscription link
        $(document).on('click', '#manage-subscription-link', function(e) {
            e.preventDefault();
            openCustomerPortal();
        });
    });
    
    function showUpgradeModal() {
        // Create modal HTML
        const modalHtml = `
            <div id="checkout-modal-overlay" class="checkout-modal-overlay">
                <div class="checkout-modal">
                    <button class="checkout-modal-close">&times;</button>
                    <div class="checkout-modal-content">
                        <div class="checkout-modal-header">
                            <span class="dashicons dashicons-star-filled checkout-icon"></span>
                            <h2>Support an Indie Developer</h2>
                            <p class="indie-message">
                                Hi! I'm an independent developer working hard to create tools that help 
                                you monetize your content with AI agents. Your Pro subscription directly 
                                supports continued development and helps me keep this project alive. 
                                Every subscription makes a real difference. Thank you for considering! 🙏
                            </p>
                        </div>
                        
                        <div class="checkout-modal-features">
                            <h3>What You'll Get with Pro</h3>
                            <div class="feature-list">
                                <div class="feature-item">
                                    <span class="dashicons dashicons-yes-alt"></span>
                                    <span>Unlimited HTTP 402 Payments</span>
                                </div>
                                <div class="feature-item">
                                    <span class="dashicons dashicons-yes-alt"></span>
                                    <span>Advanced Analytics & Insights</span>
                                </div>
                                <div class="feature-item">
                                    <span class="dashicons dashicons-yes-alt"></span>
                                    <span>AI Agent Violation Tracking</span>
                                </div>
                                <div class="feature-item">
                                    <span class="dashicons dashicons-yes-alt"></span>
                                    <span>Priority Support</span>
                                </div>
                                <div class="feature-item">
                                    <span class="dashicons dashicons-yes-alt"></span>
                                    <span>Custom Branding Options</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="checkout-modal-pricing">
                            <div class="price-display">
                                <span class="price-amount">$9.99</span>
                                <span class="price-period">/ month</span>
                            </div>
                            <p class="price-note">Cancel anytime, no questions asked</p>
                        </div>
                        
                        <div class="checkout-modal-actions">
                            <button id="proceed-to-checkout" class="button button-primary button-hero">
                                <span class="dashicons dashicons-cart"></span>
                                Proceed to Secure Checkout
                            </button>
                            <p class="secure-note">
                                <span class="dashicons dashicons-lock"></span>
                                Powered by Stripe • Secure payment processing
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        $('#checkout-modal-overlay').remove();
        
        // Append modal
        $('body').append(modalHtml);
        
        // Show modal with animation
        setTimeout(function() {
            $('#checkout-modal-overlay').addClass('show');
        }, 10);
        
        // Attach event handlers
        $('.checkout-modal-close, #checkout-modal-overlay').on('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        $('#proceed-to-checkout').on('click', function() {
            proceedToStripeCheckout();
        });
    }
    
    function closeModal() {
        $('#checkout-modal-overlay').removeClass('show');
        setTimeout(function() {
            $('#checkout-modal-overlay').remove();
        }, 300);
    }
    
    function proceedToStripeCheckout() {
        const $button = $('#proceed-to-checkout');
        $button.prop('disabled', true).html('<span class="dashicons dashicons-update-alt"></span> Redirecting to Stripe...');
        
        const siteId = agentHubData.siteId;
        
        // Redirect directly to Stripe Payment Link with site_id as client_reference_id
        const stripePaymentUrl = new URL('https://buy.stripe.com/4gM5kE1pjdKb6N95Tk1Fe01');
        stripePaymentUrl.searchParams.set('client_reference_id', siteId);
        
        // Redirect current window to Stripe
        window.location.href = stripePaymentUrl.toString();
    }
    
    function openCustomerPortal() {
        const $button = $('#manage-subscription-link');
        const originalText = $button.text();
        $button.text('Loading...');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_manage_subscription',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success && response.data.url) {
                    window.open(response.data.url, '_blank');
                } else {
                    if (typeof showToast === 'function') {
                        showToast('Error', 'Failed to open subscription portal', 'error');
                    } else {
                        alert('Failed to open subscription portal');
                    }
                }
            },
            error: function() {
                if (typeof showToast === 'function') {
                    showToast('Error', 'Failed to open subscription portal', 'error');
                } else {
                    alert('Failed to open subscription portal');
                }
            },
            complete: function() {
                $button.text(originalText);
            }
        });
    }
    
})(jQuery);

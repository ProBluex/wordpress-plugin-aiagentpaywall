// Global toast notification function (accessible by all scripts)
window.showToast = function(title, message, type = 'success') {
    const $ = jQuery;
    const toastContainer = $('#agent-hub-toast');
    const toastId = 'toast-' + Date.now();
    
    const toast = $(`
        <div class="toast-message ${type}" id="${toastId}">
            <div class="toast-icon">
                <span class="dashicons dashicons-${type === 'success' ? 'yes-alt' : 'warning'}"></span>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-text">${message}</div>
            </div>
        </div>
    `);
    
    toastContainer.append(toast);
    
    setTimeout(() => {
        toast.fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
};

jQuery(document).ready(function($) {
    'use strict';
    
    // Tab switching
    $('.tab-button').on('click', function() {
        const tab = $(this).data('tab');
        
        $('.tab-button').removeClass('active');
        $('.tab-content').removeClass('active');
        
        $(this).addClass('active');
        $(`#tab-${tab}`).addClass('active');
        
        // Load data when switching to certain tabs
        if (tab === 'analytics') {
            loadAnalytics();
        } else if (tab === 'content') {
            loadContent();
        }
    });
    
    // Save settings
    $('#agent-hub-settings-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'agent_hub_save_settings',
            nonce: agentHubData.nonce,
            api_key: $('#api_key').val(),
            payment_wallet: $('#payment_wallet').val(),
            default_price: $('#default_price').val(),
            network: $('#network').val(),
            auto_generate: $('#auto_generate').is(':checked') ? 'true' : 'false'
        };
        
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.html();
        submitButton.prop('disabled', true).html('<span class="spinner is-active" style="float: none;"></span> Saving...');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    showToast('Settings Saved', 'Your settings have been saved successfully.', 'success');
                } else {
                    showToast('Error', response.data?.message || 'Failed to save settings.', 'error');
                }
            },
            error: function() {
                showToast('Error', 'Network error. Please try again.', 'error');
            },
            complete: function() {
                submitButton.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Register site
    $('#register-site-button, #sync-site-button').on('click', function() {
        const button = $(this);
        const originalText = button.html();
        button.prop('disabled', true).html('<span class="spinner is-active" style="float: none;"></span> Registering...');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_register_site',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success) {
                    showToast('Success', 'Site registered successfully!', 'success');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showToast('Error', response.data?.error || 'Failed to register site.', 'error');
                }
            },
            error: function() {
                showToast('Error', 'Network error. Please try again.', 'error');
            },
            complete: function() {
                button.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Load overview stats
    function loadOverviewStats() {
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_analytics',
                nonce: agentHubData.nonce,
                timeframe: '30d'
            },
            success: function(response) {
                if (response.success && response.data) {
                    $('#total-crawls').text(response.data.total_crawls || 0);
                    $('#paid-crawls').text(response.data.paid_crawls || 0);
                    $('#total-revenue').text('$' + (parseFloat(response.data.total_revenue || 0).toFixed(2)));
                    $('#protected-pages').text(response.data.protected_pages || 0);
                }
            }
        });
    }
    
    // Load content
    function loadContent() {
        $('#content-table-body').html('<tr><td colspan="7" style="text-align: center;"><span class="spinner is-active" style="float: none; margin: 20px auto;"></span></td></tr>');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_content',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success && response.data.content) {
                    renderContentTable(response.data.content);
                } else {
                    $('#content-table-body').html('<tr><td colspan="7" style="text-align: center;">No content found.</td></tr>');
                }
            },
            error: function() {
                $('#content-table-body').html('<tr><td colspan="7" style="text-align: center;">Error loading content.</td></tr>');
            }
        });
    }
    
    function renderContentTable(content) {
        if (content.length === 0) {
            $('#content-table-body').html('<tr><td colspan="7" style="text-align: center;">No content found.</td></tr>');
            return;
        }
        
        const rows = content.map(item => `
            <tr>
                <td><strong>${item.title}</strong></td>
                <td>${item.type}</td>
                <td>$${parseFloat(item.price).toFixed(2)}</td>
                <td>${item.crawls || 0}</td>
                <td>$${parseFloat(item.revenue || 0).toFixed(2)}</td>
                <td>
                    ${item.has_link 
                        ? `<span class="link-status active"><span class="dashicons dashicons-yes-alt"></span> Active</span> 
                           <a href="${item.link_url}" target="_blank" class="button-link">View Link</a>`
                        : '<span class="link-status inactive"><span class="dashicons dashicons-warning"></span> Not Protected</span>'
                    }
                </td>
                <td>
                    ${item.has_link
                        ? `<label class="human-toggle-wrapper">
                               <input type="checkbox" 
                                      class="human-toggle-checkbox" 
                                      data-post-id="${item.id}" 
                                      ${item.block_humans ? 'checked' : ''}
                                      onchange="toggleHumanAccess(${item.id}, this.checked)">
                               <span class="toggle-label">${item.block_humans ? 'Yes' : 'No'}</span>
                           </label>
                           ${item.block_humans ? `<a href="${item.link_url}" target="_blank" class="button-link">View Link</a>` : ''}`
                        : '<span class="text-muted">N/A</span>'
                    }
                </td>
            </tr>
        `).join('');
        
        $('#content-table-body').html(rows);
    }
    
    // Toggle human access
    window.toggleHumanAccess = function(postId, blockHumans) {
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_toggle_human_access',
                nonce: agentHubData.nonce,
                post_id: postId,
                block_humans: blockHumans ? 'true' : 'false'
            },
            success: function(response) {
                if (response.success) {
                    showToast('Success', `Humans ${blockHumans ? 'blocked' : 'allowed'}`, 'success');
                    loadContent(); // Refresh table to show "View Link" when toggled on
                } else {
                    showToast('Error', response.data?.message || 'Failed to update settings.', 'error');
                    loadContent(); // Revert toggle on error
                }
            },
            error: function() {
                showToast('Error', 'Network error. Please try again.', 'error');
                loadContent(); // Revert toggle on error
            }
        });
    };
    
    // Generate link
    window.generateLink = function(postId) {
        if (!confirm('Generate 402link for this page?')) return;
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_generate_link',
                nonce: agentHubData.nonce,
                post_id: postId
            },
            success: function(response) {
                if (response.success) {
                    showToast('Success', '402link generated successfully!', 'success');
                    loadContent();
                    
                    // Refresh analytics if on analytics tab
                    if (typeof window.agentHubAnalytics !== 'undefined') {
                        window.agentHubAnalytics.loadAnalyticsData();
                    }
                    
                    // Refresh overview stats
                    loadOverviewStats();
                } else {
                    showToast('Error', response.data?.error || 'Failed to generate link.', 'error');
                }
            },
            error: function() {
                showToast('Error', 'Network error. Please try again.', 'error');
            }
        });
    };
    
    // Bulk generate links
    $('#bulk-generate-links').on('click', function() {
        const button = $(this);
        const originalText = button.html();
        button.prop('disabled', true).html('<span class="spinner is-active" style="float: none;"></span> Generating...');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_bulk_generate',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success) {
                    showToast('Success', response.data.message, 'success');
                    // Reload content to show new links
                    loadContent();
                    // Refresh overview stats
                    loadOverviewStats();
                } else {
                    showToast('Error', response.data.message || 'Failed to generate links', 'error');
                }
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Network error: ' + error, 'error');
            },
            complete: function() {
                button.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Refresh content
    $('#refresh-content').on('click', function() {
        loadContent();
    });
    
    // Load analytics
    function loadAnalytics() {
        const timeframe = $('#analytics-timeframe').val();
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_analytics',
                nonce: agentHubData.nonce,
                timeframe: timeframe
            },
            success: function(response) {
                if (response.success && response.data) {
                    renderAnalytics(response.data);
                }
            }
        });
    }
    
    function renderAnalytics(data) {
        // Agent breakdown
        if (data.agent_breakdown) {
            const agentHtml = data.agent_breakdown.map(agent => `
                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd;">
                    <span><strong>${agent.name}</strong></span>
                    <span>${agent.crawls} crawls | $${parseFloat(agent.revenue).toFixed(2)}</span>
                </div>
            `).join('');
            $('#agent-breakdown').html(agentHtml || 'No agent data available.');
        }
        
        // Top content
        if (data.top_content) {
            const contentHtml = data.top_content.map((item, index) => `
                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd;">
                    <span><strong>${index + 1}. ${item.title}</strong></span>
                    <span>${item.crawls} crawls | $${parseFloat(item.revenue).toFixed(2)}</span>
                </div>
            `).join('');
            $('#top-content').html(contentHtml || 'No content data available.');
        }
    }
    
    // Analytics timeframe change
    $('#analytics-timeframe').on('change', function() {
        loadAnalytics();
    });
    
    // Initial load
    loadOverviewStats();
    
    // Manage subscription link handler
    $('#manage-subscription-link').on('click', function(e) {
        e.preventDefault();
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_manage_subscription',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success && response.data.url) {
                    window.location.href = response.data.url;
                } else {
                    showToast('Error', response.data?.message || 'Failed to open customer portal', 'error');
                }
            },
            error: function() {
                showToast('Error', 'Network error. Please try again.', 'error');
            }
        });
    });
});

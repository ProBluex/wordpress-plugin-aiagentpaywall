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
    
    // Tab switching with URL hash preservation
    $('.tab-button').on('click', function() {
        const tab = $(this).data('tab');
        
        $('.tab-button').removeClass('active');
        $('.tab-content').removeClass('active');
        
        $(this).addClass('active');
        $(`#tab-${tab}`).addClass('active');
        
        // Update URL hash
        window.location.hash = tab;
        
        // Force refresh on every tab switch
        if (tab === 'overview') {
            // Overview data is loaded by overview.js automatically
        } else if (tab === 'analytics') {
            loadAnalytics();
        } else if (tab === 'content') {
            loadContent();
        }
    });
    
    // Restore active tab from URL hash on page load
    const hash = window.location.hash.substring(1); // Remove '#'
    if (hash && hash.length > 0) {
        const $tab = $(`.tab-button[data-tab="${hash}"]`);
        if ($tab.length > 0) {
            // Trigger click on the tab from hash
            $tab.trigger('click');
        }
    }
    
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
    
    // Overview stats are now loaded by overview.js
    // This function has been removed to prevent data collision
    
    // Load content with pagination
    function loadContent(page = 1) {
        $('#content-table-body').html('<tr><td colspan="5" style="text-align: center;"><span class="spinner is-active" style="float: none; margin: 20px auto;"></span></td></tr>');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_content',
                nonce: agentHubData.nonce,
                page: page,
                per_page: 10
            },
            success: function(response) {
                if (response.success && response.data.content) {
                    renderContentTable(response.data.content);
                    if (response.data.pagination) {
                        renderPagination(response.data.pagination);
                    }
                } else {
                    $('#content-table-body').html('<tr><td colspan="5" style="text-align: center;">No content found.</td></tr>');
                }
            },
            error: function() {
                $('#content-table-body').html('<tr><td colspan="5" style="text-align: center;">Error loading content.</td></tr>');
            }
        });
    }
    
    function renderContentTable(content) {
        if (content.length === 0) {
            $('#content-table-body').html('<tr><td colspan="5" style="text-align: center;">No content found.</td></tr>');
            return;
        }
        
        const rows = content.map(item => `
            <tr>
                <td><strong>${item.title}</strong></td>
                <td>${item.type}</td>
                <td>$${parseFloat(item.price).toFixed(2)}</td>
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
    
    // Render pagination controls
    function renderPagination(pagination) {
        const container = $('#content-pagination');
        if (!pagination || pagination.total_pages <= 1) {
            container.html('');
            return;
        }
        
        let html = '<div class="tablenav"><div class="tablenav-pages">';
        html += `<span class="displaying-num">${pagination.total_posts} items</span>`;
        html += '<span class="pagination-links">';
        
        // First page
        if (pagination.current_page > 1) {
            html += `<a class="first-page button" data-page="1" style="cursor:pointer;">«</a> `;
            html += `<a class="prev-page button" data-page="${pagination.current_page - 1}" style="cursor:pointer;">‹</a> `;
        } else {
            html += '<span class="tablenav-pages-navspan button disabled">«</span> ';
            html += '<span class="tablenav-pages-navspan button disabled">‹</span> ';
        }
        
        html += `<span class="paging-input">Page ${pagination.current_page} of ${pagination.total_pages}</span> `;
        
        // Next page
        if (pagination.current_page < pagination.total_pages) {
            html += `<a class="next-page button" data-page="${pagination.current_page + 1}" style="cursor:pointer;">›</a> `;
            html += `<a class="last-page button" data-page="${pagination.total_pages}" style="cursor:pointer;">»</a>`;
        } else {
            html += '<span class="tablenav-pages-navspan button disabled">›</span> ';
            html += '<span class="tablenav-pages-navspan button disabled">»</span>';
        }
        
        html += '</span></div></div>';
        container.html(html);
        
        // Bind click events
        container.find('a[data-page]').on('click', function() {
            const page = parseInt($(this).data('page'));
            loadContent(page);
        });
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
    
    // Initial load handled by individual tab scripts
    
    // AUTO-REFRESH MECHANISM (Phase 4)
    (function() {
        let refreshInterval;
        
        function startAutoRefresh() {
            // Refresh every 30 seconds
            refreshInterval = setInterval(function() {
                const activeTab = $('.tab-button.active').data('tab');
                
                switch(activeTab) {
                    case 'overview':
                        // Overview refresh handled by overview.js
                        break;
                    case 'content':
                        loadContent();
                        break;
                    case 'analytics':
                        loadAnalytics();
                        break;
                }
                
                console.log('[402links] Auto-refreshed:', activeTab, 'tab at', new Date().toLocaleTimeString());
            }, 30000); // 30 seconds
        }
        
        function stopAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        }
        
        // Start on page load
        startAutoRefresh();
        
        // Stop when user leaves page
        $(window).on('beforeunload', function() {
            stopAutoRefresh();
        });
    })();
});

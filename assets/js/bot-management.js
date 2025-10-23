(function($) {
    'use strict';
    
    function loadBotStats() {
        const timeframe = $('#analytics-timeframe').val() || '30d';
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_bot_stats',
                nonce: agentHubData.nonce,
                timeframe: timeframe
            },
            success: function(response) {
                if (response.success) {
                    renderBotTable(response.data);
                } else {
                    console.error('Failed to load bot stats:', response.data);
                    showToast('Error', 'Failed to load bot statistics', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error loading bot stats:', error);
                showToast('Error', 'Network error loading bot statistics', 'error');
            }
        });
    }
    
    function renderBotTable(bots) {
        const tbody = $('#bot-table-body');
        tbody.empty();
        
        if (!bots || bots.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        No bot data available for this timeframe.
                    </td>
                </tr>
            `);
            return;
        }
        
        bots.forEach(bot => {
            const row = `
                <tr data-bot-id="${bot.id}">
                    <td><input type="checkbox" class="bot-checkbox" value="${bot.id}"></td>
                    <td>
                        <strong>${escapeHtml(bot.bot_name)}</strong><br>
                        <small style="color: #666;">${escapeHtml(bot.company)}</small>
                    </td>
                    <td><span class="bot-category-badge">${escapeHtml(bot.category)}</span></td>
                    <td>
                        <div class="bot-request-stats">
                            <div>Allowed: <strong>${bot.allowed_count || 0}</strong></div>
                            <div>Unsuccessful: <strong>${bot.unsuccessful_count || 0}</strong></div>
                        </div>
                    </td>
                    <td>
                        <span class="violation-count ${bot.violations_count > 0 ? 'has-violations' : ''}">
                            ${bot.violations_count || 0}
                        </span>
                    </td>
                    <td>
                        <select class="bot-action-select" data-bot-id="${bot.id}">
                            <option value="monetize" ${bot.action === 'monetize' ? 'selected' : ''}>Monetize</option>
                            <option value="allow" ${bot.action === 'allow' ? 'selected' : ''}>Allow</option>
                            <option value="block" ${bot.action === 'block' ? 'selected' : ''}>Block</option>
                        </select>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
        
        // Bind change events for action dropdowns
        $('.bot-action-select').off('change').on('change', function() {
            const botId = $(this).data('bot-id');
            const action = $(this).val();
            updateBotPolicy(botId, action);
        });
    }
    
    function updateBotPolicy(botId, action) {
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_update_bot_policy',
                nonce: agentHubData.nonce,
                bot_id: botId,
                bot_action: action
            },
            success: function(response) {
                if (response.success) {
                    showToast('Success', `Bot policy updated to: ${action}`, 'success');
                } else {
                    showToast('Error', response.data || 'Failed to update bot policy', 'error');
                }
            },
            error: function() {
                showToast('Error', 'Network error updating bot policy', 'error');
            }
        });
    }
    
    function showToast(title, message, type) {
        if (window.showToast) {
            window.showToast(title, message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
    
    // Handle select all checkbox
    $(document).on('change', '#select-all-bots', function() {
        $('.bot-checkbox').prop('checked', $(this).prop('checked'));
    });
    
    // Handle bulk actions
    $(document).on('click', '#apply-bulk-action', function() {
        const bulkAction = $('#bulk-action-select').val();
        if (!bulkAction) {
            showToast('Warning', 'Please select a bulk action', 'warning');
            return;
        }
        
        const selectedBots = $('.bot-checkbox:checked').map(function() {
            return $(this).val();
        }).get();
        
        if (selectedBots.length === 0) {
            showToast('Warning', 'Please select at least one bot', 'warning');
            return;
        }
        
        // Update each selected bot
        let completed = 0;
        selectedBots.forEach(botId => {
            updateBotPolicy(botId, bulkAction);
            completed++;
            
            if (completed === selectedBots.length) {
                setTimeout(() => {
                    loadBotStats(); // Refresh table
                }, 500);
            }
        });
    });
    
    // Handle refresh button
    $(document).on('click', '#refresh-bot-stats', function() {
        loadBotStats();
    });
    
    // Load bot stats when Bot Management tab is clicked
    $(document).on('click', '[data-tab="bot-management"]', function() {
        setTimeout(loadBotStats, 100);
    });
    
    // Load on timeframe change
    $(document).on('change', '#analytics-timeframe', function() {
        if ($('#bot-management').hasClass('active')) {
            loadBotStats();
        }
    });
    
    // Initial load if bot management tab is active
    $(document).ready(function() {
        if ($('#bot-management').hasClass('active')) {
            loadBotStats();
        }
    });
    
})(jQuery);

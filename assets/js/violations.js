/**
 * Violations Tab Handler with Action Filters & Bulk Selection
 */
(function($) {
    'use strict';

    // State management
    let agentPolicies = {};
    let originalPolicies = {};
    let hasUnsavedChanges = false;

    // Initialize when document is ready
    $(document).ready(function() {
        // Load violations when tab becomes active
        $(document).on('click', '[data-tab="violations"]', function() {
            loadViolations();
        });

        // Load on page load if violations tab is active
        if ($('#tab-violations').hasClass('active')) {
            loadViolations();
        }

        // Checkbox event handlers
        $(document).on('change', '#select-all-checkbox', handleSelectAllChange);
        $(document).on('change', '.agent-checkbox', handleAgentCheckboxChange);
        
        // Bulk action handlers
        $(document).on('click', '#select-all-agents', selectAllAgents);
        $(document).on('click', '#deselect-all-agents', deselectAllAgents);
        $(document).on('click', '#apply-bulk-action', applyBulkAction);
        
        // Individual action dropdown handler
        $(document).on('change', '.agent-action-select', handleActionChange);
        
        // Save button handler
        $(document).on('click', '#save-agent-actions', saveAgentActions);
    });

    /**
     * Load violations data from API
     */
    function loadViolations() {
        const $loading = $('#violations-loading');
        const $error = $('#violations-error');
        const $table = $('#violations-table');
        const $empty = $('#violations-empty');
        const $toolbar = $('#bulk-actions-toolbar');
        const $saveWrapper = $('#violations-save-wrapper');

        // Show loading state
        $loading.show();
        $error.hide();
        $table.hide();
        $empty.hide();
        $toolbar.hide();
        $saveWrapper.hide();

        // Load violations and policies in parallel
        $.when(
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'agent_hub_get_violations_summary',
                    nonce: agentHubData.nonce
                }
            }),
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'agent_hub_get_site_bot_policies',
                    nonce: agentHubData.nonce
                }
            })
        ).done(function(violationsResponse, policiesResponse) {
            $loading.hide();

            const violations = violationsResponse[0];
            const policies = policiesResponse[0];

            if (violations.success && violations.data) {
                // Store policies
                if (policies.success && policies.data) {
                    policies.data.forEach(function(policy) {
                        agentPolicies[policy.bot_registry_id] = policy.action;
                    });
                    originalPolicies = $.extend({}, agentPolicies);
                }

                displayViolations(violations.data);
                $toolbar.show();
                $saveWrapper.show();
            } else {
                showError(violations.data?.message || 'Failed to load violations data');
            }
        }).fail(function(xhr, status, error) {
            $loading.hide();
            showError('Network error: ' + error);
        });
    }

    /**
     * Display violations data
     */
    function displayViolations(data) {
        const $table = $('#violations-table');
        const $tbody = $('#violations-table-body');
        const $empty = $('#violations-empty');

        // Update stats
        $('#violations-total').text(formatNumber(data.totals.total_violations));
        $('#violations-robots').text(formatNumber(data.totals.robots_txt_violations));
        $('#violations-unpaid').text(formatNumber(data.totals.unpaid_access_violations));
        $('#violations-unique-agents').text(formatNumber(data.totals.unique_agents));

        // Check if we have agents
        if (!data.agents || data.agents.length === 0) {
            $empty.show();
            return;
        }

        // Build table rows - show ALL agents from bot_registry
        $tbody.empty();
        data.agents.forEach(function(agent) {
            const botRegistryId = agent.bot_registry_id;
            const currentAction = agentPolicies[botRegistryId] || agent.default_action || 'monetize';
            
            const $row = $('<tr>').attr('data-bot-id', botRegistryId);
            
            // Checkbox column
            $row.append($('<td class="check-column">').html(
                '<input type="checkbox" class="agent-checkbox" data-bot-id="' + 
                escapeHtml(botRegistryId) + '" />'
            ));
            
            // Agent name
            $row.append($('<td>').html(
                '<strong>' + escapeHtml(agent.agent_name) + '</strong>'
            ));

            // Total violations
            $row.append($('<td>').html(
                '<span class="violation-badge violation-total">' + 
                formatNumber(agent.total_violations) + 
                '</span>'
            ));

            // Robots.txt violations
            $row.append($('<td>').html(
                agent.robots_txt_violations > 0 
                    ? '<span class="violation-badge violation-robots">' + 
                      formatNumber(agent.robots_txt_violations) + 
                      '</span>'
                    : '<span class="violation-badge violation-none">0</span>'
            ));

            // Unpaid access
            $row.append($('<td>').html(
                agent.unpaid_access_violations > 0 
                    ? '<span class="violation-badge violation-unpaid">' + 
                      formatNumber(agent.unpaid_access_violations) + 
                      '</span>'
                    : '<span class="violation-badge violation-none">0</span>'
            ));

            // Last seen
            $row.append($('<td>').text(formatDateTime(agent.last_seen)));

            // Action dropdown
            const $actionCell = $('<td class="action-cell">');
            const $actionSelect = $('<select class="agent-action-select" data-bot-id="' + escapeHtml(botRegistryId) + '">');
            
            $actionSelect.append($('<option value="monetize">').text('💰 Monetize').prop('selected', currentAction === 'monetize'));
            $actionSelect.append($('<option value="allow">').text('✓ Allow').prop('selected', currentAction === 'allow'));
            $actionSelect.append($('<option value="block">').text('⛔ Block').prop('selected', currentAction === 'block'));
            
            $actionCell.append($actionSelect);
            $row.append($actionCell);

            $tbody.append($row);
        });

        $table.show();
        updateSelectedCount();
    }

    /**
     * Handle select all checkbox change
     */
    function handleSelectAllChange() {
        const isChecked = $(this).prop('checked');
        $('.agent-checkbox').prop('checked', isChecked);
        updateSelectedCount();
    }

    /**
     * Handle individual agent checkbox change
     */
    function handleAgentCheckboxChange() {
        updateSelectedCount();
        
        // Update select-all checkbox state
        const totalCheckboxes = $('.agent-checkbox').length;
        const checkedCheckboxes = $('.agent-checkbox:checked').length;
        $('#select-all-checkbox').prop('checked', totalCheckboxes === checkedCheckboxes);
    }

    /**
     * Update selected count display
     */
    function updateSelectedCount() {
        const count = $('.agent-checkbox:checked').length;
        $('#selected-count').text(count + ' selected');
    }

    /**
     * Select all agents
     */
    function selectAllAgents() {
        $('.agent-checkbox').prop('checked', true);
        $('#select-all-checkbox').prop('checked', true);
        updateSelectedCount();
    }

    /**
     * Deselect all agents
     */
    function deselectAllAgents() {
        $('.agent-checkbox').prop('checked', false);
        $('#select-all-checkbox').prop('checked', false);
        updateSelectedCount();
    }

    /**
     * Apply bulk action to selected agents
     */
    function applyBulkAction() {
        const action = $('#bulk-action-select').val();
        if (!action) {
            alert('Please select a bulk action');
            return;
        }

        const $selectedCheckboxes = $('.agent-checkbox:checked');
        if ($selectedCheckboxes.length === 0) {
            alert('Please select at least one agent');
            return;
        }

        // Apply action to all selected agents
        $selectedCheckboxes.each(function() {
            const botId = $(this).data('bot-id');
            $('select.agent-action-select[data-bot-id="' + botId + '"]').val(action).trigger('change');
        });

        // Reset bulk action dropdown
        $('#bulk-action-select').val('');
    }

    /**
     * Handle individual action dropdown change
     */
    function handleActionChange() {
        const botId = $(this).data('bot-id');
        const newAction = $(this).val();
        
        agentPolicies[botId] = newAction;
        checkForUnsavedChanges();
    }

    /**
     * Check if there are unsaved changes
     */
    function checkForUnsavedChanges() {
        hasUnsavedChanges = JSON.stringify(agentPolicies) !== JSON.stringify(originalPolicies);
        
        if (hasUnsavedChanges) {
            $('#violations-save-wrapper').addClass('has-changes');
        } else {
            $('#violations-save-wrapper').removeClass('has-changes');
        }
    }

    /**
     * Save agent actions to backend
     */
    function saveAgentActions() {
        if (!hasUnsavedChanges) {
            return;
        }

        const $button = $('#save-agent-actions');
        $button.prop('disabled', true).html(
            '<span class="spinner is-active" style="float:none; margin:0 8px 0 0;"></span>Saving...'
        );

        // Build policies array
        const policies = [];
        for (const [botId, action] of Object.entries(agentPolicies)) {
            policies.push({
                bot_registry_id: botId,
                action: action
            });
        }

        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'agent_hub_update_site_bot_policies',
                nonce: agentHubData.nonce,
                policies: policies
            },
            success: function(response) {
                if (response.success) {
                    originalPolicies = $.extend({}, agentPolicies);
                    hasUnsavedChanges = false;
                    $('#violations-save-wrapper').removeClass('has-changes');
                    
                    // Show success message
                    showToast('Agent actions saved successfully!', 'success');
                    
                    // Reset button
                    $button.prop('disabled', false).html(
                        '<svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>' +
                        '<polyline points="17 21 17 13 7 13 7 21"></polyline>' +
                        '<polyline points="7 3 7 8 15 8"></polyline>' +
                        '</svg> Save Agent Actions'
                    );
                } else {
                    showError(response.data?.message || 'Failed to save agent actions');
                    $button.prop('disabled', false).html(
                        '<svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>' +
                        '<polyline points="17 21 17 13 7 13 7 21"></polyline>' +
                        '<polyline points="7 3 7 8 15 8"></polyline>' +
                        '</svg> Save Agent Actions'
                    );
                }
            },
            error: function(xhr, status, error) {
                showError('Network error: ' + error);
                $button.prop('disabled', false).html(
                    '<svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>' +
                    '<polyline points="17 21 17 13 7 13 7 21"></polyline>' +
                    '<polyline points="7 3 7 8 15 8"></polyline>' +
                    '</svg> Save Agent Actions'
                );
            }
        });
    }

    /**
     * Show toast notification
     */
    function showToast(message, type) {
        const $toast = $('#agent-hub-toast');
        $toast.removeClass('success error').addClass(type).text(message).fadeIn();
        setTimeout(function() {
            $toast.fadeOut();
        }, 3000);
    }

    /**
     * Show error message
     */
    function showError(message) {
        console.error('[Violations] Error:', message);
        console.log('[Violations] Debug - AJAX URL:', ajaxurl);
        console.log('[Violations] Debug - Nonce:', agentHubData?.nonce);
        console.log('[Violations] Debug - Site URL:', agentHubData?.siteUrl);
        
        $('#violations-error-message').text(message);
        $('#violations-error').show();
    }

    /**
     * Format number with commas
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Format datetime string
     */
    function formatDateTime(dateStr) {
        if (!dateStr) return 'Never';
        
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + ' min ago';
        if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
        if (diffDays < 30) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

})(jQuery);

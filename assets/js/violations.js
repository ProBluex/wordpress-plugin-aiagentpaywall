/**
 * Violations Tab Handler
 */
(function($) {
    'use strict';

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
    });

    /**
     * Load violations data from API
     */
    function loadViolations() {
        const $loading = $('#violations-loading');
        const $error = $('#violations-error');
        const $table = $('#violations-table');
        const $empty = $('#violations-empty');

        // Show loading state
        $loading.show();
        $error.hide();
        $table.hide();
        $empty.hide();

        // Make AJAX request
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'agent_hub_get_violations_summary',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                $loading.hide();

                if (response.success && response.data) {
                    displayViolations(response.data);
                } else {
                    showError(response.data?.message || 'Failed to load violations data');
                }
            },
            error: function(xhr, status, error) {
                $loading.hide();
                showError('Network error: ' + error);
            }
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

        // Check if we have agents - always show table with all agents
        if (!data.agents || data.agents.length === 0) {
            $empty.show();
            return;
        }

        // Build table rows - show ALL agents from bot_registry
        $tbody.empty();
        data.agents.forEach(function(agent) {
            const $row = $('<tr>');
            
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

            $tbody.append($row);
        });

        $table.show();
    }

    /**
     * Show error message
     */
    function showError(message) {
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

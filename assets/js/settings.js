jQuery(document).ready(function($) {
    // Test Endpoints
    $('#test-endpoints').on('click', function() {
        const $button = $(this);
        const $results = $('#diagnostics-results');
        const $tbody = $('#diagnostics-results-body');
        
        $button.prop('disabled', true).html('<span class="spinner is-active" style="float:none;"></span> Testing...');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_test_endpoints',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success && response.data.results) {
                    $tbody.empty();
                    
                    $.each(response.data.results, function(name, result) {
                        const statusIcon = result.status === 'success' 
                            ? '<span class="dashicons dashicons-yes-alt" style="color:#46b450;"></span>'
                            : '<span class="dashicons dashicons-dismiss" style="color:#dc3232;"></span>';
                        
                        const statusText = result.status === 'success'
                            ? '<span style="color:#46b450;">✓ Working</span>'
                            : '<span style="color:#dc3232;">✗ ' + result.message + '</span>';
                        
                        $tbody.append(`
                            <tr>
                                <td>${statusIcon}</td>
                                <td><strong>${name}</strong></td>
                                <td>${statusText}</td>
                                <td><a href="${result.url}" target="_blank">${result.url}</a></td>
                            </tr>
                        `);
                    });
                    
                    $results.slideDown();
                } else {
                    alert('Failed to test endpoints: ' + (response.data?.message || 'Unknown error'));
                }
            },
            error: function() {
                alert('Network error while testing endpoints');
            },
            complete: function() {
                $button.prop('disabled', false).html('<span class="dashicons dashicons-search"></span> Test Endpoints');
            }
        });
    });
    
    // Flush Rewrite Rules
    $('#flush-rewrite-rules').on('click', function() {
        const $button = $(this);
        
        if (!confirm('Flush rewrite rules? This will re-register all .well-known endpoints.')) {
            return;
        }
        
        $button.prop('disabled', true).html('<span class="spinner is-active" style="float:none;"></span> Flushing...');
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_flush_rewrite_rules',
                nonce: agentHubData.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('✓ Rewrite rules flushed successfully!\n\nPlease test the endpoints again to verify they work.');
                    // Auto-trigger test after flush
                    $('#test-endpoints').trigger('click');
                } else {
                    alert('Failed to flush rewrite rules: ' + (response.data?.message || 'Unknown error'));
                }
            },
            error: function() {
                alert('Network error while flushing rewrite rules');
            },
            complete: function() {
                $button.prop('disabled', false).html('<span class="dashicons dashicons-update"></span> Flush Rewrite Rules');
            }
        });
    });
});

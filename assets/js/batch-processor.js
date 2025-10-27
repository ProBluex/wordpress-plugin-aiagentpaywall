(function($) {
    'use strict';
    
    const BatchProcessor = {
        isRunning: false,
        pollInterval: null,
        
        init: function() {
            $('#bulk-generate-links').on('click', this.start.bind(this));
        },
        
        start: function() {
            if (this.isRunning) return;
            
            this.isRunning = true;
            this.showModal();
            
            // Initialize batch
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'agent_hub_start_batch_generation',
                    nonce: agentHubData.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.updateProgress(response.data);
                        this.processNext();
                    } else {
                        this.showError(response.data.message || 'Failed to start batch process');
                    }
                },
                error: () => {
                    this.showError('Network error. Please try again.');
                }
            });
        },
        
        processNext: function() {
            if (!this.isRunning) return;
            
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'agent_hub_process_batch',
                    nonce: agentHubData.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.updateProgress(response.data.progress);
                        
                        if (response.data.completed) {
                            this.complete();
                        } else {
                            // Continue processing
                            setTimeout(() => this.processNext(), 500);
                        }
                    } else {
                        this.showError(response.data.message || 'Failed to process batch');
                    }
                },
                error: () => {
                    this.showError('Network error during processing.');
                }
            });
        },
        
        updateProgress: function(progress) {
            const percent = progress.total > 0 
                ? Math.round((progress.processed / progress.total) * 100) 
                : 0;
            
            $('#batch-progress-bar').css('width', percent + '%');
            $('#batch-percent').text(percent + '%');
            $('#batch-stats').html(`
                <div class="stat">
                    <span class="stat-label">Total Posts:</span>
                    <span class="stat-value">${progress.total}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Processed:</span>
                    <span class="stat-value">${progress.processed}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Created:</span>
                    <span class="stat-value success">${progress.created}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Updated:</span>
                    <span class="stat-value info">${progress.updated}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Failed:</span>
                    <span class="stat-value error">${progress.failed}</span>
                </div>
            `);
        },
        
        showModal: function() {
            const modal = `
                <div id="batch-modal" class="batch-modal">
                    <div class="batch-modal-content">
                        <h2>
                            <span class="dashicons dashicons-update"></span>
                            Generating monetization links...
                        </h2>
                        <div id="batch-stats" class="batch-stats"></div>
                        <div class="progress-bar-container">
                            <div id="batch-progress-bar" class="progress-bar"></div>
                            <div id="batch-percent" class="progress-percent">0%</div>
                        </div>
                        <div class="batch-actions">
                            <button id="batch-cancel" class="button">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(modal);
            
            $('#batch-cancel').on('click', () => this.cancel());
        },
        
        complete: function() {
            this.isRunning = false;
            $('#batch-modal h2').html(`
                <span class="dashicons dashicons-yes-alt"></span>
                Generation Complete!
            `);
            $('#batch-cancel').text('Close').off('click').on('click', () => {
                $('#batch-modal').remove();
                // Refresh the content table
                if (typeof window.loadContent === 'function') {
                    window.loadContent();
                } else {
                    location.reload();
                }
            });
        },
        
        cancel: function() {
            if (!confirm('Are you sure you want to cancel? Progress will be saved.')) return;
            
            this.isRunning = false;
            
            $.ajax({
                url: agentHubData.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'agent_hub_cancel_batch',
                    nonce: agentHubData.nonce
                },
                success: () => {
                    $('#batch-modal').remove();
                }
            });
        },
        
        showError: function(message) {
            alert('Error: ' + message);
            this.isRunning = false;
            $('#batch-modal').remove();
        }
    };
    
    $(document).ready(() => BatchProcessor.init());
    
})(jQuery);

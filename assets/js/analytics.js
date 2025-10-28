/**
 * Analytics & Charts for Tolliver - Ai Agent Pay Collector
 * Handles revenue charts and data visualization
 */

(function($) {
    'use strict';
    
    let marketChart = null;
    let analyticsRefreshInterval = null;
    let currentPage = 1;
    const perPage = 10;
    let activeMetrics = {
        transactions: true,
        volume: true,
        buyers: true,
        sellers: true
    };
    
    /**
     * Initialize analytics when DOM is ready
     */
    $(document).ready(function() {
        console.log('[Analytics] Initializing analytics module');
        
        // Load Chart.js dynamically if not already loaded
        if (typeof Chart === 'undefined') {
            loadChartJS();
        }
        
        // Load immediately if analytics tab is already active
        if ($('[data-tab="analytics"]').hasClass('active')) {
            loadAnalyticsData();
            startAnalyticsAutoRefresh();
        }
        
        // Hook into analytics tab switch
        $(document).on('click', '[data-tab="analytics"]', function() {
            setTimeout(loadAnalyticsData, 100);
            setTimeout(loadTopPages, 100);
            startAnalyticsAutoRefresh();
        });
        
        // Timeframe change handler
        $(document).on('change', '#analytics-timeframe', function() {
            loadAnalyticsData();
            loadTopPages();
        });
        
        // Metric toggle handlers
        $(document).on('click', '.metric-toggle', function() {
            const metric = $(this).data('metric');
            $(this).toggleClass('active');
            activeMetrics[metric] = $(this).hasClass('active');
            
            // Re-render chart with new metric selection
            loadAnalyticsData();
        });
        
        // Stop auto-refresh when page is hidden
        $(document).on('visibilitychange', function() {
            if (document.visibilityState === 'hidden' && analyticsRefreshInterval) {
                clearInterval(analyticsRefreshInterval);
                analyticsRefreshInterval = null;
            } else if (document.visibilityState === 'visible' && $('[data-tab="analytics"]').hasClass('active')) {
                startAnalyticsAutoRefresh();
            }
        });
    });
    
    /**
     * Load Chart.js library dynamically
     */
    function loadChartJS() {
        if ($('script[src*="chart.js"]').length === 0) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = function() {
                console.log('[Analytics] Chart.js loaded successfully');
            };
            document.head.appendChild(script);
        }
    }
    
    /**
     * Load analytics data from backend
     */
    function loadAnalyticsData() {
        const timeframe = $('#analytics-timeframe').val() || '30d';
        
        console.log('[Analytics] Loading analytics data for timeframe:', timeframe);
        console.log('[Analytics] 🔍 REQUEST PAYLOAD:', {
            action: 'agent_hub_get_analytics',
            nonce: agentHubData.nonce,
            timeframe: timeframe,
            ajaxUrl: agentHubData.ajaxUrl
        });
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_analytics',
                nonce: agentHubData.nonce,
                timeframe: timeframe
            },
            beforeSend: function() {
                $('.analytics-loading').show();
                $('#market-chart-container').hide();
            },
            success: function(response) {
                console.log('[Analytics] ✅ FULL RESPONSE RECEIVED:', JSON.stringify(response, null, 2));
                console.log('[Analytics] Response structure check:', {
                    has_success: 'success' in response,
                    success_value: response.success,
                    has_data: 'data' in response,
                    data_keys: response.data ? Object.keys(response.data) : 'NO DATA',
                    has_site: response.data?.site ? 'YES' : 'NO',
                    has_ecosystem: response.data?.ecosystem ? 'YES' : 'NO'
                });
                
                if (response.success && response.data) {
                    renderAnalytics(response.data);
                } else {
                    console.error('[Analytics] ❌ FAILED TO LOAD:', response);
                    const errorMsg = response.data?.message || response.message || 'Unknown error';
                    const statusCode = response.data?.status_code ? ` (HTTP ${response.data.status_code})` : '';
                    showError('Failed to load analytics: ' + errorMsg + statusCode);
                }
            },
            error: function(xhr, status, error) {
                console.error('[Analytics] AJAX error:', error);
                showError('Error loading analytics: ' + error);
            },
            complete: function() {
                $('.analytics-loading').hide();
            }
        });
    }
    
    /**
     * Load top performing pages from backend
     */
    function loadTopPages(page = 1) {
        currentPage = page;
        const offset = (page - 1) * perPage;
        const timeframe = $('#analytics-timeframe').val() || '30d';
        
        console.log('[Analytics] Loading top pages - page:', page, 'offset:', offset);
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_top_pages',
                nonce: agentHubData.nonce,
                timeframe: timeframe,
                limit: perPage,
                offset: offset
            },
            success: function(response) {
                console.log('[Analytics] Top pages response:', response);
                
                if (response.success && response.data) {
                    renderTopContent(response.data.pages || []);
                    renderPagination(response.data.total || 0, currentPage, perPage);
                } else {
                    $('#top-content-body').html(
                        '<tr><td colspan="2" style="text-align:center; color:#666;">No pages found</td></tr>'
                    );
                    $('#top-content-pagination').hide();
                }
            },
            error: function(xhr, status, error) {
                console.error('[Analytics] Error loading top pages:', error);
                $('#top-content-body').html(
                    '<tr><td colspan="2" style="text-align:center; color:#c00;">Failed to load top pages</td></tr>'
                );
                $('#top-content-pagination').hide();
            }
        });
    }
    
    /**
     * Render analytics dashboard
     */
    function renderAnalytics(data) {
        console.log('[Analytics] Rendering analytics dashboard');
        
        // Update ecosystem stat cards
        if (data.ecosystem) {
            // Format large numbers (70K+, $1.2M)
            const buyers = data.ecosystem.unique_buyers || 0;
            const sellers = data.ecosystem.unique_sellers || 0;
            const transactions = data.ecosystem.total_transactions || 0;
            const revenue = data.ecosystem.total_amount || 0;
            
            $('#stat-ecosystem-buyers').text(formatLargeNumber(buyers));
            $('#stat-ecosystem-sellers').text(formatLargeNumber(sellers));
            $('#stat-ecosystem-transactions').text(formatLargeNumber(transactions));
            
            // Show Market Revenue in $ terms instead of transaction count
            $('#stat-market-revenue').text(formatCurrency(revenue));
            
            // Render market overview chart
            if (data.ecosystem.bucketed_data && data.ecosystem.bucketed_data.length > 0) {
                renderMarketOverviewChart(data.ecosystem.bucketed_data);
            } else {
                showEmptyChartState();
            }
        }
    }
    
    /**
     * Render market overview chart
     */
    function renderMarketOverviewChart(bucketedData) {
        const ctx = document.getElementById('market-chart');
        if (!ctx) {
            console.warn('[Analytics] Market chart canvas not found');
            return;
        }
        
        // Wait for Chart.js to be loaded
        if (typeof Chart === 'undefined') {
            console.log('[Analytics] Waiting for Chart.js to load...');
            setTimeout(() => renderMarketOverviewChart(bucketedData), 500);
            return;
        }
        
        console.log('[Analytics] Rendering market overview chart with', bucketedData.length, 'data points');
        
        // Destroy existing chart
        if (marketChart) {
            marketChart.destroy();
        }
        
        const labels = bucketedData.map(d => formatDate(d.date));
        
        const datasets = [];
        
        if (activeMetrics.transactions) {
            datasets.push({
                label: 'Transactions',
                data: bucketedData.map(d => d.transactions),
                borderColor: '#00D091',
                backgroundColor: 'rgba(0, 208, 145, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
            });
        }
        
        if (activeMetrics.volume) {
            datasets.push({
                label: 'Volume (USDC)',
                data: bucketedData.map(d => d.volume),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                yAxisID: 'y1',
                tension: 0.4,
            });
        }
        
        if (activeMetrics.buyers) {
            datasets.push({
                label: 'Buyers',
                data: bucketedData.map(d => d.buyers),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
            });
        }
        
        if (activeMetrics.sellers) {
            datasets.push({
                label: 'Sellers',
                data: bucketedData.map(d => d.sellers),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
            });
        }
        
        $('#market-chart-container').show();
        
        marketChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Count' },
                        beginAtZero: true,
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Volume (USDC)' },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                }
            }
        });
    }
    
    /**
     * Show empty chart state
     */
    function showEmptyChartState() {
        $('#market-chart-container').hide();
        $('.chart-empty-state').show().html(
            '<p style="text-align:center; color:#666; padding:60px 20px;">' +
            'No ecosystem data available yet. Check back soon!</p>'
        );
    }
    
    /**
     * Render top content table
     */
    function renderTopContent(pages) {
        const tbody = $('#top-content-body');
        tbody.empty();
        
        if (!pages || pages.length === 0) {
            tbody.html('<tr><td colspan="2" style="text-align:center; color:#666;">No pages found</td></tr>');
            return;
        }
        
        pages.forEach(page => {
            const row = `
                <tr>
                    <td>
                        <a href="${escapeHtml(page.url || page.page_url)}" target="_blank">
                            ${escapeHtml(page.title || page.page_title || 'Untitled')}
                        </a>
                    </td>
                    <td>$${formatMoney(page.revenue || page.agent_revenue || 0)}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }
    
    /**
     * Render pagination controls
     */
    function renderPagination(total, currentPage, perPage) {
        const totalPages = Math.ceil(total / perPage);
        const container = $('#top-content-pagination');
        
        if (totalPages <= 1) {
            container.hide();
            return;
        }
        
        container.show();
        container.empty();
        
        let html = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<button class="page-btn" data-page="${currentPage - 1}">← Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<span class="page-current">${i}</span>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
                html += `<button class="page-btn" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // Next button
        if (currentPage < totalPages) {
            html += `<button class="page-btn" data-page="${currentPage + 1}">Next →</button>`;
        }
        
        html += '</div>';
        container.html(html);
    }
    
    // Add click handler for pagination
    $(document).on('click', '.page-btn', function() {
        const page = parseInt($(this).data('page'));
        loadTopPages(page);
    });
    
    /**
     * Utility: Format number with commas
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Utility: Format large numbers (70K+, $1.2M)
     */
    function formatLargeNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return formatNumber(num);
    }
    
    /**
     * Utility: Format currency
     */
    function formatCurrency(amount) {
        const num = parseFloat(amount || 0);
        if (num >= 1000000) {
            return '$' + (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return '$' + (num / 1000).toFixed(1) + 'K';
        }
        return '$' + num.toFixed(2);
    }
    
    /**
     * Utility: Format money to 2 decimals
     */
    function formatMoney(amount) {
        return parseFloat(amount || 0).toFixed(2);
    }
    
    /**
     * Utility: Format date for chart labels
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    }
    
    /**
     * Utility: Escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Start auto-refresh for analytics (DISABLED - only refresh on page load)
     */
    function startAnalyticsAutoRefresh() {
        // Clear any existing interval
        if (analyticsRefreshInterval) {
            clearInterval(analyticsRefreshInterval);
            analyticsRefreshInterval = null;
        }
        
        console.log('[Analytics] Auto-refresh disabled - data will only refresh on page load or timeframe change');
        
        // NO AUTO-REFRESH - only manual refresh on:
        // 1. Page load
        // 2. Tab switch
        // 3. Timeframe change
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        console.error('[Analytics]', message);
        if (typeof showToast === 'function') {
            showToast('Analytics Error', message, 'error');
        }
    }
    
    // Expose functions globally
    window.agentHubAnalytics = {
        loadAnalyticsData: loadAnalyticsData,
        renderMarketOverviewChart: renderMarketOverviewChart,
        startAutoRefresh: startAnalyticsAutoRefresh
    };
    
    console.log('[Analytics] Module loaded successfully');
    
})(jQuery);

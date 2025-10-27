/**
 * Analytics & Charts for Tolliver - Ai Agent Pay Collector
 * Handles revenue charts and data visualization
 */

(function($) {
    'use strict';
    
    let marketChart = null;
    let analyticsRefreshInterval = null;
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
            startAnalyticsAutoRefresh();
        });
        
        // Timeframe change handler
        $(document).on('change', '#analytics-timeframe', function() {
            loadAnalyticsData();
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
     * Render analytics dashboard
     */
    function renderAnalytics(data) {
        console.log('[Analytics] Rendering analytics dashboard');
        
        // Update ecosystem stat cards
        if (data.ecosystem) {
            $('#stat-ecosystem-buyers').text(formatNumber(data.ecosystem.unique_buyers || 0));
            $('#stat-ecosystem-sellers').text(formatNumber(data.ecosystem.unique_sellers || 0));
            $('#stat-ecosystem-transactions').text(formatNumber(data.ecosystem.total_transactions || 0));
        }
        
        // Update site revenue
        if (data.site) {
            $('#stat-your-revenue').text('$' + formatMoney(data.site.total_revenue || 0));
            
            // Render market overview chart
            if (data.ecosystem && data.ecosystem.bucketed_data && data.ecosystem.bucketed_data.length > 0) {
                renderMarketOverviewChart(data.ecosystem.bucketed_data);
            } else {
                showEmptyChartState();
            }
            
            // Update top content table
            if (data.site.top_content) {
                renderTopContent(data.site.top_content);
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
            tbody.html('<tr><td colspan="3" style="text-align:center; color:#666;">No content data available</td></tr>');
            return;
        }
        
        pages.forEach(page => {
            const row = `
                <tr>
                    <td>
                        <a href="${escapeHtml(page.page_url)}" target="_blank">
                            ${escapeHtml(page.page_title || 'Untitled')}
                        </a>
                    </td>
                    <td>${formatNumber(page.agent_crawls_count || 0)}</td>
                    <td>$${formatMoney(page.total_revenue || 0)}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }
    
    /**
     * Utility: Format number with commas
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
     * Start auto-refresh for analytics (every 30 seconds)
     */
    function startAnalyticsAutoRefresh() {
        // Clear any existing interval
        if (analyticsRefreshInterval) {
            clearInterval(analyticsRefreshInterval);
        }
        
        console.log('[Analytics] Starting auto-refresh (30s interval)');
        
        // Refresh every 30 seconds when tab is visible
        analyticsRefreshInterval = setInterval(function() {
            if ($('[data-tab="analytics"]').hasClass('active') && document.visibilityState === 'visible') {
                console.log('[Analytics] Auto-refreshing data...');
                loadAnalyticsData();
            }
        }, 30000); // 30 seconds
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

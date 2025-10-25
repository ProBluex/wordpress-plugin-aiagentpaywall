/**
 * Analytics & Charts for 402links Agent Hub
 * Handles revenue charts and data visualization
 */

(function($) {
    'use strict';
    
    let revenueChart = null;
    let analyticsRefreshInterval = null;
    
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
                $('#revenue-chart-container').hide();
            },
            success: function(response) {
                console.log('[Analytics] Analytics data received:', response);
                
                if (response.success && response.data) {
                    renderAnalytics(response.data);
                } else {
                    console.error('[Analytics] Failed to load analytics:', response);
                    const errorMsg = response.data?.error || response.error || 'Unknown error';
                    showError('Failed to load analytics: ' + errorMsg);
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
        
        // Update summary stats
        updateStatCards(data);
        
        // Render revenue chart
        if (data.daily_revenue && data.daily_revenue.length > 0) {
            renderRevenueChart(data.daily_revenue);
        } else {
            showEmptyChartState();
        }
        
        // Update agent breakdown table
        if (data.agent_breakdown) {
            renderAgentBreakdown(data.agent_breakdown);
        }
        
        // Update top content table
        if (data.top_content) {
            renderTopContent(data.top_content);
        }
        
        // Load agent purchases
        loadAgentPurchases();
    }
    
    /**
     * Update stat cards - now showing combined AI + Human stats
     */
    function updateStatCards(data) {
        const totalCrawls = data.total_crawls || 0;
        const totalPaid = data.paid_crawls || 0;
        const totalRevenue = data.total_revenue || 0;
        const agentRevenue = data.agent_revenue || 0;
        const humanRevenue = data.human_revenue || 0;
        
        $('#stat-total-crawls').text(formatNumber(totalCrawls));
        $('#stat-paid-crawls').text(formatNumber(totalPaid));
        $('#stat-total-revenue').text('$' + formatMoney(totalRevenue));
        $('#stat-conversion-rate').text(formatPercent(data.conversion_rate || 0));
        
        // Add revenue breakdown tooltip if we have both sources
        if (agentRevenue > 0 && humanRevenue > 0) {
            $('#stat-total-revenue').attr('title', 
                `AI Agents: $${formatMoney(agentRevenue)} | Humans: $${formatMoney(humanRevenue)}`
            );
        }
    }
    
    /**
     * Render revenue chart
     */
    function renderRevenueChart(dailyRevenue) {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) {
            console.warn('[Analytics] Revenue chart canvas not found');
            return;
        }
        
        // Wait for Chart.js to be loaded
        if (typeof Chart === 'undefined') {
            console.log('[Analytics] Waiting for Chart.js to load...');
            setTimeout(() => renderRevenueChart(dailyRevenue), 500);
            return;
        }
        
        console.log('[Analytics] Rendering revenue chart with', dailyRevenue.length, 'data points');
        
        // Destroy existing chart
        if (revenueChart) {
            revenueChart.destroy();
        }
        
        const labels = dailyRevenue.map(d => formatDate(d.date));
        // Edge function returns revenue in dollars (0.01 = 1 cent)
        // Use raw values directly, no multiplication needed
        const data = dailyRevenue.map(d => parseFloat(d.revenue || 0));
        
        $('#revenue-chart-container').show();
        
        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (USDC)',
                    data: data,
                    borderColor: '#00D091',
                    backgroundColor: 'rgba(0, 208, 145, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#00D091',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: $' + parseFloat(context.parsed.y).toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Show empty chart state
     */
    function showEmptyChartState() {
        $('#revenue-chart-container').hide();
        $('.chart-empty-state').show().html(
            '<p style="text-align:center; color:#666; padding:60px 20px;">' +
            'No revenue data available yet. Generate some 402links to start tracking!</p>'
        );
    }
    
    /**
     * Render agent breakdown table
     */
    function renderAgentBreakdown(agents) {
        const tbody = $('#agent-breakdown-body');
        tbody.empty();
        
        if (!agents || agents.length === 0) {
            tbody.html('<tr><td colspan="3" style="text-align:center; color:#666;">No agent data available</td></tr>');
            return;
        }
        
        agents.forEach(agent => {
            const row = `
                <tr>
                    <td><strong>${escapeHtml(agent.name)}</strong></td>
                    <td>${formatNumber(agent.crawls)}</td>
                    <td>$${formatMoney(agent.revenue)}</td>
                </tr>
            `;
            tbody.append(row);
        });
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
     * Load agent purchases data from API
     */
    function loadAgentPurchases() {
        const timeframe = $('#analytics-timeframe').val() || '30d';
        const siteId = agentHubData.site_id;
        
        if (!siteId) {
            console.warn('[Analytics] No site_id available for agent purchases');
            $('#agent-purchases-body').html('<tr><td colspan="5" style="text-align:center; color:#999;">Site not registered</td></tr>');
            return;
        }
        
        console.log('[Analytics] Loading agent purchases for site:', siteId);
        
        // Calculate date range based on timeframe
        const now = new Date();
        let startDate = null;
        
        if (timeframe === '7d') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '30d') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '90d') {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }
        
        const startDateStr = startDate ? startDate.toISOString().split('T')[0] : null;
        const endDateStr = now.toISOString().split('T')[0];
        
        $.ajax({
            url: agentHubData.supabaseUrl + '/functions/v1/agent-purchase-analytics',
            method: 'GET',
            data: { 
                site_id: siteId, 
                start_date: startDateStr,
                end_date: endDateStr
            },
            headers: { 
                'apikey': agentHubData.supabaseAnonKey,
                'Authorization': 'Bearer ' + agentHubData.supabaseAnonKey
            },
            success: function(response) {
                console.log('[Analytics] Agent purchases received:', response);
                renderAgentPurchases(response.recent_purchases || []);
            },
            error: function(xhr, status, error) {
                console.error('[Analytics] Error loading agent purchases:', error);
                $('#agent-purchases-body').html('<tr><td colspan="5" style="text-align:center; color:#c00;">Error loading data</td></tr>');
            }
        });
    }
    
    /**
     * Render agent purchases table
     */
    function renderAgentPurchases(purchases) {
        const tbody = $('#agent-purchases-body');
        tbody.empty();
        
        if (!purchases || purchases.length === 0) {
            tbody.html('<tr><td colspan="5" style="text-align:center; color:#666;">No agent purchases yet</td></tr>');
            return;
        }
        
        purchases.forEach(purchase => {
            const identifier = formatAgentIdentifier(purchase.agent_identifier);
            const wallet = formatWalletAddress(purchase.agent_wallet);
            const date = formatPurchaseDate(purchase.purchased_at);
            
            const row = `
                <tr>
                    <td style="font-family:monospace; font-size:12px;">${identifier}</td>
                    <td style="font-family:monospace; font-size:12px;">${wallet}</td>
                    <td>
                        <a href="${escapeHtml(purchase.page_url)}" target="_blank">
                            ${escapeHtml(purchase.page_title || 'Untitled')}
                        </a>
                    </td>
                    <td>$${formatMoney(purchase.amount)}</td>
                    <td>${date}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }
    
    /**
     * Format agent identifier for display
     */
    function formatAgentIdentifier(identifier) {
        if (!identifier) return '-';
        
        const parts = identifier.split(':');
        if (parts.length !== 2) return escapeHtml(identifier);
        
        const [type, value] = parts;
        
        if (type === 'wallet') {
            return formatWalletAddress(value);
        } else if (type === 'ua') {
            return 'UA-' + escapeHtml(value.substring(0, 8));
        } else if (type === 'ip') {
            return 'IP-' + escapeHtml(value);
        }
        
        return escapeHtml(identifier);
    }
    
    /**
     * Format wallet address for display
     */
    function formatWalletAddress(wallet) {
        if (!wallet || wallet === '-') return '-';
        if (wallet.length < 10) return escapeHtml(wallet);
        return escapeHtml(wallet.substring(0, 6) + '...' + wallet.substring(wallet.length - 4));
    }
    
    /**
     * Format purchase date for display
     */
    function formatPurchaseDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
     * Utility: Format percentage
     */
    function formatPercent(percent) {
        return parseFloat(percent || 0).toFixed(1) + '%';
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
    
    // Wire up timeframe selector to also refresh agent purchases
    $(document).on('change', '#analytics-timeframe', function() {
        loadAnalyticsData(); // Existing call
        loadAgentPurchases(); // New call
    });
    
    // Expose functions globally
    window.agentHubAnalytics = {
        loadAnalyticsData: loadAnalyticsData,
        renderRevenueChart: renderRevenueChart,
        startAutoRefresh: startAnalyticsAutoRefresh,
        loadAgentPurchases: loadAgentPurchases
    };
    
    console.log('[Analytics] Module loaded successfully');
    
})(jQuery);

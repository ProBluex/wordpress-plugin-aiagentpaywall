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
        
        console.log('[Analytics] Loading enhanced analytics for timeframe:', timeframe);
        
        $.ajax({
            url: agentHubData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'agent_hub_get_analytics',
                nonce: agentHubData.nonce,
                timeframe: timeframe,
                enhanced: true
            },
            beforeSend: function() {
                $('.analytics-loading').show();
                $('.facilitator-loading').show();
                $('#revenue-chart-container').hide();
            },
            success: function(response) {
                console.log('[Analytics] Enhanced analytics received:', response);
                
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
                $('.facilitator-loading').hide();
            }
        });
    }
    
    /**
     * Render analytics dashboard
     */
    function renderAnalytics(data) {
        console.log('[Analytics] Rendering enhanced analytics dashboard');
        
        // Update ecosystem hero section
        if (data.ecosystem) {
            renderEcosystemHero(data.ecosystem, data.timeframe);
            updateEcosystemStats(data.ecosystem);
        }
        
        // Update user position cards
        if (data.user && data.userPosition) {
            renderUserPosition(data.user, data.userPosition);
        }
        
        // Render facilitators
        if (data.ecosystem && data.ecosystem.facilitators) {
            renderFacilitators(data.ecosystem.facilitators);
        }
        
        // Show motivational message
        if (data.userPosition) {
            renderMotivationalBanner(data.userPosition);
        }
        
        // Update summary stats (legacy support)
        updateStatCards(data.user || data);
        
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
    }
    
    /**
     * Render ecosystem hero section
     */
    function renderEcosystemHero(ecosystem, timeframe) {
        const volumeFormatted = formatLargeMoney(ecosystem.total_volume || 0);
        const growthPercentage = ecosystem.growth?.volume || '+0%';
        const isPositive = !growthPercentage.startsWith('-');
        
        $('#ecosystem-volume').text('$' + volumeFormatted);
        $('#ecosystem-growth').text((isPositive ? '↑ ' : '↓ ') + growthPercentage + ' vs prev')
            .removeClass('positive negative')
            .addClass(isPositive ? 'positive' : 'negative');
    }
    
    /**
     * Render user position cards
     */
    function renderUserPosition(user, position) {
        $('#stat-total-links').text(formatNumber(position.total_links || 0));
        $('#stat-user-revenue').text('$' + formatMoney(user.total_revenue || 0));
        $('#stat-market-share').text(formatPercent(position.market_share || 0, 4));
        
        if (position.rank) {
            $('#stat-rank-info').text(`Rank #${position.rank} of ${position.total_sites}`);
        }
    }
    
    /**
     * Update ecosystem transaction count
     */
    function updateEcosystemStats(ecosystem) {
        if (ecosystem && ecosystem.total_transactions) {
            $('#stat-ecosystem-tx').text(formatNumber(ecosystem.total_transactions));
        }
    }
    
    /**
     * Render facilitators breakdown
     */
    function renderFacilitators(facilitators) {
        const container = $('#facilitator-bars');
        container.empty();
        
        if (!facilitators || facilitators.length === 0) {
            container.html('<p style="text-align:center; color:#666; padding:20px;">No facilitator data available</p>');
            return;
        }
        
        facilitators.forEach(fac => {
            const volumeFormatted = formatLargeMoney(fac.volume);
            const row = `
                <div class="facilitator-row">
                    <div class="facilitator-info">
                        <span class="facilitator-name">${escapeHtml(fac.name)}</span>
                    </div>
                    <div class="facilitator-bar">
                        <div class="bar-fill" style="width: ${fac.share}%"></div>
                    </div>
                    <div class="facilitator-stats">
                        <span class="share">${fac.share.toFixed(1)}%</span>
                        <span class="volume">$${volumeFormatted}</span>
                    </div>
                </div>
            `;
            container.append(row);
        });
    }
    
    /**
     * Render motivational banner
     */
    function renderMotivationalBanner(position) {
        const banner = $('#motivation-banner');
        const marketShare = position.market_share || 0;
        const percentile = parseFloat(position.percentile || 0);
        
        let message = '';
        let className = '';
        
        if (marketShare < 0.01) {
            message = `
                <span class="dashicons dashicons-lightbulb"></span>
                <strong>You're early!</strong> The x402 ecosystem is growing rapidly. 
                Add more content to increase your share of this expanding market.
            `;
            className = 'motivation-info';
        } else if (percentile >= 90) {
            message = `
                <span class="dashicons dashicons-awards"></span>
                <strong>Top 10% Publisher!</strong> You're outpacing 90% of the ecosystem. 
                Keep up the excellent work!
            `;
            className = 'motivation-success';
        } else if (percentile >= 50) {
            message = `
                <span class="dashicons dashicons-chart-line"></span>
                <strong>You're growing!</strong> You're in the top ${(100 - percentile).toFixed(0)}% of publishers. 
                Keep publishing to climb the ranks!
            `;
            className = 'motivation-info';
        }
        
        if (message) {
            banner.html('<p>' + message + '</p>')
                .removeClass('motivation-info motivation-success motivation-warning')
                .addClass(className)
                .show();
        } else {
            banner.hide();
        }
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
     * Utility: Format large money amounts (K/M notation)
     */
    function formatLargeMoney(amount) {
        const num = parseFloat(amount || 0);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(2);
    }
    
    /**
     * Utility: Format percentage
     */
    function formatPercent(percent, decimals = 1) {
        return parseFloat(percent || 0).toFixed(decimals) + '%';
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
        renderRevenueChart: renderRevenueChart,
        startAutoRefresh: startAnalyticsAutoRefresh
    };
    
    console.log('[Analytics] Module loaded successfully');
    
})(jQuery);

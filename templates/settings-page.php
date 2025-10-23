<?php
$settings = get_option('402links_settings');
$api_key = get_option('402links_api_key');
$site_id = get_option('402links_site_id');
$is_connected = !empty($api_key) && !empty($site_id);
?>

<div class="wrap agent-hub-dashboard">
    <h1>
        <span class="dashicons dashicons-shield-alt"></span>
        AI Agent Paywall
    </h1>
    
    <div class="agent-hub-connection-status">
        <?php if ($is_connected): ?>
            <span class="status-badge connected">
                <span class="dashicons dashicons-yes-alt"></span>
                Connected
            </span>
        <?php else: ?>
            <span class="status-badge disconnected">
                <span class="dashicons dashicons-warning"></span>
                Not Connected
            </span>
        <?php endif; ?>
    </div>
    
    <div class="agent-hub-tabs">
        <button class="tab-button active" data-tab="overview">
            <span class="dashicons dashicons-dashboard"></span>
            Overview
        </button>
        <button class="tab-button" data-tab="content">
            <span class="dashicons dashicons-admin-page"></span>
            My Content
        </button>
        <button class="tab-button" data-tab="analytics">
            <span class="dashicons dashicons-chart-line"></span>
            Analytics
        </button>
        <button class="tab-button" data-tab="bot-management">
            <span class="dashicons dashicons-shield"></span>
            Bot Management
        </button>
        <button class="tab-button" data-tab="contact">
            <span class="dashicons dashicons-email"></span>
            Contact Us
        </button>
    </div>
    
    <!-- Overview Tab -->
    <div id="tab-overview" class="tab-content active">
        <div class="agent-hub-stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><span class="dashicons dashicons-visibility"></span></div>
                <div class="stat-content">
                    <div class="stat-label">Total AI Agent Crawls</div>
                    <div class="stat-value" id="total-crawls">Loading...</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon success"><span class="dashicons dashicons-yes-alt"></span></div>
                <div class="stat-content">
                    <div class="stat-label">Paid Crawls</div>
                    <div class="stat-value" id="paid-crawls">Loading...</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon revenue"><span class="dashicons dashicons-money-alt"></span></div>
                <div class="stat-content">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value" id="total-revenue">$0.00</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon"><span class="dashicons dashicons-admin-page"></span></div>
                <div class="stat-content">
                    <div class="stat-label">Protected Pages</div>
                    <div class="stat-value" id="protected-pages">Loading...</div>
                </div>
            </div>
        </div>
        
        <div class="agent-hub-config-card">
            <h3><span class="dashicons dashicons-admin-settings"></span> Configuration</h3>
            <div class="config-fields">
                <div class="config-field">
                    <label for="overview-payment-wallet">
                        <strong>Payment Wallet Address (Base Network)</strong>
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="wallet-input-wrapper">
                        <input type="text" id="overview-payment-wallet" class="config-input" 
                               value="<?php echo esc_attr($settings['payment_wallet'] ?? ''); ?>" 
                               placeholder="0x..." />
                        <div id="wallet-sync-indicator" class="wallet-sync-indicator wallet-status-empty">
                            <span class="status-dot gray"></span>
                            <span class="status-text">Enter wallet address</span>
                        </div>
                    </div>
                    <p class="config-description">
                        Wallet service providers: 
                        <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">Metamask</a>, 
                        <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">Phantom</a>, 
                        <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">Coinbase</a>
                    </p>
                </div>
                
                <div class="config-field">
                    <label for="overview-default-price">
                        <strong>Default Price Per Page (USD)</strong>
                    </label>
                    <input type="number" id="overview-default-price" class="config-input" 
                           step="0.01" min="0"
                           value="<?php echo esc_attr($settings['default_price'] ?? 0.10); ?>" />
                    <p class="config-description">Default price for AI agents to access each page</p>
                </div>
                
                <div class="config-actions">
                    <button type="button" id="save-overview-config" class="button button-primary">
                        <span class="dashicons dashicons-saved"></span>
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
        
        <div class="agent-hub-info-box">
            <h3><span class="dashicons dashicons-info-outline"></span> About AI Agent Paywall</h3>
            <p>This plugin automatically detects AI agents (like GPTBot, ClaudeBot, etc.) accessing your WordPress content and requires payment via the x402 protocol before granting access.</p>
            
            <h4>How It Works:</h4>
            <ol>
                <li><strong>Detection:</strong> AI agents are identified by their user-agent strings</li>
                <li><strong>402 Response:</strong> Agents receive a "Payment Required" response with payment details</li>
                <li><strong>Payment:</strong> Agents pay in USDC on Base network via CDP facilitator</li>
                <li><strong>Access:</strong> After payment verification, agents get instant access</li>
                <li><strong>Revenue:</strong> Payments flow directly to your wallet address</li>
            </ol>
        </div>
    </div>
    
    <!-- Content Tab -->
    <div id="tab-content" class="tab-content">
        <div class="content-toolbar">
            <button id="bulk-generate-links" class="button button-primary">
                <span class="dashicons dashicons-update"></span>
                Generate Paid Links (Posts Only)
            </button>
            <button id="refresh-content" class="button">
                <span class="dashicons dashicons-update-alt"></span>
                Refresh
            </button>
            <span id="post-count-indicator" style="margin-left: 15px; font-weight: 500; color: #666;"></span>
        </div>
        
        <table class="wp-list-table widefat fixed striped" id="content-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Crawls</th>
                    <th>Revenue</th>
                    <th>Force Agents to Pay</th>
                    <th>Force Humans to Pay</th>
                </tr>
            </thead>
            <tbody id="content-table-body">
                <tr>
                    <td colspan="7" style="text-align: center;">
                        <span class="spinner is-active" style="float: none; margin: 20px auto;"></span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <!-- Analytics Tab -->
    <div id="tab-analytics" class="tab-content">
        <div class="analytics-filters">
            <label>Timeframe:</label>
            <select id="analytics-timeframe">
                <option value="7d">Last 7 Days</option>
                <option value="30d" selected>Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
            </select>
        </div>
        
        <div class="analytics-section">
            <h3>Revenue Over Time</h3>
            <div class="analytics-loading" style="display:none; text-align:center; padding:40px;">
                <span class="spinner is-active"></span> Loading chart...
            </div>
            <div id="revenue-chart-container" style="position: relative; height: 300px; width: 100%;">
                <canvas id="revenue-chart"></canvas>
            </div>
            <div class="chart-empty-state" style="display:none;"></div>
        </div>
        
        <div class="analytics-section">
            <h3>AI Agent Breakdown</h3>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Crawls</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody id="agent-breakdown-body">
                    <tr><td colspan="3" style="text-align:center;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
        
        <div class="analytics-section">
            <h3>Top Performing Content</h3>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Page Title</th>
                        <th>Crawls</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody id="top-content-body">
                    <tr><td colspan="3" style="text-align:center;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Bot Management Tab -->
    <div id="bot-management" class="tab-content">
        <div class="bot-management-header">
            <h2><span class="dashicons dashicons-shield"></span> AI Agent & Bot Management</h2>
            <p>Configure how your site responds to AI agents and web crawlers. All bots default to "Monetize" mode.</p>
            <button id="refresh-bot-stats" class="button">
                <span class="dashicons dashicons-update-alt"></span>
                Refresh Stats
            </button>
        </div>
        
        <table class="wp-list-table widefat fixed striped bot-management-table" id="bot-table">
            <thead>
                <tr>
                    <th style="width: 40px;"><input type="checkbox" id="select-all-bots"></th>
                    <th>Crawler</th>
                    <th>Category</th>
                    <th>Requests</th>
                    <th>Robots.txt Violations</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="bot-table-body">
                <tr>
                    <td colspan="6" style="text-align: center;">
                        <span class="spinner is-active" style="float: none; margin: 20px auto;"></span>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div class="bulk-actions" style="margin-top: 20px;">
            <select id="bulk-action-select" class="config-input" style="width: auto;">
                <option value="">Bulk Actions</option>
                <option value="monetize">Set to Monetize</option>
                <option value="allow">Set to Allow</option>
                <option value="block">Set to Block</option>
            </select>
            <button id="apply-bulk-action" class="button">Apply</button>
        </div>
        
        <div class="agent-hub-info-box" style="margin-top: 30px;">
            <h3><span class="dashicons dashicons-info-outline"></span> Bot Action Modes</h3>
            <ul>
                <li><strong>Monetize:</strong> Bot must pay to access content (recommended for AI agents)</li>
                <li><strong>Allow:</strong> Bot can access content for free (use for search engines)</li>
                <li><strong>Block:</strong> Bot is completely denied access (403 response)</li>
            </ul>
        </div>
    </div>
    
    <!-- Contact Us Tab -->
    <div id="tab-contact" class="tab-content">
        <div class="contact-intro">
            <h2>About 402links Plugin</h2>
            <div class="contact-description">
                <p>This plugin is developed by the team at <a href="https://402links.com" target="_blank">402links.com</a> by using the emerging "HTTP 402 Payment Required" standard. Leveraging novel advancements in agentic payment technologies, the plugin enables websites to convert any page or endpoint into a monetizable digital SKU. This means that both humans and AI agents can seamlessly pay for access, data, or functionality - directly through standard web requests - with instant settlement in stablecoins on the Base blockchain.</p>
                
                <p>The 402 Links project is experimental and open to collaboration. We're continuously refining the protocol and invite feedback, suggestions, and partnership ideas from early adopters and developers.</p>
                
                <p>If you have questions, encounter issues, or wish to contribute, please reach out using the form below. Your feedback helps shape the next generation of web-native payments.</p>
                
        <div class="contact-links">
            <p>
                🔗 <a href="https://402links.com/details" target="_blank">Learn more about the technology</a>
            </p>
            <p>
                🧠 <a href="https://402links.com/developers" target="_blank">For developers & integration docs</a>
            </p>
            <p style="margin-left: 20px; margin-top: 8px;">
                <strong>Open Source Protocol Implementations:</strong>
            </p>
            <p style="margin-left: 20px;">
                📦 <a href="https://github.com/coinbase/x402" target="_blank">x402 Protocol (Coinbase)</a> - The core HTTP 402 payment protocol implementation that enables AI agents to make payments through standard HTTP headers. This is the foundation of our agent payment system.
            </p>
            <p style="margin-left: 20px;">
                📦 <a href="https://github.com/google-agentic-commerce/AP2" target="_blank">AP2 Protocol (Google Agentic Commerce)</a> - Google's Agent Payment Protocol 2 specification that defines how AI agents discover and interact with paywall-protected content. We've integrated this to ensure broad agent compatibility.
            </p>
        </div>
            </div>
        </div>
        
        <!-- x402 Endpoint Diagnostics -->
        <div class="diagnostics-wrapper" style="margin-bottom: 30px;">
            <h3><span class="dashicons dashicons-admin-tools"></span> x402 Endpoint Diagnostics</h3>
            <p>Test if your .well-known endpoints are working correctly. These endpoints allow AI agents to discover your paywall-protected content.</p>
            
            <button id="test-endpoints" class="button button-primary" style="margin-bottom: 15px;">
                <span class="dashicons dashicons-search"></span>
                Test Endpoints
            </button>
            
            <button id="flush-rewrite-rules" class="button" style="margin-left: 10px;">
                <span class="dashicons dashicons-update"></span>
                Flush Rewrite Rules
            </button>
            
            <div id="diagnostics-results" style="display:none; margin-top: 20px;">
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width: 30px;"></th>
                            <th>Endpoint</th>
                            <th>Status</th>
                            <th>URL</th>
                        </tr>
                    </thead>
                    <tbody id="diagnostics-results-body">
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="contact-form-wrapper">
            <h3>Send Us a Message</h3>
            <form id="contact-form" class="contact-form">
                <div class="form-row">
                    <div class="form-field">
                        <label for="contact-name">Name <span class="required">*</span></label>
                        <input type="text" id="contact-name" name="name" placeholder="Your name" required maxlength="100" />
                        <span class="field-error" id="name-error"></span>
                    </div>
                    
                    <div class="form-field">
                        <label for="contact-email">Email <span class="required">*</span></label>
                        <input type="email" id="contact-email" name="email" placeholder="your.email@example.com" required maxlength="255" />
                        <span class="field-error" id="email-error"></span>
                    </div>
                </div>
                
                <div class="form-field">
                    <label for="contact-subject">Subject (Optional)</label>
                    <input type="text" id="contact-subject" name="subject" placeholder="What's this about?" maxlength="200" />
                </div>
                
                <div class="form-field">
                    <label for="contact-message">Message <span class="required">*</span></label>
                    <textarea id="contact-message" name="message" placeholder="Tell us what's on your mind..." required maxlength="2000" rows="6"></textarea>
                    <span class="field-error" id="message-error"></span>
                    <div class="character-count">
                        <span id="message-count">0</span> / 2000 characters
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="button button-primary" id="contact-submit">
                        <span class="dashicons dashicons-email-alt"></span>
                        Send Message
                    </button>
                </div>
            </form>
            
            <div id="contact-success" class="contact-success" style="display: none;">
                <div class="success-icon">
                    <span class="dashicons dashicons-yes-alt"></span>
                </div>
                <h3>Thank you - Message sent!</h3>
                <p>We've received your message and will get back to you as soon as possible.</p>
                <button class="button" id="send-another">Send Another Message</button>
            </div>
        </div>
    </div>
    
    <div id="agent-hub-toast" class="agent-hub-toast"></div>
</div>

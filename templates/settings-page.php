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
        <button class="tab-button" data-tab="violations">
            <span class="dashicons dashicons-shield-alt"></span>
            Violations
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
                    <?php
                    // Determine initial sync status based on saved wallet
                    $saved_wallet = $settings['payment_wallet'] ?? '';
                    $has_wallet = !empty(trim($saved_wallet));
                    
                    // Set indicator state
                    if ($has_wallet) {
                        $indicator_class = 'wallet-sync-indicator wallet-status-synced';
                        $dot_color = 'green';
                        $status_text = 'Synced';
                    } else {
                        $indicator_class = 'wallet-sync-indicator wallet-status-empty';
                        $dot_color = 'gray';
                        $status_text = 'Not synced';
                    }
                    ?>
                    <div class="wallet-input-wrapper">
                        <input type="text" id="overview-payment-wallet" class="config-input" 
                               value="<?php echo esc_attr($settings['payment_wallet'] ?? ''); ?>" 
                               placeholder="0x..." />
                        <div id="wallet-sync-indicator" class="<?php echo esc_attr($indicator_class); ?>" data-server-rendered="true">
                            <span class="status-dot <?php echo esc_attr($dot_color); ?>"></span>
                            <span class="status-text"><?php echo esc_html($status_text); ?></span>
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
    
    <!-- Violations Tab -->
    <div id="tab-violations" class="tab-content">
        <div class="violations-header">
            <h2>
                <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 28px; height: 28px; margin-right: 12px;">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Agent Violations Dashboard
            </h2>
            <p class="violations-description">Track and monitor AI agents that violate robots.txt rules, ignore 402 payment requirements, or attempt unauthorized access to your content.</p>
        </div>
        
        <div class="agent-hub-stats-grid">
            <div class="stat-card">
                <div class="stat-icon warning">
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Total Violations</div>
                    <div class="stat-value" id="violations-total">0</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon robots-violation">
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Robots.txt Violations</div>
                    <div class="stat-value" id="violations-robots">0</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon warning">
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Unpaid Access Attempts</div>
                    <div class="stat-value" id="violations-unpaid">0</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 010 7.75"></path>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Unique Violating Agents</div>
                    <div class="stat-value" id="violations-unique-agents">0</div>
                </div>
            </div>
        </div>
        
        <div class="violations-table-section">
            <div class="violations-controls">
                <h3>
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Agent Violation Summary & Access Control
                </h3>
                <div class="bulk-actions-toolbar" id="bulk-actions-toolbar" style="display:none;">
                    <button id="select-all-agents" class="button" title="Select all agents">
                        <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                        </svg>
                        Select All
                    </button>
                    <button id="deselect-all-agents" class="button" title="Deselect all agents">
                        <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        </svg>
                        Deselect All
                    </button>
                    <div class="bulk-action-divider"></div>
                    <select id="bulk-action-select" class="bulk-action-dropdown">
                        <option value="">Bulk Actions...</option>
                        <option value="monetize">Set to Monetize</option>
                        <option value="allow">Set to Allow</option>
                        <option value="block">Set to Block</option>
                    </select>
                    <button id="apply-bulk-action" class="button button-primary">
                        <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Apply
                    </button>
                    <span id="selected-count" class="selected-count">0 selected</span>
                </div>
            </div>
            
            <div id="violations-loading" style="text-align: center; padding: 40px;">
                <span class="spinner is-active"></span> Loading violations data...
            </div>
            <div id="violations-error" class="notice notice-error" style="display:none; margin: 20px 0;">
                <p><strong>Error:</strong> <span id="violations-error-message"></span></p>
            </div>
            <table class="wp-list-table widefat fixed striped violations-action-table" id="violations-table" style="display:none;">
                <thead>
                    <tr>
                        <th class="check-column"><input type="checkbox" id="select-all-checkbox" /></th>
                        <th>Agent Name</th>
                        <th>Total Violations</th>
                        <th>Robots.txt Violations</th>
                        <th>Unpaid Access</th>
                        <th>Last Seen</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="violations-table-body">
                </tbody>
            </table>
            <div id="violations-empty" class="notice notice-info" style="display:none; margin: 20px 0;">
                <p>
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <strong>Great news!</strong> No violations detected. All AI agents are respecting your site's access rules.
                </p>
            </div>
            <div class="violations-save-wrapper" id="violations-save-wrapper" style="display:none;">
                <button id="save-agent-actions" class="button button-primary button-hero">
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save Agent Actions
                </button>
                <span class="unsaved-changes-indicator">
                    <svg class="feather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Unsaved changes
                </span>
            </div>
        </div>
        
    
    <!-- Toast Notification -->
    <div id="agent-hub-toast" style="display:none;"></div>
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

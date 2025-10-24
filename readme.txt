=== 402links Agent Hub ===
Contributors: 402links, ProBluex
Tags: payment, ai, agent, monetization, x402, paywall
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 2.3.17
License: Proprietary
License URI: https://402links.com

Automatically monetize WordPress content with AI agent payments via x402 protocol.

== Description ==

402links Agent Hub enables seamless monetization of WordPress content through the x402 payment protocol. AI agents can automatically discover and pay for access to your premium content using cryptocurrency micropayments.

**Key Features:**

* Automatic content monetization with x402 protocol
* AI agent payment detection and processing
* Flexible pricing per post/page
* Payment tracking and analytics
* Base network support
* Universal payment page integration

**How It Works:**

1. Mark posts/pages as premium content
2. Set pricing in USD (converted to crypto)
3. AI agents discover your content via x402 protocol
4. Agents pay automatically and gain instant access
5. Track payments and agent access in real-time

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/402links-agent-hub/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Configure your payment wallet address in Settings → 402links
4. Start marking content as premium with custom pricing

== Frequently Asked Questions ==

= What is x402? =

x402 is an open protocol that enables AI agents to automatically discover and pay for premium content using cryptocurrency micropayments.

= Which blockchain networks are supported? =

Currently supports Base network with more networks coming soon.

= Do I need a crypto wallet? =

Yes, you need a wallet address on Base network to receive payments.

= How do AI agents discover my content? =

The plugin automatically exposes payment metadata through the x402 protocol that AI agents can discover and process.

== Screenshots ==

1. Plugin settings page
2. Post/page pricing configuration
3. Payment tracking dashboard
4. Agent access logs

== Changelog ==

= 2.3.17 =
* PHASE 3: AJAX Handlers for Bot Policy Management
* Added ajax_get_site_bot_policies() handler in Admin.php with nonce + capability checks
* Added ajax_update_site_bot_policies() handler in Admin.php with validation
* Registered AJAX actions in Core.php: agent_hub_get_site_bot_policies, agent_hub_update_site_bot_policies
* Ready for Phase 4: Frontend UI integration

= 2.3.16 =
* PHASE 2: WordPress API Integration for Bot Policies
* Added get_site_bot_policies() method to API.php for fetching bot-specific policies
* Added update_site_bot_policies() method to API.php for updating bot actions
* Methods include validation for site_id and policies array structure
* Ready for Phase 3: AJAX handlers integration

= 2.3.15 =
* PHASE 1: Bot Policy Management Infrastructure
* Added get-site-bot-policies edge function for retrieving bot-specific policies
* Added update-site-bot-policies edge function for updating bot actions (monetize/allow/block)
* Extended API proxy with new routes: /v1/get-site-bot-policies and /v1/update-site-bot-policies
* Foundation for Phase 2-7: Bot Management UI and bulk policy updates

= 2.3.14 =
* CRITICAL FIX: Corrected AJAX handler response structure - API returns agents/totals at root level, not nested under 'data' key
* FIXED: "Failed to load violations data" error - handler now correctly extracts agents and totals arrays from API response
* IMPROVED: Added comprehensive error logging to AJAX handler for debugging (logs API result and response data)
* ENHANCED: Violations tab now successfully displays all 30+ registered agents with zero violations

= 2.3.13 =
* CRITICAL FIX: Added missing API proxy routes for violations dashboard (/v1/get-agent-violations-summary, /v1/report-violation)
* FIXED: Red alert box display issue on violations tab (changed .error class to .robots-violation for proper icon styling)
* FIXED: "Not Found" error preventing violations data from loading
* FIXED: Agents table now properly displays all 30+ bots from registry with zero violations
* IMPROVED: Better error logging for debugging violations API calls (console logs for AJAX URL, nonce, site URL)
* ENHANCED: Stat card icon styling with proper circular badge appearance and HSL colors

= 2.3.12 =
* FIXED: Violations tab now displays ALL agents from bot_registry (20+ bots)
* FIXED: Agents with zero violations now correctly show "0" instead of being hidden
* FIXED: Edge function now queries bot_registry with LEFT JOIN to agent_violations
* FIXED: CSS styling for error/warning stat icons (proper colors and contrast)
* FIXED: "Not Found" error - edge function now properly aggregates all bot data
* IMPROVED: Table always visible with all registered bots, sorted by violation count
* IMPROVED: Better error handling and logging in violations summary endpoint

= 2.3.11 =
* Added Agent Violations tab to main dashboard
* Implemented agent-level violation summary table
* Shows all violating agents with breakdown by violation type
* Displays total violations, robots.txt violations, and unpaid access attempts
* Auto-loads all agent data on page load without search requirement
* Created aggregated violations API endpoint

= 2.3.10 =
* Phase 4: Agent Hub Violations Dashboard
* Added dedicated Violations submenu page in WordPress admin
* Real-time violations display with filtering by type and agent name
* Statistics dashboard showing total violations, robots.txt violations, unpaid access, and unique agents
* Integrated get-violations edge function for backend violation data retrieval
* AJAX-powered violations table with sorting and detailed violation information
* Enhanced API.php with get_violations() method supporting filters

= 2.3.9 =
* Phase 3: Robots.txt Violation Detection System
* Integrated real-time robots.txt compliance checking in PaymentGate
* Added report_violation() API method for backend violation reporting
* Automated violation logging to agent_violations table via report-violation edge function
* Enhanced log_crawl() to report violations to backend when detected
* Real-time robots.txt rule parsing and path-based enforcement
* Violations tracked with robots.txt directive, expected vs actual behavior

= 2.3.8 =
* Enhanced bot detection with database-driven pattern matching from bot_registry
* Added get_bot_from_registry() method for comprehensive bot identification
* Updated is_ai_agent() to return bot ID, category, and company information
* Added check_robots_txt_compliance() method to detect robots.txt violations
* Improved bot matching algorithm with caching for better performance
* Added support for tracking robots.txt violations in agent logs
* Performance optimization: 1-hour cache for bot registry data

= 2.3.7 =
* Phase 1: Populated bot registry with 27 AI agents and web crawlers
* Added comprehensive bot detection database (OpenAI, Anthropic, Google, Meta, Perplexity, and more)
* All bots default to "monetize" action for x402 payment enforcement
* Bot categories: AI Crawler, AI Assistant, Search Engine, Archiver
* Foundation for upcoming bot management and analytics features

= 2.3.5 =
* Simplified wallet sync logic - "Synced" status now persists correctly on page reload
* Removed unnecessary AJAX sync check - wallet status is determined server-side from database
* Validation messages only appear when user actively edits the wallet field
* Fixed issue where "Click Save to sync" appeared even when wallet was already synced

= 2.3.4 =
* Fixed wallet sync status persistence - now shows "Synced" immediately on page load if wallet is saved
* Eliminated unnecessary backend API calls on every page refresh
* Improved UI reliability by using server-side sync detection instead of AJAX checks
* Wallet status now accurately reflects database state without delays

= 2.3.3 =
* Fixed JavaScript syntax error in overview.js (missing closing brace)
* Updated sync indicator UI with color-coded status dots (gray/orange/green)
* Changed "Enter wallet address" text to "Not synced" for clarity
* Added orange color for active syncing state
* Improved wallet address persistence across page refreshes

= 2.3.2 =
* Fixed wallet sync status not persisting across page refreshes
* Fixed analytics showing zero despite successful payments
* Added combined human + AI agent payment tracking
* Improved analytics dashboard to show all revenue sources

= 2.3.1 =
* Fixed missing site_url parameter in link update requests
* Resolved batch processor showing false "failed" counts for existing links
* Improved update operation reliability

= 2.3.0 =
* Fixed BatchProcessor class file naming for proper autoloading
* Resolved "Network error" during batch content protection
* Improved batch processing reliability

= 2.2.9 =
* Enhanced security: migrated all WordPress plugin endpoints to public API infrastructure
* Fixed default API endpoint to use https://api.402links.com/v1
* Updated API proxy configuration to support all WordPress routes
* Improved database integrity protection and API authentication
* Removed direct Supabase URL references from plugin code

= 2.2.8 =
* Fixed GitHub workflow to generate WordPress-installable plugin ZIP
* Updated to use modern GitHub release action (softprops/action-gh-release@v2)
* Enhanced release notes with detailed installation instructions
* Improved auto-update reliability

= 2.2.7 =
* Implemented GitHub auto-update system
* Fixed namespace issues in PaywallTemplate
* Universal redirect to 402links payment page
* Enhanced payment tracking
* Improved agent detection
* Added Base network support

= 2.2.0 =
* Initial public release
* x402 protocol integration
* Payment tracking system
* Agent hub functionality

== Upgrade Notice ==

= 2.2.7 =
This version adds automatic updates from GitHub. Ensure your WordPress site can connect to GitHub for future updates.

== Support ==

For support, visit: https://402links.com/support
Documentation: https://402links.com/docs

== Privacy Policy ==

This plugin collects anonymous usage data including:
* AI agent access logs (IP address, user agent)
* Payment transaction data
* Post/page access statistics

No personal user data is collected. All data is stored locally in your WordPress database.

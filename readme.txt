=== Tolliver - Ai Agent Pay Collector ===
Contributors: 402links, ProBluex
Tags: payment, ai, agent, monetization, x402, paywall
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 3.4.5
License: Proprietary
License URI: https://402links.com


Automatically monetize WordPress content with AI agent payments via x402 protocol.

== Description ==

Tolliver - Ai Agent Pay Collector enables seamless monetization of WordPress content through the x402 payment protocol. AI agents can automatically discover and pay for access to your premium content using cryptocurrency micropayments.

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

1. Upload the plugin files to `/wp-content/plugins/tolliver-agent/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Configure your payment wallet address in Settings → Tolliver
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

= 3.4.5 =
* 🎨 REBRANDING: Updated all "402links" and "AI Agent Paywall" references to "Tolliver" branding
* 🎨 REBRANDING: Changed success notices to "Tolliver - Ai Agent Pay Collector"
* 🎨 REBRANDING: Updated Overview page "About" section to "About Tolliver - Ai Agent Pay Collector"
* 🎨 REBRANDING: Changed batch generation modal title to "Generating monetization links..."
* 🎨 REBRANDING: Updated meta box text from "402link" to "Monetization Link"
* 🎨 REBRANDING: Changed "protected by AI agent paywall" to "protected by Tolliver"
* 🎨 REBRANDING: Updated violations page references to "Tolliver dashboard"
* 🔧 CRITICAL FIX: Corrected API URL in bulk sync from https://402links.com/p/ to https://api.402links.com/p/
* 🐛 KNOWN ISSUE: Analytics data loading failure (401 Unauthorized) - under investigation
* 🔧 MAINTENANCE: Version bump to 3.4.5 across all plugin files

= 3.4.3 =
* 🚀 FEATURE: Added ecosystem-wide metrics to Analytics tab (Active Buyers, Active Sellers, Total Transactions)
* 📊 FEATURE: Replaced "Revenue Over Time" with "Market Overview" chart showing ecosystem activity
* 📈 FEATURE: Interactive metric toggles for chart (Transactions, Volume, Buyers, Sellers)
* 🎯 IMPROVEMENT: Analytics tab now shows both ecosystem performance and site-specific revenue
* 🔧 ARCHITECTURE: New wordpress-ecosystem-stats edge function for real-time ecosystem data
* ✨ UI: Enhanced stat cards with professional flat design matching WordPress standards

= 3.4.1 =
* 🎨 REBRANDING: Plugin renamed to "Tolliver - Ai Agent Pay Collector"
* 🖼️ FEATURE: Added circular Tolliver logo emblem to WordPress dashboard header
* 🔧 MAINTENANCE: Version bump to 3.4.1 across all plugin files
* ✨ UI: Enhanced dashboard header with professional logo branding

= 3.4.0 =
* 🎯 DATA CONSISTENCY FIX: My Content, Analytics, and Overview pages now show identical crawl and revenue numbers
* ✅ FIX: Combined agent crawls + human payments = Total Access count (no more mismatches)
* ✅ FIX: Revenue now correctly aggregates agent payments + human purchases across all views
* 🚀 FEATURE: Real-time Monitoring Dashboard at /monitoring for tracking events and compliance
* 📊 MONITORING: Post creation event logging with auto-registration tracking
* 📊 MONITORING: Payment event logging (agent + human) with revenue verification
* 📊 MONITORING: CDP Bazaar registration status tracking
* 📊 MONITORING: x402scan compliance monitoring
* 📊 MONITORING: AP2 mandate validation checks
* 🔧 IMPROVEMENT: Enhanced wordpress-sync-page edge function with detailed logging
* 🔧 IMPROVEMENT: Fixed get-site-pages-analytics to properly combine agent + human data
* 📚 TERMINOLOGY: Standardized "Total Access" (agent + human) across all dashboards
* 🔍 DEBUGGING: Auto-refreshing monitoring dashboard (5-second intervals)
* ✅ VERIFIED: Database triggers confirmed working for revenue aggregation

= 3.2.0 =
* 🚀 CRITICAL FIX: Bot payment flow - agents now receive 402 response instead of redirect
* ✅ FIX: Added /v1/access-link route to API proxy (api.402links.com)
* ✅ FIX: WordPress returns 402 with X-402-Resource pointing to api.402links.com/v1/access-link
* ✅ FIX: Humans redirected to 402links.com/p/{short_id} payment UI
* 🔧 ARCHITECTURE: Bots hit API endpoint directly, humans use payment widget
* 📚 NOTE: No more 302 redirects for bots - proper x402 protocol compliance

= 3.1.1 =
* 🐛 CRITICAL FIX: Resolved wallet sync failure on fresh installations
* ✅ FIX: Auto-provision site before wallet sync if not already registered
* ✅ IMPROVEMENT: Better error messages for wallet sync failures
* ✅ ENHANCEMENT: Handle missing API key scenario gracefully
* 🔧 ARCHITECTURE: Intelligent wallet sync flow with 3 scenario handling

= 3.1.0 =
* 🔴 CRITICAL ROLLBACK PATCH - Stable Release
* ✅ RECOMMENDED: Use this version for production deployments
* ⚠️ ROLLED BACK: Stripe subscription integration (unstable in v3.3.0)
* 🎯 STABLE: Pure x402 protocol implementation with proven reliability
* ✅ FEATURE: Complete AI agent payment detection via x402
* ✅ FEATURE: CDP Facilitator integration for payment verification
* ✅ FEATURE: 30+ AI bot registry with policy management
* ✅ FEATURE: Robots.txt compliance tracking
* ✅ FEATURE: Violation reporting and analytics
* ✅ FEATURE: Auto-provisioning with 402links.com
* 📚 NOTE: Stripe subscriptions removed - will return in future stable release
* 🔧 ARCHITECTURE: Battle-tested x402 payment flow without recurring billing
* 📊 ANALYTICS: Full payment tracking and agent access logs
* 🔒 SECURITY: Production-ready with comprehensive bot detection

= 2.4.1 =
* 🐛 CRITICAL FIX: Resolved "Fatal error: Non-static method cannot be called statically" in PaymentGate.php:210
* ✅ FEATURE: Added static wrapper method for violation reporting (API::report_violation_static)
* ✅ FEATURE: Enhanced error handling - 402 response now sends even if violation logging fails
* 🔧 IMPROVEMENT: Better error logging for debugging static method calls
* 🔧 IMPROVEMENT: Non-blocking violation reporting prevents secondary failures
* 📚 TESTED: Confirmed fix resolves 500 errors on agent/human access attempts

= 2.4.0 =
* 🚀 MAJOR: Native x402 protocol implementation - replaces redirect-based flow
* ✅ FEATURE: Direct CDP Facilitator integration for payment verification
* ✅ FEATURE: X-PAYMENT header detection and processing
* ✅ FEATURE: Native 402 Payment Required responses (x402 spec compliant)
* ✅ FEATURE: CORS support for AI agent cross-origin requests
* ✅ FEATURE: OPTIONS preflight handler for payment protocol
* 🔧 IMPROVEMENT: Real-time payment settlement via CDP
* 🔧 IMPROVEMENT: Enhanced payment logging with transaction details
* 🔧 IMPROVEMENT: Removed redirect-based fallback for cleaner x402 flow
* 📚 BREAKING: Agents must implement x402 protocol (no more redirects)
* 📚 DOCS: Updated architecture to match 402links.com implementation

= 2.3.31 =
* Fixed edge function deployment issue with robots_txt_directive database column
* Enhanced violation tracking with complete robots.txt directive storage

= 2.3.30 =
* PHASE 2: Core Tracking Implementation
* Add real-time violation reporting from WordPress to Supabase
* Track robots.txt violations with directive details
* Track unpaid access attempts for both agents and humans
* Report violations immediately when detected (non-blocking)
* Update edge function to handle new violation types
* Complete data flow: WordPress → API → Supabase → Dashboard

= 2.3.29 =
* Remove unnecessary warning banner from Violations tab
* Clean up interface clutter

= 2.3.28 =
* PHASE 1 IMPLEMENTATION: Honest violation tracking data
* Fix fake "Last Seen" timestamps - now returns actual data or "Never" when no violations exist
* Update frontend to properly handle null timestamps and display "Never"
* Add transparent UI disclaimer explaining violation tracking requirements
* Improve data validation in timestamp formatting
* Foundation for Phase 2 enforcement mechanisms

= 2.3.27 =
* Fix button background colors: Change to pure black (#000000) for maximum readability
* Update "Save Configuration" button to use black background with white text
* Update "Generate Paid Links" button to use black background with white text
* Update content table headers to use black background with white text
* Ensure all text remains readable with maximum contrast

= 2.3.26 =
* CRITICAL FIX: Resolve white-on-white text issues in Overview and My Content sections
* Fix "Save Configuration" button text readability in Overview tab
* Fix "Generate Paid Links" button text readability in My Content tab
* Fix table header text contrast in My Content section
* Remove redundant "AI Agent Breakdown" section from Analytics tab (data available in Violations tab)
* Add !important flags to ensure proper text contrast across WordPress themes
* Improve accessibility compliance for button and table text

= 2.3.25 =
* Design: Extend professional monochromatic design to Overview and My Content sections
* Replace all colorful icons with flat, neutral grey icons throughout
* Update stat cards to use enterprise-grade minimalist design
* Apply monospace fonts to numerical data for technical precision
* Replace colored status badges with neutral grey alternatives
* Update toggle switches to professional neutral design
* Replace blue buttons and accents with sophisticated grey palette
* Remove decorative gradients and focus on data presentation
* Achieve consistent serious, professional appearance across all sections

= 2.3.24 =
* Design: Convert violations section to flat, monochromatic design for serious professional appearance
* Replace colorful stat card icons with neutral grey icons
* Update violation badge numbers to flat grey style with monospace font
* Improve typography and spacing for better readability
* Icons now match Overview section style for consistency

= 2.3.23 =
* UI Improvement: Replace badge + select dropdown with custom dropdown button
* Add proper down arrow indicator to policy dropdown
* Improve dropdown UX with cleaner visual design
* Fix confusing stacked dropdown display issue
* Active policy now shows as a single button with green dot and arrow

= 2.3.22 =
* Feature: Add dynamic policy status labels with active state indicators
* Add green dot indicator for active policies (Monetized, Allowed, Blocked)
* Improve policy selection UX with visual status badges
* Change dropdown labels: Monetize → Monetized, Allow → Allowed, Block → Blocked when active

= 2.3.21 =
* Critical hotfix: Fix undefined variable 'violations' causing dashboard load failure
* Fix network error messages not displaying correctly in policy save handler
* Fix policy actions container remaining visible when no violations exist
* Add null safety checks for success message element
* Comprehensive audit and bug fixes for violations.js stability

= 2.3.20 =
* Hotfix: Remove duplicate else block in violations.js causing syntax error
* Fix agent violation dashboard not loading due to JavaScript syntax error

= 2.3.19 =
* Phase 5: Complete Violations tab UI with policy column header, save button, and professional styling
* Add policy management actions container with success/error messages
* Improve policy dropdown styling to match dashboard design system
* Enhance user feedback for policy save operations

= 2.3.18 =
* PHASE 4: Frontend Policy Management Integration
* Updated violations.js to load bot policies via AJAX
* Added policy dropdown to each bot row with Monetize/Allow/Block options
* Implemented savePolicies() function with proper data structure conversion
* Added change tracking and dynamic save button visibility
* Merged policy data with violations display
* Ready for Phase 5: UI enhancements and styling

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

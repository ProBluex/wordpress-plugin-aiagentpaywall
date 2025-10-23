=== 402links Agent Hub ===
Contributors: 402links, ProBluex
Tags: payment, ai, agent, monetization, x402, paywall
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 2.3.4
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

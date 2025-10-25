# Changelog

All notable changes to the 402links Agent Hub WordPress plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.4.4] - 2025-10-26

### Fixed
- **Critical**: Fixed triple-nesting bug causing analytics data to be inaccessible
- **Critical**: Prevented redundant success wrapping in API.php when edge function already returns proper structure
- **Critical**: Fixed Admin.php to extract data from nested structure before sending to frontend
- **Fixed**: Analytics now properly parse ecosystem and user data at correct nesting level

### Technical Details
- `API.php` (line 646): Added check to prevent double-wrapping `{success: true}` if result already contains it
- `Admin.php` (line 316): Extract `$data = $result['data'] ?? $result` before `wp_send_json_success()` to avoid triple-nesting
- Root cause: Response chain was nesting data 3 levels deep, causing frontend validation to fail on `data.ecosystem`

## [3.4.3] - 2025-10-26

### Fixed
- **Critical**: Added missing `/v1/wordpress-analytics-enhanced` API route to proxy
- **Critical**: Fixed response structure double-nesting in Admin.php causing analytics to fail
- **Critical**: Increased API timeout from 5 to 15 seconds to prevent premature timeouts
- **Fixed**: Added defensive parsing in analytics.js to handle both nested and direct data structures
- **Fixed**: Improved error logging for analytics API responses

### Technical Details
- `api-proxy/index.ts`: Added route mapping for enhanced analytics endpoint
- `Admin.php`: Removed double-nesting by sending `wp_send_json_success($result)` directly
- `API.php`: Increased timeout to 15 seconds for complex analytics queries
- `analytics.js`: Added fallback `response.data.data || response.data` for robust parsing

## [3.4.2] - 2025-10-26

### Changed
- **Analytics Dashboard Redesign**: Complete visual overhaul with professional, enterprise-grade dark theme
  - Replaced bright purple gradients with subdued dark grays (#1a1f36, #2d3748, #4a5568)
  - Compact hero section (~80px vs 300px) with horizontal layout
  - Monospace fonts for all numeric data (SF Mono, Monaco, Courier New)
  - Reduced hero title from 72px to 24px font size
  - Updated all stat cards, facilitator bars, and ticker to match dark theme
  - Improved typography with uppercase labels and consistent letter spacing

### Fixed
- **Overview Tab Loading**: Fixed stats not loading - added explicit `enhanced: false` parameter to request basic analytics
- **Analytics API Response**: Properly format AJAX responses using `wp_send_json_success()` and `wp_send_json_error()` instead of raw `wp_send_json()`
- **Error Handling**: Added error callback to overview stats AJAX request

### Technical Details
- Updated `Admin.php` line 313 to properly wrap API responses in WordPress AJAX format
- Updated `admin.js` `loadOverviewStats()` function to explicitly request non-enhanced analytics
- Redesigned `analytics-enhanced.css` with enterprise color palette and compact spacing
- Updated `settings-page.php` hero section HTML structure for horizontal layout

## [3.4.1] - 2025-10-26

### Fixed
- **Critical PHP Syntax Error**: Resolved fatal error in `includes/Admin.php` line 316 caused by orphaned if statement outside function scope
- **Duplicate Code Cleanup**: Removed duplicate response handling code (lines 316-326) that was accidentally left after refactoring the `ajax_get_analytics()` method
- WordPress admin now loads correctly without parse errors

## [3.4.0] - 2025-10-26

### Added
- **Enhanced Analytics Dashboard**: Combined user metrics with x402 ecosystem data for a complete picture
- **Ecosystem Hero Section**: Display total x402 volume ($646K+) with growth indicators vs previous period
- **Market Share Tracking**: See your percentage of the global agent economy
- **Publisher Rankings**: View your rank among all active publishers in the ecosystem
- **Top Facilitators Breakdown**: Visual representation of Coinbase, PayAI, and X402rs market share with animated progress bars
- **Motivational Messaging**: Context-aware encouragement based on your performance and growth trajectory
- **Live Ecosystem Ticker**: Real-time updates on latest transactions, 24h volume, and active publishers
- **Auto-Refresh Dashboard**: Automatically updates analytics every 5 minutes when tab is active
- **Animated Number Counters**: Smooth transitions for engaging user experience when data updates
- **Enhanced Loading States**: Better visual feedback with spinners and empty states for facilitator data
- **Mobile-Optimized Layout**: Improved responsive design for all new analytics components

### Changed
- Analytics tab now fetches from `/wordpress-analytics-enhanced` endpoint for combined data
- Ecosystem data sourced from `x402_facilitator_transfers` table in the backend
- Auto-refresh interval increased from 30 seconds to 5 minutes for better performance
- Improved error handling throughout the analytics system

### Fixed
- Better error messages when ecosystem data is unavailable
- Loading states for facilitator breakdown prevent empty flash
- Mobile layout properly stacks ticker items and stat cards
- Number formatting handles large values (K/M notation) consistently

### Technical Details
- New edge function: `wordpress-analytics-enhanced` combines user + ecosystem statistics
- Market share calculation: `(user_revenue / ecosystem_volume) * 100`
- Publisher rank: Based on `total_revenue` in `registered_sites` table
- Facilitator data: Real-time aggregation from blockchain transfers

## [3.3.2] - 2025-10-20

### Fixed
- Analytics API endpoint stability improvements
- Enhanced error logging for debugging

## [3.3.1] - 2025-10-15

### Fixed
- Payment verification edge cases
- Database query optimization

## [3.3.0] - 2025-10-10

### Added
- Initial analytics dashboard with revenue charts
- Agent crawl tracking and breakdown
- Basic statistics cards

### Changed
- Improved API endpoint structure
- Better data caching mechanisms

## [3.2.0] - 2025-09-28

### Added
- Auto-generation of 402links for all pages
- Payment wallet configuration
- Network selection (Base/Sepolia)

## [3.1.0] - 2025-09-15

### Added
- GitHub auto-update integration
- Plugin update checker from releases

## [3.0.0] - 2025-09-01

### Added
- Initial release
- HTTP 402 payment integration
- WordPress page protection
- Agent Hub registration
- Basic analytics tracking

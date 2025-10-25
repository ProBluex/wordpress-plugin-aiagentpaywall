# Changelog

All notable changes to the 402links Agent Hub WordPress plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# FlowState - ADHD Companion Browser Extension

## Overview

FlowState is a revolutionary browser extension specifically designed for ADHD minds. It works *with* your brain patterns rather than against them, providing innovative features to maintain focus, manage hyperfocus, and turn impulsivity into productivity. The extension takes a non-punitive, celebratory approach to ADHD challenges while providing practical solutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Migration Completed (July 24, 2025)**
- Successfully migrated Chrome Extension project from Replit Agent to Replit
- Fixed Python3 installation for HTTP server functionality  
- Updated documentation to match actual vanilla JavaScript implementation
- Created proper landing page with installation instructions
- All extension files verified and accessible

## System Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Extension Framework**: Chrome Extension Manifest V3
- **Storage**: Chrome Storage API (sync and local storage)
- **Notifications**: Chrome Alarms and Notifications API
- **Communication**: Chrome Runtime messaging

### Architecture Pattern
The extension follows a distributed architecture pattern typical of browser extensions:
- **Service Worker** (background.js): Core logic and state management
- **Content Scripts** (content.js): In-page interactions and overlays
- **Popup Interface** (popup.html/js): User controls and settings
- **Special Pages** (blocked.html/js): Custom intervention pages

## Key Components

### 1. Background Service Worker (background.js)
- **Purpose**: Central orchestrator for all extension features
- **Responsibilities**: 
  - Tab monitoring and activity tracking
  - Timer management for hyperfocus detection
  - Feature state management
  - Cross-component communication
- **Key Classes**: `FlowStateBackground`

### 2. Content Script System (content.js)
- **Purpose**: Provides in-page overlays and interactions
- **Responsibilities**:
  - Displaying intervention overlays
  - Keyboard shortcut handling (Ctrl+Shift+T for thought capture)
  - Real-time user feedback
- **Key Classes**: `FlowStateContent`

### 3. Popup Interface (popup.html/js/css)
- **Purpose**: Main user control panel
- **Responsibilities**:
  - Feature toggles and settings
  - Statistics display
  - Quick actions and controls
- **Key Classes**: `FlowStatePopup`

### 4. Dopamine Queue System (blocked.html/js/css)
- **Purpose**: Gamified site blocking and reward system
- **Responsibilities**:
  - Intercepting "fun" site visits
  - Task completion tracking
  - Earned time management
- **Key Classes**: `FlowStateBlocked`

## Data Flow

### User Activity Monitoring
1. Background service tracks active tab changes
2. Timer systems monitor session duration
3. Activity data stored in Chrome storage
4. Triggers sent to content scripts for interventions

### Feature Activation Flow
1. User configures features via popup interface
2. Settings synced across browser instances
3. Background service applies configurations
4. Content scripts receive activation messages
5. Overlays and interventions displayed as needed

### Reward System Flow
1. User attempts to visit blocked site
2. Background service redirects to blocked.html
3. User completes earning tasks
4. Time credits added to storage
5. Access granted for earned duration

## External Dependencies

### Chrome Extension APIs
- **Tabs API**: For tab monitoring and management
- **Storage API**: For settings and data persistence
- **Alarms API**: For timer-based interventions
- **Notifications API**: For system notifications
- **Runtime API**: For inter-component messaging

### No External Libraries
The extension is built with vanilla JavaScript to minimize dependencies and ensure fast loading times, which is crucial for ADHD users who benefit from immediate responsiveness.

## Deployment Strategy

### Distribution Method
- Chrome Web Store deployment
- Manifest V3 compliance for future-proofing
- Progressive enhancement approach

### Feature Rollout
- Core features implemented first (hyperfocus breaker, momentum keeper)
- Advanced features (context restoration, impulse buffer) as enhancements
- A/B testing capability through feature toggles

### Privacy and Security
- All data stored locally using Chrome Storage API
- No external servers or data transmission
- Minimal permissions requested (tabs, storage, alarms, notifications)
- Privacy-first design suitable for ADHD users who value control

### Performance Considerations
- Lightweight service worker to minimize memory usage
- Efficient DOM manipulation in content scripts
- CSS animations optimized for smooth performance
- Storage operations batched to reduce API calls

The architecture prioritizes user experience, privacy, and performance while providing innovative ADHD-specific features that address real challenges faced by neurodivergent users in digital environments.
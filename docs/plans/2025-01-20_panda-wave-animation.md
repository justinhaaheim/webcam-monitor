# Panda Wave Animation Feature

**Date:** 2025-01-20

## Overview

Adding a fun panda animation that appears from the bottom right corner, waves (wiggles back and forth), and then exits the screen. The animation will be triggered by clicking the "Debug Info" header in the debug menu.

## Requirements

- [x] Create planning document
- [x] Examine current app structure and debug info implementation
- [x] Design the animation states and transitions
- [x] Implement panda animation component
- [x] Make debug info header clickable to trigger animation
- [x] Add animation state management to App.tsx
- [x] Test the animation
- [x] Check with npm run signal
- [ ] Commit changes

## Technical Plan

### Animation States

1. **Hidden**: Panda is off-screen (bottom right)
2. **Entering**: Panda slides in from bottom right to be 3/4 visible
3. **Waving**: Panda wiggles back and forth (rotation animation)
4. **Exiting**: Panda slides back out to bottom right off-screen

### Implementation Notes

- Use CSS transforms for positioning and rotation
- Use CSS transitions/animations for smooth movement
- Manage animation state in App.tsx
- Position panda absolutely in bottom right corner
- Make animation non-intrusive to main app functionality

## Assets

- Panda image: `src/assets/pandaWithCape.png`

## Progress Notes

- Starting implementation...
- ✅ Examined App.tsx structure - main app container is absolute positioned with video element
- ✅ Examined DebugInfo.tsx - has "Debug Info" header that can be made clickable
- 📝 Current structure: App.tsx manages showDebugInfo state, DebugInfo is conditionally rendered
- 📝 Need to add panda animation state to App.tsx and pass trigger function to DebugInfo
- 📝 Animation should be positioned absolutely in bottom right corner with high z-index
- ✅ Created PandaWaveAnimation component with enter/wave/exit states
- ✅ Added panda animation state management to App.tsx
- ✅ Made "Debug Info" header clickable with hover effect
- ✅ Updated DebugInfo component interface to accept onPandaTrigger prop
- ✅ All tests pass - no TypeScript or lint errors

## Implementation Details

- Animation sequence: hidden → entering (500ms) → waving (2s) → exiting (500ms) → hidden
- Positioned fixed in bottom right with 120px width, 3/4 visible when active
- Wave animation uses CSS keyframes with rotation (-10deg to +10deg)
- Click "Debug Info" header in debug menu to trigger animation
- Uses setTimeout for state transitions and cleanup on unmount

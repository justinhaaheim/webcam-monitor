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
- [x] Commit changes ✨

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
- 🔧 User feedback: Animation is jerky, panda just appears instead of sliding in
- 📝 Next: Redesign with CSS keyframes for entire animation sequence

## Implementation Details

- Animation sequence: hidden → entering (500ms) → waving (2s) → exiting (500ms) → hidden
- Positioned fixed in bottom right with 120px width, 3/4 visible when active
- Wave animation uses CSS keyframes with rotation (-10deg to +10deg)
- Click "Debug Info" header in debug menu to trigger animation
- Uses setTimeout for state transitions and cleanup on unmount

## Redesign Plan (CSS Keyframes)

- Single keyframe animation handling entire sequence
- Smooth slide-in from right edge
- Continuous wave motion during middle portion
- Smooth slide-out to right edge
- Use animation events for completion callback

## CSS Keyframes Implementation ✅

- Redesigned with single `pandaWaveSequence` keyframe animation (5.5s total)
- Updated timing breakdown per user feedback:
  - 0-9.09%: **Diagonal slide-in** from bottom-right corner (0.5s)
  - 9.09-45.45%: Wait positioned and still (2s pause)
  - 45.45-66%: **Super fast** waving back and forth (1.1s, 8 wave cycles!)
  - 66-90.91%: Wait positioned after waving (1.35s pause)
  - 90.91-100%: **Diagonal slide-out** to bottom-right corner (0.5s)
- Smooth easing throughout with `ease-in-out`
- Uses `onAnimationEnd` event for completion callback
- Much smoother motion than previous state-based approach
- Added dramatic pauses for better comedic timing 🎭
- **Latest updates**: Diagonal entrance/exit + super fast waving! ⚡️
- Enhanced motion: Swoops in diagonally from bottom-right corner
- Increased wave intensity: 8 cycles in 1.1s (was 5 cycles in 1.5s)
- More dramatic and eye-catching entrance/exit animations
- **Nested Box structure**: Panda tilted 30° left for dynamic orientation
- Separated base rotation from animation transforms for cleaner code

## Auto-Trigger System 🎲 ✅

- **Initial Delay**: 5-minute grace period after app opens
- **Random Intervals**: Each auto-trigger waits 5-20 minutes (randomized)
- **Continuous Loop**: After each animation completes, schedules the next random visit
- **Console Logging**: Logs when system activates and schedules next visit
- **Proper Cleanup**: Clears all timers on component unmount
- **Manual Override**: Debug menu trigger still works anytime
- **Smart Timing**: Never interrupts ongoing animations

### Implementation Details

- Uses `useCallback` for stable function references
- `useEffect` with cleanup for timer management
- Random interval: `Math.random() * 15 + 5` minutes
- Window timeout for cross-browser compatibility
- Ref-based timer storage to avoid re-renders

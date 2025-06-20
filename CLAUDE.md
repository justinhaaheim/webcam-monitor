# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript webcam monitor application built with Vite. The app provides a full-screen webcam viewer with controls for device selection, video flipping, aspect ratio adjustment, and fullscreen mode. It uses MUI Joy for UI components and follows functional programming patterns.

## Core Architecture

The application has a simple, single-page architecture:

- **App.tsx**: Main component managing webcam stream state, device enumeration, and video display
- **Controls.tsx**: Bottom control bar with device selection dropdown and action buttons
- **DebugInfo.tsx**: Debug overlay showing technical details (device ID, resolution, FPS, etc.)
- **ErrorBoundary.ts**: Application-level error handling
- **main.tsx**: App entry point with MUI Joy theme provider

### State Management

- Uses React hooks for local state management
- No external state management library
- MediaStream objects are managed centrally in App.tsx
- Device preferences are persisted to localStorage

### Key Features

- Webcam device enumeration and selection
- High-definition video capture (requests 1920x1080 @ 60fps with fallbacks)
- Video transformations (horizontal flip, aspect ratio modes)
- Fullscreen mode with auto-hiding controls
- Real-time debug information overlay
- Error handling for camera access issues

## Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run all quality checks (TypeScript, ESLint, Prettier)
npm run signal

# Individual quality checks
npm run ts-check        # TypeScript type checking
npm run lint            # ESLint linting
npm run prettier-check  # Prettier formatting check

# Fix issues
npm run lint:fix        # Auto-fix ESLint issues
npm run prettier        # Auto-format with Prettier
```

## Code Style & Guidelines

This project follows strict code quality standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Uses custom `eslint-config-jha-react-node` configuration
- **Prettier**: Enforced code formatting
- **Husky + lint-staged**: Pre-commit hooks ensure code quality

### React Patterns

- Functional components only (no classes)
- Custom hooks for reusable logic
- Proper dependency arrays in useEffect/useCallback/useMemo
- Avoid unnecessary re-renders through memoization
- Event handlers over useEffect for user interactions

### Important Rules

- Never disable ESLint rules without explicit authorization
- Use `null` for absent values (not empty strings/arrays)
- Functional, declarative programming preferred
- Check for TypeScript and lint errors after coding changes

## MediaDevices API Integration

The app heavily uses the MediaDevices API:

- `navigator.mediaDevices.getUserMedia()` for camera access
- `navigator.mediaDevices.enumerateDevices()` for device listing
- Proper stream cleanup to prevent resource leaks
- Error handling for permission and device availability issues

## UI Framework

Uses MUI Joy (not Material-UI):

- `@mui/joy` components and styling system
- `@mui/icons-material` for icons
- CSS-in-JS with sx prop for styling
- Responsive design with viewport units

## Browser APIs Used

- **MediaDevices API**: Core webcam functionality
- **Fullscreen API**: Fullscreen mode toggle
- **localStorage**: Device preference persistence
- **requestAnimationFrame**: FPS calculation in debug mode

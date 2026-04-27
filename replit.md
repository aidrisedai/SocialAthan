# Athan + Jama'ah Companion App

## Overview
A mobile app helping Muslims attend congregational prayer (jama'ah) by combining prayer times, RSVP/intention tracking, a social friend layer, streaks, and masjid management.

**Brand**: Modern minimalist, warm teal/jade palette. Free, ad-free, sadaqah jariyah ethos.

## Architecture

### Tech Stack
- **Framework**: Expo (React Native) with Expo Router v6
- **Language**: TypeScript
- **State**: React Context (AppContext) + AsyncStorage for persistence
- **Packages**: expo-haptics, expo-blur, expo-location, expo-clipboard, expo-notifications, @tanstack/react-query

### Artifact
- **Dir**: `artifacts/athan-app/`
- **Preview path**: `/`
- **Type**: Mobile (Expo)

### Color Palette (`constants/colors.ts`)
- Primary: `#1B6B5B` (deep teal/jade)
- Background: `#F7F5F2` (warm cream)
- Card: `#FFFFFF`
- Going RSVP: `#1B6B5B`, Maybe: `#B87333`, Can't: `#C45858`
- Streak: `#E8A020`

### File Structure
```
artifacts/athan-app/
├── app/
│   ├── _layout.tsx              # Root layout with AppProvider, font loading
│   ├── index.tsx                # Redirect to onboarding or tabs
│   ├── (tabs)/
│   │   ├── _layout.tsx          # 4-tab navigation
│   │   ├── index.tsx            # Home screen (prayer times + RSVP)
│   │   ├── friends.tsx          # Friends with Going Now / All / Discover tabs
│   │   ├── streaks.tsx          # Personal jama'ah streaks
│   │   └── settings.tsx         # All app settings
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx          # Onboarding step 1
│   │   ├── location.tsx         # Step 2 - location permission
│   │   ├── masjid.tsx           # Step 3 - pick primary masjid
│   │   ├── profile.tsx          # Step 4 - name/username
│   │   └── notifications.tsx    # Step 5 - notification permission
│   ├── masjid-select.tsx        # Masjid switcher modal
│   ├── masjid/[id].tsx          # Masjid detail view
│   ├── friend-discover.tsx      # Add friends / search / QR / invite
│   ├── friend-search.tsx        # Alias for friend-discover
│   ├── chat/[id].tsx            # 1:1 DM chat
│   ├── admin-portal.tsx         # Masjid admin - update prayer times
│   ├── qr-scan.tsx              # QR show/scan for friend adds
│   ├── invite-link.tsx          # Share invite link
│   ├── calculation-method.tsx   # Prayer calculation method settings
│   └── adhan-audio.tsx          # Adhan reciter selection
├── context/
│   └── AppContext.tsx           # Full app state (user, RSVPs, friends, streaks, notifications, messages)
├── components/
│   ├── PrayerCard.tsx           # Prayer time card with RSVP CTA + friend avatars
│   ├── RSVPSheet.tsx            # Going/Maybe/Can't bottom sheet
│   ├── FriendCard.tsx           # Friend with dua chips, nudge, message actions
│   └── StreakBadge.tsx          # Streak display (compact + full)
└── constants/
    └── colors.ts                # Brand palette
```

## Key Design Decisions
- **No backend for v1**: All data via AsyncStorage + hardcoded sample data
- **RSVP visibility**: "Going" RSVPs are visible to friends; "Maybe" and "Can't" are private
- **Streaks are fully private**: No leaderboards, no public comparisons
- **Onboarding gated**: `onboardingComplete` flag in AsyncStorage gates the app to onboarding on first launch
- **RSVP modal**: Uses React Native Modal (not Expo Router formSheet) for reliable rendering

# LidaCacau - Marketplace Rural

## Overview
LidaCacau is a mobile marketplace application (Expo React Native) designed to connect property owners with rural workers in Uruara/PA, Brazil. The app facilitates the posting of service demands, a proposal system, GPS-based work tracking, photo uploads, and bilateral evaluations. Beyond agricultural services, the platform supports general construction and maintenance services (masonry, electrical, plumbing, metalwork, painting, carpentry).

**Brand Philosophy**: "Confianca de quem e da Lida" - connecting people who work the land with trust and community.

## User Preferences
- Idioma: Portugues (PT-BR)
- Foco: Android (via Expo Go)
- Design: iOS 26 Liquid Glass style
- Sem emojis na interface (emoji-style icons allowed)

## Brand Identity (LidaCacau)
- **Primary Color**: #F15A29 (Laranja - warmth, energy)
- **Secondary Colors**: 
  - #7ED957 (Verde - growth, nature)
  - #FFD100 (Amarelo - optimism, harvest)
  - #0071BC (Azul - trust, reliability)
- **Typography**: Rubik font family (Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold)
- **Level Colors**: N1 Gray, N2 Green, N3 Blue, N4 Purple, N5 Gold

## System Architecture

### Core Features
- **Authentication**: Three user profiles (Producer, Worker, Admin) with identity verification (selfie + document upload) and "Verified Badge"
- **Service Demand & Proposal System**: Producers post job demands, workers submit proposals
- **GPS Tracking**: Check-in/check-out functionality for work orders
- **Bilateral Evaluation**: 5-criterion rating system for both producers and workers
- **Gamification**: Worker leveling system (N1-N5) based on experience and evaluations
- **Dual-Role Architecture**: Users can switch between Producer and Worker roles
- **MapHub Component**: Interactive map centered on "Km 140 Vila Alvorada - Uruara/PA"
- **Property Management**: GPS-based location and photo uploads for properties
- **Education System**: Training platform with XP, quizzes, and skill progression
- **Legal Contract System ("Empreitada")**: Automatic legally compliant contracts with digital signing
- **Referral Program**: Unique referral codes rewarding both parties with XP

### Social Features (Nov 2025)
- **Amigos do Campo ("Dar a Mao")**: Friend connection system for building community trust
  - Send/accept/reject friend requests
  - View friends list
  - Remove connections
- **Direct Messaging**: Chat system between connected users
  - Real-time messages
  - Read receipts
  - Unread counters
  - Date separators
- **User Search**: Find users with filters
  - Filter by role (producer/worker)
  - Filter by verification status
  - Filter by online presence (5-min threshold)
- **Presence System**: Track user activity
  - Active/inactive status
  - Statistics by role
  - Online indicators

### Quick Actions ("+" Button)
- **Unified Action Hub**: Single "+" button opens modal with work-focused actions
- **Options**:
  - "Quero pegar uma lida" (offer services)
  - "Preciso de gente pra lida" (post demand)
  - "Buscar Gente da Lida" (search users)
  - "Montar Esquadrao" (create work team)

### Esquadrao da Lida (Work Teams)
- **Team Formation**: Create or propose work squads with up to 4 members
- **Leader Selection**: Choose yourself as leader or propose someone else
- **Invite Friends**: Select from connected friends to join the squad
- **Service Types**: Optionally specify team specialties
- **Status Tracking**: proposed, recruiting, active, working, completed, disbanded
- **Storage Keys**: SQUADS, SQUAD_INVITES, SQUAD_PROPOSALS

### Gente da Lida Section
- **New User Showcase**: Horizontal scroll showing recent users in home feed
- **Visual Elements**: Avatar, name, role tag, level badge, "NOVO" badge for users < 7 days
- **Navigation**: Click to view user profile

### Notification System
- **New User Notifications**: Auto-generated when users register with "Lida" phrases
- **Storage**: @lidacacau_notifications key, max 100 notifications
- **Functions**: createNotification, getNotifications, markNotificationAsRead

### Technical Implementation
- **UI/UX**: iOS 26 Liquid Glass style with LidaCacau color palette
- **Persistency**: AsyncStorage for offline-first data persistence (all keys use `@lidacacau_` prefix)
- **Navigation**: React Navigation 7+
- **Theming**: Support for dark/light mode
- **Analytics**: Event tracking with 1000-event buffer for AI analysis

### Directory Structure
- `/App.tsx`: Entry point with ErrorBoundary and Rubik fonts
- `/screens/`: Organized by authentication, producer, worker, admin, and shared functionalities
  - `/screens/shared/UnifiedHomeScreen.tsx`: Main home with animated swipeable job cards
  - `/screens/shared/UnifiedProfileScreen.tsx`: User profile with Comunidade section
  - `/screens/shared/FriendsScreen.tsx`: Amigos do Campo system
  - `/screens/shared/ChatListScreen.tsx`: Conversation list
  - `/screens/shared/ChatRoomScreen.tsx`: Individual chat
  - `/screens/shared/UserSearchScreen.tsx`: User search with filters
  - `/screens/shared/TutorialScreen.tsx`: Interactive 6-card tutorial carousel
  - `/screens/shared/QuickActionsScreen.tsx`: Unified action modal (create, search, chat)
- `/navigation/`: Navigation flows
  - `UnifiedTabNavigator.tsx`: 5-tab structure (Home, Conversas, +, Explorar, Perfil)
  - `RootNavigator.tsx`: Root navigation with auth handling
- `/contexts/`: Contains `AuthContext.tsx`
- `/types/`: TypeScript definitions including FriendConnection, ChatRoom, DirectMessage, UserPresence, PersonalBackground, Certificate, PortfolioItem
- `/utils/`: 
  - `storage.ts`: 19 storage keys, friend/chat/presence functions, cleanup utilities
  - `analytics.ts`: Event tracking with trackEvent, startSession, endSession
  - `format.ts`, `contract.ts`, `receipt.ts`, `payment.ts`
- `/data/`: Service types and educational content (fake data removed for MVP)
- `/constants/`: Theme definitions with LidaCacau colors

### Storage Keys (@lidacacau_ prefix)
- CURRENT_USER, USERS, JOBS, BIDS, WORK_ORDERS, REVIEWS
- SERVICE_OFFERS, CARD_PRESETS, USER_PREFERENCES
- FRIENDS, CHAT_ROOMS, MESSAGES_{roomId}, PRESENCE
- ANALYTICS, CONTRACT_HISTORY, PORTFOLIO, NOTIFICATIONS

### Custom Hooks
- `useScreenInsets`: Screen padding calculations (tab bar, header, web differences)
- `useSimpleScreenInsets`: Simplified version for basic calculations
- `useFetch`: Generic data fetching with loading states
- `useLoadingState`: Loading/refreshing state management

### Analytics System
- `trackEvent(eventType, eventData?, screen?)`: Record user events
- `startSession(userId?)`: Initialize analytics session
- `endSession()`: Finalize session
- Event types: app_open, screen_view, card_create, friend_request, chat_send, etc.
- Storage limit: 1000 events (FIFO)

## Payment System (OpenPix Integration)
- **Screens**: PaymentScreen, PaymentHistoryScreen, PixSettingsScreen
- **Split**: 90% worker, 10% platform fee
- **Features**: PIX QR Code generation, status tracking, payment history

## Navigation Routes
### RootStackParamList
- Auth: Login, Register, Tutorial
- Main: MainTabs, Profile screens
- Social: Friends, ChatList, ChatRoom, UserSearch, OtherUserProfile
- Jobs: JobDetail, CreateCard, Proposals
- Teams: CreateSquad
- Payments: Payment, PaymentHistory, PixSettings
- Settings: IdentityVerification, SocialLinks, Portfolio, FAQSupport

## External Dependencies
- **Expo**: Core framework with expo-location, expo-image-picker, expo-haptics
- **Navigation**: @react-navigation/native, @react-navigation/bottom-tabs
- **Maps**: react-native-maps (mobile), web fallback placeholder
- **OpenPix**: Payment gateway (requires OPENPIX_APP_ID secret)

## Recent Changes (Nov 2025)
1. Complete rebranding from Empleitapp to LidaCacau
2. New color palette and Rubik font implementation
3. Social features: Amigos do Campo, Chat, User Search
4. Analytics system for AI analysis
5. Interactive tutorial with 6-card carousel
6. Comunidade section in profile
7. Fake data removed for MVP readiness
8. Storage cleanup utilities added
9. Dev data seeding: initializeDevData() creates demo users (Maria/Joao) in __DEV__ mode
10. All touch targets verified at 48dp minimum
11. trackEvent calls added to all key user actions
12. **Quick Actions Hub**: Unified "+" button with modal for work-focused actions only
13. **New Logo**: Handshake with cocoa fruit design applied across app
14. **Gente da Lida Section**: Horizontal scroll in home feed showing recent users
15. **Notification System**: Auto-notifications when new users register
16. **Lida Terminology**: Updated UI texts with regional phrases ("pegar lida", "gente da lida", "firme na lida")
17. **Esquadrao da Lida**: Work team system with 4-member squads, leader selection, and invite management
18. **Tab Navigation Update**: "Conversas" tab replaced "Aprender" for direct chat access
19. **Enhanced Profile System**: Complete profile-building with personal history, work photos, and certificates
    - EditProfileScreen with ScreenKeyboardAwareScrollView for keyboard handling
    - PersonalBackground type: birthPlace, yearsInRegion, familyConnections, personalStory
    - Work photos gallery (max 6 items with cover-fit images)
    - Certificates list with institution info
    - Profile completion tracking (8 fields with progress bar)
    - OtherUserProfileScreen displays "Minha Historia", photos, certificates

## Demo Credentials (Development Only)
- **Maria da Silva** (Producer): maria@demo.lidacacau.com
- **Joao Pereira** (Worker): joao@demo.lidacacau.com
- These accounts are friends with an active chat room for testing

# LidaCacau - Marketplace Rural

## Overview
LidaCacau is a mobile marketplace application (Expo React Native) connecting property owners with rural workers in Uruara/PA, Brazil. It facilitates service demand posting, a proposal system, GPS-based work tracking, photo uploads, and bilateral evaluations. The platform supports agricultural, construction, and maintenance services, aiming to build trust and community with the brand philosophy: "Confianca de quem e da Lida". The project envisions gamification, legal contract systems, and an education platform to empower rural workers and streamline operations.

## User Preferences
- Idioma: Portugues (PT-BR)
- Foco: Android (via Expo Go)
- Design: iOS 26 Liquid Glass style
- Sem emojis na interface (emoji-style icons allowed)

## System Architecture

### UI/UX Decisions
- **Brand Identity**: Primary #F15A29, Secondary #7ED957, #FFD100, #0071BC. Typography: Rubik font family.
- **Theming**: Support for dark/light mode.
- **Level Colors**: N1 Gray, N2 Green, N3 Blue, N4 Purple, N5 Gold.
- **Unified Action Hub**: Single "+" button opens a modal for work-focused actions.
- **Gente da Lida Section**: Horizontal scroll on the home feed showcasing recent users.
- **Notifications**: Auto-generated when new users register.
- **Cocoa Price Ticker**: Compact widget on the home screen with price change indicators.

### Technical Implementations
- **Authentication**: Three user profiles (Producer, Worker, Admin) with identity verification. Users can switch between Producer and Worker roles.
- **Service & Proposal System**: Producers post jobs, workers submit proposals.
- **GPS Tracking**: Check-in/check-out for work orders and property management.
- **Bilateral Evaluation**: 5-criterion rating system.
- **Gamification**: Worker leveling system (N1-N5) based on experience and evaluations.
- **Social Features**:
    - **Amigos do Campo**: Friend connection system ("Dar a Mao").
    - **Direct Messaging**: Real-time chat with read receipts and unread counters.
    - **User Search**: Filterable search for users by role, verification, and online status.
    - **Presence System**: Tracks user activity and online status.
- **Esquadrao da Lida (Work Teams)**: Create or propose work squads (up to 4 members) with leader selection and friend invitations.
- **Rural Property Management**:
    - `PropertyDetail` with polygon boundaries (GeoJSON-compatible).
    - `Talhao` system for field plot management (crop types, service tags, priority).
    - `PropertyDocument` upload (e.g., CAR) with verification workflow.
    - `MapPropertyEditor` for interactive polygon drawing and area calculation.
- **Education System**: Training platform with XP, quizzes, and skill progression.
- **Legal Contract System ("Empreitada")**: Automatic, legally compliant contracts with digital signing.
- **Referral Program**: Unique referral codes for XP rewards.
- **Profile System**: Comprehensive profile building with personal history, work photos, and certificates.
- **Real-Time Cocoa Price Tracking**: Integration of global and local cocoa prices with a stale-while-revalidate cache.
- **Persistency**: AsyncStorage for offline-first data persistence, using `@lidacacau_` prefix for all keys.
- **Navigation**: React Navigation 7+ with a 5-tab structure (Home, Conversas, +, Explorar, Perfil).
- **Analytics**: Event tracking with a 1000-event buffer for AI analysis.
- **Payment System**: OpenPix integration for PIX QR code generation, with 90% worker / 10% platform fee split.

### System Design Choices
- **Dual-Role Architecture**: Seamless switching between Producer and Worker roles.
- **MapHub Component**: Interactive map centered on "Km 140 Vila Alvorada - Uruara/PA".
- **Service Layer**: Designed for production migration with interfaces (`IAuthService`, `IJobService`, etc.), mock implementations, and a `ServiceFactory` for dependency injection.
- **Development Mode Features**: Auto-login for demo users (Maria/Joao), session persistence, and tutorial skipping for streamlined testing.

## External Dependencies
- **Expo**: Core framework, including `expo-location`, `expo-image-picker`, `expo-haptics`.
- **Navigation**: `@react-navigation/native`, `@react-navigation/bottom-tabs`.
- **Maps**: `react-native-maps` (with web fallback placeholder).
- **OpenPix**: Payment gateway (requires `OPENPIX_APP_ID`).
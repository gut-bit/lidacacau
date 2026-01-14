# LidaCacau - Marketplace Rural

## Overview
LidaCacau is a mobile marketplace application designed to connect rural property owners with workers in Uruara/PA, Brazil. It aims to streamline the process of finding and hiring labor for agricultural, construction, and maintenance services through features like service demand posting, a proposal system, GPS-based work tracking, and bilateral evaluations. The platform emphasizes building trust within the rural community, operating under the brand philosophy: "Confianca de quem e da Lida". Future ambitions include gamification, a legal contract system, and an educational platform for worker empowerment.

## User Preferences
- Idioma: Portugues (PT-BR)
- Foco: Android (via Expo Go)
- Design: iOS 26 Liquid Glass style
- Sem emojis na interface (emoji-style icons allowed)

## System Architecture

### UI/UX Decisions
- **Brand Identity**: Uses a specific color palette (#F15A29, #7ED957, #FFD100, #0071BC) and the Rubik font family.
- **Theming**: Supports both dark and light modes.
- **Unified Action Hub**: A single "+" button for work-related actions.
- **Gente da Lida Section**: A horizontal scroll section on the home screen for recent users.
- **Cocoa Price Ticker**: A compact widget displaying cocoa prices and trends.

### Technical Implementations
- **Authentication**: Supports Producer, Worker, and Admin roles, with identity verification and the ability for users to switch between Producer and Worker roles.
- **Service & Proposal System**: Enables job posting by producers and proposal submission by workers.
- **GPS Tracking**: Implements check-in/check-out for work orders and property management.
- **Bilateral Evaluation**: A 5-criterion rating system for users.
- **Gamification**: A worker leveling system (N1-N5) based on experience and evaluations.
- **Social Features**: Includes friend connections ("Amigos do Campo"), real-time direct messaging with read receipts, user search, and an online presence system.
- **Esquadrao da Lida (Work Teams)**: Allows creation or proposal of work squads.
- **Rural Property Management**: Features `PropertyDetail` with GeoJSON-compatible polygon boundaries, a `Talhao` system for field plot management, `PropertyDocument` upload with verification, and `MapPropertyEditor` for interactive map editing.
- **Education System**: A training platform with XP, quizzes, and skill progression.
- **Legal Contract System ("Empreitada")**: Automated, legally compliant digital contracts.
- **Real-Time Cocoa Price Tracking**: Integrates global and local cocoa prices with a stale-while-revalidate cache. Includes a native module for authenticated users to submit local prices, view trends, and access history, with offline support for specific cities in Pará, Brazil.
- **Persistency**: Utilizes AsyncStorage for offline-first data persistence with a `@lidacacau_` key prefix.
- **Navigation**: Uses React Navigation 7+ with a 5-tab structure (Home, Conversas, +, Explorar, Perfil).
- **Payment System**: Integrates OpenPix for PIX QR code generation, with a 90% worker / 10% platform fee split.
- **Comunidade (Rural Connect Integration)**: Incorporates community coordination features from the Rural Connect project, including a dashboard for roads and occurrences, an interactive map for rural roads (`RoadMapView`), management of `vicinais` (rural communities/roads), reporting of infrastructure `occurrences`, community `petitions` with signature collection, and `fiscalizationAlerts`.

### System Design Choices
- **Dual-Role Architecture**: Facilitates seamless switching between Producer and Worker roles.
- **MapHub Component**: An interactive map centered on "Km 140 Vila Alvorada - Uruara/PA."
- **Web Map (Experimental)**: An experimental OpenStreetMap iframe integration for web browsers.
- **Service Layer**: Designed with interfaces, mock implementations, and a `ServiceFactory` for dependency injection to enable smooth migration from mock to production.
- **Runtime Environment Detection**: Configured to detect production or development environments at runtime for appropriate API usage (real vs. mock data).
- **Development Mode Features**: Includes auto-login for demo users and session persistence for streamlined testing.

## External Dependencies
- **Expo**: Core framework for React Native development, including location, image picker, haptics, and crypto modules.
- **Navigation**: `@react-navigation/native` and `@react-navigation/bottom-tabs` for app navigation.
- **Maps**: `react-native-maps` for map functionalities.
- **OpenPix**: A payment gateway for PIX transactions.
- **PostgreSQL**: The primary database, backed by Neon.
- **Express.js**: Used for the backend API server.
- **Drizzle ORM**: An ORM for interacting with the PostgreSQL database.
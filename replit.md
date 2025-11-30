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

## Database Architecture

### PostgreSQL Schema (Neon-backed)
The app now has a complete PostgreSQL database schema with 17 core tables:

**Core Tables:**
- `users` - User accounts with dual-role support (producer/worker)
- `user_profiles` - Role-specific profiles (skills, equipment, earnings)
- `user_verification` - Identity verification workflow
- `service_types` - 10 pre-seeded service categories
- `properties` - Rural property management with GPS polygons
- `talhoes` - Field plot subdivisions with crop types
- `property_documents` - CAR and land document uploads
- `jobs` - Work demand postings
- `bids` - Worker proposals
- `work_orders` - Assigned work with check-in/out tracking
- `reviews` - 5-criterion bilateral evaluation
- `friend_connections` - "Amigos do Campo" social connections
- `chat_rooms` / `direct_messages` - Real-time messaging
- `user_presence` - Online status tracking
- `sessions` - Authentication sessions
- `notifications` - Push notification queue

**Schema Location:** `server/db/schema.sql`

### Service Layer Architecture
The service layer is designed for easy migration from mock (AsyncStorage) to production (PostgreSQL API):

1. **Interfaces** (`services/interfaces/`): Define contracts for all domains
2. **Mock Implementations** (`services/mock/`): AsyncStorage-based for MVP
3. **Common Utilities** (`services/common/`):
   - `AsyncStorageAdapter` - Local storage abstraction with error logging
   - `ApiAdapter` - HTTP client for backend API
   - `PasswordUtils` - Secure password hashing (SHA-256 with salt, 10k iterations)
   - `SecureStorageAdapter` - expo-secure-store wrapper with web fallback
   - `SessionManager` - Secure session token and user ID management
   - `ValidationUtils` - Input validation (email, password, phone, CPF, name)
   - `ErrorHandler` - Structured error logging with Portuguese user messages
   - `RateLimiter` - Request throttling (auth: 5/min, api: 30/min)
4. **ServiceFactory**: Dependency injection with mode switching

### Security Features
- **Password Security**: SHA-256 hashing with random salt and 10,000 PBKDF2-style iterations
- **Secure Storage**: expo-secure-store for tokens on native, AsyncStorage fallback on web
- **Input Validation**: Email, password strength, Brazilian phone/CPF validation
- **Rate Limiting**: Brute force protection on auth (5 attempts/minute)
- **Error Handling**: Structured logging with 100-error buffer for debugging
- **Session Management**: Secure token storage, proper logout cleanup
- **See**: `SECURITY.md` for full security documentation

**Migration Path:**
1. Deploy backend API server using `server/db/schema.sql`
2. Create API service implementations (e.g., `ApiAuthService`)
3. Update `ServiceFactory` to return API services in production mode
4. Set `API_BASE_URL` environment variable

## Deployment Architecture

### Production Server (Unified)
The application uses a unified Express.js server for production:
- **Port**: 5000 (configurable via PORT env var)
- **API Routes**: `/api/*` - RESTful endpoints for auth, users, jobs, properties, social
- **Static Files**: Expo web export served from `/dist` folder
- **Health Check**: `/api/health` - Returns server status and version

### Build & Deploy Process
1. **Build**: `npx expo export --platform web --output-dir dist`
2. **Run**: `NODE_ENV=production npx tsx server/index.ts`
3. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: JWT signing secret
   - `NODE_ENV`: Set to "production"
   - `PORT`: Server port (default 5000)

### Server Components
- **Express.js** with Helmet, CORS, rate limiting
- **Drizzle ORM** for PostgreSQL operations
- **JWT authentication** with secure session tokens
- **Static file serving** for Expo web bundle

### API Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - New user registration
- `GET /api/users` - List/search users
- `GET /api/jobs` - List work demands
- `GET /api/properties` - Rural properties
- `GET /api/social/friends` - Friend connections
- `GET /api/health` - Server health check

## EAS Build Configuration

### Build Profiles (eas.json)

**Development Build:**
- **Profile**: `development`
- **Purpose**: Development client for testing native features
- **Distribution**: Internal (APK for Android, Simulator for iOS)
- **Channel**: `development`
- **Command**: `npx eas build --profile development --platform android`

**Preview Build:**
- **Profile**: `preview`
- **Purpose**: Internal testing before production
- **Distribution**: Internal (APK for Android, Device for iOS)
- **Channel**: `preview`
- **Environment**: Staging configuration
- **Command**: `npx eas build --profile preview --platform android`

**Production Build:**
- **Profile**: `production`
- **Purpose**: App store distribution
- **Distribution**: Store-ready (App Bundle for Android, App Store for iOS)
- **Channel**: `production`
- **Auto-increment**: Enabled for version management
- **Command**: `npx eas build --profile production --platform android`

### Expo Updates (OTA)
- **Project ID**: `2bb9d9cb-38f9-4300-a038-64b30038b453`
- **Updates URL**: `https://u.expo.dev/2bb9d9cb-38f9-4300-a038-64b30038b453`
- **Check Strategy**: `ON_ERROR_RECOVERY`
- **Publish Command**: `npx eas update --branch production --message "Update description"`

### Expo Dashboard
- **Organization**: gut2s-organization
- **Project**: lidacacau
- **Dashboard URL**: https://expo.dev/accounts/gut2s-organization/projects/lidacacau

## External Dependencies
- **Expo**: Core framework, including `expo-location`, `expo-image-picker`, `expo-haptics`, `expo-crypto`.
- **Navigation**: `@react-navigation/native`, `@react-navigation/bottom-tabs`.
- **Maps**: `react-native-maps` (with web fallback placeholder).
- **OpenPix**: Payment gateway (requires `OPENPIX_APP_ID`).
- **PostgreSQL**: Neon-backed database (DATABASE_URL in secrets).
- **Express.js**: Backend API server with security middleware.
- **Drizzle ORM**: Type-safe database operations.
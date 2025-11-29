# Empleitapp - Marketplace de Servicos Rurais

## Overview
Empleitapp is a mobile marketplace application (Expo React Native) designed to connect property owners with rural workers in Uruará/PA, Brazil. The app facilitates the posting of service demands, a proposal system, GPS-based work tracking, photo uploads, and bilateral evaluations. Beyond agricultural services, the platform now supports general construction and maintenance services (masonry, electrical, plumbing, metalwork, painting, carpentry).

## User Preferences
- Idioma: Português (PT-BR)
- Foco: Android (via Expo Go)
- Design: iOS 26 Liquid Glass style
- Sem emojis na interface

## System Architecture

### Core Features
-   **Authentication**: Three user profiles (Producer, Worker, Admin) with identity verification (selfie + document upload) and a "Verified Badge".
-   **Service Demand & Proposal System**: Producers can post job demands, and workers can submit proposals.
-   **GPS Tracking**: Check-in/check-out functionality for work orders.
-   **Bilateral Evaluation**: A 5-criterion rating system for both producers and workers.
-   **Gamification**: Worker leveling system (N1-N5) based on experience and evaluations.
-   **Dual-Role Architecture**: Users can switch between Producer and Worker roles.
-   **MapHub Component**: Interactive map centered on "Km 140 Vila Alvorada - Uruara/PA" with radius selection and activity markers.
-   **Property Management**: Producers can add, rename, and remove properties with GPS-based location and photo uploads.
-   **Enhanced Job Creation**: Support for multiple photo uploads (up to 5) and mandatory detailed descriptions for job demands.
-   **Education System**: A comprehensive training platform with XP, quizzes, and skill progression (e.g., "Poda de Limpeza do Cacaueiro N1").
-   **Service History & Receipt Export**: Detailed service history with statistics, filters, and PDF receipt generation for completed services.
-   **Legal Contract System ("Empreitada")**: Automatic generation of legally compliant contracts for each service type and payment term, with digital signing capabilities for both parties.
-   **Negotiation System**: Interactive negotiation flow for payment terms with a "Match" animation upon proposal acceptance.
-   **NFS-e Integration**: Direct access to the Uruará municipal portal for electronic service invoice (Nota Fiscal Eletrônica) issuance.
-   **Interactive Tutorial System**: Gamified onboarding experience with role-specific guides for new users.
-   **Social Media Integration**: Optional social media links (WhatsApp, Instagram, Facebook, Telegram, YouTube, LinkedIn) in user profiles, displayed in proposals and work orders.
-   **Referral Program**: Unique referral codes for users, rewarding both parties with XP.
-   **Empleitapp Club**: Discounts with 6 local partners in Uruará for tools, supplies, and fuel.
-   **FAQ and Support**: In-app FAQ with categories and WhatsApp support button.
-   **Portfolio**: Workers can showcase up to 20 photos of their completed work.

### Technical Implementation
-   **UI/UX**: iOS 26 Liquid Glass style with a cocoa-themed color palette (Primary: #2D5016, Secondary: #8B4513, Accent: #FFB800) and specific level colors (N1: Gray, N2: Green, N3: Blue, N4: Purple, N5: Gold).
-   **Persistency**: AsyncStorage for offline-first data persistence.
-   **Navigation**: React Navigation 7+.
-   **Theming**: Support for dark/light mode.

### Directory Structure
-   `/App.tsx`: Entry point with ErrorBoundary.
-   `/screens/`: Organized by authentication, producer, worker, admin, and shared functionalities.
    - `/screens/shared/UnifiedHomeScreen.tsx`: Main home screen with user profile header, stats, and animated swipeable job cards.
    - `/screens/shared/UnifiedProfileScreen.tsx`: Complete user profile with settings and actions.
    - `/screens/shared/ExploreScreen.tsx`: Service category browser and quick actions.
-   `/navigation/`: Manages navigation flows.
    - `UnifiedTabNavigator.tsx`: Main tab navigator combining producer/worker views with role switching.
    - `RootNavigator.tsx`: Root navigation with auth handling.
-   `/contexts/`: Contains `AuthContext.tsx`.
-   `/types/`: TypeScript definitions for core entities (User, Job, Bid, WorkOrder, Review, IdentityVerification, PortfolioItem, ReferralInfo, Skill, Course, Quiz, etc.).
-   `/utils/`: Utility functions for storage, formatting, contract generation, receipt generation, synchronization, and logging.
-   `/data/`: Service types (agricultural + construction) and educational content data.
-   `/constants/`: Theme definitions.
-   `/hooks/`: Custom React hooks for state management and data fetching.

### Recent UX Redesign (Nov 2025)
-   **Unified Navigation**: Single UnifiedTabNavigator replaces separate Producer/Worker navigators.
-   **Role Switching**: Users switch between Producer/Worker via tabs on home screen, no longer separate app experiences.
-   **Animated Cards**: Job cards with swipe-to-dismiss animation using react-native-reanimated.
-   **Expanded Services**: Added construction services: Pedreiro, Eletricista, Encanador, Serralheiro, Pintor, Carpinteiro, Jardineiro, Soldador.
-   **5-Tab Structure**: Home, Explore, Create (+), Learn, Profile.

### Custom Hooks
-   `useScreenInsets`: Centralized hook for screen padding calculations (handles tab bar, header, and web platform differences).
-   `useSimpleScreenInsets`: Simplified version for basic screen inset calculations.
-   `useFetch`: Generic data fetching hook with loading states, error handling, and auto-refresh on focus.
-   `useLoadingState`: Helper hook for managing loading/refreshing states.

### Utility Modules
-   `utils/logger.ts`: Centralized logging utility with log levels (debug, info, warn, error) and log history management. Only logs in development mode.

### Code Optimization Notes
-   Screen components (ScreenScrollView, ScreenKeyboardAwareScrollView, ScreenFlatList) use shared hooks to eliminate code duplication.
-   Platform-specific components (MapHub.native.tsx, MapHub.web.tsx) handle native vs web bundling differences.

## External Dependencies
-   **Expo React Native**: Core mobile application framework.
-   **expo-location**: For GPS tracking, check-in/check-out, and property management.
-   **expo-image-picker**: For uploading photos in job creation and work completion.
-   **expo-web-browser**: For integrating external web portals (e.g., ISSIntegra for NFS-e).
-   **expo-print**: For generating PDF receipts.
-   **expo-sharing**: For sharing generated receipts.
-   **react-native-maps**: (Used on mobile, web fallback placeholder implemented).
-   **ISSIntegra (Uruará City Hall Portal)**: For Electronic Service Invoice (NFS-e) issuance.
-   **OpenPix**: Payment gateway for PIX transactions (free tier). Requires `OPENPIX_APP_ID` secret.

## Payment System (OpenPix Integration)
-   **Telas**: 
    - `/screens/shared/PaymentScreen.tsx` - Criacao de cobranças PIX com QR Code e exibicao de breakdown (90% trabalhador, 10% taxa)
    - `/screens/shared/PaymentHistoryScreen.tsx` - Historico de pagamentos com filtros, resumo financeiro, e identificacao de tipo de cobranca
    - `/screens/shared/PixSettingsScreen.tsx` - Configuracao de chave PIX do trabalhador para recebimentos
-   **Utilitarios**: `/utils/payment.ts` (gerenciamento de cobranças, integracao API OpenPix, calculo de split).
-   **Tipos**: `PixCharge`, `PixChargeType`, `PixPaymentStatus`, `PaymentSummary`, `PaymentBreakdown`, `WorkOrderPayment` em `/types/index.ts`.
-   **Navegação**: Rotas `Payment`, `PaymentHistory` e `PixSettings` disponiveis para Producer e Worker.
-   **Funcionalidades**:
    - Divisao automatica de pagamentos: 90% para trabalhador, 10% taxa da plataforma
    - Criacao de duas cobranças PIX separadas por transacao (worker_payout e platform_fee)
    - Validacao de chave PIX do trabalhador antes de gerar cobrancas
    - Geracao de QR Code PIX, copia de codigo, consulta de status
    - Historico com filtros por status e identificacao visual do tipo de cobranca
    - Botao "Pagar com PIX" disponivel apenas apos conclusao do servico e definicao do preco final

## Contract System (Nov 2025)
-   **Componentes**:
    - `/components/AnimatedButton.tsx` - Botao animado com spring/scale usando react-native-reanimated e feedback haptico. Suporta variantes: primary, secondary, success, danger, accent (amarelado #FFB800). Suporta tamanhos: normal (50px), large (60px).
    - `/components/ContractCompletedModal.tsx` - Modal de celebracao quando ambas as partes assinam o contrato
-   **Tipos**: `ContractHistoryItem` em `/types/index.ts` para armazenar historico de contratos
-   **Storage**: Funcoes `getContractHistory`, `saveContractToHistory`, `updateContractHistoryStatus` em `/utils/storage.ts`
-   **Fluxo de Proposta/Contrato**:
    - Botao "Enviar Proposta" animado com feedback haptico em JobDetailScreen
    - Navegacao automatica de volta apos envio bem-sucedido da proposta
    - Checkbox de aceite digital obrigatorio antes de assinar contrato
    - Modal popup animado quando ambas as partes assinam o contrato
    - Contratos salvos automaticamente no historico do usuario apos assinatura completa

## User Profile System (Nov 2025)
-   **Persistência de Autenticação**: Contas são gravadas automaticamente via AsyncStorage (`getCurrentUser`, `setCurrentUser` em `/utils/storage.ts`). Usuários permanecem logados entre sessões.
-   **Visualização de Perfil de Outros Usuários**:
    - `/screens/shared/OtherUserProfileScreen.tsx` - Tela dedicada para ver perfil de outros usuários com avatar, nível, avaliações, redes sociais e botão de compartilhar
    - Navegação disponível clicando em nomes de trabalhadores/produtores no JobDetailScreen
    - Nomes clicáveis aparecem em cor de link com ícone de "external-link"
-   **Rotas adicionadas**: `OtherUserProfile: { userId: string }` em RootStackParamList

## Card System (Nov 2025)
Sistema robusto de cards para demandas e ofertas com design visual distinto e UX simplificada para trabalhadores rurais.

### Tipos e Estrutura
-   **ServiceOffer**: Card de oferta de serviço do trabalhador (id, workerId, serviceTypeIds, description, prices, extras, status, location, etc.)
-   **OfferInterest**: Manifestação de interesse em uma oferta (id, offerId, producerId, message, status)
-   **CardExtra**: Opções adicionais dos cards (food, accommodation, transport, logistics, custom conditions)
-   **CardPreset**: Templates salvos para criação rápida de cards
-   **CardMatch**: Registro de match entre demanda e oferta
-   **UserPreferences**: Preferências do usuário para algoritmo de exibição (serviceTypeIds, radiusKm, showDemands, showOffers)

### Cores e Visual
-   **Demandas (Produtor busca trabalhador)**: Verde (#2D5016) com ícone de lupa
-   **Ofertas (Trabalhador oferece serviço)**: Azul (#1E90FF) com ícone de maleta
-   Cards possuem borda lateral colorida para fácil identificação visual

### Telas
-   `/screens/shared/CreateCardScreen.tsx` - Tela unificada para criar demandas/ofertas com:
    - Animação de joinha ao criar card
    - Seleção de múltiplos tipos de serviço
    - Configuração de preço (por dia, hora ou unidade)
    - Opções de extras (alimentação, hospedagem, transporte, etc.)
    - Sistema de presets para salvar templates
    - Validação de campos obrigatórios
-   **UnifiedHomeScreen.tsx aprimorada**:
    - FAB (Floating Action Button) colorido por papel ativo
    - Sistema de filtros: Todos, Demandas, Ofertas, distância (10/25/50/100km)
    - Exibição de cards de oferta para produtores
    - Swipeable job cards para trabalhadores

### Storage
-   `createOffer`, `getOffers`, `updateOffer` - CRUD de ofertas
-   `createOfferInterest`, `acceptOfferInterest` - Sistema de interesse
-   `saveCardPreset`, `getCardPresets`, `deleteCardPreset` - Presets de cards
-   `getUserPreferences`, `updateUserPreferences` - Preferências do usuário

### Navegação
-   Rota `CreateCard: { type: 'demand' | 'offer' }` adicionada ao RootStackParamList
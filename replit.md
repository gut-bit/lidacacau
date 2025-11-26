# Empleitapp - Marketplace de Empreitadas Rurais para Cacau

## Overview
Empleitapp is a mobile marketplace application (Expo React Native) designed to connect cocoa farmers with rural workers in Uruará/PA, Brazil. The app facilitates the posting of service demands, a proposal system, GPS-based work tracking, photo uploads, and bilateral evaluations. Its purpose is to streamline rural work contracting, enhance efficiency, and foster a skilled workforce within the cocoa industry.

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
-   `/navigation/`: Manages primary, producer, worker, and admin navigation flows.
-   `/contexts/`: Contains `AuthContext.tsx`.
-   `/types/`: TypeScript definitions for core entities (User, Job, Bid, WorkOrder, Review, IdentityVerification, PortfolioItem, ReferralInfo, Skill, Course, Quiz, etc.).
-   `/utils/`: Utility functions for storage, formatting, contract generation, receipt generation, and synchronization.
-   `/data/`: Service types and educational content data.
-   `/constants/`: Theme definitions.

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
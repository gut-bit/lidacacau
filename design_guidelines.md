# Design Guidelines - LidaCacau Marketplace Rural

## Brand Identity
**Visual Direction:** Liquid Glass - translucent surfaces with vibrant depth, frosted blur effects, and floating content that feels immersive and modern. The app breaks from traditional earthy rural aesthetics, using bold colors and sleek materials to make agricultural work feel premium and tech-forward.

**Memorable Element:** Frosted glass cards that float above gradient backgrounds, creating depth without traditional shadows. Content bleeds edge-to-edge, maximizing screen real estate.

## Navigation Architecture
**Tab Navigation** (4 tabs):
- **Produtor:** Demandas / Criar (FAB) / Histórico / Perfil
- **Trabalhador:** Trabalhos / Ativo (FAB) / Histórico / Perfil
- **Admin:** Stack-only

## Screen Specifications

### Login/Cadastro
- **Purpose:** Authenticate producers or workers
- **Layout:** Fullscreen gradient background, centered form, no traditional header
- **Components:** Segmented control (Produtor/Trabalhador), input fields with frosted glass backgrounds, primary button with gradient fill
- **Top inset:** insets.top + Spacing.xl | **Bottom inset:** insets.bottom + Spacing.xl

### Demandas/Trabalhos (Home)
- **Purpose:** Browse active service requests
- **Layout:** 
  - Header: Large title "Demandas" with frosted blur background, search icon right
  - Content: FlatList with edge-to-edge frosted cards
- **Components:** Service cards (type icon, quantity, location, price badge, status pill), filter chips below header
- **Top inset:** headerHeight + Spacing.md | **Bottom inset:** tabBarHeight + Spacing.lg
- **Empty State:** empty-marketplace.png

### Detalhes da Demanda
- **Purpose:** View full details and submit/manage proposals
- **Layout:**
  - Header: Transparent with back button, title appears on scroll
  - Content: ScrollView with frosted sections
  - Floating submit button at bottom for workers
- **Components:** Info cards (frosted), mini map with blur overlay, proposal list (produtor) or form (trabalhador)
- **Top inset:** headerHeight + Spacing.md | **Bottom inset:** 80dp (floating button) or insets.bottom

### Criar Demanda
- **Purpose:** Create new service request
- **Layout:**
  - Header: Frosted with "Cancelar" left, "Publicar" right (gradient text)
  - Content: Form fields with frosted inputs
- **Components:** Service type picker, quantity/location inputs, date selectors, price field, notes textarea
- **Top inset:** Spacing.xl | **Bottom inset:** insets.bottom + Spacing.xl

### Ordem Ativa (Trabalhador)
- **Purpose:** Check-in/out and upload evidence
- **Layout:**
  - Header: Frosted "Em Andamento"
  - Content: Timeline cards with status progression
  - Floating Action Button: Large gradient circle (56dp) with icon
- **Components:** Service info card, check-in timeline, photo upload grid with frosted placeholders
- **Top inset:** headerHeight + Spacing.md | **Bottom inset:** tabBarHeight + Spacing.xl + 80dp

### Perfil (Worker with Gamification)
- **Purpose:** Show stats, level, settings
- **Layout:**
  - Header: Transparent with gradient avatar background
  - Content: Stats cards with frosted glass, progress bar with glow effect
- **Components:** Level badge (gradient fill), stat cards (services, rating, completion rate), settings list
- **Top inset:** headerHeight + Spacing.md | **Bottom inset:** tabBarHeight + Spacing.xl

## Color Palette
- **Primary:** #F15A29 (vibrant orange)
- **Secondary:** #7ED957 (bright green)
- **Accent:** #FFD100 (electric yellow)
- **Info:** #0071BC (deep blue)
- **Background Gradient:** linear-gradient(180deg, #0071BC 0%, #F15A29 100%)
- **Surface (Frosted Glass):** rgba(255, 255, 255, 0.18) with blur
- **Text Primary:** #FFFFFF
- **Text Secondary:** rgba(255, 255, 255, 0.75)
- **Border (Glass Edge):** rgba(255, 255, 255, 0.3)

## Typography
**Font:** Rubik (Google Fonts)
- **Display:** 32sp, Bold, white
- **H1:** 24sp, Bold, white
- **H2:** 20sp, SemiBold, white
- **Body:** 16sp, Regular, white
- **Caption:** 14sp, Regular, white 75% opacity
- **Label:** 14sp, Medium, white

## Component Specifications

**Frosted Glass Effect:**
- Background: rgba(255, 255, 255, 0.18)
- Border: 1.5dp solid rgba(255, 255, 255, 0.3)
- Border radius: 16dp
- Backdrop blur: 20 (iOS blur effect)

**Buttons:**
- Primary: Linear gradient (Primary → Secondary), white text, 12dp radius, 14dp vertical padding
- Secondary: Frosted glass background, white text, border white 30% opacity
- FAB: 56dp circle, gradient fill, white icon, floating 16dp above content
  - Shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2

**Cards:**
- Frosted glass with white 18% opacity
- 16dp radius, 16dp padding
- No traditional shadow, just glass border
- Margin: 12dp horizontal, 8dp vertical

**Input Fields:**
- Frosted background with white 12% opacity
- Border: white 25% opacity, 10dp radius
- Padding: 12dp horizontal, 16dp vertical
- Focus: glow effect with Primary color

**Badges/Pills:**
- Gradient backgrounds matching status (success = green, warning = yellow)
- 20dp radius, 6dp vertical 12dp horizontal padding
- 12sp bold white text

**Tab Bar:**
- Frosted blur background
- Selected: gradient icon/text
- Unselected: white 60% opacity

## Assets to Generate

1. **icon.png** - App icon: Abstract cocoa pod with liquid glass effect overlay
2. **splash-icon.png** - Launch screen: Simplified icon on gradient background
3. **empty-marketplace.png** - Empty state for no services available (worker with tablet looking at horizon) - USED: Demandas/Trabalhos screen
4. **empty-history.png** - Empty state for no completed services (checkmark with sparkles) - USED: Histórico screen
5. **avatar-worker.png** - Default worker avatar with vibrant colors - USED: Profile screens
6. **avatar-producer.png** - Default producer avatar with vibrant colors - USED: Profile screens
7. **avatar-generic.png** - Generic user avatar - USED: Profile screens

All illustrations use flat, geometric style with vibrant color palette and subtle gradients.
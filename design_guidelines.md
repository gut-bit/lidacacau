# Design Guidelines - LidaCacau Marketplace Rural

## Brand Identity
**Visual Direction:** Organic Modern - grounded, professional, and clean. Combines the natural earthy tones of Cacao with the vibrant green of growth and potential. The interface is high-contrast, opaque, and legible in bright outdoor sunlight.

**Core Philosophy:** "Invisible Interface". The content (jobs, profiles, maps) is the hero. The UI frames it cleanly without distracting effects like blur or neon.

## Navigation Architecture
**Tab Navigation** (4 tabs):
- **Produtor:** Demandas / Criar (FAB) / Histórico / Perfil
- **Trabalhador:** Trabalhos / Ativo (FAB) / Histórico / Perfil
- **Admin:** Stack-only

## Screen Specifications

### General Layout
- **Background:** Off-White (`#FAFAFA`) to reduce glare but maintain freshness.
- **Cards:** Solid White (`#FFFFFF`) with soft, deep shadows. No borders.
- **Headers:** Clean, solid background or transparent on non-scrolled content.

### Screen Patterns
- **Login/Cadastro:** Clean form on off-white background. Green primary buttons.
- **Demandas (Home):** Cards float on the off-white background. 
- **Modals:** Solid white sheets with rounded top corners. Dimmed backdrop (not blurred).

## Color Palette
- **Primary (Growth):** `#00C853` (Leaf Green) - Used for FABs, Primary Buttons, Active States.
- **Text Primary (Cocoa):** `#3E2723` (Deep Brown) - Replaces black. Softer, organic.
- **Text Secondary:** `#5D4037` (Lighter Brown) - For subtitles and icons.
- **Background:** `#FAFAFA` (Off-White)
- **Surface:** `#FFFFFF` (Pure White)
- **Error:** `#D32F2F` (Red)
- **Warning:** `#FFAB00` (Amber)

## Typography
**Font:** Rubik (Google Fonts)
- **Display:** 32sp, Bold, #3E2723
- **H1:** 24sp, Bold, #3E2723
- **H2:** 20sp, SemiBold, #3E2723
- **Body:** 16sp, Regular, #3E2723
- **Caption:** 14sp, Regular, #5D4037

## Component Specifications

### Buttons
- **Primary:** Pill-shaped (fully rounded). Solid Green (`#00C853`) background. White text.
- **Secondary:** Pill-shaped. White background. Cocoa border (`#3E2723`). Cocoa text.
- **FAB:** Large Green Circle (`#00C853`). White Icon. Shadowed.

### Cards
- **Background:** Solid White (`#FFFFFF`).
- **Shadow:** `shadowColor: "#000"`, `shadowOpacity: 0.05`, `shadowRadius: 10`, `elevation: 3`.
- **Radius:** `16dp`.
- **Padding:** `16dp`.

### Input Fields
- **Background:** `#F5F5F5` (Light Grey).
- **Border:** None (or thin `#E0E0E0`).
- **Text:** `#3E2723`.
- **Radius:** `12dp`.

### Tab Bar
- **Background:** Solid White (`#FFFFFF`).
- **Top Border:** Thin `#E0E0E0`.
- **Active:** Green Icon + Label.
- **Inactive:** Grey/Brown Icon.

## Assets
All icons should be flat, rounded, and use the Primary Green or Text Cocoa colors. Avoid gradients on icons.
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#3E2723", // Deep Cocoa
    textSecondary: "#5D4037", // Lighter Cocoa
    buttonText: "#FFFFFF",
    tabIconDefault: "#A1887F",
    tabIconSelected: "#00C853", // Leaf Green
    link: "#00C853",
    backgroundRoot: "#FAFAFA", // Off-white
    backgroundDefault: "#FAFAFA",
    backgroundSecondary: "#FFFFFF", // Surface
    backgroundTertiary: "#F5F5F5",
    border: "#E0E0E0",
    primary: "#00C853", // Leaf Green
    primaryLight: "#69F0AE",
    secondary: "#3E2723", // Deep Cocoa
    accent: "#FFAB00", // Harvest Gold
    success: "#00C853",
    warning: "#FFAB00",
    error: "#D32F2F",
    card: "#FFFFFF",
    handshake: "#00C853",
  },
  dark: {
    text: "#FAFAFA",
    textSecondary: "#BCAAA4",
    buttonText: "#FFFFFF",
    tabIconDefault: "#BCAAA4",
    tabIconSelected: "#69F0AE",
    link: "#69F0AE",
    backgroundRoot: "#121212",
    backgroundDefault: "#1E1E1E",
    backgroundSecondary: "#2C2C2C",
    backgroundTertiary: "#333333",
    border: "#424242",
    primary: "#00C853",
    primaryLight: "#69F0AE",
    secondary: "#3E2723",
    accent: "#FFD740",
    success: "#69F0AE",
    warning: "#FFD740",
    error: "#EF5350",
    card: "#1E1E1E",
    handshake: "#66BB6A",
  },
};

export const LevelColors = {
  N1: "#6D4C41",
  N2: "#43A047",
  N3: "#1976D2",
  N4: "#7B1FA2",
  N5: "#FBC02D",
};

export const ServiceIcons: Record<string, string> = {
  poda: "scissors",
  enxertia: "activity",
  colheita: "shopping-bag",
  rocagem: "wind",
  aplicacao: "droplet",
  trator: "truck",
  motorista: "navigation",
  pedreiro: "home",
  eletricista: "zap",
  encanador: "droplet",
  serralheiro: "tool",
  pintor: "edit-3",
  carpinteiro: "layers",
  jardineiro: "feather",
  soldador: "settings",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 56,
  buttonHeight: 58,
  touchTarget: 48,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Rubik_700Bold",
  },
  h2: {
    fontSize: 26,
    fontWeight: "600" as const,
    fontFamily: "Rubik_600SemiBold",
  },
  h3: {
    fontSize: 22,
    fontWeight: "600" as const,
    fontFamily: "Rubik_600SemiBold",
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    fontFamily: "Rubik_600SemiBold",
  },
  body: {
    fontSize: 18,
    fontWeight: "400" as const,
    fontFamily: "Rubik_400Regular",
  },
  small: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: "Rubik_400Regular",
  },
  link: {
    fontSize: 18,
    fontWeight: "500" as const,
    fontFamily: "Rubik_500Medium",
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    fontFamily: "Rubik_400Regular",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Rubik_400Regular",
    semibold: "Rubik_600SemiBold",
    bold: "Rubik_700Bold",
  },
  default: {
    sans: "Rubik_400Regular",
    semibold: "Rubik_600SemiBold",
    bold: "Rubik_700Bold",
  },
  web: {
    sans: "'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    semibold: "'Rubik', system-ui, sans-serif",
    bold: "'Rubik', system-ui, sans-serif",
  },
});

export const Shadows = {
  sm: {
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  card: {
    elevation: 2,
  },
  cardHigh: {
    elevation: 4,
  },
  fab: {
    elevation: 6,
  },
  modal: {
    elevation: 8,
  },
};

export const AppConfig = {
  name: "LidaCacau",
  tagline: "Confianca de quem e da Lida",
  region: "Uruara/PA",
};

export const ShopColors = {
  primary: '#5D4037',
  primaryDark: '#3E2723',
  secondary: '#2E7D32',
  accent: '#D4A373',
  cream: '#FDF8F0',
  beige: '#F5F0E8',
  cardBg: '#FFFFFF',
  heroBg: '#4E342E',
  categoryBg: '#3E7B3E',
  categoryText: '#FFFFFF',
  priceOriginal: '#9E9E9E',
  priceDiscount: '#D32F2F',
  priceFinal: '#2E7D32',
  buttonBg: '#5D4037',
  buttonText: '#FFFFFF',
};

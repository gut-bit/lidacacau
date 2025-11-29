import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#3E2723",
    textSecondary: "#6D4C41",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6D4C41",
    tabIconSelected: "#4E342E",
    link: "#2E7D32",
    backgroundRoot: "#FAFAFA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F5F5F5",
    backgroundTertiary: "#EEEEEE",
    border: "#D7CCC8",
    primary: "#4E342E",
    primaryLight: "#6D4C41",
    secondary: "#2E7D32",
    accent: "#FBC02D",
    success: "#43A047",
    warning: "#FBC02D",
    error: "#D32F2F",
    card: "#FFFFFF",
    handshake: "#43A047",
  },
  dark: {
    text: "#EFEBE9",
    textSecondary: "#BCAAA4",
    buttonText: "#FFFFFF",
    tabIconDefault: "#BCAAA4",
    tabIconSelected: "#8D6E63",
    link: "#81C784",
    backgroundRoot: "#1F2123",
    backgroundDefault: "#2A2C2E",
    backgroundSecondary: "#353739",
    backgroundTertiary: "#404244",
    border: "#5D4037",
    primary: "#6D4C41",
    primaryLight: "#8D6E63",
    secondary: "#43A047",
    accent: "#FBC02D",
    success: "#43A047",
    warning: "#FBC02D",
    error: "#EF5350",
    card: "#2A2C2E",
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

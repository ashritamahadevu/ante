export const colors = {
  bg: "#09090B",
  surface: "#131316",
  raised: "#1B1B20",
  line: "#26262C",
  lineStrong: "#34343C",
  text: "#F5F5F4",
  muted: "#9A9AA3",
  faint: "#62626B",
  accent: "#C6FF3D",
  accentInk: "#0B0F00",
  accentSoft: "rgba(198, 255, 61, 0.12)",
  win: "#4ADE80",
  winSoft: "rgba(74, 222, 128, 0.12)",
  loss: "#FF6B57",
  lossSoft: "rgba(255, 107, 87, 0.12)",
  warn: "#FBBF24",
  warnSoft: "rgba(251, 191, 36, 0.12)",
  info: "#7DD3FC",
  infoSoft: "rgba(125, 211, 252, 0.12)",
};

export const fonts = {
  display: "SpaceGrotesk_700Bold",
  displayMedium: "SpaceGrotesk_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

const avatarPalette = ["#C6FF3D", "#7DD3FC", "#F9A8D4", "#FBBF24", "#A78BFA", "#4ADE80", "#FB923C", "#5EEAD4"];

export function avatarColor(seed = "") {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return avatarPalette[hash % avatarPalette.length];
}

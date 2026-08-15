export interface ColorTheme {
  name: string;
  badgeBg: string;
  badgeText: string;
  cardBgLight: string;
  cardBgDark: string;
  cardBorderLight: string;
  cardBorderDark: string;
  accentBar: string;
  titleLight: string;
  titleDark: string;
  subTextLight: string;
  subTextDark: string;
  tagBgLight: string;
  tagBgDark: string;
  tagTextLight: string;
  tagTextDark: string;
}

export const COURSE_PALETTES: ColorTheme[] = [
  {
    name: "Blue",
    badgeBg: "bg-[#1e66f5] dark:bg-[#7aa2f7]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#1e66f5]/10 hover:bg-[#1e66f5]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#1e66f5]/35",
    cardBorderDark: "border-[#7aa2f7]/50",
    accentBar: "bg-[#1e66f5] dark:bg-[#7aa2f7]",
    titleLight: "text-[#1e66f5]",
    titleDark: "text-[#7aa2f7]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#1e66f5]/15",
    tagBgDark: "bg-[#7aa2f7]/25",
    tagTextLight: "text-[#1e66f5]",
    tagTextDark: "text-[#7aa2f7]",
  },
  {
    name: "Teal",
    badgeBg: "bg-[#179299] dark:bg-[#73daca]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#179299]/10 hover:bg-[#179299]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#179299]/35",
    cardBorderDark: "border-[#73daca]/50",
    accentBar: "bg-[#179299] dark:bg-[#73daca]",
    titleLight: "text-[#179299]",
    titleDark: "text-[#73daca]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#179299]/15",
    tagBgDark: "bg-[#73daca]/25",
    tagTextLight: "text-[#179299]",
    tagTextDark: "text-[#73daca]",
  },
  {
    name: "Mauve",
    badgeBg: "bg-[#8839ef] dark:bg-[#bb9af7]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#8839ef]/10 hover:bg-[#8839ef]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#8839ef]/35",
    cardBorderDark: "border-[#bb9af7]/50",
    accentBar: "bg-[#8839ef] dark:bg-[#bb9af7]",
    titleLight: "text-[#8839ef]",
    titleDark: "text-[#bb9af7]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#8839ef]/15",
    tagBgDark: "bg-[#bb9af7]/25",
    tagTextLight: "text-[#8839ef]",
    tagTextDark: "text-[#bb9af7]",
  },
  {
    name: "Sky",
    badgeBg: "bg-[#04a5e5] dark:bg-[#7dcfff]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#04a5e5]/10 hover:bg-[#04a5e5]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#04a5e5]/35",
    cardBorderDark: "border-[#7dcfff]/50",
    accentBar: "bg-[#04a5e5] dark:bg-[#7dcfff]",
    titleLight: "text-[#04a5e5]",
    titleDark: "text-[#7dcfff]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#04a5e5]/15",
    tagBgDark: "bg-[#7dcfff]/25",
    tagTextLight: "text-[#04a5e5]",
    tagTextDark: "text-[#7dcfff]",
  },
  {
    name: "Green",
    badgeBg: "bg-[#40a02b] dark:bg-[#9ece6a]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#40a02b]/10 hover:bg-[#40a02b]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#40a02b]/35",
    cardBorderDark: "border-[#9ece6a]/50",
    accentBar: "bg-[#40a02b] dark:bg-[#9ece6a]",
    titleLight: "text-[#40a02b]",
    titleDark: "text-[#9ece6a]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#40a02b]/15",
    tagBgDark: "bg-[#9ece6a]/25",
    tagTextLight: "text-[#40a02b]",
    tagTextDark: "text-[#9ece6a]",
  },
  {
    name: "Peach",
    badgeBg: "bg-[#fe640b] dark:bg-[#ff9e64]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#fe640b]/10 hover:bg-[#fe640b]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#fe640b]/35",
    cardBorderDark: "border-[#ff9e64]/50",
    accentBar: "bg-[#fe640b] dark:bg-[#ff9e64]",
    titleLight: "text-[#fe640b]",
    titleDark: "text-[#ff9e64]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#fe640b]/15",
    tagBgDark: "bg-[#ff9e64]/25",
    tagTextLight: "text-[#fe640b]",
    tagTextDark: "text-[#ff9e64]",
  },
  {
    name: "Yellow",
    badgeBg: "bg-[#df8e1d] dark:bg-[#e0af68]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#df8e1d]/10 hover:bg-[#df8e1d]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#df8e1d]/35",
    cardBorderDark: "border-[#e0af68]/50",
    accentBar: "bg-[#df8e1d] dark:bg-[#e0af68]",
    titleLight: "text-[#df8e1d]",
    titleDark: "text-[#e0af68]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#df8e1d]/15",
    tagBgDark: "bg-[#e0af68]/25",
    tagTextLight: "text-[#df8e1d]",
    tagTextDark: "text-[#e0af68]",
  },
  {
    name: "Red",
    badgeBg: "bg-[#d20f39] dark:bg-[#f7768e]",
    badgeText: "text-white dark:text-[#1a1b26]",
    cardBgLight: "bg-[#d20f39]/10 hover:bg-[#d20f39]/15",
    cardBgDark: "bg-[#1f2335] hover:bg-[#24283b]",
    cardBorderLight: "border-[#d20f39]/35",
    cardBorderDark: "border-[#f7768e]/50",
    accentBar: "bg-[#d20f39] dark:bg-[#f7768e]",
    titleLight: "text-[#d20f39]",
    titleDark: "text-[#f7768e]",
    subTextLight: "text-[#4c4f69]",
    subTextDark: "text-[#c0caf5]",
    tagBgLight: "bg-[#d20f39]/15",
    tagBgDark: "bg-[#f7768e]/25",
    tagTextLight: "text-[#d20f39]",
    tagTextDark: "text-[#f7768e]",
  },
];

export function getCoursePalette(
  courseCode: string,
  colorIndexMap: Record<string, number>
): ColorTheme {
  const base = courseCode.replace(/\.[12]$/, "").trim();
  const idx = colorIndexMap[base] ?? 0;
  return COURSE_PALETTES[idx % COURSE_PALETTES.length];
}

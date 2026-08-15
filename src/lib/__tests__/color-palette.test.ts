// src/lib/__tests__/color-palette.test.ts
import { describe, it, expect } from 'vitest';
import { COURSE_PALETTES, getCoursePalette, ColorTheme } from '../color-palette';

describe('COURSE_PALETTES', () => {
  it('has 8 color themes', () => {
    expect(COURSE_PALETTES).toHaveLength(8);
  });

  it('each palette has all required properties', () => {
    const requiredKeys: (keyof ColorTheme)[] = [
      'name', 'badgeBg', 'badgeText', 'cardBgLight', 'cardBgDark',
      'cardBorderLight', 'cardBorderDark', 'accentBar', 'titleLight',
      'titleDark', 'subTextLight', 'subTextDark', 'tagBgLight',
      'tagBgDark', 'tagTextLight', 'tagTextDark',
    ];
    for (const palette of COURSE_PALETTES) {
      for (const key of requiredKeys) {
        expect(palette[key], `${palette.name} missing ${key}`).toBeDefined();
      }
    }
  });

  it('palette names are unique', () => {
    const names = COURSE_PALETTES.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('getCoursePalette', () => {
  it('returns palette at mapped index', () => {
    expect(getCoursePalette('CE118', { 'CE118': 2 })).toBe(COURSE_PALETTES[2]);
  });

  it('strips .1 suffix before lookup', () => {
    expect(getCoursePalette('CE118.1', { 'CE118': 3 })).toBe(COURSE_PALETTES[3]);
  });

  it('strips .2 suffix before lookup', () => {
    expect(getCoursePalette('CE118.2', { 'CE118': 5 })).toBe(COURSE_PALETTES[5]);
  });

  it('does NOT strip .3 suffix', () => {
    expect(getCoursePalette('CE118.3', { 'CE118.3': 4 })).toBe(COURSE_PALETTES[4]);
  });

  it('defaults to index 0 when course not in map', () => {
    expect(getCoursePalette('UNKNOWN', {})).toBe(COURSE_PALETTES[0]);
  });

  it('wraps around with modulo when index > palette count', () => {
    // 10 % 8 = 2
    expect(getCoursePalette('CE118', { 'CE118': 10 })).toBe(COURSE_PALETTES[2]);
    // 16 % 8 = 0
    expect(getCoursePalette('CE118', { 'CE118': 16 })).toBe(COURSE_PALETTES[0]);
  });
});

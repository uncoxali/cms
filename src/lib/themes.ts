export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: {
      default: string;
      paper: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    divider: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  effects?: {
    borderRadius?: number;
    boxShadow?: string;
    gradient?: string;
  };
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  // Dark Themes
  'midnight': {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep dark theme with purple accents',
    mode: 'dark',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      background: { default: '#0F0F14', paper: '#1A1A24' },
      text: { primary: '#F8FAFC', secondary: '#94A3B8' },
      divider: 'rgba(139, 92, 246, 0.12)',
      success: '#4ADE80',
      error: '#F87171',
      warning: '#FACC15',
      info: '#60A5FA',
    },
  },
  'ocean': {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm blue dark theme',
    mode: 'dark',
    colors: {
      primary: '#3B82F6',
      secondary: '#06B6D4',
      background: { default: '#0C1929', paper: '#132337' },
      text: { primary: '#F1F5F9', secondary: '#94A3B8' },
      divider: 'rgba(59, 130, 246, 0.12)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#38BDF8',
    },
  },
  'forest': {
    id: 'forest',
    name: 'Forest',
    description: 'Nature-inspired dark theme',
    mode: 'dark',
    colors: {
      primary: '#10B981',
      secondary: '#84CC16',
      background: { default: '#0C1A12', paper: '#142820' },
      text: { primary: '#F0FDF4', secondary: '#86EFAC' },
      divider: 'rgba(16, 185, 129, 0.12)',
      success: '#4ADE80',
      error: '#F87171',
      warning: '#FACC15',
      info: '#60A5FA',
    },
  },
  'sunset': {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange dark theme',
    mode: 'dark',
    colors: {
      primary: '#F97316',
      secondary: '#FB923C',
      background: { default: '#1C1409', paper: '#2A1F0E' },
      text: { primary: '#FFF7ED', secondary: '#FDBA74' },
      divider: 'rgba(249, 115, 22, 0.12)',
      success: '#4ADE80',
      error: '#EF4444',
      warning: '#FBBF24',
      info: '#38BDF8',
    },
  },
  'rose': {
    id: 'rose',
    name: 'Rose',
    description: 'Elegant pink dark theme',
    mode: 'dark',
    colors: {
      primary: '#EC4899',
      secondary: '#F472B6',
      background: { default: '#1A0A12', paper: '#251218' },
      text: { primary: '#FDF2F8', secondary: '#F9A8D4' },
      divider: 'rgba(236, 72, 153, 0.12)',
      success: '#4ADE80',
      error: '#F87171',
      warning: '#FACC15',
      info: '#60A5FA',
    },
  },
  'nordic': {
    id: 'nordic',
    name: 'Nordic',
    description: 'Clean Scandinavian dark theme',
    mode: 'dark',
    colors: {
      primary: '#5E81AC',
      secondary: '#88C0D0',
      background: { default: '#1E1E2E', paper: '#2A2A3E' },
      text: { primary: '#ECEFF4', secondary: '#D8DEE9' },
      divider: 'rgba(94, 129, 172, 0.15)',
      success: '#A3BE8C',
      error: '#BF616A',
      warning: '#EBCB8B',
      info: '#88C0D0',
    },
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai',
    description: 'Classic Monokai Pro dark theme',
    mode: 'dark',
    colors: {
      primary: '#FFD139',
      secondary: '#FF6188',
      background: { default: '#1E1F1C', paper: '#282B30' },
      text: { primary: '#FCFCFA', secondary: '#C1C0BE' },
      divider: 'rgba(255, 209, 57, 0.12)',
      success: '#A9DC76',
      error: '#FF6188',
      warning: '#FFD139',
      info: '#78DCE8',
    },
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    description: 'Popular Dracula dark theme',
    mode: 'dark',
    colors: {
      primary: '#BD93F9',
      secondary: '#FF79C6',
      background: { default: '#282A36', paper: '#383A59' },
      text: { primary: '#F8F8F2', secondary: '#6272A4' },
      divider: 'rgba(189, 147, 249, 0.15)',
      success: '#50FA7B',
      error: '#FF5555',
      warning: '#F1FA8C',
      info: '#8BE9FD',
    },
  },

  // Light Themes
  'sakura': {
    id: 'sakura',
    name: 'Sakura',
    description: 'Clean light theme',
    mode: 'light',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      background: { default: '#FAFAFA', paper: '#FFFFFF' },
      text: { primary: '#1F2937', secondary: '#6B7280' },
      divider: 'rgba(139, 92, 246, 0.08)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  },
  'arctic': {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool blue light theme',
    mode: 'light',
    colors: {
      primary: '#3B82F6',
      secondary: '#06B6D4',
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#1E293B', secondary: '#64748B' },
      divider: 'rgba(59, 130, 246, 0.08)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#EAB308',
      info: '#0EA5E9',
    },
  },
  'mint': {
    id: 'mint',
    name: 'Mint',
    description: 'Fresh green light theme',
    mode: 'light',
    colors: {
      primary: '#10B981',
      secondary: '#14B8A6',
      background: { default: '#F0FDF4', paper: '#FFFFFF' },
      text: { primary: '#14532D', secondary: '#4ADE80' },
      divider: 'rgba(16, 185, 129, 0.08)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#EAB308',
      info: '#06B6D4',
    },
  },
  'peach': {
    id: 'peach',
    name: 'Peach',
    description: 'Warm peach light theme',
    mode: 'light',
    colors: {
      primary: '#F97316',
      secondary: '#FB923C',
      background: { default: '#FFFBF7', paper: '#FFFFFF' },
      text: { primary: '#431407', secondary: '#9A3412' },
      divider: 'rgba(249, 115, 22, 0.08)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#EAB308',
      info: '#0EA5E9',
    },
  },
  'lavender': {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft purple light theme',
    mode: 'light',
    colors: {
      primary: '#A78BFA',
      secondary: '#C4B5FD',
      background: { default: '#FAF5FF', paper: '#FFFFFF' },
      text: { primary: '#3B0764', secondary: '#7C3AED' },
      divider: 'rgba(167, 139, 250, 0.08)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#EAB308',
      info: '#0EA5E9',
    },
  },
  'nord': {
    id: 'nord',
    name: 'Nord',
    description: 'Arctic north-inspired light theme',
    mode: 'light',
    colors: {
      primary: '#5E81AC',
      secondary: '#88C0D0',
      background: { default: '#ECEFF4', paper: '#E5E9F0' },
      text: { primary: '#2E3440', secondary: '#4C566A' },
      divider: 'rgba(94, 129, 172, 0.12)',
      success: '#A3BE8C',
      error: '#BF616A',
      warning: '#EBCB8B',
      info: '#88C0D0',
    },
  },
};

export const THEME_LIST = Object.values(THEME_PRESETS);

export const DARK_THEMES = THEME_LIST.filter(t => t.mode === 'dark');
export const LIGHT_THEMES = THEME_LIST.filter(t => t.mode === 'light');

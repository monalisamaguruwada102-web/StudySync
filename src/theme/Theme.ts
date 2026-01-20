export const LightColors = {
    primary: '#2563eb',
    primaryLight: '#eff6ff',
    secondary: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    text: '#0f172a',
    textLight: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    white: '#ffffff',
    black: '#000000',
    glass: 'rgba(255, 255, 255, 0.7)',
};

export const DarkColors = {
    primary: '#3b82f6',
    primaryLight: '#1e3a8a',
    secondary: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    text: '#f8fafc',
    textLight: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    white: '#ffffff',
    black: '#000000',
    glass: 'rgba(30, 41, 59, 0.7)',
};

export const Spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const Typography = {
    h1: {
        fontSize: 24,
        fontWeight: '800' as const,
    },
    h2: {
        fontSize: 20,
        fontWeight: '700' as const,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 14,
        fontWeight: '500' as const,
    },
};

export const Shadows = {
    soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    strong: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    }
};

// Legacy support
export const Colors = LightColors;

export const Theme = {
    Light: {
        Colors: LightColors,
        Shadows,
    },
    Dark: {
        Colors: DarkColors,
        Shadows: {
            ...Shadows,
            soft: { ...Shadows.soft, shadowOpacity: 0.2 },
            medium: { ...Shadows.medium, shadowOpacity: 0.3 },
            strong: { ...Shadows.strong, shadowOpacity: 0.4 },
        },
    },
    Spacing,
    Typography,
    borderRadius: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    }
};

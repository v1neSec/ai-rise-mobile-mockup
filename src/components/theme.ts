export const colors = {
  background: '#F6F9FD',
  surface: '#FFFFFF',
  text: '#17243B',
  muted: '#566680',
  border: '#DCE4EE',
  fill: '#EBF2F6',
  blue: '#2F70C7',
  teal: '#0A857B',
  danger: '#D92D20',
  sos: '#D92D20',
  green: '#0A7D52',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };

export const appGradient = ['#D7E8FB', '#EAF3FC', '#F6F9FD'] as const;
export const softCard = {
  backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 0,
  shadowColor: '#263F55', shadowOpacity: 0.035, shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 }, elevation: 1,
} as const;

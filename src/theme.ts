// Design tokens. Keep every colour, size and spacing value here.
export const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1F6',
  text: '#101828',
  muted: '#4F5F75',
  placeholder: '#7A8799',
  border: '#D5DDE8',
  borderStrong: '#B3BFCE',
  blue: '#1F5FCC', // resident accent, selection
  blueSoft: '#E8F0FD',
  teal: '#067F76', // volunteer accent
  danger: '#C62828', // emergency actions and errors only
  dangerPressed: '#A31F1F',
  dangerSoft: '#FDECEC',
  success: '#0F7B4F',
  successSoft: '#E4F4EC',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;
export const MIN_TOUCH = 48;
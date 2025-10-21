export type Palette = {
  name: string;
  primary: string;
  primaryHover: string;
  foreground: string;
  accent: string;
  ticker: [string, string, string, string];
};

export const PALETTES: Palette[] = [
  {
    name: 'aurora',
    primary: '#4a44ff',
    primaryHover: '#342ee0',
    foreground: '#050505',
    accent: '#a7afff',
    ticker: ['rgba(234,216,255,0.92)', 'rgba(188,219,255,0.93)', 'rgba(206,255,233,0.92)', 'rgba(227,255,245,0.93)'],
  },
  {
    name: 'sherbet',
    primary: '#ff4f7a',
    primaryHover: '#e04265',
    foreground: '#040404',
    accent: '#ffc9b8',
    ticker: ['rgba(255,196,208,0.92)', 'rgba(255,214,170,0.93)', 'rgba(255,170,225,0.92)', 'rgba(255,198,174,0.92)'],
  },
  {
    name: 'lagoon',
    primary: '#0da3c8',
    primaryHover: '#0887a7',
    foreground: '#041416',
    accent: '#81e6ff',
    ticker: ['rgba(193,244,255,0.92)', 'rgba(165,219,255,0.94)', 'rgba(198,255,228,0.92)', 'rgba(210,242,255,0.93)'],
  },
  {
    name: 'orchid',
    primary: '#8c52ff',
    primaryHover: '#6a3ad7',
    foreground: '#080413',
    accent: '#dccaff',
    ticker: ['rgba(227,205,255,0.93)', 'rgba(208,184,255,0.94)', 'rgba(255,215,244,0.92)', 'rgba(220,209,255,0.92)'],
  },
  {
    name: 'sunrise',
    primary: '#ff7a36',
    primaryHover: '#e76a2d',
    foreground: '#100704',
    accent: '#ffd9ba',
    ticker: ['rgba(255,210,174,0.93)', 'rgba(255,188,196,0.94)', 'rgba(255,225,174,0.92)', 'rgba(255,203,191,0.92)'],
  },
  {
    name: 'twilight',
    primary: '#503a9b',
    primaryHover: '#3d2c76',
    foreground: '#090613',
    accent: '#a99fff',
    ticker: ['rgba(211,205,255,0.93)', 'rgba(173,195,255,0.94)', 'rgba(236,205,255,0.92)', 'rgba(210,210,255,0.93)'],
  },
  {
    name: 'mint',
    primary: '#28a676',
    primaryHover: '#1d7d58',
    foreground: '#01100b',
    accent: '#95edc9',
    ticker: ['rgba(190,255,220,0.93)', 'rgba(165,240,233,0.94)', 'rgba(219,226,255,0.92)', 'rgba(205,255,233,0.92)'],
  },
  {
    name: 'berry',
    primary: '#b230ff',
    primaryHover: '#8d25c8',
    foreground: '#140419',
    accent: '#ffb9ff',
    ticker: ['rgba(240,200,255,0.93)', 'rgba(255,201,230,0.94)', 'rgba(215,210,255,0.92)', 'rgba(238,210,255,0.93)'],
  },
  {
    name: 'citrus',
    primary: '#ffb400',
    primaryHover: '#ef9b00',
    foreground: '#120a00',
    accent: '#ffe39c',
    ticker: ['rgba(255,226,153,0.93)', 'rgba(255,192,168,0.94)', 'rgba(255,244,201,0.93)', 'rgba(255,215,162,0.93)'],
  },
  {
    name: 'glacier',
    primary: '#2b6cff',
    primaryHover: '#1f55d4',
    foreground: '#020b1b',
    accent: '#a6c9ff',
    ticker: ['rgba(196,217,255,0.93)', 'rgba(178,238,255,0.94)', 'rgba(210,234,255,0.92)', 'rgba(188,214,255,0.93)'],
  },
];

// Tailwind only ships classes it can see as literal strings, so every
// colour key coming from the API maps to complete class names here.

export const LABEL_COLORS = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-violet-500',
  blue: 'bg-blue-500',
  sky: 'bg-cyan-400',
  lime: 'bg-lime-500',
  pink: 'bg-pink-500',
  black: 'bg-slate-700',
};

export const LABEL_COLOR_KEYS = Object.keys(LABEL_COLORS);

export const BOARD_BACKGROUNDS = {
  ocean: 'bg-linear-to-b from-blue-600 via-cyan-400 to-pink-300',
  sunset: 'bg-linear-to-br from-orange-500 via-pink-500 to-rose-500',
  forest: 'bg-linear-to-br from-emerald-700 via-emerald-500 to-teal-400',
  grape: 'bg-linear-to-br from-violet-700 via-purple-500 to-fuchsia-500',
  candy: 'bg-linear-to-br from-pink-400 via-fuchsia-400 to-sky-400',
  midnight: 'bg-linear-to-br from-slate-900 via-indigo-900 to-slate-800',
  peach: 'bg-linear-to-br from-amber-300 via-orange-300 to-rose-300',
  slate: 'bg-linear-to-br from-slate-500 to-slate-700',
};

export const BOARD_BACKGROUND_KEYS = Object.keys(BOARD_BACKGROUNDS);

export const AVATAR_COLORS = {
  amber: 'bg-amber-400 text-amber-950',
  blue: 'bg-blue-500 text-white',
  pink: 'bg-pink-400 text-pink-950',
  teal: 'bg-teal-500 text-white',
  violet: 'bg-violet-500 text-white',
};

export const labelClass = (color) => LABEL_COLORS[color] ?? LABEL_COLORS.black;
export const backgroundClass = (bg) => BOARD_BACKGROUNDS[bg] ?? BOARD_BACKGROUNDS.ocean;
export const avatarClass = (color) => AVATAR_COLORS[color] ?? 'bg-slate-500 text-white';

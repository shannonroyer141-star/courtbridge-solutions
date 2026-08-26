// Shared seasonal calendar theming -- used by both the provider Calendar screen
// and the client-facing Calendar tab so the two stay visually in sync.

// `accent` is the light/pastel color already live on the dark-navy calendar --
// left untouched so that look doesn't shift underneath it. `classicPrimary` /
// `classicSecondary` are bolder, more saturated colors for the alternate
// "classic printable calendar" look (paper background, banded weekday header
// like a paper calendar template alternates weekend vs weekday colors) --
// a separate palette because pastel-on-dark-navy and bold-on-cream-paper need
// different levels of saturation to read well.
// specialDay marks a real, fixed-date U.S. holiday for that month (Thanksgiving
// is computed, not hardcoded, since its date moves every year); months with no
// well-known fixed holiday just get the color+icon.
export const MONTH_THEMES = [
  { name: 'January', accent: '#7FB3E8', classicPrimary: '#4A7FB5', classicSecondary: '#8FB3D9', icon: '❄️' },
  { name: 'February', accent: '#E88FAE', classicPrimary: '#C9607E', classicSecondary: '#E8A9BC', icon: '💗', specialDay: 14 },
  { name: 'March', accent: '#5FAE6B', classicPrimary: '#3D8B4C', classicSecondary: '#E08A2E', icon: '🍀', specialDay: 17 },
  { name: 'April', accent: '#7EC8E3', classicPrimary: '#4A9FB0', classicSecondary: '#8FCBD6', icon: '🌧️' },
  { name: 'May', accent: '#C99FE0', classicPrimary: '#9B6FB5', classicSecondary: '#D6B3E8', icon: '🌸' },
  { name: 'June', accent: '#F2C572', classicPrimary: '#D9A02E', classicSecondary: '#F2D18A', icon: '☀️' },
  { name: 'July', accent: '#E86A5D', classicPrimary: '#C0392B', classicSecondary: '#5B7DB1', icon: '🎆', specialDay: 4 },
  { name: 'August', accent: '#F2A65A', classicPrimary: '#D97D2E', classicSecondary: '#F2C572', icon: '🌻', image: '/calendar-icons/august.jpg' },
  { name: 'September', accent: '#C98A4B', classicPrimary: '#A0672E', classicSecondary: '#D9A65C', icon: '🍂' },
  { name: 'October', accent: '#E08A3C', classicPrimary: '#C0631E', classicSecondary: '#4A3B5C', icon: '🎃', specialDay: 31 },
  { name: 'November', accent: '#B5793D', classicPrimary: '#8B5A2B', classicSecondary: '#C0631E', icon: '🦃' },
  { name: 'December', accent: '#6FA88F', classicPrimary: '#3D6B4F', classicSecondary: '#B03A3A', icon: '🎄', specialDay: 25 },
];

// Nth occurrence of a weekday in a month (e.g. 4th Thursday) -- used for
// Thanksgiving, whose date is defined by rule (US federal statute), not fixed.
export function nthWeekdayOfMonth(year, month, weekday, n) {
  const d = new Date(year, month, 1);
  let count = 0;
  while (d.getMonth() === month) {
    if (d.getDay() === weekday) {
      count++;
      if (count === n) return d.getDate();
    }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

export function specialDayFor(year, month) {
  const theme = MONTH_THEMES[month];
  if (theme.name === 'November') return nthWeekdayOfMonth(year, month, 4, 4);
  return theme.specialDay || null;
}

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

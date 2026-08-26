// Shared seasonal calendar theming -- used by both the provider Calendar screen
// and the client-facing Calendar tab so the two stay visually in sync.

// One quiet accent color + icon per month. specialDay marks a real, fixed-date
// U.S. holiday for that month (Thanksgiving is computed, not hardcoded, since its
// date moves every year); months with no well-known fixed holiday just get the color+icon.
export const MONTH_THEMES = [
  { name: 'January', accent: '#7FB3E8', icon: '❄️' },
  { name: 'February', accent: '#E88FAE', icon: '💗', specialDay: 14 },
  { name: 'March', accent: '#5FAE6B', icon: '🍀', specialDay: 17 },
  { name: 'April', accent: '#7EC8E3', icon: '🌧️' },
  { name: 'May', accent: '#C99FE0', icon: '🌸' },
  { name: 'June', accent: '#F2C572', icon: '☀️' },
  { name: 'July', accent: '#E86A5D', icon: '🎆', specialDay: 4 },
  { name: 'August', accent: '#F2A65A', icon: '🌻' },
  { name: 'September', accent: '#C98A4B', icon: '🍂' },
  { name: 'October', accent: '#E08A3C', icon: '🎃', specialDay: 31 },
  { name: 'November', accent: '#B5793D', icon: '🦃' },
  { name: 'December', accent: '#6FA88F', icon: '🎄', specialDay: 25 },
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

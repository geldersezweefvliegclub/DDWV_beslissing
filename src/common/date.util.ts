const DUTCH_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function tomorrow(base = new Date()): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  return next;
}

export function toDutchDisplay(date: Date): string {
  const dayName = DUTCH_DAYS[date.getDay()];
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${dayName} ${day}-${month}-${year}`;
}

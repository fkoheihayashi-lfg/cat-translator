export type HourBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export function getHourBucket(date = new Date()): HourBucket {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 21) return 'evening';
  return 'night';
}

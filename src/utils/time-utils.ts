/**
 * Time utilities for formatting and calculations
 *
 * @author Pedro Fuentes <git@pedrofuent.es>
 * @copyright Pedro Pablo Fuentes Schuster
 * @license MIT
 */

/**
 * Convert seconds to human-readable time format
 *
 * Durations of a day or more render as days (+ hours), because a bare hour
 * count past ~24 is unreadable on a key: "36h" says far less than "1d 12h".
 *
 * @param timeInSeconds - Time in seconds (can be negative)
 * @returns Formatted time string (e.g., "1d 12h", "2h 30m", "45m 20s", "15s")
 */
export function sec2time(timeInSeconds: number): string {
  let sign = '';
  if (timeInSeconds < 0) {
    timeInSeconds = Math.abs(timeInSeconds);
    sign = '- ';
  }

  const time = Math.floor(timeInSeconds);
  const days = Math.floor(time / 86400);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${sign}${days}d ${remainingHours}h` : `${sign}${days}d`;
  }
  if (hours > 1) return `${sign}${hours}h`;
  if (hours > 0 && minutes === 0) return `${sign}${hours}h`;
  if (hours > 0) return `${sign}${hours}h ${minutes}m`;
  if (minutes > 0) return `${sign}${minutes}m ${seconds}s`;

  return `${sign}${seconds}s`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format when a meeting starts, in the viewer's local time.
 *
 * A countdown answers "how long", which is useless once it exceeds a few
 * hours; this answers "when", which is what a glance at the key is for.
 * Qualified by day only as far as needed to stay unambiguous.
 *
 * @param start - Meeting start instant
 * @param now - Reference instant, defaults to the current time
 * @returns e.g. `18:30`, `Tmrw 18:30`, `Mon 18:30`, `15 Dec 18:30`
 */
export function formatMeetingWhen(start: Date, now: Date = new Date()): string {
  const hh = String(start.getHours()).padStart(2, '0');
  const mm = String(start.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;

  // Compare calendar days, not elapsed hours: a meeting at 09:00 tomorrow is
  // "Tmrw" whether it is 20 or 2 hours away.
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round((startDay.getTime() - today.getTime()) / 86400000);

  if (dayDiff <= 0) return time;
  if (dayDiff === 1) return `Tmrw ${time}`;
  if (dayDiff < 7) return `${WEEKDAYS[start.getDay()]} ${time}`;

  return `${start.getDate()} ${MONTHS[start.getMonth()]} ${time}`;
}

/**
 * Calculate difference in seconds between a date and now
 * @param date - Target date
 * @returns Difference in seconds (negative if in past)
 */
export function secondsUntil(date: Date): number {
  const now = Date.now();
  const target = date.getTime();
  return Math.floor((target - now) / 1000);
}

/**
 * Calculate difference in seconds between now and a date (opposite of secondsUntil)
 * @param date - Target date
 * @returns Difference in seconds (positive if date is in past)
 */
export function secondsSince(date: Date): number {
  const now = Date.now();
  const target = date.getTime();
  return Math.floor((now - target) / 1000);
}

/**
 * Check if a time is within a certain number of hours from now
 * @param date - Date to check
 * @param hours - Number of hours for the window
 * @returns True if date is within the time window
 */
export function isWithinHours(date: Date, hours: number): boolean {
  const now = Date.now();
  const spread = (hours * 60 * 60 * 1000) / 2;
  const event = date.getTime();
  const bottomRange = now - spread;
  const topRange = now + spread;

  return event >= bottomRange && event <= topRange;
}

/**
 * Backward reach of the calendar window, independent of the user's look-ahead
 * setting. Enough to keep meetings that are already in progress (and recently
 * started multi-day entries) visible to the Time Left action.
 */
export const PAST_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Build the calendar fetch window for a "Look ahead: N Days" setting.
 *
 * The setting is a FORWARD promise: N days must mean N days ahead. An earlier
 * implementation centred the window on now (±N/2 days), so "3 Days" reached
 * only 36 hours ahead and silently hid meetings just beyond that.
 *
 * @param timeWindowDays - Look-ahead setting, in days
 * @param now - Reference instant, defaults to the current time
 */
export function calculateTimeWindow(
  timeWindowDays: number,
  now: Date = new Date()
): { startWindow: Date; endWindow: Date } {
  return {
    startWindow: new Date(now.getTime() - PAST_WINDOW_MS),
    endWindow: new Date(now.getTime() + timeWindowDays * 24 * 60 * 60 * 1000)
  };
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

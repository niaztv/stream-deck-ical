/**
 * Event utilities for filtering and sorting
 *
 * @author Pedro Fuentes <git@pedrofuent.es>
 * @copyright Pedro Pablo Fuentes Schuster
 * @license MIT
 */

import { CalendarEvent } from '../types/index.js';
import { formatMeetingWhen } from './time-utils.js';

/**
 * Check if an event is currently active (happening now)
 * @param event - Calendar event to check
 * @returns True if event is active
 */
export function isActiveEvent(event: CalendarEvent): boolean {
  const now = Date.now();
  return event.start.getTime() <= now && event.end.getTime() >= now;
}

/**
 * Check if an event is upcoming (in the future)
 * @param event - Calendar event to check
 * @returns True if event is upcoming
 */
export function isUpcomingEvent(event: CalendarEvent): boolean {
  const now = Date.now();
  return event.start.getTime() > now;
}

/**
 * Check if an event is in the past
 * @param event - Calendar event to check
 * @returns True if event is in the past
 */
export function isPastEvent(event: CalendarEvent): boolean {
  const now = Date.now();
  return event.end.getTime() < now;
}

/**
 * Find all active events from a list
 * @param events - Array of calendar events
 * @returns Array of active events
 */
export function findActiveEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(isActiveEvent);
}

/**
 * Find the next upcoming event from a list
 * @param events - Array of calendar events (should be sorted)
 * @returns Next upcoming event or undefined
 */
export function findNextEvent(events: CalendarEvent[]): CalendarEvent | undefined {
  return events.filter(isUpcomingEvent)[0];
}

/**
 * Sort events by start time (ascending)
 * @param events - Array of calendar events to sort
 * @returns Sorted array of events
 */
export function sortEventsByStartTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Filter events within a time window (centered on now)
 * @param events - Array of calendar events
 * @param hours - Total hours for the window (split before/after now)
 * @returns Filtered array of events
 */
export function filterEventsInWindow(events: CalendarEvent[], hours: number): CalendarEvent[] {
  const now = Date.now();
  const spread = (hours * 60 * 60 * 1000) / 2;
  const bottomRange = now - spread;
  const topRange = now + spread;

  return events.filter(event => {
    const eventTime = event.start.getTime();
    return eventTime >= bottomRange && eventTime <= topRange;
  });
}

/**
 * Truncate text for marquee display
 * @param text - Text to truncate
 * @param width - Maximum width per line
 * @param start - Start position
 * @param lines - Number of lines
 * @returns Object with truncated text and next start position
 */
export function trimForMarquee(
  text: string,
  width: number,
  start = 0,
  lines = 1
): { text: string; nextStart: number } {
  let segment = text.slice(start, start + width);

  if (lines > 1) {
    let lineStart = start + width;
    for (let i = 1; i < lines; i++) {
      segment = segment.concat('\n', text.slice(lineStart, lineStart + width));
      lineStart = lineStart + width;
    }
  }

  return {
    text: segment,
    nextStart: start + 1
  };
}

/**
 * Wrap a meeting summary onto a Stream Deck key, breaking on word boundaries.
 *
 * Overflow is marked with an ellipsis on the final line so a truncated title
 * is visibly truncated rather than silently misleading.
 *
 * @param text - Meeting summary
 * @param width - Characters per line
 * @param maxLines - Maximum number of lines
 */
export function wrapSummary(text: string, width = 11, maxLines = 2): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    // A single word longer than the line is hard-split rather than dropped.
    let pending = word;
    while (pending.length > width) {
      if (current) {
        lines.push(current);
        current = '';
      }
      if (lines.length >= maxLines) break;
      lines.push(pending.slice(0, width));
      pending = pending.slice(width);
    }
    if (lines.length >= maxLines) break;

    const candidate = current ? `${current} ${pending}` : pending;
    if (candidate.length <= width) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = pending;
    }
    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  const consumed = lines.join(' ').replace(/\s+/g, ' ').trim();
  const whole = words.join(' ');
  if (consumed.length < whole.length) {
    const last = lines[maxLines - 1] ?? '';
    lines[maxLines - 1] = `${last.slice(0, Math.max(0, width - 1))}…`;
  }

  return lines.slice(0, maxLines).join('\n');
}

/**
 * Build the Stream Deck key label for an upcoming meeting: when it starts,
 * then what it is.
 *
 * @param event - The upcoming event
 * @param now - Reference instant, defaults to the current time
 */
export function formatNextMeetingLabel(event: CalendarEvent, now: Date = new Date()): string {
  const when = formatMeetingWhen(event.start, now);
  const what = wrapSummary(event.summary ?? '');

  return what ? `${when}\n${what}` : when;
}

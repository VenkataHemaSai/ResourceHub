import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * Formats a UTC ISO string into a display string based on the organization's timezone.
 */
export function formatOrgDate(isoString, timeZone, formatStr = 'PPP') {
  if (!isoString) return '';
  return formatInTimeZone(new Date(isoString), timeZone, formatStr);
}

/**
 * Converts a local date/time in the org timezone back to a UTC ISO string for the API.
 */
export function toOrgUtcIso(dateObj, timeZone) {
  // Treats the passed Date as if it was already in the org timezone
  const zoned = fromZonedTime(dateObj, timeZone);
  return zoned.toISOString();
}

/**
 * Get the start and end of the week for a given date, strictly in the org's timezone.
 */
export function getOrgWeekRange(isoString, timeZone) {
  const zonedDate = toZonedTime(new Date(isoString), timeZone);
  const start = startOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(zonedDate, { weekStartsOn: 1 });
  
  return {
    start: fromZonedTime(start, timeZone).toISOString(),
    end: fromZonedTime(end, timeZone).toISOString()
  };
}
